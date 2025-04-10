// src/state/AppState.js
// Central state management for the application

(function(ChakraApp) {
  /**
   * Application State Manager
   * Handles all application state and serves as the central store
   */
  ChakraApp.AppState = function() {
    // Inherit from Observable
    ChakraApp.Observable.call(this);

    // Initialize state collections
    this._initializeState();
    
    // Setup event listeners
    this._setupEventListeners();
  };
  
  // Inherit from Observable
  ChakraApp.AppState.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.AppState.prototype.constructor = ChakraApp.AppState;
  
  //====================================================
  // INITIALIZATION
  //====================================================
  
  /**
   * Initialize the state collections and properties
   * @private
   */
  ChakraApp.AppState.prototype._initializeState = function() {
    // Core state collections
    this.documents = new Map();
    this.circles = new Map();
    this.squares = new Map();
    this.connections = new Map();
    this.tabs = new Map();

    // Panel configuration
    this.panels = ['left', 'right', 'bottom'];

    // Selection state - now using maps to track per-panel state
    this.selectedDocumentIds = {
      left: null,
      right: null,
      bottom: null
    };
    this.selectedCircleId = null; // Still only one selected circle across all panels
    this.selectedSquareId = null;
    this.selectedTabId = null;
    
    // UI state - track panel visibility
    this.panelVisibility = {
      left: true,
      right: true,
      bottom: true
    };
    
    // Document list visibility per panel
    this.documentListVisible = {
      left: false,
      right: false,
      bottom: false
    };
  };
  
  // Add tab operations
ChakraApp.AppState.prototype.addTab = function(tabData) {
  var tab;
  
  if (tabData instanceof ChakraApp.Tab) {
    tab = tabData;
  } else {
    tab = new ChakraApp.Tab(tabData);
  }
  
  this.tabs.set(tab.id, tab);
  
  // Subscribe to tab changes
  var self = this;
  tab.subscribe(function(change) {
    if (change.type === 'update') {
      self._notifyStateChanged('tabs', tab);
    }
  });
  
  // Notify and publish event
  this._notifyStateChanged('tabs', tab);
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_CREATED, tab);
  
  // Save state to localStorage
  if (!this._isLoading) {
    this.saveToStorage();
  }
  
  return tab;
};

ChakraApp.AppState.prototype.updateTab = function(id, changes) {
  var tab = this.tabs.get(id);
  if (!tab) return null;
  
  tab.update(changes);
  
  // Save state to localStorage
  if (!this._isLoading) {
    this.saveToStorage();
  }
  
  return tab;
};

ChakraApp.AppState.prototype.removeTab = function(id) {
  if (!this.tabs.has(id)) return false;
  
  var tab = this.tabs.get(id);
  
  // Deselect if this was the selected tab
  if (this.selectedTabId === id) {
    this.deselectTab();
  }
  
  // Remove the tab
  this.tabs.delete(id);
  
  // Find all squares for this tab
  var squaresToRemove = [];
  this.squares.forEach(function(square, squareId) {
    if (square.tabId === id) {
      squaresToRemove.push(squareId);
    }
  });
  
  // Remove all associated squares
  var self = this;
  squaresToRemove.forEach(function(squareId) {
    self.removeSquare(squareId);
  });
  
  // Notify and publish event
  this._notifyStateChanged('tabs', null);
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_DELETED, tab);
  
  // Save state to localStorage
  if (!this._isLoading) {
    this.saveToStorage();
  }
  
  return true;
};

ChakraApp.AppState.prototype.getTab = function(id) {
  return this.tabs.get(id) || null;
};

ChakraApp.AppState.prototype.getTabsForCircle = function(circleId) {
  var result = [];
  this.tabs.forEach(function(tab) {
    if (tab.circleId === circleId) {
      result.push(tab);
    }
  });
  
  // Sort by index
  result.sort(function(a, b) {
    return a.index - b.index;
  });
  
  return result;
};

ChakraApp.AppState.prototype.selectTab = function(id) {
  // Deselect current selection if different
  if (this.selectedTabId && this.selectedTabId !== id) {
    this.deselectTab();
  }
  
  var tab = this.tabs.get(id);
  if (!tab) return null;
  
  this.selectedTabId = id;
  tab.select();
  
  // Show squares for this tab only
  this._filterSquaresByTab(id);
  
  return tab;
};

ChakraApp.AppState.prototype.deselectTab = function() {
  if (!this.selectedTabId) return false;
  
  var tab = this.tabs.get(this.selectedTabId);
  if (tab) {
    tab.deselect();
  }
  
  this.selectedTabId = null;
  
  return true;
};

