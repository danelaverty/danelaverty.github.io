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
    
    // Create UI elements for each panel
    this._createDocumentControls();
    
    // Add event listeners
    this._setupDocumentEventListeners();
    this._setupClickOutsideHandler();
    
    // Initialize document lists for each panel
    var self = this;
    ChakraApp.appState.panels.forEach(function(panelId) {
      self._updateDocumentList(panelId);
      self._updateCurrentDocumentDisplay(panelId);
    });
  };
  
  /**
   * Create document controls (toggle button, list container, and current display) for each panel
   * @private
   */
  ChakraApp.DocumentController.prototype._createDocumentControls = function() {
    var self = this;
    
    // Create controls for each panel
    ChakraApp.appState.panels.forEach(function(panelId) {
      self._createDocumentControlsForPanel(panelId);
    });
  };
  
  /**
   * Create document controls for a specific panel
   * @private
   * @param {string} panelId - Panel ID
   */
  ChakraApp.DocumentController.prototype._createDocumentControlsForPanel = function(panelId) {
    var panel = document.querySelector('.circle-panel[data-panel-id="' + panelId + '"]');
    if (!panel) return;
    
    // Create Toggle Arrow Button
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-document-list-btn-' + panelId;
    toggleBtn.className = 'add-btn document-toggle-btn';
    toggleBtn.title = 'Toggle Document List';
    toggleBtn.dataset.panelId = panelId;
    
    // Create arrow icon
    var arrowIcon = document.createElement('span');
    arrowIcon.innerHTML = '▼';
    arrowIcon.className = 'arrow-icon';
    toggleBtn.appendChild(arrowIcon);
    
    // Position based on panel
      toggleBtn.style.top = '30px';
      toggleBtn.style.left = '10px';
    
    // Add toggle functionality
    var self = this;
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Toggle document list visibility for this panel
      var isVisible = ChakraApp.appState.toggleDocumentList(panelId);
      
      // Update arrow direction
      arrowIcon.innerHTML = isVisible ? '▲' : '▼';
      
      // Update document list
      self._updateDocumentList(panelId);
    });
    
    // Add to panel
    panel.appendChild(toggleBtn);
    this.toggleDocumentListBtns[panelId] = toggleBtn;
    
    // Create Document List Container
    var listContainer = document.createElement('div');
    listContainer.id = 'document-list-container-' + panelId;
    listContainer.className = 'document-list-container';
    listContainer.dataset.panelId = panelId;
    
    // Initially hidden
    listContainer.style.display = 'none';
    
    // Position based on panel
    if (panelId === 'bottom') {
      listContainer.style.left = '70px';
      listContainer.style.top = '70px';
    }
    
    // Add to panel
    panel.appendChild(listContainer);
    this.documentListContainers[panelId] = listContainer;
    
    // Create Current Document Display
    var docDisplay = document.createElement('div');
    docDisplay.id = 'current-document-display-' + panelId;
    docDisplay.className = 'current-document-display';
    docDisplay.dataset.panelId = panelId;
    
    // Set initial text
    docDisplay.textContent = 'No Document Selected';
    
    // Add to panel
    panel.appendChild(docDisplay);
    this.currentDocumentDisplays[panelId] = docDisplay;
  };
  
  /**
   * Update document list display for a panel
   * @private
   * @param {string} panelId - Panel ID
   */
  ChakraApp.DocumentController.prototype._updateDocumentList = function(panelId) {
    var listContainer = this.documentListContainers[panelId];
    if (!listContainer) return;
    
    // Check visibility state
    var isVisible = ChakraApp.appState.documentListVisible[panelId];
    listContainer.style.display = isVisible ? 'block' : 'none';
    
    // If not visible, no need to update content
    if (!isVisible) return;
    
    // Clear existing list
    listContainer.innerHTML = '';
    
    // Add "New Document" option at the top of the list
    var newDocItem = this._createNewDocumentListItem(panelId);
    listContainer.appendChild(newDocItem);
    
    // Get all documents for this panel
    var documents = ChakraApp.appState.getDocumentsForPanel(panelId);
    var selectedId = ChakraApp.appState.selectedDocumentIds[panelId];
    
    // Create list items for each document
    var self = this;
    documents.forEach(function(doc) {
      var listItem = doc.id === selectedId ? 
        self._createSelectedDocumentListItem(doc, panelId) : 
        self._createDocumentListItem(doc, panelId);
      
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
  
  /**
   * Create a list item for creating a new document
   * @private
   * @param {string} panelId - Panel ID
   * @returns {HTMLElement} New document list item
   */
  ChakraApp.DocumentController.prototype._createNewDocumentListItem = function(panelId) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item new-document-item';
    listItem.dataset.panelId = panelId;
    
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
      
      // Create a new document with default name for this panel
      var doc = ChakraApp.appState.addDocument(null, panelId);
      
      // Select the new document
      ChakraApp.appState.selectDocument(doc.id, panelId);
      
      // Update the UI
      self._updateDocumentList(panelId);
      self._updateCurrentDocumentDisplay(panelId);
      
      // Provide visual feedback
      var currentDocDisplay = self.currentDocumentDisplays[panelId];
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
  ChakraApp.DocumentController.prototype._createDocumentListItem = function(doc, panelId) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item';
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
      
      // Select the document
      ChakraApp.appState.selectDocument(doc.id, panelId);
      
      // Update the UI
      self._updateDocumentList(panelId);
      self._updateCurrentDocumentDisplay(panelId);
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
    var docDisplay = this.currentDocumentDisplays[panelId];
    if (!docDisplay) return;
    
    var selectedId = ChakraApp.appState.selectedDocumentIds[panelId];
    var doc = ChakraApp.appState.getDocument(selectedId);
    
    if (doc) {
      var count = this._getCircleCountForDocument(doc.id);
      docDisplay.textContent = doc.name + ' (' + count + ')';
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
        self._updateDocumentList(doc.panelId);
        self._updateCurrentDocumentDisplay(doc.panelId);
      }
    );
    
    // Listen for document update events
    this.eventSubscriptions.documentUpdated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_UPDATED,
      function(doc) {
        self._updateDocumentList(doc.panelId);
        self._updateCurrentDocumentDisplay(doc.panelId);
      }
    );
    
    // Listen for document list toggled events
    this.eventSubscriptions.documentListToggled = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED,
      function(data) {
        self._updateDocumentList(data.panelId);
      }
    );
    
    // Listen for state loaded events
    this.eventSubscriptions.stateLoaded = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.STATE_LOADED,
      function() {
        ChakraApp.appState.panels.forEach(function(panelId) {
          self._updateDocumentList(panelId);
          self._updateCurrentDocumentDisplay(panelId);
        });
      }
    );
    
    // Listen for circle events that affect document display
    this.eventSubscriptions.circleCreated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_CREATED,
      function(circle) {
        var doc = ChakraApp.appState.getDocument(circle.documentId);
        if (doc) {
          self._updateDocumentList(doc.panelId);
          self._updateCurrentDocumentDisplay(doc.panelId);
        }
      }
    );
    
    this.eventSubscriptions.circleDeleted = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DELETED,
      function(circle) {
        var doc = ChakraApp.appState.getDocument(circle.documentId);
        if (doc) {
          self._updateDocumentList(doc.panelId);
          self._updateCurrentDocumentDisplay(doc.panelId);
        }
      }
    );

    this.eventSubscriptions.panelsCreated = ChakraApp.EventBus.subscribe(
		    ChakraApp.EventTypes.PANELS_CREATED,
		    function(data) {
			    if (!data || !data.panels || !Array.isArray(data.panels)) return;
    
    // Create document controls for newly created panels
    data.panels.forEach(function(panelId) {
      self._createDocumentControlsForPanel(panelId);
      self._updateDocumentList(panelId);
      self._updateCurrentDocumentDisplay(panelId);
    });
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
        var clickedPanelId = null;
        
        // Find which panel's document list was clicked, if any
        ChakraApp.appState.panels.forEach(function(panelId) {
          if (ChakraApp.appState.documentListVisible[panelId]) {
            listsVisible = true;
            
            var listContainer = self.documentListContainers[panelId];
            var toggleBtn = self.toggleDocumentListBtns[panelId];
            
            // Check if click was inside this panel's list or toggle button
            if (listContainer && listContainer.contains(e.target) ||
                toggleBtn && toggleBtn.contains(e.target)) {
              clickedPanelId = panelId;
            }
          }
        });
        
        // If any lists are visible and click was outside all lists and buttons, hide all lists
        if (listsVisible && !clickedPanelId) {
          ChakraApp.appState.panels.forEach(function(panelId) {
            if (ChakraApp.appState.documentListVisible[panelId]) {
              // Hide this document list
              ChakraApp.appState.documentListVisible[panelId] = false;
              
              // Update arrow icon
              var arrowIcon = self.toggleDocumentListBtns[panelId].querySelector('.arrow-icon');
              if (arrowIcon) {
                arrowIcon.innerHTML = '▼';
              }
              
              // Update UI
              self._updateDocumentList(panelId);
              
              // Publish event
              ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
                panelId: panelId,
                visible: false
              });
            }
          });
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
    
    // Iterate through all circles and count those that belong to this document
    ChakraApp.appState.circles.forEach(function(circle) {
      if (circle.documentId === documentId) {
        count++;
      }
    });
    
    return count;
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
