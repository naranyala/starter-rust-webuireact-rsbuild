# Rust WebUI React Rsbuild Application

A full-stack desktop application combining Rust (backend) with React (frontend) using WebUI for the native desktop window. The architecture follows the Model-View-ViewModel (MVVM) pattern.

## Project Structure

```
starter-rust-webuireact-rsbuild/
|-- Cargo.toml                    # Rust package configuration
|-- Cargo.lock                    # Rust dependency lock file
|-- app.config.toml               # Runtime configuration
|-- app.db                        # SQLite database (runtime)
|-- build.rs                      # Rust build script
|-- run.sh                        # Development build/run script
|-- build-frontend.js             # Frontend build automation
|-- build-dist.sh                 # Distribution packaging
|-- post-build.sh                 # Post-build processing
|-- README.md                     # Documentation
|
|-- src/                          # Rust backend source
|   |-- main.rs                   # Application entry point & HTTP server
|   |-- mod.rs                    # Module declarations
|   |-- model/                    # Model layer
|   |   |-- mod.rs
|   |   |-- core.rs               # Config, logging, database
|   |
|   |-- viewmodel/                # ViewModel layer
|   |   |-- mod.rs
|   |   |-- handlers.rs           # WebUI event handlers
|   |   |-- websocket_handler.rs  # WebSocket server
|   |   |-- window_logger.rs      # Window state tracking
|   |
|   |-- infrastructure/           # Infrastructure layer
|       |-- mod.rs
|       |-- event_bus/
|           |-- mod.rs            # Event bus implementation
|
|-- frontend/                     # React frontend
|   |-- package.json              # Node.js dependencies
|   |-- tsconfig.json             # TypeScript configuration
|   |-- rsbuild.config.ts         # Production bundler config
|   |-- rsbuild.config.dev.ts    # Development bundler config
|   |-- rsbuild.config.inline.ts # Inline asset config
|   |
|   |-- src/                     # Frontend source
|       |-- views/                # View layer (React components)
|       |   |-- main.tsx          # Entry point
|       |   |-- App.tsx           # Main component
|       |   |-- components/
|       |   |   |-- ErrorBoundary.tsx
|       |
|       |-- view-models/         # ViewModel layer
|       |   |-- communication-bridge.ts
|       |
|       |-- models/              # Model layer
|       |   |-- event-bus.ts
|       |
|       |-- services/            # Services layer
|           |-- utils.js
|           |-- window-manager.ts
|           |-- index.ts
|           |-- utils/
|               |-- global-error-handler.ts
|
|-- static/                      # Compiled frontend assets
|-- thirdparty/                   # Third-party libraries
|   |-- webui-c-src/             # WebUI C source
|
|-- index.html                    # Root HTML
|-- webui_bridge_template.js     # WebUI bridge template
```

## Architecture

### Backend (Rust)

**Model Layer (`src/model/`)**
- `core.rs`: Configuration management, logging system initialization, SQLite database operations

**ViewModel Layer (`src/viewmodel/`)**
- `handlers.rs`: WebUI event handlers for frontend communication (database, system info, utilities)
- `websocket_handler.rs`: WebSocket server for real-time bidirectional communication
- `window_logger.rs`: Window state tracking and logging

**Infrastructure Layer (`src/infrastructure/`)**
- `event_bus/`: Event-driven communication system with publish-subscribe pattern

### Frontend (React + TypeScript)

**View Layer (`frontend/src/views/`)**
- React components for user interface

**ViewModel Layer (`frontend/src/view-models/`)**
- `communication-bridge.ts`: WebSocket connection management, message handling, reconnection logic

**Model Layer (`frontend/src/models/`)**
- `event-bus.ts`: Frontend event management

**Services Layer (`frontend/src/services/`)**
- Utility functions, window management, global error handling

## Key Technologies

- **Rust**: Systems programming language
- **WebUI**: Desktop window framework using native webview
- **React 18**: UI library
- **Rsbuild**: High-performance bundler
- **TypeScript**: Type safety
- **SQLite**: Embedded database (rusqlite)
- **Tokio**: Async runtime
- **WebSocket**: Real-time communication
- **Tracing**: Structured logging

## Features

- Cross-platform desktop application (Windows, macOS, Linux)
- Embedded HTTP server for serving frontend
- WebSocket server for real-time updates
- SQLite database with automatic schema
- Event-driven architecture
- Configuration via TOML
- Structured logging

## Build Commands

```bash
# Build and run (default)
./run.sh

# Build only
./run.sh --build

# Build frontend only
./run.sh --build-frontend

# Build Rust only
./run.sh --build-rust

# Release build
./run.sh --release

# Run pre-built
./run.sh --run

# Clean artifacts
./run.sh --clean

# Clean and rebuild
./run.sh --rebuild
```

## Configuration

The application uses `app.config.toml`:

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

[logging]
level = "info"
file = "application.log"
```

## Dependencies

**Rust**: webui-rs, tokio, rusqlite, serde, tracing, uuid, tungstenite, tiny_http

**Frontend**: react, react-dom, rsbuild, @rsbuild/plugin-react, typescript

## Potential Improvements

### Backend
- Add database connection pooling for concurrent access
- Implement input validation on all handler functions
- Add unit tests for handlers and business logic
- Create repository pattern for database operations
- Add middleware for request/response logging
- Implement rate limiting on WebSocket connections

### Frontend
- Add unit tests for React components
- Implement code splitting and lazy loading
- Add proper state management (Redux/Zustand)
- Create form validation utilities
- Add loading states and skeleton components
- Implement proper TypeScript strict mode

### Architecture
- Add plugin system for extensibility
- Implement proper error boundaries throughout
- Add health check endpoints
- Create API layer abstraction
- Add request/response interceptors

### Developer Experience
- Add hot reload for Rust changes
- Create component documentation (Storybook)
- Add integration tests
- Implement CI/CD pipelines
- Add Docker support

### Security
- Add authentication/authorization
- Implement CSRF protection
- Add request sanitization
- Encrypt sensitive configuration

### Performance
- Add caching layer for database queries
- Implement connection pooling
- Optimize frontend bundle size
- Add performance monitoring
