//! WebSocket types and data structures

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// WebSocket event message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketEvent {
    pub id: String,
    pub name: String,
    pub payload: Value,
    pub timestamp: u64,
    pub source: String,
}

/// WebSocket error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketError {
    pub id: String,
    pub error_type: String,
    pub message: String,
    pub details: Option<Value>,
    pub timestamp: u64,
}

/// Connection state machine states
#[derive(Debug, Clone, PartialEq)]
#[allow(dead_code)]
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
    PingSent,
    PongReceived,
    Idle,
    Closing,
    Closed,
    Error(ConnectionError),
    Terminated,
}

/// Connection error types
#[derive(Debug, Clone, PartialEq, Serialize)]
#[allow(dead_code)]
pub enum ConnectionError {
    TcpBindFailed(String),
    TcpAcceptFailed(String),
    TcpSetNodelayFailed(String),
    HandshakeTimeout,
    HandshakeFailed(String),
    AuthenticationFailed(String),
    InvalidMessage(String),
    MessageParseError(String),
    SerializationError(String),
    SendError(String),
    ReceiveError(String),
    ProtocolError(String),
    ChannelClosed,
    IdleTimeout,
    Unknown(String),
}

impl std::fmt::Display for ConnectionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConnectionError::TcpBindFailed(s) => write!(f, "TCP bind failed: {}", s),
            ConnectionError::TcpAcceptFailed(s) => write!(f, "TCP accept failed: {}", s),
            ConnectionError::TcpSetNodelayFailed(s) => write!(f, "TCP set nodelay failed: {}", s),
            ConnectionError::HandshakeTimeout => write!(f, "WebSocket handshake timed out"),
            ConnectionError::HandshakeFailed(s) => write!(f, "WebSocket handshake failed: {}", s),
            ConnectionError::AuthenticationFailed(s) => write!(f, "Authentication failed: {}", s),
            ConnectionError::InvalidMessage(s) => write!(f, "Invalid message: {}", s),
            ConnectionError::MessageParseError(s) => write!(f, "Message parse error: {}", s),
            ConnectionError::SerializationError(s) => write!(f, "Serialization error: {}", s),
            ConnectionError::SendError(s) => write!(f, "Send error: {}", s),
            ConnectionError::ReceiveError(s) => write!(f, "Receive error: {}", s),
            ConnectionError::ProtocolError(s) => write!(f, "Protocol error: {}", s),
            ConnectionError::ChannelClosed => write!(f, "Channel closed"),
            ConnectionError::IdleTimeout => write!(f, "Connection idle timeout"),
            ConnectionError::Unknown(s) => write!(f, "Unknown error: {}", s),
        }
    }
}

/// State transition record
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct StateTransition {
    pub from: ConnectionState,
    pub to: ConnectionState,
    pub timestamp: Instant,
    pub reason: Option<String>,
}

use std::time::Instant;

/// Connection statistics
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ConnectionStats {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub errors_count: u64,
    pub reconnects: u64,
    pub state_history: Vec<StateTransition>,
    pub created_at: Instant,
}

impl Default for ConnectionStats {
    fn default() -> Self {
        Self {
            messages_sent: 0,
            messages_received: 0,
            bytes_sent: 0,
            bytes_received: 0,
            errors_count: 0,
            reconnects: 0,
            state_history: Vec::new(),
            created_at: Instant::now(),
        }
    }
}
