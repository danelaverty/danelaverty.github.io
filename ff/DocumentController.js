// Enhanced DocumentController.js - FIXED VERSION
(function(ChakraApp) {
  /**
   * Document controller - manages document lists and operations
   */
  ChakraApp.DocumentController = function() {
    ChakraApp.BaseController.call(this);
    
    // Existing properties from your current controller
    this.toggleDocumentListBtns = {};
    this.documentListContainers = {};
    this.toggleDocumentListBtns2 = {};
    this.documentListContainers2 = {};
    this.currentDocumentDisplays = {};
    this.documentClickHandler = null;
    this.eventSubscriptions = {};
    this._lastClickedButton = null;
    
    // NEW: Search-related properties
    this.newDocumentBtns = {};
    this.documentSearchBoxes = {};
    this.documentSearchTimers = {};
    this.panelDocumentListVisible = {};
  };
  
  // Inherit from BaseController
  ChakraApp.DocumentController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.DocumentController.prototype.constructor = ChakraApp.DocumentController;
  
  ChakraApp.DocumentController.prototype.init = function() {
	  ChakraApp.BaseController.prototype.init.call(this);
  
  this._initializePanelVisibility();
  this._setupInitializationStrategy();
  this._setupDocumentEventListeners();
  this._setupClickOutsideHandler();
  this._addDocumentListStyles();
};

ChakraApp.DocumentController.prototype._createDeselectListItem = function(circleTypeId, listType) {
    var self = this;
    listType = listType || 'list1';
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item deselect-item';
    listItem.dataset.circleTypeId = circleTypeId;
    listItem.dataset.listType = listType;
    
    // Apply deselect item styling
    listItem.style.display = 'block';
    listItem.style.padding = '3px 5px';
    listItem.style.marginBottom = '8px';
    listItem.style.backgroundColor = '#666';
    listItem.style.color = '#DDD';
    listItem.style.border = '1px dashed #999';
    listItem.style.borderRadius = '4px';
    listItem.style.cursor = 'pointer';
    listItem.style.fontSize = '12px';
    listItem.style.transition = 'background-color 0.2s';
    
    // Add icon
    var icon = document.createElement('span');
    icon.className = 'deselect-icon';
    icon.innerHTML = '✖️';
    icon.style.marginRight = '8px';
    listItem.appendChild(icon);
    
    // Add text with list indicator
    var name = document.createElement('span');
    name.className = 'deselect-name';
    name.textContent = 'Deselect (' + (listType === 'list1' ? 'A' : 'B') + ')';
    listItem.appendChild(name);
    
    // Hover effect
    listItem.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#777';
    });
    listItem.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '#666';
    });
    
    // Click handler for deselection
    listItem.addEventListener('click', function(e) {
      e.stopPropagation();
      
      
      // Determine which panel this document list belongs to
      var panelId = self._determinePanelForDocumentSelection(e.target, circleTypeId);
      
      // FIXED: Deselect only from this specific panel, not globally
      var wasDeselected = self._deselectDocumentFromSpecificPanel(circleTypeId, listType, panelId);
      
      if (wasDeselected) {
        
        // Update document lists only for this panel
        self._updateDocumentListForPanel(circleTypeId, panelId, 'list1');
        self._updateDocumentListForPanel(circleTypeId, panelId, 'list2');
        
        // Update current document display
        self._updateCurrentDocumentDisplay(circleTypeId);
        
        // Show visual feedback
        var currentDocDisplay = self.currentDocumentDisplays[circleTypeId];
        if (currentDocDisplay) {
          currentDocDisplay.classList.add('flash-deselect');
          setTimeout(function() {
            currentDocDisplay.classList.remove('flash-deselect');
          }, 1000);
        }
        
        // Update visual indicators only if this affects the global selection
        ChakraApp.appState._updateDocumentToggleButtonIndicators(circleTypeId);
        
        // Trigger view updates only for the affected panel
        if (ChakraApp.app && ChakraApp.app.viewManager) {
          ChakraApp.app.viewManager.renderCirclesForLeftPanel(panelId);
        }
      } else {
      }
    });
    
    return listItem;
  };

ChakraApp.DocumentController.prototype._deselectDocumentFromSpecificPanel = function(circleTypeId, listType, panelId) {
    
    // Get the panel's current selections
    var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
    if (!panelSelections[circleTypeId] || !panelSelections[circleTypeId][listType]) {
      return false;
    }
    
    var selectedDocId = panelSelections[circleTypeId][listType];
    var selectedDoc = ChakraApp.appState.getDocument(selectedDocId);
    
    if (!selectedDoc) {
      return false;
    }
    
    
    // Clear the selection for this specific panel and list type
    panelSelections[circleTypeId][listType] = null;
    ChakraApp.appState.leftPanelSelections.set(panelId, panelSelections);
    
    // Update the document's panel tracking
    if (selectedDoc._selectedFromPanels) {
      selectedDoc._selectedFromPanels.delete(panelId);
    }
    
    // Only fully deselect the document if it's not selected in any other panels
    var stillSelectedSomewhere = ChakraApp.appState._isDocumentSelectedAnywhere(selectedDocId);
    
    if (!stillSelectedSomewhere) {
      selectedDoc.deselect();
      selectedDoc._selectedFromPanel = undefined;
      selectedDoc._selectedFromPanels = undefined;
      
      // Also clear from global selectedDocumentIds for backward compatibility
      if (ChakraApp.appState.selectedDocumentIds[circleTypeId]) {
        if (ChakraApp.appState.selectedDocumentIds[circleTypeId][listType] === selectedDocId) {
          ChakraApp.appState.selectedDocumentIds[circleTypeId][listType] = null;
        }
      }
    } else {
    }
    
    // Update most recent selection tracking if this was the most recent
    var recentSelection = ChakraApp.appState.mostRecentDocumentSelection[circleTypeId];
    if (recentSelection && recentSelection.docId === selectedDocId && 
        recentSelection.listType === listType && recentSelection.panelId === panelId) {
      
      // Try to find another selection to make most recent
      var foundAlternative = false;
      
      // Check all panels for other selections of this circle type
      ChakraApp.appState.leftPanels.forEach(function(panel, otherPanelId) {
        if (foundAlternative) return;
        
        var otherPanelSelections = ChakraApp.appState.getLeftPanelSelections(otherPanelId);
        if (otherPanelSelections[circleTypeId]) {
          if (otherPanelSelections[circleTypeId].list1) {
            ChakraApp.appState.mostRecentDocumentSelection[circleTypeId] = {
              docId: otherPanelSelections[circleTypeId].list1,
              listType: 'list1',
              panelId: otherPanelId
            };
            foundAlternative = true;
          } else if (otherPanelSelections[circleTypeId].list2) {
            ChakraApp.appState.mostRecentDocumentSelection[circleTypeId] = {
              docId: otherPanelSelections[circleTypeId].list2,
              listType: 'list2',
              panelId: otherPanelId
            };
            foundAlternative = true;
          }
        }
      });
      
      if (!foundAlternative) {
        ChakraApp.appState.mostRecentDocumentSelection[circleTypeId] = null;
      }
    }
    
    // Publish panel-specific document deselection event
    ChakraApp.EventBus.publish('LEFT_PANEL_DOCUMENT_DESELECTED', {
      panelId: panelId,
      documentId: selectedDocId,
      circleTypeId: circleTypeId,
      listType: listType
    });
    
    // Save state
    ChakraApp.appState.saveToStorage();
    
    return true;
  };

ChakraApp.DocumentController.prototype._isDocumentSelectedInPanel = function(circleTypeId, listType, panelId) {
    var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
    return !!(panelSelections[circleTypeId] && panelSelections[circleTypeId][listType]);
  };

 ChakraApp.DocumentController.prototype._isDocumentSelectedForCircleType = function(circleTypeId, listType, panelId) {
    // If panelId is provided, check panel-specific selection
    if (panelId !== undefined) {
      return this._isDocumentSelectedInPanel(circleTypeId, listType, panelId);
    }
    
    // Otherwise, check global selections (backward compatibility)
    var selections = ChakraApp.appState.selectedDocumentIds[circleTypeId];
    if (!selections || typeof selections !== 'object') {
      return false;
    }
    
    if (listType) {
      return !!selections[listType];
    } else {
      // Check if any list type has a selection
      return !!(selections.list1 || selections.list2);
    }
  };

