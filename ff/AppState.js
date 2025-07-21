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
    this._initializeLeftPanelState();
  };
  
  ChakraApp.AppState.prototype._initializeCollections = function() {
    this.entityCollections = ['documents', 'circles', 'squares', 'connections', 'tabs'];
    this.entityCollections.forEach(collection => this[collection] = new Map());
  };
  
  ChakraApp.AppState.prototype._initializePanels = function() {
    this.panels = ['left', 'bottom'];
  };

  ChakraApp.AppState.prototype._initializeLeftPanelState = function() {
    // Track left panels
    this.leftPanels = new Map();
    this.nextLeftPanelId = 0;
    
    // Each left panel has its own document selections
    this.leftPanelSelections = new Map();
    
    // Track custom names for panels
    this.leftPanelCustomNames = new Map();
    
    // Track header toggle state for each panel
    this.leftPanelHeaderTypes = new Map();

    // NEW: Track silhouette visibility for each panel
    this.leftPanelSilhouetteVisibility = new Map();

    this.selectedLeftPanelId = null; 
};
  
ChakraApp.AppState.prototype.getLeftPanelCustomName = function(panelId) {
    return this.leftPanelCustomNames.get(panelId) || null;
};

ChakraApp.AppState.prototype.setLeftPanelCustomName = function(panelId, customName) {
    if (customName && customName.trim()) {
        this.leftPanelCustomNames.set(panelId, customName.trim());
    } else {
        this.leftPanelCustomNames.delete(panelId);
    }
    
    // Save to storage immediately
    this.saveToStorage();
    
    return this.leftPanelCustomNames.get(panelId) || null;
};
    
  ChakraApp.AppState.prototype._createEmptySelections = function() {
    var selections = {};
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        selections[circleType.id] = {
          list1: null,
          list2: null
        };
      });
    }
    return selections;
  };
    
  // Left panel management methods
  ChakraApp.AppState.prototype.addLeftPanel = function() {
    var panelId = this.nextLeftPanelId++;
    
    // Calculate next order position
    var maxOrder = -1;
    this.leftPanels.forEach(function(panelState) {
        if (panelState.order !== undefined && panelState.order > maxOrder) {
            maxOrder = panelState.order;
        }
    });
    
    var newOrder = maxOrder + 1;
    
    
    this.leftPanels.set(panelId, {
        id: panelId,
        visible: true,
        zoomLevel: null,
        minimized: false,
        order: newOrder // UPDATED: Assign order
    });
    
    // Initialize selections for this panel
    this.leftPanelSelections.set(panelId, this._createEmptySelections());
    
    return panelId;
};

ChakraApp.AppState.prototype.updatePanelOrder = function(panelId, newOrder) {
    if (this.leftPanels.has(panelId)) {
        var panelState = this.leftPanels.get(panelId);
        var oldOrder = panelState.order;
        panelState.order = newOrder;
        this.leftPanels.set(panelId, panelState);
        
        
        this.saveToStorageNow(); // Use immediate save
        return true;
    }
    return false;
};

ChakraApp.AppState.prototype.reorderPanels = function(orderedPanelIds) {
    var self = this;
    
    
    orderedPanelIds.forEach(function(panelId, index) {
        if (self.leftPanels.has(panelId)) {
            var panelState = self.leftPanels.get(panelId);
            panelState.order = index;
            self.leftPanels.set(panelId, panelState);
        }
    });
    
    this.saveToStorageNow(); // Use immediate save
};

ChakraApp.AppState.prototype.minimizeLeftPanel = function(panelId) {
    if (this.leftPanels.has(panelId)) {
        var panelState = this.leftPanels.get(panelId);
        panelState.minimized = true;
        this.leftPanels.set(panelId, panelState);
        
        
        this.saveToStorageNow(); // Use immediate save
        return true;
    }
    return false;
};


ChakraApp.AppState.prototype.restoreLeftPanel = function(panelId) {
    if (this.leftPanels.has(panelId)) {
        var panelState = this.leftPanels.get(panelId);
        panelState.minimized = false;
        this.leftPanels.set(panelId, panelState);
        
        
        this.saveToStorageNow(); // Use immediate save
        return true;
    }
    return false;
};

// NEW: Check if panel is minimized
ChakraApp.AppState.prototype.isPanelMinimized = function(panelId) {
  if (this.leftPanels.has(panelId)) {
    var panelState = this.leftPanels.get(panelId);
    return panelState.minimized === true;
  }
  return false;
};

// NEW: Get all minimized panels
ChakraApp.AppState.prototype.getMinimizedPanels = function() {
  var minimizedPanels = [];
  this.leftPanels.forEach(function(panelState, panelId) {
    if (panelState.minimized) {
      minimizedPanels.push(panelId);
    }
  });
  return minimizedPanels;
};

