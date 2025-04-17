// src/models/Document.js
// Document model implementation with minimal code

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
    this.panelId = data.panelId || 'left';
    this.selected = data.selected || false;
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
    
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
  };
  
  ChakraApp.Document.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Document-specific properties
    json.name = this.name;
    json.panelId = this.panelId;
    
    return json;
  };
})(window.ChakraApp = window.ChakraApp || {});