ChakraApp.DocumentController.prototype._deselectDocumentFromSpecificPanel = function(circleTypeId, listType, panelId) {
    
    // Get the panel's current selections
    var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
    if (!panelSelections[circleTypeId] || !panelSelections[circleTypeId][listType]) {
      return false;
    }
    
    var selectedDocId = panelSelections[circleTypeId][listType];
    var selectedDoc = ChakraApp.appState.getDocument(selectedDocId);
    
    if (!selectedDoc) {
      return false;
    }
    
    
    // Clear the selection for this specific panel and list type
    panelSelections[circleTypeId][listType] = null;
    ChakraApp.appState.leftPanelSelections.set(panelId, panelSelections);
    
    // Update the document's panel tracking
    if (selectedDoc._selectedFromPanels) {
      selectedDoc._selectedFromPanels.delete(panelId);
    }
    
    // Only fully deselect the document if it's not selected in any other panels
    var stillSelectedSomewhere = ChakraApp.appState._isDocumentSelectedAnywhere(selectedDocId);
    
    if (!stillSelectedSomewhere) {
      selectedDoc.deselect();
      selectedDoc._selectedFromPanel = undefined;
      selectedDoc._selectedFromPanels = undefined;
      
      // Also clear from global selectedDocumentIds for backward compatibility
      if (ChakraApp.appState.selectedDocumentIds[circleTypeId]) {
        if (ChakraApp.appState.selectedDocumentIds[circleTypeId][listType] === selectedDocId) {
          ChakraApp.appState.selectedDocumentIds[circleTypeId][listType] = null;
        }
      }
    } else {
    }
    
    // Update most recent selection tracking if this was the most recent
    var recentSelection = ChakraApp.appState.mostRecentDocumentSelection[circleTypeId];
    if (recentSelection && recentSelection.docId === selectedDocId && 
        recentSelection.listType === listType && recentSelection.panelId === panelId) {
      
      // Try to find another selection to make most recent
      var foundAlternative = false;
      
      // Check all panels for other selections of this circle type
      ChakraApp.appState.leftPanels.forEach(function(panel, otherPanelId) {
        if (foundAlternative) return;
        
        var otherPanelSelections = ChakraApp.appState.getLeftPanelSelections(otherPanelId);
        if (otherPanelSelections[circleTypeId]) {
          if (otherPanelSelections[circleTypeId].list1) {
            ChakraApp.appState.mostRecentDocumentSelection[circleTypeId] = {
              docId: otherPanelSelections[circleTypeId].list1,
              listType: 'list1',
              panelId: otherPanelId
            };
            foundAlternative = true;
          } else if (otherPanelSelections[circleTypeId].list2) {
            ChakraApp.appState.mostRecentDocumentSelection[circleTypeId] = {
              docId: otherPanelSelections[circleTypeId].list2,
              listType: 'list2',
              panelId: otherPanelId
            };
            foundAlternative = true;
          }
        }
      });
      
      if (!foundAlternative) {
        ChakraApp.appState.mostRecentDocumentSelection[circleTypeId] = null;
      }
    }
    
    // Publish panel-specific document deselection event
    ChakraApp.EventBus.publish('LEFT_PANEL_DOCUMENT_DESELECTED', {
      panelId: panelId,
      documentId: selectedDocId,
      circleTypeId: circleTypeId,
      listType: listType
    });
    
    // Save state
    ChakraApp.appState.saveToStorage();
    
    return true;
  };


ChakraApp.DocumentController.prototype._setupInitializationStrategy = function() {
  var self = this;
  
  var hasLeftPanels = ChakraApp.appState.leftPanels && ChakraApp.appState.leftPanels.size > 0;
  var leftPanelExists = document.getElementById('left-panel-0') || 
                       document.querySelector('.left-panel[data-panel-index="0"]');
  
  if (hasLeftPanels && leftPanelExists) {
    this._completeInitialization();
  } else {
    this._waitForPanelsToBeCreated();
  }
};

ChakraApp.DocumentController.prototype._waitForPanelsToBeCreated = function() {
  var self = this;
  
  this.eventSubscriptions.leftPanelAdded = ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
    
    // Initialize when the first panel is created (any panel, not just panel 0)
    self._completeInitialization();
    
    // Unsubscribe since we only need this once
    if (self.eventSubscriptions.leftPanelAdded) {
      self.eventSubscriptions.leftPanelAdded();
      delete self.eventSubscriptions.leftPanelAdded;
    }
  });
};


// Add this new method:
ChakraApp.DocumentController.prototype._completeInitialization = function() {
  this._createDocumentControls();
  
  // Initialize document lists for each circle type
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._updateDocumentList(circleType.id);
    self._updateCurrentDocumentDisplay(circleType.id);
  });
};

  ChakraApp.DocumentController.prototype._initializePanelVisibility = function() {
  var self = this;
  
  // Initialize for existing panels
  if (ChakraApp.appState.leftPanels) {
    ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
      self._initializePanelVisibilityForPanel(panelId);
    });
  } else {
    // Fallback for panel 0
    self._initializePanelVisibilityForPanel(0);
  }
};

ChakraApp.DocumentController.prototype._initializePanelVisibilityForPanel = function(panelId) {
  if (!this.panelDocumentListVisible[panelId]) {
    this.panelDocumentListVisible[panelId] = {};
  }
  
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    if (!self.panelDocumentListVisible[panelId][circleType.id]) {
      self.panelDocumentListVisible[panelId][circleType.id] = {
        list1: false,
        list2: false
      };
    }
  });
};

// NEW: Close document lists in other panels but not the current one
ChakraApp.DocumentController.prototype._closeDocumentListsInOtherPanels = function(currentPanelId, currentCircleTypeId) {
  var self = this;
  
  // Close lists in other panels
  Object.keys(this.panelDocumentListVisible).forEach(function(panelId) {
    var panelIdNum = parseInt(panelId);
    
    // Skip the current panel
    if (panelIdNum === currentPanelId) return;
    
    // Close all lists in this other panel
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      
      if (self.panelDocumentListVisible[panelId][typeId]) {
        self.panelDocumentListVisible[panelId][typeId].list1 = false;
        self.panelDocumentListVisible[panelId][typeId].list2 = false;
        
        // Update the UI for this other panel
        self._updateDocumentListForPanel(typeId, panelIdNum, 'list1');
        self._updateDocumentListForPanel(typeId, panelIdNum, 'list2');
      }
    });
  });
  
  // Also close lists for other circle types in the current panel
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    var typeId = circleType.id;
    
    // Skip the current circle type
    if (typeId === currentCircleTypeId) return;
    
    if (self.panelDocumentListVisible[currentPanelId][typeId]) {
      self.panelDocumentListVisible[currentPanelId][typeId].list1 = false;
      self.panelDocumentListVisible[currentPanelId][typeId].list2 = false;
      
      // Update the UI for other circle types in current panel
      self._updateDocumentListForPanel(typeId, currentPanelId, 'list1');
      self._updateDocumentListForPanel(typeId, currentPanelId, 'list2');
    }
  });
};
  
