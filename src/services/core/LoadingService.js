function LoadingService(initService) {
  this.initService = initService;
  this.isFullyLoaded = false;
  this.canLoadEditor = false;
  this.currentProgress = 0;
  this.loadQueue = [];
  this.responses = {};
  this.errors = [];
  this.version = (typeof window !== 'undefined' && window.VERSION) ? window.VERSION : '';
  this.folderPath = 'assets/' + this.version + '/config/';
  this.client = { NAME: { UPPER: '', LOWER: '' }, DTD: { UPPER: '', LOWER: '' } };
  this.shortTitle = '';
  this.isTrackView = false;

  this.configs = {
    meta: new MetaConfigLoader(this),
    client: new ClientConfigLoader(this),
    ceg: new CegConfigLoader(this),
    lang: new LangConfigLoader(this),
    ico: new IcoConfigLoader(this)
  };
}

LoadingService.prototype.init = function (sharedKey) {
  if (!sharedKey || !sharedKey.client || !sharedKey.type) {
    this.emit('error', { source: 'LoadingService', action: 'init', error: 'Invalid shared key' });
    return;
  }

  this.client = {
    NAME: {
      UPPER: sharedKey.client.toUpperCase(),
      LOWER: sharedKey.client.toLowerCase()
    },
    DTD: {
      UPPER: sharedKey.type.toUpperCase(),
      LOWER: sharedKey.type.toLowerCase()
    }
  };

  this.isTrackView = (typeof window !== 'undefined' && window.IS_TRACK_VIEW) ? window.IS_TRACK_VIEW : false;

  this.emit('progress', { value: 2, message: 'Fetching Metadata...' });

  var self = this;
  this.loadAll().then(function () {
    self.isFullyLoaded = true;
    self.canLoadEditor = true;
    self.currentProgress = 10;
    self.emit('progress', { value: 10, message: 'Ready' });
    self.emit('complete', {});
  }).catch(function (err) {
    self.emit('error', { source: 'LoadingService', action: 'loadAll', error: err.message });
  });
};

LoadingService.prototype.loadAll = function () {
  var self = this;
  var loaders = [];

  for (var key in this.configs) {
    if (this.configs.hasOwnProperty(key)) {
      var config = this.configs[key];
      if (config.shouldLoad(this.isTrackView)) {
        loaders.push(config);
      }
    }
  }

  loaders.sort(function (a, b) {
    return (a.order || 999) - (b.order || 999);
  });

  return loaders.reduce(function (promise, loader) {
    return promise.then(function () {
      self.emit('progress', {
        value: loader.progressValue || 3,
        message: loader.progressMessage || 'Loading...'
      });
      return self.loadConfig(loader);
    });
  }, Promise.resolve());
};

LoadingService.prototype.loadConfig = function (loader) {
  var self = this;
  var url = loader.getUrl(this.client, this.shortTitle, this.folderPath);

  if (!url) {
    return Promise.resolve();
  }

  return this.fetch(url).then(function (response) {
    if (response.ok) {
      return response.text().then(function (text) {
        self.responses[url] = {
          status: response.status,
          text: text,
          url: response.url
        };

        if (loader.isXml) {
          var parser = new DOMParser();
          var xmlDoc = parser.parseFromString(text, 'text/xml');
          loader.handleResponse(xmlDoc, self);
        } else if (loader.isJs) {
          loader.handleResponse(text, self);
        } else {
          loader.handleResponse(response, self);
        }

        self.emit('config:loaded', { type: loader.type, url: url });
      });
    } else {
      throw new Error('Failed to load ' + url + ': ' + response.status);
    }
  }).catch(function (err) {
    self.errors.push({ url: url, error: err.message });
    self.emit('config:error', { type: loader.type, url: url, error: err.message });
  });
};

LoadingService.prototype.fetch = function (url) {
  var self = this;

  return new Promise(function (resolve, reject) {
    if (typeof fetch !== 'undefined') {
      fetch(url).then(resolve).catch(function () {
        self.xhrFetch(url).then(resolve).catch(reject);
      });
    } else {
      self.xhrFetch(url).then(resolve).catch(reject);
    }
  });
};

LoadingService.prototype.xhrFetch = function (url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve({
            ok: true,
            status: xhr.status,
            url: xhr.responseURL,
            text: function () { return Promise.resolve(xhr.responseText); }
          });
        } else {
          reject(new Error('XHR failed: ' + xhr.status));
        }
      }
    };

    xhr.onerror = function () {
      reject(new Error('XHR network error'));
    };

    xhr.open('GET', url, true);
    xhr.send();
  });
};

LoadingService.prototype.getAttributes = function (element) {
  var attrs = {};
  if (element && element.attributes) {
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
  }
  return attrs;
};

LoadingService.prototype.onProgress = function (callback) {
  var self = this;
  if (typeof window !== 'undefined' && window.eventBus) {
    return window.eventBus.on('loading:progress', callback);
  }
  return function () { };
};

LoadingService.prototype.onComplete = function (callback) {
  var self = this;
  if (typeof window !== 'undefined' && window.eventBus) {
    return window.eventBus.on('loading:complete', callback);
  }
  return function () { };
};

LoadingService.prototype.emit = function (event, data) {
  if (typeof window !== 'undefined' && window.eventBus) {
    window.eventBus.emit('loading:' + event, data);
  }
};

