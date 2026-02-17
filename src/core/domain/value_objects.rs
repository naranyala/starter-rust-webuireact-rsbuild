//! Value Objects - Objects defined by their attributes, not identity
//! 
//! Value objects are immutable and defined by their attributes.
//! They have no conceptual identity.

use serde::{Deserialize, Serialize};

/// Email value object
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Email(String);

impl Email {
    pub fn new(email: String) -> Result<Self, &'static str> {
        if email.contains('@') && email.contains('.') && email.len() <= 254 {
            Ok(Self(email.to_lowercase()))
        } else {
            Err("Invalid email format")
        }
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Name value object
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Name(String);

impl Name {
    pub fn new(name: String) -> Result<Self, &'static str> {
        let trimmed = name.trim();
        if trimmed.is_empty() || trimmed.len() > 100 {
            Err("Name must be between 1 and 100 characters")
        } else {
            Ok(Self(trimmed.to_string()))
        }
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Timestamp value object
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Timestamp(u64);

impl Timestamp {
    pub fn now() -> Self {
        Self(std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64)
    }
    
    pub fn from_millis(millis: u64) -> Self {
        Self(millis)
    }
    
    pub fn as_millis(&self) -> u64 {
        self.0
    }
}
