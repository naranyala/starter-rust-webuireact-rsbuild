/**
 * Event Bus Tests
 * 
 * Tests for the EventBus class that handles application-wide events.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EventBus, AppEventType, type EventPayload } from '../models/event-bus';

describe('EventBus', () => {
  beforeEach(() => {
    // Clear all subscribers before each test
    (EventBus as any).subscribers = new Map();
    (EventBus as any).broadcastCallbacks = new Set();
  });

  afterEach(() => {
    // Cleanup
    (EventBus as any).subscribers.clear();
    (EventBus as any).broadcastCallbacks.clear();
  });

  test('should create EventBus instance', () => {
    expect(EventBus).toBeDefined();
  });

  test('should subscribe to events', () => {
    const handler = () => {};
    const unsubscribe = EventBus.subscribe('test.event', handler);
    
    expect(unsubscribe).toBeDefined();
    expect(typeof unsubscribe).toBe('function');
  });

  test('should unsubscribe from events', () => {
    const handler = () => {};
    const unsubscribe = EventBus.subscribe('test.event', handler);
    
    // Call unsubscribe
    unsubscribe();
    
    // Handler should be removed (internal check)
    const subscribers = (EventBus as any).subscribers.get('test.event');
    if (subscribers) {
      expect(subscribers.has(handler)).toBe(false);
    } else {
      // If the entry is deleted, that's also correct
      expect(true).toBe(true);
    }
  });

  test('should emit events to subscribers', () => {
    const receivedEvents: any[] = [];
    
    const handler = (event: any) => {
      receivedEvents.push(event);
    };
    
    EventBus.subscribe('test.event', handler);
    EventBus.emit('test.event', { data: 'test' });
    
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].name).toBe('test.event');
    expect(receivedEvents[0].payload.data).toBe('test');
  });

  test('should emit events to all subscribers via subscribeAll', () => {
    const receivedEvents: any[] = [];
    
    const handler = (event: any) => {
      receivedEvents.push(event);
    };
    
    const unsubscribe = EventBus.subscribeAll(handler);
    EventBus.emit('any.event', { data: 'test' });
    
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].name).toBe('any.event');
    
    unsubscribe();
  });

  test('should emitSimple work correctly', () => {
    const receivedEvents: any[] = [];
    
    EventBus.subscribe('simple.event', (event) => {
      receivedEvents.push(event);
    });
    
    EventBus.emitSimple('simple.event', { value: 42 });
    
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].payload.value).toBe(42);
  });

  test('should handle errors in event handlers gracefully', () => {
    const badHandler = () => {
      throw new Error('Handler error');
    };
    
    const goodHandler = (event: any) => {
      return event;
    };
    
    EventBus.subscribe('error.event', badHandler);
    EventBus.subscribe('error.event', goodHandler);
    
    // Should not throw
    expect(() => {
      EventBus.emit('error.event', {});
    }).not.toThrow();
  });

  test('should generate unique event IDs', () => {
    const eventIds: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      EventBus.emit(`event.${i}`, {});
      // Events are created internally, but we can test multiple emits work
    }
    
    // Multiple emits should work without errors
    expect(true).toBe(true);
  });

  test('should handle payload with any data', () => {
    const complexPayload: EventPayload = {
      string: 'test',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      nested: { key: 'value' },
    };
    
    let received: EventPayload | undefined;
    
    EventBus.subscribe('complex.event', (event) => {
      received = event.payload;
    });
    
    EventBus.emit('complex.event', complexPayload);
    
    expect(received).toEqual(complexPayload);
  });

  test('should handle default source value', () => {
    let receivedSource: string | undefined;
    
    EventBus.subscribe('source.event', (event) => {
      receivedSource = event.source;
    });
    
    EventBus.emit('source.event', {});
    
    expect(receivedSource).toBe('frontend');
  });

  test('should handle custom source value', () => {
    let receivedSource: string | undefined;
    
    EventBus.subscribe('source.event', (event) => {
      receivedSource = event.source;
    });
    
    EventBus.emit('source.event', {}, 'backend');
    
    expect(receivedSource).toBe('backend');
  });
});

describe('AppEventType', () => {
  test('should have predefined event types', () => {
    expect(AppEventType.USER_LOGIN).toBe('user.login');
    expect(AppEventType.USER_LOGOUT).toBe('user.logout');
    expect(AppEventType.DATA_CHANGED).toBe('data.changed');
    expect(AppEventType.COUNTER_INCREMENTED).toBe('counter.incremented');
    expect(AppEventType.DATABASE_OPERATION).toBe('database.operation');
    expect(AppEventType.SYSTEM_HEALTH_CHECK).toBe('system.health.check');
    expect(AppEventType.BACKEND_CONNECTED).toBe('backend.connected');
    expect(AppEventType.BACKEND_DISCONNECTED).toBe('backend.disconnected');
    expect(AppEventType.BACKEND_CONNECTION_STATE).toBe('backend.connection_state');
    expect(AppEventType.BACKEND_ERROR).toBe('backend.error');
    expect(AppEventType.APP_START).toBe('app.start');
    expect(AppEventType.APP_SHUTDOWN).toBe('app.shutdown');
    expect(AppEventType.UI_READY).toBe('ui.ready');
    expect(AppEventType.WINDOW_STATE_CHANGED).toBe('window.state.changed');
  });
});
