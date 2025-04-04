// src/models/Circle.js
// Circle model implementation

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

		// Core properties
		this.x = data.x || 0;
		this.y = data.y || 0;
		this.color = data.color || '#FF0000';
		this.name = data.name || '???';
		this.element = data.element || null;
		this.crystal = data.crystal || null;
		this.closestSquareName = data.closestSquareName || null;
		this.squareCount = data.squareCount || 0;
		this.documentId = data.documentId || null; // Add reference to parent document

		// Additional properties
		this.size = data.size || 20; // Fixed size
		this.selected = data.selected || false;

		this.characteristics = data.characteristics || {};
	};
  
  // Inherit from BaseModel
  ChakraApp.Circle.prototype = Object.create(ChakraApp.BaseModel.prototype);
  
  // Circle-specific methods
  ChakraApp.Circle.prototype.update = function(changes) {
    // Call parent method
    ChakraApp.BaseModel.prototype.update.call(this, changes);
    
    // Publish event for reactive updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_UPDATED, this);
    
    return this;
  };
  
  ChakraApp.Circle.prototype.select = function() {
    if (!this.selected) {
      this.selected = true;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_SELECTED, this);
      this.notify({ type: 'select', model: this });
    }
    return this;
  };
  
  ChakraApp.Circle.prototype.deselect = function() {
    if (this.selected) {
      this.selected = false;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DESELECTED, this);
      this.notify({ type: 'deselect', model: this });
    }
    return this;
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
	  json.characteristics = this.characteristics;
	  json.documentId = this.documentId; // Add documentId to JSON

	  return json;
  };
  
  // Set constructor property back to Circle
  ChakraApp.Circle.prototype.constructor = ChakraApp.Circle;
  
})(window.ChakraApp = window.ChakraApp || {});
