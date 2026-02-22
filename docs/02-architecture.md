# Architecture

This document describes the complete system architecture of the Rust WebUI React Rsbuild application.

## System Overview

The application implements a hybrid architecture combining:
- Model-View-ViewModel (MVVM) pattern for separation of concerns
- Event-driven architecture for loose coupling
- Plugin system for extensibility
- Clean architecture principles for maintainability

## Architecture Layers

```
+------------------------------------------------------------------+
|                       PRESENTATION LAYER                          |
|  +----------------------+          +--------------------------+   |
|  |   Frontend (React)   | <------> |   Backend (Rust WebUI)   |   |
|  |   - Views            | WebSocket|   - WebUI Handlers       |   |
|  |   - ViewModels       |          |   - HTTP Server          |   |
|  +----------------------+          +--------------------------+   |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                      APPLICATION LAYER                            |
|  +----------------------+          +--------------------------+   |
|  |   Use Cases          |          |   Commands/Queries       |   |
|  +----------------------+          +--------------------------+   |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                        DOMAIN LAYER                               |
|  +----------------------+          +--------------------------+   |
|  |   Entities           |          |   Repository Interfaces  |   |
|  |   Value Objects      |          |   Domain Services        |   |
|  +----------------------+          +--------------------------+   |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                     INFRASTRUCTURE LAYER                          |
|  +----------------------+          +--------------------------+   |
|  |   Database (SQLite)  |          |   Event Bus              |   |
|  |   Logging            |          |   WebSocket Server       |   |
|  |   Serialization      |          |   HTTP Server            |   |
|  +----------------------+          +--------------------------+   |
+------------------------------------------------------------------+
```

## Backend Architecture

### Module Structure

```
src/
├── main.rs                     # Application entry point
├── mod.rs                      # Root module declarations
│
├── core/                       # Domain layer
│   ├── mod.rs
│   ├── domain/
│   │   ├── mod.rs
│   │   ├── entities.rs         # Business entities (User, Counter)
│   │   ├── repositories.rs     # Repository traits
│   │   ├── services.rs         # Domain services
│   │   ├── value_objects.rs    # Value objects (Email, Name)
│   │   └── errors.rs           # Domain errors
│   └── application/
│       ├── mod.rs
│       ├── commands.rs         # CQRS commands
│       ├── queries.rs          # CQRS queries
│       ├── handlers.rs         # Command/Query handlers
│       └── dto.rs              # Data transfer objects
│
├── model/                      # Model layer
│   ├── mod.rs
│   └── core.rs                 # Configuration, logging, database
│
├── viewmodel/                  # ViewModel layer
│   ├── mod.rs
│   ├── handlers.rs             # WebUI event handlers
│   ├── websocket_handler.rs    # WebSocket server
│   └── window_logger.rs        # Window state tracking
│
├── infrastructure/             # Infrastructure layer
│   ├── mod.rs
│   ├── database/
│   │   └── mod.rs              # Database implementation
│   ├── event_bus/
│   │   └── mod.rs              # Event bus implementation
│   ├── logging/
│   │   ├── mod.rs              # Logging setup
│   │   └── error_logger.rs     # Error logging
│   ├── serialization/
│   │   ├── mod.rs
│   │   ├── serialization.rs    # Multi-format serialization
│   │   └── communication_config.rs
│   └── websocket/
│       └── mod.rs              # WebSocket infrastructure
│
├── presentation/               # Presentation layer
│   ├── mod.rs
│   └── devtools.rs             # DevTools API
│
├── plugins/                    # Plugin system
│   ├── mod.rs
│   ├── plugin_api/
│   │   └── mod.rs              # Plugin API definitions
│   └── plugins/
│       ├── database/
│       ├── counter/
│       ├── system-info/
│       └── window-management/
│
├── error_handling/             # Error handling utilities
│   ├── mod.rs
│   ├── app_error.rs
│   ├── error_context.rs
│   ├── error_handler.rs
│   └── result_ext.rs
│
└── tests/                      # Test suite
    ├── mod.rs
    ├── test_domain_entities.rs
    └── test_domain_errors.rs
```

### Domain Layer

The domain layer contains enterprise business rules and is framework-agnostic.

**Entities**: Business objects with identity
- User: User account with role and status
- Counter: Demonstration counter entity
- SystemInfo: System information entity

