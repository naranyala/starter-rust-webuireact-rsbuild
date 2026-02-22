//! Core Framework Module
//! 
//! This module contains the core framework that is:
//! - Framework-agnostic
//! - Database-agnostic  
//! - UI-agnostic
//! 
//! It provides the foundation for the plugin-driven architecture.

pub mod domain;
pub mod application;

pub use domain::*;
pub use application::*;
