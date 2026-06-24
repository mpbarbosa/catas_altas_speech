import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SpeechSynthesisManager from '../../src/speech/SpeechSynthesisManager.js';

type Utt = {
  text: string;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

// Minimal Web Speech API fake. speak() records the utterance; the test fires
// onend/onerror to drive queue progression deterministically.
function makeFakeSynth(voices: SpeechSynthesisVoice[]) {
  return {
    speaking: false,
    paused: false,
    onvoiceschanged: null as null | (() => void),
    voices,
    spoken: [] as Utt[],
    cancelCount: 0,
    getVoices() {
      return this.voices;
    },
    speak(u: Utt) {
      this.speaking = true;
      this.spoken.push(u);
    },
    cancel() {
      this.speaking = false;
      this.paused = false;
      this.cancelCount++;
    },
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
    },
  };
}

class FakeUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function voice(name: string, lang: string, localService = false): SpeechSynthesisVoice {
  return { name, lang, localService } as SpeechSynthesisVoice;
}

let synth: ReturnType<typeof makeFakeSynth>;

beforeEach(() => {
  synth = makeFakeSynth([voice('Luciana', 'pt-BR', true), voice('Daniel', 'en-US')]);
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('SpeechSynthesisManager — construction', () => {
  it('rejects a non-boolean enableLogging', () => {
    // @ts-expect-error — wrong type on purpose
    expect(() => new SpeechSynthesisManager('yes')).toThrow(TypeError);
  });

  it('throws when the Web Speech API is unavailable', () => {
    vi.stubGlobal('window', {});
    expect(() => new SpeechSynthesisManager()).toThrow(/not available/i);
  });

  it('selects a pt-BR voice and registers an onvoiceschanged listener', () => {
    const m = new SpeechSynthesisManager();
    expect(m.getCurrentVoice()?.name).toBe('Luciana');
    expect(typeof synth.onvoiceschanged).toBe('function');
    expect(m.getStatus()).toMatchObject({ rate: 1, pitch: 1, isSpeaking: false, queueSize: 0 });
  });

  it('reselects when voices arrive later via onvoiceschanged', () => {
    synth.voices = [];
    const m = new SpeechSynthesisManager();
    expect(m.getCurrentVoice()).toBeNull();
    synth.voices = [voice('Luciana', 'pt-BR', true)];
    synth.onvoiceschanged?.();
    expect(m.getCurrentVoice()?.name).toBe('Luciana');
  });
});

describe('SpeechSynthesisManager — speak', () => {
  it('validates its input', () => {
    const m = new SpeechSynthesisManager();
    // @ts-expect-error — text must be a string
    expect(() => m.speak(123)).toThrow(TypeError);
    expect(() => m.speak('   ')).toThrow(Error);
    // @ts-expect-error — priority must be a number
    expect(() => m.speak('x', 'high')).toThrow(TypeError);
  });

  it('speaks immediately when idle, configuring the utterance', () => {
    const m = new SpeechSynthesisManager();
    m.setRate(1.5);
    m.setPitch(0.8);
    m.speak('olá mundo');
    expect(synth.spoken).toHaveLength(1);
    expect(synth.spoken[0]).toMatchObject({
      text: 'olá mundo',
      rate: 1.5,
      pitch: 0.8,
    });
    expect(synth.spoken[0].voice?.name).toBe('Luciana');
    expect(m.isSpeaking()).toBe(true);
  });

  it('queues additional requests while speaking instead of overlapping', () => {
    const m = new SpeechSynthesisManager();
    m.speak('um');
    m.speak('dois');
    expect(synth.spoken).toHaveLength(1);
    expect(m.getQueueSize()).toBe(1);
  });

  it('drains the next item after onend', () => {
    const m = new SpeechSynthesisManager();
    m.speak('um');
    m.speak('dois');
    vi.useFakeTimers();
    synth.spoken[0].onend?.();
    vi.advanceTimersByTime(10);
    expect(synth.spoken.map((u) => u.text)).toEqual(['um', 'dois']);
  });

  it('continues the queue after an utterance error', () => {
    const m = new SpeechSynthesisManager();
    m.speak('um');
    m.speak('dois');
    vi.useFakeTimers();
    synth.spoken[0].onerror?.({ error: 'interrupted' });
    vi.advanceTimersByTime(10);
    expect(synth.spoken.map((u) => u.text)).toEqual(['um', 'dois']);
  });

  it('respects priority order when draining', () => {
    const m = new SpeechSynthesisManager();
    m.speak('baixa', 0);
    m.speak('alta', 3);
    m.speak('media', 1);
    expect(synth.spoken[0].text).toBe('baixa'); // already dequeued before the others arrived
    vi.useFakeTimers();
    synth.spoken[0].onend?.();
    vi.advanceTimersByTime(10);
    synth.spoken[1].onend?.();
    vi.advanceTimersByTime(10);
    expect(synth.spoken.map((u) => u.text)).toEqual(['baixa', 'alta', 'media']);
  });
});

describe('SpeechSynthesisManager — controls', () => {
  it('pauses only while actively speaking', () => {
    const m = new SpeechSynthesisManager();
    m.pause();
    expect(synth.paused).toBe(false); // nothing speaking
    m.speak('um');
    m.pause();
    expect(synth.paused).toBe(true);
  });

  it('resumes only when paused', () => {
    const m = new SpeechSynthesisManager();
    m.resume();
    expect(synth.paused).toBe(false);
    m.speak('um');
    m.pause();
    m.resume();
    expect(synth.paused).toBe(false);
  });

  it('stop cancels synthesis and clears the queue', () => {
    const m = new SpeechSynthesisManager();
    m.speak('um');
    m.speak('dois');
    m.stop();
    expect(synth.cancelCount).toBe(1);
    expect(m.getQueueSize()).toBe(0);
    expect(m.isSpeaking()).toBe(false);
  });
});

describe('SpeechSynthesisManager — configuration', () => {
  it('clamps rate and pitch and reflects them in status', () => {
    const m = new SpeechSynthesisManager();
    m.setRate(99);
    m.setPitch(-3);
    expect(m.getStatus()).toMatchObject({ rate: 10, pitch: 0 });
  });

  it('rejects invalid rate/pitch and voice', () => {
    const m = new SpeechSynthesisManager();
    expect(() => m.setRate(NaN)).toThrow(TypeError);
    // @ts-expect-error — voice must be an object or null
    expect(() => m.setVoice('Luciana')).toThrow(TypeError);
  });

  it('allows overriding the voice and returns a defensive copy of voices', () => {
    const m = new SpeechSynthesisManager();
    const custom = voice('Daniel', 'en-US');
    m.setVoice(custom);
    expect(m.getCurrentVoice()).toBe(custom);

    const list = m.getAvailableVoices();
    list.push(voice('Intruder', 'xx'));
    expect(m.getAvailableVoices().some((v) => v.name === 'Intruder')).toBe(false);
  });
});

describe('SpeechSynthesisManager — lifecycle', () => {
  it('reports status and a readable toString', () => {
    const m = new SpeechSynthesisManager();
    m.speak('um');
    expect(m.toString()).toContain('SpeechSynthesisManager');
    expect(m.toString()).toContain('isSpeaking=true');
  });

  it('destroy cancels synthesis and releases the synth reference', () => {
    const m = new SpeechSynthesisManager();
    m.speak('um');
    expect(() => m.destroy()).not.toThrow();
    expect(synth.cancelCount).toBe(1);
    // destroy() releases the engine reference; the instance is meant to be
    // discarded afterward. Note it does NOT reset isCurrentlySpeaking.
    expect((m as unknown as { synth: unknown }).synth).toBeNull();
  });
});
