import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    makeRequest: vi.fn().mockResolvedValue({ r: 1 })
  },
  API_ENDPOINTS: {
    UPLOAD_MULTI: '/api/filesuploadmultiple'
  }
}));

vi.mock('../../../src/features/editor/messages/editorMessages.js', () => ({
  showEditorMessage: vi.fn().mockResolvedValue({ isConfirmed: true })
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { showEditorMessage } from '../../../src/features/editor/messages/editorMessages.js';
import { FileUploadService, sanitizeFileArrays } from '../../../src/services/upload/fileUploadService.js';

function makeFile(name, sizeBytes) {
  const file = new File([new Uint8Array(1)], name);
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function installWindowState() {
  window.SHARED_KEY = { client: 'LWW', docid: 'DOC1', projectname: 'SampleArticle' };
  window.DOC_ID = 'DOC1';
  window.USER_INFO = { MAIL_ID: 'user@example.com', ROLE_ID: 'CE01' };
}

describe('fileUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindowState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects a single file over 100MB without calling the API', async () => {
    const service = new FileUploadService();
    const result = await service.makeRequest([makeFile('big.png', 101 * 1024 * 1024)]);
    expect(result).toBeNull();
    expect(showEditorMessage).toHaveBeenCalledWith('upload_file_too_big');
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('reuses the in-flight request while one is pending, calling the API only once', async () => {
    let resolveRequest;
    apiService.makeRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const service = new FileUploadService();
    const first = service.makeRequest([makeFile('a.png', 10)]);
    const second = service.makeRequest([makeFile('b.png', 10)]);

    resolveRequest({ r: 1 });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(apiService.makeRequest).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual({ r: 1 });
    expect(secondResult).toEqual({ r: 1 });
  });

  it('sanitizes file_sn/file_on/ext by dropping empty entries and deriving ext', () => {
    const result = sanitizeFileArrays(['a.png', '', 'b'], ['A', 'B', 'C'], ['png', 'gif', '']);
    expect(result).toEqual({
      file_sn: ['a.png', 'b'],
      file_on: ['A', 'C'],
      ext: ['png', '']
    });
  });
});
