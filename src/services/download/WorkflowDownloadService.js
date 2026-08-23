/**
 * ES module port of legacy WorkflowDownloadModule (Download_Module.js).
 */
import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { moment } from '../../shared/plugins/moment/index.js';
import { triggerBrowserDownload } from '../../shared/utils/triggerBrowserDownload.js';
import {
  DOWNLOAD_CACHE_NAMESPACE,
  DOWNLOAD_PDF_ACTIONS,
  I_RGEN_PDF,
  I_RGEN_XML,
  INIT_RETRY_MS,
  LANDING_POPUP_CLOSE_MS,
  PARSE_ERROR_TOKEN,
  PROJECT_NAME_TIMEOUT_MS,
  SPINNER_TIMEOUT_SEC,
  SPINNER_WATCH_MS,
  SUPPORT_FILES_FOLDER
} from './downloadConfig.js';
import {
  getBucketUrl,
  getDocId,
  getHost,
  getRoleDetails,
  getSharedKey,
  getSupportClientCode,
  getUserInfo,
  getWindowRef,
  isTrackView,
  joinUrl,
  lastSegment,
  logDownloadError,
  safeProjectName
} from './downloadContext.js';
import {
  buildDownloadFilesList,
  buildDownloadRecordPayload,
  buildFileDownloadUrl,
  buildProjectInfoQuery,
  buildZipPayload,
  extractProjectNameFromDocs
} from './downloadPayloads.js';
import { notifyDownload, notifyPopupBlocked } from './downloadAlerts.js';

export class WorkflowDownloadService {
  constructor() {
    this.OptClk = null;
    this.lastURL = null;
    this.errorString = PARSE_ERROR_TOKEN;
    this.history = Object.create(null);
    this.requestCache = Object.create(null);
    this.requestMeta = Object.create(null);
    this.Help_Guide_key = ['Help_Guide_pdf', 'Help_FAQ_pdf', 'Equation_Help_pdf', 'Help_Guide_Cleanup_pdf'];
    this.popUpModule = true;
    this.Ignore_Toaster = null;
    this.StartTimer = null;
    this.percentComplete = null;
    this.cacheNamespace = DOWNLOAD_CACHE_NAMESPACE;
    this.initialized = false;
    this.initPromise = null;
    this.projectNamePromise = null;
    this.preloadedActions = Object.keys(DOWNLOAD_PDF_ACTIONS);
    this.Info = this._buildInfoMap();
  }

  _buildInfoMap() {
    const info = {};
    const client = getSupportClientCode();
    Object.keys(DOWNLOAD_PDF_ACTIONS).forEach((action) => {
      const config = DOWNLOAD_PDF_ACTIONS[action] || {};
      if (config.ignore) return;
      if (config.clienBased && Array.isArray(config.clienBased) && !config.clienBased.includes(client)) {
        return;
      }
      info[action] = {
        menu_id: config.menu_id || '',
        file_suffix: config.file_suffix || '',
        alert: config.alert || null
      };
    });
    return info;
  }

  _isHelpFile(action) {
    return DOWNLOAD_PDF_ACTIONS[action]?.kind === 'help';
  }

  _regenPdf() {
    const win = getWindowRef();
    return win?.I_rGEN_PDF || win?.I_RGEN_PDF || I_RGEN_PDF;
  }

  _regenXml() {
    const win = getWindowRef();
    return win?.I_rGEN_XML || win?.I_RGEN_XML || I_RGEN_XML;
  }

