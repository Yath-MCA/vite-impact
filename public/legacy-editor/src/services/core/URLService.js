/**
 * URLService - URL parsing and parameter extraction
 * ES5 Compatible - No React, Pure JS
 */

/**
 * @constructor
 */
function URLService() {
  this.urlParams = {};
  this.isInitialized = false;
}

/**
 * Check if variable is valid (not null, undefined, or empty)
 * @param {*} variable 
 * @returns {boolean}
 */
URLService.prototype.isValidVariable = function(variable) {
  return variable !== null && 
         variable !== undefined && 
         variable !== '' &&
         !(typeof variable === 'number' && isNaN(variable));
};

/**
 * Parse URL parameters from window.location.search
 * @returns {object} Parsed URL parameters
 */
URLService.prototype.parseURLParams = function() {
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

/**
 * Get URL parameter by key
 * @param {string} key - Parameter key
 * @returns {string|null} Parameter value or null
 */
URLService.prototype.getURLParam = function(key) {
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

/**
 * Check if running on localhost
 * @returns {boolean}
 */
URLService.prototype.isLocalHost = function() {
  var hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.indexOf('192.168.') === 0 ||
         hostname.indexOf('10.') === 0;
};

/**
 * Emit event
 * @param {string} event
 * @param {*} data
 */
URLService.prototype.emit = function(event, data) {
  if (typeof window !== 'undefined' && window.eventBus) {
    window.eventBus.emit('url:' + event, data);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = URLService;
} else if (typeof window !== 'undefined') {
  window.URLService = URLService;
}
