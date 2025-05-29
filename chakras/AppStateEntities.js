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
  

  ChakraApp.AppState.prototype.selectDocument = function(id, circleTypeId) {
  var doc = this.documents.get(id);
  if (!doc) return null;
  
  // Always use the document's circle type, or default to 'standard'
  var docType = doc.circleType || 'standard';
  
  // If circle type was specified, ensure it matches
  if (circleTypeId && circleTypeId !== docType) {
    console.warn("Document circle type (" + docType + ") doesn't match specified type (" + circleTypeId + ")");
    // Continue anyway, but use the document's actual type
  }
  
  // If there was a previously selected document of this type, deselect it
  if (this.selectedDocumentIds[docType] && this.selectedDocumentIds[docType] !== id) {
    this.deselectDocument(docType);
  }
  
  // Select the new document
  this.selectedDocumentIds[docType] = id;
  doc.select();
  
  this._deselectCircleIfSelected();
  this._filterCirclesByDocument(doc.id, docType);
  this.saveLastViewedDocument(doc.id, docType);
  
  // Save the state immediately when a document is selected
  this.saveToStorageNow();
  
  return doc;
};
  
  ChakraApp.AppState.prototype._deselectCircleIfSelected = function() {
    if (this.selectedCircleId) {
      this.deselectCircle();
    }
  };
  
ChakraApp.AppState.prototype.deselectDocument = function(circleTypeId) {
  if (!this.selectedDocumentIds[circleTypeId]) return false;
  
  var docId = this.selectedDocumentIds[circleTypeId];
  var doc = this.documents.get(docId);
  
  if (doc) {
    doc.deselect();
  }
  
  this.selectedDocumentIds[circleTypeId] = null;
  
  return true;
};

ChakraApp.AppState.prototype.cleanupSelectedDocumentIds = function() {
  // Create a clean state with only circle types
  var cleanState = {};
  
  // Copy only the valid circle type entries
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      cleanState[typeId] = this.selectedDocumentIds[typeId] || null;
    }, this);
  } else {
    // Fallback if config isn't available
    var defaultTypes = ['standard', 'triangle', 'gem'];
    defaultTypes.forEach(function(typeId) {
      cleanState[typeId] = this.selectedDocumentIds[typeId] || null;
    }, this);
  }
  
  // Replace the entire object
  this.selectedDocumentIds = cleanState;
  
  // Save the cleaned state
  this.saveToStorageNow();
  
  
  return true;
};

ChakraApp.AppState.prototype.toggleDocumentList = function(circleTypeId) {
  // Make sure we're using a valid circle type
  var isValidType = false;
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    isValidType = ChakraApp.Config.circleTypes.some(function(type) {
      return type.id === circleTypeId;
    });
  }
  
  if (!isValidType) {
    console.error("Invalid circle type for document list toggle:", circleTypeId);
    return false;
  }
  
  // Ensure the state property exists
  if (this.documentListVisible[circleTypeId] === undefined) {
    this.documentListVisible[circleTypeId] = false;
  }
  
  // Toggle current state
  this.documentListVisible[circleTypeId] = !this.documentListVisible[circleTypeId];
  
  // If opening a list, close all other open lists
  if (this.documentListVisible[circleTypeId]) {
    ChakraApp.Config.circleTypes.forEach(function(otherType) {
      var otherTypeId = otherType.id;
      // Skip the current type
      if (otherTypeId === circleTypeId) return;
      
      // Close other document lists if open
      if (this.documentListVisible[otherTypeId]) {
        this.documentListVisible[otherTypeId] = false;
        
        // Publish event for this type
        ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
          panelId: otherTypeId,
          visible: false
        });
      }
    }, this);
  }
  
  // Publish event for the current type
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
    panelId: circleTypeId, 
    visible: this.documentListVisible[circleTypeId]
  });
  
  return this.documentListVisible[circleTypeId];
};

