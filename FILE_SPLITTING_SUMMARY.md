# File Splitting Summary

## Overview

This document describes the splitting of long files into smaller, logically organized modules.

## Frontend Files Split

### 1. App.tsx (1026 lines → 7 files)

**Original**: `frontend/src/views/App.tsx` (1026 lines)

**Split into**:
```
frontend/src/views/
├── App.tsx (218 lines)                    # Main component - simplified
├── types.ts (52 lines)                    # Type definitions
├── components/
│   ├── index.ts
│   ├── Sidebar.tsx (73 lines)            # Sidebar window management
│   ├── MainContent.tsx (52 lines)        # Feature cards
│   ├── WebSocketStatusPanel.tsx (108 lines) # WS status panel
│   ├── Header.tsx (12 lines)             # Header component
│   └── ErrorBoundary.tsx (171 lines)     # Error boundary (unchanged)
├── hooks/
│   ├── index.ts
│   ├── useAppLogic.ts (92 lines)         # App initialization hooks
│   └── useWindowOperations.ts (132 lines) # Window management hooks
├── utils/
│   ├── index.ts
│   ├── logger.ts (18 lines)              # Logger utility
│   └── window-content.ts (142 lines)     # HTML generators for WinBox
└── main.tsx (48 lines)                    # Entry point (unchanged)
```

**Benefits**:
- Each component is focused and testable
- Hooks separate logic from UI
- Types are centralized and reusable
- Utils are shared across components

## Backend Files To Split

### 2. websocket_handler.rs (810 lines → 4 files)

**Original**: `src/viewmodel/websocket_handler.rs` (810 lines)

**Split into**:
```
src/viewmodel/websocket/
├── mod.rs                      # Module exports
├── types.rs                    # WebSocketEvent, ConnectionState, etc.
├── connection.rs               # Connection handling logic
└── handler.rs                  # Message processing
```

### 3. communication-bridge.ts (448 lines → 3 files)

**Original**: `frontend/src/view-models/communication-bridge.ts` (448 lines)

**Split into**:
```
frontend/src/view-models/
├── communication-bridge.ts     # Main bridge logic
├── websocket-client.ts         # WebSocket connection management
└── message-handler.ts          # Message serialization/deserialization
```

### 4. handlers.rs (422 lines → 5 files)

**Original**: `src/viewmodel/handlers.rs` (422 lines)

**Split into**:
```
src/viewmodel/handlers/
├── mod.rs                      # Module exports
├── ui.rs                       # UI event handlers
├── counter.rs                  # Counter handlers
├── database.rs                 # Database handlers
├── system.rs                   # System info handlers
└── utils.rs                    # Utility handlers
```

### 5. core.rs (398 lines → 4 files)

**Original**: `src/model/core.rs` (398 lines)

**Split into**:
```
src/model/
├── mod.rs                      # Module exports
├── config.rs                   # Configuration management
├── logging.rs                  # Logging setup
└── database.rs                 # Database operations
```

### 6. serialization.rs (370 lines → 4 files)

**Original**: `src/infrastructure/serialization/serialization.rs` (370 lines)

**Split into**:
```
src/infrastructure/serialization/
├── mod.rs                      # Module exports
├── engine.rs                   # Serialization engine
├── formats/
│   ├── json.rs                # JSON format
│   ├── msgpack.rs             # MessagePack format
│   └── cbor.rs                # CBOR format
└── types.rs                    # Common types (WsMessage, etc.)
```

### 7. communication_config.rs (308 lines → 3 files)

**Original**: `src/infrastructure/serialization/communication_config.rs` (308 lines)

**Split into**:
```
src/infrastructure/serialization/
├── config/
│   ├── mod.rs                 # Module exports
│   ├── transport.rs           # Transport protocol definitions
│   ├── serialization.rs       # Serialization format definitions
│   └── display.rs             # Display logic
```

## New File Structure Summary

### Frontend
```
frontend/src/views/
├── App.tsx                          # 218 lines (was 1026)
├── types.ts                         # 52 lines
├── components/                      # 7 components avg 63 lines each
├── hooks/                          # 2 hooks avg 112 lines each
└── utils/                          # 2 utils avg 80 lines each
```

### Backend
```
src/
├── viewmodel/websocket/            # 4 files avg 202 lines each (was 810)
├── viewmodel/handlers/             # 6 files avg 70 lines each (was 422)
├── model/                          # 4 files avg 100 lines each (was 398)
└── infrastructure/serialization/   # 8 files avg 46 lines each (was 678)
```

## Benefits of Splitting

1. **Maintainability**: Smaller files are easier to understand and modify
2. **Testability**: Focused modules are easier to test in isolation
3. **Reusability**: Shared utilities and hooks can be reused
4. **Collaboration**: Multiple developers can work on different files
5. **Code Review**: Smaller changes are easier to review
6. **Performance**: Faster IDE indexing and compilation
7. **Navigation**: Easier to find specific functionality

## Guidelines for Future Development

### File Size Limits
- **Components**: < 200 lines
- **Hooks**: < 150 lines
- **Modules**: < 300 lines
- **Utilities**: < 100 lines

### When to Split
- File exceeds size limit
- File has multiple responsibilities
- File contains unrelated functions
- File is hard to navigate

### Naming Conventions
- Components: PascalCase (e.g., `Sidebar.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAppLogic.ts`)
- Modules: snake_case for Rust (e.g., `websocket_handler.rs`)
- Types: PascalCase with `types.ts` or `mod.rs`

## Migration Status

- ✅ App.tsx split complete
- ⏳ websocket_handler.rs types created
- ⏳ Remaining backend files pending
