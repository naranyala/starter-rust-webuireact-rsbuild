import { EventBus, AppEventType } from '../models/event-bus';

// WebSocket connection states (matching WebSocket API)
enum WSReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}

// Enhanced connection states for tracking
enum ConnectionState {
  UNINSTANTIATED = 'uninstantiated',
  CONNECTING = 'connecting',
  OPEN = 'open',
  READY = 'ready',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Error types for detailed tracking
enum ErrorType {
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  TRANSPORT_ERROR = 'TRANSPORT_ERROR',
  SOCKET_ERROR = 'SOCKET_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

interface ConnectionError {
  type: ErrorType;
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

interface ConnectionStats {
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  errorsCount: number;
  reconnects: number;
  connectAttempts: number;
  lastMessageAt: number | null;
  lastError: ConnectionError | null;
  connectionStartTime: number;
}

// Communication bridge between frontend and backend
class CommunicationBridge {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.UNINSTANTIATED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private initialReconnectInterval: number = 3000;
  private maxReconnectInterval: number = 30000;
  private connectionTimeout: number = 10000;
  private lastError: ConnectionError | null = null;
  private stats: ConnectionStats = this.initStats();
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly pingIntervalMs: number = 30000;

  constructor(private backendUrl: string = 'ws://localhost:8080/ws') {
    this.connect();
    this.setupEventListeners();
  }

  private initStats(): ConnectionStats {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      errorsCount: 0,
      reconnects: 0,
      connectAttempts: 0,
      lastMessageAt: null,
      lastError: null,
      connectionStartTime: Date.now()
    };
  }

  private createError(type: ErrorType, message: string, details?: Record<string, unknown>): ConnectionError {
    const error: ConnectionError = {
      type,
      message,
      timestamp: Date.now(),
      details
    };
    this.lastError = error;
    this.stats.lastError = error;
    this.stats.errorsCount++;
    return error;
  }

  private setConnectionState(newState: ConnectionState, reason?: string): void {
    const oldState = this.connectionState;
    this.connectionState = newState;
    console.log(`[CommunicationBridge] State: ${oldState} -> ${newState}`, reason ? `(${reason})` : '');
    
    EventBus.emitSimple(AppEventType.BACKEND_CONNECTION_STATE, {
      oldState,
      newState,
      reason,
      timestamp: Date.now()
    });
  }

  private connect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[CommunicationBridge] Maximum reconnection attempts reached');
      this.setConnectionState(ConnectionState.ERROR, 'max_attempts');
      EventBus.emitSimple(AppEventType.BACKEND_ERROR, {
        error: this.createError(ErrorType.CONNECTION_REFUSED, 'Max reconnection attempts reached')
      });
      return;
    }

    try {
      const attempt = this.reconnectAttempts + 1;
      console.log(`[CommunicationBridge] Connecting... (attempt ${attempt}/${this.maxReconnectAttempts})`);
      this.setConnectionState(ConnectionState.CONNECTING, `attempt_${attempt}`);

      // Set up connection timeout
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
      }
      
      this.connectionTimer = setTimeout(() => {
        if (this.ws && this.ws.readyState === WSReadyState.CONNECTING) {
          console.error('[CommunicationBridge] Connection timeout');
          this.ws.close();
          this.handleConnectionError(this.createError(ErrorType.CONNECTION_TIMEOUT, 'Connection timeout after 10 seconds'));
        }
      }, this.connectionTimeout);

      this.ws = new WebSocket(this.backendUrl);

      this.ws.onopen = () => {
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer);
        }
        console.log('[CommunicationBridge] Connected to backend');
        this.setConnectionState(ConnectionState.OPEN, 'onopen');
        this.reconnectAttempts = 0;
        
        // Start ping interval for connection health
        this.startPingInterval();
        
