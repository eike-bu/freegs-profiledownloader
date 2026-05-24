use std::path::PathBuf;
use std::fs;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use regex_lite::Regex;

// Data types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneryAddon {
    pub name: String,
    pub path: String,
    pub icao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileEntry {
    pub icao: String,
    pub region: String,
    pub developer: String,
    pub scenery_name: String,
    pub profile_author: String,
    pub source_type: Option<String>,
    pub source_url: Option<String>,
    pub source_name: Option<String>,
    pub files: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledProfile {
    pub icao: String,
    pub developer: String,
    pub ini_path: String,
    pub py_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default)]
    pub community_folder_path: Option<String>,
    #[serde(default)]
    pub community_folder_path_2024: Option<String>,
    #[serde(default = "default_repo_url")]
    pub profiles_repo_url: String,
    #[serde(default = "default_base_url")]
    pub profiles_base_url: String,
    #[serde(default = "default_auto_install")]
    pub auto_install: bool,
}

fn default_repo_url() -> String {
    "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main/index.json".to_string()
}
fn default_base_url() -> String {
    "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main".to_string()
}
fn default_auto_install() -> bool { true }

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            community_folder_path: None,
            community_folder_path_2024: None,
            profiles_repo_url: "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main/index.json".into(),
            profiles_base_url: "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main".into(),
            auto_install: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadResult {
    pub icao: String,
    pub installed_files: Vec<String>,
    pub verified: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitEntry {
    pub author: String,
    pub date: String,
    pub message: String,
    pub hash: String,
}

// ── Centralized version ──
pub const APP_VERSION: &str = "0.2.3-beta";
pub const APP_NAME: &str = "FreeGS - Profile Downloader";

// Tauri commands

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
        if !ft.is_dir() { continue; }
        let name = entry.file_name().to_string_lossy().to_string();
        let icao = guess_icao(&name);
        addons.push(SceneryAddon { name, path: entry.path().to_string_lossy().to_string(), icao });
    }
    Ok(addons)
}

fn guess_icao(folder_name: &str) -> Option<String> {
    let upper = folder_name.to_uppercase();
    let re = Regex::new(r"\b([A-Z]{4})\b").ok()?;
    let caps = re.captures(&upper)?;
    let icao = caps.get(1)?.as_str().to_string();
    if icao.len() == 4 && icao.starts_with(|c: char| c.is_ascii_alphabetic()) {
        Some(icao)
    } else {
        None
    }
}

#[tauri::command]
pub fn get_installed_profiles() -> Result<Vec<InstalledProfile>, String> {
    let gsx_dir = get_gsx_profiles_dir()?;
    if !gsx_dir.exists() { return Ok(Vec::new()); }
    let mut profiles: Vec<InstalledProfile> = Vec::new();
    let entries = fs::read_dir(&gsx_dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map_or(true, |ext| ext != "ini") { continue; }
        let ini_path = path.clone();
        let py_path = path.with_extension("py");
        let py_path = if py_path.exists() { Some(py_path.to_string_lossy().to_string()) } else { None };
        let filename = path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
        let icao = filename.chars().take(4).collect::<String>().to_uppercase();
        profiles.push(InstalledProfile {
            icao, developer: "unknown".to_string(),
            ini_path: ini_path.to_string_lossy().to_string(), py_path,
        });
    }
    Ok(profiles)
}

#[tauri::command]
pub async fn fetch_profile_index(url: String) -> Result<Vec<ProfileEntry>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build().map_err(|e| format!("Failed to create HTTP client: {e}"))?;
    let resp = client.get(&url).send().await.map_err(|e| format!("Connection failed: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("Server returned {}", resp.status()));
    }
    let entries: Vec<ProfileEntry> = resp.json().await.map_err(|e| format!("Failed to parse profile index: {e}"))?;
    Ok(entries)
}

