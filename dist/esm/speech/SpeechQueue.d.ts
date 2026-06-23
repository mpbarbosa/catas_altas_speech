/**
 * Priority-based speech synthesis queue with automatic cleanup of expired items.
 *
 * This class manages a queue of speech requests with priority ordering and automatic
 * expiration of old items to prevent memory leaks and ensure fresh speech content.
 * Higher priority items are processed first, and items are automatically removed
 * if they exceed the configured expiration time.
 *
 * The queue implements the Observer pattern to notify subscribers of state changes,
 * making it suitable for integration with UI components and other system modules
 * that need to react to queue modifications.
 *
 * @class SpeechQueue
 * @since 0.9.0-alpha
 * @author Marcelo Pereira Barbosa
 *
 * @example
 * // Create a queue with default settings
 * const queue = new SpeechQueue();
 *
 * @example
 * // Create a queue with custom size and expiration
 * const queue = new SpeechQueue(50, 60000); // 50 items max, 60s expiration
 *
 * @example
 * // Create a queue with logging disabled
 * const queue = new SpeechQueue(100, 30000, false); // No logging output
 *
 * @example
 * // Add items with different priorities
 * queue.enqueue("Welcome message", 0);        // Normal priority
 * queue.enqueue("Emergency alert", 2);        // High priority (processed first)
 * queue.enqueue("Background info", -1);       // Low priority
 */
