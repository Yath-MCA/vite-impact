import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { getDefaultDocBag, isLocalHost } from '../error/errorContext.js';
import { showEditorMessage } from '../../features/editor/messages/editorMessages.js';

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

/** Drop empty file_sn; pair file_on with it; derive ext from sn when missing. */
export function sanitizeFileArrays(fileSn = [], fileOn = [], ext = []) {
  const sanitized = { file_sn: [], file_on: [], ext: [] };
  fileSn.forEach((sn, index) => {
    if (!sn) return;
    sanitized.file_sn.push(sn);
    sanitized.file_on.push(fileOn[index] || '');
    const derivedExt = ext[index] || (String(sn).includes('.') ? String(sn).split('.').pop() : '');
    sanitized.ext.push(derivedExt);
  });
  return sanitized;
}

function totalBytes(fileList) {
  return fileList.reduce((sum, file) => sum + (file?.size || 0), 0);
}

export class FileUploadService {
  constructor({ endpoint = API_ENDPOINTS.UPLOAD_MULTI } = {}) {
    this.endpoint = endpoint;
    this._inFlightUploadPromise = null;
  }

  buildFormData(fileList, customData = {}) {
    const formData = new FormData();
    fileList.forEach((file, index) => formData.append(`file_${index}`, file));

    const { file_sn = [], file_on = [], ext = [], ...rest } = customData;
    const sanitized = sanitizeFileArrays(file_sn, file_on, ext);
    const bag = getDefaultDocBag({ stripAcl: true });

    const fields = {
      ...bag,
      ...rest,
      tbl: 'Usernotes',
      optional: 1,
      status: '0',
      file_sn: sanitized.file_sn,
      file_on: sanitized.file_on,
      ext: sanitized.ext
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined) return;
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });

    if (isLocalHost()) {
      console.log(Object.fromEntries(formData.entries()));
    }

    return formData;
  }

  async postFormData(formData) {
    try {
      return await apiService.makeRequest(this.endpoint, null, {
        rawBody: formData,
        headers: { 'Content-Type': undefined }
      });
    } catch (err) {
      console.error('File upload failed:', err);
      return null;
    }
  }

  async makeRequest(files, customData = {}) {
    if (this._inFlightUploadPromise) return this._inFlightUploadPromise;

    const fileList = Array.from(files || []);
    if (!fileList.length) return null;

    if (fileList.some((file) => (file?.size || 0) > MAX_FILE_BYTES)) {
      showEditorMessage('upload_file_too_big');
      return null;
    }

    if (totalBytes(fileList) > MAX_TOTAL_BYTES) {
      if (customData.subfolder !== 'images') {
        showEditorMessage('upload_size_big');
      }
      return null;
    }

    const formData = this.buildFormData(fileList, customData);
    this._inFlightUploadPromise = this.postFormData(formData).finally(() => {
      this._inFlightUploadPromise = null;
    });

    return this._inFlightUploadPromise;
  }
}

export function createFileUploadService(options) {
  return new FileUploadService(options);
}
