// src/models/Tab.js
// Tab model implementation with minimal code

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
    this.name = data.name || "Tab " + (data.index || 1);
    this.circleId = data.circleId;
    this.index = data.index || 0;
    this.selected = data.selected || false;
  };
  
  // Inherit from BaseModel
  ChakraApp.Tab.prototype = Object.create(ChakraApp.BaseModel.prototype);
  ChakraApp.Tab.prototype.constructor = ChakraApp.Tab;
  
  // Tab-specific methods
  ChakraApp.Tab.prototype._getEventType = function(action) {
    var types = {
      'updated': ChakraApp.EventTypes.TAB_UPDATED,
      'selected': ChakraApp.EventTypes.TAB_SELECTED,
      'deselected': ChakraApp.EventTypes.TAB_DESELECTED
    };
    return types[action];
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
})(window.ChakraApp = window.ChakraApp || {});
