//! Database infrastructure module
//!
//! Re-exports the Database implementation from model::core for backward compatibility.
//! New code should use model::core::Database directly.

// Re-export for backward compatibility
#[allow(unused_imports)]
pub use crate::model::core::Database;
