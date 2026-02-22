function InitService(urlService, storageService, sharedKeyService) {
  this.urlService = urlService;
  this.storage = storageService;
  this.sharedKeyService = sharedKeyService;
  this.docId = null;
  this.userInfo = {};
  this.isInitialized = false;
  this.isAdmin = false;
}

InitService.prototype.initDocumentID = function () {
  try {
    var docid = this.urlService.getURLParam('docid');
    this.emit('log', { source: 'InitService', action: 'initDocumentID', docid: docid });

    if (docid) {
      this.docId = docid;

      this.storage.setDocItem(docid, 'currentDocID', docid);

      if (typeof window !== 'undefined') {
        window.DOC_ID = docid;
      }

      this.emit('docId:set', { docId: docid });
      return true;
    }

    return false;
  } catch (err) {
    console.warn('InitService.initDocumentID error:', err.message);
    this.emit('error', { source: 'InitService', action: 'initDocumentID', error: err.message });
    return false;
  }
};

InitService.prototype.initUserInfo = function () {
  try {
    if (!this.docId) {
      console.warn('InitService: DOC_ID not set');
      return false;
    }

    this.userInfo = this.storage.getUserInfo(this.docId);

    if (this.urlService.isLocalHost()) {
      if (!this.userInfo.MAIL_ID || /null|undefined/gi.test(this.userInfo.MAIL_ID)) {
        this.userInfo.MAIL_ID = this.storage.getItem('login_username');
      }
      if (!this.userInfo.USER_ID || /null|undefined/gi.test(this.userInfo.USER_ID)) {
        this.userInfo.USER_ID = this.storage.getItem('login_userid');
      }

      if (this.userInfo.MAIL_ID) {
        this.storage.setDocItem(this.docId, 'username', this.userInfo.MAIL_ID);
      }
    }

    if (this.userInfo.MAIL_ID) {
      this.userInfo.MAIL_ID_PREFIX = this.userInfo.MAIL_ID.split('@')[0].trim();
    }

    if (typeof window !== 'undefined') {
      window.USER_INFO = this.userInfo;
    }

    this.emit('userInfo:set', { userInfo: this.userInfo });
    return !!this.userInfo.MAIL_ID;
  } catch (err) {
    console.warn('InitService.initUserInfo error:', err.message);
    this.emit('error', { source: 'InitService', action: 'initUserInfo', error: err.message });
    return false;
  }
};

InitService.prototype.checkAccess = function () {
  try {
    this.emit('log', { source: 'InitService', action: 'checkAccess', mailId: this.userInfo.MAIL_ID });

    if (!this.userInfo.MAIL_ID) {
      this.emit('access:denied', { reason: 'No user email found' });
      return false;
    }

    this.checkAdminStatus();

    this.emit('access:granted', { userInfo: this.userInfo });
    return true;
  } catch (err) {
    console.warn('InitService.checkAccess error:', err.message);
    this.emit('error', { source: 'InitService', action: 'checkAccess', error: err.message });
    return false;
  }
};

InitService.prototype.checkAdminStatus = function () {
  try {
    var adminIds = (typeof window !== 'undefined' && window.ADMIN_USER_IDs) ? window.ADMIN_USER_IDs : [];

    if (adminIds.indexOf(this.userInfo.MAIL_ID_PREFIX) !== -1) {
      this.storage.setItem('admin', 'superadmin');
      this.userInfo.IS_ADMIN = true;
      this.isAdmin = true;
    } else {
      this.storage.removeItem('admin');
      this.userInfo.IS_ADMIN = false;
      this.isAdmin = false;
    }
  } catch (err) {
    console.warn('InitService.checkAdminStatus error:', err.message);
  }
};

InitService.prototype.handleAdminInit = function () {
  try {
    if (typeof window !== 'undefined' && window.commonfn && window.commonfn.callajax) {
      setTimeout(function () {
        window.commonfn.callajax(
          window.getDataRecord,
          'getProjectData',
          (window.API_GET_DOCS) ? window.API_GET_DOCS : null
        );
      }, 1000);
    }
    this.emit('admin:init', { docId: this.docId });
  } catch (err) {
    console.warn('InitService.handleAdminInit error:', err.message);
  }
};

InitService.prototype.isUserAdmin = function () {
  return this.isAdmin;
};

InitService.prototype.getDocId = function () {
  return this.docId;
};

InitService.prototype.getUserInfo = function () {
  return this.userInfo;
};

InitService.prototype.isLocalHost = function () {
  return this.urlService.isLocalHost();
};

InitService.prototype.emit = function (event, data) {
  if (typeof window !== 'undefined' && window.eventBus) {
    window.eventBus.emit('init:' + event, data);
  }
};

InitService.prototype.run = function () {
  try {
    this.emit('log', { source: 'InitService', action: 'run', message: 'Initialization sequence started' });

    if (!this.initDocumentID()) {
      console.warn('InitService: Failed to initialize document ID');
      this.emit('init:failed', { step: 'documentId', reason: 'No docid found in URL' });
      return false;
    }

    if (!this.initUserInfo()) {
      console.warn('InitService: Failed to initialize user info');
      this.emit('init:failed', { step: 'userInfo', reason: 'No user info found' });
      return false;
    }

    if (!this.checkAccess()) {
      console.warn('InitService: User access denied');
      this.emit('init:failed', { step: 'access', reason: 'Access denied' });
      return false;
    }

    var sharedKey = this.sharedKeyService.resolve(this.docId);

    if (!this.sharedKeyService.isValid(sharedKey)) {
      this.emit('log', { source: 'InitService', action: 'run', message: 'No shared key found' });

      if (this.isAdmin || this.isLocalHost()) {
        this.handleAdminInit();
        this.isInitialized = true;
        this.emit('init:complete', { isAdmin: true });
        return true;
      }

      this.emit('init:waiting', { for: 'sharedKey' });
      return false;
    }

    this.isInitialized = true;
    this.emit('init:complete', { isAdmin: false, sharedKey: sharedKey });
    return true;
  } catch (err) {
    console.warn('InitService.run error:', err.message);
    this.emit('error', { source: 'InitService', action: 'run', error: err.message });
    this.emit('init:failed', { step: 'run', error: err.message });
    return false;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InitService;
} else if (typeof window !== 'undefined') {
  window.InitService = InitService;
}
