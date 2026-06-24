import { describe, it, expect } from 'vitest';
import VoiceSelector from '../../src/speech/VoiceSelector.js';

// A plain object is enough — VoiceSelector only reads name/lang/localService.
function makeVoice(name: string, lang: string, localService = false): SpeechSynthesisVoice {
  return { name, lang, localService } as SpeechSynthesisVoice;
}

describe('VoiceSelector', () => {
  const selector = new VoiceSelector();

  it('returns null when there are no voices', () => {
    expect(selector.selectVoice([])).toBeNull();
  });

  it('prefers an exact pt-BR match over other Portuguese variants', () => {
    const voices = [makeVoice('Joana', 'pt-PT'), makeVoice('Luciana', 'pt-BR')];
    expect(selector.selectVoice(voices)?.name).toBe('Luciana');
  });

  it('falls back to a pt-* variant when no pt-BR exists', () => {
    const voices = [makeVoice('Daniel', 'en-US'), makeVoice('Joana', 'pt-PT')];
    expect(selector.selectVoice(voices)?.name).toBe('Joana');
  });

  it('falls back to the first voice when no Portuguese exists', () => {
    const voices = [makeVoice('Daniel', 'en-US'), makeVoice('Anna', 'de-DE')];
    expect(selector.selectVoice(voices)?.name).toBe('Daniel');
  });

  it('prefers a local pt-BR voice over a remote one', () => {
    const remote = makeVoice('Remote BR', 'pt-BR', false);
    const local = makeVoice('Local BR', 'pt-BR', true);
    expect(selector.selectVoice([remote, local])?.name).toBe('Local BR');
  });

  it('scores local and exact-language voices higher', () => {
    expect(selector.scoreVoice(makeVoice('a', 'pt-BR', true))).toBe(30); // +20 lang +10 local
    expect(selector.scoreVoice(makeVoice('b', 'pt-BR', false))).toBe(20);
    expect(selector.scoreVoice(makeVoice('c', 'en-US', true))).toBe(10);
    expect(selector.scoreVoice(makeVoice('d', 'en-US', false))).toBe(0);
  });

  it('filters by exact language and by prefix, case-insensitively', () => {
    const voices = [makeVoice('a', 'PT-br'), makeVoice('b', 'pt-PT'), makeVoice('c', 'en-US')];
    expect(selector.filterByLanguage(voices, 'pt-BR').map((v) => v.name)).toEqual(['a']);
    expect(selector.filterByLanguagePrefix(voices, 'pt').map((v) => v.name)).toEqual(['a', 'b']);
  });

  it('honors a custom primary language', () => {
    const enSelector = new VoiceSelector({ primaryLang: 'en-us', fallbackLangPrefix: 'en' });
    const voices = [makeVoice('Joana', 'pt-BR'), makeVoice('Daniel', 'en-US')];
    expect(enSelector.selectVoice(voices)?.name).toBe('Daniel');
  });
});
