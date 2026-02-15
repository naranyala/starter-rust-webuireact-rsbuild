use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, Notify};
use tokio_tungstenite::{accept_async, tungstenite::Result};
use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::time::timeout;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{info, error, debug, warn, trace};
use crate::infrastructure::event_bus::{EventBus, Event};
use crate::viewmodel::handlers::DATABASE;
use crate::viewmodel::window_logger::window_logger;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketEvent {
    pub id: String,
    pub name: String,
    pub payload: Value,
    pub timestamp: u64,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketError {
    pub id: String,
    pub error_type: String,
    pub message: String,
    pub details: Option<Value>,
    pub timestamp: u64,
}

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

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct StateTransition {
    pub from: ConnectionState,
    pub to: ConnectionState,
    pub timestamp: Instant,
    pub reason: Option<String>,
}

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

pub struct WebSocketHandler {
    event_bus: Arc<EventBus>,
    connection_notify: Arc<Notify>,
}

impl WebSocketHandler {
    pub fn new(event_bus: Arc<EventBus>) -> Self {
        Self {
            event_bus,
            connection_notify: Arc::new(Notify::new()),
        }
    }

    pub async fn start_server(&self, addr: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let listener = TcpListener::bind(addr).await?;
        info!("WebSocket server starting on {}", addr);

        loop {
            match listener.accept().await {
                Ok(stream) => {
                    let event_bus = self.event_bus.clone();
                    let notify = self.connection_notify.clone();

                    tokio::spawn(async move {
                        let tcp_stream = stream.0;
                        if let Err(e) = Self::handle_connection(tcp_stream, event_bus, notify).await {
                            error!("Error handling WebSocket connection: {}", e);
                        }
                    });
                }
                Err(e) => {
                    error!("Failed to accept TCP connection: {}", e);
                }
            }
        }
    }

    fn transition_state(state: &mut ConnectionState, new_state: ConnectionState, stats: &mut ConnectionStats, reason: Option<String>) {
        let old_state = state.clone();
        *state = new_state.clone();
        
        stats.state_history.push(StateTransition {
            from: old_state,
            to: new_state.clone(),
            timestamp: Instant::now(),
            reason,
        });
        
        trace!("State transition: {:?} -> {:?}", state, new_state);
    }

    async fn handle_connection(
        stream: TcpStream,
        event_bus: Arc<EventBus>,
        connection_notify: Arc<Notify>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut stats = ConnectionStats::default();
        let mut state = ConnectionState::Initialized;
        
        info!("Accepting new TCP connection from {:?}", stream.peer_addr());
        Self::transition_state(&mut state, ConnectionState::TcpConnecting, &mut stats, Some("TCP connection started".to_string()));

        // Set up TCP stream with timeouts
        if let Err(e) = stream.set_nodelay(true) {
            error!("Failed to set TCP_NODELAY: {}", e);
            stats.errors_count += 1;
            Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::TcpSetNodelayFailed(e.to_string())), &mut stats, Some(e.to_string()));
            return Err(Box::new(e));
        }
        
        Self::transition_state(&mut state, ConnectionState::TcpConnected, &mut stats, Some("TCP connected".to_string()));

        // Accept WebSocket handshake with timeout
        Self::transition_state(&mut state, ConnectionState::HandshakeInitiated, &mut stats, Some("WebSocket handshake started".to_string()));
        
        let ws_stream_result = timeout(
            Duration::from_secs(10),
            accept_async(stream)
        ).await;

        let ws_stream = match ws_stream_result {
            Ok(Ok(stream)) => {
                Self::transition_state(&mut state, ConnectionState::HandshakeCompleted, &mut stats, Some("Handshake completed".to_string()));
                info!("WebSocket handshake completed successfully, state: {:?}", state);
                stream
            }
            Ok(Err(e)) => {
                error!("WebSocket handshake failed: {}", e);
                stats.errors_count += 1;
                Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::HandshakeFailed(e.to_string())), &mut stats, Some(e.to_string()));
                return Err(Box::new(e));
            }
            Err(_) => {
                error!("WebSocket handshake timed out after 10 seconds");
                stats.errors_count += 1;
                Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::HandshakeTimeout), &mut stats, Some("Handshake timeout".to_string()));
                return Err("Handshake timeout".into());
            }
        };

        let (mut sink, mut stream) = ws_stream.split();

        // Channel for broadcasting events from event bus to this connection
        let (tx, mut rx) = mpsc::unbounded_channel();

        // Spawn a task to listen for events from the event bus and forward them to this connection
        let event_bus_clone = event_bus.clone();
        let event_forwarder_handle = tokio::spawn(async move {
            let mut receiver = event_bus_clone.listen().await;
            loop {
                match receiver.recv().await {
                    Ok(event) => {
                        if event.source != "frontend" {
                            let ws_event = WebSocketEvent {
                                id: event.id,
                                name: event.name,
                                payload: event.payload,
                                timestamp: std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap()
                                    .as_millis() as u64,
                                source: event.source,
                            };

                            match serde_json::to_string(&ws_event) {
                                Ok(json_str) => {
                                    if tx.send(tungstenite::Message::Text(json_str.into())).is_err() {
                                        debug!("Event bus receiver dropped, stopping event forwarding");
                                        break;
                                    }
                                }
                                Err(e) => {
                                    error!("Failed to serialize event to JSON: {}", e);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        error!("Event bus receiver error: {}", e);
                        break;
                    }
                }
            }
        });

        // Update state to authenticated (no authentication in this implementation, but showing the state flow)
        Self::transition_state(&mut state, ConnectionState::Authenticated, &mut stats, Some("Connection authenticated".to_string()));
        Self::transition_state(&mut state, ConnectionState::Ready, &mut stats, Some("Connection ready".to_string()));

        // Main message processing loop with comprehensive error handling
        let idle_timeout_duration = Duration::from_secs(300);
        let mut last_activity = Instant::now();

        loop {
            // Update state to receiving before waiting for messages
            Self::transition_state(&mut state, ConnectionState::Receiving, &mut stats, Some("Waiting for message".to_string()));
            
            tokio::select! {
                msg = stream.next() => {
                    last_activity = Instant::now();
                    
                    match msg {
                        Some(Ok(msg)) => {
                            stats.messages_received += 1;
                            stats.bytes_received += msg.len() as u64;
                            trace!("Received WebSocket message: {:?}", msg);

                            match msg {
                                tungstenite::Message::Text(text) => {
                                    debug!("Processing text message: {} chars", text.len());
                                    Self::transition_state(&mut state, ConnectionState::Processing, &mut stats, Some("Processing text message".to_string()));

                                    match serde_json::from_str::<WebSocketEvent>(&text) {
                                        Ok(ws_event) => {
                                            debug!("Received WebSocket event: {} from {}", ws_event.name, ws_event.source);

                                            // Process the function call asynchronously to avoid blocking
                                            let event_name = ws_event.name.clone();
                                            let event_payload = ws_event.payload.clone();
                                            let event_id = ws_event.id.clone();

                                            // Handle the function call and send response if needed
                                            let response = Self::handle_function_call(&event_name, &event_payload).await;

                                            if let Some(resp) = response {
                                                Self::transition_state(&mut state, ConnectionState::Sending, &mut stats, Some("Sending response".to_string()));
                                                let resp_event = WebSocketEvent {
                                                    id: event_id,
                                                    name: event_name,
                                                    payload: resp,
                                                    timestamp: std::time::SystemTime::now()
                                                        .duration_since(std::time::UNIX_EPOCH)
                                                        .unwrap()
                                                        .as_millis() as u64,
                                                    source: "backend".to_string(),
                                                };

                                                match serde_json::to_string(&resp_event) {
                                                    Ok(json_str) => {
                                                        stats.bytes_sent += json_str.len() as u64;
                                                        if let Err(e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                                            error!("Error sending response: {}", e);
                                                            stats.errors_count += 1;
                                                            Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::SendError(e.to_string())), &mut stats, Some(e.to_string()));
                                                            break;
                                                        }
                                                        stats.messages_sent += 1;
                                                    }
                                                    Err(e) => {
                                                        error!("Failed to serialize response: {}", e);
                                                        stats.errors_count += 1;
                                                        Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::SerializationError(e.to_string())), &mut stats, Some(e.to_string()));
                                                        break;
                                                    }
                                                }
                                                Self::transition_state(&mut state, ConnectionState::Ready, &mut stats, Some("Response sent, ready".to_string()));
                                            }

                                            // Emit the event to the event bus for other parts of the application
                                            let event = Event::new(
                                                ws_event.name,
                                                ws_event.payload,
                                                ws_event.source,
                                            );

                                            if let Err(e) = event_bus.emit(event).await {
                                                error!("Error emitting event to event bus: {}", e);
                                            }
                                        }
                                        Err(parse_error) => {
                                            error!("Failed to parse WebSocket message: {} - Raw: {:.100}", parse_error, text);
                                            stats.errors_count += 1;

                                            // Send error response back to client
                                            let error_response = WebSocketError {
                                                id: "parse_error".to_string(),
                                                error_type: "JSON_PARSE_ERROR".to_string(),
                                                message: "Invalid JSON format".to_string(),
                                                details: Some(serde_json::json!({
                                                    "raw_message": text.chars().take(200).collect::<String>(),
                                                    "parse_error": parse_error.to_string()
                                                })),
                                                timestamp: std::time::SystemTime::now()
                                                    .duration_since(std::time::UNIX_EPOCH)
                                                    .unwrap()
                                                    .as_millis() as u64,
                                            };

                                            match serde_json::to_string(&error_response) {
                                                Ok(json_str) => {
                                                    if let Err(e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                                        error!("Error sending error response: {}", e);
                                                    }
                                                }
                                                Err(e) => {
                                                    error!("Failed to serialize error response: {}", e);
                                                }
                                            }
                                        }
                                    }
                                }
                                tungstenite::Message::Binary(data) => {
                                    debug!("Processing binary message: {} bytes", data.len());
                                    stats.bytes_received += data.len() as u64;
                                    Self::transition_state(&mut state, ConnectionState::Processing, &mut stats, Some("Processing binary message".to_string()));
                                    
                                    // For now, treat binary data as a UTF-8 string if possible
                                    match String::from_utf8(data.to_vec()) {
                                        Ok(text) => {
                                            // Try to parse as JSON
                                            match serde_json::from_str::<WebSocketEvent>(&text) {
                                                Ok(ws_event) => {
                                                    debug!("Received WebSocket event from binary: {} from {}", ws_event.name, ws_event.source);

                                                    // Process the function call asynchronously to avoid blocking
                                                    let event_name = ws_event.name.clone();
                                                    let event_payload = ws_event.payload.clone();
                                                    let event_id = ws_event.id.clone();

                                                    // Handle the function call and send response if needed
                                                    let response = Self::handle_function_call(&event_name, &event_payload).await;

                                                    if let Some(resp) = response {
                                                        Self::transition_state(&mut state, ConnectionState::Sending, &mut stats, Some("Sending binary response".to_string()));
                                                        let resp_event = WebSocketEvent {
                                                            id: event_id,
                                                            name: event_name,
                                                            payload: resp,
                                                            timestamp: std::time::SystemTime::now()
                                                                .duration_since(std::time::UNIX_EPOCH)
                                                                .unwrap()
                                                                .as_millis() as u64,
                                                            source: "backend".to_string(),
                                                        };

                                                        match serde_json::to_string(&resp_event) {
                                                            Ok(json_str) => {
                                                                stats.bytes_sent += json_str.len() as u64;
                                                                if let Err(e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                                                    error!("Error sending response: {}", e);
                                                                    stats.errors_count += 1;
                                                                    Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::SendError(e.to_string())), &mut stats, Some(e.to_string()));
                                                                    break;
                                                                }
                                                                stats.messages_sent += 1;
                                                            }
                                                            Err(e) => {
                                                                error!("Failed to serialize response: {}", e);
                                                                stats.errors_count += 1;
                                                                Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::SerializationError(e.to_string())), &mut stats, Some(e.to_string()));
                                                                break;
                                                            }
                                                        }
                                                        Self::transition_state(&mut state, ConnectionState::Ready, &mut stats, Some("Binary response sent".to_string()));
                                                    }

                                                    // Emit the event to the event bus for other parts of the application
                                                    let event = Event::new(
                                                        ws_event.name,
                                                        ws_event.payload,
                                                        ws_event.source,
                                                    );

                                                    if let Err(e) = event_bus.emit(event).await {
                                                        error!("Error emitting event to event bus: {}", e);
                                                    }
                                                }
                                                Err(parse_error) => {
                                                    error!("Failed to parse binary WebSocket message as JSON: {}", parse_error);
                                                    stats.errors_count += 1;
                                                    // Send error response back to client
                                                    let error_response = WebSocketError {
                                                        id: "binary_parse_error".to_string(),
                                                        error_type: "BINARY_PARSE_ERROR".to_string(),
                                                        message: "Invalid binary data format".to_string(),
                                                        details: Some(serde_json::json!({
                                                            "binary_length": text.len(),
                                                            "parse_error": parse_error.to_string()
                                                        })),
                                                        timestamp: std::time::SystemTime::now()
                                                            .duration_since(std::time::UNIX_EPOCH)
                                                            .unwrap()
                                                            .as_millis() as u64,
                                                    };

                                                    match serde_json::to_string(&error_response) {
                                                        Ok(json_str) => {
                                                            if let Err(e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                                                error!("Error sending binary error response: {}", e);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            error!("Failed to serialize binary error response: {}", e);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        Err(utf8_error) => {
                                            error!("Binary data is not valid UTF-8: {}", utf8_error);
                                            stats.errors_count += 1;
                                            // Send error response back to client
                                            let error_response = WebSocketError {
                                                id: "utf8_error".to_string(),
                                                error_type: "UTF8_DECODE_ERROR".to_string(),
                                                message: "Binary data is not valid UTF-8".to_string(),
                                                details: Some(serde_json::json!({
                                                    "decode_error": utf8_error.to_string()
                                                })),
                                                timestamp: std::time::SystemTime::now()
                                                    .duration_since(std::time::UNIX_EPOCH)
                                                    .unwrap()
                                                    .as_millis() as u64,
                                            };

                                            match serde_json::to_string(&error_response) {
                                                Ok(json_str) => {
                                                    if let Err(e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                                        error!("Error sending UTF-8 error response: {}", e);
                                                    }
                                                }
                                                Err(e) => {
                                                    error!("Failed to serialize UTF-8 error response: {}", e);
                                                }
                                            }
                                        }
                                    }
                                }
                                tungstenite::Message::Ping(data) => {
                                    debug!("Received ping message with {} bytes", data.len());
                                    Self::transition_state(&mut state, ConnectionState::PingSent, &mut stats, Some("Received ping".to_string()));
                                    // Respond to ping with pong to keep connection alive
                                    Self::transition_state(&mut state, ConnectionState::Sending, &mut stats, Some("Sending pong".to_string()));
                                    match sink.send(tungstenite::Message::Pong(data.into())).await {
                                        Ok(_) => {
                                            trace!("Sent pong response");
                                            stats.messages_sent += 1;
                                            Self::transition_state(&mut state, ConnectionState::PongReceived, &mut stats, Some("Pong sent".to_string()));
                                            Self::transition_state(&mut state, ConnectionState::Ready, &mut stats, Some("Ready after pong".to_string()));
                                        }
                                        Err(e) => {
                                            error!("Error sending pong: {}", e);
                                            stats.errors_count += 1;
                                            Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::SendError(e.to_string())), &mut stats, Some(e.to_string()));
                                            break;
                                        }
                                    }
                                }
                                tungstenite::Message::Pong(_) => {
                                    trace!("Received pong message");
                                    Self::transition_state(&mut state, ConnectionState::PongReceived, &mut stats, Some("Received pong".to_string()));
                                    Self::transition_state(&mut state, ConnectionState::Ready, &mut stats, Some("Ready after pong".to_string()));
                                }
                                tungstenite::Message::Close(frame) => {
                                    info!("Received close frame: {:?}", frame);
                                    Self::transition_state(&mut state, ConnectionState::Closing, &mut stats, Some("Close frame received".to_string()));
                                    break;
                                }
                                tungstenite::Message::Frame(frame) => {
                                    debug!("Received raw frame with {} bytes", frame.len());
                                    Self::transition_state(&mut state, ConnectionState::Processing, &mut stats, Some("Processing raw frame".to_string()));
                                }
                            }
                        }
                        Some(Err(e)) => {
                            error!("WebSocket protocol error: {}", e);
                            stats.errors_count += 1;
                            Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::ProtocolError(e.to_string())), &mut stats, Some(e.to_string()));
                            
                            // Send protocol error to client
                            let error_response = WebSocketError {
                                id: "protocol_error".to_string(),
                                error_type: "PROTOCOL_ERROR".to_string(),
                                message: "WebSocket protocol error".to_string(),
                                details: Some(serde_json::json!({
                                    "error": e.to_string()
                                })),
                                timestamp: std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap()
                                    .as_millis() as u64,
                            };

                            match serde_json::to_string(&error_response) {
                                Ok(json_str) => {
                                    if let Err(close_e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                        error!("Error sending protocol error response: {}", close_e);
                                    }
                                }
                                Err(e) => {
                                    error!("Failed to serialize protocol error response: {}", e);
                                }
                            }

                            break;
                        }
                        None => {
                            info!("WebSocket stream ended normally");
                            Self::transition_state(&mut state, ConnectionState::Closed, &mut stats, Some("Stream ended".to_string()));
                            break;
                        }
                    }
                }
                msg = rx.recv() => {
                    match msg {
                        Some(msg) => {
                            trace!("Forwarding event bus message to WebSocket");
                            Self::transition_state(&mut state, ConnectionState::Sending, &mut stats, Some("Forwarding event".to_string()));
                            last_activity = Instant::now();
                            match sink.send(msg).await {
                                Ok(_) => {
                                    trace!("Event bus message sent successfully");
                                    stats.messages_sent += 1;
                                    Self::transition_state(&mut state, ConnectionState::Ready, &mut stats, Some("Event sent".to_string()));
                                }
                                Err(e) => {
                                    error!("Error forwarding event from event bus: {}", e);
                                    stats.errors_count += 1;
                                    Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::SendError(e.to_string())), &mut stats, Some(e.to_string()));
                                    break;
                                }
                            }
                        }
                        None => {
                            warn!("Event bus channel closed, continuing...");
                            Self::transition_state(&mut state, ConnectionState::Error(ConnectionError::ChannelClosed), &mut stats, Some("Event channel closed".to_string()));
                        }
                    }
                }
                _ = tokio::time::sleep(idle_timeout_duration) => {
                    let idle_duration = last_activity.elapsed();
                    if idle_duration >= idle_timeout_duration {
                        warn!("Connection idle for {} seconds, closing", idle_timeout_duration.as_secs());
                        stats.errors_count += 1;
                        Self::transition_state(&mut state, ConnectionState::Closing, &mut stats, Some("Idle timeout".to_string()));
                        break;
                    }
                }
            };

            // Check if we should break out of the loop due to an error
            if matches!(state, ConnectionState::Error(_) | ConnectionState::Closing | ConnectionState::Closed | ConnectionState::Terminated) {
                if !matches!(state, ConnectionState::Error(_)) {
                    break;
                }
            }
        }

        // Close the WebSocket connection gracefully
        info!("Closing WebSocket connection, final state: {:?}", state);
        info!("Connection stats: messages_sent={}, messages_received={}, bytes_sent={}, bytes_received={}, errors={}, uptime={:?}", 
            stats.messages_sent, stats.messages_received, stats.bytes_sent, stats.bytes_received, stats.errors_count, stats.created_at.elapsed());

        // Attempt to send a close frame if we're not already in an error state
        if !matches!(state, ConnectionState::Error(_)) {
            if let Err(e) = sink.close().await {
                warn!("Error closing WebSocket sink: {}", e);
            }
        }

        // Cancel the event forwarder task
        event_forwarder_handle.abort();

        // Notify that connection is closing
        connection_notify.notify_waiters();

        // Set final state
        if matches!(state, ConnectionState::Error(_)) {
            Self::transition_state(&mut state, ConnectionState::Terminated, &mut stats, Some("Connection terminated due to error".to_string()));
        } else if matches!(state, ConnectionState::Closing) {
            Self::transition_state(&mut state, ConnectionState::Closed, &mut stats, Some("Connection closed gracefully".to_string()));
        }
        
        // Log final state history
        debug!("State transition history: {:?}", stats.state_history);
        info!("WebSocket connection handler finished, final state: {:?}", state);
        Ok(())
    }

    async fn handle_function_call(name: &str, payload: &Value) -> Option<Value> {
        match name {
            "get_users" => {
                match DATABASE.try_lock() {
                    Ok(db_guard) => {
                        if let Some(ref db) = *db_guard {
                            match db.get_all_users() {
                                Ok(users) => {
                                    debug!("Successfully retrieved {} users", users.len());
                                    Some(serde_json::json!({
                                        "success": true,
                                        "data": users
                                    }))
                                }
                                Err(e) => {
                                    error!("Error retrieving users: {}", e);
                                    Some(serde_json::json!({
                                        "success": true,
                                        "data": [], // Return empty array instead of error to prevent UI issues
                                        "error": e.to_string()
                                    }))
                                }
                            }
                        } else {
                            error!("Database not available in get_users");
                            Some(serde_json::json!({
                                "success": true,
                                "data": [],
                                "error": "Database not available"
                            }))
                        }
                    }
                    Err(_) => {
                        error!("Could not acquire database lock for get_users");
                        Some(serde_json::json!({
                            "success": true,
                            "data": [],
                            "error": "Database busy"
                        }))
                    }
                }
            }
            "get_db_stats" => {
                match DATABASE.try_lock() {
                    Ok(db_guard) => {
                        if let Some(ref db) = *db_guard {
                            match db.get_db_stats() {
                                Ok(stats) => {
                                    debug!("Successfully retrieved database stats");
                                    Some(serde_json::json!({
                                        "success": true,
                                        "stats": stats
                                    }))
                                }
                                Err(e) => {
                                    error!("Error retrieving database stats: {}", e);
                                    Some(serde_json::json!({
                                        "success": true,
                                        "stats": { "users": 0, "tables": [] },
                                        "error": e.to_string()
                                    }))
                                }
                            }
                        } else {
                            error!("Database not available in get_db_stats");
                            Some(serde_json::json!({
                                "success": true,
                                "stats": { "users": 0, "tables": [] },
                                "error": "Database not available"
                            }))
                        }
                    }
                    Err(_) => {
                        error!("Could not acquire database lock for get_db_stats");
                        Some(serde_json::json!({
                            "success": true,
                            "stats": { "users": 0, "tables": [] },
                            "error": "Database busy"
                        }))
                    }
                }
            }
            "ui.ready" => {
                // Handle UI ready event from frontend
                debug!("UI ready event received from frontend: {:?}", payload);
                
                // Emit backend connected event to notify frontend that backend is ready
                let event_bus = EventBus::global();
                if let Err(e) = event_bus.emit_simple(
                    "backend.connected",
                    serde_json::json!({
                        "message": "Backend connected and ready"
                    }),
                ).await {
                    error!(error = %e, "Failed to emit backend connected event");
                }

                Some(serde_json::json!({
                    "success": true,
                    "message": "UI ready event processed, backend connected"
                }))
            }
            "window_state_change" | "window.state.change" => {
                // Handle window state change events from frontend
                debug!("Window state change received: {:?}", payload);

                // Use the window logger to handle the state change
                let logger = window_logger();
                let payload_clone = payload.clone(); // Clone the payload to move into async block
                tokio::spawn(async move {
                    logger.log_window_state_change(&payload_clone).await;
                });

                // Return success response
                Some(serde_json::json!({
                    "success": true,
                    "message": "Window state change logged"
                }))
            }
            _ => {
                warn!("Unknown function called: {}", name);
                // For unknown function calls, return an error response
                Some(serde_json::json!({
                    "success": false,
                    "error": format!("Unknown function: {}", name),
                    "function": name
                }))
            }
        }
    }
}

pub async fn start_websocket_server(event_bus: Arc<EventBus>, port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let handler = WebSocketHandler::new(event_bus);
    let addr = format!("127.0.0.1:{}", port);
    handler.start_server(&addr).await
}