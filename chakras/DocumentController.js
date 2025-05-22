// src/controllers/DocumentController.js
(function(ChakraApp) {
  /**
   * Controls document-related UI elements and interactions
   */
  ChakraApp.DocumentController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements - now per panel
    this.toggleDocumentListBtns = {};
    this.documentListContainers = {};
    this.currentDocumentDisplays = {};
    
    // Event handlers
    this.documentClickHandler = null;
    
    // Event subscriptions
    this.eventSubscriptions = {};
  };
  
  // Inherit from BaseController
  ChakraApp.DocumentController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.DocumentController.prototype.constructor = ChakraApp.DocumentController;
  
  // Initialize
  ChakraApp.DocumentController.prototype.init = function() {
  // Call parent init
  ChakraApp.BaseController.prototype.init.call(this);
  
  // Create UI elements for each circle type
  this._createDocumentControls();
  
  // Add event listeners
  this._setupDocumentEventListeners();
  this._setupClickOutsideHandler();
  
  // Initialize document lists for each circle type
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._updateDocumentList(circleType.id);
    self._updateCurrentDocumentDisplay(circleType.id);
  });
};
  
  /**
   * Create document controls (toggle button, list container, and current display) for each panel
   * @private
   */
ChakraApp.DocumentController.prototype._createDocumentControls = function() {
  var self = this;
  
  // Create controls for each circle type
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._createDocumentControlsForPanel(circleType.id);
  });
};
  
  /**
   * Create document controls for a specific panel
   * @private
   * @param {string} panelId - Panel ID
   */
ChakraApp.DocumentController.prototype._createDocumentControlsForPanel = function(circleTypeId) {
  // Find the circle type
  var circleType = ChakraApp.Config.circleTypes.find(function(type) {
    return type.id === circleTypeId;
  });
  
  if (!circleType) {
    console.error('Invalid circle type ID:', circleTypeId);
    return;
  }
  
  // Find the left panel to place the document container
  var targetPanel = document.querySelector('.circle-panel[data-panel-id="left"]');
  if (!targetPanel) {
    console.error('Left panel not found for rendering document controls');
    return;
  }
  
  // Create Document List Container
  var listContainer = document.createElement('div');
  listContainer.id = 'document-list-container-' + circleTypeId;
  listContainer.className = 'document-list-container';
  listContainer.dataset.circleTypeId = circleTypeId;
  
  // Initially hidden
  listContainer.style.display = 'none';
  listContainer.style.left = '10px';
  listContainer.style.bottom = '85px';
  listContainer.style.top = 'unset';
  
  // Apply custom styling based on circle type
  if (circleTypeId === 'star') {
    listContainer.style.backgroundColor = 'rgba(255, 153, 51, 0.1)'; // Light orange background
    listContainer.style.borderColor = '#FF9933';
  } else if (circleTypeId === 'triangle') {
    listContainer.style.backgroundColor = 'rgba(56, 118, 29, 0.1)';
  } else if (circleTypeId === 'gem') {
    listContainer.style.backgroundColor = 'rgba(74, 111, 201, 0.1)';
  }
  
  // Add to left panel
  targetPanel.appendChild(listContainer);
  this.documentListContainers[circleTypeId] = listContainer;
  
  // Create Current Document Display
  var docDisplay = document.createElement('div');
  docDisplay.id = 'current-document-display-' + circleTypeId;
  docDisplay.className = 'current-document-display';
  docDisplay.dataset.circleTypeId = circleTypeId;
  
  // Set initial text
  docDisplay.textContent = 'No Document Selected';
  
  // Position based on circle type
  if (circleTypeId === 'triangle') {
    docDisplay.style.top = '88px';
    docDisplay.style.left = '125px';
    docDisplay.style.color = circleType.color;
  } else if (circleTypeId === 'gem') {
    docDisplay.style.top = 'unset';
    docDisplay.style.bottom = '10px';
    docDisplay.style.right = '0px';
    docDisplay.style.left = 'unset';
    docDisplay.style.color = circleType.color;
  } else if (circleTypeId === 'star') {
    docDisplay.style.top = '122px'; // Position it below the triangle display
    docDisplay.style.left = '125px';
    docDisplay.style.color = circleType.color;
  } else {
    // Standard type
    docDisplay.style.top = '54px';
    docDisplay.style.left = '-6px';
  }
};
  
  /**
   * Update document list display for a panel
   * @private
   * @param {string} panelId - Panel ID
   */
