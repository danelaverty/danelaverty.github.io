// src/models/Square.js
// Square model implementation

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
    
    // Core properties
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.color = data.color || '#FFFFFF';
    this.name = data.name || '???';
    this.attribute = data.attribute || null;
    this.circleId = data.circleId || null;
    this.isMe = data.isMe || false;
    this.isBold = data.isBold || false;
    this.tabId = data.tabId || null;
    
    // Additional properties
    this.size = data.size || 30; // Fixed size
    this.selected = data.selected || false;
    this.visible = data.visible !== undefined ? data.visible : true;
  };
  
  // Inherit from BaseModel
  ChakraApp.Square.prototype = Object.create(ChakraApp.BaseModel.prototype);
  
  // Square-specific methods
  ChakraApp.Square.prototype.update = function(changes) {
    // Call parent method
    ChakraApp.BaseModel.prototype.update.call(this, changes);
    
    // Publish event for reactive updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_UPDATED, this);
    
    return this;
  };
  
  ChakraApp.Square.prototype.select = function() {
    if (!this.selected) {
      this.selected = true;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_SELECTED, this);
      this.notify({ type: 'select', model: this });
    }
    return this;
  };
  
  ChakraApp.Square.prototype.deselect = function() {
    if (this.selected) {
      this.selected = false;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_DESELECTED, this);
      this.notify({ type: 'deselect', model: this });
    }
    return this;
  };
  
  ChakraApp.Square.prototype.show = function() {
    if (!this.visible) {
      this.visible = true;
      this.notify({ type: 'visibility', model: this, isVisible: true });
    }
    return this;
  };
  
  ChakraApp.Square.prototype.hide = function() {
    if (this.visible) {
      this.visible = false;
      this.notify({ type: 'visibility', model: this, isVisible: false });
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
    json.isMe = this.isMe;
    json.size = this.size;
    json.isBold = this.isBold;
    json.tabId = this.tabId;
    
    return json;
  };
  
  // Set constructor property back to Square
  ChakraApp.Square.prototype.constructor = ChakraApp.Square;
  
})(window.ChakraApp = window.ChakraApp || {});
