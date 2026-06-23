/**
 * Logging utilities with timestamp formatting and environment-aware configuration.
 *
 * Provides centralized logging with environment-based control to prevent
 * console pollution in production. All functions check the logging level
 * before outputting to console.
 *
 * **Environment Configuration**:
 * - Set `GUIA_LOG_LEVEL` environment variable or localStorage key
 * - Levels: 'none', 'error', 'warn', 'log', 'debug' (default: 'log')
 * - Production detection via NODE_ENV or manual configuration
 *
 * @module utils/logger
 * @since 0.9.0-alpha
 * @author Marcelo Pereira Barbosa
 */
/**
 * Formats current timestamp for log messages.
 *
 * @returns {string} ISO 8601 timestamp
 *
 * @example
 * formatTimestamp(); // "2025-10-15T04:33:48.006Z"
 *
 * @since 0.9.0-alpha
 */
export declare const formatTimestamp: () => string;
/**
 * Logs info message with timestamp (if LOG level enabled).
 *
 * Respects environment configuration - disabled in production by default.
 * Use for general informational messages during development.
 *
 * @param {string} message - Message to log
 * @param {...any} params - Additional parameters
 *
 * @example
 * log('Position updated', { lat: -23.5505, lon: -46.6333 });
 * // Output: [2025-10-15T04:33:48.006Z] Position updated { lat: -23.5505, lon: -46.6333 }
 * // (only if log level >= 'log')
 *
 * @since 0.9.0-alpha
 */
export declare const log: (message: string, ...params: unknown[]) => void;
/**
 * Logs warning message with timestamp (if WARN level enabled).
 *
 * Respects environment configuration. Use for non-critical issues
 * that should be visible in production.
 *
 * @param {string} message - Warning message
 * @param {...any} params - Additional parameters
 *
 * @example
 * warn('Low accuracy detected', { accuracy: 500 });
 * // Output: [2025-10-15T04:33:48.006Z] Low accuracy detected { accuracy: 500 }
 * // (only if log level >= 'warn')
 *
 * @since 0.9.0-alpha
 */
export declare const warn: (message: string, ...params: unknown[]) => void;
/**
 * Logs error message with timestamp (if ERROR level enabled).
 *
 * Always enabled except when explicitly set to 'none'. Use for
 * critical errors that need attention even in production.
 *
 * @param {string} message - Error message
 * @param {...any} params - Additional parameters
 *
 * @example
 * error('Geolocation failed', { code: 1, message: 'Permission denied' });
 * // Output: [2025-10-15T04:33:48.006Z] Geolocation failed { code: 1, message: 'Permission denied' }
 * // (only if log level >= 'error')
 *
 * @since 0.9.0-alpha
 */
export declare const error: (message: string, ...params: unknown[]) => void;
/**
 * Logs debug message with timestamp (if DEBUG level enabled).
 *
 * Only enabled when explicitly configured. Use for verbose
 * debugging information during development.
 *
 * @param {string} message - Debug message
 * @param {...any} params - Additional parameters
 *
 * @example
 * debug('Observer notified', { observerCount: 5 });
 * // Output: [2025-10-15T04:33:48.006Z] Observer notified { observerCount: 5 }
 * // (only if log level >= 'debug')
 *
 * @since 0.9.0-alpha
 */
export declare const debug: (message: string, ...params: unknown[]) => void;
/**
 * Configures logging at runtime.
 *
 * Allows dynamic adjustment of logging behavior without restarting.
 * Changes persist in memory only (not saved to localStorage automatically).
 *
 * @param {Object} options - Configuration options
 * @param {string} [options.level] - Log level: 'none', 'error', 'warn', 'log', 'debug'
 * @param {boolean} [options.enabled] - Enable/disable all logging
 * @param {boolean} [options.timestamp] - Include timestamps in logs
 *
 * @example
 * // Disable all logging
 * setLogLevel({ enabled: false });
 *
 * // Set to error-only in production
 * setLogLevel({ level: 'error' });
 *
 * // Enable debug mode for development
 * setLogLevel({ level: 'debug' });
 *
 * @since 0.9.0-alpha
 * @param {Object} [options] - Configuration options
 * @param {string} [options.level] - Log level ('debug', 'info', 'warn', 'error')
 * @param {boolean} [options.enabled] - Enable/disable logging
 * @returns {void}
 */
export declare const setLogLevel: (options?: {
    level?: string;
    enabled?: boolean;
    timestamp?: boolean;
}) => void;
/**
 * Gets current logging configuration.
 *
 * @returns {Object} Current configuration with level name and enabled state
 *
 * @example
 * const config = getLogLevel();
 * console.log(config); // { level: 'log', levelName: 'log', enabled: true }
 *
 * @since 0.9.0-alpha
 */
export declare const getLogLevel: () => {
    level: number;
    levelName: string;
    enabled: boolean;
    timestamp: boolean;
    isProduction: boolean;
};
//# sourceMappingURL=logger.d.ts.map