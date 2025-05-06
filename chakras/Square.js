// src/models/Square.js
// Square model implementation with minimal code

(function(ChakraApp) {
  /**
   * Square model
   * @param {Object} data - Square data
   */
  ChakraApp.Square = function(data) {
    // Call parent constructor
    ChakraApp.BaseModel.call(this, data);
    
    // Initialize with data or defaults
    data = data || {};
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.color = data.color || '#FFFFFF';
    this.name = data.name || '???';
    this.attribute = data.attribute || null;
    this.circleId = data.circleId || null;
    this.isBold = data.isBold || false;
    this.tabId = data.tabId || null;
    this.size = data.size || 30;
    this.selected = data.selected || false;
    this.visible = data.visible !== undefined ? data.visible : true;
  };
  
  // Inherit from BaseModel
  ChakraApp.Square.prototype = Object.create(ChakraApp.BaseModel.prototype);
  ChakraApp.Square.prototype.constructor = ChakraApp.Square;
  
  // Square-specific methods
  ChakraApp.Square.prototype._getEventType = function(action) {
    var types = {
      'updated': ChakraApp.EventTypes.SQUARE_UPDATED,
      'selected': ChakraApp.EventTypes.SQUARE_SELECTED,
      'deselected': ChakraApp.EventTypes.SQUARE_DESELECTED
    };
    return types[action];
  };
  
  ChakraApp.Square.prototype.show = function() {
  if (!this.visible) {
    this.visible = true;
    this._notify({type: 'visibility', model: this, isVisible: true});
    
    // Try to update the actual DOM element if it exists
    var squareElement = document.querySelector('.square[data-id="' + this.id + '"]');
    if (squareElement) {
      squareElement.style.display = 'flex';
    }
  }
  return this;
};
  
  ChakraApp.Square.prototype.hide = function() {
    if (this.visible) {
      this.visible = false;
      this._notify({type: 'visibility', model: this, isVisible: false});
    }
    return this;
  };
  
  ChakraApp.Square.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Square-specific properties
    json.x = this.x;
    json.y = this.y;
    json.color = this.color;
    json.name = this.name;
    json.attribute = this.attribute;
    json.circleId = this.circleId;
    json.size = this.size;
    json.isBold = this.isBold;
    json.tabId = this.tabId;
    json.visible = this.visible;
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
