//! Comprehensive Error Logging Module
//!
//! This module provides centralized error logging with rich context,
//! stack traces, and structured output for debugging.

#![allow(dead_code)]

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::{error, warn, info, debug};

/// Error severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorSeverity {
    /// Debug level - for development
    Debug,
    /// Info level - notable but not concerning
    Info,
    /// Warning level - should be investigated
    Warning,
    /// Error level - something failed
    Error,
    /// Critical level - system may be unstable
    Critical,
    /// Fatal level - system cannot continue
    Fatal,
}

/// Structured error log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorLogEntry {
    /// Unique error ID
    pub id: String,
    
    /// Error timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Error severity
    pub severity: ErrorSeverity,
    
    /// Error category/code
    pub category: String,
    
    /// Human-readable message
    pub message: String,
    
    /// Source location (file:line)
    pub location: Option<String>,
    
    /// Module where error occurred
    pub module: Option<String>,
    
    /// Function where error occurred
    pub function: Option<String>,
    
    /// Additional context
    pub context: HashMap<String, serde_json::Value>,
    
    /// Error chain (caused by)
    pub source: Option<String>,
    
    /// Stack trace (if enabled)
    pub stack_trace: Option<String>,
    
    /// Suggested action
    pub suggestion: Option<String>,
}

/// Error context builder
#[derive(Debug, Clone, Default)]
pub struct ErrorContext {
    data: HashMap<String, serde_json::Value>,
    module: Option<String>,
    function: Option<String>,
    file: Option<u32>,
}

impl ErrorContext {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with(mut self, key: &str, value: impl Into<serde_json::Value>) -> Self {
        self.data.insert(key.to_string(), value.into());
        self
    }

    pub fn with_module(mut self, module: &str) -> Self {
        self.module = Some(module.to_string());
        self
    }

    pub fn with_function(mut self, function: &str) -> Self {
        self.function = Some(function.to_string());
        self
    }

    pub fn with_file(mut self, line: u32) -> Self {
        self.file = Some(line);
        self
    }

    pub fn with_error_details(mut self, error: &dyn std::error::Error) -> Self {
        self.data.insert("error_type".to_string(), serde_json::json!(std::any::type_name_of_val(&error)));
        self.data.insert("error_message".to_string(), serde_json::json!(error.to_string()));
        self
    }
}

/// Format error log for terminal output
fn format_error_log(entry: &ErrorLogEntry) -> String {
    let severity_color = match entry.severity {
        ErrorSeverity::Debug => "\x1b[90m",      // Gray
        ErrorSeverity::Info => "\x1b[36m",       // Cyan
        ErrorSeverity::Warning => "\x1b[33m",    // Yellow
        ErrorSeverity::Error => "\x1b[31m",      // Red
        ErrorSeverity::Critical => "\x1b[35m",   // Magenta
        ErrorSeverity::Fatal => "\x1b[41;97m",   // Red background, white text
    };
    
    let reset = "\x1b[0m";
    let bold = "\x1b[1m";
    
    let mut output = String::new();
    
    // Header line with severity and category
    output.push_str(&format!(
        "{}{}[{}]{} {} {} {}{}{}\n",
        severity_color,
        bold,
        format!("{:?}", entry.severity).to_uppercase(),
        reset,
        entry.timestamp.format("%Y-%m-%d %H:%M:%S%.3f"),
        entry.category,
        entry.id,
        reset,
        if entry.severity == ErrorSeverity::Fatal { " 🚨" } else { "" }
    ));
    
    // Message
    output.push_str(&format!("  {}Message:{} {}\n", bold, reset, entry.message));
    
    // Location
    if let Some(location) = &entry.location {
        output.push_str(&format!("  {}Location:{} {}\n", bold, reset, location));
    }
    
    // Module/Function
    if let Some(module) = &entry.module {
        output.push_str(&format!("  {}Module:{} {}\n", bold, reset, module));
    }
    if let Some(function) = &entry.function {
        output.push_str(&format!("  {}Function:{} {}\n", bold, reset, function));
    }
    
    // Context
    if !entry.context.is_empty() {
        output.push_str(&format!("  {}Context:{}\n", bold, reset));
        for (key, value) in &entry.context {
            let value_str = match value {
                serde_json::Value::String(s) => s.clone(),
                _ => value.to_string(),
            };
            output.push_str(&format!("    • {}: {}\n", key, value_str));
        }
    }
    
    // Source error
    if let Some(source) = &entry.source {
        output.push_str(&format!("  {}Caused by:{} {}\n", bold, reset, source));
    }
    
    // Stack trace
    if let Some(stack) = &entry.stack_trace {
        output.push_str(&format!("  {}Stack trace:{}\n", bold, reset));
        for line in stack.lines().take(10) {
            output.push_str(&format!("    {}\n", line));
        }
    }
    
    // Suggestion
    if let Some(suggestion) = &entry.suggestion {
        output.push_str(&format!("  {}💡 Suggestion:{} {}\n", bold, reset, suggestion));
    }
    
    // Separator
    output.push_str(&format!("{}────────────────────────────────────────{}\n", "\x1b[90m", reset));
    
    output
}

