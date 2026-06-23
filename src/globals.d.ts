// The copied SpeechItem exposes itself on window for browser debugging.
declare global {
  interface Window {
    SpeechItem?: unknown;
  }
}

export {};
