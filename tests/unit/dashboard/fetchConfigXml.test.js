import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAxiosGet = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    get: mockAxiosGet
  }
}));

describe('fetchConfigXml', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset();
  });

  it('reuses one in-flight axios request for the same path', async () => {
    mockAxiosGet.mockResolvedValue({ status: 200, data: '<root />' });

    const { fetchConfigXml } = await import('../../../src/features/dashboard/config-manager/fetchConfigXml.js');
    const first = fetchConfigXml('/config.xml');
    const second = fetchConfigXml('/config.xml');

    expect(first).toBe(second);
    await expect(first).resolves.toEqual({ ok: true, status: 200, text: '<root />' });
    expect(mockAxiosGet).toHaveBeenCalledTimes(1);
  });

  it('returns an empty text result for non-2xx responses', async () => {
    mockAxiosGet.mockResolvedValue({ status: 404, data: '<missing />' });

    const { fetchConfigXml } = await import('../../../src/features/dashboard/config-manager/fetchConfigXml.js');
    await expect(fetchConfigXml('/missing.xml')).resolves.toEqual({ ok: false, status: 404, text: '' });
  });
});
