import { describe, it, expect } from 'vitest';
import {
  isTokenOtpEnabled,
  shouldRunLandingAuth,
  shouldRunPlosAuth
} from '../../../src/features/landing/landingAccess.js';

describe('landingAccess auth gates', () => {
  it('runs PLOS auth for plos clients', () => {
    expect(shouldRunPlosAuth({ enable: 'tokenotp' }, {}, 'plos')).toBe(true);
  });

  it('runs token OTP for non-PLOS clients when enable=tokenotp', () => {
    expect(isTokenOtpEnabled({ enable: 'tokenotp' })).toBe(true);
    expect(shouldRunLandingAuth({ enable: 'tokenotp' }, {}, 'oup')).toBe(true);
  });

  it('skips extra auth when enable is none', () => {
    expect(shouldRunLandingAuth({ enable: 'none' }, {}, 'plos')).toBe(false);
  });
});
