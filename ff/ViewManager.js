// src/views/ViewManager.js
// Fixed version - properly handles multi-panel circle display

(function(ChakraApp) {
  /**
   * View manager - coordinates creation and updates of views
   */
  ChakraApp.ViewManager = function() {
    // Reference to DOM containers
    this.zoomContainers = {};
    this.centerPanel = null;
    this.lineContainer = null;
    
    // Maps to track view instances
    this.circleViews = new Map();
    this.squareViews = new Map();
    this.connectionViews = new Map();

    this.connectionViewPool = [];
  };
  
  ChakraApp.ViewManager.prototype.init = function() {
    // Get DOM containers for each panel
    this._initializeContainers();
    
    // Create line container
    this._createLineContainer();
    
    // Set up event listeners
    this._setupEventListeners();
  };
  
  /**
   * Initialize DOM containers
   * @private
   */
  ChakraApp.ViewManager.prototype._initializeContainers = function() {
    this.centerPanel = document.getElementById('center-panel');
    
    // Initialize zoom containers for each panel
    var self = this;
    ChakraApp.appState.panels.forEach(function(panelId) {
      self.zoomContainers[panelId] = document.getElementById('zoom-container-' + panelId);
    });
  };
  
  /**
   * Create line container
   * @private
   */
  ChakraApp.ViewManager.prototype._createLineContainer = function() {
    // Create container for connection lines
    this.lineContainer = document.createElement('div');
    this.lineContainer.id = 'line-container';
    this.lineContainer.style.position = 'absolute';
    this.lineContainer.style.top = '0';
    this.lineContainer.style.left = '0';
    this.lineContainer.style.width = '100%';
    this.lineContainer.style.height = '100%';
    this.lineContainer.style.pointerEvents = 'none';
    this.lineContainer.style.zIndex = '5';
    
    // Add to center panel before any squares (to ensure squares are above lines)
    this.centerPanel.insertBefore(this.lineContainer, this.centerPanel.firstChild);
  };
  
  /**
   * Set up event listeners
   * @private
   */
  ChakraApp.ViewManager.prototype._setupEventListeners = function() {
    var self = this;
    
    // Listen for circle events
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_CREATED, function(circle) {
      // Always create the view for newly created circles
      // The selection logic should be handled separately
      var circleView = self.createCircleView(circle);
      
      if (circleView) {
        // Force a re-rendering to ensure visibility
        setTimeout(function() {
          // CHANGED: Don't render all panels, just render the specific panel where this circle should be
          var targetPanel = self._findTargetPanelForCircle(circle);
          self.renderCirclesForLeftPanel(targetPanel);
        }, 10);
      } else {
        console.error('Failed to create circle view for:', circle.id);
      }
    });
    
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_DELETED, function(circle) {
      self.removeCircleView(circle.id);
    });
    
    // Listen for square events
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_CREATED, function(square) {
      self.createSquareView(square);
    });
    
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_DELETED, function(square) {
      self.removeSquareView(square.id);
    });
    
    // Listen for connection events
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CONNECTION_UPDATED, function(circleId) {
      // When connections are updated, refresh all connection views
      self._updateConnectionViews();
    });
    
    // Listen for state loaded event
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.STATE_LOADED, function() {
      self.renderAllViews();
    });
    
    // CHANGED: Remove the generic document selected handler that was causing conflicts
    // ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_SELECTED, function(doc) {
    //   self.renderCirclesForPanel('left');
    //   setTimeout(function() {
    //     self._updateCircleConnectionViews();
    //   }, 100);
    // });
    
    // Listen for document deletion events
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_DELETED, function(doc) {
      // Re-render circles for this panel
      self.renderCirclesForPanel(doc.panelId);
      self._updateCircleConnectionViews();
    });

    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_REFERENCE_CREATED, function(circleReference) {
      // Force update of circle connections when a reference is created
      setTimeout(function() {
        self._updateCircleConnectionViews();
      }, 100); // Small delay to ensure everything is processed
    });

    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_REFERENCE_DELETED, function(data) {
      // Force update of circle connections when a reference is deleted
      setTimeout(function() {
        self._updateCircleConnectionViews();
      }, 100);
    });

    // FIXED: Listen for panel-specific document selections - this is the main handler
    ChakraApp.EventBus.subscribe('LEFT_PANEL_DOCUMENT_SELECTED', function(data) {
      // ONLY re-render circles for the specific panel that had a document selected
      self.renderCirclesForLeftPanel(data.panelId);
      
      // Update circle connections after a delay
      setTimeout(function() {
        self._updateCircleConnectionViews();
      }, 100);
    });

    ChakraApp.EventBus.subscribe('LEFT_PANEL_MINIMIZED', function(data) {
    // Clear circle views for the minimized panel
    self._clearCircleViewsForPanel(data.panelId);
    
    // Update circle connections
    setTimeout(function() {
      self._updateCircleConnectionViews();
    }, 100);
  });
  
  ChakraApp.EventBus.subscribe('LEFT_PANEL_RESTORED', function(data) {
    // Re-render circles for the restored panel
    self.renderCirclesForLeftPanel(data.panelId);
    
    // Update circle connections
    setTimeout(function() {
      self._updateCircleConnectionViews();
    }, 100);
  });
  };

  ChakraApp.ViewManager.prototype._clearCircleViewsForPanel = function(panelId) {
  var self = this;
  var keysToRemove = [];
  
  // Find all circle views that belong to this panel
  this.circleViews.forEach(function(view, key) {
    if (key.includes('-panel-' + panelId) || 
        (view.panelId !== undefined && view.panelId === panelId)) {
      keysToRemove.push(key);
    }
  });
  
  // Remove the views
  keysToRemove.forEach(function(key) {
    var view = self.circleViews.get(key);
    if (view) {
      view.destroy();
      self.circleViews.delete(key);
    }
  });
  
};

  ChakraApp.ViewManager.prototype.renderCirclesForPanel = function(panelId) {
    // If it's a left panel request, handle all left panels
    if (typeof panelId === 'string' && panelId.startsWith('left-')) {
      var leftPanelId = parseInt(panelId.split('-')[1]);
      this.renderCirclesForLeftPanel(leftPanelId);
    } else if (panelId === 'left') {
      // Render for all left panels
      if (ChakraApp.appState.leftPanels) {
        var self = this;
        ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
          self.renderCirclesForLeftPanel(panelId);
        });
      } else {
        // Fallback to old system
        this.renderCirclesForLeftPanel(0);
      }
    }
    
    // Update circle connections after rendering
    var self = this;
    setTimeout(function() {
      if (self && self._updateCircleConnectionViews) {
        self._updateCircleConnectionViews();
      }
    }, 50);
  };

  // FIXED: Updated to properly find target panel based on actual document selections
  ChakraApp.ViewManager.prototype._findTargetPanelForCircle = function(circle) {
    var circleType = circle.circleType || 'standard';
    
  
    // Check all left panels to see which one has this circle's document selected
    if (ChakraApp.appState.leftPanels) {
      
      for (var panelId of ChakraApp.appState.leftPanels.keys()) {
        var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
        var typeSelections = panelSelections[circleType];
        
        
        if (typeSelections) {
          // Check if this circle's document is selected in either list1 or list2 of this panel
          if (typeSelections.list1 === circle.documentId || 
              typeSelections.list2 === circle.documentId) {
            
            return panelId;
          }
        }
      }
    }
    
    
    // Fallback: check the old global selection system
    var globalSelection = ChakraApp.appState.selectedDocumentIds[circleType];
    if (globalSelection && 
        (globalSelection.list1 === circle.documentId || globalSelection.list2 === circle.documentId)) {
      return 0; // Default to panel 0 for backward compatibility
    }
    
    
    // Final fallback to panel 0
    return 0;
  };

  ChakraApp.ViewManager.prototype._findAllTargetPanelsForCircle = function(circle) {
  var targetPanels = [];
  var circleType = circle.circleType || 'standard';
  
  // Check all left panels to see which ones have this circle's document selected
  if (ChakraApp.appState.leftPanels) {
    ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
      var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
      var typeSelections = panelSelections[circleType];
      
      if (typeSelections) {
        // Check if this circle's document is selected in either list1 or list2 of this panel
        if (typeSelections.list1 === circle.documentId || 
            typeSelections.list2 === circle.documentId) {
          targetPanels.push(panelId);
        }
      }
    });
  }
  
  // Fallback: if no panels found, default to panel 0 for backward compatibility
  if (targetPanels.length === 0) {
    targetPanels.push(0);
  }
  
  return targetPanels;
};
  
  ChakraApp.ViewManager.prototype.createCircleView = function(circleModel) {
  if (!circleModel) {
    console.error("Cannot create circle view: no circle model provided");
    return null;
  }
  
  var circleType = circleModel.circleType;
  if (!circleType && circleModel.documentId) {
    var doc = ChakraApp.appState.getDocument(circleModel.documentId);
    if (doc) {
      circleType = doc.circleType;
    }
  }
  
  circleType = circleType || 'standard';
  
  // FIXED: Find ALL panels where this circle should be rendered
  var targetPanels = this._findAllTargetPanelsForCircle(circleModel);
  
  var createdViews = [];
  
  // Create a view for each target panel
  targetPanels.forEach(function(panelId) {
    var zoomContainer = document.getElementById('zoom-container-left-' + panelId);
    
    if (!zoomContainer) {
      // Try alternative selectors
      var panelElement = document.getElementById('left-panel-' + panelId) ||
                        document.querySelector('.left-panel[data-panel-index="' + panelId + '"]');
      
      if (panelElement) {
        zoomContainer = panelElement.querySelector('.zoom-container');
      }
    }
    
    if (!zoomContainer) {
      console.warn('Could not find zoom container for panel', panelId);
      return;
    }
    
    // Use panel-specific key to allow same circle in multiple panels
    var panelSpecificKey = circleModel.id + '-panel-' + panelId;
    
    // Check if view already exists for this panel
    if (this.circleViews.has(panelSpecificKey)) {
      return;
    }
    
    // Create view model and view
    var viewModel = new ChakraApp.CircleViewModel(circleModel);
    var view = new ChakraApp.CircleView(viewModel, zoomContainer);
    
    // Store the panel ID on the view for tracking
    view.panelId = panelId;
    
    // Store the view with panel-specific key
    this.circleViews.set(panelSpecificKey, view);
    createdViews.push(view);
    
  }, this);
  
  return createdViews.length > 0 ? createdViews[0] : null; // Return first view for compatibility
};
  
  /**
   * Create a square view
   * @param {Square} squareModel - Square model
   * @returns {SquareView} The created view
   */
  ChakraApp.ViewManager.prototype.createSquareView = function(squareModel) {
    // Create view model
    var viewModel = new ChakraApp.SquareViewModel(squareModel);
    
    // Create view
    var view = new ChakraApp.SquareView(viewModel, this.centerPanel);
    
    // Store the view
    this.squareViews.set(squareModel.id, view);
    
    return view;
  };
  
  /**
   * Create a connection view
   * @param {Connection} connectionModel - Connection model
   * @returns {ConnectionView} The created view
   */
  ChakraApp.ViewManager.prototype.createConnectionView = function(connectionModel) {
    // First check if we have any views in the pool we can reuse
    var view = null;

    if (this.connectionViewPool.length > 0) {
      // Get a view from the pool
      view = this.connectionViewPool.pop();

      // Update its view model and reinitialize
      view.updateViewModel(connectionModel);
    } else {
      // No views in pool, create new one
      var viewModel = new ChakraApp.ConnectionViewModel(connectionModel);
      view = new ChakraApp.ConnectionView(viewModel, this.lineContainer);
    }

    // Store the view
    this.connectionViews.set(connectionModel.id, view);

    return view;
  };
  
  /**
   * Remove a circle view
   * @param {string} circleId - Circle ID
   */
