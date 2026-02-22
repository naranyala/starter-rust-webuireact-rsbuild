# Testing Guide

This project uses **Bun Test** for frontend testing and **cargo test** for backend testing.

## Frontend Testing (Bun)

### Setup

Bun Test is built into Bun runtime - no additional setup required!

```bash
# Install dependencies
bun install
```

### Running Tests

```bash
# Run all tests
bun test

# Watch mode (re-run on file changes)
bun test:watch

# With coverage report
bun test:coverage

# Watch mode with coverage
bun test:ui

# Run specific test file
bun test src/models/event-bus.test.ts

# Run tests matching pattern
bun test --test-name-pattern "EventBus"
```

### Writing Tests

Test files should be named `*.test.ts` or `*.test.tsx` and placed alongside the code they test.

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should do something', () => {
    expect(true).toBe(true);
  });

  test('should handle async operations', async () => {
    const result = await asyncFunction();
    expect(result).toBe('expected');
  });
});
```

### Test Structure

```
frontend/src/
├── models/
│   ├── event-bus.ts
│   └── event-bus.test.ts          # Tests for event-bus
├── view-models/
│   ├── communication-bridge.ts
│   └── communication-bridge.test.ts
├── core/
│   └── error-handling/
│       ├── app-error.ts
│       └── app-error.test.ts
└── tests/
    └── setup.ts                    # Test setup file
```

### Available Test APIs

```typescript
import { 
  describe, 
  test, 
  it, 
  expect, 
  beforeEach, 
  afterEach, 
  beforeAll, 
  afterAll,
  mock,
  spyOn,
  jest 
} from 'bun:test';

// Mock functions
const mockFn = mock(() => 'mocked');

// Spy on methods
const spy = spyOn(object, 'methodName');

// Timer mocks
mock.timers.enable();
mock.timers.tick(1000);
```

## Backend Testing (Cargo)

### Running Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_user_creation_valid

# Run tests in specific module
cargo test --lib tests::test_domain_entities

# Run tests with output
cargo test -- --nocapture

# Run tests with coverage (requires cargo-tarpaulin)
cargo tarpaulin --out Html
```

### Writing Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_something() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn test_result() {
        let result = function_that_returns_result();
        assert!(result.is_ok());
    }

    #[test]
    #[should_panic]
    fn test_panic() {
        panic!("Expected panic");
    }
}
```

### Test Structure

```
src/
├── tests/
│   ├── mod.rs
│   ├── test_domain_entities.rs
│   ├── test_domain_errors.rs
│   ├── test_event_bus.rs
│   └── test_error_handling.rs
├── core/
│   └── domain/
│       ├── entities.rs
│       └── errors.rs
└── infrastructure/
    └── event_bus/
        └── mod.rs
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install frontend dependencies
        run: cd frontend && bun install
        
      - name: Run frontend tests
        run: cd frontend && bun test
        
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          
      - name: Run backend tests
        run: cargo test
```

## Test Coverage Goals

Aim for:
- **Core utilities**: 90%+ coverage
- **Business logic**: 80%+ coverage  
- **UI components**: 70%+ coverage
- **Integration tests**: Critical paths covered

## Best Practices

1. **Test names should describe behavior**: `should_increment_counter`, not `test_counter`
2. **Arrange-Act-Assert pattern**: Setup, execute, verify
3. **Test edge cases**: Empty inputs, null values, error conditions
4. **Keep tests independent**: No shared state between tests
5. **Mock external dependencies**: Don't test actual API calls
6. **Use descriptive assertions**: `expect(result).toBe(42)` not `expect(result).toBeTruthy()`

## Debugging Tests

### Frontend

```bash
# Run with verbose output
bun test --verbose

# Run specific test file
bun test path/to/test.ts

# Debug with console.log (allowed in tests)
console.log('Debug info:', value);
```

### Backend

```bash
# Show println! output
cargo test -- --nocapture

# Run single test with output
cargo test test_name -- --nocapture
```

## Common Patterns

### Testing Async Code

```typescript
test('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

test('should timeout', async () => {
  await expect(asyncFunction()).rejects.toThrow('timeout');
});
```

### Testing Events

```typescript
test('should emit event', () => {
  const handler = mock();
  EventBus.subscribe('test', handler);
  EventBus.emit('test', {});
  expect(handler).toHaveBeenCalled();
});
```

### Testing Error Handling

```typescript
test('should handle error gracefully', () => {
  expect(() => riskyOperation()).not.toThrow();
});

test('should throw on invalid input', () => {
  expect(() => validateInput('')).toThrow('Invalid input');
});
```