ChakraApp.AppState.prototype._migrateDocumentState = function() {
  // 1. Create a clean state with only circle types
  var cleanState = {};
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      cleanState[circleType.id] = null;
    });
  } else {
    cleanState = {
      standard: null,
      triangle: null,
      gem: null,
      star: null,
      hexagon: null
    };
  }
  
  // 2. Migrate any panel-based selections to circle types
  // Check for legacy panel selections first
  if (this.selectedDocumentIds.left) {
    var leftDocId = this.selectedDocumentIds.left;
    if (leftDocId) {
      var leftDoc = this.documents.get(leftDocId);
      if (leftDoc) {
        var docType = leftDoc.circleType || 'standard';
        cleanState[docType] = leftDocId;
      }
    }
  }
  
  // 3. For other panels that might have selections
  if (this.selectedDocumentIds.bottom) {
    var bottomDocId = this.selectedDocumentIds.bottom;
    if (bottomDocId) {
      var bottomDoc = this.documents.get(bottomDocId);
      if (bottomDoc) {
        var docType = bottomDoc.circleType || 'standard';
        cleanState[docType] = bottomDocId;
      }
    }
  }
  
  // 4. Also check if there are already circle type selections and preserve them
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      if (this.selectedDocumentIds[typeId]) {
        cleanState[typeId] = this.selectedDocumentIds[typeId];
      }
    }, this);
  }
  
  // 5. Update any documents without a circleType
  this.documents.forEach(function(doc) {
    if (!doc.circleType) {
      // Infer from panel or set default
      if (doc.panelId === 'things') {
        doc.circleType = 'triangle';
      } else if (doc.panelId === 'bottom') {
        doc.circleType = 'gem';
      } else {
        doc.circleType = 'standard';
      }
    }
  });
  
  // 6. COMPLETELY REPLACE the object instead of updating it
  this.selectedDocumentIds = cleanState;
  
  // 7. Save changes
  this.saveToStorageNow();
  
};
  
  ChakraApp.AppState.prototype.saveLastViewedDocument = function(documentId, panelId) {
    if (documentId && panelId) {
      localStorage.setItem('chakraLastViewedDocumentId_' + panelId, documentId);
    }
  };

  ChakraApp.AppState.prototype._hideAllCircles = function() {
  this.circles.forEach(function(circle) {
    if (circle.visible) {
      circle.visible = false;
      this._notifyStateChanged('circles', circle);
    }
  }, this);
};
  
  ChakraApp.AppState.prototype.getLastViewedDocument = function(panelId) {
    return localStorage.getItem('chakraLastViewedDocumentId_' + panelId);
  };
  
