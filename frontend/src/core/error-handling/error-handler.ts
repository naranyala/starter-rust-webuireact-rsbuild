/**
 * Error Handler - Centralized error processing
 * 
 * Provides utilities for handling, logging, and transforming errors
 * at application boundaries.
 */

import { AppError, ErrorCode } from './app-error';
import { Result, Success, Failure } from './result';

export interface ErrorHandlerOptions {
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  includeStack: boolean;
  onUnhandledError?: (error: AppError) => void;
}

/**
 * Error handler for processing errors at boundaries
 */
export class ErrorHandler {
  private readonly options: Required<ErrorHandlerOptions>;

  constructor(options: Partial<ErrorHandlerOptions> = {}) {
    this.options = {
      logLevel: options.logLevel ?? 'error',
      includeStack: options.includeStack ?? false,
      onUnhandledError: options.onUnhandledError ?? (() => {}),
    };
  }

  /**
   * Handle a Result - log and potentially recover
   */
  handle<T>(result: Result<T, AppError>): Result<T, AppError> {
    if (result.isFailure()) {
      this.logError(result.error);
    }
    return result;
  }

  /**
   * Handle error with recovery strategy
   */
  handleWithRecovery<T>(
    result: Result<T, AppError>,
    recover: (error: AppError) => Result<T, AppError>
  ): Result<T, AppError> {
    if (result.isSuccess()) {
      return result;
    }

    const error = result.error;
    this.logError(error);

    // Try recovery if specified
    switch (error.recovery?.type) {
      case 'retry':
        this.logRetry(error, 1, 0);
        return recover(error);

      case 'retryWithBackoff':
        this.logRetry(error, error.recovery.maxRetries, error.recovery.delayMs);
        return recover(error);

      case 'fallback':
        this.logFallback(error);
        return recover(error);

      case 'logAndContinue':
        // Already logged, continue with error
        return result;

      case 'userNotification':
        this.logUserNotification(error.recovery.message);
        return result;

      case 'abort':
      default:
        return result;
    }
  }

  /**
   * Handle async Result
   */
  async handleAsync<T>(
    resultPromise: Promise<Result<T, AppError>>
  ): Promise<Result<T, AppError>> {
    try {
      const result = await resultPromise;
      return this.handle(result);
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : AppError.create(ErrorCode.UNKNOWN, String(error));
      this.logError(appError);
      return new Failure(appError);
    }
  }

  /**
   * Convert error to user-friendly message
   */
  toUserMessage(error: AppError): string {
    return error.toUserMessage();
  }

  /**
   * Log error based on severity
   */
  private logError(error: AppError): void {
    const message = this.options.includeStack ? error.details() : error.summary();

    switch (this.options.logLevel) {
      case 'error':
        console.error('[ERROR]', message, error);
        break;
      case 'warn':
        console.warn('[WARN]', message, error);
        break;
      case 'info':
        console.info('[INFO]', message, error);
        break;
      case 'debug':
        console.debug('[DEBUG]', message, error);
        break;
    }

    this.options.onUnhandledError(error);
  }

  private logRetry(error: AppError, maxRetries: number, delayMs: number): void {
    console.warn(
      '[RETRY]',
      `Will retry operation (max: ${maxRetries}, delay: ${delayMs}ms)`,
      error.id
    );
  }

  private logFallback(error: AppError): void {
    console.info('[FALLBACK]', 'Using fallback value after error', error.id);
  }

  private logUserNotification(message: string): void {
    console.info('[NOTIFICATION]', message);
  }

  /**
   * Create handler with different log level
   */
  withLogLevel(level: ErrorHandlerOptions['logLevel']): ErrorHandler {
    return new ErrorHandler({ ...this.options, logLevel: level });
  }

  /**
   * Create handler with stack trace
   */
  withStackTrace(): ErrorHandler {
    return new ErrorHandler({ ...this.options, includeStack: true });
  }
}

/**
 * Global error handler
 */
export class GlobalErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new ErrorHandler({
        logLevel: 'error',
        includeStack: false,
        onUnhandledError: (error) => {
          // Could send to error tracking service
          console.error('Unhandled error:', error.summary());
        },
      });
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Register global error handlers
   */
  static register(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof AppError
        ? event.reason
        : AppError.create(ErrorCode.UNKNOWN, String(event.reason));
      
      console.error('Unhandled promise rejection:', error.summary());
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = event.error instanceof AppError
        ? event.error
        : AppError.create(ErrorCode.UI_ERROR, event.message);
      
      console.error('Uncaught error:', error.summary());
    });
  }

  /**
   * Handle error and return JSON response
   */
  static toJsonResponse(error: AppError): any {
    return {
      success: false,
      error: {
        code: ErrorCode[error.code],
        message: error.message,
        id: error.id,
        timestamp: error.timestamp,
      },
    };
  }
}

/**
 * Higher-order function for handling async operations
 */
export function handleAsync<T>(
  fn: () => Promise<Result<T, AppError>>,
  handler?: ErrorHandler
): Promise<Result<T, AppError>> {
  const errorHandler = handler ?? GlobalErrorHandler.getInstance();
  return errorHandler.handleAsync(fn());
}

/**
 * Higher-order function for handling sync operations
 */
export function handle<T>(
  fn: () => Result<T, AppError>,
  handler?: ErrorHandler
): Result<T, AppError> {
  const errorHandler = handler ?? GlobalErrorHandler.getInstance();
  return errorHandler.handle(fn());
}
