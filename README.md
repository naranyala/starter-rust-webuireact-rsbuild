# Rust WebUI React Rsbuild Application

A full-stack desktop application combining Rust backend with React frontend using WebUI for native desktop window integration. The architecture follows Model-View-ViewModel (MVVM) pattern with comprehensive error handling, real-time WebSocket communication, and SQLite database integration.

## Table of Contents

### Core Documentation

1. [Getting Started](./docs/01-getting-started.md)
   - Prerequisites
   - Installation
   - Quick Start
   - Build Options
   - Configuration
   - Troubleshooting

2. [Architecture](./docs/02-architecture.md)
   - System Overview
   - Backend Architecture
   - Frontend Architecture
   - Communication Patterns
   - Design Decisions

3. [Development Guide](./docs/03-development.md)
   - Environment Setup
   - Development Workflow
   - Code Standards
   - Common Tasks
   - Testing Strategy
   - Debugging

4. [API Reference](./docs/04-api-reference.md)
   - Backend API
   - Frontend API
   - WebSocket Protocol
   - Event System
   - Error Handling

5. [Deployment](./docs/05-deployment.md)
   - Production Build
   - Distribution
   - Platform-Specific Builds
   - Docker Deployment
   - Monitoring

### Additional Documentation

- [Architecture Patterns](./ARCHITECTURE.md) - Core + Plugin-Driven Architecture with MVVM
- [Plugin Development Guide](./PLUGIN_GUIDE.md) - Creating and registering plugins
- [Testing Guide](./TESTING.md) - Comprehensive testing strategy
- [Architecture Critique](./ARCHITECTURE_CRITIQUE.md) - Architecture analysis and remediation
- [Errors as Values Guide](./ERRORS_AS_VALUES_GUIDE.md) - Error handling pattern
- [Build Resolution](./BUILD_RESOLUTION.md) - Build troubleshooting
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Implementation status

## Features

- **MVVM Architecture**: Clean separation of concerns across backend and frontend
- **Plugin System**: Extensible plugin architecture for modular functionality
- **Real-time Communication**: WebSocket-based bidirectional communication
- **SQLite Database**: Embedded database with sample data management
- **Comprehensive Logging**: Structured logging with error tracking
- **Developer Tools**: Built-in devtools panel for debugging and monitoring
- **Error Handling**: "Errors as Values" pattern with rich context
- **Cross-Platform**: Build for Linux, macOS, and Windows

## Quick Start

```bash
# Clone and build
git clone <repository-url>
cd starter-rust-webuireact-rsbuild
./run.sh
```

## Project Structure

```
starter-rust-webuireact-rsbuild/
├── src/
│   ├── main.rs                 # Application entry point
│   ├── mod.rs                  # Root module declarations
│   ├── core/                   # Domain layer (entities, repositories, services)
│   ├── model/                  # Model layer (configuration, database)
│   ├── viewmodel/              # ViewModel layer (handlers, WebSocket)
│   ├── infrastructure/         # Infrastructure (event bus, logging, serialization)
│   ├── presentation/           # Presentation layer (devtools API)
│   ├── plugins/                # Plugin system
│   ├── error_handling/         # Error handling utilities
│   └── tests/                  # Test suite
│
├── frontend/
│   ├── src/
│   │   ├── views/              # React components
│   │   ├── view-models/        # ViewModels (communication bridge)
│   │   ├── models/             # Data models and event bus
│   │   ├── services/           # Services (error logger, window manager)
│   │   ├── core/               # Core utilities
│   │   └── plugins/            # Frontend plugins
│   ├── package.json
│   ├── tsconfig.json
│   └── biome.json              # Linting and formatting config
│
├── docs/                       # Documentation
├── app.config.toml             # Application configuration
├── Cargo.toml                  # Rust dependencies
├── run.sh                      # Build and run script
└── README.md                   # This file
```

## Technology Stack

### Backend
- **Language**: Rust 2021 Edition
- **UI Framework**: webui-rs (WebUI 2.5.0)
- **Database**: SQLite with rusqlite
- **Logging**: tracing, tracing-subscriber
- **Serialization**: serde, serde_json
- **Async Runtime**: tokio
- **WebSocket**: tokio-tungstenite

### Frontend
- **Language**: TypeScript 5.x
- **Framework**: React 18
- **Build Tool**: Rsbuild (Rspack-based)
- **Linting**: Biome
- **Testing**: Bun Test
- **Window Management**: WinBox.js

## Build Commands

```bash
# Build and run
./run.sh

# Build only
./run.sh --build

# Build frontend only
./run.sh --build-frontend

# Build Rust only
./run.sh --build-rust

# Release build
./run.sh --release

# Clean and rebuild
./run.sh --rebuild

# Clean artifacts
./run.sh --clean
```

## Testing

```bash
# Backend tests
cargo test

# Frontend tests
cd frontend && bun test

# All tests
cargo test && cd frontend && bun test
```

## Development Server

```bash
# Terminal 1: Backend
cargo watch -x run

# Terminal 2: Frontend
cd frontend && bun run dev
```

## Configuration

Edit `app.config.toml`:

```toml
[app]
name = "Rust WebUI SQLite Demo"
version = "1.0.0"

[database]
path = "app.db"
create_sample_data = true

[window]
title = "Rust WebUI Application"
width = 1200
height = 800

[logging]
level = "info"
file = "application.log"
```

## Ports

| Service | Port | Protocol |
|---------|------|----------|
| HTTP Server | 8080 | HTTP |
| WebSocket Server | 9000 | WebSocket |

## Developer Tools

The application includes a built-in DevTools panel accessible at the bottom of the window:

- **Status Tab**: System overview and quick metrics
- **Metrics Tab**: Detailed system metrics (uptime, memory, connections)
- **Events Tab**: Real-time event stream
- **Errors Tab**: Error logs with filtering
- **Console Tab**: JavaScript expression evaluator
- **Config Tab**: Application configuration
- **Debug Tab**: Testing utilities

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests: `cargo test && cd frontend && bun test`
5. Submit pull request

## Support

- Documentation: See `docs/` directory
- Issues: GitHub Issues
- Architecture: See `ARCHITECTURE.md`
