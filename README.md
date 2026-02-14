# Rust WebUI React Rsbuild Application

A modern, production-ready desktop application starter kit that combines the raw performance of Rust with the rich ecosystem of React for building cross-platform desktop applications. This starter provides a complete foundation for developers who demand both type safety and rapid UI development.

## Overview

This project leverages WebUI to render web content using the operating system's native webview while maintaining direct communication with Rust backend logic. The architecture cleanly separates concerns: Rust handles system integration, data persistence, and business logic, while React manages the user interface through familiar component-based patterns.

## Project Structure

```
starter-rust-webuireact-rsbuild/
├── Cargo.toml                    # Rust package configuration
├── Cargo.lock                    # Rust dependency lock file
├── app.config.toml               # Runtime configuration file
├── app.db                        # SQLite database file (runtime)
├── app.db-shm                    # SQLite shared memory file (runtime)
├── app.db-wal                    # SQLite write-ahead log file (runtime)
├── index.html                    # Root HTML file
├── run.sh                        # Development workflow script
├── build-dist.sh                 # Distribution packaging script
├── build-frontend.js             # Frontend build automation
├── build-frontend-inline.js      # Frontend inline build automation
├── build.rs                      # Build script for native dependencies
├── post-build.sh                 # Post-build script
├── .gitignore                    # Git ignore rules
├── src/                          # Rust backend source code
│   ├── main.rs                   # Application entry point
│   ├── core.rs                   # Core infrastructure (config, logging, database)
│   ├── handlers.rs               # WebUI event handlers
│   ├── websocket_handler.rs      # WebSocket communication handler
│   └── event_bus/                # Event bus implementation
│       └── mod.rs                # Event bus module
├── frontend/                     # React frontend application
│   ├── package.json              # Node.js dependencies
│   ├── bun.lock                  # Bun dependency lock file
│   ├── tsconfig.json             # TypeScript configuration
│   ├── biome.json                # Biome formatter/linter configuration
│   ├── index.html                # Frontend entry HTML file
│   ├── rsbuild.config.ts         # Production bundler configuration
│   ├── rsbuild.config.dev.ts     # Development bundler configuration
│   ├── rsbuild.config.inline.ts  # Inline asset bundler configuration
│   ├── rspack.config.dev.ts      # Alternative dev bundler config
│   ├── rspack.config.inline.ts   # Alternative inline bundler config
│   ├── build-logger.js           # Build logging utility
│   └── src/                      # Frontend source code
│       └── ...                   # React components and utilities
├── static/                       # Compiled frontend assets (generated)
├── thirdparty/                   # Third-party dependencies
│   └── webui-c-src/              # WebUI C source code
└── README.md                     # This documentation
```

## Key Technologies

- **Rust**: High-performance systems programming with memory safety
- **WebUI**: Framework for creating desktop applications with web technologies
- **React**: Component-based UI library for building user interfaces
- **Rsbuild**: High-performance JavaScript bundler for React applications
- **SQLite**: Embedded database engine for data persistence
- **Tokio**: Asynchronous runtime for Rust
- **WebSocket**: Real-time bidirectional communication
- **Tracing**: Structured logging and diagnostics

## Features

- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Self-Contained**: Single executable with embedded web server
- **Modern UI**: React-based interface with hot reloading during development
- **Real-Time Communication**: WebSocket support for live updates
- **Event-Driven Architecture**: Clean separation between UI and business logic
- **Configuration Management**: TOML-based configuration system
- **Structured Logging**: Comprehensive application logging with tracing
- **Database Integration**: Built-in SQLite support with automatic schema management

## Backend Architecture

The Rust backend is organized into several key modules:

