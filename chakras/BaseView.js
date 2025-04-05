// src/views/BaseView.js
// Base class for all views

(function(ChakraApp) {
  /**
   * Base view class
   * @param {Object} viewModel - View model instance
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.BaseView = function(viewModel, parentElement) {
    this.viewModel = viewModel;
    this.parentElement = parentElement;
    this.element = null;
  };
  
  // Base methods
  ChakraApp.BaseView.prototype = {
    render: function() {
      // Override in derived classes
      throw new Error('render() must be implemented by derived classes');
    },
    
    update: function() {
      // Override in derived classes
      throw new Error('update() must be implemented by derived classes');
    },
    
    remove: function() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    },
    
    destroy: function() {
      this.remove();
      // Clean up any event listeners or other resources
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
