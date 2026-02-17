/**
 * Application Error - Rich error type with metadata
 * 
 * Errors carry context, codes, and recovery information
 * to enable better error handling and debugging.
 */

export interface AppErrorData {
  /** Unique error ID for tracking */
  id: string;
  
  /** Error code for programmatic handling */
  code: ErrorCode;
  
  /** Human-readable message */
  message: string;
  
  /** Root cause (if chained) */
  cause?: string;
  
  /** Additional context data */
  context: Record<string, any>;
  
  /** When the error occurred */
  timestamp: string;
  
  /** Where the error occurred */
  location?: ErrorLocation;
  
  /** Suggested recovery action */
  recovery?: RecoveryAction;
}

/**
 * Error codes for programmatic handling
 */
export enum ErrorCode {
  // Domain Errors (1000-1999)
  ENTITY_NOT_FOUND = 1000,
  VALIDATION_FAILED = 1001,
  BUSINESS_RULE_VIOLATION = 1002,
  INVALID_STATE_TRANSITION = 1003,
  
  // Infrastructure Errors (2000-2999)
  DATABASE_ERROR = 2000,
  CONNECTION_FAILED = 2001,
  TIMEOUT = 2002,
  SERIALIZATION_ERROR = 2003,
  
  // Application Errors (3000-3999)
  COMMAND_FAILED = 3000,
  QUERY_FAILED = 3001,
  HANDLER_ERROR = 3002,
  
  // Presentation Errors (4000-4999)
  UI_ERROR = 4000,
  COMMUNICATION_ERROR = 4001,
  
  // Plugin Errors (5000-5999)
  PLUGIN_ERROR = 5000,
  PLUGIN_NOT_FOUND = 5001,
  PLUGIN_CAPABILITY_NOT_FOUND = 5002,
  
  // Unknown
  UNKNOWN = 9999,
}

/**
 * Error location for debugging
 */
export interface ErrorLocation {
  module: string;
  function?: string;
  line?: number;
  file?: string;
}

/**
 * Recovery actions for error handling
 */
export type RecoveryAction =
  | { type: 'retry' }
  | { type: 'retryWithBackoff'; maxRetries: number; delayMs: number }
  | { type: 'fallback'; fallbackValue: any }
  | { type: 'logAndContinue' }
  | { type: 'userNotification'; message: string }
  | { type: 'abort' };

/**
 * Application Error class
 */
export class AppError extends Error {
  readonly id: string;
  readonly code: ErrorCode;
  readonly context: Record<string, any>;
  readonly timestamp: string;
  readonly location?: ErrorLocation;
  readonly recovery?: RecoveryAction;
  readonly cause?: string;

  constructor(data: Partial<AppErrorData> & { code: ErrorCode; message: string }) {
    super(data.message);
    this.id = data.id || crypto.randomUUID();
    this.code = data.code;
    this.message = data.message;
    this.cause = data.cause;
    this.context = data.context || {};
    this.timestamp = data.timestamp || new Date().toISOString();
    this.location = data.location;
    this.recovery = data.recovery;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Create a new error with minimal information
   */
  static create(code: ErrorCode, message: string): AppError {
    return new AppError({ code, message });
  }

  /**
   * Add context to the error
   */
  withContext(key: string, value: any): AppError {
    return new AppError({
      ...this,
      context: { ...this.context, [key]: value },
    });
  }

  /**
   * Add multiple context values
   */
  withContextMap(context: Record<string, any>): AppError {
    return new AppError({
      ...this,
      context: { ...this.context, ...context },
    });
  }

  /**
   * Set the error location
   */
  withLocation(module: string, fn?: string, line?: number): AppError {
    return new AppError({
      ...this,
      location: { module, function: fn, line },
    });
  }

  /**
   * Set the root cause
   */
  withCause(cause: string): AppError {
    return new AppError({
      ...this,
      cause,
    });
  }

  /**
   * Set recovery action
   */
  withRecovery(recovery: RecoveryAction): AppError {
    return new AppError({
      ...this,
      recovery,
    });
  }

  /**
   * Get error summary for logging
   */
  summary(): string {
    return `[${ErrorCode[this.code]}] ${this.id} - ${this.message}`;
  }

  /**
   * Get full error details for debugging
   */
  details(): string {
    let details = `Error ID: ${this.id}\n`;
    details += `Code: ${ErrorCode[this.code]}\n`;
    details += `Message: ${this.message}\n`;

    if (this.cause) {
      details += `Cause: ${this.cause}\n`;
    }

    if (this.location) {
      details += `Location: ${this.location.module}:${this.location.line || '?'}\n`;
    }

    if (Object.keys(this.context).length > 0) {
      details += 'Context:\n';
      for (const [key, value] of Object.entries(this.context)) {
        details += `  ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return details;
  }

  /**
   * Convert to plain object
   */
  toJSON(): AppErrorData {
    return {
      id: this.id,
      code: this.code,
      message: this.message,
      cause: this.cause,
      context: this.context,
      timestamp: this.timestamp,
      location: this.location,
      recovery: this.recovery,
    };
  }

  /**
   * Get user-friendly message
   */
  toUserMessage(): string {
    switch (this.code) {
      case ErrorCode.ENTITY_NOT_FOUND:
        return 'The requested item was not found';
      case ErrorCode.VALIDATION_FAILED:
        return `Validation failed: ${this.message}`;
      case ErrorCode.BUSINESS_RULE_VIOLATION:
        return this.message;
      case ErrorCode.DATABASE_ERROR:
        return 'A database error occurred. Please try again.';
      case ErrorCode.CONNECTION_FAILED:
        return 'Connection failed. Please check your network.';
      case ErrorCode.TIMEOUT:
        return 'The operation timed out. Please try again.';
      case ErrorCode.SERIALIZATION_ERROR:
        return 'Data format error. Please refresh.';
      case ErrorCode.COMMAND_FAILED:
      case ErrorCode.QUERY_FAILED:
      case ErrorCode.HANDLER_ERROR:
        return 'An operation failed. Please try again.';
      case ErrorCode.UI_ERROR:
        return 'Display error. Please refresh the page.';
      case ErrorCode.COMMUNICATION_ERROR:
        return 'Communication error. Please check connection.';
      case ErrorCode.PLUGIN_ERROR:
      case ErrorCode.PLUGIN_NOT_FOUND:
      case ErrorCode.PLUGIN_CAPABILITY_NOT_FOUND:
        return 'Feature unavailable. Please contact support.';
      default:
        return this.message;
    }
  }
}

/**
 * Type guard for AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Create error with context builder
 */
export function createError(code: ErrorCode, message: string): ErrorBuilder {
  return new ErrorBuilder(AppError.create(code, message));
}

/**
 * Builder for creating errors with context
 */
export class ErrorBuilder {
  constructor(private error: AppError) {}

  context(key: string, value: any): ErrorBuilder {
    this.error = this.error.withContext(key, value);
    return this;
  }

  location(module: string, fn?: string, line?: number): ErrorBuilder {
    this.error = this.error.withLocation(module, fn, line);
    return this;
  }

  cause(cause: string): ErrorBuilder {
    this.error = this.error.withCause(cause);
    return this;
  }

  recovery(recovery: RecoveryAction): ErrorBuilder {
    this.error = this.error.withRecovery(recovery);
    return this;
  }

  build(): AppError {
    return this.error;
  }

  /**
   * Build and throw
   */
  throw(): never {
    throw this.error;
  }
}
