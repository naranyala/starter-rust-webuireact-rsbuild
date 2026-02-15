import { EventBus, AppEventType } from '../models/event-bus';

declare global {
  interface Window {
    WinBox: any;
    Logger?: {
      info: (message: string, meta?: Record<string, any>) => void;
      warn: (message: string, meta?: Record<string, any>) => void;
      error: (message: string, meta?: Record<string, any>) => void;
      debug: (message: string, meta?: Record<string, any>) => void;
    };
  }
}

interface WindowInfo {
  id: string;
  title: string;
  minimized: boolean;
  maximized?: boolean;
  focused: boolean;
  winboxInstance: any;
  createdAt: number;
}

class WindowManager {
  private windows: Map<string, WindowInfo> = new Map();
  private focusedWindowId: string | null = null;
  private eventBus: typeof EventBus;

  constructor() {
    this.eventBus = EventBus;
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    // Listen for window focus changes
    window.addEventListener('focus', this.handleFocusChange.bind(this), true);
    
    // Listen for window blur changes
    window.addEventListener('blur', this.handleBlurChange.bind(this), true);
  }

  private handleFocusChange(event: FocusEvent) {
    // This is tricky since winbox windows are iframes
    // We'll rely on winbox's own events instead
  }

  private handleBlurChange(event: FocusEvent) {
    // Handle when the main window loses focus
  }

  public registerWindow(id: string, title: string, winboxInstance: any): WindowInfo {
    const windowInfo: WindowInfo = {
      id,
      title,
      minimized: false,
      maximized: false,
      focused: false,
      winboxInstance,
      createdAt: Date.now(),
    };

    this.windows.set(id, windowInfo);
    
    // Set up winbox-specific event listeners
    this.setupWinboxListeners(id, winboxInstance);
    
    // Log window creation
    this.logWindowEvent('created', windowInfo);
    
    // If this is the first window, focus it
    if (this.windows.size === 1 && !this.focusedWindowId) {
      this.focusWindow(id);
    }

    return windowInfo;
  }

  private setupWinboxListeners(id: string, winboxInstance: any) {
    // Focus event
    winboxInstance.onfocus = () => {
      this.focusWindow(id);
    };

    // Blur event
    winboxInstance.onblur = () => {
      this.blurWindow(id);
    };

    // Minimize event
    winboxInstance.onminimize = () => {
      this.minimizeWindow(id);
    };

    // Restore event (from minimized)
    winboxInstance.onrestore = () => {
      this.restoreWindow(id);
    };

    // Maximize event
    winboxInstance.onmaximize = () => {
      this.maximizeWindow(id);
    };

    // Close event
    winboxInstance.onclose = () => {
      this.closeWindow(id);
    };
  }

  public focusWindow(id: string) {
    const windowInfo = this.windows.get(id);
    if (!windowInfo) return;

    // Blur previously focused window
    if (this.focusedWindowId && this.focusedWindowId !== id) {
      this.blurWindow(this.focusedWindowId);
    }

    // Update window state
    windowInfo.focused = true;
    this.focusedWindowId = id;

    // Update all other windows to not be focused
    this.windows.forEach((win, winId) => {
      if (winId !== id) {
        win.focused = false;
      }
    });

    this.logWindowEvent('focused', windowInfo);
  }

  public blurWindow(id: string) {
    const windowInfo = this.windows.get(id);
    if (!windowInfo) return;

    windowInfo.focused = false;
    
    if (this.focusedWindowId === id) {
      this.focusedWindowId = null;
    }

    this.logWindowEvent('blurred', windowInfo);
  }

  public minimizeWindow(id: string) {
    const windowInfo = this.windows.get(id);
    if (!windowInfo) return;

    windowInfo.minimized = true;
    windowInfo.focused = false;

    if (this.focusedWindowId === id) {
      this.focusedWindowId = null;
    }

    this.logWindowEvent('minimized', windowInfo);
  }

