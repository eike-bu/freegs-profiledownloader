# Building from Source

This guide covers building FreeGS Profile Downloader from source for distribution.

## Prerequisites

See [DEVELOPMENT.md](DEVELOPMENT.md) for tool requirements and system dependencies.

## Build for Current Platform

```bash
git clone https://github.com/freegs/freegs-app.git
cd freegs-app
npm install
npm run tauri build
```

### Build Output

| Platform | Bundle Formats | Location |
|----------|---------------|----------|
| **Windows x64** | `.msi`, `.exe` (NSIS) | `src-tauri/target/release/bundle/msi/` |
| **Linux x64** | `.deb`, `.AppImage` | `src-tauri/target/release/bundle/` |
| **macOS (arm64/x64)** | `.dmg` | `src-tauri/target/release/bundle/dmg/` |

## Tauri Configuration

Key build settings in `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "windows": {
      "wix": null,
      "nsis": null
    },
    "linux": {
      "deb": { "depends": [] },
      "appimage": null
    }
  }
}
```

## CI/CD with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/build.yml`) that:

1. Builds the app on Ubuntu (for Linux builds) and Windows
2. Packages the binaries
3. Uploads artifacts

### Cross-Compilation Notes

- **Windows**: Cross-compilation from Linux is not supported. Build on a Windows runner.
- **Linux**: AppImage builds require `fuse` and `libfuse2` on the build system.
- **macOS**: Requires a macOS runner with Xcode installed.

## Versioning

The project follows [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes to the profile index format or repository structure
- **Minor**: New features (new views, profile management, etc.)
- **Patch**: Bug fixes, UI improvements, documentation updates

Version is defined in two places:
1. `src-tauri/Cargo.toml` — Rust package version
2. `src-tauri/tauri.conf.json` — App display version

## Creating a Release

1. Update version in `Cargo.toml` and `tauri.conf.json`
2. Update the `CHANGELOG.md`
3. Push and tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. GitHub Actions builds and creates a draft release
5. Publish the release with release notes