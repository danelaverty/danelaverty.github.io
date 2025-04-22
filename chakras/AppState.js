(function(ChakraApp) {
  ChakraApp.AppState = function() {
    ChakraApp.Observable.call(this);
    this._initializeState();
    this._setupEventListeners();
    this._loadPanelState();
  };
  
  ChakraApp.AppState.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.AppState.prototype.constructor = ChakraApp.AppState;
  
  ChakraApp.AppState.prototype._initializeState = function() {
    this._initializeCollections();
    this._initializePanels();
    this._initializeSelectionState();
    this._initializeUIState();
  };
  
  ChakraApp.AppState.prototype._initializeCollections = function() {
    this.documents = new Map();
    this.circles = new Map();
    this.squares = new Map();
    this.connections = new Map();
    this.tabs = new Map();
  };
  
  ChakraApp.AppState.prototype._initializePanels = function() {
    this.panels = ['left', 'bottom'];
  };
  
  ChakraApp.AppState.prototype._initializeSelectionState = function() {
    this.selectedDocumentIds = { left: null, bottom: null };
    this.selectedCircleId = null;
    this.selectedSquareId = null;
    this.selectedTabId = null;
  };
  
  ChakraApp.AppState.prototype._initializeUIState = function() {
    this.panelVisibility = { left: true, bottom: true };
    this.documentListVisible = { left: false, bottom: false };
  };
  
  ChakraApp.AppState.prototype._setupEventListeners = function() {
    this._setupSquareUpdateListener();
    this._setupCircleSelectionListener();
    this._setupCircleDeselectionListener();
  };
  
  ChakraApp.AppState.prototype._setupSquareUpdateListener = function() {
    var self = this;
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_UPDATED, function(square) {
      self._updateConnectionsForSquare(square.id);
    });
  };
  
  ChakraApp.AppState.prototype._setupCircleSelectionListener = function() {
    var self = this;
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_SELECTED, function(circle) {
      self._handleCircleSelection(circle.id);
    });
  };
  
  ChakraApp.AppState.prototype._setupCircleDeselectionListener = function() {
    var self = this;
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_DESELECTED, function() {
      self._handleCircleDeselection();
    });
  };

  ChakraApp.AppState.prototype._notifyStateChanged = function(section, data) {
    this.notify({ section: section, data: data });
  };
  
  ChakraApp.AppState.prototype._createEntity = function(entityType, entityClass, data, eventPrefix, panelId) {
    var entity = this._prepareEntity(entityType, entityClass, data, panelId);
    this._addEntityToCollection(entityType, entity);
    this._subscribeToEntityChanges(entityType, entity);
    this._notifyAndPublishEntityCreation(entityType, entity, eventPrefix);
    this._saveStateIfNotLoading();
    
    return entity;
  };
  
  ChakraApp.AppState.prototype._prepareEntity = function(entityType, entityClass, data, panelId) {
    if (data instanceof entityClass) {
      return data;
    }
    
    return this._createNewEntity(entityType, entityClass, data, panelId);
  };
  
  ChakraApp.AppState.prototype._createNewEntity = function(entityType, entityClass, data, panelId) {
    var preparedData = data || {};
    
    if (entityType === 'documents' && panelId) {
      preparedData.panelId = preparedData.panelId || panelId;
    }
    
    return new entityClass(preparedData);
  };
  
  ChakraApp.AppState.prototype._addEntityToCollection = function(entityType, entity) {
    this[entityType].set(entity.id, entity);
  };
  
  ChakraApp.AppState.prototype._subscribeToEntityChanges = function(entityType, entity) {
    var self = this;
    entity.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged(entityType, entity);
      }
    });
  };
  
  ChakraApp.AppState.prototype._notifyAndPublishEntityCreation = function(entityType, entity, eventPrefix) {
    this._notifyStateChanged(entityType, entity);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes[eventPrefix + '_CREATED'], entity);
  };
  
  ChakraApp.AppState.prototype._updateEntity = function(entityType, id, changes) {
    var entity = this._getEntityFromCollection(entityType, id);
    if (!entity) return null;
    
    entity.update(changes);
    this._saveStateIfNotLoading();
    
    return entity;
  };
  
  ChakraApp.AppState.prototype._getEntityFromCollection = function(entityType, id) {
    return this[entityType].get(id) || null;
  };
  
  ChakraApp.AppState.prototype._saveStateIfNotLoading = function() {
    if (!this._isLoading) {
      this.saveToStorage();
    }
  };

  ChakraApp.AppState.prototype.addDocument = function(documentData, panelId) {
    return this._createEntity('documents', ChakraApp.Document, documentData, 'DOCUMENT', panelId);
  };
  
  ChakraApp.AppState.prototype.updateDocument = function(id, changes) {
    return this._updateEntity('documents', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeDocument = function(id) {
    if (!this._documentExists(id)) return false;
    
    var doc = this._getDocumentAndPanelId(id);
    this._deselectDocumentIfSelected(doc.panelId, id);
    this._handleLastViewedDocument(doc.panelId, id);
    this._removeDocumentFromCollection(id);
    this._removeAssociatedCircles(id);
    this._notifyDocumentDeleted(doc);
    this._saveStateIfNotLoading();
    
    return true;
  };
  
  ChakraApp.AppState.prototype._documentExists = function(id) {
    return this.documents.has(id);
  };
  
  ChakraApp.AppState.prototype._getDocumentAndPanelId = function(id) {
    return this.documents.get(id);
  };
  
  ChakraApp.AppState.prototype._deselectDocumentIfSelected = function(panelId, id) {
    if (this.selectedDocumentIds[panelId] === id) {
      this.deselectDocument(panelId);
    }
  };
  
  ChakraApp.AppState.prototype._handleLastViewedDocument = function(panelId, id) {
    var lastViewedId = this.getLastViewedDocument(panelId);
    var isRemovingLastViewed = lastViewedId === id;
    
    if (isRemovingLastViewed) {
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
  
  ChakraApp.AppState.prototype._removeDocumentFromCollection = function(id) {
    this.documents.delete(id);
  };
  
  ChakraApp.AppState.prototype._removeAssociatedCircles = function(documentId) {
    var circlesToRemove = this._findCirclesByDocumentId(documentId);
    this._removeCircles(circlesToRemove);
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
  
  ChakraApp.AppState.prototype._removeCircles = function(circleIds) {
    var self = this;
    
    circleIds.forEach(function(circleId) {
      self.removeCircle(circleId);
    });
  };
  
  ChakraApp.AppState.prototype._notifyDocumentDeleted = function(doc) {
    this._notifyStateChanged('documents', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_DELETED, doc);
  };

  ChakraApp.AppState.prototype.getDocument = function(id) {
    return this.documents.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllDocuments = function() {
    return Array.from(this.documents.values());
  };
  
  ChakraApp.AppState.prototype.getDocumentsForPanel = function(panelId) {
    var panelDocs = this._filterDocumentsByPanel(panelId);
    return panelDocs.reverse();
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
    var doc = this._getDocumentAndVerifyPanel(id, panelId);
    if (!doc) return null;
    
    this._deselectCurrentDocument(doc.panelId, id);
    this._setSelectedDocument(doc.panelId, id);
    this._selectDocumentActions(doc, doc.panelId);
    
    return doc;
  };
  
  ChakraApp.AppState.prototype._getDocumentAndVerifyPanel = function(id, specifiedPanelId) {
    var doc = this.documents.get(id);
    if (!doc) return null;
    
    var panelId = specifiedPanelId || doc.panelId;
    
    if (doc.panelId !== panelId) {
      console.warn("Document belongs to a different panel than specified");
      return null;
    }
    
    return doc;
  };
  
  ChakraApp.AppState.prototype._deselectCurrentDocument = function(panelId, newId) {
    if (this.selectedDocumentIds[panelId] && this.selectedDocumentIds[panelId] !== newId) {
      this.deselectDocument(panelId);
    }
  };
  
  ChakraApp.AppState.prototype._setSelectedDocument = function(panelId, id) {
    this.selectedDocumentIds[panelId] = id;
  };
  
  ChakraApp.AppState.prototype._selectDocumentActions = function(doc, panelId) {
    doc.select();
    this._deselectCircleIfSelected();
    this._filterCirclesByDocument(doc.id, panelId);
    this.saveLastViewedDocument(doc.id, panelId);
  };
  
  ChakraApp.AppState.prototype._deselectCircleIfSelected = function() {
    if (this.selectedCircleId) {
      this.deselectCircle();
    }
  };
  
  ChakraApp.AppState.prototype.deselectDocument = function(panelId) {
    if (!this.selectedDocumentIds[panelId]) return false;
    
    this._deselectCurrentDocumentById(panelId);
    this._hideCirclesForPanel(panelId);
    
    return true;
  };
  
  ChakraApp.AppState.prototype._deselectCurrentDocumentById = function(panelId) {
    var docId = this.selectedDocumentIds[panelId];
    var doc = this.documents.get(docId);
    
    if (doc) {
      doc.deselect();
    }
    
    this.selectedDocumentIds[panelId] = null;
  };
  
  ChakraApp.AppState.prototype.toggleDocumentList = function(panelId) {
    this._toggleDocumentListVisibility(panelId);
    this._notifyDocumentListToggled(panelId);
    
    return this.documentListVisible[panelId];
  };
  
  ChakraApp.AppState.prototype._toggleDocumentListVisibility = function(panelId) {
    this.documentListVisible[panelId] = !this.documentListVisible[panelId];
  };
  
  ChakraApp.AppState.prototype._notifyDocumentListToggled = function(panelId) {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
      panelId: panelId, 
      visible: this.documentListVisible[panelId]
    });
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
    this._hideCirclesForPanel(panelId);
    this._showCirclesForDocument(documentId);
  };
  
  ChakraApp.AppState.prototype._showCirclesForDocument = function(documentId) {
    var self = this;
    
    this.circles.forEach(function(circle, circleId) {
      if (circle.documentId === documentId) {
        self._notifyStateChanged('circles', circle);
      }
    });
  };
  
  ChakraApp.AppState.prototype._hideCirclesForPanel = function(panelId) {
    var panelDocIds = this._getDocumentIdsForPanel(panelId);
    this._hideCirclesForDocuments(panelDocIds);
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
  
  ChakraApp.AppState.prototype._hideCirclesForDocuments = function(documentIds) {
    var self = this;
    
    this.circles.forEach(function(circle) {
      if (documentIds.includes(circle.documentId)) {
        self._notifyStateChanged('circles', circle);
      }
    });
  };

  ChakraApp.AppState.prototype.addCircle = function(circleData, panelId) {
    var circle = this._prepareCircle(circleData);
    var targetPanelId = panelId || 'left';
    
    if (!circle.documentId) {
      this._assignDocumentToCircle(circle, targetPanelId);
    }
    
    if (!circle.documentId) {
      return null;
    }
    
    return this._finalizeCircleCreation(circle);
  };
  
  ChakraApp.AppState.prototype._prepareCircle = function(circleData) {
    if (circleData instanceof ChakraApp.Circle) {
      return circleData;
    }
    
    return new ChakraApp.Circle(circleData);
  };
  
  ChakraApp.AppState.prototype._assignDocumentToCircle = function(circle, panelId) {
    var selectedDocId = this._getSelectedDocumentForPanel(panelId);
    
    if (selectedDocId) {
      circle.documentId = selectedDocId;
    } else {
      this._assignDocumentFromPanel(circle, panelId);
    }
  };
  
  ChakraApp.AppState.prototype._getSelectedDocumentForPanel = function(panelId) {
    return this.selectedDocumentIds[panelId];
  };
  
  ChakraApp.AppState.prototype._assignDocumentFromPanel = function(circle, panelId) {
    var panelDocs = this.getDocumentsForPanel(panelId);
    
    if (panelDocs.length > 0) {
      circle.documentId = panelDocs[0].id;
    } else {
      this._createAndAssignNewDocument(circle, panelId);
    }
  };
  
  ChakraApp.AppState.prototype._createAndAssignNewDocument = function(circle, panelId) {
    var newDoc = this.addDocument(null, panelId);
    circle.documentId = newDoc.id;
    this.selectDocument(newDoc.id, panelId);
  };
  
  ChakraApp.AppState.prototype._finalizeCircleCreation = function(circle) {
    this.circles.set(circle.id, circle);
    this._subscribeToCircleChanges(circle);
    this._notifyCircleCreated(circle);
    this._saveStateIfNotLoading();
    
    return circle;
  };
  
  ChakraApp.AppState.prototype._subscribeToCircleChanges = function(circle) {
    var self = this;
    
    circle.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged('circles', circle);
      }
    });
  };
  
  ChakraApp.AppState.prototype._notifyCircleCreated = function(circle) {
    this._notifyStateChanged('circles', circle);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_CREATED, circle);
  };
  
  ChakraApp.AppState.prototype.updateCircle = function(id, changes) {
    return this._updateEntity('circles', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeCircle = function(id) {
    if (!this.circles.has(id)) return false;
    
    var circle = this.circles.get(id);
    this._deselectCircleIfCurrent(id);
    this._removeCircleFromCollection(id);
    this._removeAssociatedSquares(id);
    this._notifyCircleDeleted(circle);
    this._saveStateIfNotLoading();
    
    return true;
  };
  
  ChakraApp.AppState.prototype._deselectCircleIfCurrent = function(id) {
    if (this.selectedCircleId === id) {
      this.deselectCircle();
    }
  };
  
  ChakraApp.AppState.prototype._removeCircleFromCollection = function(id) {
    this.circles.delete(id);
  };
  
  ChakraApp.AppState.prototype._removeAssociatedSquares = function(circleId) {
    var self = this;
    
    this.squares.forEach(function(square, squareId) {
      if (square.circleId === circleId) {
        self.removeSquare(squareId);
      }
    });
  };
  
  ChakraApp.AppState.prototype._notifyCircleDeleted = function(circle) {
    this._notifyStateChanged('circles', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DELETED, circle);
  };

  ChakraApp.AppState.prototype.getCircle = function(id) {
    return this.circles.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllCircles = function() {
    return Array.from(this.circles.values());
  };
  
  ChakraApp.AppState.prototype.getCirclesForDocument = function(documentId) {
    return this._filterCirclesByDocumentId(documentId);
  };
  
  ChakraApp.AppState.prototype._filterCirclesByDocumentId = function(documentId) {
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
    return this._filterCirclesByDocumentIds(panelDocIds);
  };
  
  ChakraApp.AppState.prototype._filterCirclesByDocumentIds = function(documentIds) {
    var circles = [];
    
    this.circles.forEach(function(circle) {
      if (documentIds.includes(circle.documentId)) {
        circles.push(circle);
      }
    });
    
    return circles;
  };
  
  ChakraApp.AppState.prototype.selectCircle = function(id) {
    this._deselectCurrentCircleIfDifferent(id);
    
    var circle = this.circles.get(id);
    if (!circle) return null;
    
    return this._setSelectedCircle(id, circle);
  };
  
  ChakraApp.AppState.prototype._deselectCurrentCircleIfDifferent = function(id) {
    if (this.selectedCircleId && this.selectedCircleId !== id) {
      this.deselectCircle();
    }
  };
  
  ChakraApp.AppState.prototype._setSelectedCircle = function(id, circle) {
    this.selectedCircleId = id;
    circle.select();
    this._showCenterPanel();
    
    return circle;
  };
  
  ChakraApp.AppState.prototype._showCenterPanel = function() {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
      panel: 'center',
      visible: true
    });
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
  
  ChakraApp.AppState.prototype._handleCircleSelection = function(circleId) {
    this._cleanupOverlappingGroups();
    this._hideAllSquares();
    this._showSquaresForCircle(circleId);
    this._ensureMeSquareExists(circleId);
    this._resetAndUpdateConnections(circleId);
  };
  
  ChakraApp.AppState.prototype._cleanupOverlappingGroups = function() {
    if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
      ChakraApp.cleanupOverlappingGroups();
    }
  };
  
  ChakraApp.AppState.prototype._hideAllSquares = function() {
    this.squares.forEach(function(square) {
      square.hide();
    });
  };
  
  ChakraApp.AppState.prototype._showSquaresForCircle = function(circleId) {
    var squaresForCircle = this.getSquaresForCircle(circleId);
    this._showSquaresInViewManager(squaresForCircle);
  };
  
  ChakraApp.AppState.prototype._showSquaresInViewManager = function(squares) {
    var hasViewManager = ChakraApp.app && ChakraApp.app.viewManager;
    
    if (hasViewManager) {
      this._createOrShowSquaresInViewManager(squares);
    } else {
      this._simplyShowSquares(squares);
    }
  };
  
  ChakraApp.AppState.prototype._createOrShowSquaresInViewManager = function(squares) {
    var viewManager = ChakraApp.app.viewManager;
    
    squares.forEach(function(square) {
      if (!viewManager.squareViews.has(square.id)) {
        viewManager.createSquareView(square);
      }
      square.show();
    });
  };
  
  ChakraApp.AppState.prototype._simplyShowSquares = function(squares) {
    squares.forEach(function(square) {
      square.show();
    });
  };
  
  ChakraApp.AppState.prototype._resetAndUpdateConnections = function(circleId) {
    this.connections.clear();
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    this._updateConnectionsForCircleId(circleId);
  };
  
  ChakraApp.AppState.prototype._handleCircleDeselection = function() {
    this._hideAllSquares();
    this._cleanupSquareViews();
    this._deselectSquareAndClearConnections();
  };
  
  ChakraApp.AppState.prototype._cleanupSquareViews = function() {
    if (!ChakraApp.app || !ChakraApp.app.viewManager) return;
    
    var squareIds = this._getRemovableSquareIds();
    this._removeSquareViews(squareIds);
  };
  
  ChakraApp.AppState.prototype._getRemovableSquareIds = function() {
    var self = this;
    var viewManager = ChakraApp.app.viewManager;
    var squaresToRemove = [];
    
    viewManager.squareViews.forEach(function(view, squareId) {
      var square = self.getSquare(squareId);
      if (square && !square.isMe) {
        squaresToRemove.push(squareId);
      }
    });
    
    return squaresToRemove;
  };
  
  ChakraApp.AppState.prototype._removeSquareViews = function(squareIds) {
    var viewManager = ChakraApp.app.viewManager;
    
    squareIds.forEach(function(squareId) {
      var view = viewManager.squareViews.get(squareId);
      if (view) {
        view.destroy();
        viewManager.squareViews.delete(squareId);
      }
    });
  };
  
  ChakraApp.AppState.prototype._deselectSquareAndClearConnections = function() {
    this.deselectSquare();
    this.connections.clear();
    ChakraApp.OverlappingSquaresManager.cleanup();
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
  };
  
  ChakraApp.AppState.prototype.togglePanelVisibility = function(panelId) {
    if (!this._isPanelValid(panelId)) return false;
    
    this._togglePanelState(panelId);
    this._notifyPanelVisibilityChanged(panelId);
    this._savePanelState();
    
    return this.panelVisibility[panelId];
  };
  
  ChakraApp.AppState.prototype._isPanelValid = function(panelId) {
    return this.panelVisibility.hasOwnProperty(panelId);
  };
  
  ChakraApp.AppState.prototype._togglePanelState = function(panelId) {
    this.panelVisibility[panelId] = !this.panelVisibility[panelId];
  };
  
  ChakraApp.AppState.prototype._notifyPanelVisibilityChanged = function(panelId) {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
      panel: panelId,
      visible: this.panelVisibility[panelId]
    });
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
      this._loadSavedPanelState();
    } catch (e) {
      console.error('Error loading panel state:', e);
    }
  };
  
  ChakraApp.AppState.prototype._loadSavedPanelState = function() {
    var savedState = localStorage.getItem('chakraPanelVisibility');
    if (!savedState) return;
    
    this._updatePanelVisibilityFromSaved(JSON.parse(savedState));
  };
  
  ChakraApp.AppState.prototype._updatePanelVisibilityFromSaved = function(panelState) {
    for (var panelId in panelState) {
      if (this.panelVisibility.hasOwnProperty(panelId)) {
        this.panelVisibility[panelId] = panelState[panelId];
      }
    }
  };
  
  ChakraApp.AppState.prototype._ensureMeSquareExists = function(circleId) {
    var meSquare = this._findMeSquareForCircle(circleId);
    
    if (meSquare) {
      meSquare.show();
    } else {
      this._createMeSquare(circleId);
    }
  };
  
  ChakraApp.AppState.prototype._findMeSquareForCircle = function(circleId) {
    var meSquare = null;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe) {
        meSquare = square;
      }
    });
    
    return meSquare;
  };
  
  ChakraApp.AppState.prototype._createMeSquare = function(circleId) {
    this.addSquare({
      circleId: circleId,
      x: 200,
      y: 200,
      color: '#FFCC88',
      name: 'Me',
      isMe: true
    });
  };

  ChakraApp.AppState.prototype._updateChakraFormForCircle = function(circleId) {
    var circle = this.circles.get(circleId);
    if (!circle) return;
    
    var squareCount = this._countNonMeSquaresForCircle(circleId);
    circle.update({ squareCount: squareCount });
    this._saveStateIfNotLoading();
  };
  
  ChakraApp.AppState.prototype._countNonMeSquaresForCircle = function(circleId) {
    var squareCount = 0;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && !square.isMe) {
        squareCount++;
      }
    });
    
    return squareCount;
  };

  ChakraApp.AppState.prototype.addSquare = function(squareData) {
    var square = this._prepareSquare(squareData);
    this._assignTabToSquareIfNeeded(square);
    this._addSquareToCollection(square);
    this._subscribeToSquareChanges(square);
    this._notifySquareCreated(square);
    this._updateCircleAndConnections(square);
    this._saveStateIfNotLoading();
    
    return square;
  };
  
  ChakraApp.AppState.prototype._prepareSquare = function(squareData) {
    if (squareData instanceof ChakraApp.Square) {
      return squareData;
    }
    
    return new ChakraApp.Square(squareData);
  };
  
  ChakraApp.AppState.prototype._assignTabToSquareIfNeeded = function(square) {
    if (!square.tabId && this.selectedTabId && square.circleId === this.selectedCircleId) {
      square.tabId = this.selectedTabId;
    }
  };
  
  ChakraApp.AppState.prototype._addSquareToCollection = function(square) {
    this.squares.set(square.id, square);
  };
  
  ChakraApp.AppState.prototype._subscribeToSquareChanges = function(square) {
    var self = this;
    square.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged('squares', square);
        self._updateConnectionsForSquare(square.id);
      }
    });
  };
  
  ChakraApp.AppState.prototype._notifySquareCreated = function(square) {
    this._notifyStateChanged('squares', square);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_CREATED, square);
  };
  
  ChakraApp.AppState.prototype._updateCircleAndConnections = function(square) {
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    this._updateConnectionsForCircleId(square.circleId);
  };
  
  ChakraApp.AppState.prototype.updateSquare = function(id, changes) {
    return this._updateEntity('squares', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeSquare = function(id) {
    if (!this.squares.has(id)) return false;
    
    var square = this.squares.get(id);
    this._deselectSquareIfCurrent(id);
    this._removeSquareFromCollection(id);
    this._removeConnectionsForSquare(id);
    this._notifySquareDeleted(square);
    this._updateChakraFormForCircleIfNeeded(square);
    this._saveStateIfNotLoading();
    
    return true;
  };
  
  ChakraApp.AppState.prototype._deselectSquareIfCurrent = function(id) {
    if (this.selectedSquareId === id) {
      this.deselectSquare();
    }
  };
  
  ChakraApp.AppState.prototype._removeSquareFromCollection = function(id) {
    this.squares.delete(id);
  };
  
  ChakraApp.AppState.prototype._notifySquareDeleted = function(square) {
    this._notifyStateChanged('squares', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_DELETED, square);
  };
  
  ChakraApp.AppState.prototype._updateChakraFormForCircleIfNeeded = function(square) {
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
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
    this._deselectCurrentSquareIfDifferent(id);
    
    var square = this.squares.get(id);
    if (!square) return null;
    
    return this._setSelectedSquare(id, square);
  };
  
  ChakraApp.AppState.prototype._deselectCurrentSquareIfDifferent = function(id) {
    if (this.selectedSquareId && this.selectedSquareId !== id) {
      this.deselectSquare();
    }
  };
  
  ChakraApp.AppState.prototype._setSelectedSquare = function(id, square) {
    this.selectedSquareId = id;
    square.select();
    
    return square;
  };
  
  ChakraApp.AppState.prototype.deselectSquare = function() {
    if (!this.selectedSquareId) return false;
    
    this._deselectCurrentSquare();
    this._clearSelectionIfNeeded();
    
    return true;
  };
  
  ChakraApp.AppState.prototype._deselectCurrentSquare = function() {
    var square = this.squares.get(this.selectedSquareId);
    if (square) {
      square.deselect();
    }
    
    this.selectedSquareId = null;
  };
  
  ChakraApp.AppState.prototype._clearSelectionIfNeeded = function() {
    if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
      ChakraApp.MultiSelectionManager.clearSelection();
    }
  };
  
  ChakraApp.AppState.prototype._createConnection = function(square1, square2) {
    var connectionId = ChakraApp.Utils.getLineId(square1.id, square2.id);
    var distance = this._calculateSquareDistance(square1, square2);
    var isVisible = this._isConnectionVisible(distance);
    
    if (!this.connections.has(connectionId)) {
      this._createNewConnection(connectionId, square1, square2, distance, isVisible);
    } else {
      this._updateExistingConnection(connectionId, distance, isVisible);
    }
    
    return this.connections.get(connectionId);
  };
  
  ChakraApp.AppState.prototype._calculateSquareDistance = function(square1, square2) {
    return ChakraApp.Utils.calculateDistance(
      square1.x, square1.y, square2.x, square2.y
    );
  };
  
  ChakraApp.AppState.prototype._isConnectionVisible = function(distance) {
    var maxLineLength = ChakraApp.Config.connections ? 
      ChakraApp.Config.connections.maxLineLength : 120;
    
    return distance <= maxLineLength;
  };
  
  ChakraApp.AppState.prototype._createNewConnection = function(id, square1, square2, distance, isVisible) {
    var connection = new ChakraApp.Connection({
      id: id,
      sourceId: square1.id,
      targetId: square2.id,
      length: distance,
      isVisible: isVisible,
      isHighlighted: false
    });
    
    this.connections.set(id, connection);
  };
  
  ChakraApp.AppState.prototype._updateExistingConnection = function(id, distance, isVisible) {
    this.connections.get(id).update({
      length: distance,
      isVisible: isVisible
    });
  };
  
  ChakraApp.AppState.prototype._updateClosestMeConnection = function(circleId) {
    var meSquare = this._findMeSquareForCircle(circleId);
    if (!meSquare || !meSquare.visible) return;
    
    var meConnections = this._getVisibleMeConnections(meSquare);
    
    if (meConnections.length === 0) {
      this._updateClosestSquareName(circleId, null);
      return;
    }
    
    var shortestConnection = this._findShortestConnection(meConnections);
    this._resetHighlightsAndUpdateShortest(shortestConnection);
    this._updateClosestSquareNameFromConnection(circleId, meSquare, shortestConnection);
    this._saveStateIfNotLoading();
  };
  
  ChakraApp.AppState.prototype._getVisibleMeConnections = function(meSquare) {
    var meConnections = [];
    
    this.connections.forEach(function(conn) {
      if ((conn.sourceId === meSquare.id || conn.targetId === meSquare.id) && conn.isVisible) {
        meConnections.push(conn);
      }
    });
    
    return meConnections;
  };
  
  ChakraApp.AppState.prototype._findShortestConnection = function(connections) {
    return connections.reduce(function(shortest, conn) {
      return conn.length < shortest.length ? conn : shortest;
    }, connections[0]);
  };
  
  ChakraApp.AppState.prototype._resetHighlightsAndUpdateShortest = function(shortestConnection) {
    this.connections.forEach(function(conn) {
      if (conn.isHighlighted) {
        conn.update({ isHighlighted: false });
      }
    });
    
    shortestConnection.update({ isHighlighted: true });
  };
  
  ChakraApp.AppState.prototype._updateClosestSquareNameFromConnection = function(circleId, meSquare, shortestConnection) {
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
    var connectionsToRemove = this._findConnectionsForSquare(squareId);
    this._removeConnections(connectionsToRemove);
    this._notifyConnectionsUpdated();
    this._saveStateIfNotLoading();
  };
  
  ChakraApp.AppState.prototype._findConnectionsForSquare = function(squareId) {
    var connectionsToRemove = [];
    
    this.connections.forEach(function(conn, connId) {
      if (conn.sourceId === squareId || conn.targetId === squareId) {
        connectionsToRemove.push(connId);
      }
    });
    
    return connectionsToRemove;
  };
  
  ChakraApp.AppState.prototype._removeConnections = function(connectionIds) {
    var self = this;
    
    connectionIds.forEach(function(connId) {
      self.connections.delete(connId);
    });
  };
  
  ChakraApp.AppState.prototype._notifyConnectionsUpdated = function() {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForSquare = function(squareId) {
    var square = this.squares.get(squareId);
    if (!square || !square.visible) return;
    
    this._updateConnectionsForCircleId(square.circleId);
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForCircleId = function(circleId) {
    var visibleSquares = this._getVisibleSquaresForCircle(circleId);
    this._createConnectionsBetweenSquares(visibleSquares);
    this._updateClosestMeConnection(circleId);
    this._notifyConnectionsUpdatedForCircle(circleId);
    this._saveStateIfNotLoading();
  };
  
  ChakraApp.AppState.prototype._getVisibleSquaresForCircle = function(circleId) {
    return this.getSquaresForCircle(circleId).filter(function(square) {
      return square.visible;
    });
  };
  
  ChakraApp.AppState.prototype._createConnectionsBetweenSquares = function(squares) {
    for (var i = 0; i < squares.length; i++) {
      for (var j = i + 1; j < squares.length; j++) {
        this._createConnection(squares[i], squares[j]);
      }
    }
  };
  
  ChakraApp.AppState.prototype._notifyConnectionsUpdatedForCircle = function(circleId) {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
  };
  
  ChakraApp.AppState.prototype.addTab = function(tabData) {
    return this._createEntity('tabs', ChakraApp.Tab, tabData, 'TAB');
  };
  
  ChakraApp.AppState.prototype.updateTab = function(id, changes) {
    return this._updateEntity('tabs', id, changes);
  };
  
  ChakraApp.AppState.prototype.removeTab = function(id) {
    if (!this.tabs.has(id)) return false;
    
    var tab = this.tabs.get(id);
    this._deselectTabIfCurrent(id);
    this._removeTabFromCollection(id);
    this._removeSquaresForTab(id);
    this._notifyTabDeleted(tab);
    this._saveStateIfNotLoading();
    
    return true;
  };
  
  ChakraApp.AppState.prototype._deselectTabIfCurrent = function(id) {
    if (this.selectedTabId === id) {
      this.deselectTab();
    }
  };
  
  ChakraApp.AppState.prototype._removeTabFromCollection = function(id) {
    this.tabs.delete(id);
  };
  
  ChakraApp.AppState.prototype._removeSquaresForTab = function(tabId) {
    var squaresToRemove = this._findSquaresByTabId(tabId);
    this._removeSquares(squaresToRemove);
  };
  
  ChakraApp.AppState.prototype._findSquaresByTabId = function(tabId) {
    var squaresToRemove = [];
    
    this.squares.forEach(function(square, squareId) {
      if (square.tabId === tabId) {
        squaresToRemove.push(squareId);
      }
    });
    
    return squaresToRemove;
  };
  
  ChakraApp.AppState.prototype._removeSquares = function(squareIds) {
    var self = this;
    
    squareIds.forEach(function(squareId) {
      self.removeSquare(squareId);
    });
  };
  
  ChakraApp.AppState.prototype._notifyTabDeleted = function(tab) {
    this._notifyStateChanged('tabs', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.TAB_DELETED, tab);
  };
  
  ChakraApp.AppState.prototype.getTab = function(id) {
    return this.tabs.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getTabsForCircle = function(circleId) {
    var tabs = this._findTabsByCircleId(circleId);
    return this._sortTabsByIndex(tabs);
  };
  
  ChakraApp.AppState.prototype._findTabsByCircleId = function(circleId) {
    var result = [];
    
    this.tabs.forEach(function(tab) {
      if (tab.circleId === circleId) {
        result.push(tab);
      }
    });
    
    return result;
  };
  
  ChakraApp.AppState.prototype._sortTabsByIndex = function(tabs) {
    return tabs.sort(function(a, b) {
      return a.index - b.index;
    });
  };
  
  ChakraApp.AppState.prototype.selectTab = function(id) {
    this._deselectCurrentTabIfDifferent(id);
    
    var tab = this.tabs.get(id);
    if (!tab) return null;
    
    return this._setSelectedTabAndFilterSquares(id, tab);
  };
  
  ChakraApp.AppState.prototype._deselectCurrentTabIfDifferent = function(id) {
    if (this.selectedTabId && this.selectedTabId !== id) {
      this.deselectTab();
    }
  };
  
  ChakraApp.AppState.prototype._setSelectedTabAndFilterSquares = function(id, tab) {
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
    this._hideAllSquaresForSelectedCircle();
    this._showSquaresForTab(tabId);
    this._updateConnectionsForCircleId(this.selectedCircleId);
  };
  
  ChakraApp.AppState.prototype._hideAllSquaresForSelectedCircle = function() {
    var self = this;
    
    this.squares.forEach(function(square) {
      if (square.circleId === self.selectedCircleId) {
        square.hide();
      }
    });
  };
  
  ChakraApp.AppState.prototype._showSquaresForTab = function(tabId) {
    var self = this;
    
    this.squares.forEach(function(square) {
      if (square.tabId === tabId && square.circleId === self.selectedCircleId) {
        square.show();
      }
    });
  };

  ChakraApp.AppState.prototype.loadFromStorage = function() {
    try {
      this._isLoading = true;
      
      var savedData = localStorage.getItem('chakraVisualizerData');
      if (!savedData) {
        this._isLoading = false;
        return false;
      }

      var data = this._parseStorageData(savedData);
      this._resetState();
      this._loadEntities(data);
      this._selectLastViewedDocuments();
      this._notifyStateLoaded(data);
      this._finalizeLoading();
      
      return true;
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      this._isLoading = false;
      return false;
    }
  };
  
  ChakraApp.AppState.prototype._parseStorageData = function(savedData) {
    return JSON.parse(savedData);
  };
  
  ChakraApp.AppState.prototype._resetState = function() {
    this.documents.clear();
    this.circles.clear();
    this.squares.clear();
    this.connections.clear();
    this.tabs.clear();
    
    this.selectedDocumentIds = { left: null, bottom: null };
    this.selectedCircleId = null;
    this.selectedSquareId = null;
    this.selectedTabId = null;
  };
  
  ChakraApp.AppState.prototype._loadEntities = function(data) {
    this._loadDocuments(data.documents);
    this._loadCircles(data.circles);
    this._loadSquares(data.squares);
    this._loadTabs(data.tabs);
  };
  
  ChakraApp.AppState.prototype._loadDocuments = function(documents) {
    var self = this;
    
    if (documents && Array.isArray(documents)) {
      documents.forEach(function(documentData) {
        documentData.panelId = documentData.panelId || 'left';
        self.addDocument(documentData);
      });
    } else {
      this._createDefaultDocuments();
    }
  };
  
  ChakraApp.AppState.prototype._createDefaultDocuments = function() {
    var self = this;
    
    this.panels.forEach(function(panelId) {
      self.addDocument(null, panelId);
    });
  };
  
  ChakraApp.AppState.prototype._loadCircles = function(circles) {
    var self = this;
    
    if (circles && Array.isArray(circles)) {
      circles.forEach(function(circleData) {
        self.addCircle(circleData);
      });
    }
  };
  
  ChakraApp.AppState.prototype._loadSquares = function(squares) {
    var self = this;
    
    if (squares && Array.isArray(squares)) {
      squares.forEach(function(squareData) {
        self.addSquare(squareData);
      });
    }
  };
  
  ChakraApp.AppState.prototype._loadTabs = function(tabs) {
    var self = this;
    
    if (tabs && Array.isArray(tabs)) {
      tabs.forEach(function(tabData) {
        self.addTab(tabData);
      });
    }
  };
  
  ChakraApp.AppState.prototype._selectLastViewedDocuments = function() {
    var self = this;
    
    this.panels.forEach(function(panelId) {
      self._selectLastViewedDocumentForPanel(panelId);
    });
  };
  
  ChakraApp.AppState.prototype._selectLastViewedDocumentForPanel = function(panelId) {
    var lastViewedDocumentId = this.getLastViewedDocument(panelId);
    
    if (this._isValidLastViewedDocument(lastViewedDocumentId, panelId)) {
      this._selectExistingDocument(lastViewedDocumentId, panelId);
    } else {
      this._selectFirstDocumentInPanel(panelId);
    }
  };
  
  ChakraApp.AppState.prototype._isValidLastViewedDocument = function(documentId, panelId) {
    if (!documentId || !this.documents.has(documentId)) return false;
    
    var doc = this.documents.get(documentId);
    return doc.panelId === panelId;
  };
  
  ChakraApp.AppState.prototype._selectExistingDocument = function(documentId, panelId) {
    this.selectDocument(documentId, panelId);
  };
  
  ChakraApp.AppState.prototype._selectFirstDocumentInPanel = function(panelId) {
    var panelDocuments = this.getDocumentsForPanel(panelId);
    
    if (panelDocuments.length > 0) {
      this.selectDocument(panelDocuments[0].id, panelId);
      this.saveLastViewedDocument(panelDocuments[0].id, panelId);
    }
  };
  
  ChakraApp.AppState.prototype._notifyStateLoaded = function(data) {
    this._notifyStateChanged('all', data);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_LOADED, data);
  };
  
  ChakraApp.AppState.prototype._finalizeLoading = function() {
    if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
      ChakraApp.cleanupOverlappingGroups();
    }
    
    this._isLoading = false;
    this.saveToStorageNow();
  };
  
  ChakraApp.AppState.prototype.saveToStorage = function() {
    try {
      this._debounceStorage();
      return true;
    } catch (error) {
      console.error('Error scheduling state save:', error);
      return false;
    }
  };
  
  ChakraApp.AppState.prototype._debounceStorage = function() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }

    var self = this;
    this._saveTimeout = setTimeout(function() {
      self._actualSaveToStorage();
    }, 300);
  };
  
  ChakraApp.AppState.prototype._actualSaveToStorage = function() {
    try {
      var data = this._collectStateData();
      this._saveStateToLocalStorage(data);
      this._notifyStateSaved(data);
      
      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  };
  
  ChakraApp.AppState.prototype._collectStateData = function() {
    return {
      documents: this._serializeDocuments(),
      circles: this._serializeCircles(),
      squares: this._serializeSquares(),
      tabs: this._serializeTabs(),
      selectedDocumentIds: this.selectedDocumentIds
    };
  };
  
  ChakraApp.AppState.prototype._serializeDocuments = function() {
    var documents = [];
    
    this.documents.forEach(function(doc) {
      documents.push(doc.toJSON());
    });
    
    return documents;
  };
  
  ChakraApp.AppState.prototype._serializeCircles = function() {
    var circles = [];
    
    this.circles.forEach(function(circle) {
      circles.push(circle.toJSON());
    });
    
    return circles;
  };
  
  ChakraApp.AppState.prototype._serializeSquares = function() {
    var squares = [];
    
    this.squares.forEach(function(square) {
      squares.push(square.toJSON());
    });
    
    return squares;
  };
  
  ChakraApp.AppState.prototype._serializeTabs = function() {
    var tabs = [];
    
    this.tabs.forEach(function(tab) {
      tabs.push(tab.toJSON());
    });
    
    return tabs;
  };
  
  ChakraApp.AppState.prototype._saveStateToLocalStorage = function(data) {
    localStorage.setItem('chakraVisualizerData', JSON.stringify(data));
  };
  
  ChakraApp.AppState.prototype._notifyStateSaved = function(data) {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_SAVED, data);
  };
  
  ChakraApp.AppState.prototype.saveToStorageNow = function() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    
    return this._actualSaveToStorage();
  };

  ChakraApp.appState = new ChakraApp.AppState();
  
})(window.ChakraApp = window.ChakraApp || {});
