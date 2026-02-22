//! Error Handler - Centralized error processing
//! 
//! Provides utilities for handling, logging, and transforming errors
//! at application boundaries.

use crate::error_handling::app_error::{AppError, AppResult, ErrorCode, RecoveryAction};
use tracing::{error, warn, info};

/// Error handler for processing errors at boundaries
pub struct ErrorHandler {
    log_level: LogLevel,
    include_stack: bool,
}

#[derive(Debug, Clone, Copy)]
pub enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
}

impl ErrorHandler {
    pub fn new() -> Self {
        Self {
            log_level: LogLevel::Error,
            include_stack: false,
        }
    }
    
    pub fn with_log_level(mut self, level: LogLevel) -> Self {
        self.log_level = level;
        self
    }
    
    pub fn with_stack_trace(mut self, include: bool) -> Self {
        self.include_stack = include;
        self
    }
    
    /// Handle an error - log and potentially recover
    pub fn handle<T>(&self, result: AppResult<T>) -> AppResult<T> {
        match &result {
            Ok(_) => result,
            Err(e) => {
                self.log_error(e);
                result
            }
        }
    }
    
    /// Handle error with recovery strategy
    pub fn handle_with_recovery<T, F>(&self, result: AppResult<T>, recover: F) -> AppResult<T>
    where
        F: FnOnce(&AppError) -> AppResult<T>,
    {
        match result {
            Ok(v) => Ok(v),
            Err(e) => {
                self.log_error(&e);
                
                // Try recovery if specified
                match &e.recovery {
                    Some(RecoveryAction::Retry) => recover(&e),
                    Some(RecoveryAction::RetryWithBackoff { max_retries, delay_ms }) => {
                        // Simplified retry logic
                        self.log_retry(&e, *max_retries, *delay_ms);
                        recover(&e)
                    }
                    Some(RecoveryAction::Fallback { fallback_value }) => {
                        self.log_fallback(&e);
                        // In real implementation, parse fallback_value
                        recover(&e)
                    }
                    Some(RecoveryAction::LogAndContinue) => {
                        // Already logged, continue with error
                        Err(e)
                    }
                    Some(RecoveryAction::UserNotification { message }) => {
                        self.log_user_notification(message);
                        Err(e)
                    }
                    Some(RecoveryAction::Abort) | None => {
                        Err(e)
                    }
                }
            }
        }
    }
    
    /// Convert error to user-friendly message
    pub fn to_user_message(&self, error: &AppError) -> String {
        match error.code {
            ErrorCode::EntityNotFound => "The requested item was not found".to_string(),
            ErrorCode::ValidationFailed => format!("Validation failed: {}", error.message),
            ErrorCode::BusinessRuleViolation => error.message.clone(),
            ErrorCode::DatabaseError => "A database error occurred. Please try again.".to_string(),
            ErrorCode::ConnectionFailed => "Connection failed. Please check your network.".to_string(),
            ErrorCode::Timeout => "The operation timed out. Please try again.".to_string(),
            ErrorCode::SerializationError => "Data format error. Please refresh.".to_string(),
            ErrorCode::CommandFailed | ErrorCode::QueryFailed | ErrorCode::HandlerError => {
                "An operation failed. Please try again.".to_string()
            }
            ErrorCode::UiError => "Display error. Please refresh the page.".to_string(),
            ErrorCode::CommunicationError => "Communication error. Please check connection.".to_string(),
            ErrorCode::PluginError | ErrorCode::PluginNotFound | ErrorCode::PluginCapabilityNotFound => {
                "Feature unavailable. Please contact support.".to_string()
            }
            ErrorCode::Unknown => error.message.clone(),
        }
    }
    
    /// Log error based on severity
    fn log_error(&self, error: &AppError) {
        let message = if self.include_stack {
            error.details()
        } else {
            error.summary()
        };
        
        match self.log_level {
            LogLevel::Error => error!(error = ?error, "{}", message),
            LogLevel::Warn => warn!(error = ?error, "{}", message),
            LogLevel::Info => info!(error = ?error, "{}", message),
            LogLevel::Debug => tracing::debug!(error = ?error, "{}", message),
        }
    }
    
    fn log_retry(&self, error: &AppError, max_retries: u32, delay_ms: u64) {
        warn!(
            error_id = %error.id,
            max_retries,
            delay_ms,
            "Will retry operation after error"
        );
    }
    
    fn log_fallback(&self, error: &AppError) {
        info!(
            error_id = %error.id,
            "Using fallback value after error"
        );
    }
    
    fn log_user_notification(&self, message: &str) {
        info!("User notification: {}", message);
    }
}

impl Default for ErrorHandler {
    fn default() -> Self {
        Self::new()
    }
}

/// Global error handler instance
pub struct GlobalErrorHandler;

impl GlobalErrorHandler {
    /// Register global error handler
    pub fn register() {
        // Set up panic hook for unhandled errors
        std::panic::set_hook(Box::new(|panic_info| {
            let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
                s.clone()
            } else {
                "Unknown panic".to_string()
            };
            
            let location = panic_info.location()
                .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
                .unwrap_or_else(|| "unknown location".to_string());
            
            error!(
                panic = true,
                location = %location,
                "Panic occurred: {}",
                message
            );
        }));
    }
    
    /// Handle error and return JSON response
    pub fn to_json_response(error: &AppError) -> serde_json::Value {
        serde_json::json!({
            "success": false,
            "error": {
                "code": format!("{:?}", error.code),
                "message": error.message,
                "id": error.id,
                "timestamp": error.timestamp,
            }
        })
    }
}
