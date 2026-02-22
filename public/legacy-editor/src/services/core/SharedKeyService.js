/**
 * SharedKeyService - Manages shared key resolution and validation
 * ES5 Compatible
 */

/**
 * @constructor
 * @param {StorageService} storageService
 */
function SharedKeyService(storageService) {
  this.storage = storageService;
  this.currentSharedKey = null;
  this.resolutionAttempts = 0;
  this.maxAttempts = 50;
  this.resolutionInterval = null;
}

/**
 * Check if shared key is valid
 * @param {object} sharedKey
 * @returns {boolean}
 */
SharedKeyService.prototype.isValid = function(sharedKey) {
  return !!(sharedKey && 
            sharedKey.apikey && 
            sharedKey.dtd && 
            sharedKey.type &&
            sharedKey.docid);
};

/**
 * Resolve shared key from localStorage or window
 * @param {string} docId
 * @returns {object|null}
 */
SharedKeyService.prototype.resolve = function(docId) {
  // Try window first
  if (typeof window !== 'undefined' && window.SHARED_KEY && this.isValid(window.SHARED_KEY)) {
    this.currentSharedKey = window.SHARED_KEY;
    return this.currentSharedKey;
  }
  
  // Try localStorage
  if (this.storage && docId) {
    var stored = this.storage.getSharedKey(docId);
    if (this.isValid(stored)) {
      this.currentSharedKey = stored;
      // Update window for legacy compatibility
      if (typeof window !== 'undefined') {
        window.SHARED_KEY = stored;
      }
      return this.currentSharedKey;
    }
  }
  
  return null;
};

/**
 * Start watching for shared key resolution
 * @param {string} docId
 * @param {Function} onResolved - Callback when resolved
 * @param {Function} onTimeout - Callback on timeout
 * @param {number} timeoutMs - Timeout in milliseconds (default 25000)
 * @returns {object} Controller with stop method
 */
SharedKeyService.prototype.startWatching = function(docId, onResolved, onTimeout, timeoutMs) {
  timeoutMs = timeoutMs || 25000;
  var self = this;
  var startTime = Date.now();
  var resolved = false;
  
  this.resolutionAttempts = 0;
  
  this.resolutionInterval = setInterval(function() {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      self.stopWatching();
      if (typeof onTimeout === 'function') {
        onTimeout();
      }
      return;
    }
    
    // Try to resolve
    var sharedKey = self.resolve(docId);
    if (self.isValid(sharedKey)) {
      resolved = true;
      self.stopWatching();
      if (typeof onResolved === 'function') {
        onResolved(sharedKey);
      }
      return;
    }
    
    self.resolutionAttempts++;
  }, 100);
  
  // Return controller
  return {
    stop: function() {
      self.stopWatching();
    },
    isResolved: function() {
      return resolved;
    }
  };
};

/**
 * Stop watching for shared key
 */
SharedKeyService.prototype.stopWatching = function() {
  if (this.resolutionInterval) {
    clearInterval(this.resolutionInterval);
    this.resolutionInterval = null;
  }
};

/**
 * Get current shared key
 * @returns {object|null}
 */
SharedKeyService.prototype.getCurrent = function() {
  return this.currentSharedKey;
};

/**
 * Set shared key
 * @param {object} sharedKey
 */
SharedKeyService.prototype.set = function(sharedKey) {
  if (this.isValid(sharedKey)) {
    this.currentSharedKey = sharedKey;
    if (typeof window !== 'undefined') {
      window.SHARED_KEY = sharedKey;
    }
    if (this.storage && sharedKey.docid) {
      this.storage.setSharedKey(sharedKey.docid, sharedKey);
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedKeyService;
} else if (typeof window !== 'undefined') {
  window.SharedKeyService = SharedKeyService;
}