// NEW: Get all visible (non-minimized) panels
ChakraApp.AppState.prototype.getVisiblePanels = function() {
  var visiblePanels = [];
  this.leftPanels.forEach(function(panelState, panelId) {
    if (!panelState.minimized) {
      visiblePanels.push(panelId);
    }
  });
  return visiblePanels;
};
    
ChakraApp.AppState.prototype.removeLeftPanel = function(panelId) {
    // NO special protection - any panel can be removed
    if (this.leftPanels.has(panelId)) {
        this.leftPanels.delete(panelId);
        this.leftPanelSelections.delete(panelId);
        
        // Clean up custom name, header type, and silhouette visibility
        this.leftPanelCustomNames.delete(panelId);
        this.leftPanelHeaderTypes.delete(panelId);
        this.leftPanelSilhouetteVisibility.delete(panelId); // NEW: Clean up silhouette visibility
        
        ChakraApp.EventBus.publish('LEFT_PANEL_REMOVED', { panelId: panelId });
        this.saveToStorage();
        return true;
    }
    return false;
};
    
ChakraApp.AppState.prototype.getLeftPanelSelections = function(panelId) {
    return this.leftPanelSelections.get(panelId) || this._createEmptySelections();
  };
    
ChakraApp.AppState.prototype.selectDocumentForPanel = function(documentId, circleTypeId, listType, panelId) {
  var selections = this.getLeftPanelSelections(panelId);
  
  if (!selections[circleTypeId]) {
    selections[circleTypeId] = { list1: null, list2: null };
  }
  
  // FIXED: Don't deselect from other panels - allow multi-panel selection
  // Only deselect the previous document in THIS SPECIFIC PANEL and list type
  var previousDocIdInThisPanel = selections[circleTypeId][listType];
  if (previousDocIdInThisPanel && previousDocIdInThisPanel !== documentId) {
    var previousDoc = this.documents.get(previousDocIdInThisPanel);
    if (previousDoc) {
      // Only clear the panel tracking if this was the last panel it was selected in
      var stillSelectedInOtherPanels = this._isDocumentSelectedInOtherPanels(previousDocIdInThisPanel, circleTypeId, listType, panelId);
      if (!stillSelectedInOtherPanels) {
        previousDoc.deselect();
        previousDoc._selectedFromPanel = undefined;
      } else {
      }
    }
  }
  
  // Select new document in this panel
  selections[circleTypeId][listType] = documentId;
  var doc = this.documents.get(documentId);
  if (doc) {
    doc.select();
    
    // FIXED: Track ALL panels this document is selected in, not just one
    if (!doc._selectedFromPanels) {
      doc._selectedFromPanels = new Set();
    }
    doc._selectedFromPanels.add(panelId);
    
    
    // Update backward compatibility selectedDocumentIds for ANY panel (not just panel 0)
    if (!this.selectedDocumentIds) {
      this.selectedDocumentIds = {};
    }
    if (!this.selectedDocumentIds[circleTypeId]) {
      this.selectedDocumentIds[circleTypeId] = { list1: null, list2: null };
    }
    this.selectedDocumentIds[circleTypeId][listType] = documentId;
    
    // Update most recent selection tracking
    if (!this.mostRecentDocumentSelection) {
      this.mostRecentDocumentSelection = {};
    }
    this.mostRecentDocumentSelection[circleTypeId] = {
      docId: documentId,
      listType: listType,
      panelId: panelId
    };
    
    // Update visual indicators for backward compatibility
    this._updateDocumentToggleButtonIndicators(circleTypeId);
  }
  
  this.leftPanelSelections.set(panelId, selections);
  
  
  ChakraApp.EventBus.publish('LEFT_PANEL_DOCUMENT_SELECTED', {
    panelId: panelId,
    documentId: documentId,
    circleTypeId: circleTypeId,
    listType: listType
  });
  
  this.saveToStorage();
  return doc;
};

