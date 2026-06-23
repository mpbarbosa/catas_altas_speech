/**
 * Configuration constants for speech synthesis management.
 *
 * These constants define default behavior and limits for the speech synthesis system,
 * including retry mechanisms, voice loading timeouts, and processing intervals.
 *
 * @constant {Object}
 * @private
 */
declare const SPEECH_CONFIG: {
    maxVoiceRetryAttempts: number;
    voiceRetryInterval: number;
    independentQueueTimerInterval: number;
    minRate: number;
    maxRate: number;
    minPitch: number;
    maxPitch: number;
    defaultRate: number;
    defaultPitch: number;
    primaryLanguage: string;
    fallbackLanguagePrefix: string;
};
/**
 * SpeechSynthesisManager class for managing Web Speech API synthesis with queue-based processing.
 *
 * This class provides a comprehensive speech synthesis system that manages voice selection,
 * speech queuing with priority support, rate and pitch control, and robust error handling.
 * It automatically prioritizes Brazilian Portuguese voices and includes retry mechanisms
 * for reliable voice loading across different browsers and environments.
 *
 * **Architecture Pattern**: Manager/Controller with Composition
 * - Uses extracted composition classes: VoiceLoader, VoiceSelector, SpeechConfiguration
 * - Delegates voice loading to VoiceLoader
 * - Delegates voice selection to VoiceSelector
 * - Delegates rate/pitch configuration to SpeechConfiguration
 * - Manages overall speech synthesis orchestration
 *
 * **State Management**:
 * - Tracks current speaking status to prevent overlapping speech
 * - Manages voice loading state with retry mechanisms (legacy, for backward compatibility)
 * - Maintains queue processing timers for independent operation
 *
 * **Voice Selection Strategy**:
 * 1. **Primary**: Brazilian Portuguese (pt-BR) voices
 * 2. **Fallback**: Any Portuguese (pt-*) voices
 * 3. **Default**: First available voice or null
 *
 * **Queue Processing**:
 * - Priority-based ordering (higher priority numbers speak first)
 * - State-controlled processing (prevents concurrent speech)
 * - Timer-based independent processing for reliability
 *
 * @class
 */
