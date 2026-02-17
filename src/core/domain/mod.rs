//! Core Domain Layer - Enterprise Business Rules
//! 
//! This layer contains the most fundamental business logic that is:
//! - Framework-agnostic
//! - Database-agnostic
//! - UI-agnostic
//! 
//! It should have NO dependencies on other layers.

pub mod entities;
pub mod repositories;
pub mod services;
pub mod value_objects;
pub mod errors;

pub use entities::*;
pub use repositories::*;
pub use services::*;
pub use value_objects::*;
pub use errors::*;