ChakraApp.AppState.prototype._isDocumentSelectedInOtherPanels = function(documentId, circleTypeId, listType, excludePanelId) {
  var self = this;
  var selectedInOtherPanels = false;
  
  this.leftPanels.forEach(function(panel, panelId) {
    // Skip the panel we're excluding
    if (panelId === excludePanelId) return;
    
    var panelSelections = self.getLeftPanelSelections(panelId);
    var typeSelections = panelSelections[circleTypeId];
    
    if (typeSelections) {
      // Check if this document is selected in either list in this other panel
      if (typeSelections.list1 === documentId || typeSelections.list2 === documentId) {
        selectedInOtherPanels = true;
      }
    }
  });
  
  return selectedInOtherPanels;
};
  
  ChakraApp.AppState.prototype._initializeSelectionState = function() {
    // Change to support both list1 and list2 selections per circle type
    this.selectedDocumentIds = {};
    
    // Track most recently selected document per circle type
    this.mostRecentDocumentSelection = {};
    
    // Add entries for each circle type in the config with both list types
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        this.selectedDocumentIds[circleType.id] = {
          list1: null,
          list2: null
        };
        this.mostRecentDocumentSelection[circleType.id] = null;
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
    
    // Existing circle type visibility
    this.circleTypeVisibility = {};
    
    // Track visibility state for each list type
    this.listTypeVisibility = {
      list1: true,  // List A visible by default
      list2: true   // List B visible by default
    };
    
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

 ChakraApp.AppState.prototype.toggleListTypeVisibility = function(listType) {
    if (!this.listTypeVisibility.hasOwnProperty(listType)) {
      this.listTypeVisibility[listType] = true;
    }
    
    // Toggle the visibility
    this.listTypeVisibility[listType] = !this.listTypeVisibility[listType];
    
    // Update the view to show/hide circles of this list type
    if (ChakraApp.app && ChakraApp.app.viewManager) {
      ChakraApp.app.viewManager.renderCirclesForPanel('left');
    }
    
    // Update the column header visual state
    this._updateColumnHeaderVisualState(listType);
    
    // Publish event for any other components that need to know
    ChakraApp.EventBus.publish('LIST_TYPE_VISIBILITY_CHANGED', {
      listType: listType,
      visible: this.listTypeVisibility[listType]
    });
    
    // Save state to localStorage
    this._saveStateIfNotLoading();
    
    return this.listTypeVisibility[listType];
  };

 ChakraApp.AppState.prototype.setListTypeVisibility = function(listType, visible) {
    if (!this.listTypeVisibility.hasOwnProperty(listType)) {
      this.listTypeVisibility[listType] = true;
    }
    
    var wasVisible = this.listTypeVisibility[listType];
    this.listTypeVisibility[listType] = visible;
    
    // Only update if visibility actually changed
    if (wasVisible !== visible) {
      
      // Update the view
      if (ChakraApp.app && ChakraApp.app.viewManager) {
        ChakraApp.app.viewManager.renderCirclesForPanel('left');
      }
      
      // Update the column header visual state
      this._updateColumnHeaderVisualState(listType);
      
      // Publish event
      ChakraApp.EventBus.publish('LIST_TYPE_VISIBILITY_CHANGED', {
        listType: listType,
        visible: visible
      });
      
      // Save state to localStorage
      this._saveStateIfNotLoading();
    }
    
    return visible;
  };

 ChakraApp.AppState.prototype._updateColumnHeaderVisualState = function(listType) {
    var labelClass = listType === 'list1' ? '.column-label-a' : '.column-label-b';
    var header = document.querySelector(labelClass);
    
    if (header) {
      var isVisible = this.listTypeVisibility[listType];
      if (isVisible) {
        header.style.opacity = '1';
        header.title = 'Click to hide all ' + (listType === 'list1' ? 'List A' : 'List B') + ' circles';
      } else {
        header.style.opacity = '0.5';
        header.title = 'Click to show all ' + (listType === 'list1' ? 'List A' : 'List B') + ' circles (currently hidden)';
      }
    }
  };


  ChakraApp.AppState.prototype.toggleCircleTypeVisibility = function(circleTypeId) {
    if (!this.circleTypeVisibility.hasOwnProperty(circleTypeId)) {
      this.circleTypeVisibility[circleTypeId] = true;
    }
    
    // Toggle the visibility
    this.circleTypeVisibility[circleTypeId] = !this.circleTypeVisibility[circleTypeId];
    
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
    
    // Explicitly save state to localStorage
    this._saveStateIfNotLoading();
    
    return this.circleTypeVisibility[circleTypeId];
  };

 ChakraApp.AppState.prototype.setCircleTypeVisibility = function(circleTypeId, visible) {
    if (!this.circleTypeVisibility.hasOwnProperty(circleTypeId)) {
      this.circleTypeVisibility[circleTypeId] = true;
    }
    
    var wasVisible = this.circleTypeVisibility[circleTypeId];
    this.circleTypeVisibility[circleTypeId] = visible;
    
    // Only update if visibility actually changed
    if (wasVisible !== visible) {
      
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
      
      // Explicitly save state to localStorage
      this._saveStateIfNotLoading();
    }
    
    return visible;
  };

  // Update header visual state
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

  // Instance management methods
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
  };
  