declare class SpeechSynthesisManager {
    enableLogging: boolean;
    synth: SpeechSynthesis | null;
    voiceLoader: any;
    voiceSelector: any;
    configuration: any;
    voices: SpeechSynthesisVoice[];
    voice: SpeechSynthesisVoice | null;
    speechQueue: any;
    independentQueueTimerInterval: number;
    maxVoiceRetryAttempts: number;
    voiceRetryInterval: number;
    voiceRetryAttempts: number;
    voiceRetryTimer: string | null;
    isCurrentlySpeaking: boolean;
    rate: number;
    pitch: number;
    queueTimer: string | null;
    /**
     * Creates a new SpeechSynthesisManager instance.
     *
     * Initializes the speech synthesis system with Web Speech API integration,
     * sets up voice loading with retry mechanisms, creates the speech queue,
     * and configures default speech parameters. The constructor performs
     * immediate voice loading and establishes retry timers if needed.
     *
     * **Initialization Process**:
     * 1. Initialize Web Speech API interface (window.speechSynthesis)
     * 2. Set up voice storage and selection state
     * 3. Configure speech parameters (rate, pitch) with defaults
     * 4. Initialize speech queue for priority-based processing
     * 5. Set up timer management for queue processing
     * 6. Configure voice retry mechanism for Brazilian Portuguese
     * 7. Begin voice loading process with retry logic
     *
     * @constructor
     * @param {boolean} [enableLogging=false] - Whether to enable logging output
     * @throws {Error} If Web Speech API is not available in the environment
     * @throws {TypeError} When enableLogging parameter is not a boolean
     *
     * @example
     * // Basic instantiation
     * const speechManager = new SpeechSynthesisManager();
     *
     * @example
     * // Instantiation with logging enabled
     * const speechManager = new SpeechSynthesisManager(true);
     *
     * @example
     * // Instantiation with immediate usage
     * const speechManager = new SpeechSynthesisManager();
     * speechManager.speak("Sistema inicializado com sucesso!");
     */
    constructor(enableLogging?: boolean);
    /**
     * Gets the current logging state.
     *
     * @returns {boolean} True if logging is enabled, false otherwise
     * @readonly
     */
    get isLoggingEnabled(): boolean;
    /**
     * Enables logging for this speech manager instance.
     *
     * @example
     * speechManager.enableLogs();
     * speechManager.speak("Test message"); // Will log speech operations
     */
    enableLogs(): void;
    /**
     * Disables logging for this speech manager instance.
     *
     * @example
     * speechManager.disableLogs();
     * speechManager.speak("Test message"); // Will not log speech operations
     */
    disableLogs(): void;
    /**
     * Toggles the logging state for this speech manager instance.
     *
     * @returns {boolean} The new logging state after toggling
     *
     * @example
     * const newState = speechManager.toggleLogs();
     * log(`Logging is now ${newState ? 'enabled' : 'disabled'}`);
     */
    toggleLogs(): boolean;
    /**
     * Safe logging method that respects the logging state.
     *
     * @private
     * @param {string} message - Main log message
     * @param {...any} params - Additional parameters to log
     */
    safeLog(message: unknown, ...params: unknown[]): void;
    /**
     * Safe warning method that respects the logging state.
     *
     * @private
     * @param {string} message - Main warning message
     * @param {...any} params - Additional parameters to log
     */
    safeWarn(message: unknown, ...params: unknown[]): void;
    /**
     * Loads available voices and selects the optimal Portuguese voice.
     *
     * This method implements a sophisticated voice selection strategy that prioritizes
     * Brazilian Portuguese voices for the target user base using the extracted composition
     * classes VoiceLoader and VoiceSelector. It includes a retry mechanism to handle
     * asynchronous voice loading in different browsers, ensuring reliable voice selection
     * even when voices are not immediately available.
     *
     * **Voice Selection Priority** (delegated to VoiceSelector):
     * 1. **Brazilian Portuguese (pt-BR)**: Primary target for Brazilian users
     * 2. **Portuguese variants (pt-*)**: Fallback for any Portuguese dialect
     * 3. **First available voice**: Default fallback for non-Portuguese environments
     * 4. **Null**: If no voices are available
     *
     * **Retry Mechanism** (delegated to VoiceLoader):
     * - Uses exponential backoff for efficient retry
     * - Handles asynchronous voice loading in different browsers
     * - Automatically completes when voices are available
     *
     * **Composition Classes**:
     * - VoiceLoader: Handles voice loading with exponential backoff retry
     * - VoiceSelector: Implements voice prioritization and selection strategy
     *
     * @private
     * @returns {void}
     *
     * @example
     * // Called automatically by constructor
     * // Constructor calls this.loadVoices() after initializing composition components
     */
    loadVoices(): void;
    /**
     * Starts the retry timer for Brazilian Portuguese voice detection.
     *
     * @deprecated This method is no longer used. VoiceLoader now handles voice loading
     * with exponential backoff retry. This method is kept for backward compatibility only.
     *
     * This method implements a timer-based retry mechanism that periodically checks
     * for the availability of Brazilian Portuguese voices. This is necessary because
     * some browsers load voices asynchronously, and the desired voice may not be
     * immediately available at initialization time.
     *
     * **Retry Logic**:
     * - Executes at regular intervals (configurable via SPEECH_CONFIG.voiceRetryInterval)
     * - Limited to maximum attempts to prevent infinite loops
     * - Automatically stops when Brazilian Portuguese voice is found
     * - Automatically stops when maximum attempts are reached
     * - Prevents multiple concurrent retry timers
     *
     * @private
     * @returns {void}
     *
     * @example
     * // Called automatically by loadVoices() when needed
     * // Manual usage for testing:
     * speechManager.startVoiceRetryTimer();
     */
    startVoiceRetryTimer(): void;
    /**
     * Stops the voice retry timer and cleans up retry state.
     *
     * @deprecated This method is no longer used. VoiceLoader now handles voice loading
     * with exponential backoff retry. This method is kept for backward compatibility only.
     *
     * This method safely terminates the voice retry mechanism, clearing the interval
     * timer and resetting the timer reference. It can be called multiple times safely
     * and handles cases where no timer is currently running.
     *
     * @private
     * @returns {void}
     *
     * @example
     * // Called automatically when Brazilian Portuguese voice is found
     * // Manual usage for cleanup:
     * speechManager.stopVoiceRetryTimer();
     */
    stopVoiceRetryTimer(): void;
    /**
     * Sets the speech synthesis voice with validation.
     *
     * This method allows manual selection of a specific voice from the available
     * voices. It provides validation to ensure the voice is valid and logs the
     * change for debugging purposes. This can override the automatic Brazilian
     * Portuguese voice selection.
     *
     * @param {SpeechSynthesisVoice|null} voice - Voice to use for synthesis
     * @throws {TypeError} If voice is provided but not a valid SpeechSynthesisVoice
     * @returns {void}
     *
     * @example
     * // Set specific voice by selection
     * const voices = speechManager.getAvailableVoices();
     * const englishVoice = voices.find(v => v.lang.startsWith('en'));
     * speechManager.setVoice(englishVoice);
     *
     * @example
     * // Clear voice selection (use default)
     * speechManager.setVoice(null);
     */
    setVoice(voice: SpeechSynthesisVoice | null): void;
    /**
     * Sets the speech rate with validation and clamping.
     *
     * This method configures the speech synthesis rate (speed) with automatic
     * validation and clamping to ensure values remain within the valid range
     * supported by the Web Speech API. Invalid values are automatically corrected.
     *
     * **Implementation**: Delegates to SpeechConfiguration for parameter management
     * while maintaining backward compatibility by syncing this.rate property.
     *
     * @param {number} rate - Speech rate (0.1 to 10.0, where 1.0 is normal speed)
     * @throws {TypeError} If rate is not a number
     * @returns {void}
     *
     * @example
     * // Set normal speech rate
     * speechManager.setRate(1.0);
     *
     * @example
     * // Set slow speech rate for accessibility
     * speechManager.setRate(0.5);
     *
     * @example
     * // Set fast speech rate (automatically clamped to maximum)
     * speechManager.setRate(15); // Will be clamped to 10.0
     */
    setRate(rate: number): void;
    /**
     * Sets the speech pitch with validation and clamping.
     *
     * This method configures the speech synthesis pitch with automatic validation
     * and clamping to ensure values remain within the valid range supported by
     * the Web Speech API. Invalid values are automatically corrected.
     *
     * **Implementation**: Delegates to SpeechConfiguration for parameter management
     * while maintaining backward compatibility by syncing this.pitch property.
     *
     * @param {number} pitch - Speech pitch (0.0 to 2.0, where 1.0 is normal pitch)
     * @throws {TypeError} If pitch is not a number
     * @returns {void}
     *
     * @example
     * // Set normal speech pitch
     * speechManager.setPitch(1.0);
     *
     * @example
     * // Set higher pitch for emphasis
     * speechManager.setPitch(1.5);
     *
     * @example
     * // Set invalid pitch (automatically clamped to maximum)
     * speechManager.setPitch(5.0); // Will be clamped to 2.0
     */
    setPitch(pitch: number): void;
    /**
     * Gets all available voices for selection.
     *
     * Returns a copy of the currently available voices array to prevent external
     * modification while allowing voice inspection and selection. This method
     * provides access to voice metadata for UI components or voice selection logic.
     *
     * @returns {SpeechSynthesisVoice[]} Array of available voices (copy)
     *
     * @example
     * // Get all available voices
     * const voices = speechManager.getAvailableVoices();
     * log(`Found ${voices.length} voices`);
     *
     * @example
     * // Find specific language voices
     * const voices = speechManager.getAvailableVoices();
     * const englishVoices = voices.filter(v => v.lang.startsWith('en'));
     */
    getAvailableVoices(): SpeechSynthesisVoice[];
    /**
     * Gets the currently selected voice.
     *
     * Returns the currently active voice object, which may be null if no voice
     * has been loaded or selected. This provides access to voice metadata for
     * UI display or debugging purposes.
     *
     * @returns {SpeechSynthesisVoice|null} Currently selected voice or null
     *
     * @example
     * // Check current voice
     * const currentVoice = speechManager.getCurrentVoice();
     * if (currentVoice) {
     *     log(`Using voice: ${currentVoice.name} (${currentVoice.lang})`);
     * } else {
     *     log('No voice selected');
     * }
     */
    getCurrentVoice(): SpeechSynthesisVoice;
    /**
     * Primary entry point for adding text-to-speech requests to the speech synthesis system.
     *
     * Implements a clean three-step process: input validation, queue management, and conditional
     * processing initiation. This method serves as the public interface for all speech requests,
     * handling both immediate processing and queued batch processing scenarios through intelligent
     * state management and priority-based queue operations.
     *
     * **Processing Flow**:
     * 1. **Input Validation**: Ensures text is valid and non-empty
     * 2. **Queue Management**: Adds text to priority-based speech queue
     * 3. **Conditional Processing**: Starts queue processing if not currently speaking
     *
     * **Priority System**:
     * - Higher priority numbers are processed first
     * - Equal priority items are processed in FIFO order
     * - Priority 0 is normal priority (default)
     * - Negative priorities are processed after normal priority
     *
     * @param {string} text - Text content to be spoken by the speech synthesis system
     * @param {number} [priority=0] - Priority level for queue positioning (higher values = higher priority)
     * @throws {TypeError} If text is not a string
     * @throws {Error} If text is empty or only whitespace
     * @returns {void}
     *
     * @example
     * // Basic speech request with default priority
     * speechManager.speak("Welcome to the application");
     *
     * @example
     * // High priority urgent message (jumps ahead in queue)
     * speechManager.speak("Emergency alert: System malfunction detected!", 2);
     *
     * @example
     * // Low priority background information
     * speechManager.speak("Background processing complete", -1);
     *
     * @since 0.9.0-alpha
     * @author Marcelo Pereira Barbosa
     */
    speak(text: string, priority?: number): void;
    /**
     * Processes the speech synthesis queue in a state-managed, sequential manner.
     *
     * This method is the core orchestrator for the speech synthesis queue system, managing
     * the sequential processing of text-to-speech requests while ensuring only one speech
     * utterance plays at a time and maintaining a queue of pending items. It implements
     * robust error handling and state management for reliable speech processing.
     *
     * **Processing Logic**:
     * 1. Check if processing is possible (not currently speaking, queue not empty)
     * 2. Retrieve next highest priority item from queue
     * 3. Set concurrency control flag to prevent overlapping speech
     * 4. Create and configure speech utterance with current voice settings
     * 5. Set up event handlers for completion and error scenarios
     * 6. Execute speech synthesis via Web Speech API
     *
     * **State Management**:
     * - Uses `isCurrentlySpeaking` flag to prevent concurrent speech processing
     * - Automatically resets state on speech completion or error
     * - Maintains queue integrity through proper error handling
     *
     * @private
     * @returns {void}
     * @since 0.9.0-alpha
     * @author Marcelo Pereira Barbosa
     */
    processQueue(): void;
    /**
     * Starts the independent queue processing timer for reliable speech delivery.
     *
     * This method initializes a timer-based queue processing system that provides
     * an independent mechanism for processing queued speech items. This is useful
     * for ensuring reliable speech delivery in scenarios where the event-driven
     * processing might be unreliable or when explicit timer-based processing is preferred.
     *
     * **Timer Benefits**:
     * - Provides backup processing mechanism if event-driven processing fails
     * - Ensures regular queue checking at configurable intervals
     * - Useful for debugging and testing speech queue behavior
     * - Can help with browser-specific speech synthesis quirks
     *
     * @returns {void}
     *
     * @example
     * // Start timer-based queue processing
     * speechManager.startQueueTimer();
     * speechManager.speak("This will be processed by timer");
     *
     * @example
     * // Custom timer interval usage
     * speechManager.independentQueueTimerInterval = 200; // 200ms
     * speechManager.startQueueTimer();
     */
    startQueueTimer(): void;
    /**
     * Stops the independent queue processing timer.
     *
     * This method safely terminates the timer-based queue processing system,
     * clearing the interval timer and resetting the timer reference. It can
     * be called multiple times safely and handles cases where no timer is running.
     *
     * @returns {void}
     *
     * @example
     * // Stop timer-based processing
     * speechManager.stopQueueTimer();
     */
    stopQueueTimer(): void;
    /**
     * Pauses the current speech synthesis without affecting the queue.
     *
     * This method pauses the currently playing speech utterance while preserving
     * the speech queue and current state. The speech can be resumed later using
     * the resume() method. This is useful for temporary interruptions or user
     * control over speech playback.
     *
     * @returns {void}
     *
     * @example
     * // Pause current speech
     * speechManager.speak("This is a long message that can be paused");
     * setTimeout(() => speechManager.pause(), 1000);
     */
    pause(): void;
    /**
     * Resumes paused speech synthesis.
     *
     * This method resumes speech synthesis that was previously paused using
     * the pause() method. It only has an effect if speech is currently paused;
     * otherwise, it logs an appropriate message.
     *
     * @returns {void}
     *
     * @example
     * // Resume paused speech
     * speechManager.resume();
     */
    resume(): void;
    /**
     * Stops current speech synthesis and clears the entire queue.
     *
     * This method immediately stops any currently playing speech, clears all
     * pending items from the speech queue, resets the speaking state, and stops
     * any running queue processing timers. This is useful for emergency stops
     * or when the user wants to cancel all speech activity.
     *
     * **Cleanup Actions**:
     * - Cancels current speech utterance
     * - Clears all items from speech queue
     * - Resets isCurrentlySpeaking state
     * - Stops queue processing timer
     *
     * @returns {void}
     *
     * @example
     * // Emergency stop all speech
     * speechManager.stop();
     *
     * @example
     * // Clear queue and stop for new content
     * speechManager.stop();
     * speechManager.speak("New urgent message");
     */
    stop(): void;
    /**
     * Gets the current size of the speech queue.
     *
     * Returns the number of items currently pending in the speech queue,
     * not including any currently playing speech. This is useful for
     * monitoring queue status and implementing queue management logic.
     *
     * @returns {number} Number of items in the speech queue
     *
     * @example
     * // Check queue status
     * log(`Queue has ${speechManager.getQueueSize()} pending items`);
     *
     * @example
     * // Conditional processing based on queue size
     * if (speechManager.getQueueSize() > 5) {
     *     speechManager.stop(); // Clear overloaded queue
     * }
     */
    getQueueSize(): any;
    /**
     * Checks if speech synthesis is currently active.
     *
     * Returns true if speech is currently being synthesized (either playing
     * or paused), false otherwise. This provides external visibility into
     * the speech synthesis state for UI updates or conditional logic.
     *
     * @returns {boolean} True if currently speaking, false otherwise
     *
     * @example
     * // Check speaking status
     * if (!speechManager.isSpeaking()) {
     *     speechManager.speak("Ready for new speech");
     * }
     *
     * @example
     * // UI state updates
     * const speakButton = document.getElementById('speak-btn');
     * speakButton.disabled = speechManager.isSpeaking();
     */
    isSpeaking(): boolean;
    /**
     * Gets comprehensive status information about the speech synthesis system.
     *
     * Returns an object containing current configuration, state, and queue information
     * for debugging, monitoring, or UI display purposes. This provides a complete
     * snapshot of the speech synthesis system state including values from the
     * SpeechConfiguration composition object.
     *
     * @returns {Object} Status object with comprehensive system information
     * @returns {Object} return.voice - Current voice information (name, lang) or null
     * @returns {number} return.rate - Current speech rate (from SpeechConfiguration)
     * @returns {number} return.pitch - Current speech pitch (from SpeechConfiguration)
     * @returns {boolean} return.isSpeaking - Whether currently speaking
     * @returns {number} return.queueSize - Number of items in queue
     * @returns {boolean} return.queueTimerActive - Whether queue timer is running
     * @returns {number} return.voiceRetryAttempts - Number of voice retry attempts made (legacy)
     * @returns {boolean} return.voiceRetryActive - Whether voice retry timer is running (legacy)
     *
     * @example
     * // Get complete status
     * const status = speechManager.getStatus();
     * log('Speech Status:', status);
     *
     * @example
     * // Monitor queue for debugging
     * setInterval(() => {
     *     const status = speechManager.getStatus();
     *     if (status.queueSize > 0) {
     *         log(`Queue: ${status.queueSize} items, Speaking: ${status.isSpeaking}`);
     *     }
     * }, 1000);
     */
    getStatus(): {
        voice: {
            name: string;
            lang: string;
        };
        rate: number;
        pitch: number;
        isSpeaking: boolean;
        queueSize: any;
        queueTimerActive: boolean;
        voiceRetryAttempts: number;
        voiceRetryActive: boolean;
    };
    /**
     * Returns a string representation of the SpeechSynthesisManager instance.
     *
     * Provides a human-readable representation showing the class name and current
     * configuration including voice, rate, pitch, speaking status, and queue size.
     * This is useful for logging, debugging, and development purposes.
     *
     * @returns {string} String representation with current configuration
     *
     * @example
     * log(speechManager.toString());
     * // Output: "SpeechSynthesisManager: voice=Google português do Brasil, rate=1, pitch=1, isSpeaking=false, queueSize=0"
     *
     * @example
     * // Use in error logging
     * error('Speech error in:', speechManager.toString());
     */
    toString(): string;
    /**
     * Destroys the speech manager and cleans up all resources.
     *
     * Stops all timers (voice retry and queue processing), cancels any ongoing speech,
     * clears the queue, and releases references. This method is critical for preventing
     * timer leaks in test environments where SpeechSynthesisManager instances are
     * created and destroyed frequently.
     *
     * Call this method when the speech manager is no longer needed to ensure proper
     * cleanup of all resources and prevent memory/timer leaks.
     *
     * @returns {void}
     * @since 0.9.0-alpha
     * @author Marcelo Pereira Barbosa
     *
     * @example
     * const speechManager = new SpeechSynthesisManager();
     * speechManager.speak("Hello world");
     * // ... use speech manager
     * speechManager.destroy(); // Clean up when done
     *
     * @example
     * // In tests
     * describe('SpeechSynthesisManager', () => {
     *   let manager;
     *
     *   beforeEach(() => {
     *     manager = new SpeechSynthesisManager();
     *   });
     *
     *   afterEach(() => {
     *     if (manager) {
     *       manager.destroy(); // Prevent timer leaks
     *     }
     *   });
     * });
     */
    destroy(): void;
}
export default SpeechSynthesisManager;
/**
 * Named priority levels for the speech synthesis queue.
 * Higher values are processed first.
 */
export declare const SPEECH_PRIORITY: {
    readonly PERIODIC: 0;
    readonly LOGRADOURO: 1;
    readonly BAIRRO: 2;
    readonly FIRST_ADDRESS: 2.5;
    readonly MUNICIPIO: 3;
};
/**
 * Module exports for speech synthesis management.
 * @exports SPEECH_CONFIG - Default speech synthesis configuration
 * @exports SPEECH_PRIORITY - Named priority levels for the speech queue
 */
export { SPEECH_CONFIG };
//# sourceMappingURL=SpeechSynthesisManager.d.ts.map