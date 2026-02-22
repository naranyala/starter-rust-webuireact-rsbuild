//! Tests for Domain Errors
//! 
//! Note: Self-contained tests with inline type definitions.

#[cfg(test)]
mod tests {
    use serde::{Deserialize, Serialize};
    use thiserror::Error;

    #[derive(Debug, Clone, Error, Serialize, Deserialize)]
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

    #[test]
    fn test_domain_error_not_found() {
        let error = DomainError::NotFound("User".to_string());
        assert_eq!(error.to_string(), "Entity not found: User");
    }

    #[test]
    fn test_domain_error_validation() {
        let error = DomainError::ValidationError("Invalid email".to_string());
        assert_eq!(error.to_string(), "Validation failed: Invalid email");
    }

    #[test]
    fn test_domain_error_business_rule() {
        let error = DomainError::BusinessRuleViolation("Cannot delete admin user".to_string());
        assert_eq!(error.to_string(), "Business rule violation: Cannot delete admin user");
    }

    #[test]
    fn test_domain_error_repository() {
        let error = DomainError::RepositoryError("Connection failed".to_string());
        assert_eq!(error.to_string(), "Repository error: Connection failed");
    }

    #[test]
    fn test_domain_error_access_denied() {
        let error = DomainError::AccessDenied("Admin only".to_string());
        assert_eq!(error.to_string(), "Access denied: Admin only");
    }

    #[test]
    fn test_domain_error_invalid_state() {
        let error = DomainError::InvalidStateTransition("Active to Pending".to_string());
        assert_eq!(error.to_string(), "Invalid state transition: Active to Pending");
    }

    #[test]
    fn test_domain_result_ok() {
        let result: Result<i32, DomainError> = Ok(42);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 42);
    }

    #[test]
    fn test_domain_result_err() {
        let result: Result<i32, DomainError> = Err(DomainError::NotFound("Test".to_string()));
        assert!(result.is_err());
        match result {
            Err(DomainError::NotFound(msg)) => assert_eq!(msg, "Test"),
            _ => panic!("Wrong error type"),
        }
    }
}
