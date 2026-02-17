# API Reference

This document provides detailed API documentation for both backend and frontend.

## Backend API

### Configuration API

#### AppConfig

Configuration structure loaded from `app.config.toml`.

```rust
pub struct AppConfig {
    pub app: AppSettings,
    pub database: DatabaseSettings,
    pub window: WindowSettings,
    pub logging: LoggingSettings,
}
```

#### Methods

```rust
// Load configuration from file
impl AppConfig {
    pub fn load() -> Result<Self, Box<dyn std::error::Error>>;
    
    // Get default configuration
    pub fn default() -> Self;
    
    // Getters
    pub fn get_app_name(&self) -> &str;
    pub fn get_version(&self) -> &str;
    pub fn get_db_path(&self) -> &str;
    pub fn get_window_title(&self) -> &str;
    pub fn get_log_level(&self) -> &str;
    pub fn get_log_file(&self) -> &str;
    pub fn should_create_sample_data(&self) -> bool;
    pub fn is_append_log(&self) -> bool;
}
```

### Database API

#### Database

SQLite database wrapper.

```rust
pub struct Database {
    connection: Arc<Mutex<Connection>>,
}
```

#### Methods

```rust
impl Database {
    // Create new database connection
    pub fn new(db_path: &str) -> Result<Self, Box<dyn std::error::Error>>;
    
    // Initialize database schema
    pub fn init(&self) -> Result<(), Box<dyn std::error::Error>>;
    
    // Insert sample data
    pub fn insert_sample_data(&self) -> Result<(), Box<dyn std::error::Error>>;
    
    // Get all users
    pub fn get_all_users(&self) -> Result<Vec<User>, Box<dyn std::error::Error>>;
    
    // Get database statistics
    pub fn get_stats(&self) -> Result<DatabaseStats, Box<dyn std::error::Error>>;
}
```

### Event Bus API

#### EventBus

Publish-subscribe event system.

```rust
pub struct EventBus {
    sender: broadcast::Sender<Arc<Event>>,
}
```

#### Methods

```rust
impl EventBus {
    // Get global event bus instance
    pub fn global() -> Arc<Self>;
    
    // Emit an event
    pub async fn emit(&self, event: Event) -> Result<(), broadcast::error::SendError<Arc<Event>>>;
    
    // Emit a simple event
    pub async fn emit_simple(&self, name: &str, payload: Value) -> Result<(), broadcast::error::SendError<Arc<Event>>>;
    
    // Subscribe to events
    pub fn listen(&self) -> EventReceiver;
}
```

#### Event

```rust
pub struct Event {
    pub id: String,
    pub name: String,
    pub payload: Value,
    pub source: String,
}
```

### WebSocket API

#### WebSocketHandler

WebSocket server for real-time communication.

```rust
pub struct WebSocketHandler {
    event_bus: Arc<EventBus>,
    connection_notify: Arc<Notify>,
}
```

#### Methods

```rust
impl WebSocketHandler {
    pub fn new(event_bus: Arc<EventBus>) -> Self;
    
    pub async fn start_server(&self, addr: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
}
```

#### WebSocketEvent

```rust
pub struct WebSocketEvent {
    pub id: String,
    pub name: String,
    pub payload: Value,
    pub timestamp: u64,
    pub source: String,
}
```

### Handler API

#### UI Handlers

```rust
// Setup UI event handlers
pub fn setup_ui_handlers(window: &mut webui::Window);

// Setup counter handlers
pub fn setup_counter_handlers(window: &mut webui::Window);

// Setup database handlers
pub fn setup_db_handlers(window: &mut webui::Window);

// Setup system info handlers
pub fn setup_sysinfo_handlers(window: &mut webui::Window);

// Setup utility handlers
pub fn setup_utils_handlers(window: &mut webui::Window);

// Setup advanced handlers
pub fn setup_advanced_handlers(window: &mut webui::Window);

// Setup enhanced handlers
pub fn setup_enhanced_handlers(window: &mut webui::Window);
```

#### Handler Functions

```rust
// Counter handlers
pub fn increment_counter(event: webui::Event);
pub fn reset_counter(event: webui::Event);
pub fn get_counter_value(event: webui::Event);

// Database handlers
pub fn get_users(event: webui::Event);
pub fn get_db_stats(event: webui::Event);

// System info handlers
pub fn get_system_info(event: webui::Event);

// Utility handlers
pub fn open_folder(event: webui::Event);
pub fn organize_images(event: webui::Event);
```

## Frontend API

### Event Bus API

#### EventBus

Frontend event management.

```typescript
export class EventBus {
  private static instance: EventBus;
  
  static getInstance(): EventBus;
  
  emit(eventType: AppEventType, payload: any): void;
  subscribe(eventType: AppEventType, callback: (event: Event) => void): () => void;
  unsubscribe(eventType: AppEventType, token: string): void;
}
```