ChakraApp.DocumentController.prototype.toggleDocumentListForPanel = function(circleTypeId, listType, panelId) {
  
  // FIXED: Ensure panel visibility tracking exists
  if (!this.panelDocumentListVisible[panelId]) {
    this._initializePanelVisibilityForPanel(panelId);
  }
  
  // FIXED: Ensure document containers exist for this panel
  if (!this.documentListContainers[circleTypeId] || !this.documentListContainers[circleTypeId][panelId] ||
      !this.documentListContainers2[circleTypeId] || !this.documentListContainers2[circleTypeId][panelId]) {
    this._createDocumentControlsForSpecificPanel(circleTypeId, panelId);
  }
  
  // Close any template lists first
  this._closeAllTemplateLists();
  
  // FIXED: Only close document lists in OTHER panels, not this one
  this._closeDocumentListsInOtherPanels(panelId, circleTypeId);
  
  // Set the last clicked button to track which list was clicked
  this._lastClickedButton = (listType === 'list1' ? 'btn1' : 'btn2') + '-' + circleTypeId + '-panel-' + panelId;
  
  // Toggle the document list visibility for THIS SPECIFIC PANEL
  var currentVisibility = this.panelDocumentListVisible[panelId][circleTypeId][listType];
  this.panelDocumentListVisible[panelId][circleTypeId][listType] = !currentVisibility;
  var isVisible = this.panelDocumentListVisible[panelId][circleTypeId][listType];
  
  
  // If opening this list, close the other list type in the same panel
  if (isVisible) {
    var otherListType = listType === 'list1' ? 'list2' : 'list1';
    this.panelDocumentListVisible[panelId][circleTypeId][otherListType] = false;
  }
  
  // Update both document lists for this panel and circle type
  this._updateDocumentListForPanel(circleTypeId, panelId, 'list1');
  this._updateDocumentListForPanel(circleTypeId, panelId, 'list2');
  
  // FIXED: Look for panel-specific button IDs that match the UIController button creation
  var buttonId = 'toggle-document-list-btn-' + listType + '-' + circleTypeId + '-panel-' + panelId;
  
  var toggleBtn = document.getElementById(buttonId);
  
  // If panel-specific button not found, try the old format as fallback
  if (!toggleBtn) {
    buttonId = listType === 'list1' ? 
      'toggle-document-list-btn-' + circleTypeId : 
      'toggle-document-list-btn2-' + circleTypeId;
    toggleBtn = document.getElementById(buttonId);
  }
  
  if (toggleBtn) {
    var arrowIcon = toggleBtn.querySelector('.arrow-icon');
    if (arrowIcon) {
      arrowIcon.innerHTML = isVisible ? '▲' : '▼';
    }
  }
  
  return isVisible;
};

  /**
   * NEW: Add document list styles including search functionality
   * @private
   */
  ChakraApp.DocumentController.prototype._addDocumentListStyles = function() {
    var style = document.createElement('style');
    style.textContent = `
      .document-search-box {
        width: 100%;
        padding: 6px 8px;
        margin-bottom: 10px;
        background-color: #333;
        border: 1px solid #555;
        border-radius: 4px;
        color: #CCC;
        font-size: 12px;
        box-sizing: border-box;
      }
      
      .document-search-box:focus {
        outline: none;
        border-color: #4CAF50;
        background-color: #2a2a2a;
      }
      
      .document-search-box::placeholder {
        color: #777;
      }
      
      .document-list-item.hidden {
        display: none !important;
      }
      
      .search-no-results {
        color: #888;
        font-style: italic;
        font-size: 11px;
        text-align: center;
        padding: 10px;
        display: none;
      }
      
      .search-no-results.visible {
        display: block;
      }
      
      .document-search-box::-webkit-search-cancel-button {
        -webkit-appearance: none;
        height: 14px;
        width: 14px;
        border-radius: 50%;
        background: #555;
        cursor: pointer;
        position: relative;
      }
      
      .document-search-box::-webkit-search-cancel-button:before {
        content: "×";
        color: #CCC;
        font-weight: bold;
        position: absolute;
        top: -2px;
        left: 3px;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  };
  
  // FIXED: Update _createDocumentControls method to work with new panel structure
ChakraApp.DocumentController.prototype._createDocumentControls = function() {
  var self = this;
  
  // Create controls for each circle type in ALL left panels
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._createDocumentControlsForCircleType(circleType.id);
  });
};

ChakraApp.DocumentController.prototype._createDocumentControlsForCircleType = function(circleTypeId) {
  var self = this;
  
  // Create document controls for ALL left panels, not just panel 0
  if (ChakraApp.appState.leftPanels && ChakraApp.appState.leftPanels.size > 0) {
    ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
      self._createDocumentControlsForSpecificPanel(circleTypeId, panelId);
    });
  } else {
    // Fallback to creating for panel 0 only
    self._createDocumentControlsForSpecificPanel(circleTypeId, 0);
  }
};

ChakraApp.DocumentController.prototype._createDocumentControlsForSpecificPanel = function(circleTypeId, panelId) {
	var circleType = ChakraApp.Config.circleTypes.find(function(type) {
    return type.id === circleTypeId;
  });
  
  if (!circleType) {
    console.error('Invalid circle type ID:', circleTypeId);
    return;
  }
  
  var targetPanel = null;
  
  var selectors = [
    '#left-panel-' + panelId,
    '.left-panel[data-panel-index="' + panelId + '"]',
    '#left-container .left-panel:nth-child(' + (panelId + 1) + ')'
  ];
  
  for (var i = 0; i < selectors.length; i++) {
    targetPanel = document.querySelector(selectors[i]);
    if (targetPanel) {
      break;
    }
  }
  
  if (!targetPanel) {
    console.warn('Left panel not found for panel ID:', panelId, '- will be created when panel is available');
    return;
  }
  
  // Create unique container IDs for this panel
  var containerKey = circleTypeId + '-panel-' + panelId;
  
  // Create Document List Container (List 1)
  var listContainer = document.createElement('div');
  listContainer.id = 'document-list-container-' + containerKey;
  listContainer.className = 'document-list-container';
  listContainer.dataset.circleTypeId = circleTypeId;
  listContainer.dataset.panelId = panelId;
  
  // Apply positioning and styling
  listContainer.style.display = 'none';
  listContainer.style.position = 'absolute';
  listContainer.style.left = '10px';
  listContainer.style.bottom = '85px';
  listContainer.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
  listContainer.style.border = '1px solid #555';
  listContainer.style.borderRadius = '8px';
  listContainer.style.padding = '10px';
  listContainer.style.minWidth = '200px';
  listContainer.style.maxWidth = '300px';
  listContainer.style.maxHeight = '400px';
  listContainer.style.overflowY = 'auto';
  listContainer.style.zIndex = '100';
  listContainer.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
  
  // Apply custom styling based on circle type
  if (circleTypeId === 'star') {
    listContainer.style.backgroundColor = 'rgba(255, 153, 51, 0.1)';
    listContainer.style.borderColor = '#FF9933';
  } else if (circleTypeId === 'triangle') {
    listContainer.style.backgroundColor = 'rgba(56, 118, 29, 0.1)';
  } else if (circleTypeId === 'gem') {
    listContainer.style.backgroundColor = 'rgba(74, 111, 201, 0.1)';
  }
  
  targetPanel.appendChild(listContainer);
  
  // Store reference using panel-specific key
  if (!this.documentListContainers[circleTypeId]) {
    this.documentListContainers[circleTypeId] = {};
  }
  this.documentListContainers[circleTypeId][panelId] = listContainer;

  // Create SECOND Document List Container (List 2)
  var listContainer2 = document.createElement('div');
  listContainer2.id = 'document-list-container2-' + containerKey;
  listContainer2.className = 'document-list-container';
  listContainer2.dataset.circleTypeId = circleTypeId;
  listContainer2.dataset.panelId = panelId;
  
  // Position it similarly to first container
  listContainer2.style.display = 'none';
  listContainer2.style.position = 'absolute';
  listContainer2.style.left = '10px';
  listContainer2.style.bottom = '85px';
  listContainer2.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
  listContainer2.style.border = '1px solid #555';
  listContainer2.style.borderRadius = '8px';
  listContainer2.style.padding = '10px';
  listContainer2.style.minWidth = '200px';
  listContainer2.style.maxWidth = '300px';
  listContainer2.style.maxHeight = '400px';
  listContainer2.style.overflowY = 'auto';
  listContainer2.style.zIndex = '100';
  listContainer2.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
  
  // Apply custom styling based on circle type (same as first container)
  if (circleTypeId === 'star') {
    listContainer2.style.backgroundColor = 'rgba(255, 153, 51, 0.1)';
    listContainer2.style.borderColor = '#FF9933';
  } else if (circleTypeId === 'triangle') {
    listContainer2.style.backgroundColor = 'rgba(56, 118, 29, 0.1)';
  } else if (circleTypeId === 'gem') {
    listContainer2.style.backgroundColor = 'rgba(74, 111, 201, 0.1)';
  }
  
  targetPanel.appendChild(listContainer2);
  
  // Store reference using panel-specific key
  if (!this.documentListContainers2[circleTypeId]) {
    this.documentListContainers2[circleTypeId] = {};
  }
  this.documentListContainers2[circleTypeId][panelId] = listContainer2;
  
};
  
  // FIXED: Updated _createDocumentControlsForPanel method to work with new left panel structure
  ChakraApp.DocumentController.prototype._createDocumentControlsForPanel = function(circleTypeId) {
    var circleType = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    
    if (!circleType) {
      console.error('Invalid circle type ID:', circleTypeId);
      return;
    }
    
    // FIXED: Look for the new left panel structure with multiple fallback options
    var targetPanel = document.getElementById('left-panel-0') || 
                     document.querySelector('.left-panel[data-panel-index="0"]') ||
                     document.querySelector('#left-container .left-panel:first-child') ||
                     document.querySelector('.circle-panel[data-panel-id="left"]') ||
                     document.getElementById('left-panel');
    
    if (!targetPanel) {
      console.error('Left panel not found for rendering document controls. Available panels:', 
        Array.from(document.querySelectorAll('[id*="panel"], [class*="panel"]')).map(p => p.id || p.className));
      return;
    }
    
    // Create Document List Container
    var listContainer = document.createElement('div');
    listContainer.id = 'document-list-container-' + circleTypeId;
    listContainer.className = 'document-list-container';
    listContainer.dataset.circleTypeId = circleTypeId;
    
    // Initially hidden
    listContainer.style.display = 'none';
    listContainer.style.position = 'absolute';
    listContainer.style.left = '10px';
    listContainer.style.bottom = '85px';
    listContainer.style.top = 'unset';
    listContainer.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
    listContainer.style.border = '1px solid #555';
    listContainer.style.borderRadius = '8px';
    listContainer.style.padding = '10px';
    listContainer.style.minWidth = '200px';
    listContainer.style.maxWidth = '300px';
    listContainer.style.maxHeight = '400px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.zIndex = '100';
    listContainer.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
    
    // Apply custom styling based on circle type
    if (circleTypeId === 'star') {
      listContainer.style.backgroundColor = 'rgba(255, 153, 51, 0.1)';
      listContainer.style.borderColor = '#FF9933';
    } else if (circleTypeId === 'triangle') {
      listContainer.style.backgroundColor = 'rgba(56, 118, 29, 0.1)';
    } else if (circleTypeId === 'gem') {
      listContainer.style.backgroundColor = 'rgba(74, 111, 201, 0.1)';
    }
    
    targetPanel.appendChild(listContainer);
    this.documentListContainers[circleTypeId] = listContainer;

    // Create SECOND Document List Container
    var listContainer2 = document.createElement('div');
    listContainer2.id = 'document-list-container2-' + circleTypeId;
    listContainer2.className = 'document-list-container';
    listContainer2.dataset.circleTypeId = circleTypeId;
    
    // Position it differently 
    listContainer2.style.display = 'none';
    listContainer2.style.position = 'absolute';
    listContainer2.style.left = '10px';
    listContainer2.style.bottom = '85px'; // Different position
    listContainer2.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
    listContainer2.style.border = '1px solid #555';
    listContainer2.style.borderRadius = '8px';
    listContainer2.style.padding = '10px';
    listContainer2.style.minWidth = '200px';
    listContainer2.style.maxWidth = '300px';
    listContainer2.style.maxHeight = '400px';
    listContainer2.style.overflowY = 'auto';
    listContainer2.style.zIndex = '100';
    listContainer2.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
    
    // Apply custom styling based on circle type (same as first container)
    if (circleTypeId === 'star') {
      listContainer2.style.backgroundColor = 'rgba(255, 153, 51, 0.1)';
      listContainer2.style.borderColor = '#FF9933';
    } else if (circleTypeId === 'triangle') {
      listContainer2.style.backgroundColor = 'rgba(56, 118, 29, 0.1)';
    } else if (circleTypeId === 'gem') {
      listContainer2.style.backgroundColor = 'rgba(74, 111, 201, 0.1)';
    }
    
    targetPanel.appendChild(listContainer2);
    this.documentListContainers2[circleTypeId] = listContainer2;
  };

  ChakraApp.DocumentController.prototype._isSecondButtonClicked = function(circleTypeId) {
    return this._lastClickedButton === 'btn2-' + circleTypeId;
  };

ChakraApp.DocumentController.prototype._updateDocumentList = function(circleTypeId) {
  if (!ChakraApp.Config.circleTypes.find(function(type) { return type.id === circleTypeId; })) {
    return;
  }
  
  // Update document lists for all panels that have this circle type
  var self = this;
  if (ChakraApp.appState.leftPanels && ChakraApp.appState.leftPanels.size > 0) {
    ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
      self._updateDocumentListForPanel(circleTypeId, panelId, 'list1');
    });
  } else {
    // Fallback to updating panel 0 only using the original method
    self._updateDocumentListOriginal(circleTypeId);
  }
};

ChakraApp.DocumentController.prototype._updateDocumentList2 = function(circleTypeId) {
  // Update document lists for all panels that have this circle type
  var self = this;
  if (ChakraApp.appState.leftPanels && ChakraApp.appState.leftPanels.size > 0) {
    ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
      self._updateDocumentListForPanel(circleTypeId, panelId, 'list2');
    });
  } else {
    // Fallback to updating panel 0 only using the original method
    self._updateDocumentList2Original(circleTypeId);
  }
};

ChakraApp.DocumentController.prototype._updateDocumentListForPanel = function(circleTypeId, panelId, listType) {
    var containerKey = listType === 'list1' ? 'documentListContainers' : 'documentListContainers2';
    var containers = this[containerKey][circleTypeId];
    
    if (!containers || !containers[panelId]) {
      // Fallback to original method for panel 0
      if (panelId === 0) {
        if (listType === 'list1') {
          this._updateDocumentListOriginal(circleTypeId);
        } else {
          this._updateDocumentList2Original(circleTypeId);
        }
      }
      return;
    }
    
    var listContainer = containers[panelId];
    
    // Check panel-specific visibility
    var shouldShowList = false;
    if (this.panelDocumentListVisible[panelId] && 
        this.panelDocumentListVisible[panelId][circleTypeId] && 
        this.panelDocumentListVisible[panelId][circleTypeId][listType]) {
      shouldShowList = true;
    }
    
    listContainer.style.display = shouldShowList ? 'block' : 'none';
    
    if (!shouldShowList) {
      return;
    }
    
    // Clear existing list
    listContainer.innerHTML = '';
    
    // Create header
    var circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    var typeName = circleTypeConfig ? circleTypeConfig.name : circleTypeId;
    
    var header = document.createElement('div');
    header.className = 'document-list-header';
    header.style.color = '#CCC';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '8px';
    header.style.borderBottom = '1px solid #555';
    header.style.paddingBottom = '5px';
    header.textContent = typeName + ' Documents (' + (listType === 'list1' ? 'A' : 'B') + ') - Panel ' + panelId;
    listContainer.appendChild(header);
    
    // ENHANCED: Add deselect option if something is selected in this specific panel
    var isDocumentSelected = this._isDocumentSelectedInPanel(circleTypeId, listType, panelId);
    if (isDocumentSelected) {
      var deselectItem = this._createDeselectListItem(circleTypeId, listType);
      listContainer.appendChild(deselectItem);
    }
    
    // Add "New Document" option
    var newDocItem = this._createNewDocumentListItem(circleTypeId, listType);
    listContainer.appendChild(newDocItem);
    
    // Create search box
    var searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.className = 'document-search-box';
    searchBox.placeholder = 'Search documents...';
    searchBox.id = 'document-search-' + circleTypeId + '-' + panelId + '-' + listType;
    listContainer.appendChild(searchBox);
    
    // Store search box reference
    var searchKey = circleTypeId + '-' + panelId + '-' + listType;
    this.documentSearchBoxes[searchKey] = searchBox;
    
    // Setup event handler for search box
    this._setupSearchBoxEventHandlerForPanel(circleTypeId, panelId, listType);
    
    // Create no results message
    var noResultsMsg = document.createElement('div');
    noResultsMsg.className = 'search-no-results';
    noResultsMsg.textContent = 'No documents found matching your search.';
    noResultsMsg.id = 'search-no-results-' + circleTypeId + '-' + panelId + '-' + listType;
    listContainer.appendChild(noResultsMsg);
    
    // Create documents list container
    var documentsList = document.createElement('div');
    documentsList.id = 'documents-list-' + circleTypeId + '-' + panelId + '-' + listType;
    documentsList.className = 'documents-list';
    listContainer.appendChild(documentsList);
    
    // Get documents for this circle type and list type
    var documents = ChakraApp.appState.getDocumentsForCircleTypeAndList(circleTypeId, listType);
    documents.reverse();
    
    // Get selected ID for this panel and list type
    var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
    var selectedId = panelSelections[circleTypeId] && panelSelections[circleTypeId][listType];
    
    // Create list items for each document
    var self = this;
    documents.forEach(function(doc) {
      var listItem = doc.id === selectedId ? 
        self._createSelectedDocumentListItem(doc, circleTypeId) : 
        self._createDocumentListItem(doc, circleTypeId);
      
      documentsList.appendChild(listItem);
    });
    
    // If no documents, show message
    if (documents.length === 0) {
      var noDocsMessage = document.createElement('div');
      noDocsMessage.className = 'no-documents-message';
      noDocsMessage.style.color = '#888';
      noDocsMessage.style.fontStyle = 'italic';
      noDocsMessage.style.textAlign = 'center';
      noDocsMessage.style.padding = '10px';
      noDocsMessage.textContent = 'No documents available';
      documentsList.appendChild(noDocsMessage);
    }
  };

ChakraApp.DocumentController.prototype._setupSearchBoxEventHandlerForPanel = function(circleTypeId, panelId, listType) {
  var searchKey = circleTypeId + '-' + panelId + '-' + listType;
  var searchBox = this.documentSearchBoxes[searchKey];
  if (!searchBox) return;
  
  var self = this;
  searchBox.addEventListener('input', function(e) {
    self._handleSearchInputForPanel(circleTypeId, panelId, listType, e.target.value);
  });
};

ChakraApp.DocumentController.prototype._handleSearchInputForPanel = function(circleTypeId, panelId, listType, searchText) {
  var self = this;
  var timerKey = circleTypeId + '-' + panelId + '-' + listType;
  
  if (this.documentSearchTimers[timerKey]) {
    clearTimeout(this.documentSearchTimers[timerKey]);
  }
  
  this.documentSearchTimers[timerKey] = setTimeout(function() {
    self._performSearchForPanel(circleTypeId, panelId, listType, searchText);
  }, 300);
};

ChakraApp.DocumentController.prototype._performSearchForPanel = function(circleTypeId, panelId, listType, searchText) {
  var searchTerm = searchText.toLowerCase().trim();
  var documentsList = document.getElementById('documents-list-' + circleTypeId + '-' + panelId + '-' + listType);
  var noResultsMsg = document.getElementById('search-no-results-' + circleTypeId + '-' + panelId + '-' + listType);
  
  if (!documentsList || !noResultsMsg) return;
  
  var documentItems = documentsList.querySelectorAll('.document-list-item');
  var visibleCount = 0;
  
  if (searchTerm === '') {
    documentItems.forEach(function(item) {
      item.classList.remove('hidden');
      visibleCount++;
    });
    noResultsMsg.classList.remove('visible');
  } else {
    var self = this;
    documentItems.forEach(function(item) {
      var documentId = item.dataset.id;
      var matches = self._documentMatchesSearch(documentId, searchTerm);
      
      if (matches) {
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });
    
    if (visibleCount === 0) {
      noResultsMsg.classList.add('visible');
    } else {
      noResultsMsg.classList.remove('visible');
    }
  }
};
  
  /**
   * NEW: Set up search box event handler
   * @private
   */
  ChakraApp.DocumentController.prototype._setupSearchBoxEventHandler = function(circleTypeId) {
    var searchBox = this.documentSearchBoxes[circleTypeId];
    if (!searchBox) return;
    
    var self = this;
    searchBox.addEventListener('input', function(e) {
      self._handleSearchInput(circleTypeId, e.target.value);
    });
  };

  ChakraApp.DocumentController.prototype._setupSearchBoxEventHandler2 = function(circleTypeId) {
    var searchBox = this.documentSearchBoxes2[circleTypeId];
    if (!searchBox) return;
    
    var self = this;
    searchBox.addEventListener('input', function(e) {
      self._handleSearchInput2(circleTypeId, e.target.value);
    });
  };

  ChakraApp.DocumentController.prototype._handleSearchInput2 = function(circleTypeId, searchText) {
    var self = this;
    
    // Use separate timer property for second search
    this.documentSearchTimers2 = this.documentSearchTimers2 || {};
    
    if (this.documentSearchTimers2[circleTypeId]) {
      clearTimeout(this.documentSearchTimers2[circleTypeId]);
    }
    
    this.documentSearchTimers2[circleTypeId] = setTimeout(function() {
      self._performSearch2(circleTypeId, searchText);
    }, 300);
  };
  
  /**
   * NEW: Handle search input with debouncing
   * @private
   */
  ChakraApp.DocumentController.prototype._handleSearchInput = function(circleTypeId, searchText) {
    var self = this;
    
    if (this.documentSearchTimers[circleTypeId]) {
      clearTimeout(this.documentSearchTimers[circleTypeId]);
    }
    
    this.documentSearchTimers[circleTypeId] = setTimeout(function() {
      self._performSearch(circleTypeId, searchText);
    }, 300);
  };
  
  /**
   * NEW: Perform search and filter documents
   * @private
   */
  ChakraApp.DocumentController.prototype._performSearch = function(circleTypeId, searchText) {
    var searchTerm = searchText.toLowerCase().trim();
    var documentsList = document.getElementById('documents-list-' + circleTypeId);
    var noResultsMsg = document.getElementById('search-no-results-' + circleTypeId);
    
    if (!documentsList || !noResultsMsg) return;
    
    var documentItems = documentsList.querySelectorAll('.document-list-item');
    var visibleCount = 0;
    
    if (searchTerm === '') {
      documentItems.forEach(function(item) {
        item.classList.remove('hidden');
        visibleCount++;
      });
      noResultsMsg.classList.remove('visible');
    } else {
      var self = this;
      documentItems.forEach(function(item) {
        var documentId = item.dataset.id;
        var matches = self._documentMatchesSearch(documentId, searchTerm);
        
        if (matches) {
          item.classList.remove('hidden');
          visibleCount++;
        } else {
          item.classList.add('hidden');
        }
      });
      
      if (visibleCount === 0) {
        noResultsMsg.classList.add('visible');
      } else {
        noResultsMsg.classList.remove('visible');
      }
    }
  };

  ChakraApp.DocumentController.prototype._performSearch2 = function(circleTypeId, searchText) {
    var searchTerm = searchText.toLowerCase().trim();
    var documentsList = document.getElementById('documents-list2-' + circleTypeId);
    var noResultsMsg = document.getElementById('search-no-results2-' + circleTypeId);
    
    if (!documentsList || !noResultsMsg) return;
    
    var documentItems = documentsList.querySelectorAll('.document-list-item');
    var visibleCount = 0;
    
    if (searchTerm === '') {
      documentItems.forEach(function(item) {
        item.classList.remove('hidden');
        visibleCount++;
      });
      noResultsMsg.classList.remove('visible');
    } else {
      var self = this;
      documentItems.forEach(function(item) {
        var documentId = item.dataset.id;
        var matches = self._documentMatchesSearch(documentId, searchTerm);
        
        if (matches) {
          item.classList.remove('hidden');
          visibleCount++;
        } else {
          item.classList.add('hidden');
        }
      });
      
      if (visibleCount === 0) {
        noResultsMsg.classList.add('visible');
      } else {
        noResultsMsg.classList.remove('visible');
      }
    }
  };
  
  /**
   * NEW: Check if document matches search term
   * @private
   */
  ChakraApp.DocumentController.prototype._documentMatchesSearch = function(documentId, searchTerm) {
    var document = ChakraApp.appState.getDocument(documentId);
    if (!document) return false;
    
    // Check document name
    if (document.name.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Check circles in this document
    var circles = ChakraApp.appState.getCirclesForDocument(documentId);
    for (var i = 0; i < circles.length; i++) {
      if (circles[i].name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Check squares in this circle
      var squares = ChakraApp.appState.getSquaresForCircle(circles[i].id);
      for (var j = 0; j < squares.length; j++) {
        if (squares[j].name.toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  /**
   * NEW: Refresh search results for a circle type
   * @private
   */
  ChakraApp.DocumentController.prototype._refreshSearchResults = function(circleTypeId) {
    if (this.documentSearchBoxes[circleTypeId]) {
      var currentSearch = this.documentSearchBoxes[circleTypeId].value;
      this._performSearch(circleTypeId, currentSearch);
    }
  };
  
  // Keep your existing _getDocumentsForCircleType method
  ChakraApp.DocumentController.prototype._getDocumentsForCircleType = function(circleTypeId) {
    var documents = [];
    
    ChakraApp.appState.documents.forEach(function(doc) {
      if (doc.circleType === circleTypeId) {
        documents.push(doc);
      }
    });
    
    return documents;
  };

  // Enhanced DocumentController.js Part 3 - List Items and Event Handlers

  // Keep your existing _createNewDocumentListItem method with styling updates
ChakraApp.DocumentController.prototype._createNewDocumentListItem = function(circleTypeId, listType) {
  var self = this;
  listType = listType || 'list1'; // Default to list1
  
  var listItem = document.createElement('div');
  listItem.className = 'document-list-item new-document-item';
  listItem.dataset.circleTypeId = circleTypeId;
  listItem.dataset.listType = listType;
  
  // Apply new document item styling
  listItem.style.display = 'block';
  listItem.style.padding = '3px 5px';
  listItem.style.marginBottom = '10px';
  listItem.style.backgroundColor = '#4CAF50';
  listItem.style.color = 'white';
  listItem.style.border = 'none';
  listItem.style.borderRadius = '4px';
  listItem.style.cursor = 'pointer';
  listItem.style.fontSize = '12px';
  listItem.style.transition = 'background-color 0.2s';
  
  // Add icon
  var icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.innerHTML = '➕';
  listItem.appendChild(icon);
  
  // Add text with list indicator
  var name = document.createElement('span');
  name.className = 'document-name';
  name.textContent = 'New Document (' + (listType === 'list1' ? 'A' : 'B') + ')';
  listItem.appendChild(name);
  
  // Hover effect
  listItem.addEventListener('mouseenter', function() {
    this.style.backgroundColor = '#45a049';
  });
  listItem.addEventListener('mouseleave', function() {
    this.style.backgroundColor = '#4CAF50';
  });
  
  // FIXED: Enhanced click handler for new documents with proper panel detection
  listItem.addEventListener('click', function(e) {
    e.stopPropagation();
    
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
      var templateController = ChakraApp.app.controllers.template;
      if (templateController.selectedTemplateIds[circleTypeId]) {
        templateController._deselectTemplate(circleTypeId);
        templateController._updateTemplateList(circleTypeId);
        
        var templateToggleBtn = templateController.toggleTemplateListBtns[circleTypeId];
        if (templateToggleBtn) {
          var arrowIcon = templateToggleBtn.querySelector('.template-arrow-icon');
          if (arrowIcon) {
            arrowIcon.innerHTML = '▼';
          }
        }
      }
    }
    
    // FIXED: Determine which panel this document list belongs to
    var panelId = self._determinePanelForDocumentSelection(e.target, circleTypeId);
    var newDocName = ChakraApp.appState.generateDateBasedDocumentName(circleTypeId, listType);
    
    var newDoc = {
	    name: newDocName,
	    circleType: circleTypeId,
	    listType: listType
    };
    
    var doc = ChakraApp.appState.addDocument(newDoc);
    
    // FIXED: Use panel-aware selection with the detected panel ID
    ChakraApp.appState.selectDocumentForPanel(doc.id, circleTypeId, listType, panelId);
    
    self._updateDocumentList(circleTypeId);
    self._updateDocumentList2(circleTypeId);
    self._updateCurrentDocumentDisplay(circleTypeId);
    
    var currentDocDisplay = self.currentDocumentDisplays[circleTypeId];
    if (currentDocDisplay) {
      currentDocDisplay.classList.add('flash-success');
      setTimeout(function() {
        currentDocDisplay.classList.remove('flash-success');
      }, 1000);
    }
  });
  
  return listItem;
};

ChakraApp.DocumentController.prototype._determinePanelForDocumentSelection = function(targetElement, circleTypeId) {
  
  // Walk up the DOM tree to find the panel container
  var element = targetElement;
  var attempts = 0;
  var maxAttempts = 10; // Prevent infinite loops
  
  while (element && element !== document.body && attempts < maxAttempts) {
    attempts++;
    
    // Check for left panel with panel index (NEW STRUCTURE)
    if (element.classList && element.classList.contains('left-panel')) {
      var panelIndex = element.dataset.panelIndex;
      if (panelIndex !== undefined) {
        return parseInt(panelIndex);
      }
    }
    
    // Check for panel ID in various forms (OLD STRUCTURE COMPATIBILITY)
    if (element.id && element.id.startsWith('left-panel-')) {
      var panelIdMatch = element.id.match(/left-panel-(\d+)/);
      if (panelIdMatch) {
        return parseInt(panelIdMatch[1]);
      }
    }
    
    // Check for left-container child panels
    if (element.parentElement && element.parentElement.id === 'left-container') {
      // Find the index of this panel within the left-container
      var siblings = Array.from(element.parentElement.children);
      var index = siblings.indexOf(element);
      if (index >= 0) {
        return index;
      }
    }
    
    element = element.parentElement;
  }
  
  
  // Enhanced fallback: Use the most recent selection's panel if available
  var recentSelection = ChakraApp.appState.mostRecentDocumentSelection[circleTypeId];
  if (recentSelection && recentSelection.panelId !== undefined) {
    return recentSelection.panelId;
  }
  
  // Final fallback to panel 0
  return 0;
};
  
  // Enhanced _createDocumentListItem method with styling
ChakraApp.DocumentController.prototype._createDocumentListItem = function(doc, circleTypeId) {
  var self = this;
  
  var listItem = document.createElement('div');
  listItem.className = 'document-list-item';
  listItem.dataset.id = doc.id;
  listItem.dataset.circleTypeId = circleTypeId;
  
  // Apply document item styling
  listItem.style.display = 'block';
  listItem.style.padding = '3px 5px';
  listItem.style.marginBottom = '4px';
  listItem.style.backgroundColor = '#555';
  listItem.style.color = '#DDD';
  listItem.style.border = 'none';
  listItem.style.borderRadius = '4px';
  listItem.style.cursor = 'pointer';
  listItem.style.fontSize = '12px';
  listItem.style.textAlign = 'left';
  listItem.style.transition = 'background-color 0.2s';
  listItem.style.position = 'relative';
  
  // Document icon
  var icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.innerHTML = '📄';
  
  // Document name container
  var nameContainer = document.createElement('div');
  nameContainer.className = 'document-name-container';
  
  // Document name
  var name = document.createElement('span');
  name.className = 'document-name';
  name.style.marginBottom = '2px';
  name.textContent = doc.name;
  nameContainer.appendChild(name);
  
  // Document circle count
  var circleCount = document.createElement('span');
  circleCount.className = 'document-circle-count';
  circleCount.style.fontSize = '10px';
  circleCount.style.color = '#AAA';
  circleCount.style.opacity = '0.8';
  var count = this._getCircleCountForDocument(doc.id);
  circleCount.textContent = ' (' + count + ')';
  nameContainer.appendChild(circleCount);
  
  listItem.appendChild(nameContainer);
  
  // Hover effect
  listItem.addEventListener('mouseenter', function() {
    this.style.backgroundColor = '#666';
  });
  listItem.addEventListener('mouseleave', function() {
    this.style.backgroundColor = '#555';
  });
  
  // FIXED: Enhanced click handler with proper panel detection
  listItem.addEventListener('click', function(e) {
    e.stopPropagation();
    
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
      var templateController = ChakraApp.app.controllers.template;
      if (templateController.selectedTemplateIds[circleTypeId]) {
        templateController._deselectTemplate(circleTypeId);
        templateController._updateTemplateList(circleTypeId);
        
        var templateToggleBtn = templateController.toggleTemplateListBtns[circleTypeId];
        if (templateToggleBtn) {
          var arrowIcon = templateToggleBtn.querySelector('.template-arrow-icon');
          if (arrowIcon) {
            arrowIcon.innerHTML = '▼';
          }
        }
      }
    }
    
    // FIXED: Determine which panel this document list belongs to
    var panelId = self._determinePanelForDocumentSelection(e.target, circleTypeId);
    
    // FORCE SELECTION EVEN IF ALREADY SELECTED
    // First deselect if it's already selected, then select again
    var currentSelection = ChakraApp.appState.selectedDocumentIds[circleTypeId];
    var isAlreadySelected = false;
    
    if (currentSelection) {
      if (doc.listType === 'list1' && currentSelection.list1 === doc.id) {
        isAlreadySelected = true;
      } else if (doc.listType === 'list2' && currentSelection.list2 === doc.id) {
        isAlreadySelected = true;
      }
    }
    
    ChakraApp.appState.selectDocumentForPanel(doc.id, circleTypeId, doc.listType, panelId);
    
    self._updateDocumentList(circleTypeId);
    self._updateDocumentList2(circleTypeId);
    self._updateCurrentDocumentDisplay(circleTypeId);
  });
  
  return listItem;
};
  
  // Enhanced _createSelectedDocumentListItem method with styling
ChakraApp.DocumentController.prototype._createSelectedDocumentListItem = function(doc, circleTypeId) {
  var self = this;
  
  var listItem = document.createElement('div');
  listItem.className = 'document-list-item selected';
  listItem.dataset.id = doc.id;
  listItem.dataset.circleTypeId = circleTypeId;
  
  // Apply selected document item styling
  listItem.style.display = 'block';
  listItem.style.padding = '3px 5px';
  listItem.style.marginBottom = '4px';
  listItem.style.backgroundColor = '#4CAF50';
  listItem.style.color = 'white';
  listItem.style.border = 'none';
  listItem.style.borderRadius = '4px';
  listItem.style.cursor = 'pointer';
  listItem.style.fontSize = '12px';
  listItem.style.textAlign = 'left';
  listItem.style.transition = 'background-color 0.2s';
  listItem.style.position = 'relative';
  
  // Document icon
  var icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.innerHTML = '📄';
  
  // Document name container
  var nameContainer = document.createElement('div');
  nameContainer.className = 'document-name-container';
  
  // Document name (editable)
  var name = document.createElement('span');
  name.className = 'document-name editable';
  name.contentEditable = true;
  name.spellcheck = false;
  name.textContent = doc.name;
  name.style.marginBottom = '2px';
  nameContainer.appendChild(name);
  
  // Document circle count
  var circleCount = document.createElement('span');
  circleCount.className = 'document-circle-count';
  circleCount.style.fontSize = '10px';
  circleCount.style.color = '#E8F5E8';
  circleCount.style.opacity = '0.8';
  var count = this._getCircleCountForDocument(doc.id);
  circleCount.textContent = ' (' + count + ')';
  nameContainer.appendChild(circleCount);
  
  listItem.appendChild(nameContainer);
  
  // Edit blur handler
  name.addEventListener('blur', function() {
    var newName = this.textContent.trim();
    if (newName && newName !== doc.name) {
      ChakraApp.appState.updateDocument(doc.id, { name: newName });
      self._updateCurrentDocumentDisplay(circleTypeId);
    } else {
      this.textContent = doc.name;
    }
  });
  
  // Enter key handler
  name.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.blur();
    }
  });
  
  // Delete button
  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'document-delete-btn';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Delete Document';
  deleteBtn.style.position = 'absolute';
  deleteBtn.style.right = '8px';
  deleteBtn.style.top = '50%';
  deleteBtn.style.transform = 'translateY(-50%)';
  deleteBtn.style.backgroundColor = 'transparent';
  deleteBtn.style.border = 'none';
  deleteBtn.style.color = 'white';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.fontSize = '14px';

  deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent the click from bubbling up to the listItem
    
    // Show confirmation dialog
    if (confirm('Are you sure you want to delete this document? This will also delete all circles in this document.')) {
      // Remove the document
      ChakraApp.appState.removeDocument(doc.id);
      
      // Update the document lists
      self._updateDocumentList(circleTypeId);
      self._updateDocumentList2(circleTypeId);
      self._updateCurrentDocumentDisplay(circleTypeId);
    }
  });
  listItem.appendChild(deleteBtn);
  
  // FIXED: Enhanced click handler for selected documents with proper panel detection
  listItem.addEventListener('click', function(e) {
    // Don't trigger if clicking on the editable name or delete button
    if (e.target.classList.contains('editable') || e.target.classList.contains('document-delete-btn')) {
      return;
    }
    
    e.stopPropagation();
    
    // FIXED: Determine which panel this document list belongs to
    var panelId = self._determinePanelForDocumentSelection(e.target, circleTypeId);
    
    // FORCE RE-SELECTION to update most-recently-selected status
    // First deselect, then reselect
    ChakraApp.appState.deselectDocument(circleTypeId, doc.listType);
    setTimeout(function() {
      // FIXED: Use panel-aware selection with detected panel ID
      ChakraApp.appState.selectDocumentForPanel(doc.id, circleTypeId, doc.listType, panelId);
    }, 1);
    
    self._updateDocumentList(circleTypeId);
    self._updateDocumentList2(circleTypeId);
    self._updateCurrentDocumentDisplay(circleTypeId);
  });
  
  return listItem;
};
  
  // Keep all your existing methods
  ChakraApp.DocumentController.prototype._updateCurrentDocumentDisplay = function(panelId) {
    return; // Your existing early return
  };
  
  ChakraApp.DocumentController.prototype._setupDocumentEventListeners = function() {
    var self = this;
    
    // All your existing event listeners
    this.eventSubscriptions.documentSelected = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_SELECTED,
      function(doc) {
        var circleType = doc.circleType || 'standard';
        self._updateDocumentList(circleType);
        self._updateCurrentDocumentDisplay(circleType);
      }
    );
    
    this.eventSubscriptions.documentDeselected = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_DESELECTED,
      function(doc) {
        var circleType = doc.circleType || 'standard';
        self._updateDocumentList(circleType);
        self._updateCurrentDocumentDisplay(circleType);
      }
    );
    
    this.eventSubscriptions.documentUpdated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_UPDATED,
      function(doc) {
        var circleType = doc.circleType || 'standard';
        self._updateDocumentList(circleType);
        self._updateCurrentDocumentDisplay(circleType);
      }
    );
    
    // NEW: Listen for content updates to refresh search results
    this.eventSubscriptions.circleUpdated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_UPDATED,
      function(circle) {
        // Refresh search results for all visible document lists
        Object.keys(self.documentListContainers).forEach(function(circleTypeId) {
          if (ChakraApp.appState.documentListVisible[circleTypeId]) {
            self._refreshSearchResults(circleTypeId);
          }
        });
      }
    );
    
    this.eventSubscriptions.squareUpdated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.SQUARE_UPDATED,
      function(square) {
        // Refresh search results for all visible document lists
        Object.keys(self.documentListContainers).forEach(function(circleTypeId) {
          if (ChakraApp.appState.documentListVisible[circleTypeId]) {
            self._refreshSearchResults(circleTypeId);
          }
        });
      }
    );
    
    this.eventSubscriptions.circleCreated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_CREATED,
      function(circle) {
        var doc = ChakraApp.appState.getDocument(circle.documentId);
        if (doc) {
          var circleType = doc.circleType || 'standard';
          self._updateDocumentList(circleType);
          self._updateCurrentDocumentDisplay(circleType);
        }
      }
    );
    
    this.eventSubscriptions.squareCreated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.SQUARE_CREATED,
      function(square) {
        // Refresh search results for all visible document lists
        Object.keys(self.documentListContainers).forEach(function(circleTypeId) {
          if (ChakraApp.appState.documentListVisible[circleTypeId]) {
            self._refreshSearchResults(circleTypeId);
          }
        });
      }
    );
    
    // Keep all your other existing event listeners
    this.eventSubscriptions.documentListToggled = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED,
      function(data) {
        self._updateDocumentList(data.panelId);
        self._updateArrowIcon(data.panelId);
      }
    );
    
    this.eventSubscriptions.stateLoaded = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.STATE_LOADED,
      function() {
        if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            self._updateDocumentList(circleType.id);
            self._updateCurrentDocumentDisplay(circleType.id);
          });
        }
      }
    );
    
    this.eventSubscriptions.circleDeleted = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DELETED,
      function(circle) {
        var doc = ChakraApp.appState.getDocument(circle.documentId);
        if (doc) {
          var circleType = doc.circleType || 'standard';
          self._updateDocumentList(circleType);
          self._updateCurrentDocumentDisplay(circleType);
        }
      }
    );

    this.eventSubscriptions.panelsCreated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.PANELS_CREATED,
      function(data) {
        if (!data || !data.panels || !Array.isArray(data.panels)) return;
      
        if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            self._createDocumentControlsForPanel(circleType.id);
            self._updateDocumentList(circleType.id);
            self._updateCurrentDocumentDisplay(circleType.id);
          });
        }
      }
    );

    this.eventSubscriptions.leftPanelAdded = ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
    self._createDocumentControlsForNewPanel(data.panelId);
  });
  
  this.eventSubscriptions.leftPanelRemoved = ChakraApp.EventBus.subscribe('LEFT_PANEL_REMOVED', function(data) {
    self._removeDocumentControlsForPanel(data.panelId);
  });
  };

ChakraApp.DocumentController.prototype._createDocumentControlsForNewPanel = function(panelId) {
  var self = this;
  
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._createDocumentControlsForSpecificPanel(circleType.id, panelId);
  });
};

// ADD NEW: Remove document controls for a removed panel
ChakraApp.DocumentController.prototype._removeDocumentControlsForPanel = function(panelId) {
  var self = this;
  
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    var typeId = circleType.id;
    
    // Remove containers for this panel
    if (self.documentListContainers[typeId] && self.documentListContainers[typeId][panelId]) {
      var container1 = self.documentListContainers[typeId][panelId];
      if (container1.parentNode) {
        container1.parentNode.removeChild(container1);
      }
      delete self.documentListContainers[typeId][panelId];
    }
    
    if (self.documentListContainers2[typeId] && self.documentListContainers2[typeId][panelId]) {
      var container2 = self.documentListContainers2[typeId][panelId];
      if (container2.parentNode) {
        container2.parentNode.removeChild(container2);
      }
      delete self.documentListContainers2[typeId][panelId];
    }
  });
};
  
  // Keep all your existing utility methods
ChakraApp.DocumentController.prototype._setupClickOutsideHandler = function() {
  var self = this;
  
  if (!this.documentClickHandler) {
    this.documentClickHandler = function(e) {
      var hasVisibleLists = false;
      var clickedInAnyList = false;
      
      // Check all panels for visible lists
      Object.keys(self.panelDocumentListVisible).forEach(function(panelId) {
        var panelIdNum = parseInt(panelId);
        
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
          var typeId = circleType.id;
          
          // Safety check: ensure the panel visibility tracking exists
          if (!self.panelDocumentListVisible[panelId] || 
              !self.panelDocumentListVisible[panelId][typeId]) {
            return;
          }
          
          var panelLists = self.panelDocumentListVisible[panelId][typeId];
          
          // Check if any list is visible in this panel
          if (panelLists.list1 || panelLists.list2) {
            hasVisibleLists = true;
            
            // Check if click was inside any of the containers for this circle type and panel
            var containers1 = self.documentListContainers[typeId];
            var containers2 = self.documentListContainers2[typeId];
            
            // Check list1 container
            if (containers1 && containers1[panelIdNum] && containers1[panelIdNum].contains(e.target)) {
              clickedInAnyList = true;
            }
            
            // Check list2 container
            if (containers2 && containers2[panelIdNum] && containers2[panelIdNum].contains(e.target)) {
              clickedInAnyList = true;
            }
            
            // Check toggle buttons for this panel
            var toggleBtn1 = document.getElementById('toggle-document-list-btn-' + typeId);
            var toggleBtn2 = document.getElementById('toggle-document-list-btn2-' + typeId);
            
            if ((toggleBtn1 && toggleBtn1.contains(e.target)) ||
                (toggleBtn2 && toggleBtn2.contains(e.target))) {
              clickedInAnyList = true;
            }
          }
        });
      });
      
      // If there are visible lists and click was outside all of them, close all lists
      if (hasVisibleLists && !clickedInAnyList) {
        Object.keys(self.panelDocumentListVisible).forEach(function(panelId) {
          var panelIdNum = parseInt(panelId);
          
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            var typeId = circleType.id;
            
            // Safety check: ensure the panel visibility tracking exists
            if (!self.panelDocumentListVisible[panelId] || 
                !self.panelDocumentListVisible[panelId][typeId]) {
              return;
            }
            
            // Close both list types for this circle type in this panel
            if (self.panelDocumentListVisible[panelId][typeId].list1 || 
                self.panelDocumentListVisible[panelId][typeId].list2) {
              
              self.panelDocumentListVisible[panelId][typeId].list1 = false;
              self.panelDocumentListVisible[panelId][typeId].list2 = false;
              
              // Update the UI
              self._updateDocumentListForPanel(typeId, panelIdNum, 'list1');
              self._updateDocumentListForPanel(typeId, panelIdNum, 'list2');
              
              // Update arrow icons for both buttons
              var toggleBtn1 = document.getElementById('toggle-document-list-btn-' + typeId);
              if (toggleBtn1) {
                var arrowIcon1 = toggleBtn1.querySelector('.arrow-icon');
                if (arrowIcon1) {
                  arrowIcon1.innerHTML = '▼';
                }
              }
              
              var toggleBtn2 = document.getElementById('toggle-document-list-btn2-' + typeId);
              if (toggleBtn2) {
                var arrowIcon2 = toggleBtn2.querySelector('.arrow-icon');
                if (arrowIcon2) {
                  arrowIcon2.innerHTML = '▼';
                }
              }
            }
          });
        });
      }
    };
    
    document.addEventListener('click', this.documentClickHandler);
  }
};
  
  ChakraApp.DocumentController.prototype._getCircleCountForDocument = function(documentId) {
    var count = 0;
    
    if (!documentId) return count;
    
    var doc = ChakraApp.appState.getDocument(documentId);
    if (!doc) return count;
    
    var circleType = doc.circleType || 'standard';
    
    ChakraApp.appState.circles.forEach(function(circle) {
      if (circle.documentId === documentId && circle.circleType === circleType) {
        count++;
      }
    });
    
    return count;
  };

  ChakraApp.DocumentController.prototype._closeAllTemplateLists = function() {
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
      var templateController = ChakraApp.app.controllers.template;
      
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        var typeId = circleType.id;
        if (templateController.templateListVisible[typeId]) {
          templateController.templateListVisible[typeId] = false;
          templateController._updateTemplateList(typeId);
          
          var templateToggleBtn = templateController.toggleTemplateListBtns[typeId];
          if (templateToggleBtn) {
            var arrowIcon = templateToggleBtn.querySelector('.template-arrow-icon');
            if (arrowIcon) {
              arrowIcon.innerHTML = '▼';
            }
          }
        }
      });
    }
  };

  ChakraApp.DocumentController.prototype._updateArrowIcon = function(typeId) {
    var toggleBtn = this.toggleDocumentListBtns[typeId];
    if (!toggleBtn) return;
    
    var isVisible = ChakraApp.appState.documentListVisible[typeId];
    
    var arrowIcon = toggleBtn.querySelector('.arrow-icon');
    if (arrowIcon) {
      arrowIcon.innerHTML = isVisible ? '▲' : '▼';
    }
  };
  
  ChakraApp.DocumentController.prototype.destroy = function() {
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up timers
    Object.values(this.documentSearchTimers).forEach(function(timer) {
      if (timer) clearTimeout(timer);
    });
    
    if (this.documentSearchTimers2) {
      Object.values(this.documentSearchTimers2).forEach(function(timer) {
        if (timer) clearTimeout(timer);
      });
    }
    
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickHandler = null;
    }
    
    Object.keys(this.eventSubscriptions).forEach(function(key) {
      var unsubscribe = this.eventSubscriptions[key];
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }, this);
    
    this.eventSubscriptions = {};
    
    Object.values(this.toggleDocumentListBtns).forEach(function(btn) {
      if (btn && btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });
    
    Object.values(this.documentListContainers).forEach(function(container) {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    
    Object.values(this.currentDocumentDisplays).forEach(function(display) {
      if (display && display.parentNode) {
        display.parentNode.removeChild(display);
      }
    });
    
    this.toggleDocumentListBtns = {};
    this.documentListContainers = {};
    this.currentDocumentDisplays = {};
    this.documentSearchBoxes2 = {};
    this.documentSearchTimers2 = {};
    this.documentSearchTimers = {};
  };

ChakraApp.DocumentController.prototype._updateDocumentListOriginal = function(circleTypeId) {
    if (!ChakraApp.Config.circleTypes.find(function(type) { return type.id === circleTypeId; })) {
      return;
    }
    
    var listContainer = this.documentListContainers[circleTypeId];
    if (!listContainer) {
      return;
    }
    
    // Check if document list should be visible
    var shouldShowList = this.documentListVisible && this.documentListVisible[circleTypeId];
    listContainer.style.display = shouldShowList ? 'block' : 'none';
    
    if (!shouldShowList) {
      return;
    }
    
    // Clear existing list
    listContainer.innerHTML = '';
    
    // Create header
    var circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    var typeName = circleTypeConfig ? circleTypeConfig.name : circleTypeId;
    
    var header = document.createElement('div');
    header.className = 'document-list-header';
    header.style.color = '#CCC';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '8px';
    header.style.borderBottom = '1px solid #555';
    header.style.paddingBottom = '5px';
    header.textContent = typeName + ' Documents (A)';
    listContainer.appendChild(header);
    
    // ENHANCED: Add deselect option if something is selected
    var isDocumentSelected = this._isDocumentSelectedForCircleType(circleTypeId, 'list1');
    if (isDocumentSelected) {
      var deselectItem = this._createDeselectListItem(circleTypeId, 'list1');
      listContainer.appendChild(deselectItem);
    }
    
    // Add "New Document" option
    var newDocItem = this._createNewDocumentListItem(circleTypeId, 'list1');
    listContainer.appendChild(newDocItem);
    
    // Create search box
    var searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.className = 'document-search-box';
    searchBox.placeholder = 'Search documents...';
    searchBox.id = 'document-search-' + circleTypeId;
    listContainer.appendChild(searchBox);
    
    // Store search box reference
    this.documentSearchBoxes[circleTypeId] = searchBox;
    
    // Setup event handler for search box
    this._setupSearchBoxEventHandler(circleTypeId);
    
    // Create no results message
    var noResultsMsg = document.createElement('div');
    noResultsMsg.className = 'search-no-results';
    noResultsMsg.textContent = 'No documents found matching your search.';
    noResultsMsg.id = 'search-no-results-' + circleTypeId;
    listContainer.appendChild(noResultsMsg);
    
    // Create documents list container
    var documentsList = document.createElement('div');
    documentsList.id = 'documents-list-' + circleTypeId;
    documentsList.className = 'documents-list';
    listContainer.appendChild(documentsList);
    
    // Get documents for this circle type and list type
    var documents = ChakraApp.appState.getDocumentsForCircleTypeAndList(circleTypeId, 'list1');
    documents.reverse();
    
    // Get selected ID
    var selectedId = ChakraApp.appState.selectedDocumentIds[circleTypeId] && 
                     ChakraApp.appState.selectedDocumentIds[circleTypeId].list1;
    
    // Create list items for each document
    var self = this;
    documents.forEach(function(doc) {
      var listItem = doc.id === selectedId ? 
        self._createSelectedDocumentListItem(doc, circleTypeId) : 
        self._createDocumentListItem(doc, circleTypeId);
      
      documentsList.appendChild(listItem);
    });
    
    // If no documents, show message
    if (documents.length === 0) {
      var noDocsMessage = document.createElement('div');
      noDocsMessage.className = 'no-documents-message';
      noDocsMessage.style.color = '#888';
      noDocsMessage.style.fontStyle = 'italic';
      noDocsMessage.style.textAlign = 'center';
      noDocsMessage.style.padding = '10px';
      noDocsMessage.textContent = 'No documents available';
      documentsList.appendChild(noDocsMessage);
    }
  };

// Add the missing _updateDocumentList2Original method:
ChakraApp.DocumentController.prototype._updateDocumentList2Original = function(circleTypeId) {
    if (!ChakraApp.Config.circleTypes.find(function(type) { return type.id === circleTypeId; })) {
      return;
    }
    
    var listContainer = this.documentListContainers2[circleTypeId];
    if (!listContainer) {
      return;
    }
    
    // Check if document list should be visible
    var shouldShowList = this.documentListVisible && this.documentListVisible[circleTypeId];
    listContainer.style.display = shouldShowList ? 'block' : 'none';
    
    if (!shouldShowList) {
      return;
    }
    
    // Clear existing list
    listContainer.innerHTML = '';
    
    // Create header
    var circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    var typeName = circleTypeConfig ? circleTypeConfig.name : circleTypeId;
    
    var header = document.createElement('div');
    header.className = 'document-list-header';
    header.style.color = '#CCC';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '8px';
    header.style.borderBottom = '1px solid #555';
    header.style.paddingBottom = '5px';
    header.textContent = typeName + ' Documents (B)';
    listContainer.appendChild(header);
    
    // ENHANCED: Add deselect option if something is selected
    var isDocumentSelected = this._isDocumentSelectedForCircleType(circleTypeId, 'list2');
    if (isDocumentSelected) {
      var deselectItem = this._createDeselectListItem(circleTypeId, 'list2');
      listContainer.appendChild(deselectItem);
    }
    
    // Add "New Document" option
    var newDocItem = this._createNewDocumentListItem(circleTypeId, 'list2');
    listContainer.appendChild(newDocItem);
    
    // Create search box
    var searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.className = 'document-search-box';
    searchBox.placeholder = 'Search documents...';
    searchBox.id = 'document-search2-' + circleTypeId;
    listContainer.appendChild(searchBox);
    
    // Store search box reference
    if (!this.documentSearchBoxes2) {
      this.documentSearchBoxes2 = {};
    }
    this.documentSearchBoxes2[circleTypeId] = searchBox;
    
    // Setup event handler for search box
    this._setupSearchBoxEventHandler2(circleTypeId);
    
    // Create no results message
    var noResultsMsg = document.createElement('div');
    noResultsMsg.className = 'search-no-results';
    noResultsMsg.textContent = 'No documents found matching your search.';
    noResultsMsg.id = 'search-no-results2-' + circleTypeId;
    listContainer.appendChild(noResultsMsg);
    
    // Create documents list container
    var documentsList = document.createElement('div');
    documentsList.id = 'documents-list2-' + circleTypeId;
    documentsList.className = 'documents-list';
    listContainer.appendChild(documentsList);
    
    // Get documents for this circle type and list type
    var documents = ChakraApp.appState.getDocumentsForCircleTypeAndList(circleTypeId, 'list2');
    documents.reverse();
    
    // Get selected ID
    var selectedId = ChakraApp.appState.selectedDocumentIds[circleTypeId] && 
                     ChakraApp.appState.selectedDocumentIds[circleTypeId].list2;
    
    // Create list items for each document
    var self = this;
    documents.forEach(function(doc) {
      var listItem = doc.id === selectedId ? 
        self._createSelectedDocumentListItem(doc, circleTypeId) : 
        self._createDocumentListItem(doc, circleTypeId);
      
      documentsList.appendChild(listItem);
    });
    
    // If no documents, show message
    if (documents.length === 0) {
      var noDocsMessage = document.createElement('div');
      noDocsMessage.className = 'no-documents-message';
      noDocsMessage.style.color = '#888';
      noDocsMessage.style.fontStyle = 'italic';
      noDocsMessage.style.textAlign = 'center';
      noDocsMessage.style.padding = '10px';
      noDocsMessage.textContent = 'No documents available';
      documentsList.appendChild(noDocsMessage);
    }
  };

})(window.ChakraApp = window.ChakraApp || {});
