import { describe, it, expect } from 'vitest';
import { tourSteps } from '../../../src/features/editor/tour/tourSteps.js';

describe('tourSteps', () => {
  it('has at least one step', () => {
    expect(tourSteps.length).toBeGreaterThan(0);
  });

  it('every step has a data-tour target selector, a title, and non-empty content', () => {
    tourSteps.forEach((step) => {
      expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
      expect(typeof step.title).toBe('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.content).toBe('string');
      expect(step.content.length).toBeGreaterThan(0);
    });
  });

  it('has no duplicate target selectors', () => {
    const targets = tourSteps.map((step) => step.target);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('covers the five real EditorPage regions', () => {
    const targets = tourSteps.map((step) => step.target);
    expect(targets).toEqual([
      '[data-tour="toc"]',
      '[data-tour="editor-canvas"]',
      '[data-tour="pdf-preview"]',
      '[data-tour="thumbnails"]',
      '[data-tour="footer"]'
    ]);
  });
});
