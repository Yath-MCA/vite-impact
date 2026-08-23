import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: { makeRequest: vi.fn() },
  API_ENDPOINTS: { GET_DOCS: '/getdocs' }
}));

vi.mock('../../../src/services/alerts/showAlertMessage.js', () => ({
  showAlertMessage: vi.fn().mockResolvedValue({ isConfirmed: false })
}));

vi.mock('sweetalert2', () => ({
  default: {
    mixin: () => ({
      fire: vi.fn().mockResolvedValue({})
    })
  }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import {
  checkMaintenanceDb,
  fireMaintenanceAlert,
  getMaintenanceState,
  initMaintenance,
  resetMaintenanceState
} from '../../../src/services/landing/maintenanceGuard.js';
import { persistMaintenanceStart } from '../../../src/services/session/sessionStorage.js';
import { SESSION_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

const HOUR = 60 * 60 * 1000;

describe('maintenanceGuard', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    resetMaintenanceState();
    apiService.makeRequest.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetMaintenanceState();
  });

  it('upcoming window sets ON, formats times, and hides alert until ALERT_START', async () => {
    vi.useFakeTimers({ now: new Date('2026-08-01T12:00:00Z') });
    const start = Date.now() + 72 * HOUR;
    const end = start + 2 * HOUR;

    await initMaintenance({ start, end });
    const state = getMaintenanceState();

    expect(state.ON).toBe(true);
    expect(state.START).toBe(start);
    expect(state.END).toBe(end);
    expect(state.T1).toMatch(/\d{2}-[A-Z][a-z]{2}-\d{4} \d{1,2}:\d{2}/);
    expect(state.T2).toMatch(/\d{2}-[A-Z][a-z]{2}-\d{4} \d{1,2}:\d{2}/);
    expect(state.T1A).toMatch(/AM|PM/);
    expect(state.T2A).toMatch(/AM|PM/);
    expect(state.canShowAlert).toBe(false);
    expect(fireMaintenanceAlert()).toBe(false);

    vi.setSystemTime(start - 48 * HOUR);
    expect(getMaintenanceState().canShowAlert).toBe(true);
  });

  it('past window sets ON false', async () => {
    const start = Date.now() - 3 * HOUR;
    const end = Date.now() - HOUR;
    await initMaintenance({ start, end });
    expect(getMaintenanceState().ON).toBe(false);
    expect(fireMaintenanceAlert()).toBe(false);
  });

  it('getdocs row with $numberLong start/end initializes the window', async () => {
    const start = Date.now() + 3 * HOUR;
    const end = start + HOUR;
    apiService.makeRequest.mockResolvedValueOnce({
      data: [
        {
          starttime: { $numberLong: String(start) },
          endtime: { $numberLong: String(end) }
        }
      ]
    });

    await initMaintenance({ init: true });
    const payload = apiService.makeRequest.mock.calls[0][1];
    expect(payload.tbl).toBe('ServerMaintenance');
    expect(payload.length).toBe(1);
    expect(payload.find.status).toBe('active');
    expect(payload.sort.starttime).toBe(1);

    const state = getMaintenanceState();
    expect(state.ON).toBe(true);
    expect(state.START).toBe(start);
    expect(state.END).toBe(end);
  });

  it('fire returns HTML when returnText is true and the alert window is open', async () => {
    const start = Date.now() + 2 * HOUR;
    const end = start + HOUR;
    await initMaintenance({ start, end });
    const html = fireMaintenanceAlert({ returnText: true });
    expect(typeof html).toBe('string');
    expect(html).toContain(getMaintenanceState().T1);
    expect(html).toContain(getMaintenanceState().T2);
    expect(() => fireMaintenanceAlert()).not.toThrow();
  });

  it('persistMaintenanceStart writes numeric START when ON', async () => {
    const start = Date.now() + 2 * HOUR;
    await initMaintenance({ start, end: start + HOUR });
    expect(persistMaintenanceStart()).toBe(true);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.MAINTENANCE_START)).toBe(String(start));
  });

  it('persistMaintenanceStart skips when ON is false', () => {
    expect(persistMaintenanceStart()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.MAINTENANCE_START)).toBeNull();
  });

  it('checkMaintenanceDb turns OFF when no row is returned', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });
    await checkMaintenanceDb();
    expect(getMaintenanceState().ON).toBe(false);
  });
});