**Value Objects**: Objects defined by attributes
- Email: Validated email address
- Name: Validated name string

**Repositories**: Data access interfaces
- UserRepository: User data access contract
- CounterRepository: Counter data access contract

**Services**: Domain business logic
- UserService: User-related business rules
- CounterService: Counter-related business rules

### Model Layer

The model layer handles configuration and data persistence.

**Configuration Management**:
- Loads app.config.toml
- Provides typed configuration access
- Supports environment variable overrides

**Database Operations**:
- SQLite connection management
- Schema initialization
- Sample data creation
- CRUD operations

**Logging Setup**:
- Tracing subscriber configuration
- Console and file output
- Log level management

### ViewModel Layer

The ViewModel layer handles UI logic and backend-frontend communication.

**WebUI Handlers**:
- UI event handling (button clicks, window events)
- Counter operations (increment, reset, get value)
- Database operations (get users, get stats)
- System info retrieval
- Utility functions

**WebSocket Handler**:
- Real-time bidirectional communication
- Connection state management
- Message serialization/deserialization
- Event forwarding

**Window Logger**:
- Window state change tracking
- Event logging for debugging

### Infrastructure Layer

The infrastructure layer provides external service implementations.

**Event Bus**:
- Publish-subscribe pattern
- Event routing between components
- Async event emission
- Event subscription management

**Logging**:
- Structured logging with tracing
- Colored console output
- File logging
- Error tracking with context
- Panic hooks

**Serialization**:
- Multi-format support (JSON, MessagePack, CBOR)
- WebSocket message formatting
- Configuration serialization

**WebSocket**:
- WebSocket server implementation
- Connection lifecycle management
- Message handling

## Frontend Architecture

### Module Structure

```
frontend/src/
├── views/                      # View layer
│   ├── App.tsx                 # Main component
│   ├── main.tsx                # Entry point
│   ├── index.ts                # Module exports
│   ├── types.ts                # Type definitions
│   ├── components/
│   │   ├── index.ts
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MainContent.tsx
│   │   ├── BottomPanel.tsx     # Unified devtools panel
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useAppLogic.ts
│   │   └── useWindowOperations.ts
│   └── utils/
│       ├── logger.ts
│       └── window-content.ts
│
├── view-models/                # ViewModel layer
│   ├── index.ts
│   └── communication-bridge.ts # WebSocket bridge
│
├── models/                     # Model layer
│   ├── index.ts
│   └── event-bus.ts            # Event management
│
├── services/                   # Services layer
│   ├── index.ts
│   ├── error-logger.ts         # Error logging
│   └── window-manager.ts       # Window management
│
├── core/                       # Core utilities
│   ├── index.ts
│   ├── entities/
│   ├── error-handling/
│   │   ├── app-error.ts
│   │   ├── error-context.ts
│   │   └── result.ts
│   ├── use-cases/
│   └── services/
│
└── plugins/                    # Frontend plugins
    ├── plugin-api/
    │   └── index.ts
    └── plugins/
```

### View Layer

React components for user interface rendering.

**Main Components**:
- App: Root application component
- Header: Application header
- Sidebar: Window management sidebar
- MainContent: Feature cards display
- BottomPanel: Unified devtools and status panel
- ErrorBoundary: Error handling wrapper

**Hooks**:
- useAppLogic: Application initialization and state
- useWindowManager: Window state management
- useWindowOperations: Window CRUD operations
- useWebSocketStatus: WebSocket connection status

### ViewModel Layer

UI logic and backend communication.

**CommunicationBridge**:
- WebSocket connection management
- Message serialization/deserialization
- Reconnection logic with exponential backoff
- Connection state tracking
- Event forwarding

### Model Layer

Data structures and event management.

**EventBus**:
- Frontend event management
- Event subscription/unsubscription
- Event emission
- Broadcast support

**Entities**:
- User: User data structure
- DatabaseStats: Database statistics
- Counter: Counter entity
- SystemInfo: System information
- Todo: Todo entity (example)

### Services Layer

Utility functions and external service wrappers.

**ErrorLogger**:
- Global error handling
- Error context tracking
- Console output with colors
- Error history management

**WindowManager**:
- WinBox.js integration
- Window lifecycle management
- Window state tracking

