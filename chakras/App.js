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

  ChakraApp.App.prototype.fixCircleTypes = function() {
  var fixApplied = false;
  
  // First make sure the appropriate types exist in Config
  this._ensureCircleTypesConfigured();
  
  // Update existing circles based on color or other attributes
  ChakraApp.appState.circles.forEach(function(circle) {
    var originalType = circle.circleType;
    var newType = null;
    
    // Is it already classified?
    if (circle.circleType === 'gem' || circle.circleType === 'triangle' || 
        circle.circleType === 'standard' || circle.circleType === 'hexagon') {  // Add hexagon
      return; // Already has a valid type
    }
    
    // Set type based on color if not already set
    if (!circle.circleType || circle.circleType === 'standard') {
      if (circle.color === '#4a6fc9') {
        newType = 'gem';
      } else if (circle.color === '#88B66d') {
        newType = 'triangle';
      } else if (circle.color === '#9932CC') {  // Add hexagon color check
        newType = 'hexagon';
      }
    }
    
    // Apply the new type if determined
    if (newType && newType !== circle.circleType) {
      circle.circleType = newType;
      fixApplied = true;
      console.log("Fixed circle", circle.id, "to type '" + newType + "'");
    }
  });
  
  if (fixApplied) {
    // Save the fixed state
    ChakraApp.appState.saveToStorageNow();
    console.log("Saved fixed circle types to storage");
  }
  
  return fixApplied;
};

ChakraApp.App.prototype._ensureCircleTypesConfigured = function() {
  // Make sure we have Config.circleTypes defined
  if (!ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes = [];
  }
  
  // Check if we have a gem type defined
  var gemTypeExists = ChakraApp.Config.circleTypes.some(function(type) {
    return type.id === 'gem' || (type.shape === 'gem');
  });
  
  if (!gemTypeExists) {
    var gemCircleType = {
      id: 'gem',
      name: 'Themes',
      description: 'Themes & Values',
      shape: 'gem',
      color: '#4a6fc9',
      position: 3
    };
    ChakraApp.Config.circleTypes.push(gemCircleType);
    console.log("Added missing gem circle type configuration");
  }
  
  // Check if we have a star type defined
  var starTypeExists = ChakraApp.Config.circleTypes.some(function(type) {
    return type.id === 'star' || (type.shape === 'star');
  });
  
  if (!starTypeExists) {
    var starCircleType = {
      id: 'star',
      name: 'Moves',
      description: 'Actions & Strategies',
      shape: 'star',
      color: '#FF9933',
      position: 4
    };
    ChakraApp.Config.circleTypes.push(starCircleType);
    console.log("Added missing star circle type configuration");
  }
  
  // Check if we have a hexagon type defined (ADD THIS)
  var hexagonTypeExists = ChakraApp.Config.circleTypes.some(function(type) {
    return type.id === 'hexagon' || (type.shape === 'hexagon');
  });
  
  if (!hexagonTypeExists) {
    var hexagonCircleType = {
      id: 'hexagon',
      name: 'Complexes',
      description: 'Complex Systems & Patterns',
      shape: 'hexagon',
      color: '#9932CC',
      position: 5
    };
    ChakraApp.Config.circleTypes.push(hexagonCircleType);
    console.log("Added missing hexagon circle type configuration");
  }
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
    this.controllers.zoom = new ChakraApp.ZoomController();
  this.controllers.zoom.init();
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

  if (dataLoaded) {
    // Clean up selectedDocumentIds to remove 'left' panel id
    if (ChakraApp.appState.cleanupSelectedDocumentIds) {
      ChakraApp.appState.cleanupSelectedDocumentIds();
    }
    
    // Fix any circles with incorrect types
    this.fixCircleTypes();
    
    // Migrate document state
    if (ChakraApp.appState._migrateDocumentState) {
      ChakraApp.appState._migrateDocumentState();
    }
  } else {
    this.createSampleData();
  }
};
  

  ChakraApp.App.prototype.createSampleData = function() {
    var welcomeCircle = this.createWelcomeCircle();
    this.saveSampleData();
  };
  
  
// Fixed to ensure circles are created with appropriate types
ChakraApp.App.prototype.createWelcomeCircle = function() {
  return ChakraApp.appState.addCircle({
    x: 200,
    y: 200,
    color: '#4B0082',
    name: 'Welcome',
    circleType: 'standard' // Explicitly set type
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
