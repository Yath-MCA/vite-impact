import { API_ENDPOINTS } from '../api/apiService.js';
import { DOWNLOAD_APP_KEY } from './downloadConfig.js';
import {
  getDocId,
  getSharedKey,
  lastSegment,
  safeProjectName
} from './downloadContext.js';

export function buildDownloadFilesList(downloadToLocal = false, ctx = {}) {
  const docId = ctx.docId ?? getDocId();
  const projectName = ctx.projectName ?? safeProjectName(ctx.sharedKey || getSharedKey());
  const cePdf = projectName ? `${projectName}.pdf` : '';
  const local = downloadToLocal
    ? `,${docId}_updated.html,${docId}.html,pagemap.json`
    : '';
  return `${docId}_updated_Tracking.xml,${docId}_updated_parsingerror.xml,${docId}_updated.xml,${docId}_updated_correction.pdf,${cePdf + local}`;
}

export function buildFileDownloadUrl({ tempFile, folderId, reNameFile }) {
  const base = API_ENDPOINTS.FILE_DOWNLOAD;
  const params = new URLSearchParams({
    appkey: DOWNLOAD_APP_KEY,
    file_sn: String(tempFile || ''),
    docid: String(folderId || ''),
    file_on: String(reNameFile || '')
  });
  return `${base}?${params.toString()}`;
}

export function buildProjectInfoQuery(docId = getDocId()) {
  return {
    tbl: 'Fileslist',
    find: {
      status: 'active',
      docid: docId,
      projectname: { $exists: true }
    },
    length: 1,
    sort: {},
    filter: ['projectname', 'id', 'status', 'dtd', 'client', 'type']
  };
}

export function buildZipPayload(type, option = {}, ctx = {}) {
  const docId = ctx.docId ?? getDocId();
  const shared = ctx.sharedKey || getSharedKey();
  const packageName = lastSegment(shared.identifier);
  const projectName = safeProjectName(shared) || packageName;
  const filesList = option.list || buildDownloadFilesList(type === 'local', { docId, projectName, sharedKey: shared });
  const name = option.name || projectName;

  const jsonData = {
    tbl: 'Fileslist',
    renamefile: '',
    name,
    projectname: projectName,
    docid: docId,
    fileslist: filesList
  };

  if (type === 'package' || type === 'local') {
    jsonData.dirlist = 'images,supporting,attachments';
  } else if (option.org_name_list) {
    jsonData.tbl = 'Usernotes';
    jsonData.dirlist = 'attachments';
    jsonData.orgnamelist = option.org_name_list;
  }

  if (option.dirlist) {
    jsonData.dirlist = option.dirlist;
  } else if (!jsonData.dirlist) {
    jsonData.dirlist = '';
  }

  return jsonData;
}

export function buildDownloadRecordPayload(clickElm, result, ctx = {}) {
  return {
    tbl: 'UserPreference',
    docid: ctx.docId ?? getDocId(),
    downloadstatus: result,
    pdftype: clickElm,
    page: ctx.isTrackView ? 'trackview' : 'editor',
    recordtype: 'pdf_download'
  };
}

export function extractProjectNameFromDocs(response) {
  const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  const row = rows[0];
  return row?.projectname || '';
}
