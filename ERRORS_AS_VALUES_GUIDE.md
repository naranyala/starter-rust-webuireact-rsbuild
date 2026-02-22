# Errors as Values - Implementation Guide

## Overview

This project implements the **"Errors as Values"** pattern, where errors are treated as regular data values that flow through the system rather than being thrown as exceptions. This approach makes error handling:

- **Predictable**: Errors are part of the type system
- **Composable**: Errors can be transformed and combined
- **Testable**: No need to catch exceptions in tests
- **Traceable**: Rich context and metadata travel with errors

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Boundaries                    │
│  ┌─────────────┐  Errors as Values  ┌─────────────┐         │
│  │  Frontend   │◄──────────────────►│   Backend   │         │
│  │  (TypeScript)│   Result<T, E>    │    (Rust)   │         │
│  └─────────────┘                    └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐
│  Result<T, E>   │                  │  Result<T, E>   │
│  Success/Fail   │                  │  Ok/Err         │
│  AppError       │                  │  AppError       │
│  Context        │                  │  Context        │
└─────────────────┘                  └─────────────────┘
```

## Backend (Rust) Implementation

### File Structure

```
src/error_handling/
├── mod.rs                 # Module exports
├── app_error.rs           # AppError type with metadata
├── result_ext.rs          # Result extensions (map, and_then, etc.)
├── error_context.rs       # Context builders and guards
└── error_handler.rs       # Centralized error processing
```

### Core Types

#### AppError - Rich Error Type

```rust
use crate::error_handling::{AppError, ErrorCode, AppResult};

// Create error
let error = AppError::new(
    ErrorCode::EntityNotFound,
    "User not found"
);

// Add context
let error = error
    .with_context("user_id", 123)
    .with_context("action", "delete")
    .with_location(module_path!(), Some("delete_user"), Some(42));

// Return as result
fn get_user(id: i64) -> AppResult<User> {
    // ...
    Err(error)
}
```

#### Result Extensions

```rust
use crate::error_handling::ResultExt;

// Map success value
let result: AppResult<String> = get_user(123)
    .map_ok(|user| user.name);

// Chain operations
let result: AppResult<Email> = get_user(123)
    .and_then(|user| validate_email(user.email));

// Side effects
get_user(123)
    .on_ok(|user| println!("Found user: {}", user.id))
    .on_err(|e| log_error(e));

// Recover from error
let result = get_user(123)
    .recover(|e| Ok(User::default()));
```

#### Error Context & Guards

```rust
use crate::error_handling::error_context::{guards, validation};

// Guard clauses
fn create_user(name: String, email: String) -> AppResult<User> {
    let name = guards::require_non_empty(&name, ErrorCode::ValidationFailed, "name")?;
    let email = guards::require_non_empty(&email, ErrorCode::ValidationFailed, "email")?;
    
    // Validation
    validation::validate(
        email,
        |e| e.contains('@'),
        ErrorCode::ValidationFailed,
        "Invalid email"
    )?;
    
    Ok(User::new(name, email))
}

// With context builder
fn process_order(order_id: i64) -> AppResult<Order> {
    get_order(order_id)
        .with_context("operation", "process_order")
        .with_context("order_id", order_id)
}
```

#### Error Handler

```rust
use crate::error_handling::{ErrorHandler, GlobalErrorHandler};

// Create handler
let handler = ErrorHandler::new()
    .with_log_level(LogLevel::Error)
    .with_stack_trace(true);

// Handle at boundaries
fn api_endpoint() -> JsonResponse {
    let result = process_request();
    
    match handler.handle(result) {
        Ok(data) => JsonResponse::success(data),
        Err(e) => JsonResponse::error(&e),
    }
}

// Register global handler
GlobalErrorHandler::register();
```

## Frontend (TypeScript) Implementation

### File Structure

```
frontend/src/core/error-handling/
├── index.ts            # Module exports
├── result.ts           # Result/Either types
├── app-error.ts        # AppError class
├── error-handler.ts    # Error handling utilities
└── error-context.ts    # Context builders
```

### Core Types

#### Result Type

```typescript
import { Result, Success, Failure } from '@/core/error-handling';

