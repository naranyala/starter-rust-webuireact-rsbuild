# Development Guide

This guide covers development workflows, best practices, and common tasks.

## Development Environment Setup

### IDE Recommendations

- **Rust**: RustRover, VS Code with rust-analyzer
- **TypeScript**: VS Code, WebStorm
- **Recommended**: VS Code with both Rust and TypeScript extensions

### VS Code Extensions

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## Development Workflow

### 1. Start Development Server

```bash
# Terminal 1: Backend watch mode
cargo watch -x run

# Terminal 2: Frontend dev mode
cd frontend
bun run dev
```

### 2. Make Changes

- Backend changes: Auto-rebuild with cargo-watch
- Frontend changes: Auto-rebuild with Rsbuild dev mode

### 3. Test Changes

- Backend: `cargo test`
- Frontend: `bun run test` (when tests are added)

## Code Style

### Rust

Follow the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/):

```rust
// Use snake_case for functions and variables
let user_name = get_user_name();

// Use PascalCase for types
struct UserName;

// Use UPPER_SNAKE_CASE for constants
const MAX_USERS: usize = 100;

// Add documentation comments
/// Gets a user by ID.
/// 
/// # Arguments
/// * `id` - The user ID
/// 
/// # Returns
/// The user if found
fn get_user(id: i64) -> Option<User> {
    // Implementation
}
```

### TypeScript

Follow the [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html):

```typescript
// Use camelCase for variables and functions
const userName = getUserName();

// Use PascalCase for types and classes
interface UserName {}

// Use UPPER_SNAKE_CASE for constants
const MAX_USERS = 100;

// Add JSDoc comments
/**
 * Gets a user by ID.
 * @param id - The user ID
 * @returns The user if found
 */
function getUser(id: number): User | undefined {
    // Implementation
}
```

## Common Tasks

### Adding a New Feature

#### Backend

1. Add domain entity in `src/model/core.rs`
2. Add handler in `src/viewmodel/handlers.rs`
3. Bind handler in `main.rs`
4. Add database operations if needed

#### Frontend

1. Add component in `frontend/src/views/components/`
2. Add ViewModel logic in `frontend/src/view-models/`
3. Import and use component in `App.tsx`
4. Add styles

### Adding a New API Endpoint

#### Backend

```rust
// 1. Add handler
pub fn handle_new_feature(window: &mut webui::Window) {
    window.bind("new_feature", |event| {
        // Handler logic
    });
}

// 2. Bind in main.rs
setup_new_feature_handlers(&mut my_window);
```

#### Frontend

```typescript
// 1. Add ViewModel function
export const useNewFeature = () => {
  const callNewFeature = useCallback(async () => {
    const response = await communicationBridge.call('new_feature', {});
    return response;
  }, []);
  
  return { callNewFeature };
};

// 2. Use in component
const { callNewFeature } = useNewFeature();
```

### Debugging

#### Backend

```bash
# Build with debug symbols
cargo build

# Run with debugger
rust-lldb target/debug/rustwebui-app

# Or with VS Code: Add launch configuration
```

#### Frontend

```bash
# Run dev mode with source maps
bun run dev

# Open browser DevTools
# Set breakpoints in Sources tab
```

### Logging

#### Backend

```rust
use tracing::{info, debug, warn, error};

// Log at different levels
info!("User created: {}", user_id);
debug!("Database query: {}", query);
warn!("High memory usage: {}%", usage);
error!("Failed to connect: {}", error);

// Log with context
error!(error = %e, "Database operation failed");
```

#### Frontend

```typescript
import { Logger } from './utils/logger';

// Log at different levels
Logger.info('User created', { userId: 123 });
Logger.debug('API response', response);
Logger.warn('High memory usage', { usage: 85 });
Logger.error('Connection failed', error);
```

## Testing

### Backend Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User::new(1, "John".to_string());
        assert_eq!(user.name, "John");
    }

    #[tokio::test]
    async fn test_database_query() {
        let db = Database::new("test.db").unwrap();
        let users = db.get_all_users().await;
        assert!(users.is_ok());
    }
}
```

### Frontend Tests (when added)

```typescript
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('System Dashboard')).toBeInTheDocument();
  });
});
```

## Build Optimization

### Backend

```bash
# Release build with optimizations
cargo build --release

# Profile-guided optimization (advanced)
cargo build --release --profile=profiling
```

### Frontend

```bash
# Production build with optimizations
bun run build

# Analyze bundle size
bun run build --analyze
```

## Troubleshooting

### Common Issues

#### Build Fails After Rust Update

```bash
# Clean and rebuild
cargo clean
cargo build
```

#### Frontend Build Fails

```bash
# Clear cache
cd frontend
rm -rf node_modules/.cache
bun run build
```

#### WebSocket Connection Fails

1. Check if backend is running
2. Check if port 9000 is available
3. Check browser console for errors
4. Check backend logs for WebSocket errors

#### Database Lock Issues

```bash
# Close application
# Remove database lock files
rm app.db-shm app.db-wal
# Restart application
```

## Performance Tips

### Backend

- Use connection pooling for database
- Cache frequently accessed data
- Use async operations for I/O
- Profile with `cargo flamegraph`

### Frontend

- Use React.memo for expensive components
- Implement code splitting
- Lazy load non-critical components
- Profile with React DevTools

## Security Considerations

### Backend

- Validate all input
- Use parameterized queries (already done with rusqlite)
- Implement rate limiting
- Sanitize error messages

### Frontend

- Sanitize user input
- Use Content Security Policy
- Implement CSRF protection
- Validate API responses

## Continuous Integration

### Suggested CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - uses: Swatinem/rust-cache@v1
      - run: cargo test
      
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: oven-sh/setup-bun@v1
      - run: cd frontend && bun install && bun run test
```

## Next Steps

- Read the [Architecture Guide](./02-architecture.md) for system design
- Read the [API Reference](./04-api-reference.md) for detailed APIs
- Read the [Deployment Guide](./05-deployment.md) for production deployment
