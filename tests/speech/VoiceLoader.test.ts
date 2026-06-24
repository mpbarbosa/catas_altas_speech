import { describe, it, expect, vi } from 'vitest';
import VoiceLoader from '../../src/speech/VoiceLoader.js';

function makeVoice(name: string, lang = 'pt-BR'): SpeechSynthesisVoice {
  return { name, lang } as SpeechSynthesisVoice;
}

// Minimal Web Speech API stand-in: returns whatever getVoices yields.
function fakeSynth(getVoices: () => SpeechSynthesisVoice[]) {
  return { getVoices } as unknown as SpeechSynthesis;
}

describe('VoiceLoader', () => {
  it('loads and caches voices that are available immediately', async () => {
    const loader = new VoiceLoader({ speechSynthesis: fakeSynth(() => [makeVoice('Luciana')]) });
    const voices = await loader.loadVoices();
    expect(voices.map((v) => v.name)).toEqual(['Luciana']);
    expect(loader.hasVoices()).toBe(true);
    expect(loader.getVoices()).toBe(voices);
  });

  it('retries with backoff until voices appear', async () => {
    let calls = 0;
    const synth = fakeSynth(() => (++calls >= 3 ? [makeVoice('Luciana')] : []));
    const loader = new VoiceLoader({ speechSynthesis: synth, initialDelay: 1, maxDelay: 4 });
    const voices = await loader.loadVoices();
    expect(voices).toHaveLength(1);
    expect(calls).toBeGreaterThanOrEqual(3);
  });

  it('returns an empty array after exhausting retries', async () => {
    const loader = new VoiceLoader({
      speechSynthesis: fakeSynth(() => []),
      maxRetries: 2,
      initialDelay: 1,
    });
    expect(await loader.loadVoices()).toEqual([]);
    expect(loader.hasVoices()).toBe(false);
  });

  it('rejects when no speech synthesis is available', async () => {
    const loader = new VoiceLoader({ speechSynthesis: null });
    await expect(loader.loadVoices()).rejects.toThrow(/not available/i);
  });

  it('clearCache forces a reload', async () => {
    const spy = vi.fn(() => [makeVoice('Luciana')]);
    const loader = new VoiceLoader({ speechSynthesis: fakeSynth(spy) });
    await loader.loadVoices();
    expect(loader.hasVoices()).toBe(true);
    loader.clearCache();
    expect(loader.hasVoices()).toBe(false);
    await loader.loadVoices();
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('exposes its retry configuration', () => {
    const loader = new VoiceLoader({ maxRetries: 7, initialDelay: 50, maxDelay: 800 });
    expect(loader.getRetryConfig()).toEqual({ maxRetries: 7, initialDelay: 50, maxDelay: 800 });
  });
});
