// src/models/Document.js
// Document model implementation with listType support

(function(ChakraApp) {
  /**
   * Document model
   * @param {Object} data - Document data
   */
  ChakraApp.Document = function(data) {
    // Call parent constructor
    ChakraApp.BaseModel.call(this, data);
    
    // Initialize with data or defaults
    data = data || {};
    this.name = data.name || this._generateDefaultName();
    this.circleType = data.circleType || 'standard';
    this.selected = data.selected || false;
    
    // Keep the panelId for backward compatibility but primarily use circleType
    this.panelId = data.panelId;
    
    // Add zoomLevel property
    this.zoomLevel = data.zoomLevel || null;
    
    // NEW: Add listType property - 'list1' or 'list2'
    // Default to 'list1' for existing documents to maintain compatibility
    this.listType = data.listType || 'list1';
  };
  
  // Inherit from BaseModel
  ChakraApp.Document.prototype = Object.create(ChakraApp.BaseModel.prototype);
  ChakraApp.Document.prototype.constructor = ChakraApp.Document;
  
  // Document-specific methods
  ChakraApp.Document.prototype._getEventType = function(action) {
    var types = {
      'updated': ChakraApp.EventTypes.DOCUMENT_UPDATED,
      'selected': ChakraApp.EventTypes.DOCUMENT_SELECTED,
      'deselected': ChakraApp.EventTypes.DOCUMENT_DESELECTED
    };
    return types[action];
  };
  
  // Generate a default name based on current date/time
  ChakraApp.Document.prototype._generateDefaultName = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2, '0');
    var day = now.getDate().toString().padStart(2, '0');
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    
    return year + '-' + month + '-' + day;
  };
  
  ChakraApp.Document.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Document-specific properties
    json.name = this.name;
    json.panelId = this.panelId;
    json.circleType = this.circleType;
    json.listType = this.listType; // NEW: Include listType in JSON
    
    // Add zoomLevel if it exists
    if (this.zoomLevel) {
      json.zoomLevel = this.zoomLevel;
    }
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
