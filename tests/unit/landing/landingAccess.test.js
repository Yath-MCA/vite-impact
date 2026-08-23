import { describe, it, expect } from 'vitest';
import {
  isTokenOtpEnabled,
  shouldRunLandingAuth,
  shouldRunPlosAuth
} from '../../../src/features/landing/landingAccess.js';

describe('landingAccess auth gates', () => {
  it('runs PLOS auth for plos clients', () => {
    expect(shouldRunPlosAuth({}, {}, 'plos')).toBe(true);
    expect(shouldRunPlosAuth({ enable: 'tokenotp' }, {}, 'plos')).toBe(true);
  });

  it('skips extra auth when enable is none', () => {
    expect(shouldRunPlosAuth({ enable: 'none' }, {}, 'plos')).toBe(false);
    expect(shouldRunLandingAuth({ enable: 'none' }, {}, 'plos')).toBe(false);
  });

  it('does not treat missing or default client as PLOS', () => {
    expect(shouldRunPlosAuth({}, {}, 'default')).toBe(false);
    expect(shouldRunPlosAuth({}, {}, undefined)).toBe(false);
    expect(shouldRunPlosAuth({}, {}, '')).toBe(false);
  });

  it('does not run PLOS auth for non-PLOS tokenotp', () => {
    expect(isTokenOtpEnabled({ enable: 'tokenotp' })).toBe(true);
    expect(shouldRunPlosAuth({ enable: 'tokenotp' }, {}, 'oup')).toBe(false);
    expect(shouldRunLandingAuth({ enable: 'tokenotp' }, {}, 'oup')).toBe(false);
  });

  it('skips PLOS auth when temporary access is still valid', () => {
    const created = Date.now() - 30 * 60 * 1000;
    expect(
      shouldRunPlosAuth(
        { temporaryAccess: { $numberLong: String(created) } },
        {},
        'plos'
      )
    ).toBe(false);
  });
});
