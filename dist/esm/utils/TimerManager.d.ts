/**
 * Centralized timer management to prevent memory leaks
 * Singleton pattern with automatic cleanup tracking
 *
 * @class TimerManager
 * @example
 * import timerManager from './utils/TimerManager.js';
 *
 * // Set timer with tracking
 * timerManager.setInterval(
 *     () => log('tick'),
 *     1000,
 *     'myTimer'
 * );
 *
 * // Clear specific timer
 * timerManager.clearTimer('myTimer');
 *
 * // Clear all timers
 * timerManager.clearAll();
 */
declare class TimerManager {
    timers: Map<string, {
        timerId: ReturnType<typeof setInterval>;
        type: string;
        created: number;
    }>;
    static instance: TimerManager | null;
    constructor();
    /**
     * Create tracked interval timer
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {string} id - Unique timer identifier
     * @returns {string} Timer ID for clearing
     */
    setInterval(callback: () => void, delay: number, id: string): string;
    /**
     * Create tracked timeout timer
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {string} id - Unique timer identifier
     * @returns {string} Timer ID for clearing
     */
    setTimeout(callback: () => void, delay: number, id: string): string;
    /**
     * Clear specific timer by ID
     * @param {string} id - Timer ID to clear
     * @returns {boolean} True if timer was found and cleared
     */
    clearTimer(id: string): boolean;
    /**
     * Clear all tracked timers
     * Useful for cleanup in tests or component destruction
     */
    clearAll(): void;
    /**
     * Get count of active timers (for debugging)
     * @returns {number} Number of active timers
     */
    getActiveCount(): number;
    /**
     * Get all timer IDs (for debugging)
     * @returns {string[]} Array of timer IDs
     */
    getTimerIds(): string[];
    /**
     * Get the singleton instance
     * @returns {TimerManager} The TimerManager instance
     */
    static getInstance(): TimerManager;
}
export { TimerManager };
declare const _default: TimerManager;
export default _default;
//# sourceMappingURL=TimerManager.d.ts.map