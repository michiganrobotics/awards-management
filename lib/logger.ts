/**
 * Environment-aware logging utility
 *
 * In production, only errors and warnings are logged.
 * In development, all log levels are enabled.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Debug message');
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  /**
   * Debug-level logging - only in development
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage('debug', message, context));
    }
  },

  /**
   * Info-level logging - only in development
   * Use for general operational information
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Warning-level logging - always enabled
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },

  /**
   * Error-level logging - always enabled
   * Use for error events that might still allow the app to continue
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.errorMessage = error.message;
      errorContext.errorStack = error.stack;
    } else if (error !== undefined) {
      errorContext.error = error;
    }

    console.error(formatMessage('error', message, Object.keys(errorContext).length > 0 ? errorContext : undefined));
  },
};

export default logger;