ChakraApp.AppState.prototype._handleCircleSelection = function(circle) {
    // Use the circle id if circle object is passed, otherwise use the circleId directly
    var circleId = circle.id || circle;
    
    if (typeof ChakraApp.cleanupOverlappingGroups === 'function') {
      ChakraApp.cleanupOverlappingGroups();
    }
    
    // Hide all squares first
    this._hideAllSquares();
    
    // REMOVED: Don't call _showSquaresForCircle here anymore!
    // The tab controller will handle showing the appropriate squares
    
    // Clear and update square connections (but not circle connections)
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
    
    // Publish event to update views - this will clear square connection views but preserve circle connections
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
    
    // NOTE: No longer calling _showSquaresForCircle or _updateConnectionsForCircleId here
    // The TabController will handle showing squares for the selected tab
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

ChakraApp.AppState.prototype._isDocumentSelectedAnywhere = function(documentId) {
  var self = this;
  var selectedAnywhere = false;
  
  // Check all circle types
  Object.keys(this.selectedDocumentIds).forEach(function(circleTypeId) {
    var typeSelections = self.selectedDocumentIds[circleTypeId];
    if (typeSelections && typeof typeSelections === 'object') {
      if (typeSelections.list1 === documentId || typeSelections.list2 === documentId) {
        selectedAnywhere = true;
      }
    }
  });
  
  return selectedAnywhere;
};

  // Entity handler definitions
  ChakraApp.AppState.prototype._getEntityHandlers = function() {
    return {
      documents: {
        class: ChakraApp.Document,
        prefix: 'DOCUMENT',
        cleanup: (entity, id) => {
          var appState = ChakraApp.appState;
          appState._deselectDocumentIfSelected(entity.circleType, id);
          appState._handleLastViewedDocument(entity.circleType, id, entity.listType);
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
          
          // Use MultiSelectionManager for deselection
          if (ChakraApp.MultiSelectionManager) {
            // Remove from multi-selection if selected
            if (ChakraApp.MultiSelectionManager.isSquareSelected(id)) {
              ChakraApp.MultiSelectionManager.removeFromSelection(id);
            }
          } else {
            // Fallback to old system
            if (appState.selectedSquareId === id) {
              appState.deselectSquare();
            }
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
    const handlers = this._getEntityHandlers();
    
    Object.keys(handlers).forEach(entityType => {
      const handler = handlers[entityType];
      
      // Generate singular form of entity type (e.g., "documents" -> "Document")
      const singularType = entityType.charAt(0).toUpperCase() + entityType.slice(1, -1);
      
      // Add method - custom implementation for squares, default for others
      const addMethodName = 'add' + singularType;
      if (entityType === 'squares') {
        // Custom addSquare method that integrates with MultiSelectionManager
        this[addMethodName] = function(data, panelId) {
          if (data && this.selectedTabId) {
            data.tabId = this.selectedTabId;
          }
          const entity = this._createEntity(entityType, handler.class, data, handler.prefix, panelId);

          if (entity && entity.circleId) {
            this._updateChakraFormForCircle(entity.circleId);
            
            // Use MultiSelectionManager for selection instead of old system
            if (ChakraApp.MultiSelectionManager) {
              // Clear any existing selections and select this new square
              ChakraApp.MultiSelectionManager.selectSingle(entity.id);
            } else {
              // Fallback to old system if MultiSelectionManager not available
              this.selectSquare(entity.id);
            }
          }

          return entity;
        };
      } else if (!(entityType === 'circles' && this[addMethodName])) {
        // Default implementation for non-square entities
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

  // Panel state methods - use instance-specific storage
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
      
      // Load left panel state
      if (data.leftPanelState) {
        this._deserializeLeftPanels(data.leftPanelState);
      } else {
        // Handle legacy format
        if (data.leftPanelSelections) {
          var self = this;
          Object.keys(data.leftPanelSelections).forEach(function(panelId) {
            var panelIdNum = parseInt(panelId);
            if (!isNaN(panelIdNum)) {
              self.leftPanelSelections.set(panelIdNum, data.leftPanelSelections[panelId]);
            }
          });
        }
      }
      
      // Restore selectedDocumentIds (no special treatment for any panel)
      if (data.selectedDocumentIds) {
	      this.selectedDocumentIds = data.selectedDocumentIds;
	      this.cleanupSelectedDocumentIds();
      }
      
      // Migrate existing documents to have listType
      this._migrateDocumentsToListType();
      
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

  ChakraApp.AppState.prototype._serializeLeftPanelSelections = function() {
    var serialized = {};
    var self = this;
    this.leftPanelSelections.forEach(function(selections, panelId) {
      serialized[panelId] = selections;
    });

    serialized.selectedPanelId = this.selectedLeftPanelId;
    return serialized;
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
    
    // Load circle type visibility
    if (data.circleTypeVisibility) {
      this.circleTypeVisibility = data.circleTypeVisibility;
    }
    
    // Load list type visibility
    if (data.listTypeVisibility) {
      this.listTypeVisibility = data.listTypeVisibility;
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

        // Include selectedDocumentIds for backward compatibility
        selectedDocumentIds: this.selectedDocumentIds,
        mostRecentDocumentSelection: this.mostRecentDocumentSelection,
        
        // Save complete left panel state
        leftPanelState: this._serializeLeftPanels(),
        
        // Include circle type visibility
        circleTypeVisibility: this.circleTypeVisibility,
        
        // Include list type visibility
        listTypeVisibility: this.listTypeVisibility
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

ChakraApp.AppState.prototype.generateDateBasedDocumentName = function(circleTypeId, listType) {
  // Get current date in YYYY-MM-DD format
  var today = new Date();
  var year = today.getFullYear();
  var month = String(today.getMonth() + 1).padStart(2, '0');
  var day = String(today.getDate()).padStart(2, '0');
  var baseDate = year + '-' + month + '-' + day;
  
  // Check if documents with this date already exist for this circle type and list type
  var existingDocuments = this.getDocumentsForCircleTypeAndList(circleTypeId, listType);
  var dateBasedDocs = existingDocuments.filter(function(doc) {
    return doc.name.startsWith(baseDate);
  });
  
  // If no documents with today's date exist, use the base date
  if (dateBasedDocs.length === 0) {
    return baseDate;
  }
  
  // Find the highest number suffix used today
  var maxSuffix = 0;
  dateBasedDocs.forEach(function(doc) {
    var name = doc.name;
    
    // Check if it's exactly the base date (no suffix)
    if (name === baseDate) {
      maxSuffix = Math.max(maxSuffix, 0);
      return;
    }
    
    // Check for pattern like "2025-07-10 (1)", "2025-07-10 (2)", etc.
    var suffixMatch = name.match(new RegExp('^' + baseDate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\((\\d+)\\)$'));
    if (suffixMatch) {
      var suffixNumber = parseInt(suffixMatch[1], 10);
      maxSuffix = Math.max(maxSuffix, suffixNumber);
    }
  });
  
  // Return the next available name
  if (maxSuffix === 0) {
    // First duplicate, so use (1)
    return baseDate + ' (1)';
  } else {
    // Increment the highest found suffix
    return baseDate + ' (' + (maxSuffix + 1) + ')';
  }
};

  ChakraApp.AppState.prototype.shouldCircleBeVisible = function(circle) {
    // Check circle type visibility
    var circleType = circle.circleType || 'standard';
    if (!this.circleTypeVisibility[circleType]) {
      return false;
    }
    
    // Check if circle belongs to a visible list type
    var document = this.getDocument(circle.documentId);
    if (document && document.listType) {
      if (!this.listTypeVisibility[document.listType]) {
        return false;
      }
    }
    
    // Check if the document is selected in ANY panel
    var isSelectedInAnyPanel = false;
    var self = this;
    this.leftPanels.forEach(function(panel, panelId) {
      var panelSelections = self.getLeftPanelSelections(panelId);
      var selectedDocs = panelSelections[circleType];
      if (selectedDocs) {
        var isSelected = (selectedDocs.list1 === circle.documentId) || 
                         (selectedDocs.list2 === circle.documentId);
        if (isSelected) {
          isSelectedInAnyPanel = true;
        }
      }
    });
    
    return isSelectedInAnyPanel;
  };

ChakraApp.AppState.prototype._serializeLeftPanels = function() {
    var serialized = {
        panels: {},
        nextId: this.nextLeftPanelId,
        selections: {},
        customNames: {},
        headerTypes: {},
        silhouetteVisibility: {},
    };
    
    var self = this;
    this.leftPanels.forEach(function(panel, panelId) {
        serialized.panels[panelId] = {
            id: panel.id,
            visible: panel.visible,
            zoomLevel: panel.zoomLevel,
            minimized: panel.minimized || false,
            order: panel.order !== undefined ? panel.order : panelId
        };
    });
    
    // Also serialize minimized panels
    this.minimizedPanels && this.minimizedPanels.forEach(function(panel, panelId) {
        if (!serialized.panels[panelId]) {
            serialized.panels[panelId] = {
                id: panelId,
                visible: panel.visible !== false,
                zoomLevel: panel.zoomLevel || null,
                minimized: true,
                order: panel.order !== undefined ? panel.order : panelId
            };
        }
    });
    
    // Include panel selections
    this.leftPanelSelections.forEach(function(selections, panelId) {
        serialized.selections[panelId] = selections;
    });
    
    // Include custom names
    this.leftPanelCustomNames.forEach(function(customName, panelId) {
        serialized.customNames[panelId] = customName;
    });
    
    // Include header types
    this.leftPanelHeaderTypes.forEach(function(headerType, panelId) {
        serialized.headerTypes[panelId] = headerType;
    });

    // NEW: Include silhouette visibility with debugging
    
    if (this.leftPanelSilhouetteVisibility) {
        this.leftPanelSilhouetteVisibility.forEach(function(isVisible, panelId) {
            serialized.silhouetteVisibility[panelId] = isVisible;
        });
    }
    
    
    return serialized;
};

ChakraApp.AppState.prototype._initializeHeaderToggleState = function() {
    // Track which header type is active for each panel (default to 'standard')
    this.leftPanelHeaderTypes = new Map();
};

 ChakraApp.AppState.prototype.getLeftPanelHeaderType = function(panelId) {
    return this.leftPanelHeaderTypes.get(panelId) || 'standard';
  };

  ChakraApp.AppState.prototype.setLeftPanelHeaderType = function(panelId, headerType) {
    if (headerType !== 'standard' && headerType !== 'gem') {
        console.warn('Invalid header type:', headerType);
        return false;
    }
    
    this.leftPanelHeaderTypes.set(panelId, headerType);
    this.saveToStorage();
    
    // Publish event for UI updates
    ChakraApp.EventBus.publish('LEFT_PANEL_HEADER_TYPE_CHANGED', {
        panelId: panelId,
        headerType: headerType
    });
    
    return true;
  };

// NEW: Toggle header type for a panel
 ChakraApp.AppState.prototype.toggleLeftPanelHeaderType = function(panelId) {
    var currentType = this.getLeftPanelHeaderType(panelId);
    var newType = currentType === 'standard' ? 'gem' : 'standard';
    
    this.setLeftPanelHeaderType(panelId, newType);
    return newType;
  };

ChakraApp.AppState.prototype._serializeLeftPanelsWithHeaders = function() {
    var serialized = {
        panels: {},
        nextId: this.nextLeftPanelId,
        selections: {},
        customNames: {},
        headerTypes: {},
	silhouetteVisibility: {},
    };
    
    var self = this;
    this.leftPanels.forEach(function(panel, panelId) {
        serialized.panels[panelId] = {
            id: panel.id,
            visible: panel.visible,
            zoomLevel: panel.zoomLevel,
            minimized: panel.minimized || false,
            order: panel.order !== undefined ? panel.order : panelId
        };
    });
    
    // Also serialize minimized panels
    this.minimizedPanels && this.minimizedPanels.forEach(function(panel, panelId) {
        if (!serialized.panels[panelId]) {
            serialized.panels[panelId] = {
                id: panelId,
                visible: panel.visible !== false,
                zoomLevel: panel.zoomLevel || null,
                minimized: true,
                order: panel.order !== undefined ? panel.order : panelId
            };
        }
    });
    
    // Include panel selections
    this.leftPanelSelections.forEach(function(selections, panelId) {
        serialized.selections[panelId] = selections;
    });
    
    // Include custom names
    this.leftPanelCustomNames.forEach(function(customName, panelId) {
        serialized.customNames[panelId] = customName;
    });
    
    // NEW: Include header types
    this.leftPanelHeaderTypes.forEach(function(headerType, panelId) {
        serialized.headerTypes[panelId] = headerType;
    });

    this.leftPanelSilhouetteVisibility.forEach(function(isVisible, panelId) {
        serialized.silhouetteVisibility[panelId] = isVisible;
    });
    
    return serialized;
};

ChakraApp.AppState.prototype._deserializeLeftPanelsWithHeaders = function(data) {
    if (!data) return;
    
    // Restore nextLeftPanelId
    if (data.nextId !== undefined) {
        this.nextLeftPanelId = data.nextId;
    }
    
    // Clear existing panels completely
    this.leftPanels.clear();
    this.leftPanelSelections.clear();
    this.leftPanelCustomNames.clear();
    this.leftPanelHeaderTypes.clear();
    this.leftPanelSilhouetteVisibility.clear();
    
    // Restore panels from saved data with proper ordering
    if (data.panels) {
        var self = this;
        var panelsWithOrder = [];
        
        Object.keys(data.panels).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var panelData = data.panels[panelIdStr];
            
            panelsWithOrder.push({
                id: panelId,
                data: panelData,
                order: panelData.order !== undefined ? panelData.order : panelId
            });
        });
        
        // Sort by order before restoring
        panelsWithOrder.sort(function(a, b) {
            return a.order - b.order;
        });
        
        // Restore panels in correct order
        panelsWithOrder.forEach(function(panelInfo) {
            var panelId = panelInfo.id;
            var panelData = panelInfo.data;
            
            self.leftPanels.set(panelId, {
                id: panelData.id,
                visible: panelData.visible !== false,
                zoomLevel: panelData.zoomLevel || null,
                minimized: panelData.minimized === true,
                order: panelData.order !== undefined ? panelData.order : panelId
            });
        });
    }
    
    // Restore panel selections
    if (data.selections) {
        var self = this;
        Object.keys(data.selections).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            self.leftPanelSelections.set(panelId, data.selections[panelIdStr]);
        });
    }
    
    // Restore custom names
    if (data.customNames) {
        var self = this;
        Object.keys(data.customNames).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var customName = data.customNames[panelIdStr];
            if (customName && customName.trim()) {
                self.leftPanelCustomNames.set(panelId, customName.trim());
            }
        });
    }
    
    // NEW: Restore header types
    if (data.headerTypes) {
        var self = this;
        Object.keys(data.headerTypes).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var headerType = data.headerTypes[panelIdStr];
            if (headerType === 'standard' || headerType === 'gem') {
                self.leftPanelHeaderTypes.set(panelId, headerType);
            }
        });
    }

    if (data.silhouetteVisibility) {
        var self = this;
        Object.keys(data.silhouetteVisibility).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var isVisible = data.silhouetteVisibility[panelIdStr];
            self.leftPanelSilhouetteVisibility.set(panelId, isVisible);
        });
    }
};

ChakraApp.AppState.prototype._deserializeLeftPanels = function(data) {
    if (!data) return;
    
    if (data.silhouetteVisibility) {
    }
    
    // Restore nextLeftPanelId
    if (data.nextId !== undefined) {
        this.nextLeftPanelId = data.nextId;
    }
    
    // Clear existing panels completely
    this.leftPanels.clear();
    this.leftPanelSelections.clear();
    this.leftPanelCustomNames.clear();
    this.leftPanelHeaderTypes.clear();
    this.leftPanelSilhouetteVisibility.clear();
    
    // Restore panels from saved data with proper ordering
    if (data.panels) {
        var self = this;
        var panelsWithOrder = [];
        
        Object.keys(data.panels).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var panelData = data.panels[panelIdStr];
            
            panelsWithOrder.push({
                id: panelId,
                data: panelData,
                order: panelData.order !== undefined ? panelData.order : panelId
            });
        });
        
        // Sort by order before restoring
        panelsWithOrder.sort(function(a, b) {
            return a.order - b.order;
        });
        
        // Restore panels in correct order
        panelsWithOrder.forEach(function(panelInfo) {
            var panelId = panelInfo.id;
            var panelData = panelInfo.data;
            
            self.leftPanels.set(panelId, {
                id: panelData.id,
                visible: panelData.visible !== false,
                zoomLevel: panelData.zoomLevel || null,
                minimized: panelData.minimized === true,
                order: panelData.order !== undefined ? panelData.order : panelId
            });
        });
    }
    
    // Restore panel selections
    if (data.selections) {
        var self = this;
        Object.keys(data.selections).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            self.leftPanelSelections.set(panelId, data.selections[panelIdStr]);
        });
    }
    
    // Restore custom names
    if (data.customNames) {
        var self = this;
        Object.keys(data.customNames).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var customName = data.customNames[panelIdStr];
            if (customName && customName.trim()) {
                self.leftPanelCustomNames.set(panelId, customName.trim());
            }
        });
    }
    
    // Restore header types
    if (data.headerTypes) {
        var self = this;
        Object.keys(data.headerTypes).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var headerType = data.headerTypes[panelIdStr];
            if (headerType === 'standard' || headerType === 'gem') {
                self.leftPanelHeaderTypes.set(panelId, headerType);
            }
        });
    }

    // NEW: Restore silhouette visibility with debugging
    if (data.silhouetteVisibility) {
        var self = this;
        Object.keys(data.silhouetteVisibility).forEach(function(panelIdStr) {
            var panelId = parseInt(panelIdStr);
            var isVisible = data.silhouetteVisibility[panelIdStr];
            self.leftPanelSilhouetteVisibility.set(panelId, isVisible);
        });
    } else {
    }

    if (data.selectedPanelId !== undefined) {
        this.selectedLeftPanelId = data.selectedPanelId;
    }
};