#### AppEventType

```typescript
export enum AppEventType {
  APP_START = 'app.start',
  APP_SHUTDOWN = 'app.shutdown',
  UI_READY = 'ui.ready',
  BACKEND_CONNECTED = 'backend.connected',
  BACKEND_DISCONNECTED = 'backend.disconnected',
  DATA_CHANGED = 'data.changed',
  WINDOW_STATE_CHANGE = 'window.state.change',
}
```

#### Hooks

```typescript
// Subscribe to events
export function useEventBus<T>(
  eventType: AppEventType,
  callback: (event: Event<T>) => void
): void;

// Emit events
export function useEventEmitter(): (eventType: AppEventType, payload: any) => void;
```

### Communication Bridge API

#### CommunicationBridge

WebSocket connection management.

```typescript
export class CommunicationBridge {
  private static instance: CommunicationBridge;
  
  static getInstance(): CommunicationBridge;
  
  // Call backend function
  call(functionName: string, data?: any): Promise<any>;
  
  // Subscribe to backend events
  subscribe(handler: (event: any) => void): void;
  
  // Connection status
  isConnected(): boolean;
  getConnectionState(): ConnectionState;
  getReadyState(): number;
  getLastError(): Error | null;
}
```

#### Connection State

```typescript
export interface ConnectionState {
  state: 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';
  reconnectAttempts: number;
}
```

### Window Manager API

#### WindowManager

WinBox.js window management.

```typescript
export class WindowManager {
  private windows: Map<string, WindowInfo>;
  
  // Register window
  registerWindow(id: string, title: string, winboxInstance: any): WindowInfo;
  
  // Get windows
  getFocusedWindow(): WindowInfo | null;
  getAllWindows(): WindowInfo[];
  getWindowById(id: string): WindowInfo | null;
  
  // Window operations
  focusWindow(id: string): void;
  blurWindow(id: string): void;
  minimizeWindow(id: string): void;
  restoreWindow(id: string): void;
  maximizeWindow(id: string): void;
  closeWindow(id: string): void;
}
```

#### WindowInfo

```typescript
export interface WindowInfo {
  id: string;
  title: string;
  minimized: boolean;
  maximized?: boolean;
  focused: boolean;
  winboxInstance: any;
  createdAt: number;
}
```

### Logger API

#### Logger

Logging utility.

```typescript
export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}
```

### Global Error Handler API

#### GlobalErrorHandler

Global error handling setup.

```typescript
export function initGlobalErrorHandlers(): void;

export class ErrorBoundary extends Component<Props, State> {
  // React error boundary component
}
```

## WebSocket Message Format

### Request

```typescript
{
  id: string;           // Unique message ID
  name: string;         // Function name
  payload: any;         // Function parameters
  timestamp: number;    // Unix timestamp in milliseconds
  source: 'frontend';   // Message source
}
```

### Response

```typescript
{
  id: string;           // Original message ID
  name: string;         // Function name
  payload: {
    success: boolean;   // Operation success
    data?: any;         // Response data
    error?: string;     // Error message if failed
  };
  timestamp: number;    // Unix timestamp in milliseconds
  source: 'backend';    // Message source
}
```

## Event Payloads

### App Start

```typescript
{
  timestamp: number;
  platform: 'frontend';
  userAgent: string;
}
```

### UI Ready

```typescript
{
  timestamp: number;
  message: string;
}
```

### Backend Connected

```typescript
{
  message: string;
}
```

### Data Changed

```typescript
{
  table: string;
  count: number;
  action: 'created' | 'updated' | 'deleted' | 'loaded';
}
```

### Window State Change

```typescript
{
  id: string;
  title: string;
  action: 'focused' | 'blurred' | 'minimized' | 'restored' | 'maximized' | 'closed';
  focused: boolean;
  minimized: boolean;
  maximized: boolean;
  timestamp: number;
  totalWindows: number;
}
```

## Error Codes

### Backend Errors

| Code | Description |
|------|-------------|
| 1000 | Entity not found |
| 1001 | Validation failed |
| 1002 | Business rule violation |
| 2000 | Database error |
| 2001 | Connection failed |
| 2002 | Timeout |
| 2003 | Serialization error |
| 3000 | Command failed |
| 3001 | Query failed |
| 4000 | UI error |
| 4001 | Communication error |

### Frontend Errors

| Error Type | Description |
|------------|-------------|
| CONNECTION_ERROR | WebSocket connection failed |
| TIMEOUT_ERROR | Request timeout |
| PARSE_ERROR | Response parsing failed |
| VALIDATION_ERROR | Input validation failed |
| UNKNOWN_ERROR | Unknown error |

## Next Steps

- Read the [Getting Started Guide](./01-getting-started.md) for setup
- Read the [Development Guide](./03-development.md) for development workflows
- Read the [Deployment Guide](./05-deployment.md) for production deployment