ChakraApp.ViewManager.prototype.removeCircleView = function(circleId) {
  var viewsRemoved = 0;
  var keysToRemove = [];
  
  // Find all panel-specific keys for this circle
  this.circleViews.forEach(function(view, key) {
    if (key.startsWith(circleId + '-panel-') || key === circleId) {
      keysToRemove.push(key);
    }
  });
  
  // Remove all views for this circle
  var self = this;
  keysToRemove.forEach(function(key) {
    var view = self.circleViews.get(key);
    if (view) {
      view.destroy();
      self.circleViews.delete(key);
      viewsRemoved++;
    }
  });
  
};
  
  /**
   * Remove a square view
   * @param {string} squareId - Square ID
   */
  ChakraApp.ViewManager.prototype.removeSquareView = function(squareId) {
    var view = this.squareViews.get(squareId);
    if (view) {
      view.destroy();
      this.squareViews.delete(squareId);
    }
    
    // Also remove any connection views involving this square
    this._removeConnectionViewsForSquare(squareId);
  };
  
  /**
   * Remove connection views for a square
   * @private
   * @param {string} squareId - Square ID
   */
  ChakraApp.ViewManager.prototype._removeConnectionViewsForSquare = function(squareId) {
    var connectionsToRemove = [];
    
    // Find all connections that involve this square
    this.connectionViews.forEach(function(view, connectionId) {
      if (connectionId.includes(squareId)) {
        connectionsToRemove.push(connectionId);
      }
    });
    
    // Remove the connection views
    var self = this;
    connectionsToRemove.forEach(function(connectionId) {
      var view = self.connectionViews.get(connectionId);
      if (view) {
        view.destroy();
        self.connectionViews.delete(connectionId);
      }
    });
  };
  
  ChakraApp.ViewManager.prototype._updateCircleConnectionViews = function() {
    var self = this;
    
    // Remove existing circle connection views
    var circleConnectionsToRemove = [];
    this.connectionViews.forEach(function(view, connectionId) {
      if (view.viewModel && view.viewModel.connectionType === 'circle') {
        circleConnectionsToRemove.push(connectionId);
      }
    });
    
    circleConnectionsToRemove.forEach(function(connectionId) {
      var view = self.connectionViews.get(connectionId);
      if (view) {
        view.destroy();
        self.connectionViews.delete(connectionId);
      }
    });
    
    // Create views for current circle connections
    var circleConnectionsCreated = 0;
    ChakraApp.appState.connections.forEach(function(connectionModel, connectionId) {
      if (connectionModel.connectionType === 'circle') {
        
        var sourceCircle = ChakraApp.appState.getCircle(connectionModel.sourceId);
        var targetCircle = ChakraApp.appState.getCircle(connectionModel.targetId);
        
        // Check if both circles exist AND are visible
        var sourceVisible = sourceCircle && self._isCircleVisible(sourceCircle);
        var targetVisible = targetCircle && self._isCircleVisible(targetCircle);
        
        // Only create connection if both circles exist and are visible
        if (sourceVisible && targetVisible) {
          // FIXED: Look for the correct left panel container
          var leftPanelContainer = document.getElementById('zoom-container-left-0') ||
                                  document.querySelector('#left-panel-0 .zoom-container') ||
                                  document.querySelector('.left-panel[data-panel-index="0"] .zoom-container') ||
                                  document.getElementById('zoom-container-left');
          
          if (!leftPanelContainer) {
            console.error('Left panel container not found for circle connections');
            return;
          }
          
          // Create a separate line container for circle connections if it doesn't exist
          var circleLineContainer = leftPanelContainer.querySelector('#circle-line-container');
          if (!circleLineContainer) {
            circleLineContainer = document.createElement('div');
            circleLineContainer.id = 'circle-line-container';
            circleLineContainer.style.position = 'absolute';
            circleLineContainer.style.top = '0';
            circleLineContainer.style.left = '0';
            circleLineContainer.style.width = '100%';
            circleLineContainer.style.height = '100%';
            circleLineContainer.style.pointerEvents = 'none';
            circleLineContainer.style.zIndex = '3';
            leftPanelContainer.appendChild(circleLineContainer);
          }
          
          // Validate the container before creating the view
          if (!circleLineContainer) {
            console.error('Failed to get or create circle line container');
            return;
          }
          
          // Create the connection view with the circle line container
          try {
            var viewModel = new ChakraApp.ConnectionViewModel(connectionModel);
            
            var view = new ChakraApp.ConnectionView(viewModel, circleLineContainer);
            
            // Validate the view was created successfully
            if (view && view.element) {
              // Store the view in the connectionViews map
              self.connectionViews.set(connectionId, view);
              circleConnectionsCreated++;
            } else {
              console.error('Failed to create connection view or element for:', connectionId);
            }
            
          } catch (error) {
            console.error('Error creating circle connection view:', error);
          }
        }
      }
    });
  };

  ChakraApp.ViewManager.prototype._isCircleVisible = function(circle) {
    // A circle is visible if:
    // 1. It exists
    // 2. Its circle type is visible
    // 3. Its document is selected for its circle type in either list1 or list2 in any panel
    // 4. Its document's list type is visible
    // 5. There's actually a circle view element for it in the DOM
    
    if (!circle) {
      return false;
    }
    
    // Check circle type visibility
    var circleType = circle.circleType || 'standard';
    var circleTypeVisible = ChakraApp.appState.circleTypeVisibility[circleType] !== false;
    if (!circleTypeVisible) {
      return false;
    }
    
    // FIXED: Check if the circle's document is currently selected in ANY panel
    var isDocumentSelected = false;
    
    // Check all left panels
    if (ChakraApp.appState.leftPanels) {
      for (var panelId of ChakraApp.appState.leftPanels.keys()) {
        var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
        var typeSelections = panelSelections[circleType];
        
        if (typeSelections) {
          if (typeSelections.list1 === circle.documentId || 
              typeSelections.list2 === circle.documentId) {
            isDocumentSelected = true;
            break;
          }
        }
      }
    }
    
    // Fallback to old selection system if no panels
    if (!isDocumentSelected) {
      var selectedDocs = ChakraApp.appState.selectedDocumentIds[circleType];
      if (selectedDocs) {
        isDocumentSelected = (selectedDocs.list1 === circle.documentId) || 
                            (selectedDocs.list2 === circle.documentId);
      }
    }
    
    if (!isDocumentSelected) {
      return false;
    }
    
    // Check if the document's list type is visible
    var document = ChakraApp.appState.getDocument(circle.documentId);
    if (document && document.listType) {
      var listTypeVisible = ChakraApp.appState.listTypeVisibility[document.listType] !== false;
      if (!listTypeVisible) {
        return false;
      }
    }
    
    // Check if there's actually a DOM element for this circle
    var circleElement = document.querySelector('.circle[data-id="' + circle.id + '"]');
    if (!circleElement) {
      return false;
    }
    
    // Check if the circle element is actually visible (not hidden)
    var isElementVisible = circleElement.style.display !== 'none' && 
                          circleElement.offsetParent !== null;
    
    if (!isElementVisible) {
      return false;
    }
    
    return true;
  };

  /**
   * Update all connection views
   * @private
   */
  ChakraApp.ViewManager.prototype._updateConnectionViews = function() {
    var self = this;
    
    // IMPORTANT: Only clear SQUARE connection views, NOT circle connections
    var squareConnectionsToRemove = [];
    this.connectionViews.forEach(function(view, connectionId) {
      // Only remove square connections (connectionType is undefined/null or explicitly 'square')
      if (!view.viewModel || !view.viewModel.connectionType || view.viewModel.connectionType === 'square') {
        squareConnectionsToRemove.push(connectionId);
      }
    });
    
    squareConnectionsToRemove.forEach(function(connectionId) {
      var view = self.connectionViews.get(connectionId);
      if (view) {
        view.destroy();
        self.connectionViews.delete(connectionId);
      }
    });

    if (ChakraApp.appState.selectedCircleId) {
      ChakraApp.appState.connections.forEach(function(connectionModel, connectionId) {
        if (!connectionModel.connectionType || connectionModel.connectionType === 'square') {
          var sourceSquare = ChakraApp.appState.getSquare(connectionModel.sourceId);
          var targetSquare = ChakraApp.appState.getSquare(connectionModel.targetId);

          if (sourceSquare && targetSquare && sourceSquare.visible && targetSquare.visible) {
            self.createConnectionView(connectionModel);
          }
        }
      });
    }
    
    this._updateCircleConnectionViews();
  };
  
  /**
   * Render all views from current state
   */
