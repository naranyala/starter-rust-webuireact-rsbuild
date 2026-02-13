import { useState, useEffect, useCallback } from 'react';

export interface EventPayload {
  [key: string]: any;
}

export interface Event {
  id: string;
  name: string;
  payload: EventPayload;
  timestamp: number;
  source: string;
}

export type EventHandler = (event: Event) => void;

class EventBusClass {
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private broadcastCallbacks: Set<EventHandler> = new Set();

  subscribe(eventName: string, handler: EventHandler): () => void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    const handlers = this.subscribers.get(eventName)!;
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventName);
      }
    };
  }

  subscribeAll(handler: EventHandler): () => void {
    this.broadcastCallbacks.add(handler);
    return () => {
      this.broadcastCallbacks.delete(handler);
    };
  }

  emit(eventName: string, payload: EventPayload = {}, source: string = 'frontend'): void {
    const event: Event = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: eventName,
      payload,
      timestamp: Date.now(),
      source,
    };
    const handlers = this.subscribers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try { handler(event); } catch (e) { console.error(e); }
      });
    }
    this.broadcastCallbacks.forEach(handler => {
      try { handler(event); } catch (e) { console.error(e); }
    });
  }

  emitSimple(eventName: string, payload: EventPayload): void {
    this.emit(eventName, payload);
  }
}

export const EventBus = new EventBusClass();

export const useEventBus = (eventName: string, handler: EventHandler): void => {
  useEffect(() => {
    return EventBus.subscribe(eventName, handler);
  }, [eventName, handler]);
};

export const useEventEmitter = () => {
  return useCallback((eventName: string, payload: EventPayload = {}) => {
    EventBus.emit(eventName, payload);
  }, []);
};

export enum AppEventType {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  DATA_CHANGED = 'data.changed',
  COUNTER_INCREMENTED = 'counter.incremented',
  DATABASE_OPERATION = 'database.operation',
  SYSTEM_HEALTH_CHECK = 'system.health.check',
  BACKEND_CONNECTED = 'backend.connected',
  BACKEND_DISCONNECTED = 'backend.disconnected',
  APP_START = 'app.start',
  APP_SHUTDOWN = 'app.shutdown',
  UI_READY = 'ui.ready',
}
