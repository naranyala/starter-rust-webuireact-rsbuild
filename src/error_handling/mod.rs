//! Error Handling Module - "Errors as Values" Pattern
//! 
//! This module provides a comprehensive error handling system where errors are:
//! - Values that flow through the system
//! - Composable and transformable
//! - Rich with context and metadata
//! - Never thrown as exceptions (in business logic)

pub mod app_error;
pub mod result_ext;
pub mod error_context;
pub mod error_handler;

pub use app_error::*;
pub use result_ext::*;
pub use error_context::*;
pub use error_handler::*;
