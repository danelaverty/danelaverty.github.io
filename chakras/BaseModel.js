// src/models/BaseModel.js
// Minimal base model with common functionality

(function(ChakraApp) {
  /**
   * Base model with observable pattern
   * @param {Object} data - Model data
   */
  ChakraApp.BaseModel = function(data) {
    data = data || {};
    this.id = data.id || ChakraApp.Utils.generateId();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.observers = [];
  };
  
  ChakraApp.BaseModel.prototype = {
	  update: function(changes) {
  var changed = false;
  
  for (var key in changes) {
    if (changes.hasOwnProperty(key) && this[key] !== changes[key]) {
      this[key] = changes[key];
      changed = true;
    }
  }
  
  if (changed) {
    this.updatedAt = new Date();
    this._notify({ type: 'update', model: this });
    
    var eventType = this._getEventType('updated');
    if (eventType) {
      ChakraApp.EventBus.publish(eventType, this);
    }
  }
  
  return this;
},
    
    subscribe: function(observer) {
      this.observers.push(observer);
      var self = this;
      return function() {
        var idx = self.observers.indexOf(observer);
        if (idx > -1) self.observers.splice(idx, 1);
      };
    },
    
    _notify: function(data) {
      for (var i = 0; i < this.observers.length; i++) {
        try { 
          this.observers[i](data); 
        } catch (e) { 
          console.error(e); 
        }
      }
    },
    
    select: function() {
      if (!this.selected) {
        this.selected = true;
        this._notify({type: 'select', model: this});
        this._publishEvent(this._getEventType('selected'), this);
      }
      return this;
    },
    
    deselect: function() {
      if (this.selected) {
        this.selected = false;
        this._notify({type: 'deselect', model: this});
        this._publishEvent(this._getEventType('deselected'), this);
      }
      return this;
    },
    
    _publishEvent: function(eventType, data) {
      if (eventType && ChakraApp.EventBus) {
        ChakraApp.EventBus.publish(eventType, data);
      }
    },
    
    _getEventType: function(action) {
      return null; // Override in subclasses
    },
    
    toJSON: function() {
      return {
        id: this.id,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  };
})(window.ChakraApp = window.ChakraApp || {});
