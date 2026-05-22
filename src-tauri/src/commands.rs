use std::path::PathBuf;
use std::fs;
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// Represents a single addon (scenery) found in the MSFS Community folder.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneryAddon {
    /// Display name (folder name).
    pub name: String,
    /// Full path to the addon folder.
    pub path: String,
    /// Whether this addon folder has a matching ICAO code we can scan for.
    pub icao: Option<String>,
}

/// A profile as listed in the remote repository index.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileEntry {
    /// ICAO code the profile is for (e.g. "EDDF").
    pub icao: String,
    /// Region (e.g. "europe", "north-america").
    pub region: String,
    /// Scenery developer / publisher (e.g. "mk-studios", "aerosoft").
    pub developer: String,
    /// Display name of the scenery.
    pub scenery_name: String,
    /// Creator of the GSX profile.
    pub profile_author: String,
    /// Download URL for the profile archive (zip of .ini + .py).
    pub download_url: String,
}

/// A profile that is already installed locally.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledProfile {
    pub icao: String,
    pub developer: String,
    pub ini_path: String,
    pub py_path: Option<String>,
}

/// Application settings persisted to disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub community_folder_path: Option<String>,
    pub profiles_repo_url: String,
    pub auto_install: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            community_folder_path: None,
            profiles_repo_url: String::from(
                "https://raw.githubusercontent.com/freegs/freegs-profiles/main/index.json"
            ),
            auto_install: true,
        }
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Scans the MSFS Community folder for installed scenery addons.
/// Attempts to guess the ICAO code from folder names (first 4 uppercase chars).
#[tauri::command]
pub fn scan_community_folder(path: String) -> Result<Vec<SceneryAddon>, String> {
    let folder = PathBuf::from(&path);
    if !folder.exists() || !folder.is_dir() {
        return Err(format!("Path does not exist or is not a directory: {path}"));
    }

    let mut addons: Vec<SceneryAddon> = Vec::new();

    for entry in fs::read_dir(&folder).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let ft = entry.file_type().map_err(|e| e.to_string())?;
        if !ft.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        let icao = guess_icao(&name);
        addons.push(SceneryAddon {
            name,
            path: entry.path().to_string_lossy().to_string(),
            icao,
        });
    }

    Ok(addons)
}

/// Tries to extract a 4-letter ICAO code from a scenery folder name.
/// Looks for patterns like "aerosoft-eddf", "EDDF_1", "mkstudios-eddl" etc.
fn guess_icao(folder_name: &str) -> Option<String> {
    // Common patterns: the folder often contains a 4-letter ICAO somewhere
    // e.g. "aerosoft-eddf-1.0.0", "EDDF_Scenery", "mk-studios-eddl"
    let upper = folder_name.to_uppercase();

    // Try to find a 4-letter sequence that matches ICAO pattern (E[A-Z][A-Z][A-Z] for Europe,
    // K[A-Z][A-Z][A-Z] for US, etc.)
    use regex_lite::Regex;
    let re = Regex::new(r"\b([A-Z]{4})\b").ok()?;
    let caps = re.captures(&upper)?;
    let icao = caps.get(1)?.as_str().to_string();

    // Basic validation: ICAO codes should start with a letter, be 4 chars
    if icao.len() == 4 && icao.starts_with(|c: char| c.is_ascii_alphabetic()) {
        Some(icao)
    } else {
        None
    }
}

/// Lists currently installed GSX profiles from the GSX profiles directory.
#[tauri::command]
pub fn get_installed_profiles() -> Result<Vec<InstalledProfile>, String> {
    let gsx_dir = get_gsx_profiles_dir()?;
    if !gsx_dir.exists() {
        return Ok(Vec::new());
    }

    let mut profiles: Vec<InstalledProfile> = Vec::new();
    let entries = fs::read_dir(&gsx_dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map_or(true, |ext| ext != "ini") {
            continue;
        }

        let ini_path = path.clone();
        let py_path = path.with_extension("py");
        let py_path = if py_path.exists() {
            Some(py_path.to_string_lossy().to_string())
        } else {
            None
        };

        let filename = path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();

        // Parse ICAO from filename (first 4 chars)
        let icao = filename.chars().take(4).collect::<String>().to_uppercase();
        let developer = "unknown"; // Could parse from filename pattern

        profiles.push(InstalledProfile {
            icao: icao.clone(),
            developer: developer.to_string(),
            ini_path: ini_path.to_string_lossy().to_string(),
            py_path,
        });
    }

    Ok(profiles)
}

/// Fetches the remote profile index from the FreeGS profiles repository.
#[tauri::command]
pub async fn fetch_profile_index(url: String) -> Result<Vec<ProfileEntry>, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch profile index: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Server returned {}", resp.status()));
    }

    let entries: Vec<ProfileEntry> = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse profile index: {e}"))?;

    Ok(entries)
}

/// Downloads a profile archive (zip of .ini + .py) from the given URL.
/// Returns the bytes of the downloaded archive.
#[tauri::command]
pub async fn download_profile(url: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Download failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Download returned {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?
        .to_vec();

    Ok(bytes)
}

/// Installs a downloaded profile archive into the GSX profiles directory.
/// The archive should contain .ini and .py files.
#[tauri::command]
pub fn install_profile(profile_zip: Vec<u8>) -> Result<String, String> {
    let gsx_dir = get_gsx_profiles_dir()?;
    fs::create_dir_all(&gsx_dir).map_err(|e| e.to_string())?;

    // Read the zip archive
    let cursor = std::io::Cursor::new(profile_zip);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| e.to_string())?;

    let mut installed_files: Vec<String> = Vec::new();

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = gsx_dir.join(file.name());

        // Prevent directory traversal
        let out_path = out_path.canonicalize().unwrap_or(out_path);
        if !out_path.starts_with(&gsx_dir) {
            continue;
        }

        if file.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = fs::File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            installed_files.push(out_path.to_string_lossy().to_string());
        }
    }

    Ok(format!(
        "Installed {} file(s) to {}",
        installed_files.len(),
        gsx_dir.to_string_lossy()
    ))
}

/// Returns the current settings.
#[tauri::command]
pub fn get_settings() -> AppSettings {
    let path = get_settings_path();
    if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

/// Saves settings to disk.
#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(())
}

/// Returns information about the running server (version, platform).
#[tauri::command]
pub fn get_server_info() -> serde_json::Value {
    serde_json::json!({
        "version": "0.1.0",
        "name": "FreeGS Profile Downloader",
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Returns the GSX profiles directory path.
fn get_gsx_profiles_dir() -> Result<PathBuf, String> {
    // On Windows: %AppData%\Virtuali\GSX\MSFS
    // On Linux/Wine: ~/.wine/... or the XDG equivalent
    // For now, use a configurable path via settings, default to the standard Windows path
    let base = dirs::data_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("AppData").join("Roaming")))
        .ok_or_else(|| "Could not determine app data directory".to_string())?;

    Ok(base.join("Virtuali").join("GSX").join("MSFS"))
}

/// Returns the path for the settings JSON file.
fn get_settings_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."));
    config_dir.join("freegs").join("settings.json")
}