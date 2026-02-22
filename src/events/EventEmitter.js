function EventEmitter() {
  this.events = {};
  this.onceEvents = {};
}

EventEmitter.prototype.on = function(event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
  
  var self = this;
  return function() {
    self.off(event, callback);
  };
};

EventEmitter.prototype.once = function(event, callback) {
  if (!this.onceEvents[event]) {
    this.onceEvents[event] = [];
  }
  this.onceEvents[event].push(callback);
};

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

EventEmitter.prototype.emit = function(event, data) {
  var self = this;
  
  if (this.events[event]) {
    this.events[event].forEach(function(callback) {
      try {
        callback(data);
      } catch (err) {
        console.error('EventEmitter callback error:', err);
      }
    });
  }
  
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

EventEmitter.prototype.removeAllListeners = function(event) {
  if (event) {
    delete this.events[event];
    delete this.onceEvents[event];
  } else {
    this.events = {};
    this.onceEvents = {};
  }
};

var eventBus = new EventEmitter();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventEmitter: EventEmitter, eventBus: eventBus };
} else if (typeof window !== 'undefined') {
  window.EventEmitter = EventEmitter;
  window.eventBus = eventBus;
}
