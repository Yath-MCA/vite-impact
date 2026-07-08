import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAxiosRequest = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    request: mockAxiosRequest
  }
}));

describe('apiService', () => {
  beforeEach(() => {
    mockAxiosRequest.mockReset();
    vi.stubGlobal('window', {
      location: { href: 'http://localhost/' },
      ENV: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  it('uses axios for form-encoded requests and returns response data', async () => {
    mockAxiosRequest.mockResolvedValue({ data: { success: true } });

    const { apiService } = await import('../../../src/services/api/apiService');
    const result = await apiService.makeRequest('test-endpoint', { foo: 'bar' }, { isPayloadLogic: true });

    expect(mockAxiosRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: '/api/test-endpoint',
      data: expect.stringContaining('jsondata='),
      headers: expect.objectContaining({
        appkey: '',
        apikey: ''
      })
    }));
    expect(result).toEqual({ success: true });
  });
});
