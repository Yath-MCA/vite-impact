function EditorInitService(loadingService, sharedKeyService) {
  this.loadingService = loadingService;
  this.sharedKeyService = sharedKeyService;

  this.state = 'IDLE';
  this.isInitiated = false;
  this.pendingSharedKey = null;
  this.initStartedAt = null;
  this.timeoutMs = 25000;
  this.reloadTriggered = false;

  this.stateWatcher = null;
  this.sharedKeyWatcher = null;
  this.loadingWatcher = null;
}

EditorInitService.STATES = {
  IDLE: 'IDLE',
  WAITING_SHARED_KEY: 'WAITING_SHARED_KEY',
  WAITING_LOADING: 'WAITING_LOADING',
  READY: 'READY',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT'
};

EditorInitService.prototype.hasValidSharedKey = function (sharedKey) {
  return !!(sharedKey &&
    sharedKey.apikey &&
    sharedKey.dtd &&
    sharedKey.type);
};

EditorInitService.prototype.start = function (sharedKey) {
  try {
    if (this.isInitiated || !sharedKey) {
      return false;
    }

    this.initStartedAt = Date.now();
    this.pendingSharedKey = sharedKey;
    this.setState(EditorInitService.STATES.WAITING_LOADING);

    this.emit('log', { source: 'EditorInitService', action: 'start', sharedKey: sharedKey.docid });

    return this.tryStart();
  } catch (err) {
    console.warn('EditorInitService.start error:', err.message);
    this.setState(EditorInitService.STATES.FAILED);
    this.emit('error', { source: 'EditorInitService', action: 'start', error: err.message });
    return false;
  }
};

EditorInitService.prototype.tryStart = function () {
  try {
    if (this.isInitiated || !this.pendingSharedKey) {
      return false;
    }

    if (this.checkTimeout()) {
      return false;
    }

    if (this.loadingService && this.loadingService.canLoadEditor) {
      this.isInitiated = true;
      this.setState(EditorInitService.STATES.READY);
      this.clearWatchers();
      return this.runReadyToOpen();
    }

    if (!this.loadingWatcher) {
      var self = this;
      this.loadingWatcher = this.loadingService.onComplete(function () {
        self.tryStart();
      });
    }

    return false;
  } catch (err) {
    console.warn('EditorInitService.tryStart error:', err.message);
    this.setState(EditorInitService.STATES.FAILED);
    return false;
  }
};

EditorInitService.prototype.preInitialize = function () {
  try {
    this.initStartedAt = Date.now();

    if (!navigator.onLine && typeof window !== 'undefined' && window.IS_CHECK_ONLINE) {
      window.IS_CHECK_ONLINE(navigator.onLine);
    }

    var body = document.getElementById('Body');
    if (body) {
      body.classList.remove('ignore-events');
    }

    var sharedKey = this.sharedKeyService.getCurrent();

    if (this.hasValidSharedKey(sharedKey)) {
      this.start(sharedKey);
    } else {
      this.startSharedKeyWatcher();
    }
  } catch (err) {
    console.warn('EditorInitService.preInitialize error:', err.message);
  }
};

EditorInitService.prototype.startSharedKeyWatcher = function () {
  try {
    if (this.sharedKeyWatcher || this.isInitiated) {
      return;
    }

    this.setState(EditorInitService.STATES.WAITING_SHARED_KEY);

    var self = this;
    var docId = (typeof window !== 'undefined' && window.DOC_ID) ? window.DOC_ID : null;

    this.sharedKeyWatcher = this.sharedKeyService.startWatching(
      docId,
      function (sharedKey) {
        self.start(sharedKey);
      },
      function () {
        self.handleTimeout();
      },
      this.timeoutMs
    );
  } catch (err) {
    console.warn('EditorInitService.startSharedKeyWatcher error:', err.message);
  }
};

EditorInitService.prototype.checkTimeout = function () {
  if (this.isInitiated || this.reloadTriggered) {
    return false;
  }

  if (!this.initStartedAt) {
    this.initStartedAt = Date.now();
    return false;
  }

  if ((Date.now() - this.initStartedAt) < this.timeoutMs) {
    return false;
  }

  this.handleTimeout();
  return true;
};

EditorInitService.prototype.handleTimeout = function () {
  this.reloadTriggered = true;
  this.setState(EditorInitService.STATES.TIMEOUT);
  this.clearWatchers();

  this.emit('timeout', { elapsed: Date.now() - this.initStartedAt });

  if (typeof window !== 'undefined' && window.ErrorLogTrace) {
    window.ErrorLogTrace('EDITOR_INITIALIZE_TIMEOUT', 'Initialization exceeded 25 seconds. Reloading.');
  }

  if (typeof window !== 'undefined' && window.location && window.location.reload) {
    window.location.reload();
  }
};

EditorInitService.prototype.runReadyToOpen = function (sharedKey) {
  try {
    var activeSharedKey = sharedKey || this.pendingSharedKey;
    if (!activeSharedKey) {
      return false;
    }

    if (typeof window !== 'undefined') {
      if (typeof window.getsetUserUniqueId === 'function') {
        window.getsetUserUniqueId();
      }
      if (typeof window.SET_TITLES === 'function') {
        window.SET_TITLES(activeSharedKey);
      }
      if (typeof window.fetchUserInfo === 'function') {
        window.fetchUserInfo();
      }

      window.DOC_DTD = activeSharedKey.dtd;
      window.IS_JOURNAL = !!(window.DOC_DTD && window.DOC_DTD.indexOf('JATS') !== -1);
      window.LOCAL_DATA = window.DOC_ID + '_offline_html';

      if (typeof window.CHECK_CURRENT_STATUS === 'function') {
        window.CHECK_CURRENT_STATUS('READY_TO_OPEN');
      }
    }

    this.emit('ready', { sharedKey: activeSharedKey });

    this.initStartedAt = null;

    return true;
  } catch (err) {
    console.warn('EditorInitService.runReadyToOpen error:', err.message);
    this.setState(EditorInitService.STATES.FAILED);
    return false;
  }
};

EditorInitService.prototype.clearWatchers = function () {
  if (this.stateWatcher) {
    clearInterval(this.stateWatcher);
    this.stateWatcher = null;
  }

  if (this.sharedKeyWatcher) {
    this.sharedKeyWatcher.stop();
    this.sharedKeyWatcher = null;
  }

  if (this.loadingWatcher) {
    this.loadingWatcher();
    this.loadingWatcher = null;
  }
};

EditorInitService.prototype.setState = function (newState) {
  var oldState = this.state;
  this.state = newState;
  this.emit('state:change', { oldState: oldState, newState: newState });
};

EditorInitService.prototype.getState = function () {
  return this.state;
};

EditorInitService.prototype.isReady = function () {
  return this.state === EditorInitService.STATES.READY;
};

EditorInitService.prototype.emit = function (event, data) {
  if (typeof window !== 'undefined' && window.eventBus) {
    window.eventBus.emit('editor:' + event, data);
  }
};

EditorInitService.prototype.preInitilize = EditorInitService.prototype.preInitialize;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditorInitService;
} else if (typeof window !== 'undefined') {
  window.EditorInitService = EditorInitService;
}
