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
  ChakraApp.AppState.prototype._deselectDocumentIfSelected = function(circleTypeId, documentId) {
  // Check both list1 and list2 for this document
  var selections = this.selectedDocumentIds[circleTypeId];
  if (selections && typeof selections === 'object') {
    if (selections.list1 === documentId) {
      this.deselectDocument(circleTypeId, 'list1');
    }
    if (selections.list2 === documentId) {
      this.deselectDocument(circleTypeId, 'list2');
    }
  }
  
  // Also update most recent selection tracking
  var recentSelection = this.mostRecentDocumentSelection[circleTypeId];
  if (recentSelection && recentSelection.docId === documentId) {
    // Check if there are any remaining selections
    var hasRemainingSelections = false;
    if (selections) {
      if (selections.list1 && selections.list1 !== documentId) {
        this.mostRecentDocumentSelection[circleTypeId] = {
          docId: selections.list1,
          listType: 'list1'
        };
        hasRemainingSelections = true;
      } else if (selections.list2 && selections.list2 !== documentId) {
        this.mostRecentDocumentSelection[circleTypeId] = {
          docId: selections.list2,
          listType: 'list2'
        };
        hasRemainingSelections = true;
      }
    }
    
    if (!hasRemainingSelections) {
      this.mostRecentDocumentSelection[circleTypeId] = null;
    }
    
    // Update visual indicators
    this._updateDocumentToggleButtonIndicators(circleTypeId);
  }
};
  
ChakraApp.AppState.prototype._handleLastViewedDocument = function(circleTypeId, documentId, listType) {
  var lastViewedId = this.getLastViewedDocument(circleTypeId, listType);
  
  if (lastViewedId === documentId) {
    this._updateLastViewedAfterRemoval(circleTypeId, listType);
  }
};
  
ChakraApp.AppState.prototype._updateLastViewedAfterRemoval = function(circleTypeId, listType) {
  var documentsForTypeAndList = this.getDocumentsForCircleTypeAndList(circleTypeId, listType);
  
  if (documentsForTypeAndList.length > 0) {
    this._selectNextDocumentAfterRemoval(circleTypeId, documentsForTypeAndList[0], listType);
  } else {
    // Remove the last viewed document key for this type and list
    var key = 'chakraLastViewedDocumentId_' + circleTypeId + '_' + listType;
    localStorage.removeItem(key);
  }
};
  
