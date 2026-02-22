/**
 * Communication Bridge Tests
 * 
 * Tests for the WebSocket communication bridge constants and helper functions.
 * Note: Full WebSocket testing requires browser environment.
 */

import { describe, test, expect } from 'bun:test';
import { 
  ConnectionState, 
  ErrorType,
  getCommunicationBridge,
  isBackendConnected,
} from '../view-models/communication-bridge';

describe('ConnectionState enum', () => {
  test('should have all connection states defined', () => {
    expect(ConnectionState.UNINSTANTIATED).toBe('uninstantiated');
    expect(ConnectionState.CONNECTING).toBe('connecting');
    expect(ConnectionState.OPEN).toBe('open');
    expect(ConnectionState.READY).toBe('ready');
    expect(ConnectionState.CLOSING).toBe('closing');
    expect(ConnectionState.CLOSED).toBe('closed');
    expect(ConnectionState.RECONNECTING).toBe('reconnecting');
    expect(ConnectionState.ERROR).toBe('error');
  });
});

describe('ErrorType enum', () => {
  test('should have all error types defined', () => {
    expect(ErrorType.CONNECTION_REFUSED).toBe('CONNECTION_REFUSED');
    expect(ErrorType.CONNECTION_TIMEOUT).toBe('CONNECTION_TIMEOUT');
    expect(ErrorType.PROTOCOL_ERROR).toBe('PROTOCOL_ERROR');
    expect(ErrorType.SERIALIZATION_ERROR).toBe('SERIALIZATION_ERROR');
    expect(ErrorType.TRANSPORT_ERROR).toBe('TRANSPORT_ERROR');
    expect(ErrorType.SOCKET_ERROR).toBe('SOCKET_ERROR');
    expect(ErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(ErrorType.TIMEOUT).toBe('TIMEOUT');
    expect(ErrorType.UNKNOWN).toBe('UNKNOWN');
  });
});

describe('getCommunicationBridge', () => {
  test('should return null when not initialized', () => {
    const bridge = getCommunicationBridge();
    expect(bridge).toBeNull();
  });
});

describe('isBackendConnected', () => {
  test('should return false when not initialized', () => {
    const connected = isBackendConnected();
    expect(connected).toBe(false);
  });
});
