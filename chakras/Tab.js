// src/models/Tab.js
(function(ChakraApp) {
  /**
   * Tab model
   * @param {Object} data - Tab data
   */
  ChakraApp.Tab = function(data) {
    // Call parent constructor
    ChakraApp.BaseModel.call(this, data);
    
    // Initialize with data or defaults
    data = data || {};
    
    // Core properties
    this.name = data.name || "Tab " + (data.index || 1);
    this.circleId = data.circleId;
    this.index = data.index || 0;
    this.selected = data.selected || false;
  };
  
  // Inherit from BaseModel
  ChakraApp.Tab.prototype = Object.create(ChakraApp.BaseModel.prototype);
  
  // Tab-specific methods
  ChakraApp.Tab.prototype.update = function(changes) {
    // Call parent method
    ChakraApp.BaseModel.prototype.update.call(this, changes);
    
    // Publish event for reactive updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_UPDATED, this);
    
    return this;
  };
  
  ChakraApp.Tab.prototype.select = function() {
    if (!this.selected) {
      this.selected = true;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_SELECTED, this);
      this.notify({ type: 'select', model: this });
    }
    return this;
  };
  
  ChakraApp.Tab.prototype.deselect = function() {
    if (this.selected) {
      this.selected = false;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_DESELECTED, this);
      this.notify({ type: 'deselect', model: this });
    }
    return this;
  };
  
  ChakraApp.Tab.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Tab-specific properties
    json.name = this.name;
    json.circleId = this.circleId;
    json.index = this.index;
    
    return json;
  };
  
  // Set constructor property back to Tab
  ChakraApp.Tab.prototype.constructor = ChakraApp.Tab;
  
})(window.ChakraApp = window.ChakraApp || {});
