# Plugin Development Guide

## Overview

This guide explains how to create plugins for the Core + Plugin-Driven Architecture.

## Plugin Types

### Backend Plugins (Rust)

Backend plugins extend server-side functionality:
- Add new commands
- Provide data services
- Integrate with external systems

### Frontend Plugins (TypeScript)

Frontend plugins extend client-side functionality:
- Add UI components
- Provide view models
- Handle user interactions

## Creating a Backend Plugin

### Step 1: Create Plugin Structure

```rust
// src/plugins/plugins/my_plugin/mod.rs
mod commands;
mod handlers;

pub use commands::*;
pub use handlers::*;
```

### Step 2: Implement Plugin Trait

```rust
use crate::plugins::plugin_api::*;

pub struct MyPlugin {
    metadata: PluginMetadata,
    // Plugin state
}

impl MyPlugin {
    pub fn new() -> Self {
        Self {
            metadata: PluginMetadata {
                id: "my-plugin".to_string(),
                name: "My Plugin".to_string(),
                version: "1.0.0".to_string(),
                description: "Does something cool".to_string(),
                author: "Your Name".to_string(),
                dependencies: vec![],
            },
        }
    }
}

#[async_trait::async_trait]
impl Plugin for MyPlugin {
    fn metadata(&self) -> &PluginMetadata {
        &self.metadata
    }
    
    fn capabilities(&self) -> Vec<PluginCapability> {
        vec![
            PluginCapability::Command {
                name: "my_command".to_string(),
                description: "Does something cool".to_string(),
                handler: Arc::new(|payload| {
                    Box::pin(async move {
                        // Your command logic here
                        Ok(serde_json::json!({
                            "success": true,
                            "data": { "message": "Hello from plugin!" }
                        }))
                    })
                }),
            },
        ]
    }
    
    async fn initialize(&mut self, context: &PluginContext) -> Result<(), String> {
        context.logger.info("MyPlugin initialized");
        Ok(())
    }
    
    async fn shutdown(&mut self) -> Result<(), String> {
        Ok(())
    }
    
    async fn handle_command(
        &self,
        command: &str,
        payload: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        match command {
            "my_command" => self.handle_my_command(payload).await,
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
}

impl MyPlugin {
    async fn handle_my_command(
        &self,
        payload: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        // Your command implementation
        Ok(serde_json::json!({
            "success": true,
            "data": { "result": "Processed!" }
        }))
    }
}
```

### Step 3: Register Plugin

```rust
// In main.rs or app builder
let mut registry = PluginRegistry::new();
registry.register(Arc::new(MyPlugin::new())).unwrap();
```

## Creating a Frontend Plugin

### Step 1: Create Plugin Structure

```typescript
// frontend/src/plugins/plugins/my-plugin/index.ts
import { Plugin, PluginMetadata, PluginCapability, PluginContext } from '../../plugin-api';

export class MyPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Does something cool',
    author: 'Your Name',
  };

  capabilities: PluginCapability[] = [
    {
      type: 'command',
      name: 'my_command',
      description: 'Does something cool',
      handler: async (payload) => {
        // Your command logic
        return { success: true, data: { message: 'Hello!' } };
      },
    },
  ];

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('MyPlugin initialized');
  }

  async handleCommand(command: string, payload: any): Promise<any> {
    if (command === 'my_command') {
      return this.executeCommand(payload);
    }
    throw new Error(`Unknown command: ${command}`);
  }

  private async executeCommand(payload: any): Promise<any> {
    // Your command implementation
    return { success: true, data: { result: 'Processed!' } };
  }
}
```

### Step 2: Create UI Component (Optional)

```typescript
// frontend/src/plugins/plugins/my-plugin/MyPluginComponent.tsx
import React from 'react';

export const MyPluginComponent: React.FC = () => {
  return (
    <div className="my-plugin">
      <h2>My Plugin</h2>
      {/* Your UI here */}
    </div>
  );
};
```

### Step 3: Register Plugin

```typescript
// In App.tsx or plugin manager
pluginManager.register(new MyPlugin());
```

## Plugin Communication

### Plugin to Plugin

```rust
// Via event bus
context.event_bus.emit("event_name", payload).await?;

// Via service interface
let service = context.get_service::<MyService>("service_name")?;
```

### Plugin to Core

```rust
// Access core services
let db = context.get_repository::<UserRepository>()?;
let users = db.get_all().await?;
```

### Frontend to Backend Plugin

```typescript
// Via communication bridge
const result = await context.communicationBridge.call('backend_command', payload);
```

## Best Practices

1. **Single Responsibility**: Each plugin should do one thing well
2. **Loose Coupling**: Plugins should not depend on each other directly
3. **Clear Interfaces**: Define clear contracts for plugin capabilities
4. **Error Handling**: Handle errors gracefully
5. **Logging**: Log important events for debugging
6. **Testing**: Write unit and integration tests
7. **Documentation**: Document plugin capabilities and usage

## Plugin Template

### Backend Template

```rust
// Template for new plugins
use crate::plugins::plugin_api::*;

pub struct {{PluginName}} {
    metadata: PluginMetadata,
}

impl {{PluginName}} {
    pub fn new() -> Self {
        Self {
            metadata: PluginMetadata {
                id: "{{plugin-id}}".to_string(),
                name: "{{Plugin Name}}".to_string(),
                version: "1.0.0".to_string(),
                description: "{{Description}}".to_string(),
                author: "{{Author}}".to_string(),
                dependencies: vec![],
            },
        }
    }
}

#[async_trait::async_trait]
impl Plugin for {{PluginName}} {
    // Implementation
}
```

### Frontend Template

```typescript
// Template for new plugins
import { Plugin, PluginMetadata, PluginCapability, PluginContext } from '../../plugin-api';

export class {{PluginName}} implements Plugin {
  metadata: PluginMetadata = {
    id: '{{plugin-id}}',
    name: '{{Plugin Name}}',
    version: '1.0.0',
    description: '{{Description}}',
  };

  capabilities: PluginCapability[] = [];

  async initialize(context: PluginContext): Promise<void> {
    // Initialization
  }
}
```

## Testing Plugins

### Backend Plugin Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_my_command() {
        let plugin = MyPlugin::new();
        let result = plugin.handle_command("my_command", serde_json::json!({})).await;
        assert!(result.is_ok());
    }
}
```

### Frontend Plugin Test

```typescript
describe('MyPlugin', () => {
  it('should handle my_command', async () => {
    const plugin = new MyPlugin();
    const result = await plugin.handleCommand('my_command', {});
    expect(result.success).toBe(true);
  });
});
```

## Publishing Plugins

1. Create plugin repository
2. Add README with usage instructions
3. Include plugin manifest (plugin.json)
4. Publish to plugin registry/marketplace

## Plugin Manifest

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Does something cool",
  "author": "Your Name",
  "repository": "https://github.com/...",
  "license": "MIT",
  "backend": {
    "minVersion": "1.0.0"
  },
  "frontend": {
    "minVersion": "1.0.0"
  },
  "capabilities": [
    {
      "type": "command",
      "name": "my_command",
      "description": "Does something cool"
    }
  ]
}
```
