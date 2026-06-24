import { describe, it, expect, vi, afterEach } from 'vitest';
import SpeechQueue from '../../src/speech/SpeechQueue.js';

describe('SpeechQueue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('construction', () => {
    it('rejects out-of-range maxSize and expirationMs', () => {
      expect(() => new SpeechQueue(0)).toThrow(RangeError);
      expect(() => new SpeechQueue(1001)).toThrow(RangeError);
      expect(() => new SpeechQueue(100, 999)).toThrow(RangeError);
      expect(() => new SpeechQueue(100, 300001)).toThrow(RangeError);
    });

    it('rejects a non-boolean logging flag', () => {
      // @ts-expect-error — wrong type on purpose
      expect(() => new SpeechQueue(100, 30000, 'yes')).toThrow(TypeError);
    });
  });

  describe('priority ordering', () => {
    it('dequeues highest priority first', () => {
      const q = new SpeechQueue();
      q.enqueue('low', 0);
      q.enqueue('high', 3);
      q.enqueue('mid', 1);
      expect([q.dequeue()?.text, q.dequeue()?.text, q.dequeue()?.text]).toEqual([
        'high',
        'mid',
        'low',
      ]);
    });

    it('keeps FIFO order within the same priority', () => {
      const q = new SpeechQueue();
      q.enqueue('first', 1);
      q.enqueue('second', 1);
      expect([q.dequeue()?.text, q.dequeue()?.text]).toEqual(['first', 'second']);
    });
  });

  describe('size and emptiness', () => {
    it('tracks size and empties via clear', () => {
      const q = new SpeechQueue();
      expect(q.isEmpty()).toBe(true);
      q.enqueue('a', 0);
      q.enqueue('b', 0);
      expect(q.size()).toBe(2);
      q.clear();
      expect(q.isEmpty()).toBe(true);
    });
  });

  describe('enqueue validation', () => {
    it('rejects bad text and priority', () => {
      const q = new SpeechQueue();
      // @ts-expect-error — text must be a string
      expect(() => q.enqueue(42)).toThrow(TypeError);
      expect(() => q.enqueue('   ')).toThrow(Error);
      expect(() => q.enqueue('x', Infinity)).toThrow(TypeError);
    });
  });

  describe('size limit', () => {
    it('trims the lowest-priority items beyond maxSize', () => {
      const q = new SpeechQueue(2);
      q.enqueue('low', 0);
      q.enqueue('high', 5);
      q.enqueue('mid', 1);
      expect(q.size()).toBe(2);
      const texts = q.getItems().map((i) => i.text);
      expect(texts).toEqual(['high', 'mid']);
      expect(texts).not.toContain('low');
    });
  });

  describe('expiration', () => {
    it('drops items older than expirationMs', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(0));
      const q = new SpeechQueue(100, 1000);
      q.enqueue('stale', 0);
      expect(q.size()).toBe(1);
      vi.setSystemTime(new Date(2000));
      expect(q.size()).toBe(0);
    });
  });
});
