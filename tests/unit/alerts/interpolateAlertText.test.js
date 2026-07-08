import { describe, it, expect } from 'vitest';
import { interpolateAlertText, interpolateMessageEntry } from '../../../src/services/alerts/interpolateAlertText.js';

describe('interpolateAlertText', () => {
  it('replaces {{TOKEN}} placeholders', () => {
    expect(interpolateAlertText('Hello {{NAME}}', { NAME: 'World' })).toBe('Hello World');
  });

  it('replaces {{{token}}} mustache-style placeholders', () => {
    expect(interpolateAlertText('at {{{timestamp}}}', { timestamp: 'now' })).toBe('at now');
  });

  it('replaces %1% via replacements array', () => {
    expect(interpolateAlertText('reason: %1%', { replacements: ['blocked'] })).toBe('reason: blocked');
  });

  it('supports legacy find/replace', () => {
    expect(
      interpolateAlertText('reason: %1%', { find: '%1%', replace: 'NIL' })
    ).toBe('reason: NIL');
  });
});

describe('interpolateMessageEntry', () => {
  it('walks nested strings', () => {
    const out = interpolateMessageEntry(
      { title: 'T', text: 'Hi {{X}}', nested: { text: '%1%' } },
      { X: 'Y', replacements: ['Z'] }
    );
    expect(out.text).toBe('Hi Y');
    expect(out.nested.text).toBe('Z');
  });
});
