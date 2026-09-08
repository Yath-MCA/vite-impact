/**
 * StorageService - localStorage management wrapper
 * ES5 Compatible - Handles storage availability and errors
 */

/**
 * @constructor
 */
function StorageService() {
  this.isAvailable = this.checkAvailability();
  this.prefix = 'xmleditor:';
}

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
StorageService.prototype.checkAvailability = function() {
  try {
    var test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get item from localStorage
 * @param {string} key
 * @returns {string|null}
 */
StorageService.prototype.getItem = function(key) {
  if (!this.isAvailable) return null;
  try {
    return localStorage.getItem(this.prefix + key);
  } catch (e) {
    console.warn('StorageService.getItem error:', e.message);
    return null;
  }
};

/**
 * Set item in localStorage
 * @param {string} key
 * @param {string} value
 */
StorageService.prototype.setItem = function(key, value) {
  if (!this.isAvailable) return;
  try {
    localStorage.setItem(this.prefix + key, value);
  } catch (e) {
    console.warn('StorageService.setItem error:', e.message);
  }
};

/**
 * Remove item from localStorage
 * @param {string} key
 */
StorageService.prototype.removeItem = function(key) {
  if (!this.isAvailable) return;
  try {
    localStorage.removeItem(this.prefix + key);
  } catch (e) {
    console.warn('StorageService.removeItem error:', e.message);
  }
};

/**
 * Get document-specific item
 * @param {string} docId
 * @param {string} key
 * @returns {string|null}
 */
StorageService.prototype.getDocItem = function(docId, key) {
  return this.getItem(key + ':' + docId);
};

/**
 * Set document-specific item
 * @param {string} docId
 * @param {string} key
 * @param {string} value
 */
StorageService.prototype.setDocItem = function(docId, key, value) {
  this.setItem(key + ':' + docId, value);
};

/**
 * Get shared key for document
 * @param {string} docId
 * @returns {object|null}
 */
StorageService.prototype.getSharedKey = function(docId) {
  var data = this.getDocItem(docId, 'shared');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('StorageService.getSharedKey parse error:', e.message);
      return null;
    }
  }
  return null;
};

/**
 * Set shared key for document
 * @param {string} docId
 * @param {object} sharedKey
 */
StorageService.prototype.setSharedKey = function(docId, sharedKey) {
  this.setDocItem(docId, 'shared', JSON.stringify(sharedKey));
};

/**
 * Get user info for document
 * @param {string} docId
 * @returns {object}
 */
StorageService.prototype.getUserInfo = function(docId) {
  return {
    MAIL_ID: this.getDocItem(docId, 'username'),
    USER_ID: this.getDocItem(docId, 'userid'),
    HAS_COLLAB_WORKFLOW: this.getDocItem(docId, 'collabEnabled') === 'true',
    IS_ADMIN: this.getItem('admin') === 'superadmin'
  };
};

/**
 * Set user info for document
 * @param {string} docId
 * @param {object} userInfo
 */
StorageService.prototype.setUserInfo = function(docId, userInfo) {
  if (userInfo.MAIL_ID) {
    this.setDocItem(docId, 'username', userInfo.MAIL_ID);
  }
  if (userInfo.USER_ID) {
    this.setDocItem(docId, 'userid', userInfo.USER_ID);
  }
  if (userInfo.HAS_COLLAB_WORKFLOW !== undefined) {
    this.setDocItem(docId, 'collabEnabled', userInfo.HAS_COLLAB_WORKFLOW.toString());
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
} else if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
}