// Method to show only squares for a specific tab
ChakraApp.AppState.prototype._filterSquaresByTab = function(tabId) {
  var self = this;
  
  // Hide all squares first
  this.squares.forEach(function(square) {
    if (square.circleId === self.selectedCircleId) {
      square.hide();
    }
  });
  
  // Show only squares for the selected tab
  this.squares.forEach(function(square) {
    if (square.tabId === tabId && square.circleId === self.selectedCircleId) {
      square.show();
    }
  });
  
  // Update connections
  this._updateConnectionsForCircleId(this.selectedCircleId);
};
  
  /**
   * Set up global event listeners
   * @private
   */
  ChakraApp.AppState.prototype._setupEventListeners = function() {
    var self = this;
    
    // Listen for square updates to update connections
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_UPDATED, function(square) {
      self._updateConnectionsForSquare(square.id);
    });
    
    // Circle selection shows related squares
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_SELECTED, function(circle) {
      self._handleCircleSelection(circle.id);
    });
    
    // Circle deselection hides all squares
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_DESELECTED, function() {
      self._handleCircleDeselection();
    });
  };

  /**
   * Notify observers about state changes
   * @private
   * @param {string} section - State section that changed
   * @param {*} data - Changed data
   */
  ChakraApp.AppState.prototype._notifyStateChanged = function(section, data) {
    this.notify({ section: section, data: data });
  };
  
  //====================================================
  // DOCUMENT OPERATIONS
  //====================================================
  
  /**
   * Add a document to the app state
   * @param {Object|ChakraApp.Document} documentData - Document data or instance
   * @param {string} [panelId] - ID of the panel this document belongs to
   * @returns {ChakraApp.Document} The created document
   */
  ChakraApp.AppState.prototype.addDocument = function(documentData, panelId) {
    var doc;
    
    if (documentData instanceof ChakraApp.Document) {
      doc = documentData;
    } else {
      // If documentData is an object, ensure it has a panelId
      if (documentData && typeof documentData === 'object') {
        documentData.panelId = documentData.panelId || panelId || 'left';
      } else {
        // If documentData is null/undefined, create with specified panelId
        documentData = { panelId: panelId || 'left' };
      }
      
      doc = new ChakraApp.Document(documentData);
    }
    
    this.documents.set(doc.id, doc);
    
    // Subscribe to document changes
    var self = this;
    doc.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged('documents', doc);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('documents', doc);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_CREATED, doc);
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return doc;
  };

  /**
   * Update a document's properties
   * @param {string} id - Document ID
   * @param {Object} changes - Properties to update
   * @returns {ChakraApp.Document|null} Updated document or null if not found
   */
  ChakraApp.AppState.prototype.updateDocument = function(id, changes) {
    var doc = this.documents.get(id);
    if (!doc) return null;
    
    doc.update(changes);
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return doc;
  };

  /**
   * Remove a document and all related circles and squares
   * @param {string} id - Document ID to remove
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.removeDocument = function(id) {
    if (!this.documents.has(id)) return false;
    
    var doc = this.documents.get(id);
    var panelId = doc.panelId;
    
    // Deselect if this was the selected document for this panel
    if (this.selectedDocumentIds[panelId] === id) {
      this.deselectDocument(panelId);
    }

    // Check if we're removing the last viewed document for this panel
    var lastViewedId = this.getLastViewedDocument(panelId);
    var isRemovingLastViewed = lastViewedId === id;
    
    // Remove the document
    this.documents.delete(id);
    
    // Get all circles for this document
    var circlesToRemove = [];
    this.circles.forEach(function(circle, circleId) {
      if (circle.documentId === id) {
        circlesToRemove.push(circleId);
      }
    });
    
    // Remove all associated circles
    var self = this;
    circlesToRemove.forEach(function(circleId) {
      self.removeCircle(circleId);
    });
    
    // Notify and publish event
    this._notifyStateChanged('documents', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_DELETED, doc);
    
    // Update the last viewed document if needed
    if (isRemovingLastViewed) {
      // Find next document for this panel
      var panelDocuments = this.getDocumentsForPanel(panelId);
      if (panelDocuments.length > 0) {
        var nextDocument = panelDocuments[0];
        this.saveLastViewedDocument(nextDocument.id, panelId);
        
        // Only auto-select if the removed document was the selected one
        if (this.selectedDocumentIds[panelId] === null) {
          this.selectDocument(nextDocument.id, panelId);
        }
      } else {
        // If no documents left, clear the last viewed
        localStorage.removeItem('chakraLastViewedDocumentId_' + panelId);
      }
    }
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return true;
  };

  /**
   * Get a document by ID
   * @param {string} id - Document ID
   * @returns {ChakraApp.Document|null} Document or null if not found
   */
  ChakraApp.AppState.prototype.getDocument = function(id) {
    return this.documents.get(id) || null;
  };

  /**
   * Get all documents
   * @returns {Array<ChakraApp.Document>} Array of all documents
   */
  ChakraApp.AppState.prototype.getAllDocuments = function() {
    return Array.from(this.documents.values());
  };

  /**
   * Get all documents for a specific panel
   * @param {string} panelId - Panel ID
   * @returns {Array<ChakraApp.Document>} Array of documents for the panel
   */
  ChakraApp.AppState.prototype.getDocumentsForPanel = function(panelId) {
    var panelDocs = [];
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocs.push(doc);
      }
    });
    return panelDocs.reverse();
  };

  /**
   * Select a document and show its circles
   * @param {string} id - Document ID to select
   * @param {string} [panelId] - Panel ID, defaults to the document's panel
   * @returns {ChakraApp.Document|null} Selected document or null if not found
   */
  ChakraApp.AppState.prototype.selectDocument = function(id, panelId) {
    var doc = this.documents.get(id);
    if (!doc) return null;
    
    // Use provided panelId or get from document
    panelId = panelId || doc.panelId;
    
    // Ensure this document belongs to the specified panel
    if (doc.panelId !== panelId) {
      console.warn("Document belongs to a different panel than specified");
      return null;
    }
    
    // Deselect current selection for this panel if different
    if (this.selectedDocumentIds[panelId] && this.selectedDocumentIds[panelId] !== id) {
      this.deselectDocument(panelId);
    }
    
    this.selectedDocumentIds[panelId] = id;
    doc.select();
    
    // Deselect any selected circle
    if (this.selectedCircleId) {
      this.deselectCircle();
    }
    
    // Show only circles for this document in this panel
    this._filterCirclesByDocument(id, panelId);

    // Save as last viewed document for this panel
    this.saveLastViewedDocument(id, panelId);
    
    return doc;
  };

  /**
   * Deselect the current document for a panel
   * @param {string} panelId - Panel ID
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.deselectDocument = function(panelId) {
    if (!this.selectedDocumentIds[panelId]) return false;
    
    var docId = this.selectedDocumentIds[panelId];
    var doc = this.documents.get(docId);
    if (doc) {
      doc.deselect();
    }
    
    this.selectedDocumentIds[panelId] = null;
    
    // Hide circles for this panel
    this._hideCirclesForPanel(panelId);
    
    return true;
  };

  /**
   * Toggle document list visibility for a panel
   * @param {string} panelId - Panel ID
   * @returns {boolean} New visibility state
   */
  ChakraApp.AppState.prototype.toggleDocumentList = function(panelId) {
    this.documentListVisible[panelId] = !this.documentListVisible[panelId];
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
      panelId: panelId, 
      visible: this.documentListVisible[panelId]
    });
    return this.documentListVisible[panelId];
  };

  /**
   * Save the last viewed document ID to localStorage for a panel
   * @param {string} documentId - Document ID
   * @param {string} panelId - Panel ID
   */
  ChakraApp.AppState.prototype.saveLastViewedDocument = function(documentId, panelId) {
    if (documentId && panelId) {
      localStorage.setItem('chakraLastViewedDocumentId_' + panelId, documentId);
    }
  };

  /**
   * Get the last viewed document ID from localStorage for a panel
   * @param {string} panelId - Panel ID
   * @returns {string|null} Document ID or null if none
   */
  ChakraApp.AppState.prototype.getLastViewedDocument = function(panelId) {
    return localStorage.getItem('chakraLastViewedDocumentId_' + panelId);
  };

  /**
   * Show only circles for a specific document in a specific panel
   * @private
   * @param {string} documentId - Document ID to filter by
   * @param {string} panelId - Panel ID
   */
  ChakraApp.AppState.prototype._filterCirclesByDocument = function(documentId, panelId) {
    var self = this;
    
    // Hide all circles for this panel first
    this._hideCirclesForPanel(panelId);
    
    // Show only circles for the selected document
    this.circles.forEach(function(circle, circleId) {
      if (circle.documentId === documentId) {
        // Force update to ensure visibility
        self._notifyStateChanged('circles', circle);
      }
    });
  };

  /**
   * Hide all circles for a specific panel
   * @private
   * @param {string} panelId - Panel ID
   */
  ChakraApp.AppState.prototype._hideCirclesForPanel = function(panelId) {
    var self = this;
    
    // First find all documents for this panel
    var panelDocIds = [];
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocIds.push(doc.id);
      }
    });
    
    // Then hide circles for these documents
    this.circles.forEach(function(circle) {
      if (panelDocIds.includes(circle.documentId)) {
        // Force update to ensure visibility reset
        self._notifyStateChanged('circles', circle);
      }
    });
  };

  //====================================================
  // CIRCLE OPERATIONS
  //====================================================
  
  /**
   * Add a circle to the app state
   * @param {Object|ChakraApp.Circle} circleData - Circle data or instance
   * @param {string} [panelId] - Panel ID (used if no document ID is provided)
   * @returns {ChakraApp.Circle|null} The created circle or null if invalid
   */
  ChakraApp.AppState.prototype.addCircle = function(circleData, panelId) {
    var circle;

    if (circleData instanceof ChakraApp.Circle) {
      circle = circleData;
    } else {
      circle = new ChakraApp.Circle(circleData);
    }

    // If no document ID is provided, assign to selected document for the specified panel
    if (!circle.documentId) {
      var targetPanelId = panelId || 'left';
      var selectedDocId = this.selectedDocumentIds[targetPanelId];
      
      if (selectedDocId) {
        circle.documentId = selectedDocId;
      }
      // If still no document ID, look for any document in the panel
      else {
        var panelDocs = this.getDocumentsForPanel(targetPanelId);
        if (panelDocs.length > 0) {
          circle.documentId = panelDocs[0].id;
        } else {
          // Create a new document for this panel if none exists
          var newDoc = this.addDocument(null, targetPanelId);
          circle.documentId = newDoc.id;
          
          // Select the new document
          this.selectDocument(newDoc.id, targetPanelId);
        }
      }
    }

    // Only add the circle if it has a document ID
    if (circle.documentId) {
      this.circles.set(circle.id, circle);

      // Subscribe to circle changes
      var self = this;
      circle.subscribe(function(change) {
        if (change.type === 'update') {
          self._notifyStateChanged('circles', circle);
        }
      });

      // Notify and publish event
      this._notifyStateChanged('circles', circle);
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_CREATED, circle);

      // Save state to localStorage
      if (!this._isLoading) {
	      this.saveToStorage();
      }

      return circle;
    }

    return null;
  };

  /**
   * Update a circle's properties
   * @param {string} id - Circle ID
   * @param {Object} changes - Properties to update
   * @returns {ChakraApp.Circle|null} Updated circle or null if not found
   */
  ChakraApp.AppState.prototype.updateCircle = function(id, changes) {
    var circle = this.circles.get(id);
    if (!circle) return null;
    
    circle.update(changes);
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return circle;
  };

  /**
   * Remove a circle and all related squares
   * @param {string} id - Circle ID to remove
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.removeCircle = function(id) {
    if (!this.circles.has(id)) return false;
    
    var circle = this.circles.get(id);
    
    // Deselect if this was the selected circle
    if (this.selectedCircleId === id) {
      this.deselectCircle();
    }
    
    // Remove the circle
    this.circles.delete(id);
    
    // Remove all associated squares
    var self = this;
    this.squares.forEach(function(square, squareId) {
      if (square.circleId === id) {
        self.removeSquare(squareId);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('circles', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DELETED, circle);
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return true;
  };

  /**
   * Get a circle by ID
   * @param {string} id - Circle ID
   * @returns {ChakraApp.Circle|null} Circle or null if not found
   */
  ChakraApp.AppState.prototype.getCircle = function(id) {
    return this.circles.get(id) || null;
  };

  /**
   * Get all circles
   * @returns {Array<ChakraApp.Circle>} Array of all circles
   */
  ChakraApp.AppState.prototype.getAllCircles = function() {
    return Array.from(this.circles.values());
  };

  /**
   * Get all circles for a specific document
   * @param {string} documentId - Document ID
   * @returns {Array<ChakraApp.Circle>} Array of circles for the document
   */
  ChakraApp.AppState.prototype.getCirclesForDocument = function(documentId) {
    var circles = [];
    this.circles.forEach(function(circle) {
      if (circle.documentId === documentId) {
        circles.push(circle);
      }
    });
    return circles;
  };

  /**
   * Get all circles for a specific panel
   * @param {string} panelId - Panel ID
   * @returns {Array<ChakraApp.Circle>} Array of circles for the panel
   */
  ChakraApp.AppState.prototype.getCirclesForPanel = function(panelId) {
    var self = this;
    var panelCircles = [];
    
    // Get all document IDs for this panel
    var panelDocIds = [];
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocIds.push(doc.id);
      }
    });
    
    // Get circles for these documents
    this.circles.forEach(function(circle) {
      if (panelDocIds.includes(circle.documentId)) {
        panelCircles.push(circle);
      }
    });
    
    return panelCircles;
  };

  /**
   * Select a circle and show the center panel
   * @param {string} id - Circle ID to select
   * @returns {ChakraApp.Circle|null} Selected circle or null if not found
   */
  ChakraApp.AppState.prototype.selectCircle = function(id) {
    // Deselect current selection if different
    if (this.selectedCircleId && this.selectedCircleId !== id) {
      this.deselectCircle();
    }
    
    var circle = this.circles.get(id);
    if (!circle) return null;
    
    this.selectedCircleId = id;
    circle.select();
    
    // Show center panel
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
      panel: 'center',
      visible: true
    });
    
    return circle;
  };

  /**
   * Deselect the current circle
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.deselectCircle = function() {
    if (!this.selectedCircleId) return false;
    
    var circle = this.circles.get(this.selectedCircleId);
    if (circle) {
      circle.deselect();
    }
    
    this.selectedCircleId = null;
    
    return true;
  };

  /**
   * Handle circle selection event
   * @private
   * @param {string} circleId - Circle ID
   */
  ChakraApp.AppState.prototype._handleCircleSelection = function(circleId) {
	  var self = this;

	  // Clean up any overlapping groups
	  if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
		  ChakraApp.cleanupOverlappingGroups();
	  }

	  // Hide all squares first
	  this.squares.forEach(function(square) {
		  square.hide();
	  });

	  // Get squares for the selected circle
	  var squaresForCircle = this.getSquaresForCircle(circleId);

	  // Create views for these squares if they don't exist
	  if (ChakraApp.app && ChakraApp.app.viewManager) {
		  squaresForCircle.forEach(function(square) {
			  // Check if view already exists
			  if (!ChakraApp.app.viewManager.squareViews.has(square.id)) {
				  // Create the view
				  ChakraApp.app.viewManager.createSquareView(square);
			  }

			  // Show the square
			  square.show();
		  });
	  } else {
		  // Fallback if viewManager isn't available
		  squaresForCircle.forEach(function(square) {
			  square.show();
		  });
	  }

	  // Create or show the "Me" square for this circle if it doesn't exist
	  this._ensureMeSquareExists(circleId);

	  // Clear all connections first
	  this.connections.clear();
	  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);

	  // Then update connections for this circle
	  this._updateConnectionsForCircleId(circleId);
  };

  /**
   * Handle circle deselection event
   * @private
   */
  ChakraApp.AppState.prototype._handleCircleDeselection = function() {
	  var self = this;

	  // Hide all squares
	  this.squares.forEach(function(square) {
		  square.hide();
	  });

	  // Optional: Remove square views to free up memory
	  // Only do this if memory usage is a concern
	  if (ChakraApp.app && ChakraApp.app.viewManager) {
		  var viewManager = ChakraApp.app.viewManager;

		  // Keep track of which squares to remove (all except "me" squares)
		  var squaresToRemove = [];
		  viewManager.squareViews.forEach(function(view, squareId) {
			  var square = self.getSquare(squareId);
			  if (square && !square.isMe) {
				  squaresToRemove.push(squareId);
			  }
		  });

		  // Remove the views
		  squaresToRemove.forEach(function(squareId) {
			  var view = viewManager.squareViews.get(squareId);
			  if (view) {
				  view.destroy();
				  viewManager.squareViews.delete(squareId);
			  }
		  });
	  }

	  // Deselect any selected square
	  this.deselectSquare();

	  // Clear connections
	  this.connections.clear();
	  ChakraApp.OverlappingSquaresManager.cleanup();
	  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
  };

  /**
   * Toggle panel visibility
   * @param {string} panelId - Panel ID
   * @returns {boolean} New visibility state
   */
  ChakraApp.AppState.prototype.togglePanelVisibility = function(panelId) {
    if (!this.panelVisibility.hasOwnProperty(panelId)) return false;
    
    this.panelVisibility[panelId] = !this.panelVisibility[panelId];
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
      panel: panelId,
      visible: this.panelVisibility[panelId]
    });
    
    return this.panelVisibility[panelId];
  };

  /**
   * Check if a panel is visible
   * @param {string} panelId - Panel ID
   * @returns {boolean} Panel visibility
   */
  ChakraApp.AppState.prototype.isPanelVisible = function(panelId) {
    return !!this.panelVisibility[panelId];
  };

  /**
   * Ensure a "Me" square exists for a circle
   * @private
   * @param {string} circleId - Circle ID
   */
  ChakraApp.AppState.prototype._ensureMeSquareExists = function(circleId) {
    // Check if a "Me" square already exists for this circle
    var meSquare = null;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe) {
        meSquare = square;
      }
    });
    
    if (meSquare) {
      // If exists, make sure it's visible
      meSquare.show();
    } else {
      // Create a new "Me" square
      this.addSquare({
        circleId: circleId,
        x: 200,
        y: 200,
        color: '#FFCC88',
        name: 'Me',
        isMe: true
      });
    }
  };

  /**
   * Update chakra form for a circle based on its squares
   * @private
   * @param {string} circleId - Circle ID
   */
  ChakraApp.AppState.prototype._updateChakraFormForCircle = function(circleId) {
    var circle = this.circles.get(circleId);
    if (!circle) return;
    
    // Count the non-Me squares for this circle
    var squareCount = 0;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && !square.isMe) {
        squareCount++;
      }
    });
    
    // Notify about the chakra form update
    circle.update({ squareCount: squareCount });
    
    // Save state to localStorage after updating chakra form
    if (!this._isLoading) {
	    this.saveToStorage();
    }
  };
  
  //====================================================
  // SQUARE OPERATIONS
  //====================================================
  
  /**
   * Add a square to the app state
   * @param {Object|ChakraApp.Square} squareData - Square data or instance
   * @returns {ChakraApp.Square} The created square
   */
  ChakraApp.AppState.prototype.addSquare = function(squareData) {
    var square;
    
    if (squareData instanceof ChakraApp.Square) {
      square = squareData;
    } else {
      square = new ChakraApp.Square(squareData);
    }
    if (!square.tabId && this.selectedTabId && square.circleId === this.selectedCircleId) {
	    square.tabId = this.selectedTabId;
    }
    
    this.squares.set(square.id, square);
    
    // Subscribe to square changes
    var self = this;
    square.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged('squares', square);
        self._updateConnectionsForSquare(square.id);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('squares', square);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_CREATED, square);
    
    // Update the associated circle's chakra form
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    // Create or update connections
    this._updateConnectionsForCircleId(square.circleId);
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return square;
  };

  /**
   * Update a square's properties
   * @param {string} id - Square ID
   * @param {Object} changes - Properties to update
   * @returns {ChakraApp.Square|null} Updated square or null if not found
   */
  ChakraApp.AppState.prototype.updateSquare = function(id, changes) {
    var square = this.squares.get(id);
    if (!square) return null;
    
    square.update(changes);
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return square;
  };

  /**
   * Remove a square and its connections
   * @param {string} id - Square ID to remove
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.removeSquare = function(id) {
    if (!this.squares.has(id)) return false;
    
    var square = this.squares.get(id);
    
    // Deselect if selected
    if (this.selectedSquareId === id) {
      this.deselectSquare();
    }
    
    // Remove the square
    this.squares.delete(id);
    
    // Remove connections involving this square
    this._removeConnectionsForSquare(id);
    
    // Notify and publish event
    this._notifyStateChanged('squares', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_DELETED, square);
    
    // Update the associated circle's chakra form
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    // Save state to localStorage
    if (!this._isLoading) {
	    this.saveToStorage();
    }
    
    return true;
  };

  /**
   * Get a square by ID
   * @param {string} id - Square ID
   * @returns {ChakraApp.Square|null} Square or null if not found
   */
  ChakraApp.AppState.prototype.getSquare = function(id) {
    return this.squares.get(id) || null;
  };

  /**
   * Get all squares
   * @returns {Array<ChakraApp.Square>} Array of all squares
   */
  ChakraApp.AppState.prototype.getAllSquares = function() {
    return Array.from(this.squares.values());
  };

  /**
   * Get squares for a specific circle
   * @param {string} circleId - Circle ID
   * @returns {Array<ChakraApp.Square>} Array of squares
   */
  ChakraApp.AppState.prototype.getSquaresForCircle = function(circleId) {
    var result = [];
    this.squares.forEach(function(square) {
      if (square.circleId === circleId) {
        result.push(square);
      }
    });
    return result;
  };

  /**
   * Select a square
   * @param {string} id - Square ID to select
   * @returns {ChakraApp.Square|null} Selected square or null if not found
   */
  ChakraApp.AppState.prototype.selectSquare = function(id) {
    // Deselect current selection if different
    if (this.selectedSquareId && this.selectedSquareId !== id) {
      this.deselectSquare();
    }
    
    var square = this.squares.get(id);
    if (!square) return null;
    
    this.selectedSquareId = id;
    square.select();
    
    return square;
  };

  /**
   * Deselect the current square and clear multi-selection
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.deselectSquare = function() {
    if (!this.selectedSquareId) return false;
    
    var square = this.squares.get(this.selectedSquareId);
    if (square) {
      square.deselect();
    }
    
    this.selectedSquareId = null;

    // Clear multi-selection if it exists
    if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
      ChakraApp.MultiSelectionManager.clearSelection();
    }
    
    return true;
  };
  
  //====================================================
  // CONNECTION OPERATIONS
  //====================================================
  
  /**
   * Create a connection between two squares
   * @private
   * @param {ChakraApp.Square} square1 - First square
   * @param {ChakraApp.Square} square2 - Second square
   * @returns {ChakraApp.Connection} Created or updated connection
   */
  ChakraApp.AppState.prototype._createConnection = function(square1, square2) {
    var connectionId = ChakraApp.Utils.getLineId(square1.id, square2.id);
    
    // Calculate the distance between squares
    var distance = ChakraApp.Utils.calculateDistance(
      square1.x, square1.y, 
      square2.x, square2.y
    );
    
    // Get max visible connection length from config
    var maxLineLength = ChakraApp.Config.connections ? 
      ChakraApp.Config.connections.maxLineLength : 120;
    
    // Determine if connection should be visible
    var isVisible = distance <= maxLineLength;
    
    // Create or update the connection
    var connectionData = {
      id: connectionId,
      sourceId: square1.id,
      targetId: square2.id,
      length: distance,
      isVisible: isVisible,
      isHighlighted: false
    };
    
    // Create connection model if it doesn't exist
    if (!this.connections.has(connectionId)) {
      var connection = new ChakraApp.Connection(connectionData);
      this.connections.set(connectionId, connection);
    } else {
      // Update existing connection
      var existingConnection = this.connections.get(connectionId);
      existingConnection.update({
        length: distance,
        isVisible: isVisible
      });
    }
    
    return this.connections.get(connectionId);
  };

  /**
   * Update closest "Me" square connection
   * @private
   * @param {string} circleId - Circle ID
   */
  ChakraApp.AppState.prototype._updateClosestMeConnection = function(circleId) {
    // Find the Me square
    var meSquare = null;
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe && square.visible) {
        meSquare = square;
      }
    });
    
    if (!meSquare) return;
    
    // Find all connections that involve the Me square
    var meConnections = [];
    var self = this;
    
    this.connections.forEach(function(conn) {
      if ((conn.sourceId === meSquare.id || conn.targetId === meSquare.id) && conn.isVisible) {
        meConnections.push(conn);
      }
    });
    
    if (meConnections.length === 0) {
      // No visible connections to Me square
      this._updateClosestSquareName(circleId, null);
      return;
    }
    
    // Find the shortest connection
    var shortestConnection = meConnections.reduce(function(shortest, conn) {
      return conn.length < shortest.length ? conn : shortest;
    }, meConnections[0]);
    
    // Reset highlights on all connections
    this.connections.forEach(function(conn) {
      if (conn.isHighlighted) {
        conn.update({ isHighlighted: false });
      }
    });
    
    // Highlight the shortest connection
    shortestConnection.update({ isHighlighted: true });
    
    // Get the other square ID
    var otherSquareId = shortestConnection.sourceId === meSquare.id 
      ? shortestConnection.targetId 
      : shortestConnection.sourceId;
    
    // Get the name of the closest square
    var closestSquare = this.squares.get(otherSquareId);
    if (closestSquare) {
      this._updateClosestSquareName(circleId, closestSquare.name);
    }
    
    // Save state to localStorage after updating connections
    if (!this._isLoading) {
	    this.saveToStorage();
    }
  };

  /**
   * Update the closest square name for a circle
   * @private
   * @param {string} circleId - Circle ID
   * @param {string|null} squareName - Square name or null to clear
   */
  ChakraApp.AppState.prototype._updateClosestSquareName = function(circleId, squareName) {
    var circle = this.circles.get(circleId);
    if (circle) {
      circle.update({ closestSquareName: squareName });
    }
  };

  /**
   * Remove connections for a square
   * @private
   * @param {string} squareId - Square ID
   */
  ChakraApp.AppState.prototype._removeConnectionsForSquare = function(squareId) {
    var connectionsToRemove = [];
    
    // Find all connections involving this square
    this.connections.forEach(function(conn, connId) {
      if (conn.sourceId === squareId || conn.targetId === squareId) {
        connectionsToRemove.push(connId);
      }
    });
    
    // Remove the connections
    var self = this;
    connectionsToRemove.forEach(function(connId) {
      self.connections.delete(connId);
    });
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    
    // Save state to localStorage after removing connections
    if (!this._isLoading) {
	    this.saveToStorage();
    }
  };

  /**
   * Update connections for a square
   * @private
   * @param {string} squareId - Square ID
   */
  ChakraApp.AppState.prototype._updateConnectionsForSquare = function(squareId) {
    var square = this.squares.get(squareId);
    if (!square || !square.visible) return;
    
    this._updateConnectionsForCircleId(square.circleId);
  };

  /**
   * Update connections for all squares in a circle
   * @private
   * @param {string} circleId - Circle ID
   */
  ChakraApp.AppState.prototype._updateConnectionsForCircleId = function(circleId) {
    // Get all visible squares for this circle
    var visibleSquares = this.getSquaresForCircle(circleId).filter(function(square) {
      return square.visible;
    });
    
    // Create connections between each pair of squares
    for (var i = 0; i < visibleSquares.length; i++) {
      for (var j = i + 1; j < visibleSquares.length; j++) {
        this._createConnection(visibleSquares[i], visibleSquares[j]);
      }
    }
    
    // Find the "Me" square and update the closest connection
    this._updateClosestMeConnection(circleId);
    
    // Notify about connection updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
    
    // Save state to localStorage after updating connections
    if (!this._isLoading) {
	    this.saveToStorage();
    }
  };

  /**
   * Update all connections
   * @private
   */
  ChakraApp.AppState.prototype._updateAllConnections = function() {
    // Clear all existing connections
    this.connections.clear();
    
    // If a circle is selected, update its connections
    if (this.selectedCircleId) {
      this._updateConnectionsForCircleId(this.selectedCircleId);
    }
    
    // Save state to localStorage after updating all connections
    if (!this._isLoading) {
	    this.saveToStorage();
    }
  };
  
  //====================================================
  // STORAGE OPERATIONS
  //====================================================
  
  /**
   * Load state from localStorage
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.loadFromStorage = function() {
    try {
      // Set a flag to prevent saving during load
      this._isLoading = true;
      
      var savedData = localStorage.getItem('chakraVisualizerData');
      if (!savedData) {
        this._isLoading = false;
        return false;
      }

      var data = JSON.parse(savedData);

      // Reset current state
      this.documents.clear();
      this.circles.clear();
      this.squares.clear();
      this.connections.clear();
      this.tabs.clear();
      
      // Reset selection state
      this.selectedDocumentIds = {
        left: null,
        right: null,
        bottom: null
      };
      this.selectedCircleId = null;
      this.selectedSquareId = null;
      this.selectedTabId = null;

      // Load documents
      if (data.documents && Array.isArray(data.documents)) {
        var self = this;
        data.documents.forEach(function(documentData) {
          // Ensure panelId is set (default to 'left' for backwards compatibility)
          documentData.panelId = documentData.panelId || 'left';
          self.addDocument(documentData);
        });
      } else {
        // If no documents in storage, create default documents for each panel
        this.panels.forEach(function(panelId) {
          this.addDocument(null, panelId);
        }, this);
      }

      // Load circles
      if (data.circles && Array.isArray(data.circles)) {
        var self = this;
        data.circles.forEach(function(circleData) {
          self.addCircle(circleData);
        });
      }

      // Load squares
      if (data.squares && Array.isArray(data.squares)) {
        var self = this;
        data.squares.forEach(function(squareData) {
          self.addSquare(squareData);
        });
      }

    // Load tabs
    if (data.tabs && Array.isArray(data.tabs)) {
      var self = this;
      data.tabs.forEach(function(tabData) {
        self.addTab(tabData);
      });
    }

      // For each panel, select the last viewed document or the first document
      this.panels.forEach(function(panelId) {
        var lastViewedDocumentId = this.getLastViewedDocument(panelId);
        
        if (lastViewedDocumentId && this.documents.has(lastViewedDocumentId)) {
          var doc = this.documents.get(lastViewedDocumentId);
          if (doc.panelId === panelId) {
            this.selectDocument(lastViewedDocumentId, panelId);
          }
        } else {
          // Select first document for this panel if none selected
          var panelDocuments = this.getDocumentsForPanel(panelId);
          if (panelDocuments.length > 0) {
            this.selectDocument(panelDocuments[0].id, panelId);
            // Also save this as the last viewed document
            this.saveLastViewedDocument(panelDocuments[0].id, panelId);
          }
        }
      }, this);

      // Notify and publish event
      this._notifyStateChanged('all', data);
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_LOADED, data);

      // Clean up any overlapping groups
      if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
        ChakraApp.cleanupOverlappingGroups();
      }
      
      // Clear loading flag and save once after loading
      this._isLoading = false;
      this.saveToStorageNow();

      return true;
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      this._isLoading = false;
      return false;
    }
  };

  /**
   * Save state to localStorage with debouncing
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.saveToStorage = function() {
    try {
      // Clear any existing save timeout
      if (this._saveTimeout) {
        clearTimeout(this._saveTimeout);
      }

      // Set a new timeout to save after a short delay (prevents rapid-fire saves)
      var self = this;
      this._saveTimeout = setTimeout(function() {
        self._actualSaveToStorage();
      }, 300); // 300ms debounce

      return true;
    } catch (error) {
      console.error('Error scheduling state save to localStorage:', error);
      return false;
    }
  };

  /**
   * Actual save operation (separated from the debounced public method)
   * @private
   */
  ChakraApp.AppState.prototype._actualSaveToStorage = function() {
    try {
      var documents = [];
      this.documents.forEach(function(doc) {
        documents.push(doc.toJSON());
      });

      var circles = [];
      this.circles.forEach(function(circle) {
        circles.push(circle.toJSON());
      });

      var squares = [];
      this.squares.forEach(function(square) {
        squares.push(square.toJSON());
      });

      var tabs = [];
      this.tabs.forEach(function(tab) {
	      tabs.push(tab.toJSON());
      });

      var data = {
        documents: documents,
        circles: circles,
        squares: squares,
	tabs: tabs,
        selectedDocumentIds: this.selectedDocumentIds
      };

      localStorage.setItem('chakraVisualizerData', JSON.stringify(data));

      // Publish event
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_SAVED, data);

      return true;
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
      return false;
    }
  };

  /**
   * Save to localStorage immediately, bypassing debounce
   * @returns {boolean} Success indicator
   */
  ChakraApp.AppState.prototype.saveToStorageNow = function() {
    // Clear any existing timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    
    // Call the actual save method directly
    return this._actualSaveToStorage();
  };

  // Create the singleton instance
  ChakraApp.appState = new ChakraApp.AppState();
  
})(window.ChakraApp = window.ChakraApp || {});
