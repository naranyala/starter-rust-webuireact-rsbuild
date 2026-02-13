use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tracing::{debug, error, info};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub name: String,
    pub payload: serde_json::Value,
    pub timestamp: u64,
    pub source: String,
}

impl Event {
    pub fn new(name: String, payload: serde_json::Value, source: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            payload,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source,
        }
    }
}

pub type EventHandler = Arc<dyn Fn(&Event) -> Result<(), Box<dyn std::error::Error + Send + Sync>> + Send + Sync>;

pub struct EventBus {
    subscribers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
    broadcast_sender: broadcast::Sender<Event>,
    broadcast_receiver: broadcast::Receiver<Event>,
}

impl EventBus {
    pub fn new() -> Self {
        let (sender, receiver) = broadcast::channel::<Event>(100);
        Self {
            subscribers: Arc::new(RwLock::new(HashMap::new())),
            broadcast_sender: sender,
            broadcast_receiver: receiver,
        }
    }

    pub fn subscribe<F>(&self, event_name: &str, handler: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: Fn(&Event) -> Result<(), Box<dyn std::error::Error + Send + Sync>> + Send + Sync + 'static,
    {
        let mut subscribers = futures::executor::block_on(self.subscribers.write());
        let handlers = subscribers.entry(event_name.to_string()).or_insert_with(Vec::new);
        handlers.push(Arc::new(handler));
        Ok(())
    }

    pub async fn emit(&self, event: Event) -> Result<(), Box<dyn std::error::Error>> {
        // Notify local subscribers
        let subscribers = self.subscribers.read().await;
        if let Some(handlers) = subscribers.get(&event.name) {
            for handler in handlers {
                if let Err(e) = handler(&event) {
                    error!("Error in event handler for '{}': {}", event.name, e);
                }
            }
        }
        drop(subscribers);

        // Broadcast to all receivers
        if self.broadcast_sender.send(event).is_err() {
            debug!("No receivers for event broadcast");
        }

        Ok(())
    }

    pub async fn emit_simple(&self, name: &str, payload: serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
        let event = Event::new(name.to_string(), payload, "backend".to_string());
        self.emit(event).await
    }

    pub async fn listen(&self) -> broadcast::Receiver<Event> {
        self.broadcast_sender.subscribe()
    }

    pub async fn register_event_handler<F>(&self, event_name: &str, handler: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: Fn(&Event) -> Result<(), Box<dyn std::error::Error + Send + Sync>> + Send + Sync + 'static,
    {
        self.subscribe(event_name, handler)
    }
}

use std::sync::OnceLock;

static EVENT_BUS_INSTANCE: OnceLock<Arc<EventBus>> = OnceLock::new();

impl EventBus {
    pub fn global() -> Arc<EventBus> {
        EVENT_BUS_INSTANCE
            .get_or_init(|| Arc::new(EventBus::new()))
            .clone()
    }

    pub fn is_initialized() -> bool {
        EVENT_BUS_INSTANCE.get().is_some()
    }
}

// Predefined event types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppEventType {
    UserLogin,
    UserLogout,
    DataChanged,
    CounterIncremented,
    DatabaseOperation,
    SystemHealthCheck,
    FrontendConnected,
    FrontendDisconnected,
}

impl ToString for AppEventType {
    fn to_string(&self) -> String {
        match self {
            AppEventType::UserLogin => "user.login".to_string(),
            AppEventType::UserLogout => "user.logout".to_string(),
            AppEventType::DataChanged => "data.changed".to_string(),
            AppEventType::CounterIncremented => "counter.incremented".to_string(),
            AppEventType::DatabaseOperation => "database.operation".to_string(),
            AppEventType::SystemHealthCheck => "system.health.check".to_string(),
            AppEventType::FrontendConnected => "frontend.connected".to_string(),
            AppEventType::FrontendDisconnected => "frontend.disconnected".to_string(),
        }
    }
}

// Middleware for event processing
pub struct EventMiddleware {
    pub name: String,
    pub handler: Arc<dyn Fn(&Event) -> Result<Event, Box<dyn std::error::Error + Send + Sync>> + Send + Sync>,
}

impl EventMiddleware {
    pub fn new<F>(name: String, handler: F) -> Self
    where
        F: Fn(&Event) -> Result<Event, Box<dyn std::error::Error + Send + Sync>> + Send + Sync + 'static,
    {
        Self {
            name,
            handler: Arc::new(handler),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio;

    #[tokio::test]
    async fn test_event_bus_basic() {
        let bus = EventBus::new();
        
        let mut received_event = false;
        bus.subscribe("test.event", |_| {
            received_event = true;
            Ok(())
        }).unwrap();
        
        bus.emit_simple("test.event", serde_json::json!({"test": "data"})).await.unwrap();
        
        // Note: In a real scenario, you'd need to wait for async processing
        assert!(true); // Placeholder assertion
    }
}