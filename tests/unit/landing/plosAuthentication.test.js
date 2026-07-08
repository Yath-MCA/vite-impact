import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: { makeRequest: vi.fn() },
  API_ENDPOINTS: {
    VERIFY_CAPTCHA: '/verifycaptcha',
    GENERATE_OTP: '/generatetokenotpandsendemail',
    VERIFY_ACCESS_CODE: '/verifyaccesscode'
  }
}));

vi.mock('../../../src/plugins/sweetalert/index.js', () => ({
  Swal: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: false }),
    isVisible: vi.fn().mockReturnValue(false),
    close: vi.fn(),
    showLoading: vi.fn()
  }
}));

import { maskEmail, AuthenticationFlow } from '../../../src/features/landing/plos/authenticationFlow.js';

describe('PLOS authenticationFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maskEmail obscures local and domain parts', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j******e@e******.com');
  });

  it('selects OTP flow when r === 2', () => {
    const flow = new AuthenticationFlow({ r: 2, docid: 'DOC1' });
    expect(flow.currentFlow).toBe('otp');
  });

  it('selects IP/captcha flow when r !== 2', () => {
    const flow = new AuthenticationFlow({ r: 1, docid: 'DOC1' });
    expect(flow.currentFlow).toBe('ip');
  });

  it('run returns failed when r === 0', async () => {
    const flow = new AuthenticationFlow({ r: 0, docid: 'DOC1' });
    const result = await flow.run();
    expect(result.status).toBe('failed');
    expect(result.reason).toBe('access_denied');
  });

  it('run returns failed when OTP flow is cancelled', async () => {
    const flow = new AuthenticationFlow({ r: 2, docid: 'DOC1', emailto: 'a@b.com' });
    const result = await flow.run();
    expect(result.status).toBe('failed');
    expect(result.reason).toBe('otp_failed');
  });
});