ChakraApp.AppState.prototype._selectNextDocumentAfterRemoval = function(circleTypeId, nextDocument, listType) {
  this.saveLastViewedDocument(nextDocument.id, circleTypeId, listType);
  
  var selections = this.selectedDocumentIds[circleTypeId];
  if (!selections || !selections[listType]) {
    this.selectDocument(nextDocument.id, circleTypeId, listType);
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
  

ChakraApp.AppState.prototype.selectDocument = function(id, circleTypeId, listType, panelId) {
  // Default to panel 0 for backward compatibility
  if (panelId === undefined) {
    panelId = 0;
  }
  
  // Use the enhanced panel-aware method
  return this.selectDocumentForPanel(id, circleTypeId, listType, panelId);
};

ChakraApp.AppState.prototype._updateDocumentToggleButtonIndicators = function(circleType) {
  var recentSelection = this.mostRecentDocumentSelection[circleType];
  
  // Get both toggle buttons for this circle type
  var toggleBtn1 = document.getElementById('toggle-document-list-btn-' + circleType);
  var toggleBtn2 = document.getElementById('toggle-document-list-btn2-' + circleType);
  
  if (toggleBtn1 && toggleBtn2) {
    // Remove active class from both
    toggleBtn1.classList.remove('most-recent-selection');
    toggleBtn2.classList.remove('most-recent-selection');
    
    // Add active class to the most recent one
    if (recentSelection) {
      if (recentSelection.listType === 'list1') {
        toggleBtn1.classList.add('most-recent-selection');
      } else if (recentSelection.listType === 'list2') {
        toggleBtn2.classList.add('most-recent-selection');
      }
    }
  }
};
  
  ChakraApp.AppState.prototype._deselectCircleIfSelected = function() {
    if (this.selectedCircleId) {
      this.deselectCircle();
    }
  };
  
ChakraApp.AppState.prototype.deselectDocument = function(circleTypeId, listType) {
  
  // If listType not specified, deselect from both lists
  if (!listType) {
    var deselected = false;
    if (this.selectedDocumentIds[circleTypeId]) {
      if (this.selectedDocumentIds[circleTypeId].list1) {
        deselected = this.deselectDocument(circleTypeId, 'list1') || deselected;
      }
      if (this.selectedDocumentIds[circleTypeId].list2) {
        deselected = this.deselectDocument(circleTypeId, 'list2') || deselected;
      }
    }
    return deselected;
  }
  
  // Find the selected document for the specific list
  var selectedDocId = this.selectedDocumentIds[circleTypeId] && this.selectedDocumentIds[circleTypeId][listType];
  var selectedDoc = selectedDocId ? this.documents.get(selectedDocId) : null;
  
  if (selectedDoc) {
    
    // Set selectedDocumentIds to null FIRST
    this.selectedDocumentIds[circleTypeId][listType] = null;
    
    // FIXED: Remove from ALL panel selections, not just one
    var self = this;
    var removedFromPanels = [];
    
    this.leftPanels.forEach(function(panel, panelId) {
      var panelSelections = self.getLeftPanelSelections(panelId);
      if (panelSelections[circleTypeId] && panelSelections[circleTypeId][listType] === selectedDocId) {
        panelSelections[circleTypeId][listType] = null;
        self.leftPanelSelections.set(panelId, panelSelections);
        removedFromPanels.push(panelId);
      }
    });
    
    // FIXED: Only deselect the document model if it's not selected anywhere else
    var stillSelectedSomewhere = this._isDocumentSelectedAnywhere(selectedDocId);
    
    if (!stillSelectedSomewhere) {
      selectedDoc.deselect();
      selectedDoc._selectedFromPanel = undefined;
      selectedDoc._selectedFromPanels = undefined;
    } else {
      // Update the _selectedFromPanels set to remove the deselected panels
      if (selectedDoc._selectedFromPanels) {
        removedFromPanels.forEach(function(panelId) {
          selectedDoc._selectedFromPanels.delete(panelId);
        });
      }
    }
    
    // Update most recent selection tracking
    var recentSelection = this.mostRecentDocumentSelection[circleTypeId];
    if (recentSelection && recentSelection.docId === selectedDocId && recentSelection.listType === listType) {
      // Check if there's still a selection in the other list
      var otherListType = listType === 'list1' ? 'list2' : 'list1';
      var otherSelection = this.selectedDocumentIds[circleTypeId][otherListType];
      
      if (otherSelection) {
        // Update to point to the other list's selection
        this.mostRecentDocumentSelection[circleTypeId] = {
          docId: otherSelection,
          listType: otherListType
        };
      } else {
        // No selections left, clear recent tracking
        this.mostRecentDocumentSelection[circleTypeId] = null;
      }
      
      // Update visual indicators
      this._updateDocumentToggleButtonIndicators(circleTypeId);
    }
    
    // Update circle visibility for this circle type
    this._showCirclesForBothSelectedDocuments(circleTypeId);
    
    // Publish the deselection event
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_DESELECTED, selectedDoc);
    
    return true;
  } else {
    // Make sure selectedDocumentIds is null anyway
    if (this.selectedDocumentIds[circleTypeId]) {
      this.selectedDocumentIds[circleTypeId][listType] = null;
    }
    return false;
  }
};

ChakraApp.AppState.prototype.cleanupSelectedDocumentIds = function() {
  // Create a clean state with only circle types
  var cleanState = {};
  
  // Copy only the valid circle type entries
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      var currentValue = this.selectedDocumentIds[typeId];
      
      // Handle both old and new formats
      if (typeof currentValue === 'object' && currentValue !== null) {
        // New format: preserve the object structure
        cleanState[typeId] = {
          list1: currentValue.list1 || null,
          list2: currentValue.list2 || null
        };
      } else {
        // Old format or null: migrate to new format
        cleanState[typeId] = {
          list1: currentValue || null,
          list2: null
        };
      }
    }, this);
  } else {
    // Fallback if config isn't available
    var defaultTypes = ['standard', 'triangle', 'gem', 'star', 'hexagon'];
    defaultTypes.forEach(function(typeId) {
      var currentValue = this.selectedDocumentIds[typeId];
      if (typeof currentValue === 'object' && currentValue !== null) {
        cleanState[typeId] = {
          list1: currentValue.list1 || null,
          list2: currentValue.list2 || null
        };
      } else {
        cleanState[typeId] = {
          list1: currentValue || null,
          list2: null
        };
      }
    }, this);
  }
  
  // Replace the entire object
  this.selectedDocumentIds = cleanState;
  
  // Save the cleaned state
  this.saveToStorageNow();
  
  return true;
};