ChakraApp.AppState.prototype._filterCirclesByDocument = function(documentId, panelId) {
  var document = this.getDocument(documentId);
  if (!document) return;
  
  // Hide all circles first
  this._hideAllCircles();
  
  // Show circles for this document
  this._showCirclesForDocument(documentId);
  
  // Special handling for left panel to show all type-specific circles
  if (panelId === 'left') {
    // Show specific circle types (gem and triangle) in left panel
    this.circles.forEach(function(circle) {
      if (circle.circleType === 'gem' || circle.circleType === 'triangle') {
        this._notifyStateChanged('circles', circle);
      }
    }, this);
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

ChakraApp.AppState.prototype._inferCircleTypeFromDocument = function(document) {
  if (!document) return 'standard';
  
  // If document has a circleType property, use that
  if (document.circleType) {
    return document.circleType;
  }
  
  // Check if the document's panel ID matches any concept type
  if (ChakraApp.Config && ChakraApp.Config.conceptTypes) {
    for (var i = 0; i < ChakraApp.Config.conceptTypes.length; i++) {
      var conceptType = ChakraApp.Config.conceptTypes[i];
      if (document.panelId === conceptType.id) {
        return conceptType.shape || 'standard';
      }
    }
  }
  
  // Legacy support for specific panel IDs
  if (document.panelId === 'things') {
    return 'triangle';
  }
  
  // Default to standard circle
  return 'standard';
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

ChakraApp.AppState.prototype.addCircleReference = function(data) {
  var circleReference = new ChakraApp.CircleReference(data);
  this.circleReferences.push(circleReference);
  
  // Publish event
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_REFERENCE_CREATED, circleReference);
  
  // Save state
  this.saveToStorage();
  
  return circleReference;
};
  
  // Circle methods - explicitly defined and not generated
ChakraApp.AppState.prototype.addCircle = function(circleData) {
  var circle = circleData instanceof ChakraApp.Circle ? 
    circleData : new ChakraApp.Circle(circleData || {});

   if (circle.x === 0 && circle.y === 0) {
    circle.x = Math.floor(Math.random() * 81) + 20;  // Random X between 20 and 100
    circle.y = Math.floor(Math.random() * 81) + 100; // Random Y between 100 and 180
  }
  
  // Determine the circle type explicitly
  var circleType = circle.circleType || 'standard';
  
  // If no document ID is provided, assign one based on the circle type
  if (!circle.documentId) {
    // Get the appropriate selected document ID for this circle type
    var selectedDocId = null;
    
    // First check if there's a selected document for this circle type
    var docsForType = this.getDocumentsForCircleType(circleType);
    if (docsForType.length > 0) {
      // Find a selected document of this type
      docsForType.forEach(function(doc) {
        if (!selectedDocId && this.selectedDocumentIds[doc.circleType] === doc.id) {
          selectedDocId = doc.id;
        }
      }, this);
      
      // If no selected document of this type, use the first one
      if (!selectedDocId) {
        selectedDocId = docsForType[0].id;
        this.selectDocument(selectedDocId, docsForType[0].circleType);
      }
    } else {
      // No documents exist for this circle type, create one
      var newDoc = this.addDocument({
        name: circleType.charAt(0).toUpperCase() + circleType.slice(1) + " Document",
        circleType: circleType
      });
      
      selectedDocId = newDoc.id;
      this.selectDocument(selectedDocId, circleType);
    }
    
    // Assign the document ID to the circle
    circle.documentId = selectedDocId;
  }
  
  // Ensure circleType is set
  if (!circle.circleType) {
    var document = this.getDocument(circle.documentId);
    if (document) {
      circle.circleType = document.circleType || this._inferCircleTypeFromDocument(document);
    }
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

ChakraApp.AppState.prototype.addDocument = function(data) {
  var doc = data instanceof ChakraApp.Document ? 
    data : new ChakraApp.Document(data || {});
  
  // Ensure document has a circleType
  if (!doc.circleType) {
    doc.circleType = 'standard'; // Default to standard if not specified
  }
  
  this.documents.set(doc.id, doc);
  this._subscribeToEntityChanges('documents', doc);
  this._notifyAndPublishEntityCreation('documents', doc, 'DOCUMENT');
  this._saveStateIfNotLoading();
  
  return doc;
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
  var result = this._updateEntity('circles', id, changes);
  return result;
};
  
  // Add explicit getDocument method
  ChakraApp.AppState.prototype.getDocument = function(id) {
    return this.documents.get(id) || null;
  };

  // Add explicit getCircle method
  ChakraApp.AppState.prototype.getCircle = function(id) {
    return this.circles.get(id) || null;
  };

  ChakraApp.AppState.prototype.getCircleReference = function(id) {
  return this.circleReferences.find(function(ref) {
    return ref.id === id;
  }) || null;
};

  ChakraApp.AppState.prototype.getCircleReferencesForTab = function(tabId) {
  return this.circleReferences.filter(function(ref) {
    return ref.tabId === tabId;
  });
};

  ChakraApp.AppState.prototype.getCircleReferencesForSourceCircle = function(sourceCircleId) {
  return this.circleReferences.filter(function(ref) {
    return ref.sourceCircleId === sourceCircleId;
  });
};

  ChakraApp.AppState.prototype.updateCircleReference = function(id, changes) {
  var circleReference = this.getCircleReference(id);
  if (circleReference) {
    circleReference.update(changes);
    this.saveToStorage();
    return circleReference;
  }
  return null;
};

  ChakraApp.AppState.prototype.removeCircleReference = function(id) {
  var index = this.circleReferences.findIndex(function(ref) {
    return ref.id === id;
  });
  
  if (index !== -1) {
    var circleReference = this.circleReferences[index];
    
    // Deselect if this reference was selected
    if (this.selectedCircleReferenceId === id) {
      this.deselectCircleReference();
    }
    
    // Remove from array
    this.circleReferences.splice(index, 1);
    
    // Publish event
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_REFERENCE_DELETED, { id: id });
    
    // Save state
    this.saveToStorage();
    
    return true;
  }
  
  return false;
};

  ChakraApp.AppState.prototype.selectCircleReference = function(id) {
  // Deselect current selections
  this.deselectSquare();
  this.deselectCircleReference();
  
  var circleReference = this.getCircleReference(id);
  if (circleReference) {
    this.selectedCircleReferenceId = id;
    circleReference.select();
    return circleReference;
  }
  return null;
};

  ChakraApp.AppState.prototype.deselectCircleReference = function() {
  if (this.selectedCircleReferenceId) {
    var circleReference = this.getCircleReference(this.selectedCircleReferenceId);
    if (circleReference) {
      circleReference.deselect();
    }
    this.selectedCircleReferenceId = null;
  }
};

  ChakraApp.AppState.prototype.removeCircleReferencesForDeletedCircle = function(sourceCircleId) {
  var referencesToRemove = this.getCircleReferencesForSourceCircle(sourceCircleId);
  
  var self = this;
  referencesToRemove.forEach(function(ref) {
    self.removeCircleReference(ref.id);
  });
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
  
  // Get config values
  var maxLineLength = ChakraApp.Config.connections ? 
    ChakraApp.Config.connections.maxLineLength : 120;
  
  var boldMaxLineLength = ChakraApp.Config.connections ? 
    ChakraApp.Config.connections.boldMaxLineLength : 180;
  
  var effectiveMaxLength = (square1.isBold || square2.isBold) ? boldMaxLineLength : maxLineLength;
  
  var isVisible = distance <= effectiveMaxLength;
  
  if (!this.connections.has(connectionId)) {
    this.connections.set(connectionId, new ChakraApp.Connection({
      id: connectionId,
      sourceId: square1.id,
      targetId: square2.id,
      length: distance,
      isVisible: isVisible,
    }));
  } else {
    this.connections.get(connectionId).update({
      length: distance,
      isVisible: isVisible
    });
  }
  
  return this.connections.get(connectionId);
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
