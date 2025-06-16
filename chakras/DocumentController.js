// Enhanced DocumentController.js Part 1 - Constructor and Core Methods
(function(ChakraApp) {
  /**
   * Document controller - manages document lists and operations
   */
  ChakraApp.DocumentController = function() {
    ChakraApp.BaseController.call(this);
    
    // Existing properties from your current controller
    this.toggleDocumentListBtns = {};
    this.documentListContainers = {};
    this.currentDocumentDisplays = {};
    this.documentClickHandler = null;
    this.eventSubscriptions = {};
    
    // NEW: Search-related properties
    this.newDocumentBtns = {};
    this.documentSearchBoxes = {};
    this.documentSearchTimers = {};
  };
  
  // Inherit from BaseController
  ChakraApp.DocumentController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.DocumentController.prototype.constructor = ChakraApp.DocumentController;
  
  // Initialize - keeping your existing init logic
  ChakraApp.DocumentController.prototype.init = function() {
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Your existing initialization
    this._createDocumentControls();
    this._setupDocumentEventListeners();
    this._setupClickOutsideHandler();
    
    // NEW: Add search styles
    this._addDocumentListStyles();
    
    // Initialize document lists for each circle type
    var self = this;
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      self._updateDocumentList(circleType.id);
      self._updateCurrentDocumentDisplay(circleType.id);
    });
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
  
  // Keep your existing _createDocumentControls method
  ChakraApp.DocumentController.prototype._createDocumentControls = function() {
    var self = this;
    
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      self._createDocumentControlsForPanel(circleType.id);
    });
  };
  
  // Keep your existing _createDocumentControlsForPanel method
  ChakraApp.DocumentController.prototype._createDocumentControlsForPanel = function(circleTypeId) {
    var circleType = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    
    if (!circleType) {
      console.error('Invalid circle type ID:', circleTypeId);
      return;
    }
    
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
    
    // Create Current Document Display (keeping your existing logic)
    var docDisplay = document.createElement('div');
    docDisplay.id = 'current-document-display-' + circleTypeId;
    docDisplay.className = 'current-document-display';
    docDisplay.dataset.circleTypeId = circleTypeId;
    
    docDisplay.textContent = 'No Document Selected';
    
    // Position based on circle type (your existing positioning)
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
      docDisplay.style.top = '122px';
      docDisplay.style.left = '125px';
      docDisplay.style.color = circleType.color;
    } else {
      docDisplay.style.top = '54px';
      docDisplay.style.left = '-6px';
    }
  };

  // Enhanced DocumentController.js Part 2 - Search and List Management
  
  // Enhanced _updateDocumentList method with search functionality
  ChakraApp.DocumentController.prototype._updateDocumentList = function(circleTypeId) {
    if (!ChakraApp.Config.circleTypes.find(function(type) { return type.id === circleTypeId; })) {
      console.error('Invalid circle type ID:', circleTypeId);
      return;
    }
    
    var listContainer = this.documentListContainers[circleTypeId];
    
    if (!listContainer) {
      this._createDocumentControlsForPanel(circleTypeId);
      listContainer = this.documentListContainers[circleTypeId];
      
      if (!listContainer) {
        console.error('Failed to create document list container for circle type:', circleTypeId);
        return;
      }
    }
    
    var isVisible = ChakraApp.appState.documentListVisible[circleTypeId];
    listContainer.style.display = isVisible ? 'block' : 'none';
    
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
    header.textContent = typeName + ' Documents';
    listContainer.appendChild(header);
    
    // Add "New Document" option at the top
    var newDocItem = this._createNewDocumentListItem(circleTypeId);
    listContainer.appendChild(newDocItem);
    
    // NEW: Create search box
    var searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.className = 'document-search-box';
    searchBox.placeholder = 'Search documents...';
    searchBox.id = 'document-search-' + circleTypeId;
    listContainer.appendChild(searchBox);
    
    // Store search box reference and set up event handler
    this.documentSearchBoxes[circleTypeId] = searchBox;
    this._setupSearchBoxEventHandler(circleTypeId);
    
    // NEW: Create no results message
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
    
    // Apply current search if any
    this._refreshSearchResults(circleTypeId);
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
  ChakraApp.DocumentController.prototype._createNewDocumentListItem = function(circleTypeId) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'document-list-item new-document-item';
    listItem.dataset.circleTypeId = circleTypeId;
    
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
    
    // Add text
    var name = document.createElement('span');
    name.className = 'document-name';
    name.textContent = 'New Document';
    listItem.appendChild(name);
    
    // Hover effect
    listItem.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#45a049';
    });
    listItem.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '#4CAF50';
    });
    
    // Keep your existing click handler
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
      
      var newDoc = {
        circleType: circleTypeId
      };
      
      var doc = ChakraApp.appState.addDocument(newDoc);
      ChakraApp.appState.selectDocument(doc.id, circleTypeId);
      
      self._updateDocumentList(circleTypeId);
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
    //listItem.appendChild(icon);
    
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
    
    // Keep your existing click handler
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
      
      ChakraApp.appState.selectDocument(doc.id, circleTypeId);
      
      self._updateDocumentList(circleTypeId);
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
    //listItem.appendChild(icon);
    
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
    listItem.appendChild(deleteBtn);
    
    // Delete click handler
    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (confirm('Are you sure you want to delete this document? This will also delete all content within it.')) {
        ChakraApp.appState.removeDocument(doc.id);
        
        self._updateDocumentList(circleTypeId);
        self._updateCurrentDocumentDisplay(circleTypeId);
      }
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
  };
  
  // Keep all your existing utility methods
  ChakraApp.DocumentController.prototype._setupClickOutsideHandler = function() {
    var self = this;
    
    if (!this.documentClickHandler) {
      this.documentClickHandler = function(e) {
        var listsVisible = false;
        var clickedCircleTypeId = null;
        
        if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            var typeId = circleType.id;
            if (ChakraApp.appState.documentListVisible[typeId]) {
              listsVisible = true;
              
              var listContainer = self.documentListContainers[typeId];
              var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
              
              if (listContainer && listContainer.contains(e.target) ||
                  toggleBtn && toggleBtn.contains(e.target)) {
                clickedCircleTypeId = typeId;
              }
            }
          });
        }
        
        if (listsVisible && !clickedCircleTypeId) {
          if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
            ChakraApp.Config.circleTypes.forEach(function(circleType) {
              var typeId = circleType.id;
              if (ChakraApp.appState.documentListVisible[typeId]) {
                ChakraApp.appState.documentListVisible[typeId] = false;
                
                self._updateDocumentList(typeId);
                
                var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
                if (toggleBtn) {
                  var arrowIcon = toggleBtn.querySelector('.arrow-icon');
                  if (arrowIcon) {
                    arrowIcon.innerHTML = '▼';
                  }
                }
                
                ChakraApp.EventBus.publish(ChakraApp.EventTypes.DOCUMENT_LIST_TOGGLED, {
                  panelId: typeId,
                  visible: false
                });
              }
            });
          }
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
      if (timer) {
        clearTimeout(timer);
      }
    });
    
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
    this.documentSearchBoxes = {};
    this.documentSearchTimers = {};
  };
  
})(window.ChakraApp = window.ChakraApp || {});