ChakraApp.DocumentController.prototype._updateDocumentList = function(circleTypeId) {
  // Validate circle type
  if (!ChakraApp.Config.circleTypes.find(function(type) { return type.id === circleTypeId; })) {
    console.error('Invalid circle type ID:', circleTypeId);
    return;
  }
  
  var listContainer = this.documentListContainers[circleTypeId];
  
  // Create the container if it doesn't exist yet
  if (!listContainer) {
    this._createDocumentControlsForPanel(circleTypeId);
    listContainer = this.documentListContainers[circleTypeId];
    
    // If still no container, something went wrong
    if (!listContainer) {
      console.error('Failed to create document list container for circle type:', circleTypeId);
      return;
    }
  }
  
  // Check visibility state
  var isVisible = ChakraApp.appState.documentListVisible[circleTypeId];
  listContainer.style.display = isVisible ? 'block' : 'none';
  
  // If not visible, no need to update content
  if (!isVisible) return;
  
  // Clear existing list
  listContainer.innerHTML = '';
  
  // Add "New Document" option at the top of the list
  var newDocItem = this._createNewDocumentListItem(circleTypeId);
  listContainer.appendChild(newDocItem);
  
  // Get documents for this circle type
  var documents = [];
  ChakraApp.appState.documents.forEach(function(doc) {
    if (doc.circleType === circleTypeId) {
      documents.push(doc);
    }
  });
  documents.reverse();
  
  var selectedId = ChakraApp.appState.selectedDocumentIds[circleTypeId];
  
  // Create list items for each document
  var self = this;
  documents.forEach(function(doc) {
    var listItem = doc.id === selectedId ? 
      self._createSelectedDocumentListItem(doc, circleTypeId) : 
      self._createDocumentListItem(doc, circleTypeId);
    
    listContainer.appendChild(listItem);
  });
  
  // If no documents, show message
  if (documents.length === 0) {
    var noDocsMessage = document.createElement('div');
    noDocsMessage.className = 'no-documents-message';
    noDocsMessage.textContent = 'No documents available';
    listContainer.appendChild(noDocsMessage);
  }
};

ChakraApp.DocumentController.prototype._getDocumentsForCircleType = function(circleTypeId) {
  var documents = [];
  
  ChakraApp.appState.documents.forEach(function(doc) {
    // Check if document's circleType property matches
    if (doc.circleType === circleTypeId) {
      documents.push(doc);
    }
  });
  
  return documents;
};
  
  /**
   * Create a list item for creating a new document
   * @private
   * @param {string} panelId - Panel ID
   * @returns {HTMLElement} New document list item
   */