#[tauri::command]
pub async fn download_profile(profile: ProfileEntry, base_url: String) -> Result<DownloadResult, String> {
    let gsx_dir = get_gsx_profiles_dir()?;
    fs::create_dir_all(&gsx_dir).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build().map_err(|e| format!("Failed to create HTTP client: {e}"))?;
    let mut installed_files: Vec<String> = Vec::new();
    let mut all_verified = true;
    for (filename, expected_hash) in &profile.files {
        let file_url = format!("{}/{}/{}/{}/{}", base_url.trim_end_matches('/'), profile.region, profile.icao, profile.developer, filename);
        let resp = client.get(&file_url).send().await.map_err(|e| format!("Failed to download {filename}: {e}"))?;
        if !resp.status().is_success() {
            return Err(format!("Download of {filename} returned {}", resp.status()));
        }
        let bytes = resp.bytes().await.map_err(|e| format!("Failed to read {filename}: {e}"))?.to_vec();
        use sha2::{Sha256, Digest};
        let actual_hash = hex::encode(Sha256::digest(&bytes));
        if !expected_hash.is_empty() && actual_hash != *expected_hash {
            all_verified = false;
        }
        let out_path = gsx_dir.join(filename);
        fs::write(&out_path, &bytes).map_err(|e| e.to_string())?;
        installed_files.push(out_path.to_string_lossy().to_string());
    }
    let verified = all_verified && !profile.files.is_empty();
    let message = if verified {
        format!("✅ {} files installed and verified", installed_files.len())
    } else if !verified && !profile.files.is_empty() {
        format!("⚠️ Files installed but SHA256 mismatch")
    } else {
        format!("Installed {} file(s)", installed_files.len())
    };
    Ok(DownloadResult { icao: profile.icao.clone(), installed_files, verified, message })
}

#[tauri::command]
pub fn get_settings() -> AppSettings {
    let path = get_settings_path();
    let mut settings = if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppSettings::default()
    };
    settings.profiles_repo_url = default_repo_url();
    settings.profiles_base_url = default_base_url();
    settings
}

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

#[tauri::command]
pub fn get_server_info() -> serde_json::Value {
    serde_json::json!({
        "version": APP_VERSION,
        "name": APP_NAME,
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    })
}

/// Fetches the commit history for a specific profile's files from the Forgejo API
#[tauri::command]
pub async fn get_profile_commits(icao: String, developer: String, region: String) -> Result<Vec<CommitEntry>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build().map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    // The profiles repo API endpoint on Forgejo
    let repo_api = "http://10.8.0.1/api/v1/repos/freegs/freegs-profiles";
    let dir_path = format!("{}/{}/{}", region, icao, developer);

    // Fetch commits for the directory
    let url = format!("{}/commits?path={}&sha=main&limit=20", repo_api, dir_path);
    let resp = client.get(&url).send().await.map_err(|e| format!("API request failed: {e}"))?;

    if !resp.status().is_success() {
        // Fallback: return empty
        return Ok(Vec::new());
    }

    let body: serde_json::Value = resp.json().await.map_err(|e| format!("Failed to parse commits: {e}"))?;

    let entries = body.as_array().ok_or("Expected array")?;
    let commits: Vec<CommitEntry> = entries.iter().map(|c| {
        CommitEntry {
            author: c["commit"]["author"]["name"].as_str().unwrap_or("unknown").to_string(),
            date: c["commit"]["author"]["date"].as_str().unwrap_or("").to_string(),
            message: c["commit"]["message"].as_str().unwrap_or("").to_string(),
            hash: c["sha"].as_str().unwrap_or("").to_string(),
        }
    }).collect();

    Ok(commits)
}

// ── Helpers ──

fn get_gsx_profiles_dir() -> Result<PathBuf, String> {
    let base = dirs::data_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("AppData").join("Roaming")))
        .ok_or_else(|| "Could not determine app data directory".to_string())?;
    Ok(base.join("Virtuali").join("GSX").join("MSFS"))
}

fn get_settings_path() -> PathBuf {
    let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    config_dir.join("freegs").join("settings.json")
}