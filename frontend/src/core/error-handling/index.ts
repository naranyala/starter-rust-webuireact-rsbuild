/**
 * Error Handling - "Errors as Values" Pattern for Frontend
 * 
 * This module provides a comprehensive error handling system where:
 * - Errors are values, not exceptions
 * - Errors flow through the system via Result/Either types
 * - Errors are composable and transformable
 * - Errors carry rich context and metadata
 */

export * from './result';
export * from './app-error';
export * from './error-handler';
export * from './error-context';