- **main.rs**: Application entry point and initialization
- **core.rs**: Core infrastructure components (configuration, logging, database)
- **handlers.rs**: WebUI event handlers for frontend communication
- **websocket_handler.rs**: WebSocket communication management
- **event_bus/**: Event-driven communication system

### Core Infrastructure

The application uses a robust infrastructure layer that includes:

- **Configuration**: TOML-based configuration with fallback mechanisms
- **Logging**: Structured logging using the `tracing` crate
- **Database**: SQLite integration with automatic schema creation
- **Event Handling**: Asynchronous event processing with proper error handling

### Communication Layer

The application implements multiple communication patterns:
- WebUI function binding for synchronous operations
- WebSocket connections for real-time bidirectional communication
- Event bus for internal component communication

## Frontend Architecture

The React frontend uses modern development practices:

- **Rsbuild**: High-performance bundler optimized for React
- **TypeScript**: Type-safe development experience
- **Component-Based**: Modular UI architecture
- **State Management**: React hooks for state management
- **Asset Optimization**: Automatic optimization of images and resources

## Build System

The project includes a comprehensive build system with multiple scripts:

- **run.sh**: Master build and run script with detailed logging
- **build-dist.sh**: Cross-platform distribution builder
- **build-frontend.js**: Frontend build automation
- **build.rs**: Rust build script for native dependencies
- **post-build.sh**: Post-build processing steps

### Build Commands

```bash
# Build and run the application (default)
./run.sh

# Build only (frontend + Rust)
./run.sh --build

# Build frontend only
./run.sh --build-frontend

# Build Rust only
./run.sh --build-rust

# Build release version
./run.sh --release

# Run the application (requires build)
./run.sh --run

# Clean all build artifacts
./run.sh --clean

# Clean and rebuild everything
./run.sh --rebuild
```

### Distribution Building

```bash
# Build release package for current platform
./build-dist.sh build-release

# Build debug package
./build-dist.sh build-debug

# Verify self-contained package
./build-dist.sh verify

# Clean distribution directory
./build-dist.sh clean
```

## Configuration

The application uses `app.config.toml` for configuration:

```toml
[app]
name = "Rust WebUI SQLite Demo"
version = "1.0.0"
description = "A Rust WebUI application with SQLite integration"

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

## Development Setup

1. Install Rust from https://rustup.rs/
2. Install Bun from https://bun.sh/
3. Clone the repository
4. Run `./run.sh` to build and start the application

## Dependencies

### Rust Dependencies (from Cargo.toml)
- webui-rs: WebUI bindings for Rust
- tokio: Asynchronous runtime
- rusqlite: SQLite bindings with bundled implementation
- serde/serde_json: Serialization/deserialization
- tracing: Structured logging
- chrono: Date/time handling
- uuid: UUID generation
- tungstenite/tokio-tungstenite: WebSocket implementation
- tiny_http: Embedded HTTP server
- mime_guess: MIME type detection

### Frontend Dependencies (from package.json)
- React and ReactDOM
- Rsbuild for bundling
- TypeScript for type safety
- Biome for formatting and linting

## Deployment

The application can be packaged into self-contained executables for distribution:

1. Run `./build-dist.sh build-release` to create a release package
2. The package will be created in the `dist/` directory
3. Distribute the archive to end users
4. Users can run the application without installing additional dependencies

## Potential Improvements

This starter kit provides a solid foundation, but there are several areas where it could be enhanced:

### Performance Optimizations
- Implement database connection pooling for high-concurrency scenarios
- Add caching layers for frequently accessed data
- Optimize frontend bundle size with code splitting and lazy loading
- Implement request debouncing/throttling for frequent UI updates

### Security Enhancements
- Add input validation and sanitization for all WebUI function parameters
- Implement secure communication protocols for sensitive data
- Add authentication and authorization mechanisms
- Sanitize user-generated content to prevent XSS attacks

### Developer Experience
- Add comprehensive unit and integration tests
- Implement automated code formatting and linting workflows
- Add documentation generation tools
- Create CLI tools for common development tasks
- Implement hot-reloading for Rust backend changes

### Feature Extensions
- Add plugin architecture for extending functionality
- Implement internationalization (i18n) support
- Add theming capabilities beyond the current dark mode
- Integrate with cloud storage providers
- Add offline-first capabilities with local sync

### Monitoring and Observability
- Add application metrics collection
- Implement distributed tracing for complex operations
- Add health check endpoints
- Create dashboards for monitoring application performance
- Add alerting for critical system events

### Cross-Platform Enhancements
- Add native installer generation for different platforms
- Implement platform-specific UI guidelines
- Add accessibility features (screen readers, keyboard navigation)
- Create platform-specific packaging (AppImage, DMG, MSI)
- Add auto-update functionality

### Testing and Quality Assurance
- Add end-to-end testing with simulated user interactions
- Implement property-based testing for critical algorithms
- Add performance benchmarking
- Create mock services for isolated testing
- Add mutation testing to verify test quality

## License

This project is available under the terms of the MIT License, which permits unrestricted use, modification, and distribution of the software and its derivatives.