ChakraApp.AppState.prototype.getLeftPanelsInOrder = function() {
    var panelsArray = [];
    
    this.leftPanels.forEach(function(panelState, panelId) {
        panelsArray.push({
            id: panelId,
            state: panelState,
            order: panelState.order !== undefined ? panelState.order : panelId
        });
    });
    
    // Sort by order
    panelsArray.sort(function(a, b) {
        return a.order - b.order;
    });
    
    return panelsArray;
};

ChakraApp.AppState.prototype.getLeftPanelHeaderType = function(panelId) {
    return this.leftPanelHeaderTypes.get(panelId) || 'standard';
};

// Set header type for a panel
ChakraApp.AppState.prototype.setLeftPanelHeaderType = function(panelId, headerType) {
    if (headerType !== 'standard' && headerType !== 'gem') {
        console.warn('Invalid header type:', headerType);
        return false;
    }
    
    this.leftPanelHeaderTypes.set(panelId, headerType);
    this.saveToStorage();
    
    // Publish event for UI updates
    ChakraApp.EventBus.publish('LEFT_PANEL_HEADER_TYPE_CHANGED', {
        panelId: panelId,
        headerType: headerType
    });
    
    return true;
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

ChakraApp.AppState.prototype.getSelectedLeftPanelId = function() {
    return this.selectedLeftPanelId;
};

/**
 * Set the selected left panel
 * @param {number} panelId - The panel ID to select
 * @returns {boolean} True if selection was successful
 */
ChakraApp.AppState.prototype.setSelectedLeftPanel = function(panelId) {
    // Validate that the panel exists
    if (!this.leftPanels.has(panelId)) {
        return false;
    }
    
    var oldSelectedPanelId = this.selectedLeftPanelId;
    this.selectedLeftPanelId = panelId;
    
    // Update visual indicators for panels
    this._updatePanelSelectionVisuals(oldSelectedPanelId, panelId);
    
    // Publish event for other components
    ChakraApp.EventBus.publish('LEFT_PANEL_SELECTED', {
        panelId: panelId,
        previousPanelId: oldSelectedPanelId
    });
    
    // Save to storage
    this.saveToStorage();
    
    return true;
};

/**
 * Get the default selected panel (leftmost panel)
 * @returns {number|null} The leftmost panel ID or null if no panels exist
 */
ChakraApp.AppState.prototype.getDefaultSelectedPanel = function() {
    if (this.leftPanels.size === 0) {
        return null;
    }
    
    // Get panels in order and return the first one
    var panelsInOrder = this.getLeftPanelsInOrder();
    return panelsInOrder.length > 0 ? panelsInOrder[0].id : null;
};

/**
 * Ensure a panel is selected (select default if none selected)
 */
ChakraApp.AppState.prototype.ensureLeftPanelSelected = function() {
    if (this.selectedLeftPanelId === null || !this.leftPanels.has(this.selectedLeftPanelId)) {
        var defaultPanel = this.getDefaultSelectedPanel();
        if (defaultPanel !== null) {
            this.setSelectedLeftPanel(defaultPanel);
        }
    }
};

/**
 * Update visual indicators for panel selection
 * @private
 */
ChakraApp.AppState.prototype._updatePanelSelectionVisuals = function(oldPanelId, newPanelId) {
    // Remove selection indicator from old panel
    if (oldPanelId !== null) {
        var oldPanel = document.getElementById('left-panel-' + oldPanelId);
        if (oldPanel) {
            oldPanel.classList.remove('selected-panel');
        }
    }
    
    // Add selection indicator to new panel
    if (newPanelId !== null) {
        var newPanel = document.getElementById('left-panel-' + newPanelId);
        if (newPanel) {
            newPanel.classList.add('selected-panel');
        }
    }
};

/**
 * Get all circles in the selected left panel
 * @returns {Array} Array of circles in the selected panel
 */
ChakraApp.AppState.prototype.getCirclesInSelectedLeftPanel = function() {
    if (this.selectedLeftPanelId === null) {
        return [];
    }
    
    var panelSelections = this.getLeftPanelSelections(this.selectedLeftPanelId);
    var circlesInPanel = [];
    
    // For each circle type, find circles that should be visible in this panel
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
            var typeId = circleType.id;
            
            // Check if this circle type is visible
            var typeVisible = this.circleTypeVisibility[typeId] !== false;
            if (!typeVisible) {
                return;
            }
            
            var selectedDocs = panelSelections[typeId];
            var selectedDocIds = [];
            
            if (selectedDocs) {
                if (selectedDocs.list1 && this.listTypeVisibility['list1'] !== false) {
                    selectedDocIds.push(selectedDocs.list1);
                }
                if (selectedDocs.list2 && this.listTypeVisibility['list2'] !== false) {
                    selectedDocIds.push(selectedDocs.list2);
                }
            }
            
            // Find circles that belong to selected documents
            this.circles.forEach(function(circle) {
                if (circle.circleType === typeId && selectedDocIds.includes(circle.documentId)) {
                    var document = this.getDocument(circle.documentId);
                    if (document && document.listType) {
                        var listTypeVisible = this.listTypeVisibility[document.listType] !== false;
                        if (listTypeVisible) {
                            circlesInPanel.push(circle);
                        }
                    } else {
                        circlesInPanel.push(circle);
                    }
                }
            }, this);
        }, this);
    }
    
    return circlesInPanel;
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
