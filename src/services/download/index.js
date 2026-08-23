import { WorkflowDownloadService } from './WorkflowDownloadService.js';
import { bindDownloadBridge, unbindDownloadBridge } from './downloadBridge.js';
import { buildDownloadFilesList } from './downloadPayloads.js';

let singleton = null;

export function getDownloadService() {
  if (!singleton) {
    singleton = new WorkflowDownloadService();
    bindDownloadBridge(singleton);
  }
  return singleton;
}

export async function initDownloadService() {
  const service = getDownloadService();
  await service.Init();
  return service;
}

export function downloadClick(action, result, options) {
  return getDownloadService().click(action, result, options);
}

export function resetDownloadService() {
  singleton = null;
  unbindDownloadBridge();
}

export {
  WorkflowDownloadService,
  bindDownloadBridge,
  buildDownloadFilesList
};

export { DOWNLOAD_PDF_ACTIONS, I_RGEN_PDF, I_RGEN_XML } from './downloadConfig.js';

export const downloadService = {
  get instance() {
    return getDownloadService();
  },
  click: (...args) => getDownloadService().click(...args),
  Init: (...args) => getDownloadService().Init(...args),
  zip_download: (...args) => getDownloadService().zip_download(...args)
};

export default downloadService;
