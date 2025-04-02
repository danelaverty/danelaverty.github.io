// src/App.js
// Main application class

(function(ChakraApp) {
  /**
   * Main application class
   */
  ChakraApp.App = function() {
    // Controllers
    this.zoomController = null;
    this.uiController = null;
    this.keyboardController = null;
    this.viewManager = null;
    
    // Flag to track initialization status
    this.initialized = false;
  };
  
  /**
   * Initialize the application
   */
  ChakraApp.App.prototype.init = function() {
    if (this.initialized) return;
    
    var self = this;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        self._initializeApp();
      });
    } else {
      this._initializeApp();
    }
  };
  
  /**
   * Initialize all application components
   * @private
   */
  ChakraApp.App.prototype._initializeApp = function() {
    // Create view manager
    this.viewManager = new ChakraApp.ViewManager();
    
    // Create controllers
    this.zoomController = new ChakraApp.ZoomController();
    this.uiController = new ChakraApp.UIController();
    this.keyboardController = new ChakraApp.KeyboardController();
    
    // Initialize controllers
    this.zoomController.init();
    this.uiController.init();
    this.keyboardController.init();
    
    // Initialize view manager
    this.viewManager.init();
    
    // Load data from storage
    var dataLoaded = ChakraApp.appState.loadFromStorage();
    
    // If no data was loaded, create a sample circle
    if (!dataLoaded) {
      this._createSampleData();
    }
    
    // Render all views based on state
    this.viewManager.renderAllViews();
    
    // Set initialized flag
    this.initialized = true;
    
    console.log('Application initialized');
  };
  
  /**
   * Create sample data for first-time users
   * @private
   */
  ChakraApp.App.prototype._createSampleData = function() {
    // Create a welcome circle
    var welcomeCircle = ChakraApp.appState.addCircle({
      x: 200,
      y: 200,
      color: '#4B0082', // Indigo
      name: 'Welcome',
      element: 'air'
    });
    
    // Create some sample squares for the welcome circle
    ChakraApp.appState.addSquare({
      circleId: welcomeCircle.id,
      x: 150,
      y: 150,
      color: ChakraApp.Config.attributeInfo.treasure.color,
      name: 'Sample Gem',
      attribute: 'treasure'
    });
    
    ChakraApp.appState.addSquare({
      circleId: welcomeCircle.id,
      x: 250,
      y: 150,
      color: ChakraApp.Config.attributeInfo.door.color,
      name: 'Sample Mountain',
      attribute: 'door'
    });
    
    // Create a Me square
    ChakraApp.appState.addSquare({
      circleId: welcomeCircle.id,
      x: 200,
      y: 250,
      color: '#FFCC88',
      name: 'Me',
      isMe: true
    });
    
    // Save the initial state
    ChakraApp.appState.saveToStorage();
  };
  
  /**
   * Clean up application resources
   */
  ChakraApp.App.prototype.destroy = function() {
    // Clean up controllers
    if (this.zoomController) {
      this.zoomController.destroy();
    }
    
    if (this.uiController) {
      this.uiController.destroy();
    }
    
    if (this.keyboardController) {
      this.keyboardController.destroy();
    }
    
    // Clean up view manager
    if (this.viewManager) {
      this.viewManager.destroy();
    }
    
    // Clear event listeners
    ChakraApp.EventBus.clear();
    
    // Reset initialization flag
    this.initialized = false;
  };
  
  // Create app instance
  ChakraApp.app = new ChakraApp.App();
  
  // Auto-initialize when window loads
  window.addEventListener('load', function() {
    ChakraApp.app.init();
  });
  
})(window.ChakraApp = window.ChakraApp || {});
