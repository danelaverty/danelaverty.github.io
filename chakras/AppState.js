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
  // Change to support both list1 and list2 selections per circle type
  this.selectedDocumentIds = {};
  
  // NEW: Track most recently selected document per circle type
  this.mostRecentDocumentSelection = {};
  
  // Add entries for each circle type in the config with both list types
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      this.selectedDocumentIds[circleType.id] = {
        list1: null,
        list2: null
      };
      // NEW: Initialize recent selection tracking
      this.mostRecentDocumentSelection[circleType.id] = null; // Format: { docId: 'id', listType: 'list1|list2' }
    }, this);
  } else {
    // Fallback if config isn't available
    this.selectedDocumentIds = {
      standard: { list1: null, list2: null },
      triangle: { list1: null, list2: null },
      gem: { list1: null, list2: null },
      star: { list1: null, list2: null },
      hexagon: { list1: null, list2: null }
    };
    this.mostRecentDocumentSelection = {
      standard: null,
      triangle: null,
      gem: null,
      star: null,
      hexagon: null
    };
  }
  
  this.circleReferences = [];
  this.selectedCircleId = null;
  this.selectedSquareId = null;
  this.selectedCircleReferenceId = null;
  this.selectedTabId = null;
};
  
ChakraApp.AppState.prototype._initializeUIState = function() {
  this.panelVisibility = { left: true, bottom: true };
  this.documentListVisible = { left: false, bottom: false };
  
  // NEW: Track visibility state for each circle type
  this.circleTypeVisibility = {};
  
  // Initialize visibility for all circle types (default to visible)
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      this.circleTypeVisibility[circleType.id] = true;
    }, this);
  } else {
    // Fallback
    this.circleTypeVisibility = {
      standard: true,
      triangle: true,
      gem: true,
      star: true,
      hexagon: true
    };
  }
};

ChakraApp.AppState.prototype.toggleCircleTypeVisibility = function(circleTypeId) {
  if (!this.circleTypeVisibility.hasOwnProperty(circleTypeId)) {
    this.circleTypeVisibility[circleTypeId] = true;
  }
  
  // Toggle the visibility
  this.circleTypeVisibility[circleTypeId] = !this.circleTypeVisibility[circleTypeId];
  
  console.log('Toggled visibility for circle type:', circleTypeId, 'to:', this.circleTypeVisibility[circleTypeId]);
  
  // Update the view to show/hide circles of this type
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    ChakraApp.app.viewManager.renderCirclesForPanel('left');
  }
  
  // Update the header visual state
  this._updateHeaderVisualState(circleTypeId);
  
  // Publish event for any other components that need to know
  ChakraApp.EventBus.publish('CIRCLE_TYPE_VISIBILITY_CHANGED', {
    circleTypeId: circleTypeId,
    visible: this.circleTypeVisibility[circleTypeId]
  });
  
  return this.circleTypeVisibility[circleTypeId];
};

// 3. Add method to set visibility (for button clicks to turn it back on):
ChakraApp.AppState.prototype.setCircleTypeVisibility = function(circleTypeId, visible) {
  if (!this.circleTypeVisibility.hasOwnProperty(circleTypeId)) {
    this.circleTypeVisibility[circleTypeId] = true;
  }
  
  var wasVisible = this.circleTypeVisibility[circleTypeId];
  this.circleTypeVisibility[circleTypeId] = visible;
  
  // Only update if visibility actually changed
  if (wasVisible !== visible) {
    console.log('Set visibility for circle type:', circleTypeId, 'to:', visible);
    
    // Update the view
    if (ChakraApp.app && ChakraApp.app.viewManager) {
      ChakraApp.app.viewManager.renderCirclesForPanel('left');
    }
    
    // Update the header visual state
    this._updateHeaderVisualState(circleTypeId);
    
    // Publish event
    ChakraApp.EventBus.publish('CIRCLE_TYPE_VISIBILITY_CHANGED', {
      circleTypeId: circleTypeId,
      visible: visible
    });
  }
  
  return visible;
};