  public restoreWindow(id: string) {
    const windowInfo = this.windows.get(id);
    if (!windowInfo) return;

    windowInfo.minimized = false;
    
    // Optionally focus the restored window
    // this.focusWindow(id);

    this.logWindowEvent('restored', windowInfo);
  }

  public maximizeWindow(id: string) {
    const windowInfo = this.windows.get(id);
    if (!windowInfo) return;

    windowInfo.maximized = true;

    this.logWindowEvent('maximized', windowInfo);
  }

  public closeWindow(id: string) {
    const windowInfo = this.windows.get(id);
    if (!windowInfo) return;

    this.logWindowEvent('closed', windowInfo);

    // Clean up the window from our registry
    this.windows.delete(id);

    // If the closed window was focused, clear focus
    if (this.focusedWindowId === id) {
      this.focusedWindowId = null;
      
      // Focus another available window if possible
      const remainingWindows = Array.from(this.windows.values());
      if (remainingWindows.length > 0) {
        this.focusWindow(remainingWindows[0].id);
      }
    }
  }

  private logWindowEvent(action: string, windowInfo: WindowInfo) {
    const logMessage = `Window "${windowInfo.title}" (${windowInfo.id}) ${action}`;
    const logMeta = {
      windowId: windowInfo.id,
      windowTitle: windowInfo.title,
      action,
      focused: windowInfo.focused,
      minimized: windowInfo.minimized,
      maximized: windowInfo.maximized,
      timestamp: new Date().toISOString(),
      totalWindows: this.windows.size,
    };

    // Log to console
    console.log(`[WINDOW-${action.toUpperCase()}]`, logMessage, logMeta);

    // Send to backend via event bus if available
    if (typeof window !== 'undefined' && window.Logger) {
      window.Logger.info(logMessage, logMeta);
    }

    // Emit event to backend via WebUI
    this.emitWindowEventToBackend(action, windowInfo);
  }

  private emitWindowEventToBackend(action: string, windowInfo: WindowInfo) {
    // Create the window state change payload
    const payload = {
      id: windowInfo.id,
      title: windowInfo.title,
      action,
      focused: windowInfo.focused,
      minimized: windowInfo.minimized,
      maximized: windowInfo.maximized,
      timestamp: Date.now(),
      totalWindows: this.windows.size,
    };

    // Try to send via WebUI call first
    if (window.webui && typeof window.webui.call === 'function') {
      try {
        window.webui.call('window_state_change', payload);
        console.log(`[WINDOW-MANAGER] Sent ${action} event for window "${windowInfo.title}" via WebUI`);
      } catch (error) {
        console.error(`[WINDOW-MANAGER] Error sending ${action} event via WebUI:`, error);
        // Fallback to custom event
        this.dispatchCustomEvent(payload);
      }
    } else {
      // Fallback: emit event to backend via custom event that gets picked up by communication bridge
      this.dispatchCustomEvent(payload);
    }
  }

  private dispatchCustomEvent(payload: any) {
    const windowEvent = new CustomEvent('window-state-change', {
      detail: payload
    });
    window.dispatchEvent(windowEvent);
    console.log(`[WINDOW-MANAGER] Dispatched window-state-change event:`, payload);
  }

  public getFocusedWindow(): WindowInfo | null {
    if (!this.focusedWindowId) return null;
    return this.windows.get(this.focusedWindowId) || null;
  }

  public getAllWindows(): WindowInfo[] {
    return Array.from(this.windows.values());
  }

  public getWindowById(id: string): WindowInfo | null {
    return this.windows.get(id) || null;
  }

  public getTotalWindows(): number {
    return this.windows.size;
  }

  public getFocusedWindowId(): string | null {
    return this.focusedWindowId;
  }
}

// Create a singleton instance
const windowManager = new WindowManager();

export { windowManager, WindowManager, WindowInfo };