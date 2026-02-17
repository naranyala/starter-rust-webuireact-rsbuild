//! Logging infrastructure - Tracing setup

use tracing::{Level, info};
use tracing_subscriber::{fmt, EnvFilter, Layer};
use tracing_subscriber::prelude::__tracing_subscriber_SubscriberExt;

/// Logging configuration
pub struct LoggingConfig {
    pub level: String,
    pub file: Option<String>,
    pub append: bool,
    pub webui_verbose: bool,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            file: Some("application.log".to_string()),
            append: true,
            webui_verbose: false,
        }
    }
}

/// Initialize logging system
pub fn init_logging(config: &LoggingConfig) -> Result<(), Box<dyn std::error::Error>> {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            let webui_level = if config.webui_verbose { "debug" } else { "error" };
            EnvFilter::new(format!(
                "rustwebui_app={},\
                 webui_rs={},\
                 tungstenite=warn,\
                 tokio_tungstenite=warn",
                config.level, webui_level
            ))
        });

    let subscriber = tracing_subscriber::registry().with(env_filter).with(
        fmt::layer()
            .with_ansi(true)
            .with_target(false)
            .with_line_number(false)
            .without_time()
            .with_writer(std::io::stderr)
            .boxed(),
    );

    tracing::subscriber::set_global_default(subscriber)
        .map_err(|err| format!("Failed to set tracing subscriber: {}", err))?;

    info!(
        message = "Logging system initialized",
        log_level = config.level,
        log_file = config.file.as_deref().unwrap_or("none")
    );

    Ok(())
}
