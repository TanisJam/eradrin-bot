/**
 * Logging module for the application
 * Provides different logging levels with timestamp formatting
 */

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

/**
 * Formats the message with timestamp and log level
 */
const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

/**
 * Simple logger for the application
 */
export const logger = {
  /**
   * Information level logging
   */
  info: (message: string, ...args: any[]): void => {
    console.log(formatMessage(LogLevel.INFO, message), ...args);
  },

  /**
   * Warning level logging
   */
  warn: (message: string, ...args: any[]): void => {
    console.warn(formatMessage(LogLevel.WARN, message), ...args);
  },

  /**
   * Error level logging
   */
  error: (message: string, ...args: any[]): void => {
    console.error(formatMessage(LogLevel.ERROR, message), ...args);
  },

  /**
   * Debug level logging
   * Only shown if NODE_ENV is not production
   */
  debug: (message: string, ...args: any[]): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage(LogLevel.DEBUG, message), ...args);
    }
  },
}; 