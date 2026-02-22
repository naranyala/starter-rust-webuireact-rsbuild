# Architecture Critique & Remediation Plan

**Date:** 2026-02-22  
**Reviewer:** System Architecture Analysis

---

## Executive Summary

This codebase exhibits **significant architectural debt** despite ambitious design goals. The stated architecture (Clean Architecture + DDD + MVVM + Plugin-driven) is **not properly implemented**. This document identifies critical issues and provides actionable remediation.

---

## Critical Architectural Issues

### 1. **Layer Violations - SEVERITY: HIGH**

#### Problem
The core principle of Clean Architecture (dependency inversion) is violated throughout:

```rust
// src/model/core.rs - Infrastructure code in "domain" layer
use rusqlite::Connection;  // ← Database implementation detail
use tracing_subscriber;    // ← Logging framework dependency

// Should be: Domain layer should have ZERO external dependencies
```

**Impact:** Domain logic is tightly coupled to infrastructure. Cannot swap databases, test in isolation, or reuse business logic.

#### Fix Required
```rust
// src/core/domain/entities.rs (clean)
pub struct User {
    pub id: UserId,  // Value object, not i64
    pub name: Name,  // Value object with validation
    pub email: Email, // Value object with validation
}

// src/infrastructure/database/user_repository.rs
pub struct SqliteUserRepository {
    connection: Arc<DbConnection>,
}

#[async_trait]
impl UserRepository for SqliteUserRepository {
    // Implementation here
}
```

---

### 2. **God Module - src/model/core.rs - SEVERITY: HIGH**

#### Problem
Single file (377 lines) contains:
- Configuration loading
- Database connections  
- Logging initialization
- Business logic
- Event emission

**Cohesion:** Near zero. These are 4+ separate concerns.

#### Fix Required
```
src/
├── config/
│   ├── mod.rs
│   ├── app_config.rs
│   └── env_config.rs
├── database/
│   ├── mod.rs
│   ├── connection.rs
│   └── repositories/
├── logging/
│   ├── mod.rs
│   └── error_logger.rs
└── domain/
    └── (pure business logic)
```

---

### 3. **Plugin System is Non-Functional - SEVERITY: CRITICAL**

#### Problem
```rust
// src/plugins/plugin_api/mod.rs - 150+ lines of interfaces
pub trait Plugin: Send + Sync {
    fn metadata(&self) -> &PluginMetadata;
    fn capabilities(&self) -> Vec<PluginCapability>;
    async fn initialize(&mut self, context: &PluginContext) -> Result<(), String>;
    // ...
}

// src/plugins/plugins/database/ - EMPTY DIRECTORY
// src/plugins/plugins/counter/ - EMPTY DIRECTORY
```

**Reality:** Plugin system exists only as interface definitions. Zero implementations. Architecture documentation claims plugin-driven but nothing is actually a plugin.

#### Decision Required
**Option A:** Actually implement plugin system (2-3 weeks work)
**Option B:** Remove plugin system entirely, use modular design (recommended)

---

### 4. **Error Handling Duplication - SEVERITY: MEDIUM**

#### Problem
Three separate error handling systems:

```rust
// System 1: src/core/domain/errors.rs
pub enum DomainError {
    NotFound(String),
    ValidationError(String),
    // ...
}

// System 2: src/error_handling/app_error.rs  
pub struct AppError {
    pub id: String,
    pub code: ErrorCode,
    pub context: HashMap<String, Value>,
    // ...
}

// System 3: Direct anyhow::Result usage in infrastructure
```

**Impact:** Inconsistent error handling, developers confused about which to use.

#### Fix Required
```rust
// Single error hierarchy
src/error/
├── mod.rs              // Re-exports
├── domain_error.rs     // Business rule violations
├── application_error.rs // Use case failures  
├── infrastructure_error.rs // External system failures
└── presentation_error.rs // UI/API errors

// Usage:
type DomainResult<T> = Result<T, DomainError>;
type AppResult<T> = Result<T, AppError>;
```

---

### 5. **Frontend Architecture Chaos - SEVERITY: HIGH**

#### Problem
```typescript
// Multiple conflicting patterns:

// Pattern 1: Direct event bus usage
EventBus.emit('data.changed', payload);

// Pattern 2: Communication bridge
communicationBridge.sendToBackend('get_users', {});

// Pattern 3: Window operations
useWindowOperations(setActiveWindows);

// Pattern 4: Global window functions
window.getUsers();
window.webui.call('function_name');
```

**Impact:** No consistent data flow pattern. Redux/Context/Signals would be clearer.

#### Fix Required
```typescript
// Single source of truth with React Context + Hooks
src/state/
├── store.ts           // Centralized state
├── actions.ts         // State mutations
├── selectors.ts       // Derived state
└── effects.ts         // Side effects

// Usage:
const { users, loading, error } = useUsers();
const { incrementCounter } = useCounter();
```

---

### 6. **WebSocket Protocol Undefined - SEVERITY: MEDIUM**

#### Problem
```typescript
// Frontend sends:
ws.send(JSON.stringify({
    id: 'random',
    name: 'get_users',
    payload: {},
    source: 'frontend'
}));

// Backend receives WebSocketEvent but:
// - No schema validation
// - No versioning
// - No error response format
// - No timeout handling
```

