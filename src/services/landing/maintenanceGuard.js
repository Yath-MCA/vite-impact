/**
 * Boot-time maintenance guard (legacy window.MAINTENANCE.Init({ init: true, fire: true })).
 * Reads the legacy global when present, otherwise window.ENV / Vite flags.
 */

function readEnvFlag(windowKey, viteKey) {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[windowKey] !== undefined) {
    return window.ENV[windowKey];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey] !== undefined) {
    return import.meta.env[viteKey];
  }
  return undefined;
}

function toBoolean(value) {
  return value === true || value === 'true' || value === '1';
}

export function initMaintenance({ init = true, fire = true } = {}) {
  if (typeof window !== 'undefined' && window.MAINTENANCE && typeof window.MAINTENANCE.Init === 'function') {
    window.MAINTENANCE.Init({ init, fire });
  }
  return getMaintenanceState();
}

export function getMaintenanceState() {
  if (typeof window !== 'undefined' && window.MAINTENANCE) {
    const m = window.MAINTENANCE;
    const active = Boolean(m.ON || m.ON);
    const blocking = active && m.BLOCK !== false && m.BLOCK !== false;
    return {
      active,
      blocking,
      start: String(m.START || m.START || '')
    };
  }

  const on = toBoolean(readEnvFlag('MAINTENANCE_ON', 'VITE_MAINTENANCE_ON'));
  const blockRaw = readEnvFlag('MAINTENANCE_BLOCK', 'VITE_MAINTENANCE_BLOCK');
  const blocking = blockRaw === undefined ? on : toBoolean(blockRaw);
  return {
    active: on,
    blocking: on && blocking,
    start: String(readEnvFlag('MAINTENANCE_START', 'VITE_MAINTENANCE_START') || '')
  };
}

export function shouldBlockForMaintenance() {
  const state = getMaintenanceState();
  return Boolean(state.active && state.blocking);
}
