//! Domain Errors - Error types for the domain layer
//! 
//! These errors represent business rule violations and validation failures.

use thiserror::Error;

/// Domain error types
#[derive(Error, Debug, Clone)]
pub enum DomainError {
    #[error("Entity not found: {0}")]
    NotFound(String),
    
    #[error("Validation failed: {0}")]
    ValidationError(String),
    
    #[error("Business rule violation: {0}")]
    BusinessRuleViolation(String),
    
    #[error("Repository error: {0}")]
    RepositoryError(String),
    
    #[error("Access denied: {0}")]
    AccessDenied(String),
    
    #[error("Invalid state transition: {0}")]
    InvalidStateTransition(String),
}

/// Result type alias for domain operations
pub type DomainResult<T> = Result<T, DomainError>;
