/**
 * SpeechConfiguration class for managing speech synthesis parameters.
 */
export declare class SpeechConfiguration {
    enableLogging: boolean;
    rate: number;
    pitch: number;
    /**
     * Creates a new SpeechConfiguration instance.
     *
     * @param {boolean} [enableLogging=false] - Whether to enable logging
     */
    constructor(enableLogging?: boolean);
    /**
     * Safe logging that checks for console availability.
     * @private
     */
    safeLog(message: string, ...params: unknown[]): void;
    /**
     * Safe warning logging that checks for console availability.
     * @private
     */
    safeWarn(message: string, ...params: unknown[]): void;
    /**
     * Set speech rate with validation and clamping.
     *
     * Configures the speech synthesis rate (speed) with automatic validation
     * and clamping to ensure values remain within valid range (0.1 to 10.0).
     *
     * @param {number} rate - Speech rate (0.1 to 10.0, where 1.0 is normal)
     * @returns {number} The clamped rate value
     * @throws {TypeError} If rate is not a valid number
     *
     * @example
     * config.setRate(1.0);  // Normal speed
     * config.setRate(0.5);  // Slow speed
     * config.setRate(2.0);  // Fast speed
     */
    setRate(rate: number): number;
    /**
     * Set speech pitch with validation and clamping.
     *
     * Configures the speech synthesis pitch with automatic validation
     * and clamping to ensure values remain within valid range (0.0 to 2.0).
     *
     * @param {number} pitch - Speech pitch (0.0 to 2.0, where 1.0 is normal)
     * @returns {number} The clamped pitch value
     * @throws {TypeError} If pitch is not a valid number
     *
     * @example
     * config.setPitch(1.0);  // Normal pitch
     * config.setPitch(1.5);  // Higher pitch
     * config.setPitch(0.8);  // Lower pitch
     */
    setPitch(pitch: number): number;
    /**
     * Get current speech rate.
     *
     * @returns {number} Current rate value
     */
    getRate(): number;
    /**
     * Get current speech pitch.
     *
     * @returns {number} Current pitch value
     */
    getPitch(): number;
    /**
     * Get current configuration as object.
     *
     * @returns {{rate: number, pitch: number}} Current configuration
     */
    getConfiguration(): {
        rate: number;
        pitch: number;
    };
    /**
     * Reset configuration to defaults.
     *
     * @returns {void}
     */
    reset(): void;
    /**
     * Enable logging.
     *
     * @returns {void}
     */
    enableLogs(): void;
    /**
     * Disable logging.
     *
     * @returns {void}
     */
    disableLogs(): void;
    /**
     * Get valid range for rate parameter.
     *
     * @returns {{min: number, max: number, default: number}} Rate range
     */
    static getRateRange(): {
        min: number;
        max: number;
        default: number;
    };
    /**
     * Get valid range for pitch parameter.
     *
     * @returns {{min: number, max: number, default: number}} Pitch range
     */
    static getPitchRange(): {
        min: number;
        max: number;
        default: number;
    };
}
export default SpeechConfiguration;
//# sourceMappingURL=SpeechConfiguration.d.ts.map