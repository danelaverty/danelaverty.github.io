// src/views/ViewManager.js
// Manages all view components

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
    // Get the circle type and document
    var circleType = circle.circleType || 'standard';
    var doc = ChakraApp.appState.getDocument(circle.documentId);
    
    if (doc) {
      // Check if this circle is for the currently selected document of its type
      var selectedDocId = ChakraApp.appState.selectedDocumentIds[circleType];
      
      if (selectedDocId && circle.documentId === selectedDocId) {
        // Create the view for this circle
        self.createCircleView(circle);
        
        // Force a re-rendering to ensure visibility
        self.renderCirclesForPanel('left');
        
      } else {
      }
    } else {
      console.error("Circle created but has no associated document:", circle.id);
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
    
    // Listen for document selection events
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_SELECTED, function(doc) {
      // Re-render circles for this panel's document
      self.renderCirclesForPanel(doc.panelId);
      setTimeout(function() {
    self._updateCircleConnectionViews();
  }, 100);
    });
    
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
  };
  
  ChakraApp.ViewManager.prototype.createCircleView = function(circleModel) {
  // Ensure we have a valid circle model
  if (!circleModel) {
    console.error("Cannot create circle view: no circle model provided");
    return null;
  }
  
  // Get the circle type - either directly from the circle or from its document
  var circleType = circleModel.circleType;
  if (!circleType && circleModel.documentId) {
    var doc = ChakraApp.appState.getDocument(circleModel.documentId);
    if (doc) {
      circleType = doc.circleType;
    }
  }
  
  // Default to standard if no type is found
  circleType = circleType || 'standard';
  
  // We'll always use the left panel for rendering any circle type
  var container = document.querySelector('.circle-panel[data-panel-id="left"]');
  if (!container) {
    console.error("Cannot create circle view: left panel not found");
    return null;
  }
  
  // Create view model
  var viewModel = new ChakraApp.CircleViewModel(circleModel);
  
  // Create view
  var view = new ChakraApp.CircleView(viewModel, container);
  
  // Store the view
  this.circleViews.set(circleModel.id, view);
  
  return view;
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
    var view = this.circleViews.get(circleId);
    if (view) {
      view.destroy();
      this.circleViews.delete(circleId);
    }
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
      
      
      // NEW: Check if both circles exist AND are visible
      var sourceVisible = sourceCircle && self._isCircleVisible(sourceCircle);
      var targetVisible = targetCircle && self._isCircleVisible(targetCircle);
      
      
      // Only create connection if both circles exist and are visible
      if (sourceVisible && targetVisible) {
        // For circle connections, we need to render to the left panel
        var leftPanelContainer = document.getElementById('zoom-container-left');
        if (!leftPanelContainer) {
          console.error('Left panel container not found');
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
  // 2. Its document is selected for its circle type
  // 3. There's actually a circle view element for it in the DOM
  
  if (!circle) {
    return false;
  }
  
  // Check if the circle's document is currently selected
  var circleType = circle.circleType || 'standard';
  var selectedDocId = ChakraApp.appState.selectedDocumentIds[circleType];
  
  if (circle.documentId !== selectedDocId) {
    return false;
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

  // Only proceed with square connections if a circle is selected
  if (ChakraApp.appState.selectedCircleId) {
    // Create views for square connections
    ChakraApp.appState.connections.forEach(function(connectionModel, connectionId) {
      // Only process square connections
      if (!connectionModel.connectionType || connectionModel.connectionType === 'square') {
        var sourceSquare = ChakraApp.appState.getSquare(connectionModel.sourceId);
        var targetSquare = ChakraApp.appState.getSquare(connectionModel.targetId);

        // Only create connection if both squares exist and are visible
        if (sourceSquare && targetSquare && sourceSquare.visible && targetSquare.visible) {
          self.createConnectionView(connectionModel);
        }
      }
    });
  }
  
  // ALWAYS update circle connections - this ensures they stay visible
  this._updateCircleConnectionViews();
};
  
  /**
   * Render all views from current state
   */
  ChakraApp.ViewManager.prototype.renderAllViews = function() {
    // Clear existing views
    this.clearAllViews();

    // Render circles for each panel
    var self = this;
    ChakraApp.appState.panels.forEach(function(panelId) {
      self.renderCirclesForPanel(panelId);
    });
  };

ChakraApp.ViewManager.prototype._removeAllCircleViews = function() {
  var self = this;
  var circlesToRemove = [];
  
  // Identify all circles to remove
  this.circleViews.forEach(function(view, circleId) {
    circlesToRemove.push(circleId);
  });
  
  // Remove the views
  circlesToRemove.forEach(function(circleId) {
    self.removeCircleView(circleId);
  });
};
  
  /**
   * Render circles for a specific panel
   * @param {string} panelId - Panel ID
   */
// Fix the renderCirclesForPanel method in ViewManager.js
ChakraApp.ViewManager.prototype.renderCirclesForPanel = function() {
  // First remove existing circle views
  this._removeAllCircleViews();
  
  var self = this;
  
  // For each circle type in the config
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      var selectedDocId = ChakraApp.appState.selectedDocumentIds[typeId];
      
      // If a document of this type is selected
      if (selectedDocId) {
        // Create views for all circles of this type and document
        ChakraApp.appState.circles.forEach(function(circle) {
          if (circle.documentId === selectedDocId && circle.circleType === typeId) {
            self.createCircleView(circle);
          }
        });
      }
    });
  }
  
  var self = this;
  setTimeout(function() {
    self._updateCircleConnectionViews();
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
