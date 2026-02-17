# Architecture

This document describes the architecture of the Rust WebUI React Rsbuild application.

## Overview

The application follows the Model-View-ViewModel (MVVM) pattern with a clear separation between backend and frontend layers.

```
+----------------------------------------------------------+
|                    Presentation Layer                     |
|  +----------------+          +------------------------+   |
|  |  Frontend      | <------> |  Backend (WebUI)       |   |
|  |  (React)       | WebSocket|  (Rust)                |   |
|  +----------------+          +------------------------+   |
+----------------------------------------------------------+
                            |
                            v
+----------------------------------------------------------+
|                   Application Layer                       |
|  +----------------+          +------------------------+   |
|  |  Use Cases     |          |  Commands/Queries      |   |
|  +----------------+          +------------------------+   |
+----------------------------------------------------------+
                            |
                            v
+----------------------------------------------------------+
|                     Domain Layer                          |
|  +----------------+          +------------------------+   |
|  |  Entities      |          |  Repository Interfaces |   |
|  +----------------+          +------------------------+   |
+----------------------------------------------------------+
                            |
                            v
+----------------------------------------------------------+
|                  Infrastructure Layer                     |
|  +----------------+          +------------------------+   |
|  |  Database      |          |  Event Bus             |   |
|  +----------------+          +------------------------+   |
+----------------------------------------------------------+
```

## Backend Architecture (Rust)

### Layer Structure

```
src/
├── main.rs                    # Application entry point
├── model/                     # Model layer
│   └── core.rs                # Configuration, logging, database
├── viewmodel/                 # ViewModel layer
│   ├── handlers.rs            # WebUI event handlers
│   ├── websocket_handler.rs   # WebSocket server
│   └── window_logger.rs       # Window state tracking
└── infrastructure/            # Infrastructure layer
    └── event_bus/             # Event bus implementation
```

### Model Layer

The Model layer contains business logic and data access.

**File**: `src/model/core.rs`

**Responsibilities**:
- Configuration management (loading and parsing `app.config.toml`)
- Logging system initialization
- SQLite database operations
- Sample data creation

**Key Types**:
- `AppConfig`: Application configuration structure
- `Database`: SQLite database wrapper
- `LoggingSettings`: Logging configuration

### ViewModel Layer

The ViewModel layer handles UI logic and backend-frontend communication.

**Files**:
- `src/viewmodel/handlers.rs`
- `src/viewmodel/websocket_handler.rs`
- `src/viewmodel/window_logger.rs`

**Responsibilities**:
- WebUI event handling
- WebSocket server management
- Window state tracking
- Business logic orchestration

**Key Components**:

#### Handlers
- UI handlers (button clicks, window events)
- Counter handlers (increment, reset, get value)
- Database handlers (get users, get stats)
- System info handlers
- Utility handlers

#### WebSocket Handler
- Real-time bidirectional communication
- Event forwarding between frontend and backend
- Connection state management
- Message serialization/deserialization

#### Window Logger
- Window state change tracking
- Event logging for debugging

### Infrastructure Layer

The Infrastructure layer provides external service implementations.

**File**: `src/infrastructure/event_bus/mod.rs`

**Responsibilities**:
- Publish-subscribe event system
- Event routing between components
- Event logging

**Key Types**:
- `EventBus`: Event bus singleton
- `Event`: Event structure
- `EventReceiver`: Event subscription handle

## Frontend Architecture (TypeScript/React)

### Layer Structure

```
frontend/src/
├── views/                     # View layer
│   ├── App.tsx                # Main component
│   ├── main.tsx               # Entry point
│   └── components/            # UI components
├── view-models/               # ViewModel layer
│   └── communication-bridge.ts
├── models/                    # Model layer
│   └── event-bus.ts
└── services/                  # Services layer
    ├── window-manager.ts
    └── utils/
```

### View Layer

The View layer contains React components for the user interface.

**Files**:
- `frontend/src/views/App.tsx`
- `frontend/src/views/main.tsx`
- `frontend/src/views/components/`

**Responsibilities**:
- UI rendering
- User interaction handling
- Component state management

**Key Components**:
- `App`: Main application component
- `Sidebar`: Window management sidebar
- `MainContent`: Feature cards
- `WebSocketStatusPanel`: Connection status display
- `ErrorBoundary`: Error handling wrapper

### ViewModel Layer

The ViewModel layer handles UI logic and backend communication.

**File**: `frontend/src/view-models/communication-bridge.ts`

**Responsibilities**:
- WebSocket connection management
- Message serialization/deserialization
- Reconnection logic
- Event forwarding

**Key Types**:
- `CommunicationBridge`: WebSocket wrapper
- `WebSocketEvent`: Message structure

### Model Layer

The Model layer contains data structures and event management.

**File**: `frontend/src/models/event-bus.ts`

**Responsibilities**:
- Frontend event management
- Event subscription/unsubscription
- Event emission

**Key Types**:
- `EventBus`: Event management singleton
- `AppEventType`: Event type enumeration

### Services Layer

The Services layer provides utility functions and external service wrappers.

**Files**:
- `frontend/src/services/window-manager.ts`
- `frontend/src/services/utils/global-error-handler.ts`

**Responsibilities**:
- Window management (WinBox.js wrapper)
- Global error handling
- Utility functions

**Key Components**:

#### Window Manager
- WinBox.js window creation
- Window state tracking
- Window lifecycle management

#### Global Error Handler
- Error boundary setup
- Error logging
- Error recovery

## Communication Flow

### Backend to Frontend

```
1. Backend event occurs
2. Event emitted to EventBus
3. WebSocket handler forwards to frontend
4. CommunicationBridge receives message
5. Frontend EventBus emits event
6. React components update
```

### Frontend to Backend

```
1. User interaction occurs
2. React component calls ViewModel
3. CommunicationBridge sends WebSocket message
4. Backend WebSocket handler receives
5. Event emitted to backend EventBus
6. Handlers process event
```

## Data Flow

### Database Query Example

```
1. User clicks "Get Users" button
2. Frontend calls getUsers() function
3. CommunicationBridge sends WebSocket message
4. Backend receives "get_users" event
5. Handler queries database
6. Response sent via WebSocket
7. Frontend receives response
8. UI updates with user list
```

## Key Design Patterns

### MVVM (Model-View-ViewModel)

- **Model**: Data and business logic
- **View**: UI components (React)
- **ViewModel**: UI logic and state management

### Event-Driven Architecture

- Components communicate via events
- Loose coupling between layers
- Easy to extend with new event handlers

### Publish-Subscribe

- EventBus manages subscriptions
- Components publish events without knowing subscribers
- Easy to add new event listeners

## Extension Points

### Adding New Backend Handlers

1. Create handler function in `src/viewmodel/handlers.rs`
2. Bind handler to WebUI window in `main.rs`
3. Add frontend call in `communication-bridge.ts`

### Adding New Frontend Components

1. Create component in `frontend/src/views/components/`
2. Import and use in `App.tsx`
3. Add styles to component or global CSS

### Adding New Events

1. Add event type to `AppEventType` enum
2. Emit event from source component
3. Subscribe to event in target component

## Next Steps

- Read the [Getting Started Guide](./01-getting-started.md) for setup instructions
- Read the [Development Guide](./03-development.md) for development workflows
- Read the [API Reference](./04-api-reference.md) for detailed API documentation
