// src/controllers/DocumentController.js
(function(ChakraApp) {
  /**
   * Controls document-related UI elements and interactions
   */
  ChakraApp.DocumentController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.toggleDocumentListBtn = null;
    this.documentListContainer = null;
    this.currentDocumentDisplay = null;
    
    // Event handlers
    this.documentClickHandler = null;
    
    // Event subscriptions
    this.documentSelectedSubscription = null;
    this.documentUpdatedSubscription = null;
    this.documentListToggledSubscription = null;
    this.stateLoadedSubscription = null;
    this.circleCreatedSubscription = null;
    this.circleDeletedSubscription = null;
    this.circleUpdatedSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.DocumentController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.DocumentController.prototype.constructor = ChakraApp.DocumentController;
  
  // Initialize
  ChakraApp.DocumentController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Create UI elements
    this._createDocumentControls();
    
    // Add event listeners
    this._setupDocumentEventListeners();
    this._setupClickOutsideHandler();
    
    // Initialize document list
    this._updateDocumentList();
    this._updateCurrentDocumentDisplay();
  };
  
  /**
   * Create document controls (toggle button, list container, and current display)
   * @private
   */
  ChakraApp.DocumentController.prototype._createDocumentControls = function() {
    var self = this;
    
    // Create Toggle Arrow Button
    if (!this.toggleDocumentListBtn) {
      this.toggleDocumentListBtn = document.createElement('button');
      this.toggleDocumentListBtn.id = 'toggle-document-list-btn';
      this.toggleDocumentListBtn.className = 'add-btn toggle-btn';
      this.toggleDocumentListBtn.title = 'Toggle Document List';
      
      // Create arrow icon
      var arrowIcon = document.createElement('span');
      arrowIcon.innerHTML = '▼';
      arrowIcon.className = 'arrow-icon';
      this.toggleDocumentListBtn.appendChild(arrowIcon);
      
      // Position it
      this.toggleDocumentListBtn.style.top = '80px';
      this.toggleDocumentListBtn.style.left = '20px';
      
      // Add toggle functionality
      this.toggleDocumentListBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Toggle document list visibility
        var isVisible = ChakraApp.appState.toggleDocumentList();
        
        // Update arrow direction
        arrowIcon.innerHTML = isVisible ? '▲' : '▼';
        
        // Update document list
        self._updateDocumentList();
      });
      
      // Add to left panel
      var leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        leftPanel.appendChild(this.toggleDocumentListBtn);
      }
    }
    
    // Create Document List Container
    if (!this.documentListContainer) {
      this.documentListContainer = document.createElement('div');
      this.documentListContainer.id = 'document-list-container';
      this.documentListContainer.className = 'document-list-container';
      
      // Initially hidden
      this.documentListContainer.style.display = 'none';
      
      // Add to left panel
      var leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        leftPanel.appendChild(this.documentListContainer);
      }
    }
    
    // Create Current Document Display
    if (!this.currentDocumentDisplay) {
      this.currentDocumentDisplay = document.createElement('div');
      this.currentDocumentDisplay.id = 'current-document-display';
      this.currentDocumentDisplay.className = 'current-document-display';
      
      // Set initial text
      this.currentDocumentDisplay.textContent = 'No Document Selected';
      
      // Add to left panel
      var leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        leftPanel.appendChild(this.currentDocumentDisplay);
      }
    }
  };
  
  /**
   * Update document list display based on current state
   * @private
   */
  ChakraApp.DocumentController.prototype._updateDocumentList = function() {
    if (!this.documentListContainer) return;
    
    // Check visibility state
    var isVisible = ChakraApp.appState.documentListVisible;
    this.documentListContainer.style.display = isVisible ? 'block' : 'none';
    
    // If not visible, no need to update content
    if (!isVisible) return;
    
    // Clear existing list
    this.documentListContainer.innerHTML = '';
    
    // Add "New Document" option at the top of the list
    var newDocItem = this._createNewDocumentListItem();
    this.documentListContainer.appendChild(newDocItem);
    
    // Get all documents
    var documents = ChakraApp.appState.getAllDocuments();
    var selectedId = ChakraApp.appState.selectedDocumentId;
    
    // Create list items for each document
    var self = this;
    documents.forEach(function(doc) {
      var listItem = doc.id === selectedId ? 
        self._createSelectedDocumentListItem(doc) : 
        self._createDocumentListItem(doc);
      
      self.documentListContainer.appendChild(listItem);
    });
    
    // If no documents, show message
    if (documents.length === 0) {
      var noDocsMessage = document.createElement('div');
      noDocsMessage.className = 'no-documents-message';
      noDocsMessage.textContent = 'No documents available';
      this.documentListContainer.appendChild(noDocsMessage);
    }
  };
  
  /**
   * Create a list item for creating a new document
   * @private
   * @returns {HTMLElement} New document list item
   */
  ChakraApp.DocumentController.prototype._createNewDocumentListItem = function() {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item new-document-item';
    
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
      
      // Create a new document with default name (current date/time)
      var doc = ChakraApp.appState.addDocument();
      
      // Select the new document
      ChakraApp.appState.selectDocument(doc.id);
      
      // Update the UI
      self._updateDocumentList();
      self._updateCurrentDocumentDisplay();
      
      // Provide visual feedback
      var currentDocDisplay = document.getElementById('current-document-display');
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
   * @returns {HTMLElement} Document list item
   */
  ChakraApp.DocumentController.prototype._createDocumentListItem = function(doc) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item';
    listItem.dataset.id = doc.id;
    
    // Document icon
    var icon = document.createElement('span');
    icon.className = 'document-icon';
    icon.innerHTML = '📄';
    listItem.appendChild(icon);
    
    // Document name container - adding a container for better styling
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
      ChakraApp.appState.selectDocument(doc.id);
      
      // Update the UI
      self._updateDocumentList();
      self._updateCurrentDocumentDisplay();

      ChakraApp.appState.documentListVisible = false;
      self._updateDocumentList();

      var arrowIcon = self.toggleDocumentListBtn.querySelector('.arrow-icon');
      if (arrowIcon) {
	      arrowIcon.innerHTML = '▼';
      }
    });
    
    return listItem;
  };
  
  /**
   * Create a selected document list item (with edit/delete options)
   * @private
   * @param {Object} doc - Document model
   * @returns {HTMLElement} Selected document list item
   */
  ChakraApp.DocumentController.prototype._createSelectedDocumentListItem = function(doc) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item selected';
    listItem.dataset.id = doc.id;
    
    // Document icon
    var icon = document.createElement('span');
    icon.className = 'document-icon';
    icon.innerHTML = '📄';
    listItem.appendChild(icon);
    
    // Document name container for better styling
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
        self._updateCurrentDocumentDisplay();
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
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    });
    
    return listItem;
  };
  
  /**
   * Update current document display
   * @private
   */
  ChakraApp.DocumentController.prototype._updateCurrentDocumentDisplay = function() {
    if (!this.currentDocumentDisplay) return;
    
    var selectedId = ChakraApp.appState.selectedDocumentId;
    var doc = ChakraApp.appState.getDocument(selectedId);
    
    if (doc) {
      var count = this._getCircleCountForDocument(doc.id);
      this.currentDocumentDisplay.textContent = doc.name + ' (' + count + ')';
      this.currentDocumentDisplay.title = 'Current Document: ' + doc.name + ' (' + count + ' circles)';
    } else {
      this.currentDocumentDisplay.textContent = 'No Document Selected';
      this.currentDocumentDisplay.title = 'No Document Selected';
    }
  };
  
  /**
   * Set up document event listeners
   * @private
   */
  ChakraApp.DocumentController.prototype._setupDocumentEventListeners = function() {
    var self = this;
    
    // Listen for document selection events
    this.documentSelectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_SELECTED,
      function(doc) {
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    );
    
    // Listen for document update events
    this.documentUpdatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_UPDATED,
      function(doc) {
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    );
    
    // Listen for document list toggled events
    this.documentListToggledSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED,
      function(isVisible) {
        self._updateDocumentList();
      }
    );
    
    // Listen for state loaded events
    this.stateLoadedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.STATE_LOADED,
      function() {
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    );
    
    // Listen for circle events that affect document display
    this.circleCreatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_CREATED,
      function(circle) {
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    );
    
    this.circleDeletedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DELETED,
      function(circle) {
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    );
    
    this.circleUpdatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_UPDATED,
      function(circle) {
        self._updateDocumentList();
        self._updateCurrentDocumentDisplay();
      }
    );
  };
  
  /**
   * Set up click outside handler for document list
   * @private
   */
  ChakraApp.DocumentController.prototype._setupClickOutsideHandler = function() {
    var self = this;
    
    // Create document click handler if it doesn't exist
    if (!this.documentClickHandler) {
      this.documentClickHandler = function(e) {
        // Check if document list is visible
        if (ChakraApp.appState.documentListVisible) {
          // Check if click was outside the document list and toggle button
          var isOutsideList = !self.documentListContainer.contains(e.target);
          var isOutsideToggle = !self.toggleDocumentListBtn.contains(e.target);
          
          // If click was outside both elements, hide the document list
          if (isOutsideList && isOutsideToggle) {
            // Hide the document list
            ChakraApp.appState.documentListVisible = false;
            
            // Update UI
            self._updateDocumentList();
            
            // Update arrow icon
            var arrowIcon = self.toggleDocumentListBtn.querySelector('.arrow-icon');
            if (arrowIcon) {
              arrowIcon.innerHTML = '▼';
            }
            
            // Publish event
            ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, false);
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
    if (this.documentSelectedSubscription) {
      this.documentSelectedSubscription();
      this.documentSelectedSubscription = null;
    }
    
    if (this.documentUpdatedSubscription) {
      this.documentUpdatedSubscription();
      this.documentUpdatedSubscription = null;
    }
    
    if (this.documentListToggledSubscription) {
      this.documentListToggledSubscription();
      this.documentListToggledSubscription = null;
    }
    
    if (this.stateLoadedSubscription) {
      this.stateLoadedSubscription();
      this.stateLoadedSubscription = null;
    }
    
    if (this.circleCreatedSubscription) {
      this.circleCreatedSubscription();
      this.circleCreatedSubscription = null;
    }
    
    if (this.circleDeletedSubscription) {
      this.circleDeletedSubscription();
      this.circleDeletedSubscription = null;
    }
    
    if (this.circleUpdatedSubscription) {
      this.circleUpdatedSubscription();
      this.circleUpdatedSubscription = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