        EventBus.emitSimple(AppEventType.BACKEND_CONNECTED, {
          timestamp: Date.now(),
          url: this.backendUrl,
          stats: this.getStats()
        });
      };

      this.ws.onmessage = (event) => {
        this.stats.messagesReceived++;
        this.stats.bytesReceived += event.data.length;
        this.stats.lastMessageAt = Date.now();
        
        try {
          const eventData = JSON.parse(event.data);
          console.log('[CommunicationBridge] Received message:', eventData);
          
          // Emit the received event through the event bus
          EventBus.emitSimple(eventData.name, {
            ...eventData.payload,
            source: 'backend'
          });
        } catch (error) {
          console.error('[CommunicationBridge] Error parsing message:', error);
          EventBus.emitSimple(AppEventType.BACKEND_ERROR, {
            error: this.createError(ErrorType.PARSE_ERROR, (error as Error).message)
          });
        }
      };

      this.ws.onclose = (event) => {
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer);
        }
        this.stopPingInterval();
        
        console.log('[CommunicationBridge] Disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        const oldState = this.connectionState;
        this.setConnectionState(ConnectionState.CLOSED, `code_${event.code}`);
        
        EventBus.emitSimple(AppEventType.BACKEND_DISCONNECTED, {
          timestamp: Date.now(),
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          lastError: this.lastError
        });
        
        // Don't reconnect on clean close
        if (event.wasClean && event.code === 1000) {
          console.log('[CommunicationBridge] Clean close, not reconnecting');
          return;
        }

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts && oldState !== ConnectionState.CLOSING) {
          this.reconnectAttempts++;
          this.stats.reconnects++;
          
          const delay = Math.min(
            this.initialReconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
            this.maxReconnectInterval
          );
          
          console.log(`[CommunicationBridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          this.setConnectionState(ConnectionState.RECONNECTING, `attempt_${this.reconnectAttempts}`);
          
          setTimeout(() => {
            this.connect();
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.setConnectionState(ConnectionState.ERROR, 'max_attempts_reached');
          EventBus.emitSimple(AppEventType.BACKEND_ERROR, {
            error: this.createError(ErrorType.CONNECTION_REFUSED, 'Max reconnection attempts reached')
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error('[CommunicationBridge] WebSocket error:', error);
        this.handleConnectionError(this.createError(ErrorType.SOCKET_ERROR, 'WebSocket error occurred'));
      };
    } catch (error) {
      console.error('[CommunicationBridge] Failed to establish connection:', error);
      this.handleConnectionError(this.createError(ErrorType.TRANSPORT_ERROR, (error as Error).message));
    }
  }

  private handleConnectionError(error: ConnectionError): void {
    this.lastError = error;
    this.stats.lastError = error;
    this.stats.errorsCount++;
    console.error('[CommunicationBridge] Connection error:', error);
    this.setConnectionState(ConnectionState.ERROR, error.type);
    
    EventBus.emitSimple(AppEventType.BACKEND_ERROR, { error });
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WSReadyState.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('[CommunicationBridge] Failed to send ping:', error);
        }
      }
    }, this.pingIntervalMs);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Send an event to the backend
  public sendToBackend(eventType: string, payload: any): boolean {
    if (!this.ws || this.ws.readyState !== WSReadyState.OPEN) {
      console.warn('[CommunicationBridge] WebSocket not connected, cannot send:', eventType);
      EventBus.emitSimple(AppEventType.BACKEND_ERROR, {
        error: this.createError(ErrorType.TRANSPORT_ERROR, 'WebSocket not connected')
      });
      return false;
    }

    const event = {
      id: Math.random().toString(36).substring(2, 15),
      name: eventType,
      payload: payload,
      timestamp: Date.now(),
      source: 'frontend'
    };

    try {
      const jsonStr = JSON.stringify(event);
      this.ws.send(jsonStr);
      this.stats.messagesSent++;
      this.stats.bytesSent += jsonStr.length;
      console.log('[CommunicationBridge] Sent event:', eventType, payload);
      return true;
    } catch (error) {
      console.error('[CommunicationBridge] Error sending event:', error);
      EventBus.emitSimple(AppEventType.BACKEND_ERROR, {
        error: this.createError(ErrorType.SERIALIZATION_ERROR, (error as Error).message)
      });
      return false;
    }
  }

  // Setup event listeners to forward events to backend
  private setupEventListeners(): void {
    // Listen for specific events that should be sent to backend
    EventBus.subscribe(AppEventType.USER_LOGIN, (event) => {
      this.sendToBackend(event.name, event.payload);
    });

    EventBus.subscribe(AppEventType.USER_LOGOUT, (event) => {
      this.sendToBackend(event.name, event.payload);
    });

    EventBus.subscribe(AppEventType.DATA_CHANGED, (event) => {
      this.sendToBackend(event.name, event.payload);
    });

    // Subscribe to all events that should be forwarded to backend
    EventBus.subscribeAll((event) => {
      const eventsToSend = [
        AppEventType.USER_LOGIN,
        AppEventType.USER_LOGOUT,
        AppEventType.DATA_CHANGED,
        AppEventType.COUNTER_INCREMENTED
      ];

      if (eventsToSend.includes(event.name as AppEventType)) {
        this.sendToBackend(event.name, event.payload);
      }
    });

    // Listen for window state changes from the window manager
    window.addEventListener('window-state-change', (event: any) => {
      const detail = event.detail;
      this.sendToBackend('window.state.change', detail);
    });
  }

  // Check if connected to backend
  public isConnectedToBackend(): boolean {
    return this.ws?.readyState === WSReadyState.OPEN;
  }

  // Get connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Get connection status with detailed info
  public getConnectionStatus(): { 
    connected: boolean; 
    state: ConnectionState;
    url: string; 
    attempts: number;
    stats: ConnectionStats;
    lastError: ConnectionError | null;
  } {
    return {
      connected: this.isConnectedToBackend(),
      state: this.connectionState,
      url: this.backendUrl,
      attempts: this.reconnectAttempts,
      stats: this.getStats(),
      lastError: this.lastError
    };
  }

  // Get connection statistics
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  // Manual reconnect
  public reconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.reconnectAttempts = 0;
    this.stats = this.initStats();
    this.connect();
  }

  // Manual disconnect
  public disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.setConnectionState(ConnectionState.CLOSED, 'manual_disconnect');
    }
  }

  // Get last error
  public getLastError(): ConnectionError | null {
    return this.lastError;
  }
}

// Create a singleton instance
let communicationBridge: CommunicationBridge | null = null;

export const initCommunicationBridge = (backendUrl?: string): CommunicationBridge => {
  if (!communicationBridge) {
    // Default to WebSocket port 9000 (matching backend)
    communicationBridge = new CommunicationBridge(backendUrl || 'ws://localhost:9000');
  }
  return communicationBridge;
};

export const getCommunicationBridge = (): CommunicationBridge | null => {
  return communicationBridge;
};

// Helper function to send events to backend
export const sendEventToBackend = (eventType: string, payload: any): void => {
  const bridge = getCommunicationBridge();
  if (bridge) {
    bridge.sendToBackend(eventType, payload);
  } else {
    console.warn('[CommunicationBridge] Not initialized, cannot send event:', eventType);
  }
};

// Helper function to check connection status
export const isBackendConnected = (): boolean => {
  const bridge = getCommunicationBridge();
  return bridge ? bridge.isConnectedToBackend() : false;
};

// Helper function to get connection status
export const getBackendConnectionStatus = (): ReturnType<CommunicationBridge['getConnectionStatus']> | null => {
  const bridge = getCommunicationBridge();
  return bridge ? bridge.getConnectionStatus() : null;
};

// Export the class and enums for external use
export { CommunicationBridge, ConnectionState, ErrorType };
export type { ConnectionError, ConnectionStats };
