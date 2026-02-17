//! Plugins Module
//! 
//! This module contains the plugin system and built-in plugins.
//! Plugins extend the core functionality without modifying the core.

pub mod plugin_api;
pub mod plugins;

pub use plugin_api::*;
