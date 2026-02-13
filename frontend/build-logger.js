/**
 * Enhanced Build Logger for Frontend
 * Provides detailed logging with timestamps, levels, and structured output
 */

import fs from 'fs/promises';
import path from 'path';

class BuildLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.logToFile = options.logToFile || false;
    this.logFilePath = options.logFilePath || './build.log';
    this.logToConsole = options.logToConsole !== false; // Default to true
    this.startTime = Date.now();
    
    // Create log directory if needed
    if (this.logToFile) {
      const logDir = path.dirname(this.logFilePath);
      fs.mkdir(logDir, { recursive: true }).catch(() => {});
    }
  }

  /**
   * Get current timestamp in ISO format
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const elapsed = Date.now() - this.startTime;
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      elapsed_ms: elapsed,
      ...meta
    };

    return JSON.stringify(logEntry, null, 2);
  }

  /**
   * Write message to console
   */
  writeToConsole(level, formattedMessage, rawMessage) {
    if (!this.logToConsole) return;

    const colors = {
      trace: '\x1b[90m', // Gray
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m'   // Magenta
    };

    const resetColor = '\x1b[0m';
    const color = colors[level.toLowerCase()] || colors.info;

    // For console, show a cleaner format
    const consoleMessage = `${color}[${level.toUpperCase()}] ${rawMessage}${resetColor}`;
    console.log(consoleMessage);
  }

  /**
   * Write message to file
   */
  async writeToFile(formattedMessage) {
    if (!this.logToFile) return;

    try {
      await fs.appendFile(this.logFilePath, formattedMessage + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Check if message should be logged based on log level
   */
  shouldLog(level) {
    const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel.toLowerCase());
    const messageLevelIndex = levels.indexOf(level.toLowerCase());

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Generic log method
   */
  async log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    const rawMessage = `[${level.toUpperCase()}] ${message}`;

    this.writeToConsole(level, formattedMessage, rawMessage);
    await this.writeToFile(formattedMessage);
  }

  /**
   * Log methods for different levels
   */
  async trace(message, meta = {}) { await this.log('trace', message, meta); }
  async debug(message, meta = {}) { await this.log('debug', message, meta); }
  async info(message, meta = {}) { await this.log('info', message, meta); }
  async warn(message, meta = {}) { await this.log('warn', message, meta); }
  async error(message, meta = {}) { await this.log('error', message, meta); }
  async fatal(message, meta = {}) { await this.log('fatal', message, meta); }

  /**
   * Log build step with timing
   */
  async step(name, callback, meta = {}) {
    const startTime = Date.now();
    this.info(`Starting build step: ${name}`, { ...meta, step: name });

    try {
      const result = await callback();
      const duration = Date.now() - startTime;
      
      this.info(`Completed build step: ${name}`, {
        ...meta,
        step: name,
        duration_ms: duration,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Failed build step: ${name}`, {
        ...meta,
        step: name,
        duration_ms: duration,
        success: false,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Log progress percentage
   */
  async progress(message, percent, meta = {}) {
    const progressMessage = `[${percent.toFixed(1)}%] ${message}`;
    this.info(progressMessage, { ...meta, progress_percent: percent });
  }

  /**
   * Log metrics
   */
  async metric(name, value, meta = {}) {
    this.debug(`Metric: ${name} = ${value}`, { ...meta, metric_name: name, metric_value: value });
  }

  /**
   * Get build statistics
   */
  getStats() {
    return {
      startTime: this.startTime,
      currentTime: Date.now(),
      elapsed: Date.now() - this.startTime,
      logLevel: this.logLevel
    };
  }
}

// Create default logger instance
const logger = new BuildLogger({
  logLevel: process.env.BUILD_LOG_LEVEL || 'info',
  logToFile: process.env.BUILD_LOG_TO_FILE === 'true' || true,
  logFilePath: process.env.BUILD_LOG_FILE_PATH || './frontend-build.log',
  logToConsole: true
});

export default logger;
export { BuildLogger };