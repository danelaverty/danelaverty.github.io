(function(ChakraApp) {
  // Override event handler methods defined as stubs in AppState.js
  ChakraApp.AppState.prototype._handleSquareUpdated = function(square) {
    this._updateConnectionsForSquare(square.id);
  };
  ChakraApp.AppState.prototype._generateEntityMethods = function() {
    const handlers = this._getEntityHandlers();
    
    Object.keys(handlers).forEach(entityType => {
      const handler = handlers[entityType];
      
      // Generate singular form of entity type (e.g., "documents" -> "Document")
      const singularType = entityType.charAt(0).toUpperCase() + entityType.slice(1, -1);
      
      // Only skip adding the addCircle method, since we have a custom implementation
      // Generate all other methods for all entity types
      
      // Add method - skip only addCircle
      const addMethodName = 'add' + singularType;
      if (!(entityType === 'circles' && this[addMethodName])) {
	      this[addMethodName] = function(data, panelId) {
		      if (data && this.selectedTabId) {
			      data.tabId = this.selectedTabId;
		      }
		      const entity = this._createEntity(entityType, handler.class, data, handler.prefix, panelId);

		      if (entityType === 'squares' && entity && entity.circleId) {
			      this._updateChakraFormForCircle(entity.circleId);
		      }

		      return entity;
	      };
      }
      
      // Update method - always create
      const updateMethodName = 'update' + singularType;
      this[updateMethodName] = function(id, changes) {
        return this._updateEntity(entityType, id, changes);
      };
      
      // Remove method - always create
      const removeMethodName = 'remove' + singularType;
      this[removeMethodName] = function(id) {
	      const entity = this[entityType].get(id) || null;

	      var result = this._removeEntity(entityType, id, handler.prefix, entity => handler.cleanup(entity, id));
	      if (entityType === 'squares' && entity && entity.circleId) {
		      this._updateChakraFormForCircle(entity.circleId);
	      }
	      return result;
      };
      
      // Get method - always create
      const getMethodName = 'get' + singularType;
      this[getMethodName] = function(id) {
        return this[entityType].get(id) || null;
      };
      
      // For collection types (except circles), add methods to get all entities of that type
      if (entityType !== 'circles') {
        // getSquaresForCircle
        if (entityType === 'squares') {
          this['getSquaresForCircle'] = function(circleId) {
            var result = [];
            
            this.squares.forEach(function(square) {
              if (square.circleId === circleId) {
                result.push(square);
              }
            });
            
            return result;
          };
        }
        
        // getTabsForCircle
        if (entityType === 'tabs') {
          this['getTabsForCircle'] = function(circleId) {
            var tabs = [];
            
            this.tabs.forEach(function(tab) {
              if (tab.circleId === circleId) {
                tabs.push(tab);
              }
            });
            
            return tabs.sort(function(a, b) {
              return a.index - b.index;
            });
          };
        }
      }
    });
  };

  // Document methods
  ChakraApp.AppState.prototype._deselectDocumentIfSelected = function(panelId, id) {
    if (this.selectedDocumentIds[panelId] === id) {
      this.deselectDocument(panelId);
    }
  };
  
  ChakraApp.AppState.prototype._handleLastViewedDocument = function(panelId, id) {
    var lastViewedId = this.getLastViewedDocument(panelId);
    
    if (lastViewedId === id) {
      this._updateLastViewedAfterRemoval(panelId);
    }
  };
  
  ChakraApp.AppState.prototype._updateLastViewedAfterRemoval = function(panelId) {
    var panelDocuments = this.getDocumentsForPanel(panelId);
    
    if (panelDocuments.length > 0) {
      this._selectNextDocumentAfterRemoval(panelId, panelDocuments[0]);
    } else {
      localStorage.removeItem('chakraLastViewedDocumentId_' + panelId);
    }
  };
  
  ChakraApp.AppState.prototype._selectNextDocumentAfterRemoval = function(panelId, nextDocument) {
    this.saveLastViewedDocument(nextDocument.id, panelId);
    
    if (this.selectedDocumentIds[panelId] === null) {
      this.selectDocument(nextDocument.id, panelId);
    }
  };
  
  ChakraApp.AppState.prototype._removeAssociatedCircles = function(documentId) {
    var circlesToRemove = this._findCirclesByDocumentId(documentId);
    circlesToRemove.forEach(circleId => this.removeCircle(circleId));
  };
  
  ChakraApp.AppState.prototype._findCirclesByDocumentId = function(documentId) {
    var circlesToRemove = [];
    
    this.circles.forEach(function(circle, circleId) {
      if (circle.documentId === documentId) {
        circlesToRemove.push(circleId);
      }
    });
    
    return circlesToRemove;
  };

  ChakraApp.AppState.prototype.getAllDocuments = function() {
    return Array.from(this.documents.values());
  };
  
  ChakraApp.AppState.prototype.getDocumentsForPanel = function(panelId) {
    return this._filterDocumentsByPanel(panelId).reverse();
  };
  
  ChakraApp.AppState.prototype._filterDocumentsByPanel = function(panelId) {
    var panelDocs = [];
    
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocs.push(doc);
      }
    });
    
    return panelDocs;
  };
  
  ChakraApp.AppState.prototype.selectDocument = function(id, panelId) {
    var doc = this.documents.get(id);
    if (!doc) return null;
    
    var docPanelId = panelId || doc.panelId;
    
    if (doc.panelId !== docPanelId) {
      console.warn("Document belongs to a different panel than specified");
      return null;
    }
    
    if (this.selectedDocumentIds[docPanelId] && this.selectedDocumentIds[docPanelId] !== id) {
      this.deselectDocument(docPanelId);
    }
    
    this.selectedDocumentIds[docPanelId] = id;
    doc.select();
    
    this._deselectCircleIfSelected();
    this._filterCirclesByDocument(doc.id, docPanelId);
    this.saveLastViewedDocument(doc.id, docPanelId);
    
    return doc;
  };
  
  ChakraApp.AppState.prototype._deselectCircleIfSelected = function() {
    if (this.selectedCircleId) {
      this.deselectCircle();
    }
  };
  
  ChakraApp.AppState.prototype.deselectDocument = function(panelId) {
    if (!this.selectedDocumentIds[panelId]) return false;
    
    var docId = this.selectedDocumentIds[panelId];
    var doc = this.documents.get(docId);
    
    if (doc) {
      doc.deselect();
    }
    
    this.selectedDocumentIds[panelId] = null;
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
  // Check if we need to handle the special case of multiple documents in left panel
  if (panelId === 'left') {
    this._hideCirclesForPanel(panelId); // Hide circles for left panel
    
    // Show circles for the selected 'left' document
    this._showCirclesForDocument(documentId);
    
    // Also show circles for the selected 'things' document if it exists
    var thingsDocId = this.selectedDocumentIds['things'];
    if (thingsDocId) {
      this._showCirclesForDocument(thingsDocId);
    }
  } else if (panelId === 'things') {
    // If a things document is selected, we need to update the left panel
    
    // Don't hide all circles in the left panel, just the ones from 'things' documents
    this._hideCirclesForPanelType('things');
    
    // Show circles for this things document in the left panel
    this._showCirclesForDocument(documentId);
  } else {
    // Original behavior for other panels
    this._hideCirclesForPanel(panelId);
    this._showCirclesForDocument(documentId);
  }
};
  
  ChakraApp.AppState.prototype._showCirclesForDocument = function(documentId) {
    this.circles.forEach(circle => {
      if (circle.documentId === documentId) {
        this._notifyStateChanged('circles', circle);
      }
    });
  };
  
  ChakraApp.AppState.prototype._hideCirclesForPanel = function(panelId) {
    var panelDocIds = this._getDocumentIdsForPanel(panelId);
    
    this.circles.forEach(circle => {
      if (panelDocIds.includes(circle.documentId)) {
        this._notifyStateChanged('circles', circle);
      }
    });
  };

