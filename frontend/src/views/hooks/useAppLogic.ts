// Custom hooks for App component

import { useState, useEffect } from 'react';
import { EventBus, AppEventType, useEventBus, useEventEmitter } from '../../models/event-bus';
import type { WsStatus } from '../types';

export const useWebSocketStatus = () => {
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [expanded, setExpanded] = useState(false);

  // Subscribe to backend connected event
  useEventBus(AppEventType.BACKEND_CONNECTED, (event) => {
    console.log('Backend connected', event.payload);
    setWsStatus('connected');
  });

  // Subscribe to UI ready event from backend
  useEventBus(AppEventType.UI_READY, (event) => {
    console.log('UI ready event received from backend', event.payload);
    setWsStatus('connected');
  });

  useEffect(() => {
    const handleDisconnected = () => setWsStatus('disconnected');
    const handleStateChange = (e: CustomEvent) => {
      const { newState } = e.detail;
      if (newState === 'open' || newState === 'ready') setWsStatus('connected');
      else if (newState === 'connecting' || newState === 'reconnecting') setWsStatus('connecting');
      else if (newState === 'closed' || newState === 'error') setWsStatus('disconnected');
    };

    window.addEventListener('webui_disconnected', handleDisconnected);
    window.addEventListener('webui_connection_state_change', handleStateChange as EventListener);

    // Check initial state
    const checkInitialStatus = () => {
      if ((window as any).WebUI?.isConnected()) {
        setWsStatus('connected');
      } else {
        const stateInfo = (window as any).WebUI?.getConnectionState();
        if (stateInfo) {
          if (stateInfo.state === 'connecting' || stateInfo.state === 'reconnecting') {
            setWsStatus('connecting');
          } else {
            setWsStatus('disconnected');
          }
        }
      }
    };

    checkInitialStatus();
    const statusCheckInterval = setInterval(checkInitialStatus, 2000);

    return () => {
      window.removeEventListener('webui_disconnected', handleDisconnected);
      window.removeEventListener('webui_connection_state_change', handleStateChange as EventListener);
      clearInterval(statusCheckInterval);
    };
  }, []);

  return { wsStatus, expanded, setExpanded };
};

export const useAppInitialization = () => {
  const emitEvent = useEventEmitter();

  useEffect(() => {
    console.log('Application initialized');

    // Emit app start event
    emitEvent(AppEventType.APP_START, {
      timestamp: Date.now(),
      platform: 'frontend',
      userAgent: navigator.userAgent
    });

    // Emit UI ready event
    emitEvent(AppEventType.UI_READY, {
      timestamp: Date.now(),
      message: 'Frontend UI is ready and listening'
    });

    return () => {
      // Emit app shutdown event
      emitEvent(AppEventType.APP_SHUTDOWN, {
        timestamp: Date.now(),
        reason: 'component_unmount'
      });
    };
  }, [emitEvent]);
};

export const useWindowManager = () => {
  const [activeWindows, setActiveWindows] = useState<any[]>([]);

  useEffect(() => {
    const updateActiveWindows = () => {
      const { windowManager } = require('../../services/window-manager');
      setActiveWindows([...windowManager.getAllWindows()]);
    };

    const intervalId = setInterval(updateActiveWindows, 100);
    updateActiveWindows();

    return () => clearInterval(intervalId);
  }, []);

  return { activeWindows, setActiveWindows };
};