ChakraApp.AppState.prototype._hideCirclesForDocument = function(documentId) {
  var circleCount = 0;
  var viewManager = ChakraApp.app && ChakraApp.app.viewManager;
  
  this.circles.forEach(function(circle) {
    if (circle.documentId === documentId) {
      
      // Method 1: Remove the circle view completely
      if (viewManager && viewManager.circleViews && viewManager.circleViews.has(circle.id)) {
        var circleView = viewManager.circleViews.get(circle.id);
        if (circleView && circleView.element && circleView.element.parentNode) {
          circleView.element.parentNode.removeChild(circleView.element);
        }
        // Remove from view manager
        viewManager.circleViews.delete(circle.id);
      }
      
      // Method 2: Also try direct DOM manipulation as backup
      var circleElement = document.querySelector('.circle[data-id="' + circle.id + '"]');
      if (circleElement) {
        circleElement.style.display = 'none';
      }
      
      circleCount++;
    }
  }, this);
  
};

ChakraApp.AppState.prototype.getDocumentsForCircleTypeAndList = function(circleTypeId, listType) {
  var docsForTypeAndList = [];
  
  this.documents.forEach(function(doc) {
    if (doc.circleType === circleTypeId && doc.listType === listType) {
      docsForTypeAndList.push(doc);
    }
  });
  
  return docsForTypeAndList;
};

// NEW: Enhanced addDocument to accept listType
ChakraApp.AppState.prototype.addDocument = function(data, listType) {
  var doc = data instanceof ChakraApp.Document ? 
    data : new ChakraApp.Document(data || {});
  
  // Ensure document has a circleType
  if (!doc.circleType) {
    doc.circleType = 'standard'; // Default to standard if not specified
  }
  
  // Set listType if provided
  if (listType) {
    doc.listType = listType;
  }
  
  this.documents.set(doc.id, doc);
  this._subscribeToEntityChanges('documents', doc);
  this._notifyAndPublishEntityCreation('documents', doc, 'DOCUMENT');
  this._saveStateIfNotLoading();
  
  return doc;
};

