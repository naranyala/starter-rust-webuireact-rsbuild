//! Repository Traits - Interfaces for data access
//! 
//! Repositories provide an abstraction over data persistence.
//! The domain layer defines the interface, infrastructure implements it.

use crate::core::domain::{User, DatabaseStats, Counter, SystemInfo, DomainResult};

/// User repository trait - defines contract for user data access
#[async_trait::async_trait]
pub trait UserRepository: Send + Sync {
    /// Get all users
    async fn get_all(&self) -> DomainResult<Vec<User>>;
    
    /// Get user by ID
    async fn get_by_id(&self, id: i64) -> DomainResult<Option<User>>;
    
    /// Get user by email
    async fn get_by_email(&self, email: &str) -> DomainResult<Option<User>>;
    
    /// Create a new user
    async fn create(&self, user: User) -> DomainResult<User>;
    
    /// Update an existing user
    async fn update(&self, user: User) -> DomainResult<User>;
    
    /// Delete a user
    async fn delete(&self, id: i64) -> DomainResult<()>;
    
    /// Get users by role
    async fn get_by_role(&self, role: crate::core::domain::UserRole) -> DomainResult<Vec<User>>;
    
    /// Get users by status
    async fn get_by_status(&self, status: crate::core::domain::UserStatus) -> DomainResult<Vec<User>>;
}

/// Database statistics repository trait
#[async_trait::async_trait]
pub trait DatabaseStatsRepository: Send + Sync {
    /// Get database statistics
    async fn get_stats(&self) -> DomainResult<DatabaseStats>;
    
    /// Get table count
    async fn get_table_count(&self) -> DomainResult<usize>;
    
    /// Get total record count
    async fn get_total_records(&self) -> DomainResult<i64>;
}

/// Counter repository trait
#[async_trait::async_trait]
pub trait CounterRepository: Send + Sync {
    async fn get_all(&self) -> DomainResult<Vec<Counter>>;
    async fn get_by_id(&self, id: &str) -> DomainResult<Option<Counter>>;
    async fn save(&self, counter: Counter) -> DomainResult<Counter>;
    async fn delete(&self, id: &str) -> DomainResult<()>;
}

/// System info repository trait (typically in-memory or from system)
pub trait SystemInfoRepository: Send + Sync {
    fn get_current(&self) -> DomainResult<SystemInfo>;
}
