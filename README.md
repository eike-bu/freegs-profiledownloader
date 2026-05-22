# FreeGS Profile Downloader

**Automatically download and install GSX profiles for Microsoft Flight Simulator (2020/2024).**

FreeGS Profile Downloader scans your MSFS Community folder, detects installed scenery addons, matches them against a community-maintained repository of GSX profiles, and installs the correct `.ini` and `.py` files — all with a single click.

## Features

- 🔍 **Addon Scanner** — Scans your MSFS Community folder and detects installed scenery addons with ICAO codes
- 📦 **Profile Repository** — Browse and search community-contributed GSX profiles organized by region and scenery developer
- ⚡ **One-Click Install** — Download and install profiles directly to your GSX profiles directory
- 🌍 **Regional Organization** — Profiles organized by world region (Europe, North America, Asia, etc.)
- 🛩️ **Multi-Scenery Support** — Multiple profiles per ICAO for different scenery developers (e.g., EDDF for MK Studios, Aerosoft, and default)
- 🖤 **Modern Dark UI** — Clean, dark-themed interface inspired by FlyByWire and Fenix installers
- 🐧 **Cross-Platform** — Windows (.exe) and Linux (AppImage) builds

## Getting Started

### Download

Download the latest release from the [Releases](https://github.com/freegs/freegs-app/releases) page:

- **Windows**: `FreeGS-Profile-Downloader_x64.msi` or `FreeGS-Profile-Downloader_x64-setup.exe`
- **Linux**: `FreeGS-Profile-Downloader_x86_64.AppImage`

### Usage

1. Launch FreeGS Profile Downloader
2. Navigate to the **Scanner** tab
3. Enter the path to your MSFS Community folder (or use the folder browser)
4. Click **Scan** — all installed scenery addons with detected ICAO codes will be listed
5. Switch to the **Available Profiles** tab to browse community profiles
6. Click **Install** on any profile to download and install it automatically

Profiles are installed to: `%AppData%\Virtuali\GSX\MSFS`

## Project Structure

```
freegs-app/               # Desktop application (Tauri 2.0 + React)
├── src/                  # Frontend (React + TypeScript + Tailwind)
│   ├── components/       # UI components
│   ├── types/            # TypeScript type definitions
│   └── lib/              # Utility modules
├── src-tauri/            # Backend (Rust)
│   └── src/
│       └── commands.rs   # Tauri commands (scan, download, install)
├── docs/                 # Documentation
└── public/               # Static assets

freegs-profiles/          # Profile repository
├── index.json            # Profile index (consumed by the app)
├── europe/               # European airports
├── north-america/        # North American airports
├── asia/                 # Asian airports
├── africa/               # African airports
├── oceania/              # Oceanian airports
└── south-america/        # South American airports
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Framework** | Tauri 2.0 |
| **Frontend** | React 19 + TypeScript |
| **Styling** | Tailwind CSS 3 |
| **Icons** | Lucide React |
| **Backend** | Rust (Tauri Commands) |
| **HTTP Client** | reqwest |
| **Archive** | zip crate |
| **Build** | Vite 6 |

## Contributing Profiles

See the [Profiles Repository Documentation](docs/REPOSITORY.md) for details on:

- Structure of the profile repository
- How to submit your own GSX profiles
- Profile naming conventions

## Development

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup instructions and [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the code architecture.

## License

MIT — see [LICENSE](LICENSE)

## Disclaimer

FreeGS is an independent community project and is not affiliated with FSDreamTeam (developer of GSX). GSX (Ground Service X) is a commercial product of FSDreamTeam. This tool requires GSX Pro to be installed and licensed.