/// Capture stack trace (simplified - in production use backtrace crate)
fn capture_stack_trace() -> Option<String> {
    // In production, use: backtrace::Backtrace::new()
    // For now, return None to avoid dependency
    None
}

/// Log an error with basic context
pub fn log_error(
    category: &str,
    error: &dyn std::error::Error,
    context: ErrorContext,
) {
    log_error_with_severity(
        category,
        error,
        context,
        ErrorSeverity::Error,
        None,
    );
}

/// Log an error with full context and severity
pub fn log_error_with_severity(
    category: &str,
    error: &dyn std::error::Error,
    context: ErrorContext,
    severity: ErrorSeverity,
    suggestion: Option<&str>,
) {
    let mut context_data = context.data;
    
    // Add error details
    context_data.insert("error_type".to_string(), serde_json::json!(std::any::type_name_of_val(&error)));
    context_data.insert("error_message".to_string(), serde_json::json!(error.to_string()));
    
    // Build error chain (limited to avoid lifetime issues)
    let source = error.source().map(|s| s.to_string());
    
    // Create log entry
    let entry = ErrorLogEntry {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: Utc::now(),
        severity,
        category: category.to_string(),
        message: error.to_string(),
        location: context.file.map(|line| format!(":{}", line)),
        module: context.module,
        function: context.function,
        context: context_data,
        source,
        stack_trace: capture_stack_trace(),
        suggestion: suggestion.map(String::from),
    };
    
    // Format and output
    let formatted = format_error_log(&entry);
    
    match severity {
        ErrorSeverity::Debug => debug!("{}", formatted),
        ErrorSeverity::Info => info!("{}", formatted),
        ErrorSeverity::Warning => warn!("{}", formatted),
        ErrorSeverity::Error | ErrorSeverity::Critical | ErrorSeverity::Fatal => {
            error!("{}", formatted);
        }
    }
    
    // Also log as JSON for machine parsing
    if let Ok(json) = serde_json::to_string(&entry) {
        debug!("ERROR_JSON: {}", json);
    }
}

/// Log an error with full context and severity (static lifetime version)
pub fn log_error_full(
    category: &str,
    error: &(dyn std::error::Error + 'static),
    context: ErrorContext,
    severity: ErrorSeverity,
    suggestion: Option<&str>,
) {
    log_error_with_severity(category, error, context, severity, suggestion);
}

/// Macro for easy error logging with location
#[macro_export]
macro_rules! log_error_here {
    ($category:expr, $error:expr) => {
        $crate::infrastructure::logging::error_logger::log_error(
            $category,
            &$error,
            $crate::infrastructure::logging::error_logger::ErrorContext::new()
                .with_module(module_path!())
                .with_function(function_name!())
                .with_file(line!())
        );
    };
    ($category:expr, $error:expr, $($key:expr => $value:expr),*) => {
        $crate::infrastructure::logging::error_logger::log_error(
            $category,
            &$error,
            $crate::infrastructure::logging::error_logger::ErrorContext::new()
                .with_module(module_path!())
                .with_function(function_name!())
                .with_file(line!())
                $(.with($key, $value))*
        );
    };
}

/// Macro for critical errors
#[macro_export]
macro_rules! log_critical {
    ($category:expr, $error:expr, $suggestion:expr) => {
        $crate::infrastructure::logging::error_logger::log_error_full(
            $category,
            &$error,
            $crate::infrastructure::logging::error_logger::ErrorContext::new()
                .with_module(module_path!())
                .with_function(function_name!())
                .with_file(line!()),
            $crate::infrastructure::logging::error_logger::ErrorSeverity::Critical,
            Some($suggestion)
        );
    };
}

/// Setup panic hook for better panic messages
pub fn setup_panic_hook() {
    std::panic::set_hook(Box::new(|panic_info| {
        let location = panic_info.location()
            .map(|l| format!("{}:{}", l.file(), l.line()))
            .unwrap_or_else(|| "unknown".to_string());

        let message = panic_info.payload()
            .downcast_ref::<&str>()
            .map(|s| s.to_string())
            .or_else(|| panic_info.payload().downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "Unknown panic".to_string());

        let thread = std::thread::current()
            .name()
            .unwrap_or("unnamed")
            .to_string();

        eprintln!("\x1b[41;97m");
        eprintln!("╔══════════════════════════════════════════════════════════╗");
        eprintln!("║                    PANIC DETECTED                        ║");
        eprintln!("╚══════════════════════════════════════════════════════════╝");
        eprintln!("\x1b[0m");
        eprintln!("\x1b[1mThread:\x1b[0m {}", thread);
        eprintln!("\x1b[1mLocation:\x1b[0m {}", location);
        eprintln!("\x1b[1mMessage:\x1b[0m {}", message);
        eprintln!("\x1b[90m───────────────────────────────────────────────────────────\x1b[0m");

        error!(
            target: "panic",
            "PANIC in {} at {}: {}",
            thread,
            location,
            message
        );
    }));
}

/// Initialize comprehensive error logging
pub fn init_error_logging() {
    setup_panic_hook();
    info!("Error logging initialized with panic hooks");
}
