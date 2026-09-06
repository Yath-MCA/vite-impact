import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAxiosHead = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    head: mockAxiosHead
  }
}));

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    makeRequest: vi.fn().mockResolvedValue({ r: 1, zippath: 'DOC123/out.zip' }),
    getDocs: vi.fn().mockResolvedValue({ data: [{ projectname: 'SampleArticle' }] })
  },
  API_ENDPOINTS: {
    FILE_DOWNLOAD: '/api/filedownload',
    ZIP_DOWNLOAD: '/api/zipfileswithdiranddownload',
    UPDATE_INSERT: '/api/updateorinsert',
    GET_DOCS: '/api/getdocs'
  }
}));

vi.mock('../../../src/features/editor/messages/editorMessages.js', () => ({
  showEditorMessage: vi.fn().mockResolvedValue({ isConfirmed: true }),
  getEditorMessage: vi.fn()
}));

import { showEditorMessage } from '../../../src/features/editor/messages/editorMessages.js';
import { buildZipPayload } from '../../../src/services/download/downloadPayloads.js';
import {
  WorkflowDownloadService,
  buildDownloadFilesList,
  getDownloadRequest,
  initDownloadService,
  resetDownloadService
} from '../../../src/services/download/index.js';

function installWindowState({ onLine = true, host } = {}) {
  window.SHARED_KEY = {
    projectname: 'SampleArticle',
    client: 'LWW',
    identifier: 'folder/SampleArticle'
  };
  window.DOC_ID = 'DOC123';
  window.USER_INFO = {
    ROLE_NAME: 'Copy Editor',
    ROLE_ID: 'CE01',
    SELECTOR_BKUP_FOLDER: 'ce_backup'
  };
  window.BUCKET_URL = 'https://cdn.example.com/';
  window.API_PATH = '/api/';
  window.IS_EDITOR_PAGE = true;
  window.IS_TRACK_VIEW = false;
  window.IS_JOURNAL = false;
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => onLine
  });
  if (host) {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { host, pathname: '/editor', href: `http://${host}/editor` }
    });
  }
}

describe('workflow download service', () => {
  beforeEach(() => {
    resetDownloadService();
    vi.clearAllMocks();
    installWindowState();
    mockAxiosHead.mockResolvedValue({ status: 404 });
  });

  afterEach(() => {
    resetDownloadService();
    vi.unstubAllGlobals();
  });

  it('builds the default zip file list with project pdf', () => {
    const list = buildDownloadFilesList(false, {
      docId: 'DOC123',
      projectName: 'SampleArticle'
    });
    expect(list).toContain('DOC123_updated_Tracking.xml');
    expect(list).toContain('DOC123_updated_correction.pdf');
    expect(list).toContain('SampleArticle.pdf');
    expect(list).not.toContain('pagemap.json');
  });

  it('builds a help URL using the default filename', async () => {
    const service = new WorkflowDownloadService();
    const request = await service.buildDownloadRequest('Help_Guide_pdf');
    expect(request.tempfile).toBe('IMPACT_Help_Guide.pdf');
    expect(request.folder_Id).toBe('_SUPPORT_FILES/LWW');
    expect(request.url).toContain('file_sn=IMPACT_Help_Guide.pdf');
    expect(request.filePath).toContain('_SUPPORT_FILES/LWW/IMPACT_Help_Guide.pdf');
  });

  it('builds a UAT help filename when host matches', async () => {
    installWindowState({ host: 'impact-ops-dev.newgen.co:8081' });
    const service = new WorkflowDownloadService();
    const request = await service.buildDownloadRequest('Help_FAQ_pdf');
    expect(request.tempfile).toBe('IMPACT_FAQ_UAT.pdf');
  });

  it('builds workflow paths for track pdf, xml parse error, and ce pdf', () => {
    const service = new WorkflowDownloadService();

    const track = service._buildWorkflowRequest('i_track_pdf');
    expect(track.tempfile).toContain('backup/ce_backup/DOC123_updated_correction.pdf');
    expect(track.reNameFile).toBe('SampleArticle_updated_correction.pdf');

    const xml = service._buildWorkflowRequest('xml', { xmlparsing: true });
    expect(xml.tempfile).toBe('DOC123_updated_parsingerror.xml');
    expect(xml.reNameFile).toBe('SampleArticle.xml');
    expect(xml.key).toContain('parseXML');

    const ce = service._buildWorkflowRequest('ce_track_pdf');
    expect(ce.tempfile).toBe('CE_SampleArticle.pdf');
  });

  it('builds zip payload with package directories', () => {
    const zip = buildZipPayload('package');
    expect(zip.tbl).toBe('Fileslist');
    expect(zip.docid).toBe('DOC123');
    expect(zip.dirlist).toBe('images,supporting,attachments');
    expect(zip.fileslist).toContain('DOC123_updated_Tracking.xml');
  });

  it('returns false from click when offline', async () => {
    installWindowState({ onLine: false });
    const service = new WorkflowDownloadService();
    const ok = await service.click('Help_FAQ_pdf');
    expect(ok).toBe(false);
    expect(showEditorMessage).toHaveBeenCalled();
  });

  it('exposes window.iDownloadMethod after initDownloadService', async () => {
    await initDownloadService();
    expect(window.iDownloadMethod).toBeTruthy();
    expect(typeof window.iDownloadMethod.click).toBe('function');
    expect(window.WorkflowDownloadModule).toBe(WorkflowDownloadService);
  });

  it('exports getDownloadRequest with a resolved help URL', async () => {
    const request = await getDownloadRequest('Help_FAQ_pdf');
    expect(request).toBeTruthy();
    expect(request.url).toContain('file_sn=');
    expect(request.tempfile).toMatch(/^IMPACT_FAQ/);
  });

  it('checks role-based help candidates with axios HEAD requests', async () => {
    mockAxiosHead
      .mockResolvedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ status: 200 });

    const service = new WorkflowDownloadService();
    const request = await service.buildDownloadRequest('Help_Guide_pdf');

    expect(mockAxiosHead).toHaveBeenCalledWith(
      'https://cdn.example.com/_SUPPORT_FILES/LWW/IMPACT_Help_Guide_Copy_Editor.pdf',
      expect.objectContaining({
        validateStatus: expect.any(Function)
      })
    );
    expect(request.tempfile).toBe('IMPACT_Help_Guide_CE01.pdf');
  });
});
