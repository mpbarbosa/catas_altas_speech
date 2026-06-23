# catas_altas_speech

A self-contained **pt-BR text-to-speech engine** built on the browser
[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API).
Extracted from the working speech feature of the `guia_js` project:

- Asynchronous voice loading (Chrome/Android return `[]` from `getVoices()` until
  the engine warms up — handled with `voiceschanged` + retries).
- pt-BR voice selection (pt-BR → pt-\* → system default).
- A **priority queue** with expiration, so a high-priority cue (a goal) preempts a
  queued low-priority one (a card), plus `pause()` / `resume()` / `stop()`.

The only change for standalone use is vendoring `DualObserverSubject` locally
(see `src/core/`), so there are **no runtime dependencies**.

## Use via CDN (jsDelivr)

No build step, no bundler — import the ESM straight from jsDelivr:

```html
<script type="module">
  import SpeechSynthesisManager, {
    SPEECH_PRIORITY,
  } from 'https://cdn.jsdelivr.net/gh/mpbarbosa/catas_altas_speech@0.1.2/dist/esm/index.js';

  const speech = new SpeechSynthesisManager();

  // Call speak() inside a user gesture the first time — mobile browsers only
  // unlock audio from within a tap/click handler.
  button.addEventListener('click', () => {
    speech.speak('Gol do Brasil! Brasil 1 a 0 Argentina.', SPEECH_PRIORITY.MUNICIPIO);
  });
</script>
```

Pin a tag (`@0.1.2`) for stability, or use `@latest` to always get the newest
release. `dist/` is committed so jsDelivr can serve it.

## API

```ts
const speech = new SpeechSynthesisManager(enableLogging?: boolean);

speech.speak(text: string, priority?: number): void; // higher priority first
speech.pause(): void;
speech.resume(): void;
speech.stop(): void;                  // cancel current + clear queue
speech.setRate(rate: number): void;   // 0.1–10.0
speech.setPitch(pitch: number): void; // 0.0–2.0
speech.setVoice(voice: SpeechSynthesisVoice | null): void;
speech.isSpeaking(): boolean;
speech.getCurrentVoice(): SpeechSynthesisVoice | null;
speech.getStatus(): { voice, rate, pitch, isSpeaking, queueSize, ... };
speech.destroy(): void;

// Named priority tiers (re-exported):
SPEECH_PRIORITY = { PERIODIC: 0, LOGRADOURO: 1, BAIRRO: 2, FIRST_ADDRESS: 2.5, MUNICIPIO: 3 };
```

## Demo

`examples/index.html` imports from the CDN — just open it in a browser
(or `npm run serve` and visit <http://localhost:8099/examples/>). Tap **Falar**;
on mobile keep media volume up (and on iPhone, the silent switch off).

## Local build

```bash
npm install
npm run build      # → dist/esm (ESM + .d.ts)
```

## License

MIT
