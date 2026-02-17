/**
 * Error Context - Adding metadata to errors
 * 
 * Provides utilities for adding rich context to errors
 * as they flow through the system.
 */

import { AppError, ErrorCode, ErrorBuilder } from './app-error';
import { Result } from './result';

/**
 * Context builder for errors
 */
export class ErrorContext {
  private data: Record<string, any> = {};

  add(key: string, value: any): ErrorContext {
    this.data[key] = value;
    return this;
  }

  addUserId(userId: string | number): ErrorContext {
    this.data['user_id'] = userId;
    return this;
  }

  addRequestId(requestId: string): ErrorContext {
    this.data['request_id'] = requestId;
    return this;
  }

  addOperation(operation: string): ErrorContext {
    this.data['operation'] = operation;
    return this;
  }

  addResource(resourceType: string, resourceId: string | number): ErrorContext {
    this.data[`${resourceType}_id`] = resourceId;
    return this;
  }

  merge(other: ErrorContext): ErrorContext {
    this.data = { ...this.data, ...other.data };
    return this;
  }

  toMap(): Record<string, any> {
    return { ...this.data };
  }
}

/**
 * Extension methods for Result with context
 */
export interface ResultWithContext<T> extends Result<T, AppError> {
  withContext(key: string, value: any): ResultWithContext<T>;
  withLocation(module: string, fn?: string, line?: number): ResultWithContext<T>;
  logError(context: string): Result<T, AppError> | null;
}

/**
 * Add context methods to Result
 */
export function withContext<T>(
  result: Result<T, AppError>,
  key: string,
  value: any
): Result<T, AppError> {
  if (result.isFailure()) {
    return new (result as any).constructor(
      result.error.withContext(key, value)
    );
  }
  return result;
}

export function withLocation<T>(
  result: Result<T, AppError>,
  module: string,
  fn?: string,
  line?: number
): Result<T, AppError> {
  if (result.isFailure()) {
    return new (result as any).constructor(
      result.error.withLocation(module, fn, line)
    );
  }
  return result;
}

/**
 * Guard clause utilities for early returns with errors
 */
export const guards = {
  /**
   * Require a value or return error
   */
  require<T>(
    value: T | null | undefined,
    code: ErrorCode,
    message: string
  ): Result<T, AppError> {
    if (value == null) {
      return new (require('./result').Failure)(AppError.create(code, message));
    }
    return new (require('./result').Success)(value);
  },

  /**
   * Require a condition or return error
   */
  requireThat(
    condition: boolean,
    code: ErrorCode,
    message: string
  ): Result<void, AppError> {
    if (!condition) {
      return new (require('./result').Failure)(AppError.create(code, message));
    }
    return new (require('./result').Success)(undefined);
  },

  /**
   * Require non-empty string
   */
  requireNonEmpty(
    value: string,
    code: ErrorCode,
    field: string
  ): Result<string, AppError> {
    if (!value || value.trim() === '') {
      return new (require('./result').Failure)(
        AppError.create(code, `${field} cannot be empty`)
      );
    }
    return new (require('./result').Success)(value);
  },

  /**
   * Require value in range
   */
  requireInRange<T extends number>(
    value: T,
    min: T,
    max: T,
    code: ErrorCode,
    field: string
  ): Result<T, AppError> {
    if (value < min) {
      return new (require('./result').Failure)(
        AppError.create(code, `${field} must be at least ${min}`)
      );
    }
    if (value > max) {
      return new (require('./result').Failure)(
        AppError.create(code, `${field} must be at most ${max}`)
      );
    }
    return new (require('./result').Success)(value);
  },
};

/**
 * Validation helpers using errors as values
 */
export const validation = {
  /**
   * Validate a value with a predicate
   */
  validate<T>(
    value: T,
    predicate: (value: T) => boolean,
    code: ErrorCode,
    message: string
  ): Result<T, AppError> {
    if (predicate(value)) {
      return new (require('./result').Success)(value);
    }
    return new (require('./result').Failure)(AppError.create(code, message));
  },

  /**
   * Validate multiple conditions, collecting all errors
   */
  validateAll<T>(
    value: T,
    validations: Array<{
      predicate: (value: T) => boolean;
      code: ErrorCode;
      message: string;
    }>
  ): Result<T, AppError[]> {
    const errors = validations
      .filter(({ predicate }) => !predicate(value))
      .map(({ code, message }) => AppError.create(code, message));

    if (errors.length === 0) {
      return new (require('./result').Success)(value);
    }
    return new (require('./result').Failure)(errors);
  },

  /**
   * Validate email format
   */
  validateEmail(email: string): Result<string, AppError> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validate(
      email,
      (e) => emailRegex.test(e),
      ErrorCode.VALIDATION_FAILED,
      'Invalid email format'
    );
  },

  /**
   * Validate required field
   */
  validateRequired<T>(
    value: T | null | undefined,
    fieldName: string
  ): Result<T, AppError> {
    return guards.require(
      value,
      ErrorCode.VALIDATION_FAILED,
      `${fieldName} is required`
    );
  },

  /**
   * Validate string length
   */
  validateLength(
    value: string,
    min: number,
    max: number,
    fieldName: string
  ): Result<string, AppError> {
    if (value.length < min) {
      return new (require('./result').Failure)(
        AppError.create(
          ErrorCode.VALIDATION_FAILED,
          `${fieldName} must be at least ${min} characters`
        )
      );
    }
    if (value.length > max) {
      return new (require('./result').Failure)(
        AppError.create(
          ErrorCode.VALIDATION_FAILED,
          `${fieldName} must be at most ${max} characters`
        )
      );
    }
    return new (require('./result').Success)(value);
  },
};

/**
 * Macro-like function for adding context at call site
 */
export function withErrorContext<T>(
  result: Result<T, AppError>,
  contextFn: (ctx: ErrorContext) => ErrorContext
): Result<T, AppError> {
  if (result.isFailure()) {
    const context = contextFn(new ErrorContext());
    return new (result as any).constructor(
      result.error.withContextMap(context.toMap())
    );
  }
  return result;
}
