// src/models/Document.js
// Document model implementation

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
    
    // Core properties
    this.name = data.name || this._generateDefaultName();
    this.panelId = data.panelId || 'left'; // New property: 'left', 'right', or 'bottom'
    
    // Additional properties
    this.selected = data.selected || false;
  };
  
  // Inherit from BaseModel
  ChakraApp.Document.prototype = Object.create(ChakraApp.BaseModel.prototype);
  
  // Document-specific methods
  ChakraApp.Document.prototype.update = function(changes) {
    // Call parent method
    ChakraApp.BaseModel.prototype.update.call(this, changes);
    
    // Publish event for reactive updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_UPDATED, this);
    
    return this;
  };
  
  // Generate a default name based on current date/time and panel
  ChakraApp.Document.prototype._generateDefaultName = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2, '0');
    var day = now.getDate().toString().padStart(2, '0');
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
  };
  
  ChakraApp.Document.prototype.select = function() {
    if (!this.selected) {
      this.selected = true;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_SELECTED, this);
      this.notify({ type: 'select', model: this });
    }
    return this;
  };
  
  ChakraApp.Document.prototype.deselect = function() {
    if (this.selected) {
      this.selected = false;
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_DESELECTED, this);
      this.notify({ type: 'deselect', model: this });
    }
    return this;
  };
  
  ChakraApp.Document.prototype.toJSON = function() {
    // Get base properties
    var json = ChakraApp.BaseModel.prototype.toJSON.call(this);
    
    // Add Document-specific properties
    json.name = this.name;
    json.panelId = this.panelId; // Include panelId in serialization
    
    return json;
  };
  
  // Set constructor property back to Document
  ChakraApp.Document.prototype.constructor = ChakraApp.Document;
  
})(window.ChakraApp = window.ChakraApp || {});
