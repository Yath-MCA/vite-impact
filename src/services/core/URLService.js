function URLService() {
  this.urlParams = {};
  this.isInitialized = false;
}

URLService.prototype.isValidVariable = function (variable) {
  return variable !== null &&
    variable !== undefined &&
    variable !== '' &&
    !(typeof variable === 'number' && isNaN(variable));
};

URLService.prototype.parseURLParams = function () {
  try {
    var search = window.location.search;
    var params = {};

    if (search && search.length > 1) {
      var query = decodeURIComponent(search.substring(1));
      var pairs = query.split('&');

      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        if (pair.length === 2) {
          params[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
        }
      }
    }

    this.urlParams = params;
    this.emit('log', { source: 'URLService', action: 'parseURLParams', data: params });
    return params;
  } catch (err) {
    console.warn('URLService.parseURLParams error:', err.message);
    this.emit('error', { source: 'URLService', action: 'parseURLParams', error: err.message });
    return {};
  }
};

URLService.prototype.getURLParam = function (key) {
  try {
    if (!this.urlParams || Object.keys(this.urlParams).length === 0) {
      this.parseURLParams();
    }
    return this.urlParams[key] || null;
  } catch (err) {
    console.warn('URLService.getURLParam error:', err.message);
    return null;
  }
};

URLService.prototype.isLocalHost = function () {
  var hostname = window.location.hostname;
  return hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.indexOf('192.168.') === 0 ||
    hostname.indexOf('10.') === 0;
};

URLService.prototype.emit = function (event, data) {
  if (typeof window !== 'undefined' && window.eventBus) {
    window.eventBus.emit('url:' + event, data);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = URLService;
} else if (typeof window !== 'undefined') {
  window.URLService = URLService;
}
