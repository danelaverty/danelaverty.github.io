// src/controllers/BaseController.js
// Base controller class

(function(ChakraApp) {
  /**
   * Base controller class
   */
  ChakraApp.BaseController = function() {
    this.initialized = false;
  };
  
  ChakraApp.BaseController.prototype = {
    init: function() {
      if (this.initialized) return;
      this.initialized = true;
    },
    
    destroy: function() {
      this.initialized = false;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
