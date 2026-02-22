//! Comprehensive Logging Infrastructure

#![allow(dead_code)]

pub mod error_logger;

use tracing::info;
use tracing_subscriber::{fmt, EnvFilter, prelude::__tracing_subscriber_SubscriberExt};

/// Logging configuration
#[derive(Debug, Clone)]
pub struct LoggingConfig {
    pub level: String,
    pub file: Option<String>,
    pub append: bool,
    pub webui_verbose: bool,
    pub json_output: bool,
    pub show_target: bool,
    pub show_line_numbers: bool,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "debug".to_string(),
            file: Some("application.log".to_string()),
            append: true,
            webui_verbose: false,
            json_output: false,
            show_target: true,
            show_line_numbers: true,
        }
    }
}

/// Initialize comprehensive logging system
pub fn init_logging(config: &LoggingConfig) -> Result<(), Box<dyn std::error::Error>> {
    // Create environment filter
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            let webui_level = if config.webui_verbose { "debug" } else { "error" };
            EnvFilter::new(format!(
                "rustwebui_app={},\
                 webui_rs={},\
                 tungstenite=warn,\
                 tokio_tungstenite=warn,\
                 hyper=warn,\
                 h2=warn",
                config.level, webui_level
            ))
        });

    // Create console layer
    let console_layer = fmt::layer()
        .with_ansi(true)
        .with_target(config.show_target)
        .with_line_number(config.show_line_numbers)
        .with_thread_ids(false)
        .with_thread_names(false)
        .with_writer(std::io::stderr);

    // Build subscriber with console layer
    let subscriber = tracing_subscriber::registry()
        .with(env_filter)
        .with(console_layer);

    // Set global subscriber
    tracing::subscriber::set_global_default(subscriber)
        .map_err(|err| format!("Failed to set tracing subscriber: {}", err))?;

    // Setup panic hooks
    error_logger::setup_panic_hook();

    // Log initialization
    eprintln!("\x1b[36m╔══════════════════════════════════════════════════════════╗\x1b[0m");
    eprintln!("\x1b[36m║\x1b[0m              \x1b[1mLogging System Initialized\x1b[0m                   \x1b[36m║\x1b[0m");
    eprintln!("\x1b[36m╠══════════════════════════════════════════════════════════╣\x1b[0m");
    eprintln!("\x1b[36m║\x1b[0m  Level: \x1b[33m{:<10}\x1b[0m                              \x1b[36m║\x1b[0m", config.level);
    eprintln!("\x1b[36m║\x1b[0m  File:  \x1b[33m{:<10}\x1b[0m                              \x1b[36m║\x1b[0m", config.file.as_deref().unwrap_or("none"));
    eprintln!("\x1b[36m╚══════════════════════════════════════════════════════════╝\x1b[0m");

    info!(
        target: "logging",
        message = "Logging system initialized",
        level = config.level,
        file = config.file.as_deref().unwrap_or("none"),
    );

    Ok(())
}
