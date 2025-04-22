// src/App.js
// Main application class (modified to use controller factory)

(function(ChakraApp) {
  /**
   * Main application class
   */
  ChakraApp.App = function() {
    // Controllers
    this.controllers = null;
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
  // Initialize overlapping groups array
  ChakraApp.overlappingGroups = [];
  
  // Load panel state from localStorage
  if (ChakraApp.appState._loadPanelState) {
    ChakraApp.appState._loadPanelState();
  }
  
  // Initialize concept panels
  if (ChakraApp.ConceptPanelManager) {
    ChakraApp.ConceptPanelManager.initialize();
  }
  
  // Create view manager
  this.viewManager = new ChakraApp.ViewManager();
  
  // Create controllers using factory
  this.controllers = ChakraApp.ControllerFactory.createControllers();
  
  // Create and initialize keyboard controller separately
  this.keyboardController = new ChakraApp.KeyboardController();
  this.keyboardController.init();
  
  // Initialize view manager
  this.viewManager.init();
  
  // Create toggle buttons AFTER controllers are initialized
  if (ChakraApp.PanelManager) {
    ChakraApp.PanelManager.createToggleButtonsForPanels();
  }
  /*if (ChakraApp.ConceptPanelManager) {
    ChakraApp.ConceptPanelManager.createToggleButtons();
  }*/
  
  // Initialize overlapping squares manager
  ChakraApp.OverlappingSquaresManager.init();
  
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
    // Clean up controllers using factory
    if (this.controllers) {
      ChakraApp.ControllerFactory.destroyControllers(this.controllers);
      this.controllers = null;
    }
    
    // Clean up keyboard controller
    if (this.keyboardController) {
      this.keyboardController.destroy();
      this.keyboardController = null;
    }
    
    // Clean up view manager
    if (this.viewManager) {
      this.viewManager.destroy();
      this.viewManager = null;
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
