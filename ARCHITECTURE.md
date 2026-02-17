# Core + Plugin-Driven Architecture with MVVM

## Architecture Overview

This project follows a **Core + Plugin** architecture with complete **MVVM pattern** across both backend and frontend.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌────────────────────┐         ┌────────────────────────────┐  │
│  │   Frontend (React) │◄───────►│   Backend (Rust WebUI)     │  │
│  │   - Views          │  WebSocket  │   - WebUI Handlers     │  │
│  │   - ViewModels     │         │   - HTTP Server          │  │
│  │   - Plugins        │         │   - Plugins              │  │
│  └────────────────────┘         └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                       APPLICATION LAYER                        │
│  ┌────────────────────┐         ┌────────────────────────────┐  │
│  │   Use Cases        │         │   Commands/Queries (CQRS)  │  │
│  │   - User UseCases  │         │   - UserCommands          │  │
│  │   - Counter UseCases│        │   - CounterQueries        │  │
│  │   - System UseCases│         │   - SystemCommands        │  │
│  └────────────────────┘         └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                         DOMAIN LAYER                           │
│  ┌────────────────────┐         ┌────────────────────────────┐  │
│  │   Entities         │         │   Repository Interfaces    │  │
│  │   - User           │         │   - UserRepository        │  │
│  │   - Counter        │         │   - CounterRepository     │  │
│  │   - SystemInfo     │         │   - DatabaseRepository    │  │
│  └────────────────────┘         └────────────────────────────┘  │
│  ┌────────────────────┐         ┌────────────────────────────┐  │
│  │   Domain Services  │         │   Value Objects            │  │
│  │   - UserService    │         │   - Email                 │  │
│  │   - CounterService │         │   - Name                  │  │
│  └────────────────────┘         └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                     INFRASTRUCTURE LAYER                       │
│  ┌────────────────────┐         ┌────────────────────────────┐  │
│  │   Database (SQLite)│         │   Event Bus                │  │
│  │   - UserRepository │         │   - In-Memory             │  │
│  │   - CounterRepo    │         │   - Publish/Subscribe     │  │
│  └────────────────────┘         └────────────────────────────┘  │
│  ┌────────────────────┐         ┌────────────────────────────┐  │
│  │   WebSocket Server │         │   Logging                  │  │
│  │   - Real-time      │         │   - Tracing               │  │
│  └────────────────────┘         └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                        PLUGIN LAYER                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │   Database   │ │  System Info │ │   Window     │          │
│  │   Plugin     │ │   Plugin     │ │   Management │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │   Counter    │ │   Custom     │ │   Custom     │          │
│  │   Plugin     │ │   Plugin 1   │ │   Plugin N   │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
starter-rust-webuireact-rsbuild/
├── src/
│   ├── core/                          # Core framework (framework-agnostic)
│   │   ├── domain/                    # Domain layer (business rules)
│   │   │   ├── entities.rs            # Business entities (User, Counter, etc.)
│   │   │   ├── repositories.rs        # Repository traits
│   │   │   ├── services.rs            # Domain services
│   │   │   ├── value_objects.rs       # Value objects (Email, Name, etc.)
│   │   │   └── errors.rs              # Domain errors
│   │   └── application/               # Application layer (use cases)
│   │       ├── commands.rs            # CQRS commands
│   │       ├── queries.rs             # CQRS queries
│   │       ├── handlers.rs            # Command/Query handlers
│   │       └── dto.rs                 # Data transfer objects
│   │
│   ├── plugins/                       # Plugin system
│   │   ├── plugin-api/                # Plugin API definitions
│   │   │   └── mod.rs                 # Plugin trait, registry, context
│   │   └── plugins/                   # Built-in plugins
│   │       ├── database/              # Database plugin
│   │       ├── system-info/           # System info plugin
│   │       ├── window-management/     # Window management plugin
│   │       └── counter/               # Counter plugin
│   │
│   ├── infrastructure/                # Infrastructure implementations
│   │   ├── database/                  # SQLite implementation
│   │   ├── event_bus/                 # Event bus implementation
│   │   ├── websocket/                 # WebSocket server
│   │   ├── logging/                   # Logging setup
│   │   └── serialization/             # Multi-format serialization
│   │
│   └── presentation/                  # Presentation layer
│       ├── webui/                     # WebUI handlers
│       ├── http/                      # HTTP server
│       └── viewmodels/                # View models for UI
│
└── frontend/
    └── src/
        ├── core/                      # Frontend core
        │   ├── entities/              # Frontend entities
        │   ├── use-cases/             # Use cases (ViewModel logic)
        │   └── services/              # Core services
        │
        ├── plugins/                   # Frontend plugins
        │   ├── plugin-api/            # Plugin API
        │   └── plugins/               # Plugin implementations
        │
        ├── view-models/               # ViewModels
        │   ├── communication-bridge.ts # WebSocket bridge
        │   └── window-manager.ts      # Window management
        │
        └── views/                     # Views (Components)
            ├── components/            # UI components
            └── App.tsx                # Main component
