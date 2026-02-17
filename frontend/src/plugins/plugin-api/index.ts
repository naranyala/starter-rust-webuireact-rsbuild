/**
 * Plugin API for Frontend
 * 
 * Defines the interface that all frontend plugins must implement.
 */

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[];
}

export interface PluginCapability {
  type: 'command' | 'component' | 'model' | 'service';
  name: string;
  description?: string;
  handler?: (payload: any) => Promise<any>;
  template?: string;
  schema?: any;
}

export interface PluginContext {
  config: Record<string, any>;
  eventBus: EventBus;
  logger: Logger;
  communicationBridge: CommunicationBridge;
}

export interface Plugin {
  metadata: PluginMetadata;
  capabilities: PluginCapability[];
  
  initialize(context: PluginContext): Promise<void>;
  shutdown?(): Promise<void>;
  handleCommand?(command: string, payload: any): Promise<any>;
}

export interface EventBus {
  emit(event: string, payload: any): void;
  subscribe(event: string, handler: (payload: any) => void): () => void;
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface CommunicationBridge {
  call(command: string, payload: any): Promise<any>;
  subscribe(handler: (event: any) => void): void;
  isConnected(): boolean;
}

/**
 * Plugin Manager - Manages plugin lifecycle
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private capabilities: Map<string, Plugin> = new Map();
  private context: PluginContext | null = null;

  constructor() {}

  setContext(context: PluginContext) {
    this.context = context;
  }

  register(plugin: Plugin): void {
    const { id } = plugin.metadata;
    
    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} already registered`);
    }

    // Register capabilities
    for (const capability of plugin.capabilities) {
      if (capability.type === 'command' && capability.handler) {
        this.capabilities.set(capability.name, plugin);
      }
    }

    this.plugins.set(id, plugin);
    console.log(`[Plugin] Registered: ${id} v${plugin.metadata.version}`);
  }

  async initialize(): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin context not set');
    }

    for (const plugin of this.plugins.values()) {
      try {
        await plugin.initialize(this.context);
        console.log(`[Plugin] Initialized: ${plugin.metadata.id}`);
      } catch (error) {
        console.error(`[Plugin] Failed to initialize ${plugin.metadata.id}:`, error);
      }
    }
  }

  async handleCommand(command: string, payload: any): Promise<any> {
    const plugin = this.capabilities.get(command);
    
    if (!plugin) {
      throw new Error(`Unknown command: ${command}`);
    }

    if (!plugin.handleCommand) {
      throw new Error(`Plugin ${plugin.metadata.id} does not handle commands`);
    }

    return plugin.handleCommand(command, payload);
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async shutdown(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.shutdown) {
        try {
          await plugin.shutdown();
          console.log(`[Plugin] Shutdown: ${plugin.metadata.id}`);
        } catch (error) {
          console.error(`[Plugin] Failed to shutdown ${plugin.metadata.id}:`, error);
        }
      }
    }
  }
}