// NEW: Get documents for circle type, optionally filtered by list
ChakraApp.AppState.prototype.getDocumentsForCircleType = function(circleTypeId, listType) {
  var docsForType = [];
  
  this.documents.forEach(function(doc) {
    if (doc.circleType === circleTypeId) {
      // If listType is specified, filter by it; otherwise return all
      if (!listType || doc.listType === listType) {
        docsForType.push(doc);
      }
    }
  });
  
  return docsForType;
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
      if (otherTypeId === circleTypeId) return;
      
      if (this.documentListVisible[otherTypeId]) {
        this.documentListVisible[otherTypeId] = false;
        
        // Close BOTH first and second lists for other types
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._updateDocumentList(otherTypeId);
          ChakraApp.app.controllers.document._updateDocumentList2(otherTypeId);
        }
        
        // Update arrow icons for both buttons
        var toggleBtn = document.getElementById('toggle-document-list-btn-' + otherTypeId);
        if (toggleBtn) {
          var arrowIcon = toggleBtn.querySelector('.arrow-icon');
          if (arrowIcon) arrowIcon.innerHTML = '▼';
        }
        
        var toggleBtn2 = document.getElementById('toggle-document-list-btn2-' + otherTypeId);
        if (toggleBtn2) {
          var arrowIcon2 = toggleBtn2.querySelector('.arrow-icon');
          if (arrowIcon2) arrowIcon2.innerHTML = '▼';
        }
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
  
ChakraApp.AppState.prototype.saveLastViewedDocument = function(documentId, circleTypeId, listType) {
  if (documentId && circleTypeId && listType) {
    var key = 'chakraLastViewedDocumentId_' + circleTypeId + '_' + listType;
    localStorage.setItem(key, documentId);
  }
};

// Update getLastViewedDocument method to include listType
ChakraApp.AppState.prototype.getLastViewedDocument = function(circleTypeId, listType) {
  if (!listType) return null;
  var key = 'chakraLastViewedDocumentId_' + circleTypeId + '_' + listType;
  return localStorage.getItem(key);
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

ChakraApp.AppState.prototype._hideCirclesForCircleType = function(circleType) {
  var viewManager = ChakraApp.app && ChakraApp.app.viewManager;
  
  this.circles.forEach(function(circle) {
    if (circle.circleType === circleType) {
      // Method 1: Remove the circle view completely
      if (viewManager && viewManager.circleViews && viewManager.circleViews.has(circle.id)) {
        var circleView = viewManager.circleViews.get(circle.id);
        if (circleView && circleView.element && circleView.element.parentNode) {
          circleView.element.parentNode.removeChild(circleView.element);
        }
        // Remove from view manager
        viewManager.circleViews.delete(circle.id);
      }
      
      // Method 2: Also try direct DOM manipulation as backup
      var circleElement = document.querySelector('.circle[data-id="' + circle.id + '"]');
      if (circleElement) {
        circleElement.style.display = 'none';
      }
    }
  }, this);
};

ChakraApp.AppState.prototype._showCirclesForBothSelectedDocuments = function(circleType) {
  
  // Instead of hiding and showing, just trigger a view refresh
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    ChakraApp.app.viewManager.renderCirclesForPanel('left');
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
  
  // IMPORTANT: Update circle connections immediately after adding the reference
  this._updateCircleConnections();
  
  // Save state
  this.saveToStorage();
  
  return circleReference;
};
  
ChakraApp.AppState.prototype._createCircleConnection = function(sourceCircleId, targetCircleId) {
  // Use a unique ID for circle connections
  var connectionId = 'circle-' + sourceCircleId + '-to-' + targetCircleId;
  
  // Get the circles
  var sourceCircle = this.circles.get(sourceCircleId);
  var targetCircle = this.circles.get(targetCircleId);
  
  if (!sourceCircle || !targetCircle) {
    return null;
  }
  
  // Calculate distance for visual purposes
  var distance = ChakraApp.Utils.calculateDistance(
    sourceCircle.x, sourceCircle.y, targetCircle.x, targetCircle.y
  );
  
  if (!this.connections.has(connectionId)) {
    var connection = new ChakraApp.Connection({
      id: connectionId,
      sourceId: sourceCircleId,
      targetId: targetCircleId,
      length: distance,
      isVisible: true,
      connectionType: 'circle',
      isDirectional: true
    });
    
    this.connections.set(connectionId, connection);
    return connection;
  } else {
    var existingConnection = this.connections.get(connectionId);
    existingConnection.update({
      length: distance,
      isVisible: true,
      connectionType: 'circle',
      isDirectional: true
    });
    return existingConnection;
  }
};

ChakraApp.AppState.prototype._updateCircleConnections = function() {
  
  // Clear existing circle connections
  var connectionsToRemove = [];
  this.connections.forEach(function(conn, connId) {
    if (conn.connectionType === 'circle') {
      connectionsToRemove.push(connId);
    }
  });
  
  var self = this;
  connectionsToRemove.forEach(function(connId) {
    self.connections.delete(connId);
  });
  
  // Create new circle connections based on circle references
  this.circleReferences.forEach(function(circleRef) {
    
    // Get the tab this reference belongs to
    var tab = self.getTab(circleRef.tabId);
    if (!tab) {
      return;
    }
    
    
    // Get the circle that owns this tab
    var ownerCircle = self.getCircle(tab.circleId);
    if (!ownerCircle) {
      return;
    }
    
    
    // Get the referenced circle
    var referencedCircle = self.getCircle(circleRef.sourceCircleId);
    if (!referencedCircle) {
      return;
    }
    
    
    // Create connection from owner circle to referenced circle
    var connection = self._createCircleConnection(ownerCircle.id, circleRef.sourceCircleId);
    if (connection) {
    } else {
    }
  });
  
  var circleConnections = 0;
  this.connections.forEach(function(conn) {
    if (conn.connectionType === 'circle') {
      circleConnections++;
    }
  });
  
  // Publish update event
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, 'circles');
  this._saveStateIfNotLoading();
};

  // Circle methods - explicitly defined and not generated
ChakraApp.AppState.prototype.addCircle = function(circleData) {
  var circle = circleData instanceof ChakraApp.Circle ? 
    circleData : new ChakraApp.Circle(circleData || {});

  if (circle.x === 0 && circle.y === 0) {
    circle.x = Math.floor(Math.random() * 81) + 20;
    circle.y = Math.floor(Math.random() * 81) + 100;
  }
  
  // Determine the circle type explicitly
  var circleType = circle.circleType || 'standard';
  
  // If no document ID is provided, assign one based on the circle type
  if (!circle.documentId) {
    var selectedDocId = null;
    
    // Use the most recently selected document for this circle type
    var recentSelection = this.mostRecentDocumentSelection[circleType];
    
    if (recentSelection && recentSelection.docId) {
      // Verify the document still exists and is still selected
      var recentDoc = this.getDocument(recentSelection.docId);
      
      // Check selection in the specific panel where it was selected
      var panelId = recentSelection.panelId || 0;
      var panelSelections = this.getLeftPanelSelections(panelId);
      var currentSelection = panelSelections[circleType] && 
                           panelSelections[circleType][recentSelection.listType];
      
      if (recentDoc && currentSelection === recentSelection.docId) {
        selectedDocId = recentSelection.docId;
        circle.documentId = selectedDocId;
        
        // Track that this circle's document came from the specific panel
        recentDoc._selectedFromPanel = panelId;
      }
    }
    
    // Only create a new document if no valid recent selection was found
    if (!circle.documentId) {
      var targetPanelId = (recentSelection && recentSelection.panelId !== undefined) ? recentSelection.panelId : 0;
      
      // Always create a new document instead of using existing ones
      var circleTypeConfig = null;
      if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
        circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
          return type.id === circleType;
        });
      }
      
      var docName = ChakraApp.appState.generateDateBasedDocumentName(circleType, 'list1');
      
      // Create new document in List A by default
      var newDoc = this.addDocument({
        name: docName,
        circleType: circleType,
        listType: 'list1'
      });
      
      selectedDocId = newDoc.id;
      
      // Select this new document in the target panel
      this.selectDocumentForPanel(selectedDocId, circleType, 'list1', targetPanelId);
      circle.documentId = selectedDocId;
    }
  }
  
  // Ensure circleType is set
  if (!circle.circleType) {
    var document = this.getDocument(circle.documentId);
    if (document) {
      circle.circleType = document.circleType || this._inferCircleTypeFromDocument(document);
    }
  }
  
  // NEW: Ensure colors array is properly initialized
  if (!circle.colors || !Array.isArray(circle.colors)) {
    if (circle.color) {
      circle.colors = [circle.color];
    } else {
      circle.colors = ['#C0C0C0'];
      circle.color = '#C0C0C0';
    }
  }
  
  this.circles.set(circle.id, circle);
  this._subscribeToEntityChanges('circles', circle);
  this._notifyAndPublishEntityCreation('circles', circle, 'CIRCLE');
  this._saveStateIfNotLoading();
  
  // Force immediate view update for all panels that might show this circle
  setTimeout(function() {
    if (ChakraApp.app && ChakraApp.app.viewManager) {
      // Check which panels have this circle's document selected and refresh those panels
      if (ChakraApp.appState.leftPanels) {
        ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
          var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
          var typeSelections = panelSelections[circleType];
          
          if (typeSelections && 
              (typeSelections.list1 === circle.documentId || typeSelections.list2 === circle.documentId)) {
            ChakraApp.app.viewManager.renderCirclesForLeftPanel(panelId);
          }
        });
      } else {
        // Fallback to old system
        ChakraApp.app.viewManager.renderCirclesForPanel('left');
      }
    }
  }, 50);
  
  return circle;
};

