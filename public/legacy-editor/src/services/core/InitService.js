/**
 * InitService - Configuration initialization service
 * Handles URL parsing, localStorage, user info, and document setup
 * ES5 Compatible
 */

/**
 * @constructor
 * @param {URLService} urlService
 * @param {StorageService} storageService
 * @param {SharedKeyService} sharedKeyService
 */
function InitService(urlService, storageService, sharedKeyService) {
  this.urlService = urlService;
  this.storage = storageService;
  this.sharedKeyService = sharedKeyService;
  this.docId = null;
  this.userInfo = {};
  this.isInitialized = false;
  this.isAdmin = false;
}

/**
 * Initialize document ID from URL or localStorage
 * @returns {boolean} Success status
 */
InitService.prototype.initDocumentID = function() {
  try {
    var docid = this.urlService.getURLParam('docid');
    this.emit('log', { source: 'InitService', action: 'initDocumentID', docid: docid });
    
    if (docid) {
      this.docId = docid;
      
      // Store in localStorage
      this.storage.setDocItem(docid, 'currentDocID', docid);
      
      // Update window for legacy compatibility
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

/**
 * Initialize user information from localStorage
 * @returns {boolean} Success status
 */
InitService.prototype.initUserInfo = function() {
  try {
    if (!this.docId) {
      console.warn('InitService: DOC_ID not set');
      return false;
    }
    
    // Load from localStorage
    this.userInfo = this.storage.getUserInfo(this.docId);
    
    // Fallback for localhost
    if (this.urlService.isLocalHost()) {
      if (!this.userInfo.MAIL_ID || /null|undefined/gi.test(this.userInfo.MAIL_ID)) {
        this.userInfo.MAIL_ID = this.storage.getItem('login_username');
      }
      if (!this.userInfo.USER_ID || /null|undefined/gi.test(this.userInfo.USER_ID)) {
        this.userInfo.USER_ID = this.storage.getItem('login_userid');
      }
      
      // Store back to document-specific keys
      if (this.userInfo.MAIL_ID) {
        this.storage.setDocItem(this.docId, 'username', this.userInfo.MAIL_ID);
      }
    }
    
    // Extract mail ID prefix
    if (this.userInfo.MAIL_ID) {
      this.userInfo.MAIL_ID_PREFIX = this.userInfo.MAIL_ID.split('@')[0].trim();
    }
    
    // Update window for legacy compatibility
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

/**
 * Check user access and admin status
 * @returns {boolean} Has valid access
 */
InitService.prototype.checkAccess = function() {
  try {
    this.emit('log', { source: 'InitService', action: 'checkAccess', mailId: this.userInfo.MAIL_ID });
    
    if (!this.userInfo.MAIL_ID) {
      this.emit('access:denied', { reason: 'No user email found' });
      return false;
    }
    
    // Check admin status
    this.checkAdminStatus();
    
    this.emit('access:granted', { userInfo: this.userInfo });
    return true;
  } catch (err) {
    console.warn('InitService.checkAccess error:', err.message);
    this.emit('error', { source: 'InitService', action: 'checkAccess', error: err.message });
    return false;
  }
};

/**
 * Check if user is admin
 */
InitService.prototype.checkAdminStatus = function() {
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

/**
 * Handle admin-specific initialization
 */
InitService.prototype.handleAdminInit = function() {
  try {
    if (typeof window !== 'undefined' && window.commonfn && window.commonfn.callajax) {
      setTimeout(function() {
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

/**
 * Check if user is admin
 * @returns {boolean}
 */
InitService.prototype.isUserAdmin = function() {
  return this.isAdmin;
};

/**
 * Get document ID
 * @returns {string|null}
 */
InitService.prototype.getDocId = function() {
  return this.docId;
};

/**
 * Get user info
 * @returns {object}
 */
InitService.prototype.getUserInfo = function() {
  return this.userInfo;
};

/**
 * Check if running on localhost
 * @returns {boolean}
 */
InitService.prototype.isLocalHost = function() {
  return this.urlService.isLocalHost();
};

/**
 * Emit event
 * @param {string} event
 * @param {*} data
 */
InitService.prototype.emit = function(event, data) {
  if (typeof window !== 'undefined' && window.eventBus) {
    window.eventBus.emit('init:' + event, data);
  }
};

/**
 * Run complete initialization sequence
 * @returns {boolean} Success status
 */
InitService.prototype.run = function() {
  try {
    this.emit('log', { source: 'InitService', action: 'run', message: 'Initialization sequence started' });
    
    // Step 1: Parse URL and get document ID
    if (!this.initDocumentID()) {
      console.warn('InitService: Failed to initialize document ID');
      this.emit('init:failed', { step: 'documentId', reason: 'No docid found in URL' });
      return false;
    }
    
    // Step 2: Initialize user info
    if (!this.initUserInfo()) {
      console.warn('InitService: Failed to initialize user info');
      this.emit('init:failed', { step: 'userInfo', reason: 'No user info found' });
      return false;
    }
    
    // Step 3: Check access
    if (!this.checkAccess()) {
      console.warn('InitService: User access denied');
      this.emit('init:failed', { step: 'access', reason: 'Access denied' });
      return false;
    }
    
    // Step 4: Check for shared key
    var sharedKey = this.sharedKeyService.resolve(this.docId);
    
    if (!this.sharedKeyService.isValid(sharedKey)) {
      this.emit('log', { source: 'InitService', action: 'run', message: 'No shared key found' });
      
      // Check if admin - skip normal initialization
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

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InitService;
} else if (typeof window !== 'undefined') {
  window.InitService = InitService;
}
