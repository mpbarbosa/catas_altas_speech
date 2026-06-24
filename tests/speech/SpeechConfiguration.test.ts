import { describe, it, expect } from 'vitest';
import SpeechConfiguration from '../../src/speech/SpeechConfiguration.js';

describe('SpeechConfiguration', () => {
  it('starts at the default rate and pitch', () => {
    const config = new SpeechConfiguration();
    expect(config.getRate()).toBe(1.0);
    expect(config.getPitch()).toBe(1.0);
  });

  describe('setRate', () => {
    it('accepts an in-range value', () => {
      expect(new SpeechConfiguration().setRate(2)).toBe(2);
    });

    it('clamps above the maximum and below the minimum', () => {
      const config = new SpeechConfiguration();
      expect(config.setRate(15)).toBe(10.0);
      expect(config.setRate(-5)).toBe(0.1);
    });

    it('rejects non-numbers', () => {
      const config = new SpeechConfiguration();
      // @ts-expect-error — wrong type on purpose
      expect(() => config.setRate('fast')).toThrow(TypeError);
      expect(() => config.setRate(NaN)).toThrow(TypeError);
    });
  });

  describe('setPitch', () => {
    it('clamps to the 0.0–2.0 range', () => {
      const config = new SpeechConfiguration();
      expect(config.setPitch(5)).toBe(2.0);
      expect(config.setPitch(-1)).toBe(0.0);
      expect(config.setPitch(1.5)).toBe(1.5);
    });
  });

  it('reset restores defaults', () => {
    const config = new SpeechConfiguration();
    config.setRate(3);
    config.setPitch(0.5);
    config.reset();
    expect(config.getConfiguration()).toEqual({ rate: 1.0, pitch: 1.0 });
  });

  it('exposes valid ranges statically', () => {
    expect(SpeechConfiguration.getRateRange()).toEqual({ min: 0.1, max: 10.0, default: 1.0 });
    expect(SpeechConfiguration.getPitchRange()).toEqual({ min: 0.0, max: 2.0, default: 1.0 });
  });
});
