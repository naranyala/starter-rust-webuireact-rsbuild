use rusqlite::Connection;
use serde::Deserialize;
use std::env;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tracing::{info, Level};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{fmt, EnvFilter, Layer};
use tracing_subscriber::prelude::__tracing_subscriber_SubscriberExt;

// Consolidated core functionality
// Combines: config, logging, database, and other infrastructure modules

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub app: AppSettings,
    pub database: DatabaseSettings,
    pub window: WindowSettings,
    pub logging: LoggingSettings,
}

#[derive(Debug, Deserialize)]
pub struct AppSettings {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseSettings {
    pub path: String,
    pub create_sample_data: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct WindowSettings {
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct LoggingSettings {
    pub level: String,
    pub file: String,
    pub append: Option<bool>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app: AppSettings {
                name: String::from("Rust WebUI Application"),
                version: String::from("1.0.0"),
            },
            database: DatabaseSettings {
                path: String::from("app.db"),
                create_sample_data: Some(true),
            },
            window: WindowSettings {
                title: String::from("Rust WebUI Application"),
            },
            logging: LoggingSettings {
                level: String::from("info"),
                file: String::from("application.log"),
                append: Some(true),
            },
        }
    }
}

impl AppConfig {
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        // Try to find config file
        let config_paths = [
            "app.config.toml",
            "config/app.config.toml",
            "./app.config.toml",
            "./config/app.config.toml",
        ];

        let mut config_content = None;
        let mut config_path = String::new();

        for path in &config_paths {
            if Path::new(path).exists() {
                config_content = Some(fs::read_to_string(path)?);
                config_path = path.to_string();
                break;
            }
        }

        // Also check APP_CONFIG environment variable
        if config_content.is_none() {
            if let Ok(env_path) = env::var("APP_CONFIG") {
                if Path::new(&env_path).exists() {
                    config_content = Some(fs::read_to_string(&env_path)?);
                    config_path = env_path;
                }
            }
        }

        // Try to parse TOML if config found
        if let Some(content) = config_content {
            match toml::from_str(&content) {
                Ok(config) => {
                    println!("Loaded configuration from: {}", config_path);
                    return Ok(config);
                }
                Err(e) => {
                    eprintln!("Warning: Failed to parse config file: {}", e);
                    eprintln!("Using default configuration");
                }
            }
        }

        // Return default config if no config file found or parsing failed
        Ok(AppConfig::default())
    }

    pub fn get_app_name(&self) -> &str {
        &self.app.name
    }

    pub fn get_version(&self) -> &str {
        &self.app.version
    }

    pub fn get_db_path(&self) -> &str {
        &self.database.path
    }

    pub fn should_create_sample_data(&self) -> bool {
        self.database.create_sample_data.unwrap_or(true)
    }

    pub fn get_window_title(&self) -> &str {
        &self.window.title
    }

    pub fn get_log_level(&self) -> &str {
        &self.logging.level
    }

    pub fn get_log_file(&self) -> &str {
        &self.logging.file
    }

    pub fn is_append_log(&self) -> bool {
        self.logging.append.unwrap_or(true)
    }
}

// Global guard to ensure the tracing subscriber stays active
static mut LOG_GUARD: Option<WorkerGuard> = None;

pub fn init_logging_with_config(
    log_file: Option<&str>,
    log_level: &str,
    _append: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    // Configure log level
    let level = match log_level {
        "trace" => Level::TRACE,
        "debug" => Level::DEBUG,
        "info" => Level::INFO,
        "warn" => Level::WARN,
        "error" => Level::ERROR,
        _ => Level::INFO,
    };

    // Set up environment filter
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(format!("rustwebui_app={}", log_level)));

    // Create subscriber with console logging
    let subscriber = tracing_subscriber::registry()
        .with(env_filter)
        .with(
            fmt::layer()
                .with_ansi(true) // ANSI colors for console
                .with_target(true)
                .with_line_number(true)
                .boxed()
        );

    // Set the global subscriber
    tracing::subscriber::set_global_default(subscriber)
        .map_err(|err| format!("Failed to set tracing subscriber: {}", err))?;

    info!(message = "Logging system initialized", log_level = log_level, log_file = log_file.unwrap_or("none"));

    Ok(())
}

