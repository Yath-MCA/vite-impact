import { describe, it, expect } from 'vitest';
import {
  computeAcceptButtonVisible,
  ACCEPT_BUTTON_TTL_MS
} from '../../../src/features/landing/hooks/acceptButtonVisibility.js';

describe('acceptButtonVisibility', () => {
  it('exports 5-minute TTL', () => {
    expect(ACCEPT_BUTTON_TTL_MS).toBe(5 * 60 * 1000);
  });

  it('shows accept when landing active and timer not expired', () => {
    expect(
      computeAcceptButtonVisible({
        landingActive: true,
        timerExpired: false,
        tabHidden: false
      })
    ).toBe(true);
  });

  it('hides accept when tab hidden', () => {
    expect(
      computeAcceptButtonVisible({
        landingActive: true,
        timerExpired: false,
        tabHidden: true
      })
    ).toBe(false);
  });

  it('hides accept when timer expired', () => {
    expect(
      computeAcceptButtonVisible({
        landingActive: true,
        timerExpired: true,
        tabHidden: false
      })
    ).toBe(false);
  });

  it('hides accept when landing not active', () => {
    expect(
      computeAcceptButtonVisible({
        landingActive: false,
        timerExpired: false,
        tabHidden: false
      })
    ).toBe(false);
  });
});
