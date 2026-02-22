//! Error Context - Adding metadata to errors
//! 
//! Provides utilities for adding rich context to errors
//! as they flow through the system.

use crate::error_handling::app_error::{AppError, AppResult, ErrorCode};
use std::collections::HashMap;

/// Context builder for errors
pub struct ErrorContext {
    data: HashMap<String, serde_json::Value>,
}

impl ErrorContext {
    pub fn new() -> Self {
        Self {
            data: HashMap::new(),
        }
    }
    
    pub fn add(mut self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> Self {
        self.data.insert(key.into(), value.into());
        self
    }
    
    pub fn add_user_id(mut self, user_id: impl Into<serde_json::Value>) -> Self {
        self.data.insert("user_id".into(), user_id.into());
        self
    }
    
    pub fn add_request_id(mut self, request_id: impl Into<serde_json::Value>) -> Self {
        self.data.insert("request_id".into(), request_id.into());
        self
    }
    
    pub fn add_operation(mut self, operation: impl Into<String>) -> Self {
        self.data.insert("operation".into(), operation.into().into());
        self
    }
    
    pub fn add_resource(mut self, resource_type: &str, resource_id: impl Into<serde_json::Value>) -> Self {
        self.data.insert(
            format!("{}_id", resource_type),
            resource_id.into(),
        );
        self
    }
    
    pub fn merge(mut self, other: ErrorContext) -> Self {
        self.data.extend(other.data);
        self
    }
    
    pub fn into_map(self) -> HashMap<String, serde_json::Value> {
        self.data
    }
}

impl Default for ErrorContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Trait for adding context to results
pub trait WithErrorContext<T> {
    fn with_error_context<F>(self, f: F) -> AppResult<T>
    where
        F: FnOnce(ErrorContext) -> ErrorContext;
}

impl<T> WithErrorContext<T> for AppResult<T> {
    fn with_error_context<F>(self, f: F) -> AppResult<T>
    where
        F: FnOnce(ErrorContext) -> ErrorContext,
    {
        self.map_err(|e| {
            let context = f(ErrorContext::new());
            AppError {
                context: context.into_map(),
                ..e
            }
        })
    }
}

/// Macro for adding context at call site
#[macro_export]
macro_rules! with_context {
    ($result:expr, $($key:expr => $value:expr),*) => {
        $result.map_err(|e| {
            let mut error = e;
            $(
                error = error.with_context($key, $value);
            )*
            error
        })
    };
}

/// Guard clause utilities for early returns with errors
pub mod guards {
    use super::*;
    
    /// Require a value or return error
    pub fn require<T>(
        value: Option<T>,
        code: ErrorCode,
        message: impl Into<String>,
    ) -> AppResult<T> {
        value.ok_or_else(|| AppError::new(code, message))
    }
    
    /// Require a condition or return error
    pub fn require_that(
        condition: bool,
        code: ErrorCode,
        message: impl Into<String>,
    ) -> AppResult<()> {
        if condition {
            Ok(())
        } else {
            Err(AppError::new(code, message))
        }
    }
    
    /// Require non-empty string
    pub fn require_non_empty(
        value: &str,
        code: ErrorCode,
        field: &str,
    ) -> AppResult<&str> {
        if value.is_empty() {
            Err(AppError::new(code, format!("{} cannot be empty", field)))
        } else {
            Ok(value)
        }
    }
    
    /// Require value in range
    pub fn require_in_range<T: PartialOrd + Clone>(
        value: T,
        min: T,
        max: T,
        code: ErrorCode,
        field: &str,
    ) -> AppResult<T> {
        if value < min {
            Err(AppError::new(code, format!("{} must be at least {:?}", field, min)))
        } else if value > max {
            Err(AppError::new(code, format!("{} must be at most {:?}", field, max)))
        } else {
            Ok(value)
        }
    }
}

/// Validation helpers using errors as values
pub mod validation {
    use super::*;
    
    /// Validate a value with a predicate
    pub fn validate<T, F>(
        value: T,
        predicate: F,
        code: ErrorCode,
        message: impl Into<String>,
    ) -> AppResult<T>
    where
        F: FnOnce(&T) -> bool,
    {
        if predicate(&value) {
            Ok(value)
        } else {
            Err(AppError::new(code, message))
        }
    }
    
    /// Validate multiple conditions, collecting all errors
    pub fn validate_all<T>(
        value: &T,
        validations: Vec<(
            Box<dyn FnOnce(&T) -> bool>,
            ErrorCode,
            String,
        )>,
    ) -> Result<(), Vec<AppError>> {
        let errors: Vec<AppError> = validations
            .into_iter()
            .filter_map(|(predicate, code, message)| {
                if !predicate(value) {
                    Some(AppError::new(code, message))
                } else {
                    None
                }
            })
            .collect();
        
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
