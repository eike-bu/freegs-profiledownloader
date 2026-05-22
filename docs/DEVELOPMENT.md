# Development Setup

This guide covers how to set up a development environment for FreeGS Profile Downloader.

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.75+ | Backend compilation |
| Node.js | 18+ | Frontend build tooling |
| npm | 9+ | Package management |
| Git | 2.x | Version control |

### System Dependencies (Linux)

On Linux, Tauri requires several system libraries:

```bash
# Debian/Ubuntu
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf \
  libssl-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

### System Dependencies (Windows)

On Windows, you need:

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (included in Windows 11)

## Setup

```bash
# Clone the repository
git clone https://github.com/freegs/freegs-app.git
cd freegs-app

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev
```

## Development Workflow

### Frontend-only Development

To work on the UI without the Tauri backend:

```bash
npm run dev
```

This starts Vite on `http://localhost:1420`. Note that Tauri commands (`invoke`) will not work — you'll need to mock them during frontend-only development.

### Full-stack Development

```bash
npm run tauri dev
```

This starts both the Vite dev server and the Tauri desktop window with hot-reload for both frontend and backend.

### Building for Production

```bash
npm run tauri build
```

This produces platform-specific binaries:
- **Windows**: `.msi` installer and `.exe` setup in `src-tauri/target/release/bundle/msi/`
- **Linux**: `.deb` package and `.AppImage` in `src-tauri/target/release/bundle/`

## Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run build` | Build frontend only |
| `npm run tauri dev` | Run full app in development mode |
| `npm run tauri build` | Build production binaries |

## Code Style

- **Frontend**: TypeScript with strict mode enabled
- **Backend**: Rust with `rustfmt` conventions
- All user-facing text must be in English

## Environment Variables

None required. All configuration is done through the app's settings UI and persisted to a JSON file.

## Testing

Currently the project does not have automated tests. To run Tauri commands manually during development:

```bash
# Start the app in dev mode
npm run tauri dev

# The Tauri devtools console will show Rust backend logs
```

## Common Issues

### "Failed to fetch profile index"

- Check your internet connection
- Verify the repository URL in Settings
- The default URL points to `raw.githubusercontent.com/freegs/freegs-profiles/main/index.json`

### "Community folder not found"

- Ensure the path points to the actual MSFS Community folder
- On Steam: `steamapps/common/Microsoft Flight Simulator 2024/Community`
- On MS Store: usually in the user's `AppData` folder

### Rust compilation errors

```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cargo clean
npm run tauri build
```