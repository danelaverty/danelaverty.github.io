// src/models/BaseModel.js
// Base model with common functionality

(function(ChakraApp) {
  /**
   * Base model class with observable pattern
   * @param {Object} data - Model data
   */
  ChakraApp.BaseModel = function(data) {
    // Inherit from Observable
    ChakraApp.Observable.call(this);
    
    // Initialize with data or defaults
    data = data || {};
    this.id = data.id || ChakraApp.Utils.generateId();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  };
  
  // BaseModel methods
  ChakraApp.BaseModel.prototype = {
    update: function(changes) {
      // Apply changes to the model
      for (var key in changes) {
        if (changes.hasOwnProperty(key)) {
          this[key] = changes[key];
        }
      }
      
      // Update timestamp
      this.updatedAt = new Date();
      
      // Notify observers
      this.notify({ type: 'update', model: this });
      
      return this;
    },
    
    toJSON: function() {
      return {
        id: this.id,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  };
  
  // Set constructor property back to BaseModel
  ChakraApp.BaseModel.prototype.constructor = ChakraApp.BaseModel;
  
})(window.ChakraApp = window.ChakraApp || {});
