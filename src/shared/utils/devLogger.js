/**
 * Console logger gated to local development — silent everywhere isLocalHost() is false.
 */
import { isLocalHost } from '../../services/session/runtimeFlags.js';

function guard(method) {
  return (...args) => {
    if (isLocalHost()) {
      console[method](...args);
    }
  };
}

export const devLog = {
  log: guard('log'),
  warn: guard('warn'),
  error: guard('error'),
  debug: guard('debug'),
};
