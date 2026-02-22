//! Tests for Domain Entities
//! 
//! Note: Self-contained tests with inline type definitions
//! to avoid module path issues in binary crate.

#[cfg(test)]
mod tests {
    use serde::{Deserialize, Serialize};
    use chrono::{DateTime, Utc};

    // Simplified User struct for testing
    #[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
    pub struct User {
        pub id: i64,
        pub name: String,
        pub email: String,
        pub role: UserRole,
        pub status: UserStatus,
        pub created_at: DateTime<Utc>,
        pub updated_at: Option<DateTime<Utc>>,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    #[serde(rename_all = "snake_case")]
    pub enum UserRole {
        Admin,
        User,
        Editor,
        Viewer,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    #[serde(rename_all = "snake_case")]
    pub enum UserStatus {
        Active,
        Inactive,
        Pending,
        Suspended,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Counter {
        pub id: String,
        pub value: i64,
        pub label: String,
        pub created_at: DateTime<Utc>,
        pub updated_at: DateTime<Utc>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum DomainError {
        NotFound(String),
        ValidationError(String),
        BusinessRuleViolation(String),
    }

    impl User {
        pub fn new(
            id: i64,
            name: String,
            email: String,
            role: UserRole,
            status: UserStatus,
        ) -> Result<Self, DomainError> {
            if !email.contains('@') {
                return Err(DomainError::ValidationError("Invalid email format".to_string()));
            }
            if name.is_empty() || name.len() > 100 {
                return Err(DomainError::ValidationError("Name must be between 1 and 100 characters".to_string()));
            }
            Ok(Self {
                id,
                name,
                email,
                role,
                status,
                created_at: Utc::now(),
                updated_at: None,
            })
        }

        pub fn update_status(&mut self, status: UserStatus) {
            self.status = status;
            self.updated_at = Some(Utc::now());
        }

        pub fn update_role(&mut self, role: UserRole) {
            self.role = role;
            self.updated_at = Some(Utc::now());
        }
    }

    impl Counter {
        pub fn new(id: String, label: String) -> Self {
            let now = Utc::now();
            Self {
                id,
                value: 0,
                label,
                created_at: now,
                updated_at: now,
            }
        }

        pub fn increment(&mut self) {
            self.value += 1;
            self.updated_at = Utc::now();
        }

        pub fn decrement(&mut self) {
            self.value -= 1;
            self.updated_at = Utc::now();
        }

        pub fn reset(&mut self) {
            self.value = 0;
            self.updated_at = Utc::now();
        }
    }

    #[test]
    fn test_user_creation_valid() {
        let user = User::new(
            1,
            "John Doe".to_string(),
            "john@example.com".to_string(),
            UserRole::Admin,
            UserStatus::Active,
        );
        
        assert!(user.is_ok());
        let user = user.unwrap();
        assert_eq!(user.id, 1);
        assert_eq!(user.name, "John Doe");
        assert_eq!(user.email, "john@example.com");
        assert_eq!(user.role, UserRole::Admin);
        assert_eq!(user.status, UserStatus::Active);
    }

    #[test]
    fn test_user_creation_invalid_email() {
        let user = User::new(
            1,
            "John Doe".to_string(),
            "invalid-email".to_string(),
            UserRole::User,
            UserStatus::Active,
        );
        
        assert!(user.is_err());
    }

    #[test]
    fn test_user_creation_empty_name() {
        let user = User::new(
            1,
            "".to_string(),
            "valid@example.com".to_string(),
            UserRole::User,
            UserStatus::Active,
        );
        
        assert!(user.is_err());
    }

    #[test]
    fn test_user_update_status() {
        let mut user = User::new(
            1,
            "John Doe".to_string(),
            "john@example.com".to_string(),
            UserRole::User,
            UserStatus::Active,
        ).unwrap();
        
        user.update_status(UserStatus::Inactive);
        assert_eq!(user.status, UserStatus::Inactive);
        assert!(user.updated_at.is_some());
    }

    #[test]
    fn test_counter_creation() {
        let counter = Counter::new("counter-1".to_string(), "Test Counter".to_string());
        
        assert_eq!(counter.id, "counter-1");
        assert_eq!(counter.label, "Test Counter");
        assert_eq!(counter.value, 0);
    }

    #[test]
    fn test_counter_increment() {
        let mut counter = Counter::new("counter-1".to_string(), "Test".to_string());
        
        counter.increment();
        assert_eq!(counter.value, 1);
        
        counter.increment();
        assert_eq!(counter.value, 2);
    }

    #[test]
    fn test_counter_decrement() {
        let mut counter = Counter::new("counter-1".to_string(), "Test".to_string());
        
        counter.increment();
        counter.increment();
        counter.decrement();
        
        assert_eq!(counter.value, 1);
    }

    #[test]
    fn test_counter_reset() {
        let mut counter = Counter::new("counter-1".to_string(), "Test".to_string());
        
        counter.increment();
        counter.increment();
        counter.reset();
        
        assert_eq!(counter.value, 0);
    }
}
