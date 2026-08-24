import { createUserActionService } from './userActionService.js';

export const userActionService = createUserActionService();

export const trackDialogOpenClose = (...args) => userActionService.trackDialogOpenClose(...args);
export const trackAttachmentsFlow = (...args) => userActionService.trackAttachmentsFlow(...args);
export const trackSuppFileWorkflow = (...args) => userActionService.trackSuppFileWorkflow(...args);

let unloadBound = false;

function handleUnload() {
  userActionService.syncUserActionHistory({ keepalive: true }).catch(() => {});
}

export function initUserActionSync() {
  if (unloadBound || typeof window === 'undefined') return;
  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);
  unloadBound = true;
}

export function resetUserActionSync() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
  }
  unloadBound = false;
}

export { createUserActionService };

export default userActionService;
