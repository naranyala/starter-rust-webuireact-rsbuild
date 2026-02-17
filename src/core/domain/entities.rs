//! Domain Entities - Core business objects with identity
//! 
//! Entities are the heart of the domain layer. They contain:
//! - Business logic
//! - Validation rules
//! - State management

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// User entity - represents a user in the system
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

/// User role enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    Admin,
    User,
    Editor,
    Viewer,
}

/// User status enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UserStatus {
    Active,
    Inactive,
    Pending,
    Suspended,
}

impl User {
    /// Create a new user with validation
    pub fn new(
        id: i64,
        name: String,
        email: String,
        role: UserRole,
        status: UserStatus,
    ) -> Result<Self, DomainError> {
        // Validate email format
        if !email.contains('@') {
            return Err(DomainError::ValidationError("Invalid email format".to_string()));
        }
        
        // Validate name length
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

    /// Update user status
    pub fn update_status(&mut self, status: UserStatus) {
        self.status = status;
        self.updated_at = Some(Utc::now());
    }

    /// Update user role
    pub fn update_role(&mut self, role: UserRole) {
        self.role = role;
        self.updated_at = Some(Utc::now());
    }
}

/// Database statistics entity
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DatabaseStats {
    pub users_count: i64,
    pub tables: Vec<String>,
    pub database_size: Option<i64>,
    pub last_updated: DateTime<Utc>,
}

/// Counter entity for demonstration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Counter {
    pub id: String,
    pub value: i64,
    pub label: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
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

/// System information entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub platform: String,
    pub user_agent: String,
    pub language: String,
    pub screen_resolution: String,
    pub memory_gb: Option<u32>,
    pub cpu_cores: Option<u32>,
    pub online: bool,
    pub timestamp: DateTime<Utc>,
}
