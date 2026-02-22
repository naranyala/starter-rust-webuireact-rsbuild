# API Reference

This document provides comprehensive API documentation for backend and frontend.

## Backend API

### Configuration API

#### AppConfig

Main configuration structure loaded from app.config.toml.

```rust
pub struct AppConfig {
    pub app: AppSettings,
    pub database: DatabaseSettings,
    pub window: WindowSettings,
    pub logging: LoggingSettings,
}
```

#### AppSettings

```rust
pub struct AppSettings {
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
}
```

#### DatabaseSettings

```rust
pub struct DatabaseSettings {
    pub path: String,
    pub create_sample_data: Option<bool>,
}
```

#### WindowSettings

```rust
pub struct WindowSettings {
    pub title: String,
    pub width: i32,
    pub height: i32,
    pub min_width: i32,
    pub min_height: i32,
    pub resizable: bool,
}
```

#### LoggingSettings

```rust
pub struct LoggingSettings {
    pub level: String,
    pub file: String,
    pub append: Option<bool>,
    pub webui_verbose: bool,
}
```

#### AppConfig Methods

```rust
impl AppConfig {
    /// Load configuration from file
    pub fn load() -> Result<Self, Box<dyn std::error::Error>>;

    /// Get default configuration
    pub fn default() -> Self;

    /// Getters
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

SQLite database wrapper with connection management.

```rust
pub struct Database {
    connection: Arc<Mutex<Connection>>,
}
```

#### Database Methods

```rust
impl Database {
    /// Create new database connection
    pub fn new(db_path: &str) -> Result<Self, Box<dyn std::error::Error>>;

    /// Initialize database schema
    pub fn init(&self) -> Result<(), Box<dyn std::error::Error>>;

    /// Insert sample data if not exists
    pub fn insert_sample_data(&self) -> Result<(), Box<dyn std::error::Error>>;

    /// Get all users
    pub fn get_all_users(&self) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>>;

    /// Get database statistics
    pub fn get_db_stats(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>>;
}
```

### Event Bus API

#### EventBus

Publish-subscribe event system for inter-component communication.

```rust
pub struct EventBus {
    subscribers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
    broadcast_sender: broadcast::Sender<Event>,
}
```

#### Event

```rust
pub struct Event {
    pub id: String,
    pub name: String,
    pub payload: serde_json::Value,
    pub source: String,
}
```

#### EventBus Methods

```rust
impl EventBus {
    /// Get global event bus instance
    pub fn global() -> Arc<EventBus>;

    /// Check if event bus is initialized
    pub fn is_initialized() -> bool;

    /// Emit an event
    pub async fn emit(&self, event: Event) -> Result<(), Box<dyn std::error::Error>>;

    /// Emit a simple event
    pub async fn emit_simple(
        &self, 
        name: &str, 
        payload: serde_json::Value
    ) -> Result<(), Box<dyn std::error::Error>>;

    /// Subscribe to events
    pub fn subscribe<F>(
        &self, 
        event_name: &str, 
        handler: F
    ) -> Result<(), Box<dyn std::error::Error>>
    where
        F: Fn(&Event) -> Result<(), Box<dyn std::error::Error + Send + Sync>> 
            + Send + Sync + 'static;

    /// Listen for events
    pub async fn listen(&self) -> broadcast::Receiver<Event>;
}
```

#### AppEventType

Predefined event types for type-safe event handling.

```rust
pub enum AppEventType {
    UserLogin,
    UserLogout,
    DataChanged,
    CounterIncremented,
    DatabaseOperation,
    SystemHealthCheck,
    FrontendConnected,
    FrontendDisconnected,
    WindowStateChanged,
}

impl ToString for AppEventType {
    fn to_string(&self) -> String;
}
```

### WebSocket API

#### WebSocketHandler

WebSocket server for real-time bidirectional communication.

```rust
pub struct WebSocketHandler {
    event_bus: Arc<EventBus>,
    connection_notify: Arc<Notify>,
}
```

#### WebSocketEvent

```rust
pub struct WebSocketEvent {
    pub id: String,
    pub name: String,
    pub payload: serde_json::Value,
    pub timestamp: u64,
    pub source: String,
}
```

#### WebSocketHandler Methods

```rust
impl WebSocketHandler {
    pub fn new(event_bus: Arc<EventBus>) -> Self;