  async _urlExists(url) {
    try {
      if (typeof fetch !== 'function') return false;
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        credentials: 'same-origin'
      });
      return Boolean(response && response.ok);
    } catch (err) {
      logDownloadError('urlExists', err);
      return false;
    }
  }

  async _buildHelpFileRequest(action) {
    const client = getSupportClientCode() || 'COMMON';
    const actionConfig = DOWNLOAD_PDF_ACTIONS[action] || {};
    const host = getHost();
    const baseFileName = actionConfig[host] || actionConfig.default;
    const actionParts = String(action).split('_');
    const displayName = actionParts.map((item) => item.charAt(0).toUpperCase() + item.slice(1));
    const fileExtension = actionParts[actionParts.length - 1].toLowerCase();
    const reNameFile = `IMPACT_${displayName.slice(0, -1).join('_')}.${fileExtension}`;
    const folderId = `${SUPPORT_FILES_FOLDER}/${action === 'Equation_Help_pdf' ? 'COMMON' : client}`;
    const folderUrl = joinUrl(getBucketUrl(), folderId);

    const asRequest = (candidate) => ({
      action,
      filePath: joinUrl(folderUrl, candidate),
      url: buildFileDownloadUrl({ tempFile: candidate, folderId, reNameFile }),
      key: `${getDocId()}_support_${action}`,
      tempfile: candidate,
      reNameFile,
      folder_Id: folderId
    });

    if (!actionConfig.roleBased) {
      return asRequest(baseFileName);
    }

    const { roleName, roleId } = getRoleDetails();
    const split = reNameFile.split('.');
    const baseStem = split[0];
    const ext = split[1];
    const candidates = [];
    if (roleName) candidates.push(`${baseStem}_${roleName}.${ext}`);
    if (roleId) candidates.push(`${baseStem}_${roleId}.${ext}`);
    candidates.push(baseFileName);

    for (const candidate of candidates) {
      const candidateUrl = joinUrl(folderUrl, candidate);
      if (candidate === baseFileName || await this._urlExists(candidateUrl)) {
        return asRequest(candidate);
      }
    }

    return asRequest(baseFileName);
  }

  _buildWorkflowRequest(action, result) {
    const projectName = safeProjectName();
    if (!projectName) return null;

    let tempfile = `${projectName}.pdf`;
    let reNameFile = `${projectName}.pdf`;
    const folder_Id = getDocId();
    let key = `${folder_Id}_`;
    const regenPdf = this._regenPdf();
    const regenXml = this._regenXml();
    const user = getUserInfo();

    if (action === 'ce_track_pdf') {
      tempfile = `CE_${tempfile}`;
      reNameFile = `CE_${reNameFile}`;
      key += 'CEPDF';
    } else if ((regenPdf && String(action).match(regenPdf)) || action === 'package') {
      tempfile = `backup/${user.SELECTOR_BKUP_FOLDER || ''}/${folder_Id}_updated_correction.pdf`;
      reNameFile = `${projectName}_updated_correction.pdf`;
      key += 'trackPDF';
    } else if (action === regenXml || action === 'xml' || action === 'Generate_XML') {
      const isParserErr = Boolean(result && result.xmlparsing);
      tempfile = `${folder_Id}_updated${isParserErr ? '_parsingerror.' : '.'}xml`;
      reNameFile = `${projectName}.xml`;
      key += isParserErr ? 'parseXML' : 'updatedXML';
    } else if (action === 'proof_pdf') {
      key += 'proofPDF';
    }

    return {
      action,
      filePath: `${getBucketUrl()}${folder_Id}/${tempfile}`,
      url: buildFileDownloadUrl({ tempFile: tempfile, folderId: folder_Id, reNameFile }),
      key,
      tempfile,
      reNameFile,
      folder_Id
    };
  }

  async buildDownloadRequest(action, result, options = {}) {
    try {
      return this._isHelpFile(action)
        ? await this._buildHelpFileRequest(action)
        : this._buildWorkflowRequest(action, result, options);
    } catch (err) {
      logDownloadError('buildDownloadRequest', err);
      return null;
    }
  }

  async preloadDownloadRequests() {
    try {
      const actions = this.preloadedActions.filter((action) => {
        const config = DOWNLOAD_PDF_ACTIONS[action];
        return config && config.preload !== false && this.Info[action];
      });
      for (const action of actions) {
        const request = await this.buildDownloadRequest(action, null, {});
        if (request) {
          this.requestCache[action] = request;
          this.requestMeta[action] = { filePath: request.filePath, url: request.url };
        }
      }
    } catch (err) {
      logDownloadError('preloadDownloadRequests', err);
    }
    this.initialized = true;
    return this.requestCache;
  }

  async fetchProjectName() {
    try {
      const existing = safeProjectName();
      if (existing) return existing;
      if (this.projectNamePromise) return this.projectNamePromise;

      this.projectNamePromise = (async () => {
        try {
          const timeout = new Promise((resolve) => {
            setTimeout(() => resolve(''), PROJECT_NAME_TIMEOUT_MS);
          });
          const request = apiService.getDocs(buildProjectInfoQuery()).then((response) => {
            const name = extractProjectNameFromDocs(response);
            if (name) {
              const shared = getSharedKey();
              shared.projectname = name;
              const win = getWindowRef();
              if (win) win.SHARED_KEY = { ...shared, projectname: name };
            }
            return name || safeProjectName();
          });
          return await Promise.race([request, timeout]);
        } catch (err) {
          logDownloadError('fetchProjectName', err);
          return safeProjectName();
        } finally {
          this.projectNamePromise = null;
        }
      })();

      return this.projectNamePromise;
    } catch (err) {
      logDownloadError('fetchProjectName', err);
      this.projectNamePromise = null;
      return '';
    }
  }

  _waitForProjectName() {
    const name = safeProjectName();
    if (name) return Promise.resolve(name);
    if (this.projectNamePromise) return this.projectNamePromise;
    return this.fetchProjectName();
  }

  async Init() {
    try {
      const shared = getSharedKey();
      if (!shared || Object.keys(shared).length === 0) {
        await new Promise((resolve) => setTimeout(resolve, INIT_RETRY_MS));
        return this.Init();
      }
      if (this.initPromise) return this.initPromise;
      this.initPromise = (async () => {
        this.Info = this._buildInfoMap();
        const workflowActions = this.preloadedActions.filter(
          (action) => DOWNLOAD_PDF_ACTIONS[action]?.kind === 'workflow'
        );
        if (workflowActions.length && !safeProjectName()) {
          await this._waitForProjectName();
        }
        return this.preloadDownloadRequests();
      })();
      return this.initPromise;
    } catch (err) {
      logDownloadError('Init', err);
      this.initialized = true;
      return this.requestCache;
    }
  }

  async ensureInitialized() {
    if (!this.initPromise) {
      this.Init();
    }
    return this.initPromise;
  }

  async getDownloadRequest(action, result, options = {}) {
    try {
      await this.ensureInitialized();
      if (this.requestCache[action]) return this.requestCache[action];
      const request = await this.buildDownloadRequest(action, result, options);
      if (request) this.requestCache[action] = request;
      return request;
    } catch (err) {
      logDownloadError('getDownloadRequest', err);
      return null;
    }
  }

  changeSpinnerState(elm, isShow = false, response = {}) {
    try {
      let target = elm;
      if (typeof target === 'string') {
        const info = this.Info[target];
        target = info?.menu_id ? document.getElementById(info.menu_id) : null;
      }
      if (typeof target === 'undefined') {
        target = document.querySelector('.spinner-show');
      }
      if (!target) return;
      target.classList[isShow ? 'add' : 'remove']('spinner-show');
      target.classList[isShow ? 'remove' : 'add']('spinner-hide');
      if (isShow) target.setAttribute('timeStamp', String(Date.now()));
      else target.removeAttribute('timeStamp');
      if (!isShow) return;
      if (Object.prototype.hasOwnProperty.call(this.Info, target.id)) {
        this.watcherForGeneration(target);
      }
      const regenPdf = this._regenPdf();
      const client = getSupportClientCode();
      if (
        isShow &&
        typeof response.r === 'undefined' &&
        regenPdf &&
        String(target.id).match(regenPdf) &&
        /OHO|OSO|OXMEDO/i.test(client)
      ) {
        notifyDownload('track_pdf_pre_warn', { type: 'info', toast: false });
      }
    } catch (err) {
      logDownloadError('changeSpinnerState', err);
    }
  }

  checkSpinerStatus(elm, option, self = this) {
    try {
      const opt = option || { error: false };
      const spinner = elm ? [elm] : document.querySelectorAll('.spinner-show');
      Array.from(spinner).forEach((spin) => {
        const startTimer = spin?.getAttribute('timeStamp');
        if (!startTimer) return;
        const isExceed = moment().diff(parseInt(startTimer, 10), 'second') > SPINNER_TIMEOUT_SEC;
        if (!isExceed && !opt.error) return;
        const info = self.Info[spin.id];
        const alertKey = info?.alert?.error;
        if (alertKey) {
          notifyDownload(alertKey, { type: 'warning' });
          self.changeSpinnerState(spin, false);
          logDownloadError(alertKey, { message: 'Generate_TimeOut' });
        }
      });
    } catch (err) {
      logDownloadError('checkSpinerStatus', err);
    }
  }

  watcherForGeneration(elm, self = this) {
    try {
      setTimeout((targetElm) => {
        self.checkSpinerStatus(targetElm);
      }, SPINNER_WATCH_MS, elm);
    } catch (err) {
      logDownloadError('watcherForGeneration', err);
    }
  }

  generate_files_list(type) {
    try {
      return buildDownloadFilesList(type === 'local');
    } catch (err) {
      logDownloadError('generate_files_list', err);
      return '';
    }
  }

  async zip_download_post(response) {
    try {
      if (response?.r == 1) {
        const zipFileName = lastSegment(response.zippath);
        const split = zipFileName.split('.zip');
        const reName = `${split[0]}${moment().format('D_MMM_YY_hh:m:s_a')}.zip`;
        const iURL = buildFileDownloadUrl({
          tempFile: zipFileName,
          folderId: getDocId(),
          reNameFile: reName
        });
        this.httpRequest(`${getBucketUrl()}${getDocId()}/${zipFileName}`, iURL, true);
      }
    } catch (err) {
      logDownloadError('zip_download_post', err);
    }
  }

  async zip_download(type, option) {
    try {
      const jsonData = buildZipPayload(type, option);
      if (type === 'package') {
        const win = getWindowRef();
        win?.sessionStorage?.removeItem(`xmleditor:${getDocId()}:downloadpackage`);
      }
      const response = await apiService.makeRequest(API_ENDPOINTS.ZIP_DOWNLOAD, jsonData);
      await this.zip_download_post(response);
      return response;
    } catch (err) {
      logDownloadError('zip_download', err);
      return null;
    }
  }

  download_window_open(iURL) {
    try {
      let url = iURL;
      if (url && url.indexOf('://') === -1 && !url.includes('@')) url = `http://${url}`;
      const downloadPopUp = window.open(url, '_blank', 'noopener');
      if (downloadPopUp == null || downloadPopUp.closed || typeof downloadPopUp === 'undefined') {
        this.Ignore_Toaster = true;
        notifyPopupBlocked(url);
      } else {
        this.Ignore_Toaster = null;
        downloadPopUp.focus();
      }
    } catch (err) {
      logDownloadError('download_window_open', err);
    }
  }

  download_window_after_opened(result, clickElm) {
    try {
      let alertKey = result ? 'fileDownloadSuccess' : 'fileDownloadFail';
      const type = result ? 'success' : 'error';
      if (typeof clickElm !== 'boolean' && this.Info?.[clickElm]) {
        this.changeSpinnerState(clickElm, false);
        const alertObject = this.Info[clickElm].alert;
        if (alertObject) {
          alertKey = alertObject[result ? 'pass' : 'error'];
          if (alertObject.pass_2_type && result) {
            notifyDownload(alertObject.pass_2, { type: 'warning', toast: false });
          }
        }
      }
      if (!this.Ignore_Toaster) {
        notifyDownload(alertKey, { type });
      }
      this.Record_db(clickElm, result);
    } catch (err) {
      logDownloadError('after_download_window_open', err);
    }
  }

  httpRequest(filePath, iURL, clickElm, options) {
    try {
      const opts = options || { IsFileAvilable: false };
      const xhr = new XMLHttpRequest();
      this.history[filePath] = iURL;
      this.lastURL = iURL;
      this.percentComplete = null;
      xhr.onload = () => {
        try {
          if (xhr.readyState === 4) {
            const elapsed = this.StartTimer ? moment().diff(this.StartTimer, 'second') : 0;
            const seconds = elapsed > 1500 ? 750 : 1500;
            const isPass = xhr.status === 200;
            const decodedURL = String(xhr.responseURL || '').replace(/%20/g, ' ');
            if (opts.IsFileAvilable && !isPass) {
              logDownloadError('TRACK_PDF_LINK_PUBKIT', { message: 'PDF_NOT_AVAILABLE' });
            }
            const newMethod = this.history[xhr.responseURL] || this.history[decodedURL] || iURL;
            if (isPass) {
              if (this.popUpModule) this.download_window_open(newMethod);
              else triggerBrowserDownload(newMethod, lastSegment(newMethod));
            }
            if (clickElm) {
              setTimeout(() => {
                this.download_window_after_opened(isPass, clickElm);
              }, seconds);
            }
          }
        } catch (err) {
          logDownloadError('xhttp.onload', err);
        }
      };
      xhr.open('GET', filePath, true);
      xhr.responseType = 'blob';
      xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
      xhr.send();
    } catch (err) {
      this.changeSpinnerState(clickElm, false);
      logDownloadError('httpRequest', err);
    }
  }

  async click(action, result, options) {
    try {
      const opts = options || { IsFileAvilable: false };
      const win = getWindowRef();
      if (win && win.navigator && win.navigator.onLine === false) {
        notifyDownload('OffLine_Error_show', { type: 'warning' });
        return false;
      }
      if (!this._isHelpFile(action) && !safeProjectName()) {
        await this._waitForProjectName();
      }
      this.StartTimer = moment();
      const menuId = this.Info[action]?.menu_id;
      this.OptClk = menuId && typeof document !== 'undefined' ? document.getElementById(menuId) : null;
      if (this.OptClk) this.changeSpinnerState(this.OptClk, true, result);

      const request = await this.getDownloadRequest(action, result, opts);
      if (!request) {
        if (this.OptClk) this.changeSpinnerState(this.OptClk, false);
        return false;
      }

      if (result === 'landing') {
        const popout = window.open(request.url, '_blank', 'download');
        window.setTimeout(() => {
          if (popout && !popout.closed) popout.close();
        }, LANDING_POPUP_CLOSE_MS);
      } else {
        this.httpRequest(request.filePath, request.url, action, opts);
      }
      return true;
    } catch (err) {
      logDownloadError('click', err);
      return false;
    }
  }

  async Record_db(clikElm, result) {
    try {
      const payload = buildDownloadRecordPayload(clikElm, result, { isTrackView: isTrackView() });
      await apiService.makeRequest(API_ENDPOINTS.UPDATE_INSERT, payload);
    } catch (err) {
      logDownloadError('Record_db', err);
    }
  }
}
