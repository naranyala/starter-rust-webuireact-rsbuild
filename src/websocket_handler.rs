use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_tungstenite::{accept_async, tungstenite::Result};
use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{info, error, debug};
use crate::event_bus::{EventBus, Event};
use crate::handlers::DATABASE;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketEvent {
    pub id: String,
    pub name: String,
    pub payload: Value,
    pub timestamp: u64,
    pub source: String,
}

pub struct WebSocketHandler {
    event_bus: Arc<EventBus>,
}

impl WebSocketHandler {
    pub fn new(event_bus: Arc<EventBus>) -> Self {
        Self { event_bus }
    }

    pub async fn start_server(&self, addr: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let listener = TcpListener::bind(addr).await?;
        info!("WebSocket server starting on {}", addr);

        loop {
            let stream = listener.accept().await?;
            let event_bus = self.event_bus.clone();
            
            tokio::spawn(async move {
                let tcp_stream = stream.0;
                if let Err(e) = Self::handle_connection(tcp_stream, event_bus).await {
                    error!("Error handling WebSocket connection: {}", e);
                }
            });
        }
    }

    async fn handle_connection(
        stream: TcpStream,
        event_bus: Arc<EventBus>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let ws_stream = accept_async(stream).await?;
        info!("New WebSocket connection established");

        let (mut sink, mut stream) = ws_stream.split();

        let (tx, mut rx) = mpsc::unbounded_channel();
        
        let event_bus_clone = event_bus.clone();
        
        tokio::spawn(async move {
            let mut receiver = event_bus_clone.listen().await;
            while let Ok(event) = receiver.recv().await {
                if event.source != "frontend" {
                    let ws_event = WebSocketEvent {
                        id: event.id,
                        name: event.name,
                        payload: event.payload,
                        timestamp: event.timestamp,
                        source: event.source,
                    };
                    
                    if let Ok(json_str) = serde_json::to_string(&ws_event) {
                        if tx.send(tungstenite::Message::Text(json_str.into())).is_err() {
                            break;
                        }
                    }
                }
            }
        });

        loop {
            tokio::select! {
                msg = stream.next() => {
                    match msg {
                        Some(Ok(msg)) => {
                            if msg.is_text() || msg.is_binary() {
                                if let Ok(text) = msg.to_text() {
                                    if let Ok(ws_event) = serde_json::from_str::<WebSocketEvent>(text) {
                                        debug!("Received WebSocket event: {} from {}", ws_event.name, ws_event.source);
                                        
                                        let event_name = ws_event.name.clone();
                                        let response = Self::handle_function_call(&event_name, &ws_event.payload);
                                        
                                        if let Some(resp) = response {
                                            let resp_event = WebSocketEvent {
                                                id: ws_event.id,
                                                name: event_name,
                                                payload: resp,
                                                timestamp: std::time::SystemTime::now()
                                                    .duration_since(std::time::UNIX_EPOCH)
                                                    .unwrap()
                                                    .as_millis() as u64,
                                                source: "backend".to_string(),
                                            };
                                            if let Ok(json_str) = serde_json::to_string(&resp_event) {
                                                if let Err(e) = sink.send(tungstenite::Message::Text(json_str.into())).await {
                                                    error!("Error sending response: {}", e);
                                                }
                                            }
                                        }
                                        
                                        let event = Event::new(
                                            ws_event.name,
                                            ws_event.payload,
                                            ws_event.source,
                                        );
                                        
                                        if let Err(e) = futures::executor::block_on(event_bus.emit(event)) {
                                            error!("Error emitting event: {}", e);
                                        }
                                    } else {
                                        error!("Failed to parse WebSocket message: {}", text);
                                    }
                                }
                            } else if msg.is_close() {
                                info!("WebSocket connection closed");
                                break;
                            }
                        }
                        Some(Err(e)) => {
                            error!("WebSocket error: {}", e);
                            break;
                        }
                        None => break,
                    }
                }
                msg = rx.recv() => {
                    match msg {
                        Some(msg) => {
                            if let Err(e) = sink.send(msg).await {
                                error!("Error forwarding event: {}", e);
                                break;
                            }
                        }
                        None => break,
                    }
                }
            }
        }

        Ok(())
    }
    
    fn handle_function_call(name: &str, _payload: &Value) -> Option<Value> {
        match name {
            "get_users" => {
                if let Ok(db_guard) = DATABASE.lock() {
                    if let Some(ref db) = *db_guard {
                        match db.get_all_users() {
                            Ok(users) => {
                                return Some(serde_json::json!({
                                    "success": true,
                                    "data": users
                                }));
                            }
                            Err(e) => {
                                return Some(serde_json::json!({
                                    "success": false,
                                    "error": e.to_string()
                                }));
                            }
                        }
                    }
                }
                Some(serde_json::json!({
                    "success": false,
                    "error": "Database not available"
                }))
            }
            "get_db_stats" => {
                if let Ok(db_guard) = DATABASE.lock() {
                    if let Some(ref db) = *db_guard {
                        match db.get_db_stats() {
                            Ok(stats) => {
                                return Some(serde_json::json!({
                                    "success": true,
                                    "stats": stats
                                }));
                            }
                            Err(e) => {
                                return Some(serde_json::json!({
                                    "success": false,
                                    "error": e.to_string()
                                }));
                            }
                        }
                    }
                }
                Some(serde_json::json!({
                    "success": false,
                    "error": "Database not available"
                }))
            }
            _ => None
        }
    }
}

pub async fn start_websocket_server(event_bus: Arc<EventBus>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let handler = WebSocketHandler::new(event_bus);
    handler.start_server("127.0.0.1:9000").await
}