    pub async fn start_server(
        &self, 
        addr: &str
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
}
```

#### Connection States

```rust
pub enum ConnectionState {
    Initialized,
    TcpConnecting,
    TcpConnected,
    HandshakeInitiated,
    HandshakeCompleted,
    Authenticating,
    Authenticated,
    Ready,
    Processing,
    Sending,
    Receiving,
    Closing,
    Closed,
    Error(ConnectionError),
    Terminated,
}
```

#### Connection Errors

```rust
pub enum ConnectionError {
    TcpBindFailed(String),
    TcpAcceptFailed(String),
    HandshakeTimeout,
    HandshakeFailed(String),
    InvalidMessage(String),
    SerializationError(String),
    SendError(String),
    ReceiveError(String),
    ChannelClosed,
    Unknown(String),
}
```

### Handler API

#### UI Handlers

```rust
/// Setup basic UI event handlers
pub fn setup_ui_handlers(window: &mut webui::Window);

/// Setup counter-specific handlers
pub fn setup_counter_handlers(window: &mut webui::Window);

/// Setup database handlers
pub fn setup_db_handlers(window: &mut webui::Window);

/// Setup system info handlers
pub fn setup_sysinfo_handlers(window: &mut webui::Window);

/// Setup utility handlers
pub fn setup_utils_handlers(window: &mut webui::Window);

/// Setup advanced handlers
pub fn setup_advanced_handlers(window: &mut webui::Window);

/// Setup enhanced handlers
pub fn setup_enhanced_handlers(window: &mut webui::Window);
```

#### Database Handlers

Bound events:
- get_users: Retrieve all users from database
- get_db_stats: Get database statistics

#### System Info Handlers

Bound events:
- get_system_info: Get system information

#### Utility Handlers

Bound events:
- open_folder: Open folder dialog
- organize_images: Organize images utility

### DevTools API

#### DevToolsApi

API for exposing backend internals to frontend devtools.

```rust
pub struct DevToolsApi {
    start_time: DateTime<Utc>,
}
```

#### DevToolsApi Methods

```rust
impl DevToolsApi {
    pub fn new() -> Self;

    /// Get system metrics
    pub fn get_system_metrics(&self) -> SystemMetrics;

    /// Get configuration snapshot
    pub fn get_config(&self) -> ConfigSnapshot;

    /// Get active WebSocket connections
    pub fn get_websocket_connections(&self) -> Vec<WebSocketConnectionInfo>;

    /// Get recent errors
    pub fn get_recent_errors(&self) -> Vec<DevToolsErrorEntry>;

    /// Execute a command
    pub fn execute_command(
        &self, 
        command: &str, 
        args: serde_json::Value
    ) -> serde_json::Value;
}
```

#### SystemMetrics

```rust
pub struct SystemMetrics {
    pub timestamp: DateTime<Utc>,
    pub uptime_secs: u64,
    pub memory: MemoryMetrics,
    pub connections: ConnectionMetrics,
    pub database: DatabaseMetrics,
    pub events: EventMetrics,
}
```

## Frontend API

### Event Bus API

#### EventBus

Frontend event management singleton.

```typescript
export class EventBus {
  private subscribers: Map<string, Set<EventHandler>>;
  private broadcastCallbacks: Set<EventHandler>;

  /// Subscribe to specific event
  subscribe(eventName: string, handler: EventHandler): () => void;

  /// Subscribe to all events
  subscribeAll(handler: EventHandler): () => void;

  /// Emit event
  emit(eventName: string, payload: EventPayload, source?: string): void;