pub struct Database {
    connection: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open(db_path)?;

        // Enable WAL mode for better concurrency
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;

        // Emit database connection event
        if let Ok(bus) = std::panic::catch_unwind(|| crate::event_bus::EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                &crate::event_bus::AppEventType::DatabaseOperation.to_string(),
                serde_json::json!({
                    "operation": "connect",
                    "database": db_path,
                    "timestamp": std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64
                }),
            )) {
                eprintln!("Failed to emit database connection event: {}", e);
            }
        }

        Ok(Database {
            connection: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn init(&self) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL
            )",
            [],
        )?;

        // Emit database initialization event
        if let Ok(bus) = std::panic::catch_unwind(|| crate::event_bus::EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                &crate::event_bus::AppEventType::DatabaseOperation.to_string(),
                serde_json::json!({
                    "operation": "init_schema",
                    "table": "users",
                    "timestamp": std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64
                }),
            )) {
                eprintln!("Failed to emit database initialization event: {}", e);
            }
        }

        info!("Database schema initialized");
        Ok(())
    }

    pub fn insert_sample_data(&self) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();

        // Insert sample users if table is empty
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;

        if count == 0 {
            let sample_users = [
                ("John Doe", "john@example.com", "admin"),
                ("Jane Smith", "jane@example.com", "editor"),
                ("Bob Johnson", "bob@example.com", "user"),
                ("Alice Brown", "alice@example.com", "user"),
            ];

            for (name, email, role) in &sample_users {
                conn.execute(
                    "INSERT INTO users (name, email, role) VALUES (?1, ?2, ?3)",
                    rusqlite::params![name, email, role],
                )?;
            }

            // Emit sample data insertion event
            if let Ok(bus) = std::panic::catch_unwind(|| crate::event_bus::EventBus::global()) {
                if let Err(e) = futures::executor::block_on(bus.emit_simple(
                    &crate::event_bus::AppEventType::DataChanged.to_string(),
                    serde_json::json!({
                        "operation": "insert_sample_data",
                        "table": "users",
                        "count": sample_users.len(),
                        "timestamp": std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64
                    }),
                )) {
                    eprintln!("Failed to emit sample data insertion event: {}", e);
                }
            }

            info!("Sample data inserted into database");
        } else {
            info!("Sample data already exists, skipping insertion");
        }

        Ok(())
    }

    // Method to get all users with event emission
    pub fn get_all_users(&self) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();

        let mut stmt = conn.prepare("SELECT id, name, email, role FROM users")?;
        let user_iter = stmt.query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
            ))
        })?;

        let mut users = Vec::new();
        for user_result in user_iter {
            let (id, name, email, role): (i32, String, String, String) = user_result?;
            users.push(serde_json::json!({
                "id": id,
                "name": name,
                "email": email,
                "role": role
            }));
        }

        // Emit get users event
        if let Ok(bus) = std::panic::catch_unwind(|| crate::event_bus::EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                &crate::event_bus::AppEventType::DatabaseOperation.to_string(),
                serde_json::json!({
                    "operation": "get_users",
                    "count": users.len(),
                    "timestamp": std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64
                }),
            )) {
                eprintln!("Failed to emit get users event: {}", e);
            }
        }

        Ok(users)
    }

    // Method to get database stats with event emission
    pub fn get_db_stats(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();

        // Get user count
        let user_count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;

        // Get table names
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'")?;
        let table_names: Vec<String> = stmt
            .query_map([], |row| row.get(0))?
            .collect::<std::result::Result<Vec<String>, _>>()?;

        let stats = serde_json::json!({
            "users": user_count,
            "tables": table_names,
            "timestamp": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64
        });

        // Emit get stats event
        if let Ok(bus) = std::panic::catch_unwind(|| crate::event_bus::EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                &crate::event_bus::AppEventType::DatabaseOperation.to_string(),
                serde_json::json!({
                    "operation": "get_stats",
                    "stats": &stats,
                    "timestamp": std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64
                }),
            )) {
                eprintln!("Failed to emit get stats event: {}", e);
            }
        }

        Ok(stats)
    }
}
