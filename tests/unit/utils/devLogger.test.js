import { describe, it, expect, vi, afterEach } from 'vitest';
import { devLog } from '../../../src/shared/utils/devLogger.js';
import * as runtimeFlags from '../../../src/services/session/runtimeFlags.js';

describe('devLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints when isLocalHost() is true', () => {
    vi.spyOn(runtimeFlags, 'isLocalHost').mockReturnValue(true);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog.log('hello');
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('stays silent when isLocalHost() is false', () => {
    vi.spyOn(runtimeFlags, 'isLocalHost').mockReturnValue(false);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog.log('hello');
    expect(spy).not.toHaveBeenCalled();
  });

  it('gates warn, error, and debug the same way', () => {
    vi.spyOn(runtimeFlags, 'isLocalHost').mockReturnValue(false);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    devLog.warn('w');
    devLog.error('e');
    devLog.debug('d');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });
});