ChakraApp.DocumentController.prototype._createNewDocumentListItem = function(circleTypeId) {
  var self = this;
  
  var listItem = document.createElement('div');
  listItem.className = 'document-list-item new-document-item';
  listItem.dataset.circleTypeId = circleTypeId;
  
  // Add icon
  var icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.innerHTML = '➕';  // Plus sign icon
  listItem.appendChild(icon);
  
  // Add text
  var name = document.createElement('span');
  name.className = 'document-name';
  name.textContent = 'New Document';
  listItem.appendChild(name);
  
  // Add click handler
  listItem.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Create a new document for this circle type
    var newDoc = {
      circleType: circleTypeId
    };
    
    // Create a new document
    var doc = ChakraApp.appState.addDocument(newDoc);
    
    // Select the new document
    ChakraApp.appState.selectDocument(doc.id, circleTypeId);
    
    // Update the UI
    self._updateDocumentList(circleTypeId);
    self._updateCurrentDocumentDisplay(circleTypeId);
    
    // Provide visual feedback
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
  
  /**
   * Create a document list item
   * @private
   * @param {Object} doc - Document model
   * @param {string} panelId - Panel ID
   * @returns {HTMLElement} Document list item
   */
// Fix the document selection handling in DocumentController.js
ChakraApp.DocumentController.prototype._createDocumentListItem = function(doc, circleTypeId) {
  var self = this;
  
  var listItem = document.createElement('div');
  listItem.className = 'document-list-item';
  listItem.dataset.id = doc.id;
  listItem.dataset.circleTypeId = circleTypeId;
  
  // Document icon
  var icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.innerHTML = '📄';
  listItem.appendChild(icon);
  
  // Document name container
  var nameContainer = document.createElement('div');
  nameContainer.className = 'document-name-container';
  
  // Document name
  var name = document.createElement('span');
  name.className = 'document-name';
  name.textContent = doc.name;
  nameContainer.appendChild(name);
  
  // Document circle count
  var circleCount = document.createElement('span');
  circleCount.className = 'document-circle-count';
  var count = this._getCircleCountForDocument(doc.id);
  circleCount.textContent = ' (' + count + ')';
  nameContainer.appendChild(circleCount);
  
  // Add name container to list item
  listItem.appendChild(nameContainer);
  
  // Click handler to select document
  listItem.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Select the document using the circle type ID
    ChakraApp.appState.selectDocument(doc.id, circleTypeId);
    
    // Update the UI
    self._updateDocumentList(circleTypeId);
    self._updateCurrentDocumentDisplay(circleTypeId);
  });
  
  return listItem;
};

