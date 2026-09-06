import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenTour, setHasSeenTour } from '../../../src/features/editor/tour/tourSeenStorage.js';

describe('tourSeenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when nothing has been recorded', () => {
    expect(hasSeenTour('DOC1')).toBe(false);
  });

  it('round-trips true after setHasSeenTour', () => {
    setHasSeenTour('DOC1', true);
    expect(hasSeenTour('DOC1')).toBe(true);
  });

  it('keeps different docIds isolated', () => {
    setHasSeenTour('DOC1', true);
    expect(hasSeenTour('DOC2')).toBe(false);
  });

  it('returns false when docId is falsy', () => {
    expect(hasSeenTour('')).toBe(false);
    expect(hasSeenTour(undefined)).toBe(false);
  });

  it('returns false without throwing when localStorage.getItem throws', () => {
    const original = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('boom');
    };
    expect(hasSeenTour('DOC1')).toBe(false);
    localStorage.getItem = original;
  });

  it('does not throw when localStorage.setItem throws', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('boom');
    };
    expect(() => setHasSeenTour('DOC1', true)).not.toThrow();
    localStorage.setItem = original;
  });
});