ChakraApp.ViewManager.prototype.renderAllViews = function() {
  this.clearAllViews();

  var self = this;
  ChakraApp.appState.panels.forEach(function(panelId) {
    self.renderCirclesForPanel(panelId);
  });
  
  // FIXED: Better DOM attachment checking
  setTimeout(function() {
    self.circleViews.forEach(function(circleView) {
      if (circleView.viewModel.circleType === 'gem' && 
          circleView.viewModel.hasMultipleColors()) {
        
        var isAttached = circleView.element && 
                        circleView.element.parentNode && 
                        document.contains(circleView.element);
        
        if (isAttached) {
          ChakraApp.GemRenderer.startGemColorCycling(circleView);
        } else {
          ChakraApp.GemRenderer._waitForDOMAttachmentAndStartCycling(circleView);
        }
      }
    });
  }, 200); // Increased timeout for better reliability
};

  ChakraApp.ViewManager.prototype._removeAllCircleViews = function() {
    var self = this;
    var circlesToRemove = [];
    
    this.circleViews.forEach(function(view, circleId) {
      circlesToRemove.push(circleId);
    });
    
    circlesToRemove.forEach(function(circleId) {
      self.removeCircleView(circleId);
    });
  };

ChakraApp.ViewManager.prototype.renderCirclesForLeftPanel = function(panelId) {
  var self = this;
  
  if (ChakraApp.appState.isPanelMinimized && ChakraApp.appState.isPanelMinimized(panelId)) {
    return;
  }
  
  if (!this._renderDebounceTimers) {
    this._renderDebounceTimers = {};
  }
  
  if (this._renderDebounceTimers[panelId]) {
    return;
  }
  
  var renderKey = 'renderCirclesForLeftPanel_' + panelId;
  if (this._currentlyRendering && this._currentlyRendering[renderKey]) {
    return;
  }
  
  if (!this._currentlyRendering) {
    this._currentlyRendering = {};
  }
  this._currentlyRendering[renderKey] = true;
  
  this._renderDebounceTimers[panelId] = setTimeout(function() {
    delete self._renderDebounceTimers[panelId];
    
    try {
      self._doRenderCirclesForLeftPanel(panelId);
    } finally {
      if (self._currentlyRendering) {
        self._currentlyRendering[renderKey] = false;
      }
    }
  }, 50); 
};