declare class SpeechQueue {
    items: any[];
    maxSize: number;
    expirationMs: number;
    observerSubject: any;
    enableLogging: boolean;
    /**
     * Creates a new speech queue with configurable size and expiration settings.
     *
     * @param {number} [maxSize=100] - Maximum number of items in queue (1-1000)
     * @param {number} [expirationMs=30000] - Item expiration time in milliseconds (1000-300000)
     * @param {boolean} [enableLogging=true] - Whether to enable logging output
     * @throws {TypeError} When parameters are not numbers
     * @throws {RangeError} When parameters are outside valid ranges
     */
    constructor(maxSize?: number, expirationMs?: number, enableLogging?: boolean);
    /**
     * Gets the observers array for backward compatibility.
     *
     * This getter provides access to the current list of subscribed observers
     * while maintaining the encapsulation of the underlying ObserverSubject.
     *
     * @returns {Array} Array of subscribed observers
     * @readonly
     */
    get observers(): any;
    /**
     * Gets the function observers array for backward compatibility.
     *
     * This getter provides access to the current list of subscribed function observers
     * while maintaining the encapsulation of the underlying ObserverSubject.
     *
     * @returns {Array} Array of subscribed function observers
     * @readonly
     */
    get functionObservers(): any;
    /**
     * Gets the current logging state.
     *
     * @returns {boolean} True if logging is enabled, false otherwise
     * @readonly
     */
    get isLoggingEnabled(): boolean;
    /**
     * Enables logging for this queue instance.
     *
     * @example
     * queue.enableLogs();
     * queue.cleanExpired(); // Will log removed items count
     */
    enableLogs(): void;
    /**
     * Disables logging for this queue instance.
     *
     * @example
     * queue.disableLogs();
     * queue.cleanExpired(); // Will not log removed items count
     */
    disableLogs(): void;
    /**
     * Toggles the logging state for this queue instance.
     *
     * @returns {boolean} The new logging state after toggling
     *
     * @example
     * const newState = queue.toggleLogs();
     * log(`Logging is now ${newState ? 'enabled' : 'disabled'}`);
     */
    toggleLogs(): boolean;
    /**
     * Subscribes an observer to queue state changes.
     *
     * Observers must implement an update() method that will be called
     * whenever the queue state changes (items added, removed, or expired).
     *
     * @param {Object} observer - Observer object with update() method
     * @throws {TypeError} When observer is null or doesn't have update method
     *
     * @example
     * const observer = {
     *   update(queue) {
     *     log(`Queue size: ${queue.size()}`);
     *   }
     * };
     * queue.subscribe(observer);
     */
    subscribe(observer: {
        update?: (...args: unknown[]) => void;
    }): void;
    /**
     * Notifies all subscribed observers of queue state changes.
     *
     * This method is called automatically when the queue state changes
     * but can also be called manually if needed.
     *
     * @private
     */
    notifyObservers(): void;
    /**
     * Subscribes a function observer to queue state changes.
     *
     * Function observers are simpler than object observers - they receive
     * the queue instance as their only parameter when called.
     *
     * @param {Function} observerFunction - Function to call on state changes
     * @throws {TypeError} When observerFunction is not a function
     *
     * @example
     * queue.subscribeFunction((queue) => {
     *   log(`Queue has ${queue.size()} items`);
     * });
     */
    subscribeFunction(observerFunction: (...args: unknown[]) => void): void;
    /**
     * Unsubscribes a function observer from queue state changes.
     *
     * @param {Function} observerFunction - Function observer to unsubscribe
     */
    unsubscribeFunction(observerFunction: (...args: unknown[]) => void): void;
    /**
     * Notifies all subscribed function observers of queue state changes.
     *
     * This method is called automatically when the queue state changes
     * but can also be called manually if needed.
     *
     * @private
     */
    notifyFunctionObservers(): void;
    /**
     * Adds a new speech item to the queue with priority ordering.
     *
     * Items are inserted in priority order with higher priority items placed
     * before lower priority items. Equal priority items maintain insertion order.
     * Expired items are automatically cleaned before insertion.
     *
     * @param {string} text - Text to be spoken
     * @param {number} [priority=0] - Priority level (higher = more important)
     * @throws {TypeError} When text is not a string or priority is not a number
     * @throws {Error} When text is empty or only whitespace
     *
     * @example
     * queue.enqueue("Welcome to São Paulo", 0);           // Normal priority
     * queue.enqueue("Chegando em Copacabana", 1);         // Higher priority
     * queue.enqueue("Sistema atualizado", -1);            // Lower priority
     */
    enqueue(text: string, priority?: number): void;
    /**
     * Removes and returns the highest priority item from the queue.
     *
     * Expired items are automatically cleaned before retrieval to ensure
     * only valid items are returned. Returns null if the queue is empty
     * after cleaning.
     *
     * @returns {SpeechItem|null} Next speech item or null if queue is empty
     *
     * @example
     * const nextItem = queue.dequeue();
     * if (nextItem) {
     *   log(`Speaking: ${nextItem.text}`);
     * }
     */
    dequeue(): any | null;
    /**
     * Checks if the queue is empty after cleaning expired items.
     *
     * This method automatically cleans expired items before checking
     * the queue status to provide accurate results.
     *
     * @returns {boolean} True if queue has no valid items
     *
     * @example
     * if (!queue.isEmpty()) {
     *   const item = queue.dequeue();
     *   // Process item
     * }
     */
    isEmpty(): boolean;
    /**
     * Gets the current size of the queue after cleaning expired items.
     *
     * This method automatically cleans expired items before counting
     * to provide an accurate count of valid items.
     *
     * @returns {number} Number of valid items in queue
     *
     * @example
     * log(`Queue has ${queue.size()} pending items`);
     */
    size(): number;
    /**
     * Removes expired items from the queue.
     *
     * This private method is called automatically by other queue operations
     * to ensure expired items don't accumulate and consume memory. Logs
     * the number of removed items for debugging purposes.
     *
     * @private
     */
    cleanExpired(): void;
    /**
     * Clears all items from the queue.
     *
     * This method immediately removes all items regardless of their
     * expiration status and notifies observers of the change.
     *
     * @example
     * queue.clear(); // Remove all pending speech items
     */
    clear(): void;
    /**
     * Returns a string representation of the queue for debugging.
     *
     * @returns {string} Queue description with size and configuration
     *
     * @example
     * log(queue.toString());
     * // Output: "SpeechQueue: size=3, maxSize=100, expirationMs=30000"
     */
    toString(): string;
    /**
     * Gets a read-only array of current queue items for inspection.
     *
     * This method returns a shallow copy of the items array to prevent
     * external modification while allowing inspection of queue contents.
     * Automatically cleans expired items before returning.
     *
     * @returns {SpeechItem[]} Read-only copy of current queue items
     *
     * @example
     * const items = queue.getItems();
     * items.forEach(item => log(`Priority ${item.priority}: ${item.text}`));
     */
    getItems(): any[];
}
export default SpeechQueue;
//# sourceMappingURL=SpeechQueue.d.ts.map