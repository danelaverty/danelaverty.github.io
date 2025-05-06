(function(ChakraApp) {
  ChakraApp.App = function() {
    this.controllers = null;
    this.keyboardController = null;
    this.viewManager = null;
    this.initialized = false;
  };
  
  ChakraApp.App.prototype.init = function() {
    if (this.initialized) return;
    
    this.waitForDOMReady();
  };
  
  ChakraApp.App.prototype.waitForDOMReady = function() {
    var self = this;
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        self.initializeAppComponents();
      });
    } else {
      this.initializeAppComponents();
    }
  };
  
  ChakraApp.App.prototype.initializeAppComponents = function() {
    this.initializeOverlappingGroups();
    this.loadPanelState();
    this.initializeConceptPanels();
    this.createViewManager();
    this.createControllers();
    this.initializeViewManager();
    this.createPanelToggleButtons();
    this.initializeOverlappingSquares();
    this.loadOrCreateData();
    this.renderViews();
    this.markAsInitialized();
  };
  
  ChakraApp.App.prototype.initializeOverlappingGroups = function() {
    ChakraApp.overlappingGroups = [];
  };
  
  ChakraApp.App.prototype.loadPanelState = function() {
    if (ChakraApp.appState._loadPanelState) {
      ChakraApp.appState._loadPanelState();
    }
  };
  
  ChakraApp.App.prototype.initializeConceptPanels = function() {
    if (ChakraApp.ConceptPanelManager) {
      ChakraApp.ConceptPanelManager.initialize();
    }
  };
  
  ChakraApp.App.prototype.createViewManager = function() {
    this.viewManager = new ChakraApp.ViewManager();
  };
  
  ChakraApp.App.prototype.createControllers = function() {
    this.controllers = ChakraApp.ControllerFactory.createControllers();
    this.createKeyboardController();
  };
  
  ChakraApp.App.prototype.createKeyboardController = function() {
    this.keyboardController = new ChakraApp.KeyboardController();
    this.keyboardController.init();
  };
  
  ChakraApp.App.prototype.initializeViewManager = function() {
    this.viewManager.init();
  };
  
  ChakraApp.App.prototype.createPanelToggleButtons = function() {
    this.createMainPanelToggleButtons();
    // Commented out in original: this.createConceptPanelToggleButtons();
  };
  
  ChakraApp.App.prototype.createMainPanelToggleButtons = function() {
    if (ChakraApp.PanelManager) {
      ChakraApp.PanelManager.createToggleButtonsForPanels();
    }
  };
  
  ChakraApp.App.prototype.createConceptPanelToggleButtons = function() {
    if (ChakraApp.ConceptPanelManager) {
      ChakraApp.ConceptPanelManager.createToggleButtons();
    }
  };
  
  ChakraApp.App.prototype.initializeOverlappingSquares = function() {
    ChakraApp.OverlappingSquaresManager.init();
  };
  
  ChakraApp.App.prototype.loadOrCreateData = function() {
    var dataLoaded = ChakraApp.appState.loadFromStorage();
    
    if (!dataLoaded) {
      this.createSampleData();
    }
  };
  
  ChakraApp.App.prototype.createSampleData = function() {
    var welcomeCircle = this.createWelcomeCircle();
    this.createSampleGem(welcomeCircle.id);
    this.createSampleMountain(welcomeCircle.id);
    this.saveSampleData();
  };
  
  ChakraApp.App.prototype.createWelcomeCircle = function() {
    return ChakraApp.appState.addCircle({
      x: 200,
      y: 200,
      color: '#4B0082',
      name: 'Welcome',
    });
  };
  
  ChakraApp.App.prototype.createSampleGem = function(circleId) {
    ChakraApp.appState.addSquare({
      circleId: circleId,
      x: 150,
      y: 150,
      color: ChakraApp.Config.attributeInfo.treasure.color,
      name: 'Sample Gem',
      attribute: 'treasure'
    });
  };
  
  ChakraApp.App.prototype.createSampleMountain = function(circleId) {
    ChakraApp.appState.addSquare({
      circleId: circleId,
      x: 250,
      y: 150,
      color: ChakraApp.Config.attributeInfo.door.color,
      name: 'Sample Mountain',
      attribute: 'door'
    });
  };
  
  ChakraApp.App.prototype.saveSampleData = function() {
    ChakraApp.appState.saveToStorage();
  };
  
  ChakraApp.App.prototype.renderViews = function() {
    this.viewManager.renderAllViews();
  };
  
  ChakraApp.App.prototype.markAsInitialized = function() {
    this.initialized = true;
    console.log('Application initialized');
  };
  
  ChakraApp.App.prototype.destroy = function() {
    this.destroyControllers();
    this.destroyKeyboardController();
    this.destroyViewManager();
    this.cleanupEventBus();
    this.resetInitializationFlag();
  };
  
  ChakraApp.App.prototype.destroyControllers = function() {
    if (this.controllers) {
      ChakraApp.ControllerFactory.destroyControllers(this.controllers);
      this.controllers = null;
    }
  };
  
  ChakraApp.App.prototype.destroyKeyboardController = function() {
    if (this.keyboardController) {
      this.keyboardController.destroy();
      this.keyboardController = null;
    }
  };
  
  ChakraApp.App.prototype.destroyViewManager = function() {
    if (this.viewManager) {
      this.viewManager.destroy();
      this.viewManager = null;
    }
  };
  
  ChakraApp.App.prototype.cleanupEventBus = function() {
    ChakraApp.EventBus.clear();
  };
  
  ChakraApp.App.prototype.resetInitializationFlag = function() {
    this.initialized = false;
  };
  
  ChakraApp.app = new ChakraApp.App();
  
  window.addEventListener('load', function() {
    ChakraApp.app.init();
  });
  
})(window.ChakraApp = window.ChakraApp || {});