```

## MVVM Pattern Implementation

### Backend (Rust)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   WebUI     │─────►│  ViewModel   │─────►│   Model     │
│   Handler   │      │  (Handlers)  │      │ (Domain)    │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Commands/   │
                    │   Queries    │
                    └──────────────┘
```

### Frontend (React)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────►│  ViewModel   │─────►│   Model     │
│  Component  │      │   (Hook)     │      │ (Service)   │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Use Cases   │
                    └──────────────┘
```

## Plugin System

### Creating a Plugin

#### Backend Plugin (Rust)

```rust
use crate::plugins::plugin_api::{Plugin, PluginMetadata, PluginCapability, PluginContext};

pub struct MyPlugin {
    metadata: PluginMetadata,
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
                        Ok(serde_json::json!({ "result": "success" }))
                    })
                }),
            }
        ]
    }
    
    async fn initialize(&mut self, _context: &PluginContext) -> Result<(), String> {
        // Initialize plugin
        Ok(())
    }
    
    async fn handle_command(
        &self,
        command: &str,
        payload: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        match command {
            "my_command" => Ok(serde_json::json!({ "result": "success" })),
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
}
```

#### Frontend Plugin (TypeScript)

```typescript
import { Plugin, PluginMetadata } from '../plugin-api';

export class MyPlugin implements Plugin {
  metadata: PluginMetadata = {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Does something cool',
  };

  async initialize(context: PluginContext): Promise<void> {
    // Initialize plugin
  }

  async handleCommand(command: string, payload: any): Promise<any> {
    if (command === 'my_command') {
      return { result: 'success' };
    }
    throw new Error(`Unknown command: ${command}`);
  }
}
```

### Registering Plugins

#### Backend

```rust
// In main.rs or app builder
let mut registry = PluginRegistry::new();

// Register built-in plugins
registry.register(Arc::new(DatabasePlugin::new())).unwrap();
registry.register(Arc::new(SystemInfoPlugin::new())).unwrap();
registry.register(Arc::new(CounterPlugin::new())).unwrap();

// Register custom plugins
registry.register(Arc::new(MyCustomPlugin::new())).unwrap();
```

#### Frontend

```typescript
// In App.tsx or plugin manager
const pluginManager = new PluginManager();

// Register plugins
pluginManager.register(new DatabasePlugin());
pluginManager.register(new SystemInfoPlugin());
pluginManager.register(new CounterPlugin());
```

## Adding a New Feature

### Example: Adding a "Todo" Feature

#### 1. Domain Layer (Backend)

```rust
// src/core/domain/entities.rs
#[derive(Debug, Clone)]
pub struct Todo {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: DateTime<Utc>,
}
```

#### 2. Repository Interface

```rust
// src/core/domain/repositories.rs
#[async_trait::async_trait]
pub trait TodoRepository: Send + Sync {
    async fn get_all(&self) -> DomainResult<Vec<Todo>>;
    async fn create(&self, todo: Todo) -> DomainResult<Todo>;
    async fn update(&self, todo: Todo) -> DomainResult<Todo>;
    async fn delete(&self, id: i64) -> DomainResult<()>;
}
```

#### 3. Infrastructure Implementation

```rust
// src/plugins/plugins/todo/mod.rs
pub struct TodoPlugin {
    repository: Arc<dyn TodoRepository>,
}

#[async_trait::async_trait]
impl Plugin for TodoPlugin {
    fn capabilities(&self) -> Vec<PluginCapability> {
        vec![
            PluginCapability::Command {
                name: "get_todos".to_string(),
                // ... handler implementation
            },
            PluginCapability::Command {
                name: "create_todo".to_string(),
                // ... handler implementation
            },
        ]
    }
}
```

#### 4. Frontend ViewModel

```typescript
// frontend/src/view-models/todo-view-model.ts
export const useTodoViewModel = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const loadTodos = useCallback(async () => {
    const response = await communicationBridge.call('get_todos', {});
    setTodos(response.data);
  }, []);

  const createTodo = useCallback(async (title: string) => {
    await communicationBridge.call('create_todo', { title });
    await loadTodos();
  }, [loadTodos]);

  return { todos, loadTodos, createTodo };
};
```

#### 5. Frontend View

```typescript
// frontend/src/views/components/TodoList.tsx
export const TodoList: React.FC = () => {
  const { todos, loadTodos, createTodo } = useTodoViewModel();

  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
};
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Core logic can be tested without infrastructure
3. **Extensibility**: New features can be added as plugins
4. **Maintainability**: Clear boundaries make code easier to understand
5. **Reusability**: Core and plugins can be reused across projects
6. **Flexibility**: Infrastructure can be swapped without changing business logic

## Next Steps

1. Migrate existing features to plugin structure
2. Add plugin documentation
3. Create plugin templates
4. Add integration tests
5. Create plugin marketplace structure