ChakraApp.AppState.prototype._migrateSelectedDocumentIds = function() {
  var migrationApplied = false;
  
  // Initialize mostRecentDocumentSelection if it doesn't exist
  if (!this.mostRecentDocumentSelection) {
    this.mostRecentDocumentSelection = {};
    migrationApplied = true;
  }
  
  // Check if we have the old format (direct ID values instead of objects)
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      var currentValue = this.selectedDocumentIds[typeId];
      
      // Initialize recent selection tracking for this type if missing
      if (!this.mostRecentDocumentSelection.hasOwnProperty(typeId)) {
        this.mostRecentDocumentSelection[typeId] = null;
        migrationApplied = true;
      }
      
      // If it's a string ID instead of an object, migrate it
      if (typeof currentValue === 'string' || currentValue === null) {
        this.selectedDocumentIds[typeId] = {
          list1: currentValue, // Put existing selection in list1
          list2: null          // Initialize list2 as empty
        };
        
        // Set as most recent if there was a selection
        if (currentValue) {
          this.mostRecentDocumentSelection[typeId] = {
            docId: currentValue,
            listType: 'list1'
          };
        }
        
        migrationApplied = true;
      }
      // If the object exists but is missing properties, fix it
      else if (currentValue && typeof currentValue === 'object') {
        if (!currentValue.hasOwnProperty('list1')) {
          currentValue.list1 = null;
          migrationApplied = true;
        }
        if (!currentValue.hasOwnProperty('list2')) {
          currentValue.list2 = null;
          migrationApplied = true;
        }
        
        // CHANGED: Always prefer list1 as most recent selection when loading
        if (!this.mostRecentDocumentSelection[typeId]) {
          // Priority order: list1 first, then list2 as fallback
          if (currentValue.list1) {
            this.mostRecentDocumentSelection[typeId] = {
              docId: currentValue.list1,
              listType: 'list1'
            };
            migrationApplied = true;
          } else if (currentValue.list2) {
            this.mostRecentDocumentSelection[typeId] = {
              docId: currentValue.list2,
              listType: 'list2'
            };
            migrationApplied = true;
          }
        }
      }
    }, this);
  }
  
  if (migrationApplied) {
    this.saveToStorageNow();
  }
  
  return migrationApplied;
};