// Ensure circleType is properly passed for selected documents as well
ChakraApp.DocumentController.prototype._createSelectedDocumentListItem = function(doc, circleTypeId) {
  var self = this;
  
  var listItem = document.createElement('div');
  listItem.className = 'document-list-item selected';
  listItem.dataset.id = doc.id;
  listItem.dataset.circleTypeId = circleTypeId;
  
  // Document icon
  var icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.innerHTML = '📄';
  listItem.appendChild(icon);
  
  // Document name container
  var nameContainer = document.createElement('div');
  nameContainer.className = 'document-name-container';
  
  // Document name (editable)
  var name = document.createElement('span');
  name.className = 'document-name editable';
  name.contentEditable = true;
  name.spellcheck = false;
  name.textContent = doc.name;
  nameContainer.appendChild(name);
  
  // Document circle count
  var circleCount = document.createElement('span');
  circleCount.className = 'document-circle-count';
  var count = this._getCircleCountForDocument(doc.id);
  circleCount.textContent = ' (' + count + ')';
  nameContainer.appendChild(circleCount);
  
  // Add name container to list item
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
  listItem.appendChild(deleteBtn);
  
  // Delete click handler
  deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Confirm before deleting
    if (confirm('Are you sure you want to delete this document? This will also delete all content within it.')) {
      ChakraApp.appState.removeDocument(doc.id);
      
      // Update UI
      self._updateDocumentList(circleTypeId);
      self._updateCurrentDocumentDisplay(circleTypeId);
    }
  });
  
  return listItem;
};
  
  /**
   * Create a selected document list item (with edit/delete options)
   * @private
   * @param {Object} doc - Document model
   * @param {string} panelId - Panel ID
   * @returns {HTMLElement} Selected document list item
   */
  ChakraApp.DocumentController.prototype._createSelectedDocumentListItem = function(doc, panelId) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item selected';
    listItem.dataset.id = doc.id;
    listItem.dataset.panelId = panelId;
    
    // Document icon
    var icon = document.createElement('span');
    icon.className = 'document-icon';
    icon.innerHTML = '📄';
    listItem.appendChild(icon);
    
    // Document name container
    var nameContainer = document.createElement('div');
    nameContainer.className = 'document-name-container';
    
    // Document name (editable)
    var name = document.createElement('span');
    name.className = 'document-name editable';
    name.contentEditable = true;
    name.spellcheck = false;
    name.textContent = doc.name;
    nameContainer.appendChild(name);
    
    // Document circle count
    var circleCount = document.createElement('span');
    circleCount.className = 'document-circle-count';
    var count = this._getCircleCountForDocument(doc.id);
    circleCount.textContent = ' (' + count + ')';
    nameContainer.appendChild(circleCount);
    
    // Add name container to list item
    listItem.appendChild(nameContainer);
    
    // Edit blur handler
    name.addEventListener('blur', function() {
      var newName = this.textContent.trim();
      if (newName && newName !== doc.name) {
        ChakraApp.appState.updateDocument(doc.id, { name: newName });
        self._updateCurrentDocumentDisplay(panelId);
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
    listItem.appendChild(deleteBtn);
    
    // Delete click handler
    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Confirm before deleting
      if (confirm('Are you sure you want to delete this document? This will also delete all content within it.')) {
        ChakraApp.appState.removeDocument(doc.id);
        
        // Update UI
        self._updateDocumentList(panelId);
        self._updateCurrentDocumentDisplay(panelId);
      }
    });
    
    return listItem;
  };
  
  /**
   * Update current document display for a panel
   * @private
   * @param {string} panelId - Panel ID
   */
  ChakraApp.DocumentController.prototype._updateCurrentDocumentDisplay = function(panelId) {
	  return;
    var docDisplay = this.currentDocumentDisplays[panelId];
    if (!docDisplay) return;
    
    var selectedId = ChakraApp.appState.selectedDocumentIds[panelId];
    var doc = ChakraApp.appState.getDocument(selectedId);
    
    if (doc) {
      var count = this._getCircleCountForDocument(doc.id);
      docDisplay.textContent = doc.name;
      docDisplay.title = 'Current Document: ' + doc.name + ' (' + count + ' circles)';
    } else {
      docDisplay.textContent = 'No Document Selected';
      docDisplay.title = 'No Document Selected';
    }
  };
  
  /**
   * Set up document event listeners
   * @private
   */
ChakraApp.DocumentController.prototype._setupDocumentEventListeners = function() {
  var self = this;
  
  // Listen for document selection events
  this.eventSubscriptions.documentSelected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.DOCUMENT_SELECTED,
    function(doc) {
      // Use the document's circle type
      var circleType = doc.circleType || 'standard';
      self._updateDocumentList(circleType);
      self._updateCurrentDocumentDisplay(circleType);
    }
  );
  
  // Listen for document update events
  this.eventSubscriptions.documentUpdated = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.DOCUMENT_UPDATED,
    function(doc) {
      var circleType = doc.circleType || 'standard';
      self._updateDocumentList(circleType);
      self._updateCurrentDocumentDisplay(circleType);
    }
  );
  
  // Listen for document list toggled events
  this.eventSubscriptions.documentListToggled = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED,
    function(data) {
      self._updateDocumentList(data.panelId);
      self._updateArrowIcon(data.panelId);
    }
  );
  
  // Listen for state loaded events
  this.eventSubscriptions.stateLoaded = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.STATE_LOADED,
    function() {
      // Update document lists for all circle types
      if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
          self._updateDocumentList(circleType.id);
          self._updateCurrentDocumentDisplay(circleType.id);
        });
      }
    }
  );
  
  // Listen for circle events that affect document display
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
    
      // Create document controls for circle types, not panels
      if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
          self._createDocumentControlsForPanel(circleType.id);
          self._updateDocumentList(circleType.id);
          self._updateCurrentDocumentDisplay(circleType.id);
        });
      }
    }
  );
};
  
  /**
   * Set up click outside handler for document lists
   * @private
   */
