# Project Restructuring Guide

## Overview

This document describes the restructuring of the Rust WebUI React Rsbuild application following **Clean Architecture** principles.

## New Project Structure

### Backend (Rust) - Clean Architecture

```
src/
├── main.rs                      # Application entry point
├── lib.rs                       # Library root
│
├── app/                         # Application composition layer
│   ├── mod.rs
│   ├── config.rs               # Configuration management (AppConfig)
│   └── builder.rs              # Application builder pattern
│
├── domain/                      # Domain layer (business logic)
│   ├── mod.rs
│   ├── entities/               # Core business entities (User, DatabaseStats)
│   ├── value_objects/          # Domain value objects (Email)
│   ├── repositories/           # Repository traits (UserRepository)
│   ├── services/               # Domain services (UserService)
│   └── errors.rs               # Domain errors (DomainError)
│
├── application/                 # Application layer (use cases)
│   ├── mod.rs
│   ├── commands/               # CQRS commands (CreateUser, UpdateUser)
│   ├── queries/                # CQRS queries (GetAllUsers, GetDatabaseStats)
│   ├── handlers/               # Command/Query handlers
│   └── dtos.rs                 # Data transfer objects (UserDto, ApiResponse)
│
├── infrastructure/              # Infrastructure layer (external concerns)
│   ├── mod.rs
│   ├── database/               # SQLite database implementation
│   ├── event_bus/              # In-memory event bus (publish-subscribe)
│   ├── serialization/          # Multi-format serialization
│   │   ├── mod.rs
│   │   ├── serialization.rs    # Serialization engine (JSON, MessagePack, CBOR)
│   │   └── communication_config.rs  # Communication configuration display
│   ├── websocket/              # WebSocket server implementation
│   └── logging/                # Tracing and logging setup
│
└── presentation/                # Presentation layer (UI/API)
    ├── mod.rs
    ├── webui/                  # WebUI desktop window handlers
    ├── http/                   # HTTP server for frontend
    └── viewmodels/             # View models (WebSocketEvent, WebSocketError)
```

### Frontend (React) - Recommended Structure

```
frontend/src/
├── main.tsx                     # Application entry point
├── app/
│   ├── App.tsx                  # Root component
│   ├── providers/               # Context providers
│   └── config.ts                # Frontend configuration
│
├── features/                    # Feature modules (by business capability)
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── database/
│   ├── system-info/
│   └── window-management/
│
├── entities/                    # Business entities (shared)
│   ├── user.ts
│   └── database.ts
│
├── shared/                      # Shared code across features
│   ├── api/                    # API clients and HTTP/WebSocket clients
│   ├── lib/                    # Utility functions
│   ├── ui/                     # Reusable UI components
│   └── hooks/                  # Shared React hooks
│
└── widgets/                     # Composite widgets (composed of multiple entities)
```

## Architecture Layers Explained

### 1. Domain Layer (Enterprise Business Rules)

**Purpose**: Contains business logic that is independent of any framework or external concern.

**Components**:
- **Entities**: Core business objects with identity (e.g., `User`)
- **Value Objects**: Objects defined by their attributes (e.g., `Email`)
- **Repository Traits**: Interfaces for data access (e.g., `UserRepository`)
- **Domain Services**: Business logic that doesn't fit in entities

**Rules**:
- No dependencies on other layers
- Pure Rust code, no framework-specific code
- Contains enterprise-wide business rules

### 2. Application Layer (Application Business Rules)

**Purpose**: Orchestrates the flow of data to and from the domain layer.

**Components**:
- **Commands**: Write operations (CQRS pattern)
- **Queries**: Read operations (CQRS pattern)
- **Handlers**: Command and query handlers
- **DTOs**: Data transfer objects for API responses

**Rules**:
- Depends only on the domain layer
- Contains application-specific business rules
- No direct dependencies on infrastructure or presentation

### 3. Infrastructure Layer (External Concerns)

**Purpose**: Implements external concerns and provides concrete implementations.

**Components**:
- **Database**: SQLite implementation of repository traits
- **Event Bus**: In-memory publish-subscribe system
- **Serialization**: Multi-format serialization (JSON, MessagePack, CBOR)
- **WebSocket**: Real-time communication server
- **Logging**: Tracing and logging setup

**Rules**:
- Implements traits defined in the domain layer
- Contains framework-specific code
- Can be swapped without changing business logic

### 4. Presentation Layer (UI and API)

**Purpose**: Handles user interface and API presentation.

**Components**:
- **WebUI**: Desktop window event handlers
- **HTTP**: Static file server for frontend
- **ViewModels**: UI state and logic

**Rules**:
- Depends on application layer
- Contains UI-specific logic
- No business logic

### 5. App Layer (Composition Root)

**Purpose**: Composes all layers and bootstraps the application.

**Components**:
- **Config**: Configuration management
- **Builder**: Application builder pattern

**Rules**:
- Only layer that knows about all other layers
- Responsible for dependency injection
- Application startup and shutdown

## Key Benefits

### 1. Separation of Concerns
- Each layer has a single responsibility
- Easy to understand and maintain

### 2. Testability
- Domain layer can be tested without infrastructure
- Mock implementations easy to create

### 3. Flexibility
- Swap infrastructure without changing business logic
- Easy to add new features

### 4. Clear Dependencies
- Dependencies point inward (toward domain)
- No circular dependencies

### 5. Framework Independence
- Business logic not tied to WebUI, Tokio, etc.
- Easy to migrate to different frameworks

## Migration Status

### Completed
- ✅ Domain layer structure created
- ✅ Application layer structure created
- ✅ Infrastructure layer modules created
- ✅ Presentation layer structure created
- ✅ App layer with builder pattern created
- ✅ Multi-format serialization support added
- ✅ Event bus implementation
- ✅ Communication configuration display

### In Progress
- ⏳ Main.rs migration to new architecture
- ⏳ Frontend restructuring to feature-based
- ⏳ Build script updates

### TODO
- [ ] Complete main.rs migration
- [ ] Update frontend structure
- [ ] Add comprehensive tests
- [ ] Update CI/CD pipelines
- [ ] Add migration guide for existing code

## Build Commands

```bash
# Build with default features (JSON + MessagePack + CBOR)
cargo build

# Build with all serialization formats
cargo build --features "all-formats"

# Build with specific features
cargo build --features "msgpack cbor"

# Release build
cargo build --release

# Run tests
cargo test

# Check code without building
cargo check
```

## Feature Flags

```toml
[features]
default = ["json", "msgpack", "cbor"]
json = []
msgpack = ["rmp-serde"]
cbor = ["serde_cbor"]
protobuf = ["prost"]
all-formats = ["json", "msgpack", "cbor", "protobuf"]
```

## Configuration

The application uses `app.config.toml`:

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
webui_verbose = false
```

## Next Steps

1. **Complete Main Migration**: Fix remaining compilation errors in main.rs
2. **Frontend Restructuring**: Reorganize frontend into feature-based structure
3. **Testing**: Add unit and integration tests for each layer
4. **Documentation**: Add rustdoc comments to all public APIs
5. **Examples**: Add example code for each layer

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Rust Architecture Patterns](https://github.com/dwyl/learn-rust/issues/163)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
