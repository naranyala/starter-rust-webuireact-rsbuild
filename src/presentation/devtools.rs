//! DevTools API - Expose backend internals for debugging

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// System metrics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub timestamp: DateTime<Utc>,
    pub uptime_secs: u64,
    pub memory: MemoryMetrics,
    pub connections: ConnectionMetrics,
    pub database: DatabaseMetrics,
    pub events: EventMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetrics {
    pub process_memory_mb: f64,
    pub available_system_mb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionMetrics {
    pub websocket_active: usize,
    pub http_requests_total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseMetrics {
    pub tables: Vec<TableStats>,
    pub total_records: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableStats {
    pub name: String,
    pub row_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventMetrics {
    pub total_emitted: u64,
    pub recent_events: Vec<RecentEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentEvent {
    pub id: String,
    pub name: String,
    pub timestamp: DateTime<Utc>,
    pub source: String,
}

/// DevTools API handler
pub struct DevToolsApi {
    start_time: DateTime<Utc>,
}

impl DevToolsApi {
    pub fn new() -> Self {
        Self {
            start_time: Utc::now(),
        }
    }

    pub fn get_system_metrics(&self) -> SystemMetrics {
        let uptime = Utc::now().signed_duration_since(self.start_time).num_seconds() as u64;

        SystemMetrics {
            timestamp: Utc::now(),
            uptime_secs: uptime,
            memory: self.get_memory_metrics(),
            connections: self.get_connection_metrics(),
            database: self.get_database_metrics(),
            events: self.get_event_metrics(),
        }
    }

    fn get_memory_metrics(&self) -> MemoryMetrics {
        #[cfg(target_os = "linux")]
        {
            if let Ok(contents) = std::fs::read_to_string("/proc/meminfo") {
                for line in contents.lines() {
                    if line.starts_with("MemAvailable:") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            if let Ok(kb) = parts[1].parse::<f64>() {
                                return MemoryMetrics {
                                    process_memory_mb: 0.0,
                                    available_system_mb: kb / 1024.0,
                                };
                            }
                        }
                    }
                }
            }
        }
        MemoryMetrics {
            process_memory_mb: 0.0,
            available_system_mb: 0.0,
        }
    }

    fn get_connection_metrics(&self) -> ConnectionMetrics {
        ConnectionMetrics {
            websocket_active: 0,
            http_requests_total: 0,
        }
    }

    fn get_database_metrics(&self) -> DatabaseMetrics {
        use crate::viewmodel::handlers::DATABASE;
        
        let mut tables = Vec::new();
        let mut total_records = 0i64;
        
        if let Ok(db_guard) = DATABASE.lock() {
            if let Some(ref db) = *db_guard {
                if let Ok(stats) = db.get_db_stats() {
                    if let Some(users) = stats.get("users").and_then(|v| v.as_i64()) {
                        tables.push(TableStats {
                            name: "users".to_string(),
                            row_count: users,
                        });
                        total_records += users;
                    }
                }
            }
        }

        DatabaseMetrics {
            tables,
            total_records,
        }
    }

    fn get_event_metrics(&self) -> EventMetrics {
        EventMetrics {
            total_emitted: 0,
            recent_events: Vec::new(),
        }
    }

    pub fn execute_command(&self, command: &str, _args: serde_json::Value) -> serde_json::Value {
        match command {
            "ping" => serde_json::json!({ "pong": true, "timestamp": Utc::now() }),
            "health" => serde_json::json!({ 
                "status": "healthy", 
                "uptime_secs": Utc::now().signed_duration_since(self.start_time).num_seconds(),
                "version": env!("CARGO_PKG_VERSION"),
            }),
            "info" => serde_json::json!({
                "rust_version": std::env!("CARGO_PKG_VERSION"),
                "debug": cfg!(debug_assertions),
            }),
            _ => serde_json::json!({ "error": format!("Unknown command: {}", command) }),
        }
    }
}

impl Default for DevToolsApi {
    fn default() -> Self {
        Self::new()
    }
}
