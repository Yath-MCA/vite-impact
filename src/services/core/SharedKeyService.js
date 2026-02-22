function SharedKeyService(storageService) {
  this.storage = storageService;
  this.currentSharedKey = null;
  this.resolutionAttempts = 0;
  this.maxAttempts = 50;
  this.resolutionInterval = null;
}

SharedKeyService.prototype.isValid = function (sharedKey) {
  return !!(sharedKey &&
    sharedKey.apikey &&
    sharedKey.dtd &&
    sharedKey.type &&
    sharedKey.docid);
};

SharedKeyService.prototype.resolve = function (docId) {
  if (typeof window !== 'undefined' && window.SHARED_KEY && this.isValid(window.SHARED_KEY)) {
    this.currentSharedKey = window.SHARED_KEY;
    return this.currentSharedKey;
  }

  if (this.storage && docId) {
    var stored = this.storage.getSharedKey(docId);
    if (this.isValid(stored)) {
      this.currentSharedKey = stored;
      if (typeof window !== 'undefined') {
        window.SHARED_KEY = stored;
      }
      return this.currentSharedKey;
    }
  }

  return null;
};

SharedKeyService.prototype.startWatching = function (docId, onResolved, onTimeout, timeoutMs) {
  timeoutMs = timeoutMs || 25000;
  var self = this;
  var startTime = Date.now();
  var resolved = false;

  this.resolutionAttempts = 0;

  this.resolutionInterval = setInterval(function () {
    if (Date.now() - startTime > timeoutMs) {
      self.stopWatching();
      if (typeof onTimeout === 'function') {
        onTimeout();
      }
      return;
    }

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

  return {
    stop: function () {
      self.stopWatching();
    },
    isResolved: function () {
      return resolved;
    }
  };
};

SharedKeyService.prototype.stopWatching = function () {
  if (this.resolutionInterval) {
    clearInterval(this.resolutionInterval);
    this.resolutionInterval = null;
  }
};

SharedKeyService.prototype.getCurrent = function () {
  return this.currentSharedKey;
};

SharedKeyService.prototype.set = function (sharedKey) {
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedKeyService;
} else if (typeof window !== 'undefined') {
  window.SharedKeyService = SharedKeyService;
}
