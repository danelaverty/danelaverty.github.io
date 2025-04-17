// src/models/Connection.js
// Connection model implementation with minimal code

(function(ChakraApp) {
  /**
   * Connection model
   * @param {Object} data - Connection data
   */
  ChakraApp.Connection = function(data) {
    // Call parent constructor
    ChakraApp.BaseModel.call(this, data);
    
    // Initialize with data or defaults
    data = data || {};
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.length = data.length || 0;
    this.isHighlighted = data.isHighlighted || false;
    this.isVisible = data.isVisible || false;
  };
  
  // Inherit from BaseModel
  ChakraApp.Connection.prototype = Object.create(ChakraApp.BaseModel.prototype);
  ChakraApp.Connection.prototype.constructor = ChakraApp.Connection;
  
  // Connection-specific methods
  ChakraApp.Connection.prototype._getEventType = function(action) {
    return action === 'updated' ? ChakraApp.EventTypes.CONNECTION_UPDATED : null;
  };
  
  ChakraApp.Connection.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Connection-specific properties
    json.sourceId = this.sourceId;
    json.targetId = this.targetId;
    json.length = this.length;
    json.isHighlighted = this.isHighlighted;
    json.isVisible = this.isVisible;
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
