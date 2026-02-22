/**
 * Frontend Error Logger
 * 
 * Comprehensive error logging with:
 * - Console output with colors
 * - Error context tracking
 * - Automatic error boundary integration
 * - Network error handling
 * - Performance timing
 */

export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'fatal';

export interface ErrorContext {
  module?: string;
  function?: string;
  file?: string;
  line?: number;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: string;
  message: string;
  context: ErrorContext;
  stack?: string;
  source?: string;
  suggestion?: string;
}

/**
 * Format error for terminal/console output
 */
function formatErrorLog(entry: ErrorLogEntry): string {
  const colors = {
    debug: '\x1b[90m',      // Gray
    info: '\x1b[36m',       // Cyan
    warning: '\x1b[33m',    // Yellow
    error: '\x1b[31m',      // Red
    critical: '\x1b[35m',   // Magenta
    fatal: '\x1b[41;97m',   // Red background, white text
    reset: '\x1b[0m',
    bold: '\x1b[1m',
  };

  const severityLabel = entry.severity.toUpperCase();
  const color = colors[entry.severity] || colors.info;
  
  let output = '';
  output += `${color}${colors.bold}[${severityLabel}]${colors.reset} `;
  output += `${entry.timestamp} `;
  output += `${entry.category} `;
  output += `(${entry.id})\n`;
  
  output += `  ${colors.bold}Message:${colors.reset} ${entry.message}\n`;
  
  if (entry.context.module) {
    output += `  ${colors.bold}Module:${colors.reset} ${entry.context.module}\n`;
  }
  if (entry.context.function) {
    output += `  ${colors.bold}Function:${colors.reset} ${entry.context.function}\n`;
  }
  
  // Context entries
  const contextEntries = Object.entries(entry.context).filter(
    ([key]) => !['module', 'function', 'file', 'line', 'userId', 'sessionId'].includes(key)
  );
  
  if (contextEntries.length > 0) {
    output += `  ${colors.bold}Context:${colors.reset}\n`;
    for (const [key, value] of contextEntries) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      output += `    • ${key}: ${valueStr}\n`;
    }
  }
  
  if (entry.source) {
    output += `  ${colors.bold}Caused by:${colors.reset} ${entry.source}\n`;
  }
  
  if (entry.stack) {
    output += `  ${colors.bold}Stack trace:${colors.reset}\n`;
    const lines = entry.stack.split('\n').slice(0, 10);
    for (const line of lines) {
      output += `    ${line}\n`;
    }
  }
  
  if (entry.suggestion) {
    output += `  ${colors.bold}💡 Suggestion:${colors.reset} ${entry.suggestion}\n`;
  }
  
  output += `${colors.debug}─────────────────────────────────────────────────────────${colors.reset}\n`;
  
  return output;
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Capture stack trace from error
 */
function captureStack(error: Error): string | undefined {
  return error.stack;
}

/**
 * Error logger class
 */
