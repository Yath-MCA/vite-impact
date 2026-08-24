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
import { FileUploadService, sanitizeAttachmentData } from '../../../src/services/upload/fileUploadService.js';

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

  it('rejects a single file over 100MB and aborts the whole upload (fixes legacy partial-upload bug)', async () => {
    const service = new FileUploadService();
    const result = await service.makeRequest([makeFile('ok.png', 10), makeFile('big.png', 101 * 1024 * 1024)]);
    expect(result).toBeNull();
    expect(showEditorMessage).toHaveBeenCalledWith('upload_file_too_big');
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('rejects a total over 500MB, suppressing the toast (not the block) when subfolder is images', async () => {
    const service = new FileUploadService();
    const files = Array.from({ length: 6 }, (_, i) => makeFile(`f${i}.png`, 90 * 1024 * 1024));

    const blocked = await service.makeRequest(files, {});
    expect(blocked).toBeNull();
    expect(showEditorMessage).toHaveBeenCalledWith('upload_size_big');

    showEditorMessage.mockClear();
    apiService.makeRequest.mockClear();
    const blockedImages = await service.makeRequest(files, { subfolder: 'images' });
    expect(blockedImages).toBeNull();
    expect(showEditorMessage).not.toHaveBeenCalled();
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('posts with an explicit multipart Content-Type header', async () => {
    const service = new FileUploadService();
    await service.makeRequest([makeFile('a.png', 10)]);
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/filesuploadmultiple',
      null,
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' })
      })
    );
  });

  it('appends file_sn/file_on/ext as repeated fields, not a JSON string', async () => {
    const service = new FileUploadService();
    await service.makeRequest([makeFile('a.png', 10)], {
      file_sn: ['a.png', ''],
      file_on: ['Original A', 'Original B'],
      ext: ['', 'gif']
    });
    const formData = apiService.makeRequest.mock.calls[0][2].rawBody;
    expect(formData.getAll('file_sn')).toEqual(['a.png']);
    expect(formData.getAll('file_on')).toEqual(['Original A']);
    expect(formData.getAll('ext')).toEqual(['png']);
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

  describe('sanitizeAttachmentData', () => {
    it('returns {} when none of file_sn/file_on/ext are passed', () => {
      expect(sanitizeAttachmentData({ tbl: 'Usernotes' })).toEqual({});
    });

    it('drops empty file_sn, pairs file_on by cleaned index, derives ext from sn', () => {
      const result = sanitizeAttachmentData({
        file_sn: ['a.png', '', 'b'],
        file_on: ['A', 'B', 'C'],
        ext: ['png', 'gif', '']
      });
      expect(result).toEqual({
        file_sn: ['a.png', 'b'],
        file_on: ['A', 'C'],
        ext: ['png', '']
      });
    });
  });
});
