//! Application DTOs - Data Transfer Objects
//! 
//! DTOs are used to transfer data between layers and to/from the presentation layer.

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// User DTO for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserDto {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Database statistics DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStatsDto {
    pub users_count: i64,
    pub tables: Vec<String>,
    pub database_size: Option<i64>,
}

/// Counter DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CounterDto {
    pub id: String,
    pub value: i64,
    pub label: String,
}

/// System info DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfoDto {
    pub platform: String,
    pub user_agent: String,
    pub language: String,
    pub screen_resolution: String,
    pub memory_gb: Option<u32>,
    pub cpu_cores: Option<u32>,
    pub online: bool,
}

/// API response wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: None,
        }
    }
    
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
            message: None,
        }
    }
    
    pub fn with_message(mut self, message: String) -> Self {
        self.message = Some(message);
        self
    }
}