// Create results
const success: Result<User> = Result.ok(user);
const failure: Result<User> = Result.fail(error);

// Map success value
const result: Result<string> = getUser(123)
  .map(user => user.name);

// Chain operations
const result: Result<Email> = await getUser(123)
  .andThen(user => validateEmail(user.email));

// Side effects
getUser(123)
  .onOk(user => console.log('Found:', user.id))
  .onError(error => logError(error));

// Recover from error
const result = getUser(123)
  .recover(error => User.default());
```

#### AppError - Rich Error Type

```typescript
import { AppError, ErrorCode, createError } from '@/core/error-handling';

// Create error
const error = AppError.create(
  ErrorCode.ENTITY_NOT_FOUND,
  'User not found'
);

// Add context with builder
const error = createError(ErrorCode.VALIDATION_FAILED, 'Invalid data')
  .context('user_id', 123)
  .context('action', 'delete')
  .location('UserService', 'deleteUser', 42)
  .recovery({ type: 'userNotification', message: 'Please try again' })
  .build();

// Async wrapper
const result = await Result.tryAsync(
  async () => await api.getUser(123),
  (error) => AppError.create(ErrorCode.CONNECTION_FAILED, error.message)
);
```

#### Error Context & Guards

```typescript
import { guards, validation, withContext } from '@/core/error-handling';

// Guard clauses
function createUser(name: string, email: string): Result<User> {
  const validName = guards.requireNonEmpty(name, ErrorCode.VALIDATION_FAILED, 'name');
  if (validName.isFailure()) return validName;
  
  const validEmail = guards.requireNonEmpty(email, ErrorCode.VALIDATION_FAILED, 'email');
  if (validEmail.isFailure()) return validEmail;
  
  // Validation
  const emailValidation = validation.validateEmail(email);
  if (emailValidation.isFailure()) return emailValidation;
  
  return Result.ok(new User(name, email));
}

// With context
function processOrder(orderId: number): Result<Order> {
  return withContext(
    getOrder(orderId),
    ctx => ctx.addOperation('process_order').addResource('order', orderId)
  );
}
```

#### Error Handler

```typescript
import { ErrorHandler, GlobalErrorHandler, handleAsync } from '@/core/error-handling';

// Create handler
const handler = new ErrorHandler({
  logLevel: 'error',
  includeStack: false,
});

// Handle at boundaries
async function apiEndpoint(): Promise<JsonResponse> {
  const result = await handleAsync(() => processRequest(), handler);
  
  return result.match({
    Success: data => JsonResponse.success(data),
    Failure: error => JsonResponse.error(error),
  });
}

// Register global handlers
GlobalErrorHandler.register();
```

## Usage Examples

### Backend Example - Complete Flow

```rust
use crate::error_handling::*;

// Domain layer - pure business logic
fn validate_user(user: &User) -> AppResult<()> {
    guards::require_non_empty(&user.name, ErrorCode::ValidationFailed, "name")?;
    guards::require_non_empty(&user.email, ErrorCode::ValidationFailed, "email")?;
    
    validation::validate(
        &user.email,
        |e| e.contains('@'),
        ErrorCode::ValidationFailed,
        "Invalid email format"
    )?;
    
    Ok(())
}

// Application layer - orchestration
async fn create_user(cmd: CreateUserCommand) -> AppResult<UserDto> {
    let user = User::new(cmd.id, cmd.name, cmd.email)?;
    
    validate_user(&user)
        .with_context("command", "create_user")
        .with_context("user_id", cmd.id)?;
    
    let saved = user_repository.create(user)
        .await
        .with_context("operation", "create_user")?;
    
    Ok(UserDto::from(saved))
}

