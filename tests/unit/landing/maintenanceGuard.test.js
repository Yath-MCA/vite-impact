import { describe, it, expect, afterEach } from 'vitest';
import {
  getMaintenanceState,
  initMaintenance,
  shouldBlockForMaintenance
} from '../../../src/services/landing/maintenanceGuard.js';

describe('maintenanceGuard', () => {
  afterEach(() => {
    delete window.MAINTENANCE;
    if (window.ENV) {
      delete window.ENV.MAINTENANCE_ON;
      delete window.ENV.MAINTENANCE_BLOCK;
      delete window.ENV.MAINTENANCE_START;
    }
  });

  it('blocks when the legacy MAINTENANCE global is ON', () => {
    window.MAINTENANCE = {
      ON: true,
      START: '2026-08-23T10:00:00Z',
      Init: () => {}
    };
    initMaintenance();
    expect(getMaintenanceState().active).toBe(true);
    expect(shouldBlockForMaintenance()).toBe(true);
    expect(getMaintenanceState().start).toBe('2026-08-23T10:00:00Z');
  });

  it('does not block when MAINTENANCE is absent', () => {
    expect(shouldBlockForMaintenance()).toBe(false);
  });
});
