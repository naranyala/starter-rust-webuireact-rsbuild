//! Domain Services - Business logic that spans multiple entities
//! 
//! Domain services contain business logic that doesn't naturally fit
//! within a single entity.

use crate::core::domain::{User, UserRole, UserStatus, DomainResult, DomainError};

/// User service - business logic for user operations
pub trait UserService: Send + Sync {
    /// Validate user data before persistence
    fn validate_user(&self, user: &User) -> DomainResult<()>;
    
    /// Check if user can perform an action
    fn can_perform_action(&self, user: &User, action: &str) -> bool;
    
    /// Check if user has required role
    fn has_role(&self, user: &User, required_role: UserRole) -> bool;
    
    /// Check if user is active
    fn is_active(&self, user: &User) -> bool;
}

/// Default implementation of UserService
pub struct DefaultUserService;

impl UserService for DefaultUserService {
    fn validate_user(&self, user: &User) -> DomainResult<()> {
        if user.name.is_empty() {
            return Err(DomainError::ValidationError("Name cannot be empty".to_string()));
        }
        
        if !user.email.contains('@') {
            return Err(DomainError::ValidationError("Invalid email format".to_string()));
        }
        
        Ok(())
    }
    
    fn can_perform_action(&self, user: &User, action: &str) -> bool {
        match action {
            "admin_panel" => user.role == UserRole::Admin,
            "edit_content" => matches!(user.role, UserRole::Admin | UserRole::Editor),
            "view_content" => true,
            _ => false,
        }
    }
    
    fn has_role(&self, user: &User, required_role: UserRole) -> bool {
        // Admin has all roles
        if user.role == UserRole::Admin {
            return true;
        }
        user.role == required_role
    }
    
    fn is_active(&self, user: &User) -> bool {
        user.status == UserStatus::Active
    }
}

/// Counter service - business logic for counter operations
pub trait CounterService: Send + Sync {
    /// Validate counter value limits
    fn validate_limit(&self, value: i64, max: i64) -> DomainResult<()>;
    
    /// Calculate counter change
    fn calculate_change(&self, current: i64, delta: i64) -> i64;
}

pub struct DefaultCounterService {
    pub max_value: i64,
    pub min_value: i64,
}

impl CounterService for DefaultCounterService {
    fn validate_limit(&self, value: i64, _max: i64) -> DomainResult<()> {
        if value > self.max_value {
            return Err(DomainError::BusinessRuleViolation(
                format!("Counter value {} exceeds maximum {}", value, self.max_value)
            ));
        }
        
        if value < self.min_value {
            return Err(DomainError::BusinessRuleViolation(
                format!("Counter value {} below minimum {}", value, self.min_value)
            ));
        }
        
        Ok(())
    }
    
    fn calculate_change(&self, current: i64, delta: i64) -> i64 {
        let new_value = current + delta;
        new_value.clamp(self.min_value, self.max_value)
    }
}
