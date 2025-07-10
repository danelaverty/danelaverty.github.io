// Enhanced App.js - ResizeController Integration
(function(ChakraApp) {
  ChakraApp.App = function() {
    this.controllers = null;
    this.keyboardController = null;
    this.viewManager = null;
    this.leftPanelManager = null;
    this.resizeController = null; // NEW: ResizeController
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

  ChakraApp.App.prototype.initializeRectangleSelection = function() {
    var centerPanel = document.getElementById('center-panel');
    if (centerPanel && ChakraApp.RectangleSelectionManager) {
      ChakraApp.RectangleSelectionManager.init(centerPanel);
    }
  };
  
  // FIXED: Added ResizeController initialization
  ChakraApp.App.prototype.initializeAppComponents = function() {
    
    this.initializeOverlappingGroups();
    this.loadPanelState();
    this.initializeConceptPanels();
    
    this.loadOrCreateData();
    
    this.initializeLeftPanelManager();
    this.initializeResizeController(); // NEW: Initialize resize controller after left panel manager
    
    this.createAttributeController();
    this.createControllers();
    
    this.createViewManager();
    this.initializeViewManager();
    
    this.createPanelToggleButtons();
    
    this.initializeOverlappingSquares();
    this.initializeRectangleSelection();
    
    this.renderViews();
    
    if (ChakraApp.app.viewManager && ChakraApp.app.viewManager._updateCircleConnectionViews) {
      ChakraApp.app.viewManager._updateCircleConnectionViews();
    }
    
    this.markAsInitialized();
  };

  ChakraApp.App.prototype.initializeLeftPanelManager = function() {
    this.leftPanelManager = new ChakraApp.LeftPanelManager();
    this.leftPanelManager.init();
    
    var anyLeftPanel = this.findAnyLeftPanel();
    var anyZoomContainer = this.findAnyLeftZoomContainer();
    
  };

  // NEW: Initialize ResizeController
  ChakraApp.App.prototype.initializeResizeController = function() {
    this.resizeController = new ChakraApp.ResizeController();
    this.resizeController.init();
    
    // Connect ResizeController with LeftPanelManager
    this._connectResizeControllers();
  };

  // NEW: Connect resize and panel controllers
  ChakraApp.App.prototype._connectResizeControllers = function() {
    var self = this;
    
    // Subscribe to resize events to update panel widths
    ChakraApp.EventBus.subscribe('PANEL_WIDTH_CHANGED', function(data) {
      if (self.leftPanelManager && data.newWidth) {
        self.leftPanelManager.updatePanelWidths(data.newWidth);
      }
    });
    
    // When panels are added/removed, update the resize controller
    ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function() {
      if (self.resizeController) {
        // Small delay to ensure DOM is updated
        setTimeout(function() {
          self.resizeController._updateContainerForPanelChange('add');
        }, 50);
      }
    });
    
    ChakraApp.EventBus.subscribe('LEFT_PANEL_REMOVED', function() {
      if (self.resizeController) {
        setTimeout(function() {
          self.resizeController._updateContainerForPanelChange('remove');
        }, 50);
      }
    });
    
    ChakraApp.EventBus.subscribe('LEFT_PANEL_MINIMIZED', function() {
      if (self.resizeController) {
        setTimeout(function() {
          self.resizeController._updateContainerForPanelChange('minimize');
        }, 50);
      }
    });
    
    ChakraApp.EventBus.subscribe('LEFT_PANEL_RESTORED', function() {
      if (self.resizeController) {
        setTimeout(function() {
          self.resizeController._updateContainerForPanelChange('restore');
        }, 50);
      }
    });
  };

  ChakraApp.App.prototype.findAnyLeftPanel = function() {
    var selectors = [
      '[id^="left-panel-"]',
      '.left-panel',
      '#left-panel'
    ];
    
    for (var i = 0; i < selectors.length; i++) {
      var panel = document.querySelector(selectors[i]);
      if (panel) {
        return panel;
      }
    }
    
    return null;
  };

  ChakraApp.App.prototype.findAnyLeftZoomContainer = function() {
    var selectors = [
      '[id^="zoom-container-left-"]',
      '.left-panel .zoom-container',
      '#left-panel .zoom-container'
    ];
    
    for (var i = 0; i < selectors.length; i++) {
      var container = document.querySelector(selectors[i]);
      if (container) {
        return container;
      }
    }
    
    return null;
  };

  ChakraApp.App.prototype.fixCircleTypes = function() {
    var fixApplied = false;
    
    this._ensureCircleTypesConfigured();
    
    ChakraApp.appState.circles.forEach(function(circle) {
      var originalType = circle.circleType;
      var newType = null;
      
      if (circle.circleType === 'gem' || circle.circleType === 'triangle' || 
          circle.circleType === 'standard' || circle.circleType === 'hexagon') {
        return;
      }
      
      if (!circle.circleType || circle.circleType === 'standard') {
        if (circle.color === '#4a6fc9') {
          newType = 'gem';
        } else if (circle.color === '#88B66d') {
          newType = 'triangle';
        } else if (circle.color === '#9932CC') {
          newType = 'hexagon';
        }
      }
      
      if (newType && newType !== circle.circleType) {
        circle.circleType = newType;
        fixApplied = true;
      }
    });
    
    if (fixApplied) {
      ChakraApp.appState.saveToStorageNow();
    }
    
    return fixApplied;
  };

  ChakraApp.App.prototype._ensureCircleTypesConfigured = function() {
    if (!ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes = [];
    }
    
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
    }
    
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
    }
    
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

  ChakraApp.App.prototype.createAttributeController = function() {
    if (!ChakraApp.attributeController) {
      ChakraApp.attributeController = new ChakraApp.AttributeController();
      ChakraApp.attributeController.init();
    }
  };
  
  ChakraApp.App.prototype.initializeViewManager = function() {
    this.viewManager.init();
  };
  
  ChakraApp.App.prototype.createPanelToggleButtons = function() {
    this.createMainPanelToggleButtons();
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
      if (ChakraApp.appState.cleanupSelectedDocumentIds) {
        ChakraApp.appState.cleanupSelectedDocumentIds();
      }
      
      if (ChakraApp.appState._migrateSelectedDocumentIds) {
        ChakraApp.appState._migrateSelectedDocumentIds();
      }
      
      this.fixCircleTypes();
      
      if (ChakraApp.appState._migrateDocumentState) {
        ChakraApp.appState._migrateDocumentState();
      }
      
      if (ChakraApp.appState._migrateDocumentsToListType) {
        ChakraApp.appState._migrateDocumentsToListType();
      }
    } else {
    }
  };
  
  ChakraApp.App.prototype.saveSampleData = function() {
    ChakraApp.appState.saveToStorage();
  };
  
  ChakraApp.App.prototype.renderViews = function() {
    this.viewManager.renderAllViews();
  };
  
  ChakraApp.App.prototype.markAsInitialized = function() {
    this.initialized = true;
  };

  ChakraApp.App.prototype.destroyRectangleSelection = function() {
    if (ChakraApp.RectangleSelectionManager) {
      ChakraApp.RectangleSelectionManager.destroy();
    }
  };
  
  ChakraApp.App.prototype.destroy = function() {
    if (this.leftPanelManager) {
      this.leftPanelManager.destroy();
      this.leftPanelManager = null;
    }
    
    // NEW: Destroy ResizeController
    if (this.resizeController) {
      this.resizeController.destroy();
      this.resizeController = null;
    }
    
    this.destroyControllers();
    this.destroyKeyboardController();
    this.destroyAttributeController();
    this.destroyViewManager();
    this.destroyRectangleSelection();
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

  ChakraApp.App.prototype.destroyAttributeController = function() {
    if (ChakraApp.attributeController) {
      ChakraApp.attributeController.destroy();
      ChakraApp.attributeController = null;
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
