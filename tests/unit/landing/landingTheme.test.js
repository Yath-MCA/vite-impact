import { describe, it, expect } from 'vitest';
import { getLandingNavTheme, THEME_COLOR_HEX } from '../../../src/features/landing/landingTheme.js';
import landingMeta from '../../../src/config/landing-meta.json';

describe('landingTheme nav chrome', () => {
  it('maps oxford to Oxford Blue navbar and white link text', () => {
    const theme = getLandingNavTheme('oxford');
    expect(theme.isDarkNav).toBe(true);
    expect(theme.navClass).toContain('bg-oxford-900');
    expect(theme.navClass).toContain('text-white');
    expect(theme.linkClass).toContain('text-white');
    expect(theme.linkClass).toContain('text-base');
    expect(theme.linkClass).not.toContain('text-sm');
    expect(theme.themeColor).toBe('#002147');
    expect(theme.themeColor).toBe(THEME_COLOR_HEX.oxford);
  });

  it('uses a dark navbar for other white-logo client themes', () => {
    for (const name of ['plos', 'acs', 'oho']) {
      const theme = getLandingNavTheme(name);
      expect(theme.isDarkNav, name).toBe(true);
      expect(theme.navClass, name).toContain('text-white');
      expect(theme.linkClass, name).toContain('text-white');
      expect(theme.linkClass, name).toContain('text-base');
      expect(theme.linkClass, name).not.toContain('text-sm');
      expect(theme.linkClass, name).toContain('hover:text-white/80');
      expect(theme.navClass, name).toMatch(/bg-\w+-900/);
    }
  });

  it('uses a white navbar with dark text for lww', () => {
    const theme = getLandingNavTheme('lww');
    expect(theme.isDarkNav).toBe(false);
    expect(theme.navClass).toContain('bg-white');
    expect(theme.navClass).toContain('text-gray-900');
    expect(theme.linkClass).toContain('text-gray-800');
    expect(theme.linkClass).toContain('text-base');
    expect(theme.linkClass).not.toContain('text-sm');
    expect(theme.linkClass).toContain('hover:text-primary-700');
    expect(theme.linkClass).not.toContain('hover:text-gray-950');
    expect(theme.linkClass).not.toContain('hover:text-primary-600');
  });

  it('keeps primary/default nav light for dark-on-light logos', () => {
    const theme = getLandingNavTheme('primary');
    expect(theme.isDarkNav).toBe(false);
    expect(theme.navClass).toContain('bg-white');
    expect(theme.linkClass).toContain('text-gray-700');
    expect(theme.linkClass).toContain('text-base');
    expect(theme.linkClass).not.toContain('text-sm');
    expect(theme.linkClass).toContain('hover:text-primary-700');
    expect(theme.linkClass).not.toContain('hover:text-primary-600');
  });

  it('falls back to primary chrome for an unknown theme', () => {
    const theme = getLandingNavTheme('not-a-theme');
    expect(theme.theme).toBe('primary');
    expect(theme.navClass).toContain('bg-white');
  });

  it('oup landing-meta theme is oxford so the white header logo gets a dark bar', () => {
    expect(landingMeta.logo.oup.theme).toBe('oxford');
    expect(landingMeta.logo.oup['header-logo'].name).toMatch(/WHITE/i);
    const theme = getLandingNavTheme(landingMeta.logo.oup.theme);
    expect(theme.isDarkNav).toBe(true);
    expect(theme.navClass).toContain('bg-oxford-900');
  });
});