// ALTERNATIVE SOLUTION: Add a method to explicitly set list1 as default
// Add this new method to AppStateEntities.js:

ChakraApp.AppState.prototype.setList1AsDefaultMostRecent = function() {
  var changed = false;
  
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      var selections = this.selectedDocumentIds[typeId];
      
      if (selections && typeof selections === 'object') {
        // If we have both selections, prefer list1
        if (selections.list1 && selections.list2) {
          this.mostRecentDocumentSelection[typeId] = {
            docId: selections.list1,
            listType: 'list1'
          };
          changed = true;
        }
        // If we only have list1, make it the most recent
        else if (selections.list1 && !selections.list2) {
          this.mostRecentDocumentSelection[typeId] = {
            docId: selections.list1,
            listType: 'list1'
          };
          changed = true;
        }
        // If we only have list2, keep it (no list1 available)
        else if (!selections.list1 && selections.list2) {
          this.mostRecentDocumentSelection[typeId] = {
            docId: selections.list2,
            listType: 'list2'
          };
          changed = true;
        }
        // If neither, clear it
        else {
          this.mostRecentDocumentSelection[typeId] = null;
          changed = true;
        }
      }
    }, this);
  }
  
  if (changed) {
    // Update visual indicators for all circle types
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        this._updateDocumentToggleButtonIndicators(circleType.id);
      }, this);
    }
    
    this.saveToStorageNow();
  }
  
  return changed;
};

// IMPLEMENTATION: Call the method during app loading
// In AppStateEntities.js, update the _selectSavedDocuments method:

