import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startIdleTimeoutWatcher } from '../../../src/services/session/idleTimeout.js';

describe('startIdleTimeoutWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onIdle after timeoutMs with no activity', () => {
    const onIdle = vi.fn();
    startIdleTimeoutWatcher({ timeoutMs: 1000, onIdle });

    vi.advanceTimersByTime(999);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on activity', () => {
    const onIdle = vi.fn();
    startIdleTimeoutWatcher({ timeoutMs: 1000, onIdle });

    vi.advanceTimersByTime(800);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(800);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('stops firing after stop() is called', () => {
    const onIdle = vi.fn();
    const stop = startIdleTimeoutWatcher({ timeoutMs: 1000, onIdle });

    stop();
    vi.advanceTimersByTime(2000);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('does nothing and returns a no-op when onIdle is not a function', () => {
    const stop = startIdleTimeoutWatcher({ timeoutMs: 1000 });
    expect(() => stop()).not.toThrow();
    vi.advanceTimersByTime(2000);
  });
});