ChakraApp.AppState.prototype._hideCirclesForPanelType = function(panelType) {
  var self = this;
  var panelDocIds = [];
  
  // Get all document IDs for the specified panel type
  this.documents.forEach(function(doc) {
    if (doc.panelId === panelType) {
      panelDocIds.push(doc.id);
    }
  });
  
  // Hide circles for those documents
  this.circles.forEach(function(circle) {
    if (panelDocIds.includes(circle.documentId)) {
      self._notifyStateChanged('circles', circle);
    }
  });
};
  
  ChakraApp.AppState.prototype._getDocumentIdsForPanel = function(panelId) {
    var panelDocIds = [];
    
    this.documents.forEach(function(doc) {
      if (doc.panelId === panelId) {
        panelDocIds.push(doc.id);
      }
    });
    
    return panelDocIds;
  };
  
  // Circle methods - explicitly defined and not generated
  ChakraApp.AppState.prototype.addCircle = function(circleData, panelId) {
    var circle = circleData instanceof ChakraApp.Circle ? 
      circleData : new ChakraApp.Circle(circleData || {});
    
    var targetPanelId = panelId || 'left';
    
    if (!circle.documentId) {
      this._assignDocumentToCircle(circle, targetPanelId);
    }
    
    if (!circle.documentId) {
      return null;
    }
    
    this.circles.set(circle.id, circle);
    this._subscribeToEntityChanges('circles', circle);
    this._notifyAndPublishEntityCreation('circles', circle, 'CIRCLE');
    this._saveStateIfNotLoading();
    
    return circle;
  };
  
  ChakraApp.AppState.prototype._assignDocumentToCircle = function(circle, panelId) {
    var selectedDocId = this.selectedDocumentIds[panelId];
    
    if (selectedDocId) {
      circle.documentId = selectedDocId;
      return;
    } 
    
    var panelDocs = this.getDocumentsForPanel(panelId);
    
    if (panelDocs.length > 0) {
      circle.documentId = panelDocs[0].id;
    } else {
      var newDoc = this.addDocument(null, panelId);
      circle.documentId = newDoc.id;
      this.selectDocument(newDoc.id, panelId);
    }
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
    var panelDocIds = this._getDocumentIdsForPanel(panelId);
    var circles = [];
    
    this.circles.forEach(function(circle) {
      if (panelDocIds.includes(circle.documentId)) {
        circles.push(circle);
      }
    });
    
    return circles;
  };
  
  ChakraApp.AppState.prototype.selectCircle = function(id) {
    if (this.selectedCircleId && this.selectedCircleId !== id) {
      this.deselectCircle();
    }
    
    var circle = this.circles.get(id);
    if (!circle) return null;
    
    this.selectedCircleId = id;
    circle.select();
    ChakraApp.app.controllers.tab._handleCircleSelected(circle);
    
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
      ChakraApp.app.controllers.tab._handleCircleDeselected(circle);
    }
    
    this.selectedCircleId = null;
    
    return true;
  };
  
  ChakraApp.AppState.prototype._handleCircleSelection = function(circle) {
    // Use the circle id if circle object is passed, otherwise use the circleId directly
    var circleId = circle.id || circle;
    
    if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
      ChakraApp.cleanupOverlappingGroups();
    }
    
    // Hide all squares first
    this._hideAllSquares();
    
    // Get squares for this circle and make them visible
    var squaresForCircle = this.getSquaresForCircle(circleId);
    
    // Show these squares
    this._showSquaresForCircle(circleId);
    
    // Ensure there's a "Me" square
    this._ensureMeSquareExists(circleId);
    
    // Clear and update connections
    this.connections.clear();
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    this._updateConnectionsForCircleId(circleId);
  };
  
  ChakraApp.AppState.prototype._hideAllSquares = function() {
    this.squares.forEach(function(square) {
      square.hide();
    });
  };
  
  ChakraApp.AppState.prototype._showSquaresForCircle = function(circleId) {
    var squaresForCircle = this.getSquaresForCircle(circleId);
    
    var viewManager = ChakraApp.app && ChakraApp.app.viewManager;
    
    if (viewManager) {
      this._renderSquaresWithViewManager(squaresForCircle, viewManager);
    } else {
      this._updateSquareVisibilityInModel(squaresForCircle);
    }
  };
  
  ChakraApp.AppState.prototype._renderSquaresWithViewManager = function(squares, viewManager) {
    squares.forEach(function(square) {
      square.show();
      
      if (!viewManager.squareViews.has(square.id)) {
	var view = viewManager.createSquareView(square);
      } else {
        this._updateExistingSquareView(square, viewManager);
      }
    }, this);
  };
  
  ChakraApp.AppState.prototype._updateExistingSquareView = function(square, viewManager) {
    
    var squareView = viewManager.squareViews.get(square.id);
    if (squareView && squareView.element) {
      this._updateSquareViewVisibility(squareView);
    } else {
      this._recreateSquareView(square, viewManager);
    }
  };
  
  ChakraApp.AppState.prototype._updateSquareViewVisibility = function(squareView) {
    // Explicitly set display to flex - this is crucial
    squareView.element.style.display = 'flex';
    
    // Force an update to sync the view with model
    if (typeof squareView.update === 'function') {
      squareView.update();
    }
  };
  
  ChakraApp.AppState.prototype._recreateSquareView = function(square, viewManager) {
    viewManager.removeSquareView(square.id);
    viewManager.createSquareView(square);
  };
  
  ChakraApp.AppState.prototype._updateSquareVisibilityInModel = function(squares) {
    // If no view manager, just make squares visible in the model
    squares.forEach(function(square) {
      square.show();
    });
  };
  
  ChakraApp.AppState.prototype._handleCircleDeselection = function() {
    this._hideAllSquares();
    this._cleanupSquareViews();
    this.deselectSquare();
    this.connections.clear();
    
    if (ChakraApp.OverlappingSquaresManager) {
      ChakraApp.OverlappingSquaresManager.cleanup();
    }
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
  };
  
  ChakraApp.AppState.prototype._cleanupSquareViews = function() {
    if (!ChakraApp.app || !ChakraApp.app.viewManager) return;
    
    var viewManager = ChakraApp.app.viewManager;
    var squaresToRemove = [];
    
    viewManager.squareViews.forEach((view, squareId) => {
      var square = this.getSquare(squareId);
      if (square && !square.isMe) {
        squaresToRemove.push(squareId);
      }
    });
    
    squaresToRemove.forEach(squareId => {
      var view = viewManager.squareViews.get(squareId);
      if (view) {
        view.destroy();
        viewManager.squareViews.delete(squareId);
      }
    });
  };
  
  // Add explicit removeCircle method
  ChakraApp.AppState.prototype.removeCircle = function(id) {
    const handler = this._getEntityHandlers().circles;
    return this._removeEntity('circles', id, handler.prefix, entity => handler.cleanup(entity, id));
  };
  
  // Add explicit updateCircle method
  ChakraApp.AppState.prototype.updateCircle = function(id, changes) {
    return this._updateEntity('circles', id, changes);
  };
  
  // Add explicit getDocument method
  ChakraApp.AppState.prototype.getDocument = function(id) {
    return this.documents.get(id) || null;
  };

  // Add explicit getCircle method
  ChakraApp.AppState.prototype.getCircle = function(id) {
    return this.circles.get(id) || null;
  };

  // Panel methods
  ChakraApp.AppState.prototype.togglePanelVisibility = function(panelId) {
    if (!this.panelVisibility.hasOwnProperty(panelId)) return false;
    
    this.panelVisibility[panelId] = !this.panelVisibility[panelId];
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
      panel: panelId,
      visible: this.panelVisibility[panelId]
    });
    
    this._savePanelState();
    
    return this.panelVisibility[panelId];
  };
  
  ChakraApp.AppState.prototype.isPanelVisible = function(panelId) {
    return !!this.panelVisibility[panelId];
  };
  
  // Panel methods have been moved to AppState.js
  
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
        isMe: true,
	      tabId: this.selectedTabId
      });
    }
  };
  
  ChakraApp.AppState.prototype._updateChakraFormForCircle = function(circleId) {
    var appState = ChakraApp.appState;
    var circle = appState.circles.get(circleId);
    if (!circle) return;
    
    var squareCount = 0;
    
    appState.squares.forEach(function(square) {
      if (square.circleId === circleId && !square.isMe) {
        squareCount++;
      }
    });
    
    circle.update({ squareCount: squareCount });
    appState._saveStateIfNotLoading();
  };
  
  // Connection methods
  ChakraApp.AppState.prototype._createConnection = function(square1, square2) {
    var connectionId = ChakraApp.Utils.getLineId(square1.id, square2.id);
    var distance = ChakraApp.Utils.calculateDistance(
      square1.x, square1.y, square2.x, square2.y
    );
    
    var maxLineLength = ChakraApp.Config.connections ? 
      ChakraApp.Config.connections.maxLineLength : 120;
    
    var isVisible = distance <= maxLineLength;
    
    if (!this.connections.has(connectionId)) {
      this.connections.set(connectionId, new ChakraApp.Connection({
        id: connectionId,
        sourceId: square1.id,
        targetId: square2.id,
        length: distance,
        isVisible: isVisible,
        isHighlighted: false
      }));
    } else {
      this.connections.get(connectionId).update({
        length: distance,
        isVisible: isVisible
      });
    }
    
    return this.connections.get(connectionId);
  };
  
  ChakraApp.AppState.prototype._updateClosestMeConnection = function(circleId) {
    var meSquare = null;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe) {
        meSquare = square;
      }
    });
    
    if (!meSquare || !meSquare.visible) return;
    
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
    
    var shortestConnection = meConnections.reduce(function(shortest, conn) {
      return conn.length < shortest.length ? conn : shortest;
    }, meConnections[0]);
    
    this.connections.forEach(function(conn) {
      if (conn.isHighlighted) {
        conn.update({ isHighlighted: false });
      }
    });
    
    shortestConnection.update({ isHighlighted: true });
    
    var otherSquareId = shortestConnection.sourceId === meSquare.id 
      ? shortestConnection.targetId 
      : shortestConnection.sourceId;
    
    var closestSquare = this.squares.get(otherSquareId);
    if (closestSquare) {
      this._updateClosestSquareName(circleId, closestSquare.name);
    }
  };
  
  ChakraApp.AppState.prototype._updateClosestSquareName = function(circleId, squareName) {
    var circle = this.circles.get(circleId);
    if (circle) {
      circle.update({ closestSquareName: squareName });
    }
  };
  
  ChakraApp.AppState.prototype._removeConnectionsForSquare = function(squareId) {
    // Store reference to the AppState instance
    var self = this;
    
    // Make sure connections collection exists before trying to iterate
    if (!self.connections) {
      return;
    }
    
    var connectionsToRemove = [];
    
    self.connections.forEach(function(conn, connId) {
      if (conn.sourceId === squareId || conn.targetId === squareId) {
        connectionsToRemove.push(connId);
      }
    });
    
    // Make sure to check if the array exists before iterating
    if (connectionsToRemove && connectionsToRemove.length > 0) {
      connectionsToRemove.forEach(function(connId) {
        self.connections.delete(connId);
      });
    }
    
    // Publish event only if connections collection exists
    if (ChakraApp.EventBus && ChakraApp.EventTypes) {
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    }
    
    self._saveStateIfNotLoading();
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForSquare = function(squareId) {
    var square = this.squares.get(squareId);
    if (!square || !square.visible) return;
    
    this._updateConnectionsForCircleId(square.circleId);
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForCircleId = function(circleId) {
    var visibleSquares = this.getSquaresForCircle(circleId).filter(square => square.visible);
    
    for (var i = 0; i < visibleSquares.length; i++) {
      for (var j = i + 1; j < visibleSquares.length; j++) {
        this._createConnection(visibleSquares[i], visibleSquares[j]);
      }
    }
    
    this._updateClosestMeConnection(circleId);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
    this._saveStateIfNotLoading();
  };
  
  // Square methods
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
  
  // Tab methods
  ChakraApp.AppState.prototype.getTabsForCircle = function(circleId) {
    var tabs = [];
    
    this.tabs.forEach(function(tab) {
      if (tab.circleId === circleId) {
        tabs.push(tab);
      }
    });
    
    return tabs.sort(function(a, b) {
      return a.index - b.index;
    });
  };
  
  ChakraApp.AppState.prototype.selectTab = function(id) {
    if (this.selectedTabId && this.selectedTabId !== id) {
      this.deselectTab();
    }
    
    var tab = this.tabs.get(id);
    if (!tab) return null;
    
    this.selectedTabId = id;
    tab.select();
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
    this.squares.forEach(square => {
      if (square.circleId === this.selectedCircleId) {
        square.hide();
      }
    });
    this.squares.forEach((square) => { if (square.name == 'test') console.log(square.name, square.visible, square.tabId, tabId, square.circleId, this.selectedCircleId) } );
    
    this.squares.forEach(square => {
      if (square.tabId === tabId && square.circleId === this.selectedCircleId) {
        square.show();
      }
    });
    this.squares.forEach((square) => { if (square.name == 'test') console.log(square.name, square.visible, square.tabId, tabId, square.circleId, this.selectedCircleId) } );
    
    this._updateConnectionsForCircleId(this.selectedCircleId);
  };
  
  // Generate entity methods on the prototype
  ChakraApp.AppState.prototype._generateEntityMethods();
  
})(window.ChakraApp = window.ChakraApp || {});
