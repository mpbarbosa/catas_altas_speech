import { describe, it, expect } from 'vitest';
import SpeechItem from '../../src/speech/SpeechItem.js';

describe('SpeechItem', () => {
  it('stores text, priority, and timestamp', () => {
    const item = new SpeechItem('olá', 2, 1000);
    expect(item.text).toBe('olá');
    expect(item.priority).toBe(2);
    expect(item.timestamp).toBe(1000);
  });

  it('defaults priority to 0', () => {
    expect(new SpeechItem('x').priority).toBe(0);
  });

  it('rejects invalid construction', () => {
    // @ts-expect-error — exercising a runtime guard with a wrong type
    expect(() => new SpeechItem(123)).toThrow(TypeError);
    // @ts-expect-error — priority must be a number
    expect(() => new SpeechItem('x', 'high')).toThrow(TypeError);
    // @ts-expect-error — timestamp must be a number
    expect(() => new SpeechItem('x', 0, 'now')).toThrow(TypeError);
  });

  it('is frozen and rejects mutation', () => {
    const item = new SpeechItem('x', 1, 0);
    expect(Object.isFrozen(item)).toBe(true);
    expect(() => {
      // @ts-expect-error — frozen instance, assignment throws in strict mode
      item.text = 'changed';
    }).toThrow(TypeError);
    expect(item.text).toBe('x');
  });

  describe('isExpired', () => {
    it('is true once the age exceeds the window', () => {
      const item = new SpeechItem('x', 0, Date.now() - 60_000);
      expect(item.isExpired(30_000)).toBe(true);
    });

    it('is false within the window', () => {
      const item = new SpeechItem('x', 0, Date.now());
      expect(item.isExpired(30_000)).toBe(false);
    });
  });

  it('truncates long text in toString and shows priority', () => {
    const short = new SpeechItem('curto', 1, 0);
    expect(short.toString()).toBe('SpeechItem: "curto" (priority: 1)');

    const long = new SpeechItem('a'.repeat(60), 2, 0);
    expect(long.toString()).toContain('...');
    expect(long.toString()).toContain('(priority: 2)');
  });
});
