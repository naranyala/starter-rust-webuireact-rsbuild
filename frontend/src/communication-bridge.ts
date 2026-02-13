import { EventBus, AppEventType } from './event-bus';

// Communication bridge between frontend and backend
class CommunicationBridge {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds

  constructor(private backendUrl: string = 'ws://localhost:8080/ws') {
    this.connect();
    this.setupEventListeners();
  }

  private connect(): void {
    try {
      console.log(`Attempting to connect to ${this.backendUrl}`);
      this.ws = new WebSocket(this.backendUrl);

      this.ws.onopen = () => {
        console.log('Connected to backend via WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Emit connection event
        EventBus.emitSimple(AppEventType.BACKEND_CONNECTED, {
          timestamp: Date.now(),
          url: this.backendUrl
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          console.log('Received message from backend:', eventData);
          
          // Emit the received event through the event bus
          EventBus.emitSimple(eventData.name, {
            ...eventData.payload,
            source: 'backend'
          });
        } catch (error) {
          console.error('Error parsing message from backend:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from backend');
        this.isConnected = false;
        
        // Emit disconnection event
        EventBus.emitSimple(AppEventType.BACKEND_DISCONNECTED, {
          timestamp: Date.now(),
          reason: 'websocket_close'
        });
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            this.connect();
          }, this.reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  // Send an event to the backend
  public sendToBackend(eventType: string, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send event:', eventType);
      return;
    }

    const event = {
      id: Math.random().toString(36).substring(2, 15),
      name: eventType,
      payload: payload,
      timestamp: Date.now(),
      source: 'frontend'
    };

    try {
      this.ws.send(JSON.stringify(event));
      console.log('Sent event to backend:', eventType, payload);
    } catch (error) {
      console.error('Error sending event to backend:', error);
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
    // (be selective to avoid sending too many events)
    EventBus.subscribeAll((event) => {
      // Only forward certain events to backend
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
  }

  // Check if connected to backend
  public isConnectedToBackend(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection status
  public getConnectionStatus(): { connected: boolean; url: string; attempts: number } {
    return {
      connected: this.isConnectedToBackend(),
      url: this.backendUrl,
      attempts: this.reconnectAttempts
    };
  }

  // Close the connection
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
let communicationBridge: CommunicationBridge | null = null;

export const initCommunicationBridge = (backendUrl?: string): CommunicationBridge => {
  if (!communicationBridge) {
    communicationBridge = new CommunicationBridge(backendUrl);
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
    console.warn('Communication bridge not initialized, cannot send event:', eventType);
  }
};

// Helper function to check connection status
export const isBackendConnected = (): boolean => {
  const bridge = getCommunicationBridge();
  return bridge ? bridge.isConnectedToBackend() : false;
};

// Export the class for direct usage if needed
export { CommunicationBridge };