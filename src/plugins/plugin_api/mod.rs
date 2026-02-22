//! Plugin API - Core interfaces for plugin development
//! 
//! This module defines the traits and types that plugins must implement.
//! It provides the foundation for the plugin-driven architecture.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Plugin metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub dependencies: Vec<String>,
}

/// Plugin capability - what the plugin provides
#[derive(Debug, Clone)]
pub enum PluginCapability {
    /// Provides UI commands (frontend -> backend)
    Command {
        name: String,
        description: String,
        handler: Arc<dyn Fn(serde_json::Value) -> futures::future::BoxFuture<'static, Result<serde_json::Value, String>> + Send + Sync>,
    },
    
    /// Provides UI components (backend -> frontend)
    Component {
        name: String,
        template: String,
    },
    
    /// Provides data models
    Model {
        name: String,
        schema: serde_json::Value,
    },
    
    /// Provides services to other plugins
    Service {
        name: String,
        interface: Arc<dyn std::any::Any + Send + Sync>,
    },
}

/// Plugin trait - all plugins must implement this
#[async_trait::async_trait]
pub trait Plugin: Send + Sync {
    /// Get plugin metadata
    fn metadata(&self) -> &PluginMetadata;
    
    /// Get plugin capabilities
    fn capabilities(&self) -> Vec<PluginCapability>;
    
    /// Initialize the plugin
    async fn initialize(&mut self, context: &PluginContext) -> Result<(), String>;
    
    /// Shutdown the plugin
    async fn shutdown(&mut self) -> Result<(), String>;
    
    /// Handle a command
    async fn handle_command(
        &self,
        command: &str,
        payload: serde_json::Value,
    ) -> Result<serde_json::Value, String>;
}

/// Plugin context - provided to plugins for accessing core services
pub struct PluginContext {
    pub config: HashMap<String, serde_json::Value>,
    pub event_bus: Arc<dyn EventBusTrait>,
    pub logger: Arc<dyn LoggerTrait>,
}

impl PluginContext {
    pub fn new(
        config: HashMap<String, serde_json::Value>,
        event_bus: Arc<dyn EventBusTrait>,
        logger: Arc<dyn LoggerTrait>,
    ) -> Self {
        Self { config, event_bus, logger }
    }
    
    pub fn get_config(&self, key: &str) -> Option<&serde_json::Value> {
        self.config.get(key)
    }
}

/// Event bus trait for plugin communication
#[async_trait::async_trait]
pub trait EventBusTrait: Send + Sync {
    async fn emit(&self, event: &str, payload: serde_json::Value) -> Result<(), String>;
    fn subscribe(&self, event: &str, handler: Arc<dyn Fn(serde_json::Value) + Send + Sync>);
}

/// Logger trait for plugin logging
pub trait LoggerTrait: Send + Sync {
    fn info(&self, message: &str);
    fn warn(&self, message: &str);
    fn error(&self, message: &str);
    fn debug(&self, message: &str);
}

/// Plugin registry - manages plugin lifecycle
pub struct PluginRegistry {
    plugins: HashMap<String, Arc<dyn Plugin>>,
    capabilities: HashMap<String, Arc<dyn Plugin>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            capabilities: HashMap::new(),
        }
    }
    
    pub fn register(&mut self, plugin: Arc<dyn Plugin>) -> Result<(), String> {
        let metadata = plugin.metadata();
        if self.plugins.contains_key(&metadata.id) {
            return Err(format!("Plugin {} already registered", metadata.id));
        }
        
        // Register capabilities
        for capability in plugin.capabilities() {
            if let PluginCapability::Command { name, .. } = capability {
                self.capabilities.insert(name, plugin.clone());
            }
        }
        
        self.plugins.insert(metadata.id.clone(), plugin);
        Ok(())
    }
    
    pub async fn initialize_all(&mut self, context: &PluginContext) -> Result<(), String> {
        for plugin in self.plugins.values_mut() {
            let mut p = plugin.clone();
            // In a real implementation, we'd need mutable access
            // This is a simplified version
        }
        Ok(())
    }
    
    pub fn get_plugin(&self, id: &str) -> Option<Arc<dyn Plugin>> {
        self.plugins.get(id).cloned()
    }
    
    pub async fn handle_command(
        &self,
        command: &str,
        payload: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        if let Some(plugin) = self.capabilities.get(command) {
            plugin.handle_command(command, payload).await
        } else {
            Err(format!("Unknown command: {}", command))
        }
    }
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self::new()
    }
}
