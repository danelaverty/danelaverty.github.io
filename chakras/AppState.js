// src/state/AppState.js
// Central state management for the application

(function(ChakraApp) {
  /**
   * Application State Manager - handles all application state
   */
  ChakraApp.AppState = function() {
    // Inherit from Observable
    ChakraApp.Observable.call(this);
    this._initializeState();
    this._setupEventListeners();
    this._loadPanelState();
  };
  
  // Inherit from Observable
  ChakraApp.AppState.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.AppState.prototype.constructor = ChakraApp.AppState;
  
  // Initialize state
  ChakraApp.AppState.prototype._initializeState = function() {
    // Core state collections
    this.documents = new Map();
    this.circles = new Map();
    this.squares = new Map();
    this.connections = new Map();
    this.tabs = new Map();

    // Panel configuration
    this.panels = ['left', 'right', 'farRight', 'bottom'];

    // Selection state 
    this.selectedDocumentIds = { left: null, right: null, farRight: null, bottom: null };
    this.selectedCircleId = null;
    this.selectedSquareId = null;
    this.selectedTabId = null;
    
    // UI state
    this.panelVisibility = { left: true, right: true, farRight: true, bottom: true };
    this.documentListVisible = { left: false, right: false, farRight: false, bottom: false };
  };
  
  // Setup event listeners
  ChakraApp.AppState.prototype._setupEventListeners = function() {
    var self = this;
    
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_UPDATED, function(square) {
      self._updateConnectionsForSquare(square.id);
    });
    
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_SELECTED, function(circle) {
      self._handleCircleSelection(circle.id);
    });
    
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_DESELECTED, function() {
      self._handleCircleDeselection();
    });
  };

  /**
   * Notify observers about state changes
   */
  ChakraApp.AppState.prototype._notifyStateChanged = function(section, data) {
    this.notify({ section: section, data: data });
  };
  
  // Generic CRUD operations for all entity types
  ChakraApp.AppState.prototype._createEntity = function(entityType, entityClass, data, eventPrefix, panelId) {
    var entity;
    
    if (data instanceof entityClass) {
      entity = data;
    } else {
      // Handle special case for documents with panelId
      if (entityType === 'documents' && panelId) {
        data = data || {};
        data.panelId = data.panelId || panelId;
      }
      
      entity = new entityClass(data);
    }
    
    // Add to collection
    this[entityType].set(entity.id, entity);
    
    // Subscribe to entity changes
    var self = this;
    entity.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged(entityType, entity);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged(entityType, entity);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes[eventPrefix + '_CREATED'], entity);
    
    // Save state
    if (!this._isLoading) {
      this.saveToStorage();
    }
    
    return entity;
  };
  
  ChakraApp.AppState.prototype._updateEntity = function(entityType, id, changes) {
    var entity = this[entityType].get(id);
    if (!entity) return null;
    
    entity.update(changes);
    
    // Save state
    if (!this._isLoading) {
      this.saveToStorage();
    }
    
    return entity;
  };

  // DOCUMENT OPERATIONS
  ChakraApp.AppState.prototype.addDocument = function(documentData, panelId) {
    return this._createEntity('documents', ChakraApp.Document, documentData, 'DOCUMENT', panelId);
  };
  
  ChakraApp.AppState.prototype.updateDocument = function(id, changes) {
    return this._updateEntity('documents', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeDocument = function(id) {
    if (!this.documents.has(id)) return false;
    
    var doc = this.documents.get(id);
    var panelId = doc.panelId;
    
    // Deselect if selected
    if (this.selectedDocumentIds[panelId] === id) {
      this.deselectDocument(panelId);
    }

    // Check if removing last viewed document
    var lastViewedId = this.getLastViewedDocument(panelId);
    var isRemovingLastViewed = lastViewedId === id;
    
    // Remove document
    this.documents.delete(id);
    
    // Remove associated circles
    var circlesToRemove = [];
    this.circles.forEach(function(circle, circleId) {
      if (circle.documentId === id) {
        circlesToRemove.push(circleId);
      }
    });
    
    var self = this;
    circlesToRemove.forEach(function(circleId) {
      self.removeCircle(circleId);
    });
    
    // Notify and publish event
    this._notifyStateChanged('documents', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_DELETED, doc);
    
    // Update last viewed document if needed
    if (isRemovingLastViewed) {
      var panelDocuments = this.getDocumentsForPanel(panelId);
      if (panelDocuments.length > 0) {
        var nextDocument = panelDocuments[0];
        this.saveLastViewedDocument(nextDocument.id, panelId);
        
        if (this.selectedDocumentIds[panelId] === null) {
          this.selectDocument(nextDocument.id, panelId);
        }
      } else {
        localStorage.removeItem('chakraLastViewedDocumentId_' + panelId);
      }
    }
    
    // Save state
    if (!this._isLoading) {
      this.saveToStorage();
    }
    
    return true;
  };
  
  ChakraApp.AppState.prototype.getDocument = function(id) {
    return this.documents.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllDocuments = function() {
    return Array.from(this.documents.values());
  };
  
  ChakraApp.AppState.prototype.getDocumentsForPanel = function(panelId) {
    var panelDocs = [];
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocs.push(doc);
      }
    });
    return panelDocs.reverse();
  };
  
  ChakraApp.AppState.prototype.selectDocument = function(id, panelId) {
    var doc = this.documents.get(id);
    if (!doc) return null;
    
    panelId = panelId || doc.panelId;
    
    if (doc.panelId !== panelId) {
      console.warn("Document belongs to a different panel than specified");
      return null;
    }
    
    // Deselect current selection if different
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

    // Save as last viewed document
    this.saveLastViewedDocument(id, panelId);
    
    return doc;
  };
  
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
  
  ChakraApp.AppState.prototype.toggleDocumentList = function(panelId) {
    this.documentListVisible[panelId] = !this.documentListVisible[panelId];
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
      panelId: panelId, 
      visible: this.documentListVisible[panelId]
    });
    return this.documentListVisible[panelId];
  };
  
  ChakraApp.AppState.prototype.saveLastViewedDocument = function(documentId, panelId) {
    if (documentId && panelId) {
      localStorage.setItem('chakraLastViewedDocumentId_' + panelId, documentId);
    }
  };
  
  ChakraApp.AppState.prototype.getLastViewedDocument = function(panelId) {
    return localStorage.getItem('chakraLastViewedDocumentId_' + panelId);
  };
  
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
  
  ChakraApp.AppState.prototype._hideCirclesForPanel = function(panelId) {
    var self = this;
    
    // Find all documents for this panel
    var panelDocIds = [];
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocIds.push(doc.id);
      }
    });
    
    // Hide circles for these documents
    this.circles.forEach(function(circle) {
      if (panelDocIds.includes(circle.documentId)) {
        // Force update to ensure visibility reset
        self._notifyStateChanged('circles', circle);
      }
    });
  };

  // CIRCLE OPERATIONS
  ChakraApp.AppState.prototype.addCircle = function(circleData, panelId) {
    var circle;

    if (circleData instanceof ChakraApp.Circle) {
      circle = circleData;
    } else {
      circle = new ChakraApp.Circle(circleData);
    }

    // If no document ID, assign to selected document for the panel
    if (!circle.documentId) {
      var targetPanelId = panelId || 'left';
      var selectedDocId = this.selectedDocumentIds[targetPanelId];
      
      if (selectedDocId) {
        circle.documentId = selectedDocId;
      } else {
        // Look for any document in the panel
        var panelDocs = this.getDocumentsForPanel(targetPanelId);
        if (panelDocs.length > 0) {
          circle.documentId = panelDocs[0].id;
        } else {
          // Create a new document if none exists
          var newDoc = this.addDocument(null, targetPanelId);
          circle.documentId = newDoc.id;
          
          // Select the new document
          this.selectDocument(newDoc.id, targetPanelId);
        }
      }
    }

    // Only add if it has a document ID
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

      // Save state
      if (!this._isLoading) {
        this.saveToStorage();
      }

      return circle;
    }

    return null;
  };
  
  ChakraApp.AppState.prototype.updateCircle = function(id, changes) {
    return this._updateEntity('circles', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeCircle = function(id) {
    if (!this.circles.has(id)) return false;
    
    var circle = this.circles.get(id);
    
    // Deselect if selected
    if (this.selectedCircleId === id) {
      this.deselectCircle();
    }
    
    // Remove circle
    this.circles.delete(id);
    
    // Remove associated squares
    var self = this;
    this.squares.forEach(function(square, squareId) {
      if (square.circleId === id) {
        self.removeSquare(squareId);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('circles', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DELETED, circle);
    
    // Save state
    if (!this._isLoading) {
      this.saveToStorage();
    }
    
    return true;
  };
  
  ChakraApp.AppState.prototype.getCircle = function(id) {
    return this.circles.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllCircles = function() {
    return Array.from(this.circles.values());
  };
  
  ChakraApp.AppState.prototype.getCirclesForDocument = function(documentId) {
    var circles = [];
    this.circles.forEach(function(circle) {
      if (circle.documentId === documentId) {
        circles.push(circle);
      }
    });
    return circles;
  };
  
  ChakraApp.AppState.prototype.getCirclesForPanel = function(panelId) {
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
  
  ChakraApp.AppState.prototype.deselectCircle = function() {
    if (!this.selectedCircleId) return false;
    
    var circle = this.circles.get(this.selectedCircleId);
    if (circle) {
      circle.deselect();
    }
    
    this.selectedCircleId = null;
    
    return true;
  };
  
  // Handle circle selection
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

    // Show squares for the selected circle
    var squaresForCircle = this.getSquaresForCircle(circleId);
    if (ChakraApp.app && ChakraApp.app.viewManager) {
      squaresForCircle.forEach(function(square) {
        if (!ChakraApp.app.viewManager.squareViews.has(square.id)) {
          ChakraApp.app.viewManager.createSquareView(square);
        }
        square.show();
      });
    } else {
      squaresForCircle.forEach(function(square) {
        square.show();
      });
    }

    // Create or show the "Me" square if needed
    this._ensureMeSquareExists(circleId);

    // Clear connections and update for this circle
    this.connections.clear();
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    this._updateConnectionsForCircleId(circleId);
  };
  
  // Handle circle deselection
  ChakraApp.AppState.prototype._handleCircleDeselection = function() {
    var self = this;

    // Hide all squares
    this.squares.forEach(function(square) {
      square.hide();
    });

    // Clean up square views
    if (ChakraApp.app && ChakraApp.app.viewManager) {
      var viewManager = ChakraApp.app.viewManager;
      var squaresToRemove = [];
      
      viewManager.squareViews.forEach(function(view, squareId) {
        var square = self.getSquare(squareId);
        if (square && !square.isMe) {
          squaresToRemove.push(squareId);
        }
      });

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
  
  // Panel visibility operations
ChakraApp.AppState.prototype.togglePanelVisibility = function(panelId) {
  if (!this.panelVisibility.hasOwnProperty(panelId)) return false;
  
  this.panelVisibility[panelId] = !this.panelVisibility[panelId];
  
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
    panel: panelId,
    visible: this.panelVisibility[panelId]
  });
  
  // Save panel state to local storage
  this._savePanelState();
  
  return this.panelVisibility[panelId];
};
  
  ChakraApp.AppState.prototype.isPanelVisible = function(panelId) {
  return !!this.panelVisibility[panelId];
};

ChakraApp.AppState.prototype._savePanelState = function() {
  try {
    localStorage.setItem('chakraPanelVisibility', JSON.stringify(this.panelVisibility));
  } catch (e) {
    console.error('Error saving panel state:', e);
  }
};

ChakraApp.AppState.prototype._loadPanelState = function() {
  try {
    var savedState = localStorage.getItem('chakraPanelVisibility');
    if (savedState) {
      var panelState = JSON.parse(savedState);
      
      // Update panelVisibility with saved values
      for (var panelId in panelState) {
        if (this.panelVisibility.hasOwnProperty(panelId)) {
          this.panelVisibility[panelId] = panelState[panelId];
        }
      }
    }
  } catch (e) {
    console.error('Error loading panel state:', e);
  }
};
  
  // Create Me square if it doesn't exist
  ChakraApp.AppState.prototype._ensureMeSquareExists = function(circleId) {
    var meSquare = null;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe) {
        meSquare = square;
      }
    });
    
    if (meSquare) {
      meSquare.show();
    } else {
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
  
  // Update chakra form for a circle
  ChakraApp.AppState.prototype._updateChakraFormForCircle = function(circleId) {
    var circle = this.circles.get(circleId);
    if (!circle) return;
    
    var squareCount = 0;
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && !square.isMe) {
        squareCount++;
      }
    });
    
    circle.update({ squareCount: squareCount });
    
    if (!this._isLoading) {
      this.saveToStorage();
    }
  };

  // SQUARE OPERATIONS
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
    
    this._notifyStateChanged('squares', square);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_CREATED, square);
    
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    this._updateConnectionsForCircleId(square.circleId);
    
    if (!this._isLoading) {
      this.saveToStorage();
    }
    
    return square;
  };
  
  ChakraApp.AppState.prototype.updateSquare = function(id, changes) {
    return this._updateEntity('squares', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeSquare = function(id) {
    if (!this.squares.has(id)) return false;
    
    var square = this.squares.get(id);
    
    if (this.selectedSquareId === id) {
      this.deselectSquare();
    }
    
    this.squares.delete(id);
    this._removeConnectionsForSquare(id);
    
    this._notifyStateChanged('squares', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_DELETED, square);
    
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    if (!this._isLoading) {
      this.saveToStorage();
    }
    
    return true;
  };
  
  ChakraApp.AppState.prototype.getSquare = function(id) {
    return this.squares.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllSquares = function() {
    return Array.from(this.squares.values());
  };
  
  ChakraApp.AppState.prototype.getSquaresForCircle = function(circleId) {
    var result = [];
    this.squares.forEach(function(square) {
      if (square.circleId === circleId) {
        result.push(square);
      }
    });
    return result;
  };
  
  ChakraApp.AppState.prototype.selectSquare = function(id) {
    if (this.selectedSquareId && this.selectedSquareId !== id) {
      this.deselectSquare();
    }
    
    var square = this.squares.get(id);
    if (!square) return null;
    
    this.selectedSquareId = id;
    square.select();
    
    return square;
  };
  
  ChakraApp.AppState.prototype.deselectSquare = function() {
    if (!this.selectedSquareId) return false;
    
    var square = this.squares.get(this.selectedSquareId);
    if (square) {
      square.deselect();
    }
    
    this.selectedSquareId = null;

    if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
      ChakraApp.MultiSelectionManager.clearSelection();
    }
    
    return true;
  };
  
  // CONNECTION OPERATIONS
  ChakraApp.AppState.prototype._createConnection = function(square1, square2) {
    var connectionId = ChakraApp.Utils.getLineId(square1.id, square2.id);
    
    // Calculate distance
    var distance = ChakraApp.Utils.calculateDistance(
      square1.x, square1.y, square2.x, square2.y
    );
    
    // Determine visibility based on max length
    var maxLineLength = ChakraApp.Config.connections ? 
      ChakraApp.Config.connections.maxLineLength : 120;
    var isVisible = distance <= maxLineLength;
    
    // Create or update connection
    if (!this.connections.has(connectionId)) {
      var connection = new ChakraApp.Connection({
        id: connectionId,
        sourceId: square1.id,
        targetId: square2.id,
        length: distance,
        isVisible: isVisible,
        isHighlighted: false
      });
      this.connections.set(connectionId, connection);
    } else {
      this.connections.get(connectionId).update({
        length: distance,
        isVisible: isVisible
      });
    }
    
    return this.connections.get(connectionId);
  };
  
  // Update closest connection to Me square
  ChakraApp.AppState.prototype._updateClosestMeConnection = function(circleId) {
    var meSquare = null;
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe && square.visible) {
        meSquare = square;
      }
    });
    
    if (!meSquare) return;
    
    // Find visible connections to Me
    var meConnections = [];
    this.connections.forEach(function(conn) {
      if ((conn.sourceId === meSquare.id || conn.targetId === meSquare.id) && conn.isVisible) {
        meConnections.push(conn);
      }
    });
    
    if (meConnections.length === 0) {
      this._updateClosestSquareName(circleId, null);
      return;
    }
    
    // Find shortest connection
    var shortestConnection = meConnections.reduce(function(shortest, conn) {
      return conn.length < shortest.length ? conn : shortest;
    }, meConnections[0]);
    
    // Reset highlights
    this.connections.forEach(function(conn) {
      if (conn.isHighlighted) {
        conn.update({ isHighlighted: false });
      }
    });
    
    // Highlight shortest connection
    shortestConnection.update({ isHighlighted: true });
    
    // Get name of connected square
    var otherSquareId = shortestConnection.sourceId === meSquare.id 
      ? shortestConnection.targetId 
      : shortestConnection.sourceId;
    
    var closestSquare = this.squares.get(otherSquareId);
    if (closestSquare) {
      this._updateClosestSquareName(circleId, closestSquare.name);
    }
    
    if (!this._isLoading) {
      this.saveToStorage();
    }
  };
  
  ChakraApp.AppState.prototype._updateClosestSquareName = function(circleId, squareName) {
    var circle = this.circles.get(circleId);
    if (circle) {
      circle.update({ closestSquareName: squareName });
    }
  };
  
  ChakraApp.AppState.prototype._removeConnectionsForSquare = function(squareId) {
    var connectionsToRemove = [];
    
    this.connections.forEach(function(conn, connId) {
      if (conn.sourceId === squareId || conn.targetId === squareId) {
        connectionsToRemove.push(connId);
      }
    });
    
    var self = this;
    connectionsToRemove.forEach(function(connId) {
      self.connections.delete(connId);
    });
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    
    if (!this._isLoading) {
      this.saveToStorage();
    }
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForSquare = function(squareId) {
    var square = this.squares.get(squareId);
    if (!square || !square.visible) return;
    
    this._updateConnectionsForCircleId(square.circleId);
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForCircleId = function(circleId) {
    // Get all visible squares for this circle
    var visibleSquares = this.getSquaresForCircle(circleId).filter(function(square) {
      return square.visible;
    });
    
    // Create connections between each pair
    for (var i = 0; i < visibleSquares.length; i++) {
      for (var j = i + 1; j < visibleSquares.length; j++) {
        this._createConnection(visibleSquares[i], visibleSquares[j]);
      }
    }
    
    // Update closest Me connection
    this._updateClosestMeConnection(circleId);
    
    // Notify about connection updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
    
    if (!this._isLoading) {
      this.saveToStorage();
    }
  };
  
  // TAB OPERATIONS
  ChakraApp.AppState.prototype.addTab = function(tabData) {
    return this._createEntity('tabs', ChakraApp.Tab, tabData, 'TAB');
  };
  
  ChakraApp.AppState.prototype.updateTab = function(id, changes) {
    return this._updateEntity('tabs', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeTab = function(id) {
    if (!this.tabs.has(id)) return false;
    
    var tab = this.tabs.get(id);
    
    // Deselect if selected
    if (this.selectedTabId === id) {
      this.deselectTab();
    }
    
    // Remove the tab
    this.tabs.delete(id);
    
    // Find and remove squares for this tab
    var squaresToRemove = [];
    this.squares.forEach(function(square, squareId) {
      if (square.tabId === id) {
        squaresToRemove.push(squareId);
      }
    });
    
    var self = this;
    squaresToRemove.forEach(function(squareId) {
      self.removeSquare(squareId);
    });
    
    // Notify and publish event
    this._notifyStateChanged('tabs', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_DELETED, tab);
    
    // Save state
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
    if (this.selectedTabId && this.selectedTabId !== id) {
      this.deselectTab();
    }
    
    var tab = this.tabs.get(id);
    if (!tab) return null;
    
    this.selectedTabId = id;
    tab.select();
    
    // Show only squares for this tab
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
  
  ChakraApp.AppState.prototype._filterSquaresByTab = function(tabId) {
    var self = this;
    
    // Hide all squares for the selected circle
    this.squares.forEach(function(square) {
      if (square.circleId === self.selectedCircleId) {
        square.hide();
      }
    });
    
    // Show squares for the selected tab
    this.squares.forEach(function(square) {
      if (square.tabId === tabId && square.circleId === self.selectedCircleId) {
        square.show();
      }
    });
    
    // Update connections
    this._updateConnectionsForCircleId(this.selectedCircleId);
  };

  // STORAGE OPERATIONS
  ChakraApp.AppState.prototype.loadFromStorage = function() {
    try {
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
      this.selectedDocumentIds = { left: null, right: null, farRight: null, bottom: null };
      this.selectedCircleId = null;
      this.selectedSquareId = null;
      this.selectedTabId = null;

      // Load entities
      var self = this;
      
      if (data.documents && Array.isArray(data.documents)) {
        data.documents.forEach(function(documentData) {
          documentData.panelId = documentData.panelId || 'left';
          self.addDocument(documentData);
        });
      } else {
        this.panels.forEach(function(panelId) {
          self.addDocument(null, panelId);
        });
      }

      if (data.circles && Array.isArray(data.circles)) {
        data.circles.forEach(function(circleData) {
          self.addCircle(circleData);
        });
      }

      if (data.squares && Array.isArray(data.squares)) {
        data.squares.forEach(function(squareData) {
          self.addSquare(squareData);
        });
      }

      if (data.tabs && Array.isArray(data.tabs)) {
        data.tabs.forEach(function(tabData) {
          self.addTab(tabData);
        });
      }

      // Select last viewed documents
      this.panels.forEach(function(panelId) {
        var lastViewedDocumentId = self.getLastViewedDocument(panelId);
        
        if (lastViewedDocumentId && self.documents.has(lastViewedDocumentId)) {
          var doc = self.documents.get(lastViewedDocumentId);
          if (doc.panelId === panelId) {
            self.selectDocument(lastViewedDocumentId, panelId);
          }
        } else {
          var panelDocuments = self.getDocumentsForPanel(panelId);
          if (panelDocuments.length > 0) {
            self.selectDocument(panelDocuments[0].id, panelId);
            self.saveLastViewedDocument(panelDocuments[0].id, panelId);
          }
        }
      });

      this._notifyStateChanged('all', data);
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_LOADED, data);

      if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
        ChakraApp.cleanupOverlappingGroups();
      }
      
      this._isLoading = false;
      this.saveToStorageNow();

      return true;
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      this._isLoading = false;
      return false;
    }
  };
  
  // Save state with debouncing
  ChakraApp.AppState.prototype.saveToStorage = function() {
    try {
      if (this._saveTimeout) {
        clearTimeout(this._saveTimeout);
      }

      var self = this;
      this._saveTimeout = setTimeout(function() {
        self._actualSaveToStorage();
      }, 300);

      return true;
    } catch (error) {
      console.error('Error scheduling state save:', error);
      return false;
    }
  };
  
  // Actual save operation
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
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_SAVED, data);

      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  };
  
  // Save immediately without debounce
  ChakraApp.AppState.prototype.saveToStorageNow = function() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    
    return this._actualSaveToStorage();
  };

  // Create the singleton instance
  ChakraApp.appState = new ChakraApp.AppState();
  
})(window.ChakraApp = window.ChakraApp || {});