// 4. Add method to update header visual state:
ChakraApp.AppState.prototype._updateHeaderVisualState = function(circleTypeId) {
  var header = document.querySelector('.header-section h3[data-circle-type="' + circleTypeId + '"]');
  if (!header) {
    // Fallback: find by text content
    var allHeaders = document.querySelectorAll('.header-section h3');
    for (var i = 0; i < allHeaders.length; i++) {
      var circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
        return type.name === allHeaders[i].textContent;
      });
      if (circleTypeConfig && circleTypeConfig.id === circleTypeId) {
        header = allHeaders[i];
        break;
      }
    }
  }
  
  if (header) {
    var isVisible = this.circleTypeVisibility[circleTypeId];
    if (isVisible) {
      header.style.color = '#666'; // Normal color
      header.title = 'Click to hide all ' + circleTypeId + ' circles';
    } else {
      header.style.color = 'rgb(60, 60, 60)'; // Dimmed color
      header.title = 'Click to show all ' + circleTypeId + ' circles (currently hidden)';
    }
  }
};

  // NEW: Instance management methods
  ChakraApp.AppState.prototype._getInstanceId = function() {
    // Try to get from URL parameter first (?instance=myapp1)
    const params = new URLSearchParams(window.location.search);
    const urlInstance = params.get('instance');
    if (urlInstance) {
      return urlInstance;
    }
    
    // For file:// URLs, use the directory path
    if (window.location.protocol === 'file:') {
      const path = window.location.pathname;
      // Extract directory name from path like /C:/http/chakras-dev1/index.html
      const pathParts = path.split('/');
      const dirName = pathParts[pathParts.length - 2]; // Get the directory name
      return dirName || 'default';
    }
    
    // Fall back to port-based instance ID for http/https
    const port = window.location.port || '3000';
    return `instance${port}`;
  };

  ChakraApp.AppState.prototype._getStorageKey = function(keyName) {
    const instanceId = this._getInstanceId();
    return `${instanceId}.${keyName}`;
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
  
  // IMPORTANT: Only clear SQUARE connections, not circle connections
  var squareConnectionsToRemove = [];
  var self = this;
  
  this.connections.forEach(function(conn, connId) {
    // Only remove square connections (connectionType is undefined/null or explicitly 'square')
    if (!conn.connectionType || conn.connectionType === 'square') {
      squareConnectionsToRemove.push(connId);
    }
  });
  
  squareConnectionsToRemove.forEach(function(connId) {
    self.connections.delete(connId);
  });
  
  // Update only square connections for this circle
  this._updateConnectionsForCircleId(circleId);
  
  // Publish event to update views - this will update square connections but preserve circle connections
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
  
};
  
