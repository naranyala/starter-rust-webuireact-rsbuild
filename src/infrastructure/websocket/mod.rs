//! WebSocket infrastructure - WebSocket server implementation

#![allow(dead_code)]

use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use std::sync::Arc;
use tracing::{info, debug, error};
use crate::infrastructure::event_bus::{EventBus, Event};

/// WebSocket server for real-time communication
pub struct WebSocketServer {
    event_bus: Arc<EventBus>,
}

impl WebSocketServer {
    pub fn new(event_bus: Arc<EventBus>) -> Self {
        Self { event_bus }
    }
    
    /// Start the WebSocket server
    pub async fn start(&self, addr: &str) -> anyhow::Result<()> {
        let listener = TcpListener::bind(addr).await?;
        info!("WebSocket server starting on {}", addr);
        
        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    let event_bus = self.event_bus.clone();
                    tokio::spawn(async move {
                        if let Err(e) = Self::handle_connection(stream, event_bus).await {
                            error!("WebSocket connection error: {}", e);
                        }
                    });
                }
                Err(e) => {
                    error!("Failed to accept connection: {}", e);
                }
            }
        }
    }
    
    /// Handle a single WebSocket connection
    async fn handle_connection(stream: TcpStream, event_bus: Arc<EventBus>) -> anyhow::Result<()> {
        use tokio_tungstenite::accept_async;
        
        let ws_stream = accept_async(stream).await?;
        debug!("WebSocket connection established");
        
        let (mut sink, mut stream) = ws_stream.split();
        
        // Spawn task to forward events from event bus to WebSocket
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
        let event_bus_clone = event_bus.clone();
        
        tokio::spawn(async move {
            let mut receiver = event_bus_clone.listen().await;
            while let Ok(event) = receiver.recv().await {
                if event.source != "frontend" {
                    if let Ok(json) = serde_json::to_string(&event) {
                        let _ = tx.send(json);
                    }
                }
            }
        });
        
        // Forward messages from channel to WebSocket
        let sink_task = tokio::spawn(async move {
            while let Some(json) = rx.recv().await {
                if sink.send(tokio_tungstenite::tungstenite::Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        });
        
        // Receive messages from WebSocket
        while let Some(msg) = stream.next().await {
            match msg {
                Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                    debug!("Received: {}", text);
                    if let Ok(event_data) = serde_json::from_str::<serde_json::Value>(&text) {
                        if let Some(name) = event_data.get("name").and_then(|v| v.as_str()) {
                            let event = Event::new(
                                name.to_string(),
                                event_data.get("payload").cloned().unwrap_or_default(),
                                "frontend".to_string(),
                            );
                            let _ = event_bus.emit(event).await;
                        }
                    }
                }
                Ok(tokio_tungstenite::tungstenite::Message::Close(_)) => {
                    debug!("WebSocket connection closed");
                    break;
                }
                Err(e) => {
                    error!("WebSocket error: {}", e);
                    break;
                }
                _ => {}
            }
        }
        
        let _ = sink_task.await;
        Ok(())
    }
}
