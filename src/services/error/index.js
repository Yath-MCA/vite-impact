import { bindErrorBridge, unbindErrorBridge } from './errorBridge.js';
import { errorLogTrace, resetErrorLogTraceState } from './errorLogTrace.js';
import { resetErrorMailState, shareErrorMail } from './errorMailService.js';
import { initUserActionSync, userActionService } from '../user-action/index.js';

export function initErrorOps() {
  bindErrorBridge();
  // Tracker store: singleton auto-loads from localStorage on import (src/error/errorTrackerStore.js)
  userActionService.load();
  initUserActionSync();
}

export function resetErrorOps() {
  unbindErrorBridge();
  resetErrorLogTraceState();
  resetErrorMailState();
}

export {
  bindErrorBridge,
  unbindErrorBridge,
  errorLogTrace,
  shareErrorMail
};

export const errorOps = {
  init: initErrorOps,
  errorLogTrace,
  shareErrorMail
};

export default errorOps;
