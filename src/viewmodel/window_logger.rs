use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, warn, debug};
use serde_json::Value;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct WindowInfo {
    pub id: String,
    pub title: String,
    pub focused: bool,
    pub minimized: bool,
    pub maximized: bool,
    pub created_at: u64,
    pub last_activity: u64,
}

pub struct WindowLogger {
    windows: Arc<Mutex<HashMap<String, WindowInfo>>>,
}

impl WindowLogger {
    pub fn new() -> Self {
        Self {
            windows: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn register_window(&self, id: String, title: String) {
        let mut windows = self.windows.lock().await;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        let window_info = WindowInfo {
            id: id.clone(),
            title,
            focused: false,
            minimized: false,
            maximized: false,
            created_at: now,
            last_activity: now,
        };

        info!("Window registered: {:?}", window_info);
        windows.insert(id, window_info);
    }

    pub async fn window_focused(&self, id: &str) {
        let mut windows = self.windows.lock().await;
        if let Some(window) = windows.get_mut(id) {
            window.focused = true;
            window.last_activity = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;

            info!("Window focused: {} ({})", window.title, id);
        } else {
            warn!("Attempted to focus non-existent window: {}", id);
        }
    }

    pub async fn window_blurred(&self, id: &str) {
        let mut windows = self.windows.lock().await;
        if let Some(window) = windows.get_mut(id) {
            window.focused = false;
            window.last_activity = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;

            info!("Window blurred: {} ({})", window.title, id);
        } else {
            warn!("Attempted to blur non-existent window: {}", id);
        }
    }

    pub async fn window_minimized(&self, id: &str) {
        let mut windows = self.windows.lock().await;
        if let Some(window) = windows.get_mut(id) {
            window.minimized = true;
            window.focused = false;
            window.last_activity = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;

            info!("Window minimized: {} ({})", window.title, id);
        } else {
            warn!("Attempted to minimize non-existent window: {}", id);
        }
    }

    pub async fn window_restored(&self, id: &str) {
        let mut windows = self.windows.lock().await;
        if let Some(window) = windows.get_mut(id) {
            window.minimized = false;
            window.last_activity = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;

            info!("Window restored: {} ({})", window.title, id);
        } else {
            warn!("Attempted to restore non-existent window: {}", id);
        }
    }

    pub async fn window_maximized(&self, id: &str) {
        let mut windows = self.windows.lock().await;
        if let Some(window) = windows.get_mut(id) {
            window.maximized = true;
            window.last_activity = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;

            info!("Window maximized: {} ({})", window.title, id);
        } else {
            warn!("Attempted to maximize non-existent window: {}", id);
        }
    }

    pub async fn window_closed(&self, id: &str) {
        let mut windows = self.windows.lock().await;
        if let Some(window) = windows.get(id) {
            info!("Window closed: {} ({})", window.title, id);
        } else {
            warn!("Attempted to close non-existent window: {}", id);
        }
        windows.remove(id);
    }

    #[allow(dead_code)]
    pub async fn get_window_info(&self, id: &str) -> Option<WindowInfo> {
        let windows = self.windows.lock().await;
        windows.get(id).cloned()
    }

    #[allow(dead_code)]
    pub async fn get_all_windows(&self) -> Vec<WindowInfo> {
        let windows = self.windows.lock().await;
        windows.values().cloned().collect()
    }

    #[allow(dead_code)]
    pub async fn get_focused_window(&self) -> Option<WindowInfo> {
        let windows = self.windows.lock().await;
        windows.values().find(|w| w.focused).cloned()
    }

    pub async fn log_window_state_change(&self, payload: &Value) {
        if let Some(window_id) = payload.get("id").and_then(|v| v.as_str()) {
            if let Some(action) = payload.get("action").and_then(|v| v.as_str()) {
                match action {
                    "focused" => self.window_focused(window_id).await,
                    "blurred" => self.window_blurred(window_id).await,
                    "minimized" => self.window_minimized(window_id).await,
                    "restored" => self.window_restored(window_id).await,
                    "maximized" => self.window_maximized(window_id).await,
                    "closed" => self.window_closed(window_id).await,
                    "created" => {
                        if let Some(title) = payload.get("windowTitle").and_then(|v| v.as_str()) {
                            self.register_window(window_id.to_string(), title.to_string()).await;
                        }
                    },
                    _ => {
                        debug!("Unknown window action: {}", action);
                    }
                }
            }
        }
    }
}

// Global window logger instance
use std::sync::OnceLock;

static WINDOW_LOGGER_INSTANCE: OnceLock<Arc<WindowLogger>> = OnceLock::new();

pub fn window_logger() -> Arc<WindowLogger> {
    WINDOW_LOGGER_INSTANCE
        .get_or_init(|| Arc::new(WindowLogger::new()))
        .clone()
}

// CLI-based logging functions
#[allow(dead_code)]
pub async fn print_window_status() {
    let logger = window_logger();
    let windows = logger.get_all_windows().await;
    
    println!("\n=== Window Status ===");
    if windows.is_empty() {
        println!("No windows currently active.");
    } else {
        for window in windows {
            let status = if window.focused {
                "FOCUSED"
            } else if window.minimized {
                "MINIMIZED"
            } else if window.maximized {
                "MAXIMIZED"
            } else {
                "ACTIVE"
            };
            
            println!(
                "[{}] ID: {} | Title: {} | Created: {}",
                status,
                window.id,
                window.title,
                format_timestamp(window.created_at)
            );
        }
    }
    println!("=====================\n");
}

#[allow(dead_code)]
fn format_timestamp(timestamp: u64) -> String {
    use chrono::{Local, TimeZone};
    
    let dt = Local.timestamp_opt((timestamp / 1000) as i64, ((timestamp % 1000) * 1_000_000) as u32);
    match dt.single() {
        Some(date_time) => date_time.format("%H:%M:%S%.3f").to_string(),
        None => "Invalid timestamp".to_string(),
    }
}

// Function to periodically print window status (for CLI monitoring)
#[allow(dead_code)]
pub async fn start_cli_monitoring() {
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            print_window_status().await;
        }
    });
}