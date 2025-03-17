/**
 * Logger Utility
 *
 * This file provides logging functionality for the application.
 * It can be used in both the main and renderer processes.
 */

/**
 * Log levels
 * @type {Object}
 */
export const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Current log level
 * @type {string}
 */
let currentLogLevel = LogLevels.INFO;

/**
 * Log level priorities (higher number = higher priority)
 * @type {Object}
 */
const logLevelPriorities = {
  [LogLevels.DEBUG]: 0,
  [LogLevels.INFO]: 1,
  [LogLevels.WARN]: 2,
  [LogLevels.ERROR]: 3,
};

/**
 * Check if a log level should be displayed based on current log level
 * @param {string} level - The log level to check
 * @returns {boolean} - Whether the log level should be displayed
 */
function shouldLog(level) {
  return logLevelPriorities[level] >= logLevelPriorities[currentLogLevel];
}

/**
 * Format a log message
 * @param {string} level - The log level
 * @param {string} message - The log message
 * @param {Object} [data] - Additional data to log
 * @returns {string} - The formatted log message
 */
function formatLogMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const dataString = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataString}`;
}

/**
 * Set the current log level
 * @param {string} level - The log level to set
 */
export function setLogLevel(level) {
  if (LogLevels[level.toUpperCase()]) {
    currentLogLevel = LogLevels[level.toUpperCase()];
  } else {
    console.error(`Invalid log level: ${level}`);
  }
}

/**
 * Log a debug message
 * @param {string} message - The message to log
 * @param {Object} [data] - Additional data to log
 */
export function debug(message, data) {
  if (shouldLog(LogLevels.DEBUG)) {
    console.debug(formatLogMessage(LogLevels.DEBUG, message, data));
  }
}

/**
 * Log an info message
 * @param {string} message - The message to log
 * @param {Object} [data] - Additional data to log
 */
export function info(message, data) {
  if (shouldLog(LogLevels.INFO)) {
    console.info(formatLogMessage(LogLevels.INFO, message, data));
  }
}

/**
 * Log a warning message
 * @param {string} message - The message to log
 * @param {Object} [data] - Additional data to log
 */
export function warn(message, data) {
  if (shouldLog(LogLevels.WARN)) {
    console.warn(formatLogMessage(LogLevels.WARN, message, data));
  }
}

/**
 * Log an error message
 * @param {string} message - The message to log
 * @param {Error|Object} [error] - The error object or additional data
 */
export function error(message, error) {
  if (shouldLog(LogLevels.ERROR)) {
    if (error instanceof Error) {
      console.error(formatLogMessage(LogLevels.ERROR, message, {
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error(formatLogMessage(LogLevels.ERROR, message, error));
    }
  }
}

/**
 * Create a logger instance with a specific context
 * @param {string} context - The context for the logger
 * @returns {Object} - A logger instance
 */
export function createLogger(context) {
  return {
    debug: (message, data) => debug(`[${context}] ${message}`, data),
    info: (message, data) => info(`[${context}] ${message}`, data),
    warn: (message, data) => warn(`[${context}] ${message}`, data),
    error: (message, error) => error(`[${context}] ${message}`, error),
  };
}

// Default logger instance
export default {
  setLogLevel,
  debug,
  info,
  warn,
  error,
  createLogger,
};