ChakraApp.AppState.prototype._selectSavedDocuments = function() {
  var self = this;
  
  // Ensure migration has happened first
  this._migrateSelectedDocumentIds();
  
  // FIXED: Only restore selections that are actually saved in panel-specific state
  // Don't automatically select documents in panels that had no selections
  
  if (this.leftPanels && this.leftPanels.size > 0) {
    // Use panel-specific selections if they exist
    this.leftPanels.forEach(function(panel, panelId) {
      var panelSelections = self.getLeftPanelSelections(panelId);
      
      Object.keys(panelSelections).forEach(function(circleTypeId) {
        var typeSelections = panelSelections[circleTypeId];
        
        if (typeSelections) {
          // Only select documents that were explicitly saved for this panel
          if (typeSelections.list1) {
            var doc1 = self.documents.get(typeSelections.list1);
            if (doc1) {
              self.selectDocumentForPanel(typeSelections.list1, circleTypeId, 'list1', panelId);
            } else {
              // Document doesn't exist anymore, clear selection
              typeSelections.list1 = null;
            }
          }
          
          if (typeSelections.list2) {
            var doc2 = self.documents.get(typeSelections.list2);
            if (doc2) {
              self.selectDocumentForPanel(typeSelections.list2, circleTypeId, 'list2', panelId);
            } else {
              // Document doesn't exist anymore, clear selection
              typeSelections.list2 = null;
            }
          }
        }
      });
      
      // Update visual indicators for this panel after restoring selections
      Object.keys(panelSelections).forEach(function(circleTypeId) {
        self._updateDocumentToggleButtonIndicators(circleTypeId);
      });
    });
  } else {
    // Fallback: if no panel system, use the old global method but only for existing selections
    Object.keys(this.selectedDocumentIds).forEach(function(circleTypeId) {
      var selections = self.selectedDocumentIds[circleTypeId];
      
      // Handle both old and new formats, but only if selections actually exist
      if (typeof selections === 'object' && selections !== null) {
        // Only restore selections that have actual document IDs
        if (selections.list1) {
          var doc1 = self.documents.get(selections.list1);
          if (doc1) {
            self.selectDocument(selections.list1, circleTypeId, 'list1');
          } else {
            selections.list1 = null;
          }
        }
        
        if (selections.list2) {
          var doc2 = self.documents.get(selections.list2);
          if (doc2) {
            self.selectDocument(selections.list2, circleTypeId, 'list2');
          } else {
            selections.list2 = null;
          }
        }
        
        // Update visual indicators after restoring selections
        self._updateDocumentToggleButtonIndicators(circleTypeId);
      }
    });
  }
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
    // FIXED: Ensure circle deselection is handled properly
    if (ChakraApp.app.controllers && ChakraApp.app.controllers.tab && ChakraApp.app.controllers.tab._handleCircleDeselected) {
      ChakraApp.app.controllers.tab._handleCircleDeselected(circle);
    }
  }
  
  this.selectedCircleId = null;
  
  // FIXED: Trigger proper deselection handling
  this._handleCircleDeselection();
  
  // FIXED: Publish proper deselection event
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DESELECTED, null);
  
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
    
    // Clear and update connections
    this.connections.clear();
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    this._updateConnectionsForCircleId(circleId);
    this._updateCircleConnections();
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
    
    this._updateCircleConnections();
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
  var circle = this.circles.get(id);
  if (!circle) return null;
  
  // NEW: Handle color array updates
  if (changes.colors && Array.isArray(changes.colors)) {
    // Update both colors array and primary color
    circle.colors = changes.colors.slice(); // Copy array
    circle.color = changes.colors[0] || '#C0C0C0'; // First color becomes primary
  } else if (changes.color && !changes.colors) {
    // If only color is provided (legacy), convert to colors array
    circle.colors = [changes.color];
    circle.color = changes.color;
  }
  
  // Update other properties
  for (var key in changes) {
    if (key !== 'colors' && circle.hasOwnProperty(key)) {
      circle[key] = changes[key];
    }
  }
  
  // Notify that the circle was updated
  circle.notify({ type: 'update', changes: changes });
  
  this._saveStateIfNotLoading();
  
  return circle;
};