  /// Emit simple event
  emitSimple(eventName: string, payload: EventPayload): void;
}
```

#### Event

```typescript
export interface Event {
  id: string;
  name: string;
  payload: EventPayload;
  timestamp: number;
  source: string;
}
```

#### AppEventType

```typescript
export enum AppEventType {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  DATA_CHANGED = 'data.changed',
  COUNTER_INCREMENTED = 'counter.incremented',
  DATABASE_OPERATION = 'database.operation',
  SYSTEM_HEALTH_CHECK = 'system.health.check',
  BACKEND_CONNECTED = 'backend.connected',
  BACKEND_DISCONNECTED = 'backend.disconnected',
  BACKEND_CONNECTION_STATE = 'backend.connection_state',
  BACKEND_ERROR = 'backend.error',
  APP_START = 'app.start',
  APP_SHUTDOWN = 'app.shutdown',
  UI_READY = 'ui.ready',
  WINDOW_STATE_CHANGED = 'window.state.changed',
}
```

#### Event Hooks

```typescript
/// Subscribe to events in React components
export function useEventBus(
  eventName: string, 
  handler: EventHandler
): void;

/// Emit events from React components
export function useEventEmitter(): (
  eventName: string, 
  payload?: EventPayload
) => void;
```

### Communication Bridge API

#### CommunicationBridge

WebSocket connection management for backend communication.

```typescript
export class CommunicationBridge {
  private ws: WebSocket | null;
  private connectionState: ConnectionState;
  private reconnectAttempts: number;
  private stats: ConnectionStats;

  /// Call backend function
  sendToBackend(eventType: string, payload: any): boolean;

  /// Check connection status
  isConnectedToBackend(): boolean;

  /// Get connection state
  getConnectionState(): ConnectionState;

  /// Get connection status
  getConnectionStatus(): {
    connected: boolean;
    state: ConnectionState;
    url: string;
    attempts: number;
    stats: ConnectionStats;
    lastError: ConnectionError | null;
  };

  /// Get statistics
  getStats(): ConnectionStats;

  /// Manual reconnect
  reconnect(): void;

  /// Manual disconnect
  disconnect(): void;

  /// Get last error
  getLastError(): ConnectionError | null;
}
```

#### Connection State

```typescript
export enum ConnectionState {
  UNINSTANTIATED = 'uninstantiated',
  CONNECTING = 'connecting',
  OPEN = 'open',
  READY = 'ready',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}
```

#### Error Type

```typescript
export enum ErrorType {
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  TRANSPORT_ERROR = 'TRANSPORT_ERROR',
  SOCKET_ERROR = 'SOCKET_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}
```

#### Connection Error

```typescript
export interface ConnectionError {
  type: ErrorType;
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
}
```

#### Connection Stats

```typescript
export interface ConnectionStats {
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  errorsCount: number;
  reconnects: number;
  connectAttempts: number;
  lastMessageAt: number | null;
  lastError: ConnectionError | null;
  connectionStartTime: number;
}
```

#### Helper Functions

```typescript
/// Initialize communication bridge
export function initCommunicationBridge(
  backendUrl?: string
): CommunicationBridge;

/// Get communication bridge instance
export function getCommunicationBridge(): CommunicationBridge | null;

/// Send event to backend
export function sendEventToBackend(
  eventType: string, 
  payload: any
): void;

/// Check backend connection
export function isBackendConnected(): boolean;

/// Get backend connection status
export function getBackendConnectionStatus(): {
  connected: boolean;
  state: ConnectionState;
  url: string;
  attempts: number;
  stats: ConnectionStats;
  lastError: ConnectionError | null;
} | null;
```

### Error Logger API

#### ErrorLogger

Comprehensive error logging for frontend.

```typescript
export class ErrorLoggerClass {
  /// Log error with context
  logError(
    category: string,
    error: Error | string,
    context?: ErrorContext,
    severity?: ErrorSeverity,
    suggestion?: string
  ): string;

  /// Log with automatic context
  logErrorAuto(
    category: string,
    error: Error,
    suggestion?: string
  ): string;

  /// Log network errors
  logNetworkError(
    operation: string,
    error: Error | unknown,
    url?: string
  ): string;

  /// Log API errors
  logApiError(
    endpoint: string,
    status: number,
    statusText: string,
    responseBody?: string
  ): string;

  /// Get error history
  getHistory(): ErrorLogEntry[];

  /// Clear error history
  clearHistory(): void;

  /// Get errors by severity
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[];