ChakraApp.AppState.prototype._handleCircleDeselection = function() {
  
  this._hideAllSquares();
  this._cleanupSquareViews();
  this.deselectSquare();
  
  // IMPORTANT: Only clear SQUARE connections, not circle connections
  var squareConnectionsToRemove = [];
  var self = this;
  
  this.connections.forEach(function(conn, connId) {
    // Only remove square connections (connectionType is undefined/null or explicitly 'square')
    if (!conn.connectionType || conn.connectionType === 'square') {
      squareConnectionsToRemove.push(connId);
    }
  });
  
  squareConnectionsToRemove.forEach(function(connId) {
    self.connections.delete(connId);
  });
  
  if (ChakraApp.OverlappingSquaresManager) {
    ChakraApp.OverlappingSquaresManager.cleanup();
  }
  
  // Publish event to update views - this will clear square connection views but preserve circle connections
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
  
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
  if (!entity) {
    return null;
  }
  
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

  // Panel state methods - UPDATED to use instance-specific storage
  ChakraApp.AppState.prototype._loadPanelState = function() {
    try {
      var savedState = localStorage.getItem(this._getStorageKey('chakraPanelVisibility'));
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
      localStorage.setItem(this._getStorageKey('chakraPanelVisibility'), JSON.stringify(this.panelVisibility));
    } catch (e) {
      console.error('Error saving panel state:', e);
    }
  };
  
ChakraApp.AppState.prototype._migrateDocumentsToListType = function() {
  var migrationApplied = false;
  
  this.documents.forEach(function(doc) {
    // If document doesn't have listType, assign it to list1
    if (!doc.listType) {
      doc.listType = 'list1';
      migrationApplied = true;
    }
  });
  
  if (migrationApplied) {
    this.saveToStorageNow();
    console.log('Migrated existing documents to list1');
  }
  
  return migrationApplied;
};

// Update the loadFromStorage method to include the migration
ChakraApp.AppState.prototype.loadFromStorage = function() {
  try {
    this._isLoading = true;
    
    var savedData = localStorage.getItem(this._getStorageKey('chakraVisualizerData'));
    if (!savedData) {
      this._isLoading = false;
      return false;
    }
    
    var data = JSON.parse(savedData);
    this._resetState();
    this._loadEntities(data);
    
    // Restore selectedDocumentIds if it exists in saved data
    if (data.selectedDocumentIds) {
      this.selectedDocumentIds = data.selectedDocumentIds;
      
      // Clean up to ensure only valid circle types
      this.cleanupSelectedDocumentIds();
    }
    
    // NEW: Migrate existing documents to have listType
    this._migrateDocumentsToListType();
    
    // Don't use _selectLastViewedDocuments anymore - it's panel-based
    // Instead, try to select documents based on the restored selectedDocumentIds
    this._selectSavedDocuments();
    
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

ChakraApp.AppState.prototype._selectSavedDocuments = function() {
  var self = this;
  
  // For each circle type in selectedDocumentIds
  Object.keys(this.selectedDocumentIds).forEach(function(circleTypeId) {
    var docId = self.selectedDocumentIds[circleTypeId];
    
    // If we have a document ID for this type
    if (docId) {
      var doc = self.documents.get(docId);
      if (doc) {
        // Select the document again - this will trigger UI updates
        self.selectDocument(docId, circleTypeId);
      } else {
        // Document doesn't exist anymore, clear selection
        self.selectedDocumentIds[circleTypeId] = null;
      }
    }
  });
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

  this.circleReferences = (data.circleReferences || []).map(function(refData) {
    return new ChakraApp.CircleReference(refData);
  });
  this.selectedCircleReferenceId = data.selectedCircleReferenceId || null;
  
  // Load recent selection tracking
  if (data.mostRecentDocumentSelection) {
    this.mostRecentDocumentSelection = data.mostRecentDocumentSelection;
  }
  
  // NEW: Load circle type visibility
  if (data.circleTypeVisibility) {
    this.circleTypeVisibility = data.circleTypeVisibility;
  }
  
  // Update circle connections after loading everything
  this._updateCircleConnections();
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

      // Include selectedDocumentIds and recent selection tracking
      selectedDocumentIds: this.selectedDocumentIds,
      mostRecentDocumentSelection: this.mostRecentDocumentSelection,
      
      // NEW: Include circle type visibility
      circleTypeVisibility: this.circleTypeVisibility
    };

    data.circleReferences = this.circleReferences.map(function(ref) { return ref.toJSON(); });
    data.selectedCircleReferenceId = this.selectedCircleReferenceId;
    
    localStorage.setItem(this._getStorageKey('chakraVisualizerData'), JSON.stringify(data));
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

  ChakraApp.AppState.prototype.getDocumentsForCircleType = function(circleTypeId) {
  var docsForType = [];
  
  this.documents.forEach(function(doc) {
    if (doc.circleType === circleTypeId) {
      docsForType.push(doc);
    }
  });
  
  return docsForType;
};
  
  // Create singleton instance
  ChakraApp.appState = new ChakraApp.AppState();
  
})(window.ChakraApp = window.ChakraApp || {});
