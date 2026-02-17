# Getting Started

This guide helps you get started with the Rust WebUI React Rsbuild application.

## Prerequisites

Before building the project, ensure you have the following installed:

### Required Tools

- **Rust**: Version 1.70 or later
  - Install via rustup: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
  - Verify: `rustc --version`

- **Node.js**: Version 18 or later
  - Install from: https://nodejs.org/
  - Verify: `node --version`

- **Bun**: Version 1.0 or later (recommended) or npm
  - Install: `curl -fsSL https://bun.sh/install | bash`
  - Verify: `bun --version`

### Optional Tools

- **Git**: For version control
- **Cargo-watch**: For auto-rebuilding during development (`cargo install cargo-watch`)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd starter-rust-webuireact-rsbuild
```

### 2. Install Dependencies

```bash
# Install Rust dependencies
cargo fetch

# Install frontend dependencies
cd frontend
bun install
cd ..
```

### 3. Build and Run

```bash
# Build and run the application
./run.sh
```

This command will:
- Check prerequisites
- Install frontend dependencies
- Build the frontend
- Build the Rust backend
- Run the application

## Build Options

### Full Build and Run

```bash
./run.sh
```

### Build Only

```bash
./run.sh --build
```

### Build Frontend Only

```bash
./run.sh --build-frontend
```

### Build Rust Backend Only

```bash
./run.sh --build-rust
```

### Release Build

```bash
./run.sh --release
```

### Run Pre-built Binary

```bash
./run.sh --run
```

### Clean Build Artifacts

```bash
./run.sh --clean
```

### Clean and Rebuild

```bash
./run.sh --rebuild
```

## Manual Build Commands

### Frontend

```bash
cd frontend

# Development build
bun run dev

# Production build
bun run build

# Clean build
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

# Watch for changes (requires cargo-watch)
cargo watch -x run
```

## Configuration

The application uses `app.config.toml` for runtime configuration:

```toml
[app]
name = "Rust WebUI App"
version = "1.0.0"

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

[features]
dark_mode = true
show_tray_icon = false
```

### Configuration Options

#### App Section
- `name`: Application display name
- `version`: Application version

#### Database Section
- `path`: SQLite database file path (relative to executable or absolute)
- `create_sample_data`: Whether to create sample data on first run

#### Window Section
- `title`: Window title
- `width`: Initial window width
- `height`: Initial window height
- `min_width`: Minimum window width
- `min_height`: Minimum window height
- `resizable`: Whether window is resizable

#### Logging Section
- `level`: Log level (debug, info, warn, error)
- `file`: Log file name (empty to disable file logging)
- `append`: Append to existing log file or overwrite

#### Features Section
- `dark_mode`: Enable dark mode
- `show_tray_icon`: Show system tray icon

## First Run

On first run, the application will:

1. Load configuration from `app.config.toml`
2. Initialize the logging system
3. Create the SQLite database
4. Insert sample data (if enabled)
5. Start the WebSocket server on port 9000
6. Start the HTTP server on port 8080
7. Open the application window

## Troubleshooting

### Build Fails

1. Ensure all prerequisites are installed
2. Clean build artifacts: `./run.sh --clean`
3. Rebuild: `./run.sh --rebuild`

### Frontend Build Fails

1. Delete `node_modules`: `rm -rf frontend/node_modules`
2. Reinstall: `cd frontend && bun install`
3. Rebuild: `./run.sh --build-frontend`

### Backend Build Fails

1. Update Rust: `rustup update`
2. Clean: `cargo clean`
3. Rebuild: `cargo build`

### Application Won't Start

1. Check if ports 8080 and 9000 are available
2. Check logs in `application.log`
3. Run with debug logging: set `level = "debug"` in config

## Next Steps

- Read the [Architecture Guide](./architecture.md) to understand the project structure
- Read the [Development Guide](./development.md) for development workflows
- Read the [API Reference](./api-reference.md) for backend and frontend APIs