## Communication Patterns

### Backend to Frontend Flow

1. Backend event occurs (database change, system event)
2. Event emitted to backend EventBus
3. WebSocket handler captures event
4. Event serialized and sent to frontend
5. Frontend CommunicationBridge receives message
6. Frontend EventBus emits event
7. React components subscribed to event update

### Frontend to Backend Flow

1. User interaction occurs (button click, form submit)
2. React component calls ViewModel function
3. CommunicationBridge serializes request
4. WebSocket message sent to backend
5. Backend WebSocket handler receives message
6. Event emitted to backend EventBus
7. Registered handlers process event
8. Response sent back to frontend

### Event System

**Backend Events**:
- app.start: Application started
- app.shutdown: Application shutting down
- data.changed: Data modification
- counter.incremented: Counter changed
- database.operation: Database operation
- system.health.check: System health check
- window.state.changed: Window state change

**Frontend Events**:
- user.login: User login request
- user.logout: User logout request
- data.changed: Data modification
- backend.connected: WebSocket connected
- backend.disconnected: WebSocket disconnected
- backend.error: Backend error occurred

## Design Patterns

### MVVM (Model-View-ViewModel)

**Model**: Data and business logic
- Backend: Domain entities, repositories, services
- Frontend: Data models, event bus

**View**: UI components
- Backend: WebUI window handlers
- Frontend: React components

**ViewModel**: UI logic and state
- Backend: Handler functions, WebSocket handlers
- Frontend: CommunicationBridge, hooks

### Event-Driven Architecture

Components communicate through events rather than direct calls:
- Loose coupling between layers
- Easy extension with new event handlers
- Asynchronous processing support

### Publish-Subscribe

EventBus manages subscriptions:
- Publishers emit events without knowing subscribers
- Subscribers register interest in specific events
- Events routed to all interested parties

### Repository Pattern

Data access abstracted through repository interfaces:
- Domain layer defines interfaces
- Infrastructure layer provides implementations
- Easy to swap data sources

## Extension Points

### Adding Backend Handlers

1. Create handler function in src/viewmodel/handlers.rs
2. Bind handler to WebUI window in main.rs
3. Add frontend communication in CommunicationBridge

### Adding Frontend Components

1. Create component in frontend/src/views/components/
2. Import and use in App.tsx
3. Add styles as needed

### Adding New Events

1. Add event type to AppEventType enum (frontend)
2. Add event type to AppEventType enum (backend)
3. Emit event from source component
4. Subscribe to event in target component

### Adding Plugins

1. Implement Plugin trait (backend)
2. Register plugin in PluginRegistry
3. Add frontend plugin if needed
4. Define plugin capabilities

## Testing Architecture

### Backend Tests

Located in src/tests/:
- Unit tests for domain entities
- Unit tests for domain errors
- Integration tests for infrastructure

### Frontend Tests

Located alongside source files:
- Component tests
- ViewModel tests
- Service tests

## Build Architecture

### Frontend Build (Rsbuild)

1. TypeScript compilation
2. React JSX transformation
3. Code splitting
4. Tree shaking
5. Minification
6. Asset optimization

### Backend Build (Cargo)

1. Rust compilation
2. Linking with WebUI static library
3. Build script execution (build.rs)
4. Configuration generation

## Security Considerations

### Input Validation

- All user input validated at domain layer
- SQL injection prevented via parameterized queries
- XSS prevented via React's automatic escaping

### Error Handling

- Errors logged with context
- Sensitive information not exposed to frontend
- Error IDs for tracking without exposing details

### Configuration

- Configuration file validated on load
- Default values for missing configuration
- Environment variable support for secrets

## Performance Considerations

### Backend

- Async operations for I/O
- Connection pooling for database
- Event bus for decoupled communication
- Lazy loading where appropriate

### Frontend

- Code splitting for faster initial load
- Memoization for expensive computations
- Virtual scrolling for large lists
- Debounced event handlers

## Next Steps

- Read the [Getting Started Guide](./01-getting-started.md) for setup
- Read the [Development Guide](./03-development.md) for development workflows
- Read the [API Reference](./04-api-reference.md) for API documentation
- Read the [Architecture Critique](../ARCHITECTURE_CRITIQUE.md) for analysis