// Separate method for actual rendering logic
ChakraApp.ViewManager.prototype._doRenderCirclesForLeftPanel = function(panelId) {
  var self = this;
  
  // Get the target container for this panel
  var targetContainer = document.querySelector('#left-panel-' + panelId + ' .zoom-container');
  if (!targetContainer) {
    // FIXED: Check if the panel exists in AppState but not in DOM
    if (ChakraApp.appState.leftPanels && ChakraApp.appState.leftPanels.has(panelId)) {
      // Create the panel using LeftPanelManager if available
      if (ChakraApp.app && ChakraApp.app.leftPanelManager) {
        ChakraApp.app.leftPanelManager.createLeftPanel(panelId);
        
        // Try to get the container again after creation
        targetContainer = document.querySelector('#left-panel-' + panelId + ' .zoom-container');
      }
    }
    
    // If still no container, log error and return
    if (!targetContainer) {
      console.error('Cannot find container for panel', panelId, 'even after attempting creation');
      return;
    }
  }
  
  // Get selections for this specific left panel
  var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
  
  // Determine which circles should be in this panel
  var circlesToShowInThisPanel = new Set();
  
  // For each circle type in the config
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      
      // Check if this circle type is visible
      var typeVisible = ChakraApp.appState.circleTypeVisibility[typeId] !== false;
      if (!typeVisible) {
        return;
      }
      
      var selectedDocs = panelSelections[typeId];
      
      // Check both list1 and list2 for selected documents
      var selectedDocIds = [];
      if (selectedDocs) {
        if (selectedDocs.list1 && ChakraApp.appState.listTypeVisibility['list1'] !== false) {
          selectedDocIds.push(selectedDocs.list1);
        }
        if (selectedDocs.list2 && ChakraApp.appState.listTypeVisibility['list2'] !== false) {
          selectedDocIds.push(selectedDocs.list2);
        }
      }
      
      // Find all circles that should be visible for this circle type IN THIS PANEL
      ChakraApp.appState.circles.forEach(function(circle) {
        if (circle.circleType === typeId && selectedDocIds.includes(circle.documentId)) {
          var document = ChakraApp.appState.getDocument(circle.documentId);
          if (document && document.listType) {
            var listTypeVisible = ChakraApp.appState.listTypeVisibility[document.listType] !== false;
            if (listTypeVisible) {
              circlesToShowInThisPanel.add(circle.id);
            }
          } else {
            circlesToShowInThisPanel.add(circle.id);
          }
        }
      });
    });
  }
  
  var circleViewsToRemoveFromThisPanel = [];
  this.circleViews.forEach(function(view, circleId) {
    // Check if this view belongs to this panel
    if (view.element && view.element.parentElement === targetContainer) {
      // This circle view is in this panel - should it be here?
      if (!circlesToShowInThisPanel.has(circleId)) {
        circleViewsToRemoveFromThisPanel.push(circleId);
      }
    }
  });
  
  // Remove circle views that shouldn't be in this panel
  circleViewsToRemoveFromThisPanel.forEach(function(circleId) {
    var view = self.circleViews.get(circleId);
    if (view && view.element && view.element.parentElement === targetContainer) {
      // Remove the DOM element
      view.element.remove();
      // Remove from view manager
      self.circleViews.delete(circleId);
    }
  });
  
  // CRITICAL FIX: Create/move circles that should be in this panel
  circlesToShowInThisPanel.forEach(function(circleId) {
    var circle = ChakraApp.appState.getCircle(circleId);
    if (!circle) return;
    
    var existingView = self.circleViews.get(circleId);
    var needsRecreation = false;
    
    if (existingView) {
      // Check if the view is in the correct container
      var isInCorrectContainer = existingView.element && existingView.element.parentElement === targetContainer;
      if (!isInCorrectContainer) {
        needsRecreation = true;
      } else {
      }
    } else {
      needsRecreation = true;
    }
    
    if (needsRecreation) {
      // CRITICAL: If this circle exists in another panel, we need to CREATE A NEW VIEW
      // We don't remove the existing view - we create a duplicate for this panel
      
      
      // Create new view directly in the target container
      var viewModel = new ChakraApp.CircleViewModel(circle);
      var view = new ChakraApp.CircleView(viewModel, targetContainer);
      view.panelId = panelId; // Store panel ID for reference
      
      // CRITICAL: Use a panel-specific key to allow the same circle in multiple panels
      var panelSpecificKey = circleId + '-panel-' + panelId;
      self.circleViews.set(panelSpecificKey, view);
      
    }
  });
  
};
  
  // NEW: Helper method to check if a circle should be visible in any panel
  ChakraApp.ViewManager.prototype._shouldCircleBeVisibleInAnyPanel = function(circle) {
    var circleType = circle.circleType || 'standard';
    
    // Check circle type visibility
    var typeVisible = ChakraApp.appState.circleTypeVisibility[circleType] !== false;
    if (!typeVisible) {
      return false;
    }
    
    // Check if the circle's document is selected in ANY panel
    if (ChakraApp.appState.leftPanels) {
      for (var panelId of ChakraApp.appState.leftPanels.keys()) {
        var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
        var typeSelections = panelSelections[circleType];
        
        if (typeSelections) {
          if (typeSelections.list1 === circle.documentId || 
              typeSelections.list2 === circle.documentId) {
            // Check if the document's list type is visible
            var document = ChakraApp.appState.getDocument(circle.documentId);
            if (document && document.listType) {
              var listTypeVisible = ChakraApp.appState.listTypeVisibility[document.listType] !== false;
              if (listTypeVisible) {
                return true;
              }
            } else {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  };
  
  ChakraApp.ViewManager.prototype.createCircleViewForPanel = function(circleModel, container, panelId) {
    if (!circleModel || !container) {
      return null;
    }
    
    // Check if view already exists - if so, remove it first
    if (this.circleViews.has(circleModel.id)) {
      this.removeCircleView(circleModel.id);
    }
    
    // Create view model
    var viewModel = new ChakraApp.CircleViewModel(circleModel);
    
    // Create view with panel-specific container
    var view = new ChakraApp.CircleView(viewModel, container);
    view.panelId = panelId; // Store panel ID for reference
    
    // Store the view
    this.circleViews.set(circleModel.id, view);
    
    
    return view;
  };
  
  ChakraApp.ViewManager.prototype._getViewPanelId = function(view) {
    if (view.panelId !== undefined) {
      return view.panelId;
    }
    
    // Try to determine from parent element
    var element = view.element;
    while (element && element.parentElement) {
      if (element.classList.contains('left-panel')) {
        var panelIndex = element.dataset.panelIndex;
        if (panelIndex !== undefined) {
          return parseInt(panelIndex);
        }
      }
      element = element.parentElement;
    }
    
    return 0; // Default to panel 0
  };
  
ChakraApp.ViewManager.prototype.renderCirclesForPanel = function(panelId) {
  // If it's a left panel request, handle all left panels
  if (typeof panelId === 'string' && panelId.startsWith('left-')) {
    var leftPanelId = parseInt(panelId.split('-')[1]);
    this.renderCirclesForLeftPanel(leftPanelId);
  } else if (panelId === 'left') {
    // Render for all left panels, but only visible ones
    if (ChakraApp.appState.leftPanels) {
      var self = this;
      
      // IMPORTANT: First, clear all existing circle views to prevent duplicates
      this._removeAllCircleViews();
      
      // Then render circles for each visible (non-minimized) panel
      ChakraApp.appState.leftPanels.forEach(function(panelState, panelId) {
        if (!panelState.minimized) {
          self.renderCirclesForLeftPanel(panelId);
        }
      });
    } else {
      // Fallback to old system
      this.renderCirclesForLeftPanel(0);
    }
  } else {
    // Handle other panel types (non-left panels) - existing code unchanged
    var self = this;
    var circlesToShow = new Set();
    var circlesToRemove = [];
    
    // For each circle type in the config
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        var typeId = circleType.id;
        
        // Check if this circle type is visible
        var typeVisible = ChakraApp.appState.circleTypeVisibility[typeId] !== false;
        if (!typeVisible) {
          return; // Skip this circle type entirely
        }
        
        var selectedDocs = ChakraApp.appState.selectedDocumentIds[typeId];
        
        var selectedDocIds = [];
        if (selectedDocs) {
          if (selectedDocs.list1 && ChakraApp.appState.listTypeVisibility['list1'] !== false) {
            selectedDocIds.push(selectedDocs.list1);
          }
          if (selectedDocs.list2 && ChakraApp.appState.listTypeVisibility['list2'] !== false) {
            selectedDocIds.push(selectedDocs.list2);
          }
        }
        
        ChakraApp.appState.circles.forEach(function(circle) {
          if (circle.circleType === typeId) {
            if (selectedDocIds.includes(circle.documentId)) {
              var document = ChakraApp.appState.getDocument(circle.documentId);
              if (document && document.listType) {
                var listTypeVisible = ChakraApp.appState.listTypeVisibility[document.listType] !== false;
                if (listTypeVisible) {
                  circlesToShow.add(circle.id);
                }
              } else {
                circlesToShow.add(circle.id);
              }
            }
          }
        });
      });
    }
    
    this.circleViews.forEach(function(view, circleId) {
      if (!circlesToShow.has(circleId)) {
        circlesToRemove.push(circleId);
      }
    });
    
    circlesToRemove.forEach(function(circleId) {
      self.removeCircleView(circleId);
    });
    
    ChakraApp.appState.circles.forEach(function(circle) {
      if (circlesToShow.has(circle.id) && !self.circleViews.has(circle.id)) {
        self.createCircleView(circle);
      }
    });
    
    setTimeout(function() {
      self._updateCircleConnectionViews();
    }, 50);
  }
  
  var self = this;
  setTimeout(function() {
    if (self && self._updateCircleConnectionViews) {
      self._updateCircleConnectionViews();
    }
  }, 50);
};
  
  /**
   * Remove circle views for a specific panel
   * @private
   * @param {string} panelId - Panel ID
   */
  ChakraApp.ViewManager.prototype._removeCircleViewsForPanel = function(panelId) {
    var self = this;
    var circlesToRemove = [];
    
    // Get document IDs for this panel
    var panelDocIds = [];
    
    if (panelId === 'left') {
      // For left panel, include documents from left and all concept panels
      ChakraApp.appState.documents.forEach(function(doc) {
        if (doc.panelId === 'left') {
          panelDocIds.push(doc.id);
        } else if (ChakraApp.Config && ChakraApp.Config.conceptTypes) {
          // Check if doc's panelId matches any concept type
          ChakraApp.Config.conceptTypes.forEach(function(conceptType) {
            if (doc.panelId === conceptType.id) {
              panelDocIds.push(doc.id);
            }
          });
        }
      });
    } else {
      // For other panels, just get docs for that panel
      ChakraApp.appState.documents.forEach(function(doc) {
        if (doc.panelId === panelId) {
          panelDocIds.push(doc.id);
        }
      });
    }
    
    // Find circles to remove
    this.circleViews.forEach(function(view, circleId) {
      var circle = ChakraApp.appState.getCircle(circleId);
      if (circle && panelDocIds.includes(circle.documentId)) {
        circlesToRemove.push(circleId);
      }
    });
    
    // Remove the views
    circlesToRemove.forEach(function(circleId) {
      self.removeCircleView(circleId);
    });
  };
  
  /**
   * Clear all views
   */
  ChakraApp.ViewManager.prototype.clearAllViews = function() {
    var self = this;

    // Destroy all circle views
    this.circleViews.forEach(function(view) {
      view.destroy();
    });
    this.circleViews.clear();

    // Destroy all square views
    this.squareViews.forEach(function(view) {
      view.destroy();
    });
    this.squareViews.clear();

    // Destroy all connection views
    this.connectionViews.forEach(function(view) {
      view.destroy(false); // full destroy, not add to pool
    });
    this.connectionViews.clear();

    // Clear the connection view pool
    this.connectionViewPool.forEach(function(view) {
      view.destroy(false);
    });
    this.connectionViewPool = [];
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.ViewManager.prototype.destroy = function() {
    // Clear all views
    this.clearAllViews();
    
    // Remove line container
    if (this.lineContainer && this.lineContainer.parentNode) {
      this.lineContainer.parentNode.removeChild(this.lineContainer);
    }
    
    // Clear references
    this.zoomContainers = {};
    this.centerPanel = null;
    this.lineContainer = null;
  };

})(window.ChakraApp = window.ChakraApp || {});
