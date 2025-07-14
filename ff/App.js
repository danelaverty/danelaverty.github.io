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

  (function() {
    // Store original methods we want to monitor
    var originalMethods = {
        squareShow: null,
        squareHide: null,
        createSquareView: null,
        showSquaresForCircle: null,
        filterSquaresByTab: null,
        renderSquaresWithViewManager: null,
        handleCircleSelection: null,
        handleCircleSelected: null,
        selectTab: null
    };
    
    // Debug logging function
    function debugLog(method, args, context) {
        console.log('🔍 [SQUARE-DEBUG]', method, {
            args: args,
            context: context,
            stack: new Error().stack.split('\n').slice(1, 6) // Show first 5 stack frames
        });
    }
    
    // Wait for app to initialize
    function setupDebugging() {
        if (!ChakraApp || !ChakraApp.appState) {
            setTimeout(setupDebugging, 100);
            return;
        }
        
        console.log('🔍 Setting up square display debugging...');
        
        // 1. Monitor Square.show() method
        if (ChakraApp.Square && ChakraApp.Square.prototype.show) {
            originalMethods.squareShow = ChakraApp.Square.prototype.show;
            ChakraApp.Square.prototype.show = function() {
                debugLog('Square.show()', [this.id, this.name, this.tabId], 'Square instance');
                return originalMethods.squareShow.apply(this, arguments);
            };
        }
        
        // 2. Monitor Square.hide() method
        if (ChakraApp.Square && ChakraApp.Square.prototype.hide) {
            originalMethods.squareHide = ChakraApp.Square.prototype.hide;
            ChakraApp.Square.prototype.hide = function() {
                debugLog('Square.hide()', [this.id, this.name, this.tabId], 'Square instance');
                return originalMethods.squareHide.apply(this, arguments);
            };
        }
        
        // 3. Monitor ViewManager.createSquareView()
        if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.createSquareView) {
            originalMethods.createSquareView = ChakraApp.app.viewManager.createSquareView;
            ChakraApp.app.viewManager.createSquareView = function(squareModel) {
                debugLog('ViewManager.createSquareView()', [squareModel.id, squareModel.name, squareModel.tabId], 'ViewManager');
                return originalMethods.createSquareView.apply(this, arguments);
            };
        }
        
        // 4. Monitor AppState._showSquaresForCircle()
        if (ChakraApp.appState._showSquaresForCircle) {
            originalMethods.showSquaresForCircle = ChakraApp.appState._showSquaresForCircle;
            ChakraApp.appState._showSquaresForCircle = function(circleId) {
                debugLog('AppState._showSquaresForCircle()', [circleId], 'AppState');
                return originalMethods.showSquaresForCircle.apply(this, arguments);
            };
        }
        
        // 5. Monitor AppState._filterSquaresByTab()
        if (ChakraApp.appState._filterSquaresByTab) {
            originalMethods.filterSquaresByTab = ChakraApp.appState._filterSquaresByTab;
            ChakraApp.appState._filterSquaresByTab = function(tabId) {
                debugLog('AppState._filterSquaresByTab()', [tabId], 'AppState');
                return originalMethods.filterSquaresByTab.apply(this, arguments);
            };
        }
        
        // 6. Monitor AppState._renderSquaresWithViewManager()
        if (ChakraApp.appState._renderSquaresWithViewManager) {
            originalMethods.renderSquaresWithViewManager = ChakraApp.appState._renderSquaresWithViewManager;
            ChakraApp.appState._renderSquaresWithViewManager = function(squares, viewManager) {
                debugLog('AppState._renderSquaresWithViewManager()', [squares.length + ' squares'], 'AppState');
                return originalMethods.renderSquaresWithViewManager.apply(this, arguments);
            };
        }
        
        // 7. Monitor AppState._handleCircleSelection()
        if (ChakraApp.appState._handleCircleSelection) {
            originalMethods.handleCircleSelection = ChakraApp.appState._handleCircleSelection;
            ChakraApp.appState._handleCircleSelection = function(circle) {
                debugLog('AppState._handleCircleSelection()', [circle.id || circle], 'AppState');
                return originalMethods.handleCircleSelection.apply(this, arguments);
            };
        }
        
        // 8. Monitor TabController._handleCircleSelected()
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.tab && 
            ChakraApp.app.controllers.tab._handleCircleSelected) {
            originalMethods.handleCircleSelected = ChakraApp.app.controllers.tab._handleCircleSelected;
            ChakraApp.app.controllers.tab._handleCircleSelected = function(circle) {
                debugLog('TabController._handleCircleSelected()', [circle.id], 'TabController');
                return originalMethods.handleCircleSelected.apply(this, arguments);
            };
        }
        
        // 9. Monitor AppState.selectTab()
        if (ChakraApp.appState.selectTab) {
            originalMethods.selectTab = ChakraApp.appState.selectTab;
            ChakraApp.appState.selectTab = function(id) {
                debugLog('AppState.selectTab()', [id], 'AppState');
                return originalMethods.selectTab.apply(this, arguments);
            };
        }
        
        // 10. Monitor circle selection events
        ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_SELECTED, function(circle) {
            debugLog('EVENT: CIRCLE_SELECTED', [circle.id], 'EventBus');
        });
        
        // 11. Monitor tab selection events
        ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.TAB_SELECTED, function(tab) {
            debugLog('EVENT: TAB_SELECTED', [tab.id], 'EventBus');
        });
        
        console.log('🔍 Square display debugging setup complete!');
        console.log('🔍 Now select a circle and watch the console for the flow...');
    }
    
    // Start debugging setup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDebugging);
    } else {
        setupDebugging();
    }
    
    // Additional debugging for ViewManager if it gets initialized later
    var originalViewManagerInit = ChakraApp.ViewManager.prototype.init;
    ChakraApp.ViewManager.prototype.init = function() {
        var result = originalViewManagerInit.apply(this, arguments);
        
        // Re-hook ViewManager methods after initialization
        if (this.createSquareView && !originalMethods.createSquareView) {
            originalMethods.createSquareView = this.createSquareView;
            this.createSquareView = function(squareModel) {
                debugLog('ViewManager.createSquareView()', [squareModel.id, squareModel.name, squareModel.tabId], 'ViewManager');
                return originalMethods.createSquareView.apply(this, arguments);
            };
        }
        
        return result;
    };
})();