function MetaConfigLoader(parent) {
  this.parent = parent;
  this.type = 'meta';
  this.order = 1;
  this.progressValue = 2;
  this.progressMessage = 'Fetching Metadata...';
  this.ignoreTrack = false;
  this.isXml = true;
  this.configPath = '';
}

MetaConfigLoader.prototype.shouldLoad = function (isTrackView) {
  if (this.ignoreTrack) return true;
  return !isTrackView;
};

MetaConfigLoader.prototype.getUrl = function (client, shortTitle, folderPath) {
  this.configPath = folderPath + client.DTD.LOWER + '/' + client.NAME.LOWER + '/';
  return this.configPath + 'config.xml';
};

MetaConfigLoader.prototype.handleResponse = function (xmlDoc, service) {
  if (typeof window !== 'undefined') {
    window.I_CONFIG = xmlDoc;

    var generate = xmlDoc.querySelector('[name=Generate_Items]');
    if (generate) {
      window.FIG_CAP = generate.getAttribute('figCap');
      window.TAB_CAP = generate.getAttribute('tabCap');
      window.GENERATE = generate;
    }
  }
};

function ClientConfigLoader(parent) {
  this.parent = parent;
  this.type = 'client';
  this.order = 3;
  this.progressValue = 4;
  this.progressMessage = 'Loading Client Config...';
  this.ignoreTrack = false;
  this.isXml = true;
  this.isLoaded = false;
}

ClientConfigLoader.prototype.shouldLoad = function (isTrackView) {
  if (this.ignoreTrack) return true;
  return !isTrackView;
};

ClientConfigLoader.prototype.getUrl = function (client, shortTitle, folderPath) {
  var title = this.resolveTitle();
  if (title) {
    service.shortTitle = title;
    return service.configPath + 'split/' + title + '.xml';
  }
  return null;
};

ClientConfigLoader.prototype.resolveTitle = function () {
  var service = this.parent;
  var sharedKey = (typeof window !== 'undefined') ? window.SHARED_KEY : null;

  if (!sharedKey) return null;

  if (typeof window !== 'undefined' && window.IS_JOURNAL) {
    if (sharedKey.titleinfo && sharedKey.titleinfo.cover) {
      return sharedKey.titleinfo.cover;
    } else if (sharedKey.shorttitle) {
      return sharedKey.shorttitle;
    }
  } else {
    return sharedKey.client;
  }

  return null;
};

ClientConfigLoader.prototype.handleResponse = function (xmlDoc, service) {
  this.isLoaded = true;
  if (typeof window !== 'undefined') {
    window.J_CONFIG = xmlDoc.documentElement;
  }
};

function CegConfigLoader(parent) {
  this.parent = parent;
  this.type = 'ceg';
  this.order = 4;
  this.progressValue = 7;
  this.progressMessage = 'Loading Style Settings...';
  this.ignoreTrack = true;
  this.isXml = true;
}

CegConfigLoader.prototype.shouldLoad = function (isTrackView) {
  return true;
};

CegConfigLoader.prototype.getUrl = function (client, shortTitle, folderPath) {
  if (shortTitle) {
    return service.configPath + 'ceg/refStyling_' + encodeURIComponent(shortTitle + '.xml');
  }
  return null;
};

CegConfigLoader.prototype.handleResponse = function (xmlDoc, service) {
  if (typeof window !== 'undefined') {
    window.iREF_SCOPE = window.iREF_SCOPE || {};
    window.iREF_SCOPE.DOC = xmlDoc;
  }
};

function LangConfigLoader(parent) {
  this.parent = parent;
  this.type = 'lang';
  this.order = 2;
  this.progressValue = 6;
  this.progressMessage = 'Loading Language Pack...';
  this.ignoreTrack = true;
  this.isJs = true;
  this.default = 'en';
}

LangConfigLoader.prototype.shouldLoad = function (isTrackView) {
  return true;
};

LangConfigLoader.prototype.getUrl = function (client, shortTitle, folderPath) {
  return folderPath + 'lang/' + this.default + '.js';
};

LangConfigLoader.prototype.handleResponse = function (text, service) {
  try {
    var content = text.slice((this.default.length + 1), -1);
    if (content.indexOf('"=') === 0) content = content.slice(2);
    else if (content.indexOf('=') === 0) content = content.slice(1);
    if (content.slice(-1) === '"') content = content.slice(0, -1);

    var json = JSON.parse(JSON.parse(JSON.stringify(content)));

    if (typeof window !== 'undefined') {
      window.IMPACT = window.IMPACT || {};
      window.IMPACT.lang = window.IMPACT.lang || {};
      window.IMPACT.lang[this.default] = json;
    }
  } catch (e) {
    console.warn('LangConfigLoader parse error:', e.message);
  }
};

function IcoConfigLoader(parent) {
  this.parent = parent;
  this.type = 'ico';
  this.order = 5;
  this.progressValue = 8;
  this.progressMessage = 'Loading Assets...';
  this.ignoreTrack = false;
}

IcoConfigLoader.prototype.shouldLoad = function (isTrackView) {
  if (this.ignoreTrack) return true;
  return !isTrackView;
};

IcoConfigLoader.prototype.getUrl = function (client, shortTitle, folderPath) {
  return 'UI/client_logo/' + client.NAME.UPPER + '_FAVICON.svg';
};

IcoConfigLoader.prototype.handleResponse = function (response, service) {
  var link = document.querySelector("link[rel='icon']");
  if (link && response.url) {
    link.href = response.url;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingService;
} else if (typeof window !== 'undefined') {
  window.LoadingService = LoadingService;
}
