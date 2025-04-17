// src/models/Circle.js
// Circle model implementation with minimal code

(function(ChakraApp) {
  /**
   * Circle model
   * @param {Object} data - Circle data
   */
  ChakraApp.Circle = function(data) {
    // Call parent constructor
    ChakraApp.BaseModel.call(this, data);
    
    // Initialize with data or defaults
    data = data || {};
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.color = data.color || '#FF0000';
    this.name = data.name || '???';
    this.element = data.element || null;
    this.crystal = data.crystal || null;
    this.closestSquareName = data.closestSquareName || null;
    this.squareCount = data.squareCount || 0;
    this.documentId = data.documentId || null;
    this.size = data.size || 20;
    this.selected = data.selected || false;
    this.characteristics = data.characteristics || {};
  };
  
  // Inherit from BaseModel
  ChakraApp.Circle.prototype = Object.create(ChakraApp.BaseModel.prototype);
  ChakraApp.Circle.prototype.constructor = ChakraApp.Circle;
  
  // Circle-specific methods
  ChakraApp.Circle.prototype._getEventType = function(action) {
    var types = {
      'updated': ChakraApp.EventTypes.CIRCLE_UPDATED,
      'selected': ChakraApp.EventTypes.CIRCLE_SELECTED,
      'deselected': ChakraApp.EventTypes.CIRCLE_DESELECTED
    };
    return types[action];
  };
  
  ChakraApp.Circle.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Circle-specific properties
    json.x = this.x;
    json.y = this.y;
    json.color = this.color;
    json.name = this.name;
    json.element = this.element;
    json.crystal = this.crystal;
    json.closestSquareName = this.closestSquareName;
    json.size = this.size;
    json.squareCount = this.squareCount;
    json.characteristics = this.characteristics;
    json.documentId = this.documentId;
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
