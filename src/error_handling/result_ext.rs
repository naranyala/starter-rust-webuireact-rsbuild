//! Result Extensions - Functional error handling
//! 
//! Provides monadic operations for Result types to enable
//! "errors as values" pattern with composable error handling.

use crate::error_handling::app_error::{AppError, AppResult, ErrorCode};

/// Extension trait for Result with AppError
pub trait ResultExt<T, E> {
    /// Map the success value
    fn map_ok<F, U>(self, f: F) -> Result<U, E>
    where
        F: FnOnce(T) -> U;
    
    /// Map the error value
    fn map_err<F, G>(self, f: F) -> Result<T, G>
    where
        F: FnOnce(E) -> G;
    
    /// Transform both success and error
    fn map_both<F, G, U>(self, ok_fn: F, err_fn: G) -> Result<U, E>
    where
        F: FnOnce(T) -> U,
        G: FnOnce(E) -> E;
    
    /// Chain operations (flat map)
    fn and_then<F, U>(self, f: F) -> Result<U, E>
    where
        F: FnOnce(T) -> Result<U, E>;
    
    /// Execute side effect on success
    fn on_ok<F>(self, f: F) -> Result<T, E>
    where
        F: FnOnce(&T);
    
    /// Execute side effect on error
    fn on_err<F>(self, f: F) -> Result<T, E>
    where
        F: FnOnce(&E);
    
    /// Convert to Option, logging error
    fn ok_or_log(self, context: &str) -> Option<T>;
    
    /// Convert to default value on error
    fn unwrap_or_default_on_error(self) -> T where T: Default;
    
    /// Recover from error with fallback
    fn recover<F>(self, fallback: F) -> Result<T, E>
    where
        F: FnOnce(E) -> Result<T, E>;
}

impl<T, E> ResultExt<T, E> for Result<T, E> {
    fn map_ok<F, U>(self, f: F) -> Result<U, E>
    where
        F: FnOnce(T) -> U,
    {
        self.map(f)
    }
    
    fn map_err<F, G>(self, f: F) -> Result<T, G>
    where
        F: FnOnce(E) -> G,
    {
        self.map_err(f)
    }
    
    fn map_both<F, G, U>(self, ok_fn: F, err_fn: G) -> Result<U, E>
    where
        F: FnOnce(T) -> U,
        G: FnOnce(E) -> E,
    {
        match self {
            Ok(v) => Ok(ok_fn(v)),
            Err(e) => Err(err_fn(e)),
        }
    }
    
    fn and_then<F, U>(self, f: F) -> Result<U, E>
    where
        F: FnOnce(T) -> Result<U, E>,
    {
        self.and_then(f)
    }
    
    fn on_ok<F>(self, f: F) -> Result<T, E>
    where
        F: FnOnce(&T),
    {
        if let Ok(ref v) = self {
            f(v);
        }
        self
    }
    
    fn on_err<F>(self, f: F) -> Result<T, E>
    where
        F: FnOnce(&E),
    {
        if let Err(ref e) = self {
            f(e);
        }
        self
    }
    
    fn ok_or_log(self, context: &str) -> Option<T> {
        match self {
            Ok(v) => Some(v),
            Err(e) => {
                tracing::warn!("Error in {}: {:?}", context, e);
                None
            }
        }
    }
    
    fn unwrap_or_default_on_error(self) -> T where T: Default {
        self.unwrap_or_else(|_| T::default())
    }
    
    fn recover<F>(self, fallback: F) -> Result<T, E>
    where
        F: FnOnce(E) -> Result<T, E>,
    {
        match self {
            Ok(v) => Ok(v),
            Err(e) => fallback(e),
        }
    }
}

/// Specific extensions for AppResult
pub trait AppResultExt<T> {
    /// Add context to error
    fn with_context(self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> AppResult<T>;
    
    /// Add error location
    fn with_location(self, module: impl Into<String>, function: Option<&str>, line: Option<u32>) -> AppResult<T>;
    
    /// Convert domain error to app error
    fn map_domain_error(self) -> AppResult<T>;
    
    /// Log and convert to option
    fn log_error(self, context: &str) -> Option<T>;
    
    /// Retry on specific error codes
    fn retry_on<F, Fut>(self, codes: &[ErrorCode], f: F) -> AppResult<T>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = AppResult<T>>;
}

impl<T> AppResultExt<T> for AppResult<T> {
    fn with_context(self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> AppResult<T> {
        self.map_err(|e| e.with_context(key, value))
    }
    
    fn with_location(self, module: impl Into<String>, function: Option<&str>, line: Option<u32>) -> AppResult<T> {
        self.map_err(|e| e.with_location(module, function, line))
    }
    
    fn map_domain_error(self) -> AppResult<T> {
        use crate::core::domain::DomainError;
        self.map_err(|e| {
            // If it's a domain error, convert it
            if let Some(domain_err) = e.downcast_ref::<DomainError>() {
                AppError::new(ErrorCode::BusinessRuleViolation, domain_err.to_string())
            } else {
                e
            }
        })
    }
    
    fn log_error(self, context: &str) -> Option<T> {
        match self {
            Ok(v) => Some(v),
            Err(e) => {
                tracing::error!("Error in {}: {}", context, e.summary());
                None
            }
        }
    }
    
    fn retry_on<F, Fut>(self, codes: &[ErrorCode], f: F) -> AppResult<T>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = AppResult<T>>,
    {
        // This would need async runtime support
        // Simplified version for now
        self
    }
}

/// Create success result
pub fn ok<T>(value: T) -> AppResult<T> {
    Ok(value)
}

/// Create error result
pub fn err<T>(code: ErrorCode, message: impl Into<String>) -> AppResult<T> {
    Err(AppError::new(code, message))
}

/// Create error result with context builder
pub fn err_with<T>(code: ErrorCode, message: impl Into<String>) -> ErrorBuilder<T> {
    ErrorBuilder {
        error: AppError::new(code, message),
        _phantom: std::marker::PhantomData,
    }
}

/// Builder for creating errors with context
pub struct ErrorBuilder<T> {
    error: AppError,
    _phantom: std::marker::PhantomData<T>,
}

impl<T> ErrorBuilder<T> {
    pub fn context(mut self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> Self {
        self.error = self.error.with_context(key, value);
        self
    }
    
    pub fn location(mut self, module: impl Into<String>, function: Option<&str>, line: Option<u32>) -> Self {
        self.error = self.error.with_location(module, function, line);
        self
    }
    
    pub fn cause(mut self, cause: impl Into<String>) -> Self {
        self.error = self.error.with_cause(cause);
        self
    }
    
    pub fn build(self) -> AppResult<T> {
        Err(self.error)
    }
}