**Impact:** Fragile communication, silent failures, impossible to evolve API.

#### Fix Required
```rust
// Define protocol formally
src/protocol/
├── mod.rs
├── messages.rs    // Request/Response types
├── schema.json    // JSON Schema validation
└── version.rs     // Protocol versioning

#[derive(Serialize, Deserialize, Validate)]
pub struct ProtocolMessage {
    pub version: String,      // "1.0"
    pub id: String,           // UUID
    pub timestamp: u64,       // Unix ms
    pub message_type: String, // "command", "query", "event"
    pub action: String,       // "get_users"
    pub payload: Value,
}
```

---

### 7. **Database Access Pattern Anti-Patterns - SEVERITY: HIGH**

#### Problem
```rust
// src/model/core.rs
pub fn get_all_users(&self) -> Result<Vec<serde_json::Value>, Box<dyn Error>> {
    // Returns JSON directly - no type safety
    // Business logic in infrastructure layer
    // Event emission mixed with data access
}
```

**Impact:** 
- No compile-time guarantees
- SQL injection risk
- Cannot test without database
- Events coupled to repository

#### Fix Required
```rust
// Domain layer
pub trait UserRepository {
    async fn find_all(&self) -> DomainResult<Vec<User>>;
    async fn find_by_id(&self, id: UserId) -> DomainResult<Option<User>>;
}

// Infrastructure layer
pub struct SqliteUserRepository {
    connection: Arc<Connection>,
}

#[async_trait]
impl UserRepository for SqliteUserRepository {
    async fn find_all(&self) -> DomainResult<Vec<User>> {
        // Pure data access, no business logic
    }
}

// Application layer emits events
pub async fn load_users() -> AppResult<Vec<UserDto>> {
    let users = user_repo.find_all().await?;
    event_bus.emit("users.loaded", users.len()).await;
    Ok(users.to_dto())
}
```

---

### 8. **No Input Validation - SEVERITY: HIGH**

#### Problem
```rust
// Any string accepted as email
pub struct User {
    pub email: String,  // ← Should be Email value object
}

// Frontend sends any JSON
ws.send(JSON.stringify({ name: 'get_users' }));
// No validation that 'name' exists or is valid
```

#### Fix Required
```rust
// Value objects with validation
#[derive(Clone, Debug)]
pub struct Email(String);

impl Email {
    pub fn new(email: &str) -> Result<Self, ValidationError> {
        if !email.contains('@') {
            return Err(ValidationError::InvalidEmail);
        }
        Ok(Email(email.to_string()))
    }
}

// Frontend protocol validation
const MessageSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    payload: z.record(z.any()).optional(),
    timestamp: z.number().positive(),
});
```

---

### 9. **Concurrency Issues - SEVERITY: MEDIUM**

#### Problem
```rust
// Blocking lock in async context
let conn = self.connection.lock().unwrap();  // ← Will block async runtime

// Panic on lock failure
let mut db_guard = DATABASE.lock().unwrap();  // ← Poisoned mutex crashes app
```

#### Fix Required
```rust
// Use async-aware locks
use tokio::sync::Mutex;

let conn = self.connection.lock().await;  // ← Non-blocking

// Handle poisoned locks
match DATABASE.lock() {
    Ok(guard) => { /* use guard */ }
    Err(poisoned) => {
        error!("Database lock poisoned, recovering...");
        let guard = poisoned.into_inner();
        // Recovery logic
    }
}
```

---

### 10. **Testing Strategy Gaps - SEVERITY: MEDIUM**

#### Current State
- 23 backend tests (basic unit tests only)
- 36 frontend tests (no integration tests)
- No E2E tests
- No contract tests for WebSocket protocol
- No performance tests

#### Required
```
tests/
├── unit/              // Existing tests
├── integration/       // Database, WebSocket
├── contract/          // API schema validation
├── e2e/              // Full user flows
└── performance/       // Load testing
```

---

## Remediation Priority

### Phase 1: Critical (Week 1-2)
1. ✅ Error logging (completed)
2. Fix layer violations in `src/model/core.rs`
3. Consolidate error handling systems
4. Add input validation

### Phase 2: High (Week 3-4)
5. Define WebSocket protocol formally
6. Fix database access patterns
7. Implement proper repository pattern
8. Add async-safe concurrency

### Phase 3: Medium (Week 5-6)
9. Decide on plugin system (implement or remove)
10. Frontend state management refactor
11. Comprehensive test suite

### Phase 4: Long-term (Week 7+)
12. Performance optimization
13. Documentation
14. CI/CD pipeline

---

## Files Requiring Immediate Attention

| File | Issue | Priority |
|------|-------|----------|
| `src/model/core.rs` | God module, layer violations | P0 |
| `src/plugins/` | Empty implementations | P0 |
| `src/error_handling/` | Duplicate systems | P1 |
| `frontend/src/view-models/` | Inconsistent patterns | P1 |
| `src/infrastructure/database/` | Business logic leakage | P1 |

---

## Conclusion

This codebase has **ambitious architecture** but **poor execution**. The gap between documented architecture and actual implementation is significant. 

**Recommendation:** Focus on Phase 1-2 fixes before adding new features. Technical debt is accumulating faster than value delivery.
