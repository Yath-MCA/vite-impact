import { errorLogTrace } from './errorLogTrace.js';

export function bindErrorBridge(target = typeof window !== 'undefined' ? window : null) {
  if (!target) return;
  target.ErrorLogTrace = errorLogTrace;
}

export function unbindErrorBridge(target = typeof window !== 'undefined' ? window : null) {
  if (!target) return;
  delete target.ErrorLogTrace;
}