ChakraApp.DocumentController.prototype._setupClickOutsideHandler = function() {
  var self = this;
  
  // Create document click handler if it doesn't exist
  if (!this.documentClickHandler) {
    this.documentClickHandler = function(e) {
      // Check if any document lists are visible
      var listsVisible = false;
      var clickedCircleTypeId = null;
      
      // Find which circle type's document list was clicked, if any
      if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
          var typeId = circleType.id;
          if (ChakraApp.appState.documentListVisible[typeId]) {
            listsVisible = true;
            
            var listContainer = self.documentListContainers[typeId];
            var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
            
            // Check if click was inside this circle type's list or toggle button
            if (listContainer && listContainer.contains(e.target) ||
                toggleBtn && toggleBtn.contains(e.target)) {
              clickedCircleTypeId = typeId;
            }
          }
        });
      }
      
      // If any lists are visible and click was outside all lists and buttons, hide all lists
      if (listsVisible && !clickedCircleTypeId) {
        // Hide all visible document lists
        if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            var typeId = circleType.id;
            if (ChakraApp.appState.documentListVisible[typeId]) {
              // Hide this document list
              ChakraApp.appState.documentListVisible[typeId] = false;
              
              // Update UI
              self._updateDocumentList(typeId);
              
              // DIRECT FIX: Get the toggle button by ID and update its arrow
              var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
              if (toggleBtn) {
                var arrowIcon = toggleBtn.querySelector('.arrow-icon');
                if (arrowIcon) {
                  arrowIcon.innerHTML = '▼'; // Down arrow for closed state
                  console.log("Arrow updated to down position for type:", typeId);
                }
              } else {
                console.log("Toggle button not found for type:", typeId);
              }
              
              // Publish event
              ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
                panelId: typeId,
                visible: false
              });
            }
          });
        }
      }
    };
    
    // Add event listener
    document.addEventListener('click', this.documentClickHandler);
  }
};
  
  /**
   * Get circle count for a document
   * @private
   * @param {string} documentId - Document ID
   * @returns {number} Number of circles in the document
   */
ChakraApp.DocumentController.prototype._getCircleCountForDocument = function(documentId) {
  // Initialize counter
  var count = 0;
  
  // If no document ID, return 0
  if (!documentId) return count;
  
  // Get the document to determine its circle type
  var doc = ChakraApp.appState.getDocument(documentId);
  if (!doc) return count;
  
  var circleType = doc.circleType || 'standard';
  
  // Iterate through all circles and count those that:
  // 1. Belong to this document
  // 2. Match the document's circle type
  ChakraApp.appState.circles.forEach(function(circle) {
    if (circle.documentId === documentId && circle.circleType === circleType) {
      count++;
    }
  });
  
  return count;
};

ChakraApp.DocumentController.prototype._updateArrowIcon = function(typeId) {
  // Find the toggle button for this type
  var toggleBtn = this.toggleDocumentListBtns[typeId];
  if (!toggleBtn) return;
  
  // Get the current visibility state
  var isVisible = ChakraApp.appState.documentListVisible[typeId];
  
  // Update the arrow icon accordingly
  var arrowIcon = toggleBtn.querySelector('.arrow-icon');
  if (arrowIcon) {
    arrowIcon.innerHTML = isVisible ? '▲' : '▼';
  }
};
  
  /**
   * Clean up resources
   */
  ChakraApp.DocumentController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Remove document click handler
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickHandler = null;
    }
    
    // Clean up event subscriptions
    Object.keys(this.eventSubscriptions).forEach(function(key) {
      var unsubscribe = this.eventSubscriptions[key];
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }, this);
    
    // Clear subscriptions object
    this.eventSubscriptions = {};
    
    // Remove DOM elements
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
    
    // Clear DOM element references
    this.toggleDocumentListBtns = {};
    this.documentListContainers = {};
    this.currentDocumentDisplays = {};
  };
  
})(window.ChakraApp = window.ChakraApp || {});