(function() {
    function setupEnhancedDebugging() {
        if (!ChakraApp || !ChakraApp.appState) {
            setTimeout(setupEnhancedDebugging, 100);
            return;
        }
        
        console.log('🔍 Setting up enhanced _showSquaresForCircle debugging...');
        
        // Hook _showSquaresForCircle with full stack trace
        if (ChakraApp.appState._showSquaresForCircle) {
            var original = ChakraApp.appState._showSquaresForCircle;
            ChakraApp.appState._showSquaresForCircle = function(circleId) {
                console.log('🚨 _showSquaresForCircle called with circleId:', circleId);
                console.log('🚨 FULL STACK TRACE:');
                console.log(new Error().stack);
                console.log('🚨 END STACK TRACE');
                return original.apply(this, arguments);
            };
        }
        
        // Also hook _filterSquaresByTab to see when it's called
        if (ChakraApp.appState._filterSquaresByTab) {
            var originalFilter = ChakraApp.appState._filterSquaresByTab;
            ChakraApp.appState._filterSquaresByTab = function(tabId) {
                console.log('🟦 _filterSquaresByTab called with tabId:', tabId);
                console.log('🟦 FULL STACK TRACE:');
                console.log(new Error().stack);
                console.log('🟦 END STACK TRACE');
                return originalFilter.apply(this, arguments);
            };
        }
        
        console.log('🔍 Enhanced debugging setup complete!');
    }
    
    // Start enhanced debugging
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEnhancedDebugging);
    } else {
        setupEnhancedDebugging();
    }
})();
  
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
