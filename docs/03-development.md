# Development Guide

This guide covers development workflows, best practices, and common tasks for the Rust WebUI React Rsbuild application.

## Development Environment Setup

### Recommended IDE Configuration

#### VS Code Extensions

Required extensions:
- rust-lang.rust-analyzer (Rust language support)
- dbaeumer.vscode-eslint (TypeScript linting)
- biomejs.biome (Biome formatting and linting)

Optional extensions:
- tamasfe.even-better-toml (TOML support)
- serayuzgur.crates (Cargo dependency management)
- vadimcn.vscode-lldb (Debugging)

#### VS Code Settings

Create .vscode/settings.json:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "rust-analyzer.checkOnSave.command": "clippy",
  "rust-analyzer.cargo.allFeatures": false,
  "rust-analyzer.cargo.features": ["all"]
}
```

### Rust Development Setup

```bash
# Install rustfmt for code formatting
rustup component add rustfmt

# Install clippy for linting
rustup component add clippy

# Install cargo-watch for auto-rebuilding
cargo install cargo-watch

# Install cargo-edit for dependency management
cargo install cargo-edit
```

### Frontend Development Setup

```bash
# Install biome globally (optional)
bun add -g @biomejs/biome

# Verify installation
biome --version
```

## Development Workflow

### Standard Development Session

1. Start backend watch mode:
```bash
cargo watch -x run
```

2. Start frontend dev mode (new terminal):
```bash
cd frontend
bun run dev
```

3. Make changes:
- Backend: Auto-rebuilds on file save
- Frontend: Hot reloads on file save

4. Test changes:
- Backend: cargo test
- Frontend: bun test

### Hot Reload Configuration

Backend (cargo-watch):
```bash
# Watch specific directories
cargo watch -w src -x run

# Watch with clear screen
cargo watch -c -x run

# Run multiple commands
cargo watch -x check -x test
```

Frontend (Rsbuild dev mode):
```bash
# Development server with hot reload
bun run dev

# Development server with custom port
bun run dev --port 3000
```

## Code Standards

### Rust Code Style

Follow the Rust API Guidelines:

```rust
// Naming conventions
let user_name = String::from("John");  // snake_case for variables
struct UserName;                        // PascalCase for types
const MAX_USERS: usize = 100;           // UPPER_SNAKE_CASE for constants

// Function documentation
/// Gets a user by ID.
///
/// # Arguments
/// * `id` - The user ID
///
/// # Returns
/// * `Option<User>` - The user if found
///
/// # Examples
/// ```
/// let user = get_user(1);
/// ```
fn get_user(id: i64) -> Option<User> {
    // Implementation
}

// Error handling
fn process_user(id: i64) -> Result<User, AppError> {
    let user = get_user(id)
        .ok_or_else(|| AppError::not_found("User"))?;
    Ok(user)
}

// Use Result type alias
type AppResult<T> = Result<T, AppError>;
```

Run formatting and linting:
```bash
cargo fmt
cargo clippy -- -D warnings
```

### TypeScript Code Style

Follow the TypeScript Style Guide:

```typescript
// Naming conventions
const userName = 'John';           // camelCase for variables
interface UserName {}              // PascalCase for types
const MAX_USERS = 100;             // UPPER_SNAKE_CASE for constants

// Function documentation
/**
 * Gets a user by ID.
 * @param id - The user ID
 * @returns The user if found
 * @throws Error if user not found
 */
function getUser(id: number): User | undefined {
    // Implementation
}

