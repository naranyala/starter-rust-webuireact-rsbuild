# Rust WebUI React Rsbuild Application (MVVM Architecture)

A modern, production-ready desktop application starter kit that combines the raw performance of Rust with the rich ecosystem of React for building cross-platform desktop applications. This starter provides a complete foundation for developers who demand both type safety and rapid UI development, following the Model-View-ViewModel (MVVM) architectural pattern.

## Overview

This project leverages WebUI to render web content using the operating system's native webview while maintaining direct communication with Rust backend logic. The architecture follows the Model-View-ViewModel (MVVM) pattern to cleanly separate concerns: Models handle data and business logic, Views manage the user interface, ViewModels coordinate between Models and Views, and Infrastructure provides supporting services.

## MVVM Architecture

### Model Layer
- **Purpose**: Represents the data layer and business logic of the application
- **Rust Backend**: Contains data structures, database operations, and configuration management
- **Frontend Models**: Manages data contracts and business entities

### View Layer  
- **Purpose**: Defines the user interface and user interactions
- **Rust Backend**: Minimal UI elements (window management)
- **Frontend Views**: React components that display data and handle user interactions

### ViewModel Layer
- **Purpose**: Acts as a bridge between Models and Views, handling UI logic and state management
- **Rust Backend**: Event handlers and communication coordinators
- **Frontend ViewModels**: State management and business logic coordination

### Infrastructure Layer
- **Purpose**: Provides cross-cutting concerns like logging, event buses, and utilities
- **Rust Backend**: Logging, configuration, and event bus implementations
- **Frontend Services**: Utilities and helper functions

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
│   ├── model/                    # Data models and business logic
│   │   ├── core.rs               # Core infrastructure (config, logging, database)
│   │   └── ...
│   ├── viewmodel/                # ViewModels (handlers, communication)
│   │   ├── handlers.rs           # WebUI event handlers
│   │   ├── websocket_handler.rs  # WebSocket communication handler
│   │   └── ...
│   ├── view/                     # View layer (UI elements)
│   │   └── ...
│   ├── infrastructure/           # Supporting services
│   │   └── event_bus/            # Event bus implementation
│   │       └── mod.rs            # Event bus module
│   └── core/                     # Core application logic (legacy - to be refactored)
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
│   └── src/                      # Frontend source code organized by MVVM
│       ├── models/               # Data models and contracts
│       │   ├── communication-bridge.ts  # Communication bridge
│       │   ├── event-bus.ts      # Event bus implementation
│       │   └── ...
│       ├── views/                # View layer (React components)
│       │   ├── main.tsx          # Application entry point
│       │   ├── App.tsx           # Main application component
│       │   ├── components/       # Reusable UI components
│       │   │   └── ErrorBoundary.tsx
│       │   └── ...
│       ├── view-models/          # ViewModels (state management)
│       │   ├── communication-bridge.ts  # Communication logic
│       │   └── ...
│       └── services/             # Supporting services
│           ├── utils.js          # Utility functions
│           ├── global-error-handler.ts  # Error handling
│           └── ...
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
- **MVVM Architecture**: Clean separation of concerns following Model-View-ViewModel pattern
- **Event-Driven Architecture**: Clean separation between UI and business logic
- **Configuration Management**: TOML-based configuration system
- **Structured Logging**: Comprehensive application logging with tracing
- **Database Integration**: Built-in SQLite support with automatic schema management

## Backend Architecture (MVVM)

The Rust backend follows the Model-View-ViewModel (MVVM) architectural pattern:

### Model Layer (`src/model/`)
- **core.rs**: Core infrastructure components (configuration, logging, database)
- **Database Module**: SQLite integration with automatic schema creation
- **Configuration Module**: TOML-based configuration with fallback mechanisms

### ViewModel Layer (`src/viewmodel/`)
- **handlers.rs**: WebUI event handlers for frontend communication
- **websocket_handler.rs**: WebSocket communication management
- **Communication Coordinators**: Bridges between Models and Views

### View Layer (`src/view/`)
- **UI Elements**: Minimal UI elements and window management

