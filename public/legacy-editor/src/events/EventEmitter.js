/**
 * EventEmitter - Lightweight Pub/Sub for Service Communication
 * ES5 Compatible - No modern syntax
 */

/**
 * @constructor
 */
function EventEmitter() {
  this.events = {};
  this.onceEvents = {};
}

/**
 * Subscribe to an event
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
EventEmitter.prototype.on = function(event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
  
  // Return unsubscribe function
  var self = this;
  return function() {
    self.off(event, callback);
  };
};

/**
 * Subscribe to an event once
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
EventEmitter.prototype.once = function(event, callback) {
  if (!this.onceEvents[event]) {
    this.onceEvents[event] = [];
  }
  this.onceEvents[event].push(callback);
};

/**
 * Unsubscribe from an event
 * @param {string} event - Event name
 * @param {Function} callback - Callback to remove
 */
EventEmitter.prototype.off = function(event, callback) {
  if (this.events[event]) {
    this.events[event] = this.events[event].filter(function(cb) {
      return cb !== callback;
    });
  }
  if (this.onceEvents[event]) {
    this.onceEvents[event] = this.onceEvents[event].filter(function(cb) {
      return cb !== callback;
    });
  }
};

/**
 * Emit an event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
EventEmitter.prototype.emit = function(event, data) {
  var self = this;
  
  // Emit to regular listeners
  if (this.events[event]) {
    this.events[event].forEach(function(callback) {
      try {
        callback(data);
      } catch (err) {
        console.error('EventEmitter callback error:', err);
      }
    });
  }
  
  // Emit to once listeners and clear them
  if (this.onceEvents[event]) {
    this.onceEvents[event].forEach(function(callback) {
      try {
        callback(data);
      } catch (err) {
        console.error('EventEmitter once callback error:', err);
      }
    });
    this.onceEvents[event] = [];
  }
};

/**
 * Remove all listeners for an event
 * @param {string} event - Event name
 */
EventEmitter.prototype.removeAllListeners = function(event) {
  if (event) {
    delete this.events[event];
    delete this.onceEvents[event];
  } else {
    this.events = {};
    this.onceEvents = {};
  }
};

// Create singleton instance
var eventBus = new EventEmitter();

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventEmitter: EventEmitter, eventBus: eventBus };
} else if (typeof window !== 'undefined') {
  window.EventEmitter = EventEmitter;
  window.eventBus = eventBus;
}
