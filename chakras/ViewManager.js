// src/views/ViewManager.js
// Manages all view components

(function(ChakraApp) {
  /**
   * View manager - coordinates creation and updates of views
   */
  ChakraApp.ViewManager = function() {
    // Reference to DOM containers
    this.zoomContainer = null;
    this.bottomPanel = null;
    this.lineContainer = null;
    
    // Maps to track view instances
    this.circleViews = new Map();
    this.squareViews = new Map();
    this.connectionViews = new Map();

    this.connectionViewPool = [];
  };
  
  ChakraApp.ViewManager.prototype.init = function() {
    // Get DOM containers
    this.zoomContainer = document.getElementById('zoom-container');
    this.bottomPanel = document.getElementById('bottom-panel');
    
    // Create line container
    this._createLineContainer();
    
    // Set up event listeners
    this._setupEventListeners();
  };
  
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
    
    // Add to bottom panel before any squares (to ensure squares are above lines)
    this.bottomPanel.insertBefore(this.lineContainer, this.bottomPanel.firstChild);
  };
  
  ChakraApp.ViewManager.prototype._setupEventListeners = function() {
  var self = this;
  
  // Listen for circle events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_CREATED, function(circle) {
    // Only create view if circle belongs to selected document or no document selected
    var selectedDocumentId = ChakraApp.appState.selectedDocumentId;
    if (!selectedDocumentId || circle.documentId === selectedDocumentId) {
      self.createCircleView(circle);
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
    // Re-render all views when document is selected
    self.renderAllViews();
  });
  
  // Listen for document deletion events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_DELETED, function(doc) {
    // Re-render all views when document is deleted
    self.renderAllViews();
  });
};
  
  /**
   * Create a circle view
   * @param {Circle} circleModel - Circle model
   * @returns {CircleView} The created view
   */
  ChakraApp.ViewManager.prototype.createCircleView = function(circleModel) {
    // Create view model
    var viewModel = new ChakraApp.CircleViewModel(circleModel);
    
    // Create view
    var view = new ChakraApp.CircleView(viewModel, this.zoomContainer);
    
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
    var view = new ChakraApp.SquareView(viewModel, this.bottomPanel);
    
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

	ChakraApp.ConnectionView.prototype.updateViewModel = function(connectionModel) {
		// Update the view model
		this.viewModel.model = connectionModel;
		this.viewModel._updateFromModel();

		// Update the DOM element
		this.update();

		// Ensure the element is in the DOM
		if (this.element && !this.element.parentNode) {
			this.parentElement.appendChild(this.element);
		}
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

		var self = this;
		var selectedDocumentId = ChakraApp.appState.selectedDocumentId;

		// Create views for circles that belong to the selected document
		ChakraApp.appState.circles.forEach(function(circleModel) {
			// Only render circles for the selected document
			if (!selectedDocumentId || circleModel.documentId === selectedDocumentId) {
				self.createCircleView(circleModel);
			}
		});

		// DON'T create square views here anymore!

		// DON'T create connection views here anymore!
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
  
	ChakraApp.ConnectionView.prototype.destroy = function(addToPool) {
		// If addToPool is true, just remove from DOM but keep the object
		if (addToPool) {
			if (this.element && this.element.parentNode) {
				this.element.parentNode.removeChild(this.element);
			}
			return;
		}

		// Otherwise, perform full cleanup
		// Call parent destroy method
		ChakraApp.BaseView.prototype.destroy.call(this);

		// Clean up view model subscription
		if (this.viewModelSubscription) {
			this.viewModelSubscription();
		}

		// Clean up additional subscriptions
		if (this.multiSelectSubscription) {
			this.multiSelectSubscription();
		}

		if (this.multiDeselectSubscription) {
			this.multiDeselectSubscription();
		}

		// Get the squares
		var square1 = ChakraApp.appState.getSquare(this.viewModel.sourceId);
		var square2 = ChakraApp.appState.getSquare(this.viewModel.targetId);

		// Remove any overlap registration if this connection is being destroyed
		if (square1 && square2) {
			ChakraApp.OverlappingSquaresManager.removeOverlap(square1.id, square2.id);
		}
	};
  
})(window.ChakraApp = window.ChakraApp || {});
