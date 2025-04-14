import { logger } from '../utils/logger';

/**
 * Base class for all services
 * Provides common functionality and logging capabilities
 */
export abstract class BaseService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Informational log with service name context
   */
  protected logInfo(message: string, ...args: any[]): void {
    logger.info(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * Warning log with service name context
   */
  protected logWarn(message: string, ...args: any[]): void {
    logger.warn(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * Error log with service name context
   */
  protected logError(message: string, ...args: any[]): void {
    logger.error(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * Debug log with service name context
   */
  protected logDebug(message: string, ...args: any[]): void {
    logger.debug(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * Standard error handling method
   * Logs the error and throws a new one with a descriptive message
   */
  protected handleError(error: any, message: string): never {
    this.logError(`${message}: ${error}`);
    throw new Error(`${message}: ${error.message || error}`);
  }
} 