### Infrastructure Layer (`src/infrastructure/`)
- **event_bus/**: Event-driven communication system
- **Logging**: Structured logging using the `tracing` crate
- **Utilities**: Cross-cutting concerns and supporting services

#### Model Layer Details
The Model layer handles data and business logic:
- **Configuration**: TOML-based configuration with fallback mechanisms
- **Database**: SQLite integration with automatic schema creation
- **Event Handling**: Asynchronous event processing with proper error handling

#### ViewModel Layer Details
The ViewModel layer acts as a bridge between Models and Views:
- **Event Handlers**: WebUI event handlers for frontend communication
- **Communication Logic**: WebSocket connections for real-time bidirectional communication
- **State Management**: Coordination between Models and Views

#### Infrastructure Layer Details
The Infrastructure layer provides cross-cutting concerns:
- **Event Bus**: Event-driven communication system
- **Logging**: Structured logging using the `tracing` crate
- **Utilities**: Supporting services and helper functions

## Frontend Architecture (MVVM)

The React frontend follows the Model-View-ViewModel (MVVM) architectural pattern:

### Model Layer (`frontend/src/models/`)
- **Data Contracts**: TypeScript interfaces and data structures
- **Communication Bridge**: Communication with backend services
- **Event Bus**: Frontend event management

### View Layer (`frontend/src/views/`)
- **Components**: React components that display data and handle user interactions
- **Main App**: Root application component
- **UI Elements**: Reusable UI components

### ViewModel Layer (`frontend/src/view-models/`)
- **State Management**: Business logic and state coordination
- **Communication Logic**: Handles communication with backend services
- **Business Logic**: Coordination between Models and Views

### Services Layer (`frontend/src/services/`)
- **Utilities**: Helper functions and utility classes
- **Error Handling**: Global error handling and reporting
- **Supporting Services**: Cross-cutting concerns

#### Key Features:
- **Rsbuild**: High-performance bundler optimized for React
- **TypeScript**: Type-safe development experience
- **Component-Based**: Modular UI architecture
- **Asset Optimization**: Automatic optimization of images and resources
- **MVVM Pattern**: Clear separation of concerns between data, UI, and logic layers

## Build System

The project includes a comprehensive build system with multiple scripts:

- **run.sh**: Master build and run script with detailed logging
- **build-dist.sh**: Cross-platform distribution builder
- **build-frontend.js**: Frontend build automation
- **build-frontend-inline.js**: Frontend inline build automation
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

This starter kit provides a solid foundation with MVVM architecture, but there are several areas where it could be enhanced:

### Model Layer Improvements
- Implement data validation and sanitization at the model level
- Add model-specific unit tests for business logic
- Create model factories for test data generation
- Implement model observers for reactive data patterns

### View Layer Improvements
- Implement component composition patterns for better reusability
- Add view-specific unit tests with React Testing Library
- Create view abstraction layers for better maintainability
- Implement responsive design patterns for different screen sizes

### ViewModel Layer Improvements
- Implement state management patterns (Redux, Zustand, etc.) for complex state
- Add ViewModel-specific unit tests
- Create ViewModel lifecycle management
- Implement command patterns for better separation of concerns

### Infrastructure Layer Improvements
- Add comprehensive logging strategies across all layers
- Implement error boundaries and centralized error handling
- Create infrastructure for metrics and monitoring
- Add caching mechanisms for improved performance

### Performance Optimizations
- Implement database connection pooling for high-concurrency scenarios
- Add caching layers for frequently accessed data
- Optimize frontend bundle size with code splitting and lazy loading
- Implement request debouncing/throttling for frequent UI updates
- Add virtual scrolling for large datasets

### Security Enhancements
- Add input validation and sanitization for all WebUI function parameters
- Implement secure communication protocols for sensitive data
- Add authentication and authorization mechanisms
- Sanitize user-generated content to prevent XSS attacks
- Implement proper data encryption for sensitive information

### Developer Experience
- Add comprehensive unit and integration tests across all MVVM layers
- Implement automated code formatting and linting workflows
- Add documentation generation tools
- Create CLI tools for common development tasks
- Implement hot-reloading for Rust backend changes
- Add storybook for component development and documentation

### Feature Extensions
- Add plugin architecture for extending functionality
- Implement internationalization (i18n) support
- Add theming capabilities beyond the current dark mode
- Integrate with cloud storage providers
- Add offline-first capabilities with local sync

### Monitoring and Observability
- Add application metrics collection across all layers
- Implement distributed tracing for complex operations
- Add health check endpoints
- Create dashboards for monitoring application performance
- Add alerting for critical system events
- Implement structured logging with correlation IDs

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
- Implement contract testing between frontend and backend

## License

This project is available under the terms of the MIT License, which permits unrestricted use, modification, and distribution of the software and its derivatives.