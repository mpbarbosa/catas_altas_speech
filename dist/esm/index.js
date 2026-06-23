/**
 * catas_altas_speech — a self-contained pt-BR text-to-speech engine.
 *
 * Extracted verbatim from the working speech feature in the guia_js project
 * (Web Speech API: async voice loading, pt-BR voice selection, a priority queue
 * with expiration, and pause/resume/stop). The only adaptation for standalone
 * use is vendoring DualObserverSubject locally (see src/core).
 *
 * Quick start:
 *   import SpeechSynthesisManager from "catas_altas_speech";
 *   const speech = new SpeechSynthesisManager();
 *   button.addEventListener("click", () => speech.speak("Olá, mundo!", 1));
 */
export { default, SPEECH_PRIORITY, SPEECH_CONFIG } from "./speech/SpeechSynthesisManager.js";
export { default as SpeechSynthesisManager } from "./speech/SpeechSynthesisManager.js";
export { default as SpeechQueue } from "./speech/SpeechQueue.js";
export { default as VoiceLoader } from "./speech/VoiceLoader.js";
export { default as VoiceSelector } from "./speech/VoiceSelector.js";
export { default as SpeechConfiguration } from "./speech/SpeechConfiguration.js";
//# sourceMappingURL=index.js.map