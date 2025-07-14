// src/models/Circle.js
// Circle model implementation with multi-color support

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
    
    // NEW: Support both single color (legacy) and color array (new)
    if (data.colors && Array.isArray(data.colors)) {
      this.colors = data.colors.slice(); // Copy the array
      this.color = data.colors[0] || '#C0C0C0'; // First color for backward compatibility
    } else if (data.color) {
      this.colors = [data.color]; // Convert single color to array
      this.color = data.color;
    } else {
      this.colors = ['#C0C0C0']; // Default color array
      this.color = '#C0C0C0';
    }
    
    this.name = data.name || '???';
    this.crystal = data.crystal || null;
    this.squareCount = data.squareCount || 0;
    this.documentId = data.documentId || null;
    this.size = data.size || 20;
    this.selected = data.selected || false;
    this.characteristics = data.characteristics || {};
    this.indicator = data.indicator || null;
    this.showTabNames = data.showTabNames || false;
    this.text = data.text || null;
    
    // Explicitly set circleType based on the provided value or infer from color
    if (data.circleType) {
      this.circleType = data.circleType;
    } else if (this.color === '#4a6fc9') {
      this.circleType = 'gem';
    } else if (this.color === '#88B66d') {
      this.circleType = 'triangle';
    } else if (this.color === '#9932CC') {
      this.circleType = 'hexagon';
    } else {
      this.circleType = 'standard';
    }
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
  
  // NEW: Add a color to the circle's color array
  ChakraApp.Circle.prototype.addColor = function(color, crystal) {
    if (!this.colors.includes(color)) {
      this.colors.push(color);
      
      // Update the primary color to the newly added color
      this.color = color;
      if (crystal) {
        this.crystal = crystal;
      }
      
      this.update({ 
        colors: this.colors.slice(), // Copy array
        color: this.color,
        crystal: this.crystal
      });
    }
    return this.colors;
  };
  
  // NEW: Remove a color from the circle's color array
  ChakraApp.Circle.prototype.removeColor = function(color) {
    var index = this.colors.indexOf(color);
    if (index > -1) {
      this.colors.splice(index, 1);
      
      // If we removed the primary color, set a new primary
      if (this.color === color && this.colors.length > 0) {
        this.color = this.colors[0];
      } else if (this.colors.length === 0) {
        // If no colors left, add default
        this.colors = ['#C0C0C0'];
        this.color = '#C0C0C0';
        this.crystal = null;
      }
      
      this.update({ 
        colors: this.colors.slice(), // Copy array
        color: this.color,
        crystal: this.crystal
      });
    }
    return this.colors;
  };
  
  // NEW: Set colors array (replaces all colors)
  ChakraApp.Circle.prototype.setColors = function(colors, crystal) {
    if (Array.isArray(colors) && colors.length > 0) {
      this.colors = colors.slice(); // Copy array
      this.color = colors[0]; // First color becomes primary
      if (crystal) {
        this.crystal = crystal;
      }
      
      this.update({ 
        colors: this.colors.slice(),
        color: this.color,
        crystal: this.crystal
      });
    }
    return this.colors;
  };
  
  // NEW: Get current colors array
  ChakraApp.Circle.prototype.getColors = function() {
    return this.colors ? this.colors.slice() : [this.color || '#C0C0C0'];
  };
  
  // NEW: Check if circle has multiple colors
  ChakraApp.Circle.prototype.hasMultipleColors = function() {
    return this.colors && this.colors.length > 1;
  };
  
  // NEW: Toggle showTabNames mode
  ChakraApp.Circle.prototype.toggleShowTabNames = function() {
    this.showTabNames = !this.showTabNames;
    this.update({ showTabNames: this.showTabNames });
    return this.showTabNames;
  };
  
  // NEW: Update text content
  ChakraApp.Circle.prototype.updateText = function(text) {
    this.text = text;
    this.update({ text: text });
    return this.text;
  };
  
  ChakraApp.Circle.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Circle-specific properties
    json.x = this.x;
    json.y = this.y;
    json.color = this.color;
    json.colors = this.colors ? this.colors.slice() : [this.color]; // NEW: Include colors array
    json.name = this.name;
    json.crystal = this.crystal;
    json.size = this.size;
    json.squareCount = this.squareCount;
    json.characteristics = this.characteristics;
    json.documentId = this.documentId;
    json.circleType = this.circleType;
    json.indicator = this.indicator;
    json.showTabNames = this.showTabNames;
    json.text = this.text;
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
