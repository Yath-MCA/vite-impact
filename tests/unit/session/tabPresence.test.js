import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';
import {
  LOCAL_STORAGE_KEYS,
  SESSION_STORAGE_KEYS,
  TAB_PRESENCE
} from '../../../src/services/session/sessionConstants.js';

class MockBroadcastChannel {
  static channels = new Map();

  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this._listeners = new Set();
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name).add(this);
  }

  postMessage(data) {
    const peers = MockBroadcastChannel.channels.get(this.name) || new Set();
    for (const peer of peers) {
      if (peer === this) continue;
      const event = { data };
      peer._listeners.forEach((fn) => fn(event));
      if (typeof peer.onmessage === 'function') peer.onmessage(event);
    }
  }

  addEventListener(type, fn) {
    if (type === 'message') this._listeners.add(fn);
  }

  removeEventListener(type, fn) {
    if (type === 'message') this._listeners.delete(fn);
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }

  static reset() {
    MockBroadcastChannel.channels.clear();
  }
}

describe('tabPresence claimValidateTab', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    MockBroadcastChannel.reset();
    globalThis.BroadcastChannel = MockBroadcastChannel;
    vi.useFakeTimers();
  });

  afterEach(async () => {
    const { __resetTabPresenceForTests } = await import(
      '../../../src/services/session/tabPresence.js'
    );
    __resetTabPresenceForTests();
    vi.useRealTimers();
    vi.resetModules();
  });

  async function loadApi() {
    return import('../../../src/services/session/tabPresence.js');
  }

  function lockStorageKey(docId) {
    return `${LOCAL_STORAGE_KEYS.TAB_LOCK_PREFIX}${docId}`;
  }

  it('fresh claim succeeds and writes lock', async () => {
    const { claimValidateTab, ensureLandingTabId } = await loadApi();
    const tabId = ensureLandingTabId();

    const pending = claimValidateTab({ docId: 'DOC1', key: 'k1' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    const result = await pending;

    expect(result).toEqual({ ok: true });
    const raw = localStorage.getItem(lockStorageKey('DOC1'));
    expect(raw).toBeTruthy();
    const lock = JSON.parse(raw);
    expect(lock.tabId).toBe(tabId);
    expect(lock.key).toBe('k1');
  });

  it('second tab with live lock is occupied', async () => {
    const { claimValidateTab } = await loadApi();
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'tab-a');

    localStorage.setItem(
      lockStorageKey('DOC1'),
      JSON.stringify({
        tabId: 'tab-other',
        key: 'k1',
        ts: Date.now(),
        heartbeat: Date.now()
      })
    );

    const pending = claimValidateTab({ docId: 'DOC1', key: 'k1' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    const result = await pending;

    expect(result).toEqual({ ok: false, reason: 'occupied' });
  });

  it('stale heartbeat allows re-claim', async () => {
    const { claimValidateTab, ensureLandingTabId } = await loadApi();
    const tabId = ensureLandingTabId();
    const stale = Date.now() - TAB_PRESENCE.STALE_TTL_MS - 1000;

    localStorage.setItem(
      lockStorageKey('DOC1'),
      JSON.stringify({
        tabId: 'dead-tab',
        key: 'k1',
        ts: stale,
        heartbeat: stale
      })
    );

    const pending = claimValidateTab({ docId: 'DOC1', key: 'k1' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    const result = await pending;

    expect(result.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem(lockStorageKey('DOC1'))).tabId).toBe(tabId);
  });

  it('releaseValidateTab frees lock for next claim', async () => {
    const api = await loadApi();
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'owner');

    const first = api.claimValidateTab({ docId: 'DOC9', key: 'kx' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await first).ok).toBe(true);

    api.releaseValidateTab({ docId: 'DOC9' });
    expect(localStorage.getItem(lockStorageKey('DOC9'))).toBeNull();

    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'next-tab');
    api.__resetTabPresenceForTests();

    // Re-import after reset still shares module; re-set listeners cleanly by claim
    const second = api.claimValidateTab({ docId: 'DOC9', key: 'kx' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await second).ok).toBe(true);
  });

  it('editor-held live lock blocks second-tab validate claim', async () => {
    const api = await loadApi();
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'editor-tab');

    const editorClaim = api.claimValidateTab({ docId: 'DOC-ED', key: 'access-abc' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await editorClaim).ok).toBe(true);

    // Simulate another tab: new tab id + clear in-memory presence; keep LS heartbeat lock
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'validate-tab');
    api.__resetTabPresenceForTests();

    const validateClaim = api.claimValidateTab({ docId: 'DOC-ED', key: 'access-abc' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect(await validateClaim).toEqual({ ok: false, reason: 'occupied' });
  });

  it('renew with empty key preserves existing lock key', async () => {
    const api = await loadApi();
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'same-tab');

    const first = api.claimValidateTab({ docId: 'DOC-K', key: 'keep-me' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await first).ok).toBe(true);

    const renew = api.claimValidateTab({ docId: 'DOC-K', key: '' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await renew).ok).toBe(true);
    expect(JSON.parse(localStorage.getItem(lockStorageKey('DOC-K'))).key).toBe('keep-me');
  });

  it('owner answers BroadcastChannel probe for same validate key', async () => {
    const api = await loadApi();
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'editor-tab');

    const claim = api.claimValidateTab({ docId: 'DOC1', key: 'shared-key' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await claim).ok).toBe(true);

    const replies = [];
    const peer = new MockBroadcastChannel(TAB_PRESENCE.CHANNEL);
    peer.addEventListener('message', (e) => replies.push(e.data));

    peer.postMessage({
      type: 'probe',
      docId: 'OTHER-DOC',
      key: 'shared-key',
      tabId: 'validate-tab'
    });

    expect(
      replies.some(
        (r) => r.type === 'occupied' && r.requestTabId === 'validate-tab' && r.key === 'shared-key'
      )
    ).toBe(true);
  });

  it('stale editor lock is reclaimable by validate tab', async () => {
    const api = await loadApi();
    sessionStorage.setItem(SESSION_STORAGE_KEYS.LANDING_TAB_ID, 'validate-tab');
    const stale = Date.now() - TAB_PRESENCE.STALE_TTL_MS - 500;

    localStorage.setItem(
      lockStorageKey('DOC-STALE'),
      JSON.stringify({
        tabId: 'editor-gone',
        key: 'access-old',
        ts: stale,
        heartbeat: stale
      })
    );

    const pending = api.claimValidateTab({ docId: 'DOC-STALE', key: 'access-old' });
    await vi.advanceTimersByTimeAsync(TAB_PRESENCE.PROBE_WAIT_MS);
    expect((await pending).ok).toBe(true);
  });
});
