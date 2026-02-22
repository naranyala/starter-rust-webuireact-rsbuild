// Logger utility with fallback

import type { Logger } from './types';

export const createLogger = (): Logger => {
  const globalLogger = (window as any).Logger;
  
  if (globalLogger) {
    return globalLogger;
  }
  
  return {
    info: (msg: string, meta?: any) => console.log(msg, meta),
    warn: (msg: string, meta?: any) => console.warn(msg, meta),
    error: (msg: string, meta?: any) => console.error(msg, meta),
    debug: (msg: string, meta?: any) => console.debug(msg, meta),
  };
};

export const Logger = createLogger();
