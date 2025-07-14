// src/models/CircleReference.js
// Circle reference model - references to circles within tabs

(function(ChakraApp) {
  /**
   * CircleReference model - represents a reference to a circle within a tab
   * @param {Object} data - CircleReference data
   */
  ChakraApp.CircleReference = function(data) {
    // Call parent constructor
    ChakraApp.BaseModel.call(this, data);
    
    // Initialize with data or defaults
    data = data || {};
    this.sourceCircleId = data.sourceCircleId; // The circle this references
    this.tabId = data.tabId; // The tab this reference belongs to
    this.x = data.x || 50; // Position in center panel
    this.y = data.y || 50;
    this.selected = data.selected || false;
    this.fieldRadius = data.fieldRadius || 80; // New field radius property with default
  };
  
  // Inherit from BaseModel
  ChakraApp.CircleReference.prototype = Object.create(ChakraApp.BaseModel.prototype);
  ChakraApp.CircleReference.prototype.constructor = ChakraApp.CircleReference;
  
  // CircleReference-specific methods
  ChakraApp.CircleReference.prototype._getEventType = function(action) {
    var types = {
      'updated': ChakraApp.EventTypes.CIRCLE_REFERENCE_UPDATED,
      'selected': ChakraApp.EventTypes.CIRCLE_REFERENCE_SELECTED,
      'deselected': ChakraApp.EventTypes.CIRCLE_REFERENCE_DESELECTED
    };
    return types[action];
  };
  
  /**
   * Update field radius
   * @param {number} newRadius - New field radius
   */
  ChakraApp.CircleReference.prototype.updateFieldRadius = function(newRadius) {
    // Constrain radius between reasonable limits
    var minRadius = 20;
    var maxRadius = 300;
    var oldRadius = this.fieldRadius;
    this.fieldRadius = Math.max(minRadius, Math.min(maxRadius, newRadius));
    
    // Only trigger update if radius actually changed
    if (this.fieldRadius !== oldRadius) {
      // Use the AppState update method to ensure proper view updates
      ChakraApp.appState.updateCircleReference(this.id, { fieldRadius: this.fieldRadius });
    }
  };
  
  /**
   * Increase field radius
   */
  ChakraApp.CircleReference.prototype.increaseFieldRadius = function() {
    this.updateFieldRadius(this.fieldRadius + 20);
  };
  
  /**
   * Decrease field radius
   */
  ChakraApp.CircleReference.prototype.decreaseFieldRadius = function() {
    this.updateFieldRadius(this.fieldRadius - 20);
  };
  
  /**
   * Get the source circle this reference points to
   * @returns {Object|null} Source circle or null if not found
   */
  ChakraApp.CircleReference.prototype.getSourceCircle = function() {
    return ChakraApp.appState.getCircle(this.sourceCircleId);
  };
  
  /**
   * Get display properties from source circle
   * @returns {Object} Display properties (name, color, icon, etc.)
   */
  ChakraApp.CircleReference.prototype.getDisplayProperties = function() {
    var sourceCircle = this.getSourceCircle();
    if (!sourceCircle) {
      return {
        name: '[Deleted Circle]',
        color: '#666',
        icon: '?',
        circleType: 'standard'
      };
    }
    
    // Find the circle type configuration
    var circleTypeConfig = null;
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
        return type.id === sourceCircle.circleType;
      });
    }
    
    // Make sure we're getting the most current color from the source circle
    var currentColor = sourceCircle.color || (circleTypeConfig ? circleTypeConfig.color : '#666');
    
    return {
      name: sourceCircle.name,
      color: currentColor,
      icon: circleTypeConfig ? circleTypeConfig.shape : '●',
      circleType: sourceCircle.circleType
    };
  };
  
  /**
   * Check if this reference is valid (source circle still exists)
   * @returns {boolean} True if source circle exists
   */
  ChakraApp.CircleReference.prototype.isValid = function() {
    return this.getSourceCircle() !== null;
  };
  
  ChakraApp.CircleReference.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add CircleReference-specific properties
    json.sourceCircleId = this.sourceCircleId;
    json.tabId = this.tabId;
    json.x = this.x;
    json.y = this.y;
    json.fieldRadius = this.fieldRadius; // Include field radius in serialization
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
