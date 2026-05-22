pub mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_community_folder,
            get_installed_profiles,
            fetch_profile_index,
            download_profile,
            install_profile,
            get_settings,
            save_settings,
            get_server_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running FreeGS Profile Downloader");
}