/**
 * Error Handling Tests
 * 
 * Tests for the error handling system (AppError, ErrorCode, etc.)
 */

import { describe, test, expect } from 'bun:test';
import { AppError, ErrorCode, ErrorLocation, RecoveryAction, isAppError } from './app-error';

describe('ErrorCode', () => {
  test('should have all error codes defined', () => {
    expect(ErrorCode.ENTITY_NOT_FOUND).toBe(1000);
    expect(ErrorCode.VALIDATION_FAILED).toBe(1001);
    expect(ErrorCode.BUSINESS_RULE_VIOLATION).toBe(1002);
    expect(ErrorCode.INVALID_STATE_TRANSITION).toBe(1003);
    expect(ErrorCode.DATABASE_ERROR).toBe(2000);
    expect(ErrorCode.CONNECTION_FAILED).toBe(2001);
    expect(ErrorCode.TIMEOUT).toBe(2002);
    expect(ErrorCode.SERIALIZATION_ERROR).toBe(2003);
    expect(ErrorCode.COMMAND_FAILED).toBe(3000);
    expect(ErrorCode.QUERY_FAILED).toBe(3001);
    expect(ErrorCode.HANDLER_ERROR).toBe(3002);
    expect(ErrorCode.UI_ERROR).toBe(4000);
    expect(ErrorCode.COMMUNICATION_ERROR).toBe(4001);
    expect(ErrorCode.PLUGIN_ERROR).toBe(5000);
    expect(ErrorCode.PLUGIN_NOT_FOUND).toBe(5001);
    expect(ErrorCode.UNKNOWN).toBe(9999);
  });
});

describe('ErrorLocation', () => {
  test('should create ErrorLocation with all fields', () => {
    const location: ErrorLocation = {
      module: 'test-module',
      function: 'testFunction',
      line: 42,
      file: 'test.ts',
    };

    expect(location.module).toBe('test-module');
    expect(location.function).toBe('testFunction');
    expect(location.line).toBe(42);
    expect(location.file).toBe('test.ts');
  });

  test('should create ErrorLocation with optional fields', () => {
    const location: ErrorLocation = {
      module: 'test-module',
    };

    expect(location.module).toBe('test-module');
    expect(location.function).toBeUndefined();
    expect(location.line).toBeUndefined();
    expect(location.file).toBeUndefined();
  });
});

describe('RecoveryAction', () => {
  test('should create retry action', () => {
    const action: RecoveryAction = { type: 'retry' };
    expect(action.type).toBe('retry');
  });

  test('should create retryWithBackoff action', () => {
    const action: RecoveryAction = { 
      type: 'retryWithBackoff', 
      maxRetries: 3, 
      delayMs: 1000 
    };
    expect(action.type).toBe('retryWithBackoff');
    expect(action.maxRetries).toBe(3);
    expect(action.delayMs).toBe(1000);
  });

  test('should create fallback action', () => {
    const action: RecoveryAction = { 
      type: 'fallback', 
      fallbackValue: 'default' 
    };
    expect(action.type).toBe('fallback');
    expect(action.fallbackValue).toBe('default');
  });

  test('should create logAndContinue action', () => {
    const action: RecoveryAction = { type: 'logAndContinue' };
    expect(action.type).toBe('logAndContinue');
  });

  test('should create userNotification action', () => {
    const action: RecoveryAction = { 
      type: 'userNotification', 
      message: 'Something went wrong' 
    };
    expect(action.type).toBe('userNotification');
    expect(action.message).toBe('Something went wrong');
  });

  test('should create abort action', () => {
    const action: RecoveryAction = { type: 'abort' };
    expect(action.type).toBe('abort');
  });
});

describe('AppError', () => {
  test('should create AppError with required fields', () => {
    const error = new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Test error message',
    });

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Test error message');
    expect(error.id).toBeDefined();
    expect(error.timestamp).toBeDefined();
    expect(error.context).toEqual({});
  });

  test('should create AppError with all fields', () => {
    const location: ErrorLocation = {
      module: 'test-module',
      function: 'testFunction',
      line: 42,
    };

    const recovery: RecoveryAction = { type: 'retry' };

    const error = new AppError({
      code: ErrorCode.NOT_FOUND,
      message: 'Resource not found',
      cause: 'Database query failed',
      context: { resourceId: '123' },
      location,
      recovery,
    });

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Resource not found');
    expect(error.cause).toBe('Database query failed');
    expect(error.context.resourceId).toBe('123');
    expect(error.location).toEqual(location);
    expect(error.recovery).toEqual(recovery);
  });

  test('should generate unique IDs for each error', () => {
    const error1 = new AppError({ code: ErrorCode.UNKNOWN, message: 'Error 1' });
    const error2 = new AppError({ code: ErrorCode.UNKNOWN, message: 'Error 2' });

    expect(error1.id).not.toBe(error2.id);
  });

  test('should create error with context', () => {
    const error = new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      context: { field: 'email', value: 'invalid' },
    });

    expect(error.context.field).toBe('email');
    expect(error.context.value).toBe('invalid');
  });

  test('should add context with withContext', () => {
    const error = new AppError({
      code: ErrorCode.BUSINESS_RULE_VIOLATION,
      message: 'Business rule violated',
    });

    const newError = error.withContext('userId', '123');

    expect(newError.context.userId).toBe('123');
    expect(newError.id).toBe(error.id); // Same error, new instance
  });

  test('should merge context with withContextMap', () => {
    const error = new AppError({
      code: ErrorCode.COMMUNICATION_ERROR,
      message: 'Communication failed',
      context: { existing: 'value' },
    });

    const newError = error.withContextMap({ new: 'data', another: 42 });

    expect(newError.context.existing).toBe('value');
    expect(newError.context.new).toBe('data');
    expect(newError.context.another).toBe(42);
  });

  test('should set location with withLocation', () => {
    const error = new AppError({
      code: ErrorCode.SERIALIZATION_ERROR,
      message: 'Serialization failed',
    });

    const newError = error.withLocation('serialization', 'serialize', 100);

    // withLocation returns a new instance with updated location
    expect(newError.location?.module).toBe('serialization');
    expect(newError.location?.function).toBe('serialize');
    expect(newError.location?.line).toBe(100);
  });
});

describe('isAppError', () => {
  test('should return true for AppError instances', () => {
    const error = new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Test error',
    });

    expect(isAppError(error)).toBe(true);
  });

  test('should return false for non-AppError objects', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(42)).toBe(false);
    expect(isAppError({})).toBe(false);
    expect(isAppError({ message: 'error' })).toBe(false);
    expect(isAppError(new Error('standard error'))).toBe(false);
  });
});

describe('AppError with complex context', () => {
  test('should handle nested context data', () => {
    const error = new AppError({
      code: ErrorCode.BUSINESS_RULE_VIOLATION,
      message: 'Complex validation failed',
      context: {
        user: { id: 1, name: 'Test' },
        validation: {
          field: 'email',
          rules: ['required', 'email'],
          failed: 'email',
        },
        metadata: {
          timestamp: Date.now(),
          source: 'api',
        },
      },
    });

    expect(typeof error.context.user).toBe('object');
    expect((error.context.user as any).id).toBe(1);
    expect((error.context.validation as any).failed).toBe('email');
  });

  test('should handle array context values', () => {
    const error = new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Multiple validation errors',
      context: {
        errors: ['Field required', 'Invalid format', 'Too short'],
      },
    });

    expect(Array.isArray(error.context.errors)).toBe(true);
    expect((error.context.errors as string[]).length).toBe(3);
  });
});
