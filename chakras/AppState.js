(function(ChakraApp) {
  ChakraApp.AppState = function() {
    ChakraApp.Observable.call(this);
    this._initializeState();
    this._setupEventListeners();
    this._loadPanelState();
  };
  
  ChakraApp.AppState.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.AppState.prototype.constructor = ChakraApp.AppState;
  
  // Initialization methods
  ChakraApp.AppState.prototype._initializeState = function() {
    this._initializeCollections();
    this._initializePanels();
    this._initializeSelectionState();
    this._initializeUIState();
  };
  
  ChakraApp.AppState.prototype._initializeCollections = function() {
    this.entityCollections = ['documents', 'circles', 'squares', 'connections', 'tabs'];
    this.entityCollections.forEach(collection => this[collection] = new Map());
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
  
  // Event Listeners
  ChakraApp.AppState.prototype._setupEventListeners = function() {
    var self = this;
    
    // Define event types and handler references, but don't try to bind yet
    // since the handler methods might not exist yet
    var events = [
      { type: ChakraApp.EventTypes.SQUARE_UPDATED, handlerName: '_handleSquareUpdated' },
      { type: ChakraApp.EventTypes.CIRCLE_SELECTED, handlerName: '_handleCircleSelection' },
      { type: ChakraApp.EventTypes.CIRCLE_DESELECTED, handlerName: '_handleCircleDeselection' }
    ];
    
    events.forEach(function(event) {
      self._setupEventListener(event.type, function() {
        // When the event is triggered, look up the method by name on the instance
        if (typeof self[event.handlerName] === 'function') {
          return self[event.handlerName].apply(self, arguments);
        } else {
          console.error('Event handler ' + event.handlerName + ' is not defined');
        }
      });
    });
  };
  
  ChakraApp.AppState.prototype._setupEventListener = function(eventType, handler) {
    ChakraApp.EventBus.subscribe(eventType, handler);
  };
  
  // Placeholder for event handler methods (these will be properly defined in AppStateEntities.js)
  ChakraApp.AppState.prototype._handleSquareUpdated = function(square) {
    // This is a stub that will be overridden by AppStateEntities.js
    console.log("Stub _handleSquareUpdated called, should be overridden");
  };
  
  ChakraApp.AppState.prototype._handleCircleSelection = function(circle) {
    // This is a stub that will be overridden by AppStateEntities.js
    console.log("Stub _handleCircleSelection called, should be overridden");
  };
  
  ChakraApp.AppState.prototype._handleCircleDeselection = function() {
    // This is a stub that will be overridden by AppStateEntities.js
    console.log("Stub _handleCircleDeselection called, should be overridden");
  };

  // Generic entity operations
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
        if (entityType === 'squares') {
          self._updateConnectionsForSquare(entity.id);
        }
      }
    });
  };
  
  ChakraApp.AppState.prototype._notifyAndPublishEntityCreation = function(entityType, entity, eventPrefix) {
    this._notifyStateChanged(entityType, entity);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes[eventPrefix + '_CREATED'], entity);
  };
  
  ChakraApp.AppState.prototype._updateEntity = function(entityType, id, changes) {
    var entity = this[entityType].get(id);
    if (!entity) return null;
    
    entity.update(changes);
    this._saveStateIfNotLoading();
    
    return entity;
  };
  
  ChakraApp.AppState.prototype._removeEntity = function(entityType, id, eventPrefix, customCleanup) {
    if (!this[entityType].has(id)) return false;
    
    var entity = this[entityType].get(id);
    
    if (customCleanup) {
      customCleanup(entity);
    }
    
    this[entityType].delete(id);
    this._notifyStateChanged(entityType, null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes[eventPrefix + '_DELETED'], entity);
    this._saveStateIfNotLoading();
    
    return true;
  };
  
  ChakraApp.AppState.prototype._saveStateIfNotLoading = function() {
    if (!this._isLoading) {
      this.saveToStorage();
    }
  };

  // Entity handler definitions
  ChakraApp.AppState.prototype._getEntityHandlers = function() {
    return {
      documents: {
        class: ChakraApp.Document,
        prefix: 'DOCUMENT',
        cleanup: (entity, id) => {
          var appState = ChakraApp.appState;
          appState._deselectDocumentIfSelected(entity.panelId, id);
          appState._handleLastViewedDocument(entity.panelId, id);
          appState._removeAssociatedCircles(id);
        }
      },
      circles: {
        class: ChakraApp.Circle,
        prefix: 'CIRCLE',
        cleanup: (entity, id) => {
          var appState = ChakraApp.appState;
          if (appState.selectedCircleId === id) {
            appState.deselectCircle();
          }
          
          appState.squares.forEach((square, squareId) => {
            if (square.circleId === id) {
              appState.removeSquare(squareId);
            }
          });
        }
      },
      squares: {
        class: ChakraApp.Square,
        prefix: 'SQUARE',
        cleanup: (entity, id) => {
          var appState = ChakraApp.appState;
          if (appState.selectedSquareId === id) {
            appState.deselectSquare();
          }
          
          appState._removeConnectionsForSquare(id);
          
          if (entity.circleId) {
            appState._updateChakraFormForCircle(entity.circleId);
          }
        }
      },
      tabs: {
        class: ChakraApp.Tab,
        prefix: 'TAB',
        cleanup: (entity, id) => {
          var appState = ChakraApp.appState;
          if (appState.selectedTabId === id) {
            appState.deselectTab();
          }
          
          var squaresToRemove = [];
          
          appState.squares.forEach((square, squareId) => {
            if (square.tabId === id) {
              squaresToRemove.push(squareId);
            }
          });
          
          squaresToRemove.forEach(squareId => appState.removeSquare(squareId));
        }
      }
    };
  };
  
  // Generate entity methods - placeholder to be implemented in AppStateEntities.js
  ChakraApp.AppState.prototype._generateEntityMethods = function() {
    // This will be implemented in AppStateEntities.js
  };

  // Panel state methods
  ChakraApp.AppState.prototype._loadPanelState = function() {
    try {
      var savedState = localStorage.getItem('chakraPanelVisibility');
      if (!savedState) return;
      
      var panelState = JSON.parse(savedState);
      
      for (var panelId in panelState) {
        if (this.panelVisibility.hasOwnProperty(panelId)) {
          this.panelVisibility[panelId] = panelState[panelId];
        }
      }
    } catch (e) {
      console.error('Error loading panel state:', e);
    }
  };
  
  ChakraApp.AppState.prototype._savePanelState = function() {
    try {
      localStorage.setItem('chakraPanelVisibility', JSON.stringify(this.panelVisibility));
    } catch (e) {
      console.error('Error saving panel state:', e);
    }
  };
  
  // Storage methods
  ChakraApp.AppState.prototype.loadFromStorage = function() {
    try {
      this._isLoading = true;
      
      var savedData = localStorage.getItem('chakraVisualizerData');
      if (!savedData) {
        this._isLoading = false;
        return false;
      }
      
      var data = JSON.parse(savedData);
      this._resetState();
      this._loadEntities(data);
      this._selectLastViewedDocuments();
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
  
  ChakraApp.AppState.prototype._resetState = function() {
    this.entityCollections.forEach(collection => this[collection].clear());
    
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
    if (documents && Array.isArray(documents)) {
      documents.forEach(documentData => {
        documentData.panelId = documentData.panelId || 'left';
        this.addDocument(documentData);
      });
    } else {
      this.panels.forEach(panelId => this.addDocument(null, panelId));
    }
  };
  
  ChakraApp.AppState.prototype._loadCircles = function(circles) {
    if (circles && Array.isArray(circles)) {
      circles.forEach(circleData => this.addCircle(circleData));
    }
  };
  
  ChakraApp.AppState.prototype._loadSquares = function(squares) {
    if (squares && Array.isArray(squares)) {
      squares.forEach(squareData => this.addSquare(squareData));
    }
  };
  
  ChakraApp.AppState.prototype._loadTabs = function(tabs) {
    if (tabs && Array.isArray(tabs)) {
      tabs.forEach(tabData => this.addTab(tabData));
    }
  };
  
  ChakraApp.AppState.prototype._selectLastViewedDocuments = function() {
    this.panels.forEach(function(panelId) {
      var lastViewedDocumentId = this.getLastViewedDocument(panelId);
      
      if (lastViewedDocumentId && this.documents.has(lastViewedDocumentId)) {
        var doc = this.documents.get(lastViewedDocumentId);
        if (doc.panelId === panelId) {
          this.selectDocument(lastViewedDocumentId, panelId);
          return;
        }
      }
      
      var panelDocuments = this.getDocumentsForPanel(panelId);
      if (panelDocuments.length > 0) {
        this.selectDocument(panelDocuments[0].id, panelId);
        this.saveLastViewedDocument(panelDocuments[0].id, panelId);
      }
    }, this);
  };
  
  ChakraApp.AppState.prototype.saveToStorage = function() {
    try {
      if (this._saveTimeout) {
        clearTimeout(this._saveTimeout);
      }
      
      this._saveTimeout = setTimeout(() => this._actualSaveToStorage(), 300);
      
      return true;
    } catch (error) {
      console.error('Error scheduling state save:', error);
      return false;
    }
  };
  
  ChakraApp.AppState.prototype._actualSaveToStorage = function() {
    try {
      var data = {
        documents: this._serializeCollection('documents'),
        circles: this._serializeCollection('circles'),
        squares: this._serializeCollection('squares'),
        tabs: this._serializeCollection('tabs'),
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
  
  ChakraApp.AppState.prototype._serializeCollection = function(entityType) {
    return Array.from(this[entityType].values()).map(entity => entity.toJSON());
  };
  
  ChakraApp.AppState.prototype.saveToStorageNow = function() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    
    return this._actualSaveToStorage();
  };
  
  // Create singleton instance
  ChakraApp.appState = new ChakraApp.AppState();
  
})(window.ChakraApp = window.ChakraApp || {});