// Presentation layer - error handling at boundary
async fn create_user_handler(req: Request) -> JsonResponse {
    let handler = ErrorHandler::new();
    
    let cmd = parse_request(&req)?;
    
    match handler.handle(create_user(cmd).await) {
        Ok(dto) => JsonResponse::ok(dto),
        Err(e) => {
            tracing::error!("Failed to create user: {}", e.summary());
            JsonResponse::error(&e)
        }
    }
}
```

### Frontend Example - Complete Flow

```typescript
import { Result, AppError, ErrorCode, handleAsync } from '@/core/error-handling';

// Domain layer - pure business logic
function validateUser(user: User): Result<User> {
  const nameValid = guards.requireNonEmpty(user.name, ErrorCode.VALIDATION_FAILED, 'name');
  if (nameValid.isFailure()) return nameValid;
  
  const emailValid = validation.validateEmail(user.email);
  if (emailValid.isFailure()) return emailValid;
  
  return Result.ok(user);
}

// ViewModel layer - orchestration
async function createUser(cmd: CreateUserCommand): Promise<Result<User>> {
  const user = new User(cmd.id, cmd.name, cmd.email);
  
  const validated = validateUser(user);
  if (validated.isFailure()) return validated;
  
  const saved = await api.createUser(user);
  return saved;
}

// View layer - error handling at boundary
async function handleSubmit(event: FormEvent) {
  const handler = GlobalErrorHandler.getInstance();
  
  const result = await handleAsync(
    () => createUser(formData),
    handler
  );
  
  result.match({
    Success: user => {
      toast.success('User created!');
      navigate('/users');
    },
    Failure: error => {
      toast.error(handler.toUserMessage(error));
    }
  });
}
```

## Benefits

### 1. Type Safety
```rust
// Compiler enforces error handling
fn get_user(id: i64) -> AppResult<User> {
    // Must return Result
}

// Can't ignore errors
let user = get_user(123)?; // Must handle error
```

### 2. Composability
```typescript
// Chain operations
const result = getUser(123)
  .map(user => user.email)
  .andThen(email => sendEmail(email))
  .recover(error => logAndContinue(error));
```

### 3. Rich Context
```rust
// Errors carry metadata
let error = AppError::new(code, message)
    .with_context("user_id", 123)
    .with_context("operation", "delete")
    .with_location(module!(), Some(fn!()), Some(line!()));
```

### 4. Testability
```typescript
// No try-catch in tests
it('should validate user', () => {
  const result = validateUser(invalidUser);
  expect(result.isFailure()).toBe(true);
  expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
});
```

### 5. Consistent Error Handling
```rust
// Same pattern everywhere
fn layer1() -> AppResult<T> { }
fn layer2() -> AppResult<T> { }
fn layer3() -> AppResult<T> { }

// Errors flow through layers
```

## Migration Guide

### From Exceptions to Results

#### Before (Exceptions)
```rust
fn get_user(id: i64) -> User {
    if id < 0 {
        panic!("Invalid ID");
    }
    // ...
}
```

#### After (Errors as Values)
```rust
fn get_user(id: i64) -> AppResult<User> {
    if id < 0 {
        return Err(AppError::new(ErrorCode::ValidationFailed, "Invalid ID"));
    }
    // ...
}
```

### From try-catch to Result

#### Before (try-catch)
```typescript
async function getUser(id: number) {
  try {
    const user = await api.getUser(id);
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

#### After (Result)
```typescript
async function getUser(id: number): Promise<Result<User>> {
  return Result.tryAsync(
    async () => await api.getUser(id),
    error => AppError.create(ErrorCode.CONNECTION_FAILED, error.message)
  );
}
```

## Best Practices

1. **Return Results from all fallible operations**
2. **Add context at each layer**
3. **Handle errors at boundaries only**
4. **Use guard clauses for validation**
5. **Log errors with full context**
6. **Provide recovery actions when possible**
7. **Convert to user-friendly messages at UI boundary**

## Next Steps

1. Migrate existing code to use Result types
2. Add error context throughout the codebase
3. Create error handling tests
4. Add error tracking integration
5. Create error dashboard for monitoring
