# Architecture

This document describes the architecture of the FreeGS Profile Downloader.

## Overview

The application follows a hybrid architecture with a Rust backend (Tauri) and a React/TypeScript frontend. The two layers communicate through Tauri's IPC bridge using typed invoke commands.

```
┌─────────────────────────────────────────┐
│            Frontend (React)             │
│                                         │
│  ScannerView  ProfileListView  Settings │
│       ↕ invoke ↕ invoke ↕ invoke       │
├─────────────────────────────────────────┤
│            Tauri IPC Bridge             │
├─────────────────────────────────────────┤
│            Backend (Rust)               │
│                                         │
│  scan_community_folder()               │
│  fetch_profile_index()                 │
│  download_profile()                    │
│  install_profile()                     │
│  get_installed_profiles()              │
│  get_settings() / save_settings()      │
└─────────────────────────────────────────┘
```

## Backend (Rust)

### Entry Point

- `src-tauri/src/main.rs` — Application entry point, calls `freegs_app_lib::run()`
- `src-tauri/src/lib.rs` — Initializes Tauri, registers plugins and command handlers
- `src-tauri/src/commands.rs` — All Tauri commands implementing the business logic

### Commands

| Command | Description |
|---------|-------------|
| `scan_community_folder(path)` | Reads a directory, identifies subfolders, extracts ICAO codes from folder names |
| `get_installed_profiles()` | Lists `.ini` files in the GSX profiles directory |
| `fetch_profile_index(url)` | Downloads and parses the remote `index.json` from the profiles repository |
| `download_profile(url)` | Downloads a profile archive (zip) as raw bytes |
| `install_profile(profile_zip)` | Extracts a zip archive into the GSX profiles directory |
| `get_settings()` | Returns saved settings from disk |
| `save_settings(settings)` | Persists settings to a JSON file |

### Profile Directory

GSX profiles are stored at:
- **Windows**: `%AppData%\Virtuali\GSX\MSFS`
- The app uses `dirs::data_dir()` to locate this cross-platform

### ICAO Detection

The `guess_icao()` function uses regex to extract 4-letter ICAO codes from folder names. It normalizes to uppercase and validates the pattern.

## Frontend (React)

### Component Tree

```
App
├── Header              — App title bar
├── Sidebar              — Navigation (Scanner, Profiles, Installed, Settings, About)
└── Main Content Area
    ├── ScannerView      — Community folder scanner
    ├── ProfileListView  — Browse/download profiles from repository
    ├── InstalledView    — List installed profiles
    ├── SettingsView     — App configuration
    └── AboutView        — Credits and information
```

### State Management

The app uses React's built-in `useState` and `useEffect` hooks. No external state management library is needed for the current complexity level.

### Type Definitions

All shared types are defined in `src/types/index.ts` and mirror the Rust backend's serializable structs.

## Communication Flow

1. Frontend calls `invoke("command_name", { params })`
2. Tauri serializes the arguments and passes them to the Rust handler
3. Rust executes the command (file I/O, HTTP requests, etc.)
4. Result is serialized back to JSON and returned to the frontend
5. Frontend updates the UI based on the result

## Security

- The application uses only local file system access (community folder scan, GSX profile installation)
- HTTP requests go only to the user-configured profile repository URL (default: GitHub raw content)
- No telemetry, analytics, or network services run in the background
- Zip extraction is protected against path traversal attacks