  /// Export errors
  exportErrors(): string;
}
```

#### Error Context

```typescript
export interface ErrorContext {
  module?: string;
  function?: string;
  file?: string;
  line?: number;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}
```

#### Error Severity

```typescript
export type ErrorSeverity = 
  | 'debug' 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'critical' 
  | 'fatal';
```

#### Error Log Entry

```typescript
export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: string;
  message: string;
  context: ErrorContext;
  stack?: string;
  source?: string;
  suggestion?: string;
}
```

### Logger API

#### Logger

Logging utility for frontend.

```typescript
export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}
```

## WebSocket Protocol

### Request Message Format

```typescript
{
  id: string;           // Unique message ID (random string)
  name: string;         // Function/event name
  payload: any;         // Function parameters
  timestamp: number;    // Unix timestamp in milliseconds
  source: 'frontend';   // Message source
}
```

### Response Message Format

```typescript
{
  id: string;           // Original message ID
  name: string;         // Function/event name
  payload: {
    success: boolean;   // Operation success status
    data?: any;         // Response data
    error?: string;     // Error message if failed
  };
  timestamp: number;    // Unix timestamp in milliseconds
  source: 'backend';    // Message source
}
```

### Event Message Format

```typescript
{
  id: string;           // Unique event ID
  name: string;         // Event name
  payload: any;         // Event data
  timestamp: number;    // Unix timestamp in milliseconds
  source: 'backend' | 'frontend';
}
```

## Event Payloads

### App Start Event

```typescript
{
  timestamp: number;
  platform: 'frontend';
  userAgent: string;
}
```

### UI Ready Event

```typescript
{
  timestamp: number;
  message: string;
}
```

### Backend Connected Event

```typescript
{
  message: string;
  timestamp: number;
  url: string;
}
```

### Data Changed Event

```typescript
{
  table: string;
  count: number;
  action: 'created' | 'updated' | 'deleted' | 'loaded';
}
```

### Window State Changed Event

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

### Database Operation Event

```typescript
{
  operation: string;
  table?: string;
  count?: number;
  error?: string;
}
```

## Error Codes

### Backend Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1000 | ENTITY_NOT_FOUND | Requested entity does not exist |
| 1001 | VALIDATION_FAILED | Input validation failed |
| 1002 | BUSINESS_RULE_VIOLATION | Business rule violated |
| 1003 | INVALID_STATE_TRANSITION | Invalid state change |
| 2000 | DATABASE_ERROR | Database operation failed |
| 2001 | CONNECTION_FAILED | Connection establishment failed |
| 2002 | TIMEOUT | Operation timed out |
| 2003 | SERIALIZATION_ERROR | Data serialization failed |
| 3000 | COMMAND_FAILED | Command execution failed |
| 3001 | QUERY_FAILED | Query execution failed |
| 3002 | HANDLER_ERROR | Handler execution failed |
| 4000 | UI_ERROR | UI operation failed |
| 4001 | COMMUNICATION_ERROR | Communication failed |
| 5000 | PLUGIN_ERROR | Plugin operation failed |
| 5001 | PLUGIN_NOT_FOUND | Plugin not found |
| 5002 | PLUGIN_CAPABILITY_NOT_FOUND | Plugin capability not found |
| 9999 | UNKNOWN | Unknown error |

### Frontend Error Types

| Type | Description |
|------|-------------|
| CONNECTION_REFUSED | WebSocket connection refused |
| CONNECTION_TIMEOUT | Connection attempt timed out |
| PROTOCOL_ERROR | WebSocket protocol violation |
| SERIALIZATION_ERROR | Message serialization failed |
| TRANSPORT_ERROR | Network transport error |
| SOCKET_ERROR | WebSocket socket error |
| PARSE_ERROR | Response parsing failed |
| TIMEOUT | Request timeout |
| UNKNOWN | Unknown error |

## HTTP API Endpoints

### DevTools Endpoints

#### GET /api/devtools/metrics

Returns system metrics.

Response:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime_secs": 3600,
  "memory": {
    "process_memory_mb": 50.5,
    "available_system_mb": 8192
  },
  "connections": {
    "websocket_active": 1,
    "http_requests_total": 100
  },
  "database": {
    "tables": [
      {"name": "users", "row_count": 4}
    ],
    "total_records": 4
  },
  "events": {
    "total_emitted": 50,
    "recent_events": []
  }
}
```

#### GET /api/devtools/health

Returns health status.

Response:
```json
{
  "status": "healthy",
  "uptime_secs": 3600,
  "version": "1.0.0"
}
```

#### GET /api/devtools/info

Returns application info.

Response:
```json
{
  "rust_version": "1.0.0",
  "debug": false
}
```

## Next Steps

- Read the [Getting Started Guide](./01-getting-started.md) for setup
- Read the [Development Guide](./03-development.md) for development workflows
- Read the [Deployment Guide](./05-deployment.md) for production deployment