// Addition to AppStateEntities.js for circle reference updates
// This method should be added to the existing AppStateEntities.js file

ChakraApp.AppState.prototype.updateCircleReference = function(id, changes) {
  var circleReference = this.getCircleReference(id);
  if (circleReference) {
    // Update the model properties
    for (var key in changes) {
      if (changes.hasOwnProperty(key)) {
        circleReference[key] = changes[key];
      }
    }
    
    // Update the updatedAt timestamp
    circleReference.updatedAt = new Date();
    
    // Trigger model update notification (this will notify view models)
    circleReference._notify({ type: 'update', model: circleReference });
    
    // Publish update event for any other listeners
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_REFERENCE_UPDATED, circleReference);
    
    // Save state
    this.saveToStorage();
    
    return circleReference;
  }
  return null;
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

    this._updateCircleConnections();
    
    return true;
  }

  this._updateCircleConnections();
  
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
  // If MultiSelectionManager is available, use it instead
  if (ChakraApp.MultiSelectionManager) {
    return ChakraApp.MultiSelectionManager.selectSingle(id);
  }
  
  // Fallback to old system
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
  // If MultiSelectionManager is available, use it
  if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
    ChakraApp.MultiSelectionManager.clearSelection();
    // Clear the old system too for compatibility
    this.selectedSquareId = null;
    return true;
  }
  
  // Fallback to old system
  if (!this.selectedSquareId) return false;
  
  var square = this.squares.get(this.selectedSquareId);
  if (square) {
    square.deselect();
  }
  
  this.selectedSquareId = null;
  
  return true;
};

ChakraApp.AppState.prototype.hasSquareSelected = function() {
  // Use MultiSelectionManager if available
  if (ChakraApp.MultiSelectionManager) {
    return ChakraApp.MultiSelectionManager.hasSquareSelected();
  }
  
  // Fallback to old system
  return !!this.selectedSquareId;
};

ChakraApp.AppState.prototype.getPrimarySelectedSquareId = function() {
  // Use MultiSelectionManager if available
  if (ChakraApp.MultiSelectionManager) {
    return ChakraApp.MultiSelectionManager.getPrimarySquareId();
  }
  
  // Fallback to old system
  return this.selectedSquareId;
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
    
    // FIXED: Immediately filter squares when tab is selected
    this._filterSquaresByTabImmediate(id);
    
    return tab;
};

ChakraApp.AppState.prototype._filterSquaresByTabImmediate = function(tabId) {
    var viewManager = ChakraApp.app && ChakraApp.app.viewManager;
    
    // Hide all squares first
    this.squares.forEach(function(square) {
        if (square.circleId === this.selectedCircleId) {
            square.hide();
            
            // Hide view immediately
            if (viewManager && viewManager.squareViews.has(square.id)) {
                var squareView = viewManager.squareViews.get(square.id);
                if (squareView && squareView.element) {
                    squareView.element.style.display = 'none';
                }
            }
        }
    }, this);
    
    // Show only squares for the selected tab
    this.squares.forEach(function(square) {
        if (square.tabId === tabId && square.circleId === this.selectedCircleId) {
            square.show();
            
            // Show view immediately or create if needed
            if (viewManager) {
                if (!viewManager.squareViews.has(square.id)) {
                    viewManager.createSquareView(square);
                } else {
                    var squareView = viewManager.squareViews.get(square.id);
                    if (squareView && squareView.element) {
                        squareView.element.style.display = 'flex';
                        if (typeof squareView.update === 'function') {
                            squareView.update();
                        }
                    }
                }
            }
        }
    }, this);
    
    // Update connections for the currently visible squares
    this._updateConnectionsForCircleId(this.selectedCircleId);
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
    
    this.squares.forEach(square => {
      if (square.tabId === tabId && square.circleId === this.selectedCircleId) {
        square.show();
      }
    });
    
    this._updateConnectionsForCircleId(this.selectedCircleId);
  };
  
  // Generate entity methods on the prototype
  ChakraApp.AppState.prototype._generateEntityMethods();
  
})(window.ChakraApp = window.ChakraApp || {});