// Type definitions
interface User {
    readonly id: number;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

type UserRole = 'admin' | 'user' | 'editor' | 'viewer';

// Error handling
async function processUser(id: number): Promise<User> {
    const user = await getUser(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}
```

Run formatting and linting:
```bash
bun run format:fix
bun run lint:fix
```

## Common Development Tasks

### Adding a New Feature

#### Backend Implementation

1. Add domain entity (src/core/domain/entities.rs):
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Todo {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: DateTime<Utc>,
}
```

2. Add repository trait (src/core/domain/repositories.rs):
```rust
#[async_trait::async_trait]
pub trait TodoRepository: Send + Sync {
    async fn get_all(&self) -> DomainResult<Vec<Todo>>;
    async fn create(&self, todo: Todo) -> DomainResult<Todo>;
    async fn update(&self, todo: Todo) -> DomainResult<Todo>;
    async fn delete(&self, id: i64) -> DomainResult<()>;
}
```

3. Add handler (src/viewmodel/handlers.rs):
```rust
pub fn setup_todo_handlers(window: &mut webui::Window) {
    window.bind("get_todos", |_event| {
        info!("Get todos event received");
        // Handler implementation
    });
}
```

4. Register handler (src/main.rs):
```rust
setup_todo_handlers(&mut my_window);
```

#### Frontend Implementation

1. Add type definition (frontend/src/core/entities/index.ts):
```typescript
export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
}
```

2. Add ViewModel hook (frontend/src/view-models/useTodoViewModel.ts):
```typescript
export const useTodoViewModel = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const loadTodos = useCallback(async () => {
    const response = await communicationBridge.call('get_todos', {});
    setTodos(response.data);
  }, []);

  return { todos, loadTodos };
};
```

3. Add component (frontend/src/views/components/TodoList.tsx):
```typescript
export const TodoList: React.FC = () => {
  const { todos, loadTodos } = useTodoViewModel();

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
};
```

### Adding a New API Endpoint

#### Backend

1. Define request/response types:
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct GetUserRequest {
    pub id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetUserResponse {
    pub success: bool,
    pub user: Option<User>,
    pub error: Option<String>,
}
```

2. Implement handler:
```rust
pub fn handle_get_user(window: &mut webui::Window) {
    window.bind("get_user", |event| {
        let payload: GetUserRequest = serde_json::from_str(&event.payload).unwrap();
        let user = database.get_user(payload.id);
        let response = GetUserResponse {
            success: user.is_some(),
            user,
            error: user.map(|_| None),
        };
        event.respond_with(serde_json::to_string(&response).unwrap());
    });
}
```

#### Frontend

1. Add API function:
```typescript
export async function getUser(id: number): Promise<User> {
  const response = await communicationBridge.call('get_user', { id });
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.user;
}
```

2. Use in component:
```typescript
const user = await getUser(1);
```

### Debugging

#### Backend Debugging

Using rust-lldb:
```bash
# Build with debug symbols
cargo build

# Start debugger
rust-lldb target/debug/rustwebui-app

# Common commands:
# breakpoint set --name function_name
# run
# next
# step
# print variable
```

Using VS Code:
1. Add .vscode/launch.json:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Debug Rust",
      "cargo": {
        "args": ["build", "--bin=rustwebui-app"]
      },
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

2. Set breakpoints in Rust files
3. Start debugging (F5)

#### Frontend Debugging

Using browser DevTools:
1. Start dev server: bun run dev
2. Open browser DevTools (F12)
3. Set breakpoints in Sources tab
4. Use debugger statement:
```typescript
function debugFunction() {
  debugger;  // Execution pauses here
  // ...
}
```

Using VS Code:
1. Add .vscode/launch.json:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### Logging

#### Backend Logging

```rust
use tracing::{trace, debug, info, warn, error};
use tracing::instrument;

// Basic logging
info!("User created: {}", user_id);
debug!("Database query: {}", query);
warn!("High memory usage: {}%", usage);
error!("Failed to connect: {}", error);

// Structured logging with context
error!(
    error = %e,
    user_id = %user.id,
    operation = "create_user",
    "Database operation failed"
);

// Instrument functions
#[instrument(skip(db), fields(user_id = %user.id))]
async fn create_user(db: &Database, user: User) -> Result<User, AppError> {
    info!("Creating user");
    // Implementation
}

// Log spans
let span = tracing::span!(tracing::Level::INFO, "user_creation");
let _enter = span.enter();
```

#### Frontend Logging

```typescript
import { Logger } from './utils/logger';

// Basic logging
Logger.info('User created', { userId: 123 });
Logger.debug('API response', response);
Logger.warn('High memory usage', { usage: 85 });
Logger.error('Connection failed', error);

// With context
Logger.error('Operation failed', {
  operation: 'createUser',
  userId: user.id,
  error: error.message
});
```

## Testing

### Backend Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User::new(1, "John".to_string(), "john@example.com".to_string());
        assert_eq!(user.name, "John");
        assert_eq!(user.email, "john@example.com");
    }

    #[test]
    fn test_user_validation() {
        let invalid_email = User::new(1, "John".to_string(), "invalid".to_string());
        assert!(invalid_email.is_err());
    }

    #[tokio::test]
    async fn test_database_query() {
        let db = Database::new("test.db").unwrap();
        let users = db.get_all_users().await;
        assert!(users.is_ok());
    }

    #[test]
    fn test_error_handling() {
        let result: Result<i32, DomainError> = Err(DomainError::NotFound("User".to_string()));
        assert!(matches!(result, Err(DomainError::NotFound(_))));
    }
}
```

Run tests:
```bash
# Run all tests
cargo test

# Run specific test
cargo test test_user_creation

# Run with output
cargo test -- --nocapture

# Run with coverage (requires cargo-tarpaulin)
cargo tarpaulin --out Html
```

### Frontend Testing

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';

describe('EventBus', () => {
  beforeEach(() => {
    // Setup before each test
  });

  test('should create EventBus instance', () => {
    expect(EventBus).toBeDefined();
  });

  test('should subscribe to events', () => {
    const handler = () => {};
    const unsubscribe = EventBus.subscribe('test.event', handler);
    expect(unsubscribe).toBeDefined();
  });

  test('should emit events to subscribers', () => {
    const receivedEvents: any[] = [];
    const handler = (event: any) => receivedEvents.push(event);
    
    EventBus.subscribe('test.event', handler);
    EventBus.emit('test.event', { data: 'test' });
    
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].payload.data).toBe('test');
  });
});
```

Run tests:
```bash
cd frontend

# Run all tests
bun test

# Run specific test file
bun test src/models/event-bus.test.ts

# Run with watch mode
bun test:watch

# Run with coverage
bun test:coverage
```

## Build Optimization

### Backend Optimization

```bash
# Release build with optimizations
cargo build --release

# Profile-guided optimization
cargo build --release --profile=profiling

# Analyze binary size
cargo bloat --release

# Optimize compile time
# In .cargo/config.toml:
[build]
codegen-units = 16
incremental = true
```

### Frontend Optimization

```bash
# Production build with analysis
bun run build --analyze

# Check bundle size
bun run build --json > stats.json
bun add -g webpack-bundle-analyzer
webpack-bundle-analyzer stats.json

# Optimize images and assets
# Rsbuild handles automatically
```

## Troubleshooting

### Common Issues

#### Build Fails After Rust Update

```bash
# Clean and rebuild
cargo clean
cargo update
cargo build
```

#### Frontend Build Fails

```bash
# Clear cache
cd frontend
rm -rf node_modules
rm -rf .rsbuild
rm -rf node_modules/.cache
bun install
bun run build
```

#### WebSocket Connection Fails

1. Verify backend is running
2. Check port 9000 availability: lsof -i :9000
3. Check browser console for errors
4. Check backend logs for WebSocket errors

#### Database Lock Issues

```bash
# Close application
# Remove database lock files
rm app.db-shm app.db-wal
# Restart application
```

#### TypeScript Errors

```bash
# Check TypeScript configuration
cd frontend
bun exec tsc --noEmit

# Clear TypeScript cache
rm -rf node_modules/.cache
```

## Performance Tips

### Backend Performance

- Use connection pooling for database access
- Cache frequently accessed data
- Use async operations for I/O
- Profile with cargo flamegraph:
```bash
cargo install flamegraph
cargo flamegraph --bin rustwebui-app
```

### Frontend Performance

- Use React.memo for expensive components
- Implement code splitting
- Lazy load non-critical components
- Profile with React DevTools:
```bash
# Install React DevTools extension
# Open DevTools > Components > Profiler
```

## Continuous Integration

### GitHub Actions Example

Create .github/workflows/ci.yml:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-action@stable
      
      - name: Install Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
            frontend/node_modules
          key: ${{ runner.os }}-${{ hashFiles('**/Cargo.lock', '**/bun.lockb') }}
      
      - name: Install frontend dependencies
        run: cd frontend && bun install
      
      - name: Run backend tests
        run: cargo test
      
      - name: Run frontend tests
        run: cd frontend && bun test
      
      - name: Run clippy
        run: cargo clippy -- -D warnings
      
      - name: Run biome check
        run: cd frontend && bun run biome ci
```

## Next Steps

- Read the [Architecture Guide](./02-architecture.md) for system design details
- Read the [API Reference](./04-api-reference.md) for API documentation
- Read the [Deployment Guide](./05-deployment.md) for production deployment
- Read the [Testing Guide](../TESTING.md) for comprehensive testing strategies