class ErrorLoggerClass {
  private errorHistory: ErrorLogEntry[] = [];
  private maxHistory = 100;
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.setupGlobalErrorHandler();
  }

  /**
   * Log an error with context
   */
  logError(
    category: string,
    error: Error | string,
    context: ErrorContext = {},
    severity: ErrorSeverity = 'error',
    suggestion?: string,
  ): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const entry: ErrorLogEntry = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      severity,
      category,
      message: errorObj.message,
      context: {
        ...context,
        sessionId: this.sessionId,
      },
      source: errorObj.cause?.toString(),
      stack: captureStack(errorObj),
      suggestion,
    };

    // Store in history
    this.errorHistory.push(entry);
    if (this.errorHistory.length > this.maxHistory) {
      this.errorHistory.shift();
    }

    // Output to console
    const formatted = formatErrorLog(entry);
    
    switch (severity) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warning':
        console.warn(formatted);
        break;
      case 'error':
      case 'critical':
      case 'fatal':
        console.error(formatted);
        break;
    }

    // Also log as JSON for machine parsing
    console.debug(`ERROR_JSON: ${JSON.stringify(entry)}`);

    return entry.id;
  }

  /**
   * Log with automatic context from Error constructor
   */
  logErrorAuto(
    category: string,
    error: Error,
    suggestion?: string,
  ): string {
    // Try to extract function name from stack
    const stack = error.stack || '';
    const stackMatch = stack.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    
    const context: ErrorContext = {};
    if (stackMatch) {
      context.function = stackMatch[1];
      context.file = stackMatch[2];
      context.line = parseInt(stackMatch[3], 10);
    }

    return this.logError(category, error, context, 'error', suggestion);
  }

  /**
   * Log network errors specifically
   */
  logNetworkError(
    operation: string,
    error: Error | unknown,
    url?: string,
  ): string {
    const context: ErrorContext = {
      operation,
      url: url || 'unknown',
      timestamp: Date.now(),
    };

    let errorMessage = 'Unknown network error';
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Network request failed - check connection';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return this.logError(
      'network_error',
      errorMessage,
      context,
      'warning',
      'Check network connection and server status',
    );
  }

  /**
   * Log API response errors
   */
  logApiError(
    endpoint: string,
    status: number,
    statusText: string,
    responseBody?: string,
  ): string {
    const context: ErrorContext = {
      endpoint,
      status,
      statusText,
    };

    let suggestion = 'Retry the request';
    if (status >= 500) {
      suggestion = 'Server error - contact support if persistent';
    } else if (status === 401) {
      suggestion = 'Authentication failed - please log in again';
    } else if (status === 403) {
      suggestion = 'Permission denied - check user roles';
    } else if (status === 404) {
      suggestion = 'Resource not found - verify endpoint';
    }

    return this.logError(
      'api_error',
      `API Error ${status}: ${statusText}`,
      context,
      status >= 500 ? 'critical' : 'error',
      suggestion,
    );
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandler() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        'unhandled_rejection',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'promise_rejection' },
        'critical',
        'Add .catch() handler to promises',
      );
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.logError(
        'global_error',
        event.message,
        {
          file: event.filename,
          line: event.lineno,
          column: event.colno,
        },
        'critical',
      );
    });
  }

  /**
   * Get error history
   */
  getHistory(): ErrorLogEntry[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.errorHistory.filter((e) => e.severity === severity);
  }

  /**
   * Export errors for debugging
   */
  exportErrors(): string {
    return JSON.stringify(this.errorHistory, null, 2);
  }
}

// Singleton instance
export const ErrorLogger = new ErrorLoggerClass();

/**
 * Hook for component error logging
 */
export function useErrorLogger() {
  return {
    logError: ErrorLogger.logError.bind(ErrorLogger),
    logErrorAuto: ErrorLogger.logErrorAuto.bind(ErrorLogger),
    logNetworkError: ErrorLogger.logNetworkError.bind(ErrorLogger),
    logApiError: ErrorLogger.logApiError.bind(ErrorLogger),
  };
}

/**
 * Higher-order function for error logging
 */
export function withErrorLogging<T extends unknown[], R>(
  fn: (...args: T) => R,
  category: string,
  suggestion?: string,
): (...args: T) => R {
  return function (...args: T): R {
    try {
      return fn(...args);
    } catch (error) {
      ErrorLogger.logErrorAuto(category, error instanceof Error ? error : new Error(String(error)), suggestion);
      throw error;
    }
  };
}

/**
 * Async function wrapper with error logging
 */
export function withAsyncErrorLogging<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  category: string,
  suggestion?: string,
): (...args: T) => Promise<R> {
  return async function (...args: T): Promise<R> {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorLogger.logErrorAuto(category, error instanceof Error ? error : new Error(String(error)), suggestion);
      throw error;
    }
  };
}
