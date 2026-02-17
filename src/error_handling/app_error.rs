//! Application Error Types
//! 
//! Comprehensive error types that carry rich context and metadata.
//! Errors are values that flow through the system, not exceptions.

use thiserror::Error;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Application error with rich metadata
#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    /// Unique error ID for tracking
    pub id: String,
    
    /// Error code for programmatic handling
    pub code: ErrorCode,
    
    /// Human-readable message
    pub message: String,
    
    /// Root cause (if chained)
    pub cause: Option<String>,
    
    /// Additional context data
    pub context: HashMap<String, serde_json::Value>,
    
    /// When the error occurred
    pub timestamp: DateTime<Utc>,
    
    /// Where the error occurred (module/function)
    pub location: Option<ErrorLocation>,
    
    /// Suggested recovery action
    pub recovery: Option<RecoveryAction>,
}

/// Error codes for programmatic handling
#[derive(Error, Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorCode {
    // Domain Errors (1000-1999)
    #[error("Entity not found")]
    EntityNotFound = 1000,
    #[error("Validation failed")]
    ValidationFailed = 1001,
    #[error("Business rule violation")]
    BusinessRuleViolation = 1002,
    #[error("Invalid state transition")]
    InvalidStateTransition = 1003,
    
    // Infrastructure Errors (2000-2999)
    #[error("Database error")]
    DatabaseError = 2000,
    #[error("Connection failed")]
    ConnectionFailed = 2001,
    #[error("Timeout")]
    Timeout = 2002,
    #[error("Serialization error")]
    SerializationError = 2003,
    
    // Application Errors (3000-3999)
    #[error("Command failed")]
    CommandFailed = 3000,
    #[error("Query failed")]
    QueryFailed = 3001,
    #[error("Handler error")]
    HandlerError = 3002,
    
    // Presentation Errors (4000-4999)
    #[error("UI error")]
    UiError = 4000,
    #[error("Communication error")]
    CommunicationError = 4001,
    
    // Plugin Errors (5000-5999)
    #[error("Plugin error")]
    PluginError = 5000,
    #[error("Plugin not found")]
    PluginNotFound = 5001,
    #[error("Plugin capability not found")]
    PluginCapabilityNotFound = 5002,
    
    // Unknown
    #[error("Unknown error")]
    Unknown = 9999,
}

/// Error location for debugging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorLocation {
    pub module: String,
    pub function: Option<String>,
    pub line: Option<u32>,
    pub file: Option<String>,
}

/// Recovery actions for error handling
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecoveryAction {
    Retry,
    RetryWithBackoff { max_retries: u32, delay_ms: u64 },
    Fallback { fallback_value: String },
    LogAndContinue,
    UserNotification { message: String },
    Abort,
}

impl AppError {
    /// Create a new error with minimal information
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            code,
            message: message.into(),
            cause: None,
            context: HashMap::new(),
            timestamp: Utc::now(),
            location: None,
            recovery: None,
        }
    }
    
    /// Add context to the error
    pub fn with_context(mut self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> Self {
        self.context.insert(key.into(), value.into());
        self
    }
    
    /// Add multiple context values
    pub fn with_context_map(mut self, context: HashMap<String, serde_json::Value>) -> Self {
        self.context.extend(context);
        self
    }
    
    /// Set the error location
    pub fn with_location(mut self, module: impl Into<String>, function: Option<&str>, line: Option<u32>) -> Self {
        self.location = Some(ErrorLocation {
            module: module.into(),
            function: function.map(String::from),
            line,
            file: None,
        });
        self
    }
    
    /// Set the root cause
    pub fn with_cause(mut self, cause: impl Into<String>) -> Self {
        self.cause = Some(cause.into());
        self
    }
    
    /// Set recovery action
    pub fn with_recovery(mut self, recovery: RecoveryAction) -> Self {
        self.recovery = Some(recovery);
        self
    }
    
    /// Convert to Result
    pub fn into_result<T>(self) -> Result<T, Self> {
        Err(self)
    }
    
    /// Get error summary for logging
    pub fn summary(&self) -> String {
        format!("[{}] {} - {}", self.code, self.id, self.message)
    }
    
    /// Get full error details for debugging
    pub fn details(&self) -> String {
        let mut details = format!("Error ID: {}\n", self.id);
        details.push_str(&format!("Code: {:?}\n", self.code));
        details.push_str(&format!("Message: {}\n", self.message));
        
        if let Some(cause) = &self.cause {
            details.push_str(&format!("Cause: {}\n", cause));
        }
        
        if let Some(location) = &self.location {
            details.push_str(&format!("Location: {}:{}\n", 
                location.module,
                location.line.unwrap_or(0)
            ));
        }
        
        if !self.context.is_empty() {
            details.push_str("Context:\n");
            for (key, value) in &self.context {
                details.push_str(&format!("  {}: {}\n", key, value));
            }
        }
        
        details
    }
}

/// Type alias for AppResult
pub type AppResult<T> = Result<T, AppError>;

/// Macro to create error with location
#[macro_export]
macro_rules! error_here {
    ($code:expr, $msg:expr) => {
        AppError::new($code, $msg)
            .with_location(module_path!(), Some(function_name!()), Some(line!()))
    };
    ($code:expr, $msg:expr, $($key:expr => $value:expr),*) => {
        AppError::new($code, $msg)
            .with_location(module_path!(), Some(function_name!()), Some(line!()))
            $(.with_context($key, $value))*
    };
}

/// Helper macro to get function name
#[macro_export]
macro_rules! function_name {
    () => {{
        fn f() {}
        fn type_name_of<T>(_: T) -> &'static str {
            std::any::type_name::<T>()
        }
        let name = type_name_of(f);
        &name[..name.len() - 2]
    }};
}
