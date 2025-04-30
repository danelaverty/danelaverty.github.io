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
      // Get panel from document
      var doc = ChakraApp.appState.getDocument(circle.documentId);
      if (!doc) return;
      
      var panelId = doc.panelId;
      var selectedDocId = ChakraApp.appState.selectedDocumentIds[panelId];
      
      // Only create view if circle belongs to selected document in its panel
      if (selectedDocId && circle.documentId === selectedDocId) {
        self.createCircleView(circle, panelId);
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
    });
    
    // Listen for document deletion events
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_DELETED, function(doc) {
      // Re-render circles for this panel
      self.renderCirclesForPanel(doc.panelId);
    });
  };
  
  /**
   * Create a circle view
   * @param {Circle} circleModel - Circle model
   * @param {string} panelId - Panel ID
   * @returns {CircleView} The created view
   */
  ChakraApp.ViewManager.prototype.createCircleView = function(circleModel, panelId) {
    // If panelId not provided, get it from the circle's document
    if (!panelId) {
      var doc = ChakraApp.appState.getDocument(circleModel.documentId);
      if (doc) {
        panelId = doc.panelId;
      } else {
        console.error("Cannot create circle view: missing panel ID and document");
        return null;
      }
    }
    if (panelId === 'things') {
	    panelId = 'left';
    }
    
    // Get the appropriate container
    var container = this.zoomContainers[panelId];
    if (!container) {
      console.error("Cannot create circle view: container not found for panel " + panelId);
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
  
  /**
   * Update all connection views
   * @private
   */
  ChakraApp.ViewManager.prototype._updateConnectionViews = function() {
    // Clear existing connection views
    var self = this;
    this.connectionViews.forEach(function(view) {
      view.destroy();
    });
    this.connectionViews.clear();

    // Only proceed if a circle is selected
    if (!ChakraApp.appState.selectedCircleId) {
      return;
    }

    // Create views for all current connections
    ChakraApp.appState.connections.forEach(function(connectionModel, connectionId) {
      var sourceSquare = ChakraApp.appState.getSquare(connectionModel.sourceId);
      var targetSquare = ChakraApp.appState.getSquare(connectionModel.targetId);

      // Only create connection if both squares exist and are visible
      if (sourceSquare && targetSquare && sourceSquare.visible && targetSquare.visible) {
        self.createConnectionView(connectionModel);
      }
    });
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
  
  /**
   * Render circles for a specific panel
   * @param {string} panelId - Panel ID
   */
  ChakraApp.ViewManager.prototype.renderCirclesForPanel = function(panelId) {
  // First remove existing circle views for this panel
  this._removeCircleViewsForPanel(panelId);
  
  // If this is the left panel, also get circles from things panel
  if (panelId === 'left') {
    // Get the selected document for the left panel
    var leftDocId = ChakraApp.appState.selectedDocumentIds[panelId];
    
    // Get the selected document for the things panel
    var thingsDocId = ChakraApp.appState.selectedDocumentIds['things'];
    
    // Create views for circles in both selected documents
    var self = this;
    
    // First add circles for the left document
    if (leftDocId) {
      ChakraApp.appState.circles.forEach(function(circleModel) {
        if (circleModel.documentId === leftDocId) {
          self.createCircleView(circleModel, panelId);
        }
      });
    }
    
    // Then add circles for the things document 
    if (thingsDocId) {
      ChakraApp.appState.circles.forEach(function(circleModel) {
        if (circleModel.documentId === thingsDocId) {
          self.createCircleView(circleModel, panelId);
        }
      });
    }
  } else {
    // Original behavior for other panels
    var selectedDocId = ChakraApp.appState.selectedDocumentIds[panelId];
    if (!selectedDocId) return;
    
    // Create views for circles in the selected document
    var self = this;
    ChakraApp.appState.circles.forEach(function(circleModel) {
      if (circleModel.documentId === selectedDocId) {
        self.createCircleView(circleModel, panelId);
      }
    });
  }
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
    // For left panel, include documents from both left and things panels
    ChakraApp.appState.documents.forEach(function(doc) {
      if (doc.panelId === 'left' || doc.panelId === 'things') {
        panelDocIds.push(doc.id);
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
