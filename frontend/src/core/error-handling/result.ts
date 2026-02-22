/**
 * Result/Either Type - Functional Error Handling
 * 
 * A Result represents a value that can be either:
 * - Success(value) - Operation succeeded
 * - Failure(error) - Operation failed
 * 
 * This allows errors to flow through the system as values
 * rather than being thrown as exceptions.
 */

export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

/**
 * Success case - operation succeeded with a value
 */
export class Success<T, E = Error> {
  readonly _tag = 'Success';
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Map the success value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success(fn(this.value));
  }

  /**
   * Chain operations (flat map)
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  /**
   * Execute side effect on success
   */
  onOk(fn: (value: T) => void): Result<T, E> {
    fn(this.value);
    return this;
  }

  /**
   * Get the value or default
   */
  getOrElse(defaultValue: T): T {
    return this.value;
  }

  /**
   * Get the value or throw
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Convert to Option
   */
  toOption(): Option<T> {
    return { tag: 'some', value: this.value };
  }

  /**
   * Check if success
   */
  isSuccess(): this is Success<T, E> {
    return true;
  }

  /**
   * Check if failure
   */
  isFailure(): this is Failure<T, E> {
    return false;
  }
}

/**
 * Failure case - operation failed with an error
 */
export class Failure<T, E = Error> {
  readonly _tag = 'Failure';
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  /**
   * Map the error value
   */
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    return new Failure(fn(this.error));
  }

  /**
   * Map both success and failure
   */
  mapBoth<U, F>(_okFn: (value: T) => U, errFn: (error: E) => F): Result<U, F> {
    return new Failure(errFn(this.error));
  }

  /**
   * Execute side effect on failure
   */
  onError(fn: (error: E) => void): Result<T, E> {
    fn(this.error);
    return this;
  }

  /**
   * Get the value or default
   */
  getOrElse(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Get the value or throw
   */
  unwrap(): T {
    throw this.error;
  }

  /**
   * Recover from error
   */
  recover(fn: (error: E) => T): Result<T, E> {
    return new Success(fn(this.error));
  }

  /**
   * Recover with another Result
   */
  recoverWith(fn: (error: E) => Result<T, E>): Result<T, E> {
    return fn(this.error);
  }

  /**
   * Convert to Option
   */
  toOption(): Option<T> {
    return { tag: 'none' };
  }

  /**
   * Check if success
   */
  isSuccess(): this is Success<T, E> {
    return false;
  }

  /**
   * Check if failure
   */
  isFailure(): this is Failure<T, E> {
    return true;
  }
}

/**
 * Option type for nullable values
 */
export type Option<T> = Some<T> | None<T>;

export interface Some<T> {
  tag: 'some';
  value: T;
}

export interface None<T> {
  tag: 'none';
}

/**
 * Helper functions for creating Results
 */
export const Result = {
  /**
   * Create a success result
   */
  ok<T, E = Error>(value: T): Result<T, E> {
    return new Success(value);
  },

  /**
   * Create a failure result
   */
  fail<T, E = Error>(error: E): Result<T, E> {
    return new Failure(error);
  },

  /**
   * Wrap a try-catch in a Result
   */
  try<T, E = Error>(fn: () => T, errorFn?: (error: any) => E): Result<T, E> {
    try {
      return new Success(fn());
    } catch (error) {
      return new Failure(errorFn ? errorFn(error) : error);
    }
  },

  /**
   * Wrap an async operation in a Result
   */
  async tryAsync<T, E = Error>(
    fn: () => Promise<T>,
    errorFn?: (error: any) => E
  ): Promise<Result<T, E>> {
    try {
      const value = await fn();
      return new Success(value);
    } catch (error) {
      return new Failure(errorFn ? errorFn(error) : error);
    }
  },

  /**
   * Combine multiple results
   */
  all<T extends any[]>(
    results: { [K in keyof T]: Result<T[K], any> }
  ): Result<T, any> {
    for (const result of results) {
      if (result.isFailure()) {
        return result as Failure<T, any>;
      }
    }
    return new Success(results.map(r => (r as Success<T, any>).value));
  },

  /**
   * Run all operations and collect all errors
   */
  allSettled<T>(
    results: Result<T, any>[]
  ): { successes: T[]; failures: any[] } {
    const successes: T[] = [];
    const failures: any[] = [];

    for (const result of results) {
      if (result.isSuccess()) {
        successes.push(result.value);
      } else {
        failures.push(result.error);
      }
    }

    return { successes, failures };
  },
};

/**
 * Pipe operator for chaining operations
 */
export function pipe<T, E>(
  result: Result<T, E>,
  ...fns: Array<(value: Result<T, E>) => Result<any, any>>
): Result<any, any> {
  return fns.reduce((acc, fn) => fn(acc), result);
}
