import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAxiosGet = vi.hoisted(() => vi.fn());
const mockAxiosPost = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost
  }
}));

vi.mock('../../../src/services/session/sessionConfig.js', () => ({
  sessionConfig: {
    sessionServiceApiBase: 'http://session.example.test'
  }
}));

describe('sessionServiceClient', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset();
    mockAxiosPost.mockReset();
  });

  it('returns ok data for successful POST responses', async () => {
    mockAxiosPost.mockResolvedValue({ status: 200, data: { owner: 'AU' } });

    const { openSession } = await import('../../../src/services/session/sessionServiceClient.js');
    const result = await openSession('DOC123', { mode: 'edit', userId: 'user1', clientName: 'LWW' });

    expect(result).toEqual({ ok: true, data: { owner: 'AU' } });
    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://session.example.test/api/session/DOC123/open',
      { mode: 'edit', userId: 'user1', clientName: 'LWW' },
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
        validateStatus: expect.any(Function)
      })
    );
  });

  it('returns null data for accepted or empty POST responses', async () => {
    mockAxiosPost.mockResolvedValue({ status: 202, data: { ignored: true } });

    const { sendHeartbeat } = await import('../../../src/services/session/sessionServiceClient.js');
    const result = await sendHeartbeat('DOC123', 'user1');

    expect(result).toEqual({ ok: true, data: null });
  });

  it('returns status and server message for non-2xx POST responses', async () => {
    mockAxiosPost.mockResolvedValue({ status: 409, data: { message: 'Locked by another user.' } });

    const { requestAccess } = await import('../../../src/services/session/sessionServiceClient.js');
    const result = await requestAccess('DOC123', 'user2');

    expect(result).toEqual({ ok: false, status: 409, message: 'Locked by another user.' });
  });

  it('returns unreachable message for network failures', async () => {
    mockAxiosGet.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const { getSessionHistory } = await import('../../../src/services/session/sessionServiceClient.js');
    const result = await getSessionHistory('DOC123');

    expect(result).toEqual({ ok: false, message: 'Session service unreachable.' });
  });
});
