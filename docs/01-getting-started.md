# Getting Started

This guide provides complete setup and usage instructions for the Rust WebUI React Rsbuild application.

## Prerequisites

### Required Software

#### Rust Toolchain

Minimum version: 1.70

Installation:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup update
```

Verification:
```bash
rustc --version
cargo --version
```

#### Bun Runtime

Minimum version: 1.0

Installation:
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc
```

Verification:
```bash
bun --version
```

#### System Dependencies

Linux (Debian/Ubuntu):
```bash
sudo apt-get update
sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev \
    build-essential \
    pkg-config
```

Linux (Fedora):
```bash
sudo dnf install -y \
    webkit2gtk4.1-devel \
    gtk3-devel \
    libsoup3-devel \
    javascriptcoregtk-4.1-devel
```

macOS:
```bash
xcode-select --install
```

Windows:
- Install Visual Studio Build Tools with C++ workload
- Install WebView2 runtime

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd starter-rust-webuireact-rsbuild
```

### 2. Install Dependencies

```bash
# Rust dependencies
cargo fetch

# Frontend dependencies
cd frontend
bun install
cd ..
```

### 3. Verify Installation

```bash
# Check Rust compilation
cargo check

# Check frontend compilation
cd frontend
bun exec tsc --noEmit
cd ..
```

## Quick Start

### Build and Run

```bash
./run.sh
```

This script performs:
1. Prerequisites verification
2. Frontend dependency installation
3. Frontend production build
4. Rust debug build
5. Post-build configuration
6. Application launch

### First Run Experience

On first execution:
1. Configuration loaded from `app.config.toml`
2. Logging system initialized
3. SQLite database created at `app.db`
4. Sample data inserted (4 users)
5. WebSocket server started on port 9000
6. HTTP server started on port 8080
7. Application window opened

## Build Options

### Standard Builds

```bash
# Full build and run
./run.sh

# Build only (no run)
./run.sh --build

# Build frontend only
./run.sh --build-frontend

# Build Rust backend only
./run.sh --build-rust
```

### Release Builds

```bash
# Optimized release build
./run.sh --release

# Release with additional profiling
cargo build --release --profile=profiling
```

### Maintenance

```bash
# Clean all build artifacts
./run.sh --clean

# Clean and full rebuild
./run.sh --rebuild

# Run pre-built application
./run.sh --run
```

### Help

```bash
./run.sh --help
```

## Manual Build Commands

### Frontend

```bash
cd frontend

# Development mode with hot reload
bun run dev

# Production build
bun run build

# Type checking
bun exec tsc --noEmit

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:fix

# Testing
bun test
bun test:watch
bun test:coverage

# Clean build cache
bun run clean
```

### Backend

```bash
# Debug build
cargo build

# Release build
cargo build --release

# Run directly
cargo run

# Check without building
cargo check

# Run tests
cargo test
cargo test -- --nocapture

# Watch for changes (requires cargo-watch)
cargo watch -x run
cargo watch -x check

# Clean build artifacts
cargo clean

# Update dependencies
cargo update
```

## Configuration

### Configuration File

The application uses `app.config.toml` for runtime configuration:

```toml
[app]
name = "Rust WebUI SQLite Demo"
version = "1.0.0"
description = "A Rust WebUI application with SQLite integration"
author = "Developer"

[database]
path = "app.db"
create_sample_data = true

[window]
title = "Rust WebUI Application"
width = 1200
height = 800
min_width = 800
min_height = 600
resizable = true

[logging]
level = "info"
file = "application.log"
append = true
webui_verbose = false

[features]
dark_mode = true
show_tray_icon = false
```

### Configuration Options

#### Application Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | - | Application display name |
| version | string | 1.0.0 | Application version |
| description | string | - | Application description |
| author | string | - | Author information |

#### Database Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| path | string | app.db | SQLite database path |
| create_sample_data | boolean | true | Create sample data on first run |

#### Window Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| title | string | - | Window title |
| width | integer | 1200 | Initial window width |
| height | integer | 800 | Initial window height |
| min_width | integer | 800 | Minimum window width |
| min_height | integer | 600 | Minimum window height |
| resizable | boolean | true | Allow window resizing |

#### Logging Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| level | string | info | Log level (debug, info, warn, error) |
| file | string | application.log | Log file path |
| append | boolean | true | Append to existing log |
| webui_verbose | boolean | false | Verbose WebUI logging |

#### Feature Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| dark_mode | boolean | true | Enable dark mode |
| show_tray_icon | boolean | false | Show system tray icon |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| RUST_LOG | Override log level | info |
| APP_CONFIG | Custom config path | app.config.toml |
| BUILD_LOG_FILE | Build log output path | build.log |

## Troubleshooting

### Build Failures

#### Rust Compilation Errors

```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cargo clean
cargo build

# Check for missing system dependencies
ldd target/debug/rustwebui-app
```

#### Frontend Build Errors

```bash
# Clear node modules and cache
cd frontend
rm -rf node_modules
rm -rf .rsbuild
bun install
bun run build
```

#### Missing System Libraries

Linux error: `libwebkit2gtk-4.1.so not found`
```bash
sudo apt-get install libwebkit2gtk-4.1-dev
```

Linux error: `libgtk-3.so not found`
```bash
sudo apt-get install libgtk-3-dev
```

### Runtime Issues

#### Port Already in Use

Error: `Address already in use`

Solution:
```bash
# Check what is using the port
lsof -i :8080
lsof -i :9000

# Kill the process
kill -9 <PID>
```

#### Database Lock Issues

```bash
# Close application
# Remove lock files
rm app.db-shm app.db-wal

# Restart application
```

#### WebSocket Connection Failed

1. Verify backend is running
2. Check browser console for errors
3. Verify port 9000 is accessible
4. Check firewall settings

#### Application Window Not Opening

1. Check WebUI dependencies are installed
2. Verify display server is running
3. Check application logs for errors

### Log Analysis

```bash
# View application logs
tail -f application.log

# Search for errors
grep "ERROR" application.log

# Search by timestamp
grep "2024-" application.log
```

### Performance Issues

#### High Memory Usage

```bash
# Check memory usage
ps aux | grep rustwebui-app

# Enable debug logging to identify issues
# Set level = "debug" in app.config.toml
```

#### Slow Database Queries

```bash
# Enable SQLite query logging
# Check database size
sqlite3 app.db "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"

# Vacuum database
sqlite3 app.db "VACUUM;"
```

## Next Steps

After successful installation:

1. Read the [Architecture Guide](./02-architecture.md) to understand system design
2. Read the [Development Guide](./03-development.md) for development workflows
3. Read the [API Reference](./04-api-reference.md) for API documentation
4. Explore the [Testing Guide](../TESTING.md) for testing strategies

## Support Resources

- Issue Tracker: GitHub Issues
- Documentation: docs/ directory
- Architecture: ARCHITECTURE.md
- Testing: TESTING.md
