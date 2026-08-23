import { WorkflowDownloadService } from './WorkflowDownloadService.js';

export function bindDownloadBridge(service, target = typeof window !== 'undefined' ? window : null) {
  if (!target || !service) return;
  target.WorkflowDownloadModule = WorkflowDownloadService;
  target.iDownloadMethod = service;
}

export function unbindDownloadBridge(target = typeof window !== 'undefined' ? window : null) {
  if (!target) return;
  delete target.WorkflowDownloadModule;
  delete target.iDownloadMethod;
}
