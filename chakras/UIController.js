// src/controllers/UIController.js - FIXED VERSION
(function(ChakraApp) {
  /**
   * UI controller - acts as a facade for specialized controllers
   */
  ChakraApp.UIController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.topPanel = null;
    this.chakraTitle = null;
    this.addCircleBtns = {};
    
    // Silhouette elements
    this.silhouetteOutline = null;
    this.silhouetteFilled = null;
    this.silhouetteFilledBlack = null;
    this.leftPanel = null;
    
    // Event subscriptions
    this.eventSubscriptions = {};
  };
  
  // Inherit from BaseController
  ChakraApp.UIController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.UIController.prototype.constructor = ChakraApp.UIController;
  
  // Initialize
  ChakraApp.UIController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    this._initializeDomElements();
    this._setupEventHandlers();
    this._addHeaderStyles();
    this._setupButtonHandlersPostCreation();
    
    // Initialize silhouette state
    this._updateSilhouetteVisibility(null);
  };
  
  /**
   * Initialize DOM elements
   * @private
   */
  ChakraApp.UIController.prototype._initializeDomElements = function() {
    // Get DOM elements
    this.topPanel = document.getElementById('top-panel');
    this.leftPanel = document.getElementById('left-panel');
    
    // Get silhouette SVG elements
    this.silhouetteOutline = document.getElementById('silhouette-outline');
    this.silhouetteFilled = document.getElementById('silhouette-filled');
    this.silhouetteFilledBlack = document.getElementById('silhouette-filled-black');
    
    // Get panel-specific add circle buttons
    var self = this;
    ChakraApp.appState.panels.forEach(function(panelId) {
      self.addCircleBtns[panelId] = document.getElementById('add-circle-btn-' + panelId);
    });
    
    // Create UI elements
    this._createChakraTitle();
    this._createMeridianLines();
    
    // Create headers container with all section headers and buttons
    this._createHeadersContainer();
  };

  ChakraApp.UIController.prototype._addHeaderStyles = function() {
    var style = document.createElement('style');
    style.textContent = `
      .headers-container {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      
      .header-section {
        display: flex;
        align-items: center;
      }
      
      .header-section h3 {
        margin: 0;
        white-space: nowrap;
      }
      
      .document-toggle-btn {
        font-size: 10px;
      }

      .document-toggle-btn, .add-btn.circle-btn {
        width: 17px;
        height: 17px;
        margin-right: 2px;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        background-color: var(--color-btn);
        color: #CCC;
        border: none;
        cursor: pointer;
        transition: background-color var(--transition-fast), transform var(--transition-fast);
      }
      
      .document-toggle-btn:hover, .add-btn.circle-btn:hover {
        background-color: var(--color-btn-hover);
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
  };
  
  /**
   * Set up event handlers
   * @private
   */
  ChakraApp.UIController.prototype._setupEventHandlers = function() {
    // Set up button handlers
    this._setupButtonHandlers();
    
    // Set up panel click handlers for deselection
    this._setupPanelClickHandlers();
    
    // Subscribe to events
    this._setupCircleEvents();
  };
  
  /**
   * Create chakra title element
   * @private
   */
  ChakraApp.UIController.prototype._createChakraTitle = function() {
    // Create title container if it doesn't exist
    if (!document.getElementById('chakra-title')) {
      this.chakraTitle = document.createElement('h3');
      this.chakraTitle.id = 'chakra-title';
      this.chakraTitle.className = 'chakra-title';
      this.chakraTitle.textContent = 'Storyboard';
      this.chakraTitle.style.position = 'relative';
      this.chakraTitle.style.paddingBottom = '0';
      this.chakraTitle.style.marginBottom = '0';
      
      // Add to top panel
      //this.topPanel.insertBefore(this.chakraTitle, this.topPanel.firstChild);
    } else {
      this.chakraTitle = document.getElementById('chakra-title');
    }
  };
  
  /**
   * Create meridian lines for each panel
   * @private
   */
  ChakraApp.UIController.prototype._createMeridianLines = function() {
    var self = this;
    
    // Create meridian lines for the left panel
    self._createMeridianLineForPanel('left');
  };
  
  /**
   * Create meridian line for a specific panel
   * @private
   * @param {string} panelId - Panel ID
   */
  ChakraApp.UIController.prototype._createMeridianLineForPanel = function(panelId) {
    // Create meridian line if it doesn't exist
    var meridianLineId = 'meridian-line-' + panelId;
    if (!document.getElementById(meridianLineId)) {
      var zoomContainer = document.getElementById('zoom-container-' + panelId);
      if (!zoomContainer) return;
      
      var meridianLine = document.createElement('div');
      meridianLine.id = meridianLineId;
      meridianLine.className = 'meridian-line';
      meridianLine.style.position = 'absolute';
      meridianLine.style.top = '0';
      meridianLine.style.left = ChakraApp.Config.meridian.x + 'px';
      meridianLine.style.width = '1px';
      meridianLine.style.height = '100%';
      meridianLine.style.backgroundColor = ChakraApp.Config.meridian.lineColor;
      meridianLine.style.zIndex = '2';
      meridianLine.style.pointerEvents = 'none';
      
      zoomContainer.appendChild(meridianLine);
    }
  };
  
  /**
   * Set up button handlers
   * @private
   */
  ChakraApp.UIController.prototype._setupButtonHandlers = function() {
    // This is intentionally empty now - all button handling is in _setupButtonHandlersPostCreation
    // We're overriding this method to ensure it doesn't attach any listeners
  };
  
  /**
   * Set up panel click handlers
   * @private
   */
  ChakraApp.UIController.prototype._setupPanelClickHandlers = function() {
    var self = this;
    
    // Set up click handlers for each circle panel
    ChakraApp.appState.panels.forEach(function(panelId) {
      var zoomContainer = document.getElementById('zoom-container-' + panelId);
      if (zoomContainer) {
        // Panel click - deselect circle
        zoomContainer.addEventListener('click', function(e) {
          // Only handle clicks directly on the panel (not on children)
          if (e.target === zoomContainer) {
            if (ChakraApp.appState.selectedCircleId) {
              ChakraApp.appState.deselectCircle();
            }
          }
        });
      }
    });
    
    // Center panel click - deselect square and clear multi-selection
    var centerPanel = document.getElementById('center-panel');
    if (centerPanel) {
	    centerPanel.addEventListener('click', function(e) {
		    // Only handle clicks directly on the panel (not on children)
		    if (e.target === centerPanel) {
			    if (ChakraApp.appState.selectedSquareId) {
				    ChakraApp.appState.deselectSquare();
			    }

			    if (ChakraApp.appState.selectedCircleReferenceId) {
				    ChakraApp.appState.deselectCircleReference();
			    }

			    // Ensure multi-selection is cleared even if no primary square is selected
			    if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
				    ChakraApp.MultiSelectionManager.clearSelection();
			    }
		    }
	    });
    }
  };

  /**
   * Set up circle event listeners
   * @private
   */
  ChakraApp.UIController.prototype._setupCircleEvents = function() {
    this.eventSubscriptions.circleSelected = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      this._handleCircleSelected.bind(this)
    );
    
    this.eventSubscriptions.circleUpdated = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_UPDATED,
      this._handleCircleUpdated.bind(this)
    );
    
    this.eventSubscriptions.circleDeselected = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      this._handleCircleDeselected.bind(this)
    );
  };
  
  /**
   * Handle circle selection event
   * @private
   * @param {Object} circle - Selected circle
   */
  ChakraApp.UIController.prototype._handleCircleSelected = function(circle) {
    this._updateChakraTitle(circle.name);
    
    // Show the center panel
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
      ChakraApp.app.controllers.panel.showPanel('center');
    }
    
    // Update silhouette visibility based on the selected circle
    this._updateSilhouetteVisibility(circle);
  };
  
  /**
   * Handle circle update event
   * @private
   * @param {Object} circle - Updated circle
   */
  ChakraApp.UIController.prototype._handleCircleUpdated = function(circle) {
    if (circle.id === ChakraApp.appState.selectedCircleId) {
      this._updateChakraTitle(circle.name);
      
      // Update silhouette visibility in case the circle's type changed
      this._updateSilhouetteVisibility(circle);
    }
  };
  
  /**
   * Handle circle deselection event
   * @private
   */
  ChakraApp.UIController.prototype._handleCircleDeselected = function() {
    this._updateChakraTitle(null);
    
    // Reset silhouette visibility when no circle is selected
    this._updateSilhouetteVisibility(null);
  };
  
  /**
   * Update silhouette visibility based on the selected circle
   * @private
   * @param {Object|null} circle - The selected circle or null if no circle is selected
   */
  ChakraApp.UIController.prototype._updateSilhouetteVisibility = function(circle) {
    if (!this.silhouetteOutline || !this.silhouetteFilled || !this.silhouetteFilledBlack || !this.leftPanel) {
      return;
    }
    
    // Default state: Only show outline, hide filled versions, reset background
    this._setSilhouetteVisibility(true, false, false);
    this._setLeftPanelBackground('');
    
    if (!circle) {
      return; // No circle selected, use default state
    }
    
    // Determine if this is a "things" type circle
    const isThingsCircle = this._isThingsCircle(circle);
    const isLeftCircle = this._isLeftCircle(circle);
    
    if (isThingsCircle) {
      // Show black filled silhouette for "things" circle
      this._setSilhouetteVisibility(true, false, true);
      this._setLeftPanelBackground('rgba(255, 255, 255, 0.1)');
    } else if (isLeftCircle) {
      // Show colored filled silhouette for "left" type circle
      this._setSilhouetteVisibility(true, true, false);
    }
  };
  
  /**
   * Determine if a circle is a "things" type circle
   * @private
   * @param {Object} circle - Circle to check
   * @return {boolean} True if it's a "things" type circle
   */
  ChakraApp.UIController.prototype._isThingsCircle = function(circle) {
    // First check if the circle has a panelId property directly
    if (circle.panelId === 'things') {
      return true;
    }
    
    // If no direct panelId, check if the circle's document is a "things" document
    const document = ChakraApp.appState.getDocument(circle.documentId);
    if (document && document.panelId === 'things') {
      return true;
    }
    
    // Check if the circle has characteristics that indicate it's a things circle
    // This is based on the triangle shape mentioned in the code for "things" circles
    if (circle.characteristics && circle.characteristics.completion === "level2") {
      return true;
    }
    
    return false;
  };
  
  ChakraApp.UIController.prototype._isLeftCircle = function(circle) {
    if (circle.panelId === 'left') {
      return true;
    }
    
    const document = ChakraApp.appState.getDocument(circle.documentId);
    if (document && document.panelId === 'left') {
      return true;
    }

    return false;
  };

  /**
   * Set visibility of silhouette SVG elements
   * @private
   * @param {boolean} showOutline - Whether to show the outline silhouette
   * @param {boolean} showFilled - Whether to show the filled silhouette
   * @param {boolean} showFilledBlack - Whether to show the black filled silhouette
   */
  ChakraApp.UIController.prototype._setSilhouetteVisibility = function(showOutline, showFilled, showFilledBlack) {
    // SVG objects are inside <object> tags, so we need to access their contentDocument
    // However, we can control visibility of the <object> elements themselves
    
    // The silhouette outline should always be visible as a background
    if (this.silhouetteOutline) {
      this.silhouetteOutline.style.display = showOutline ? 'block' : 'none';
    }
    
    if (this.silhouetteFilled) {
      this.silhouetteFilled.style.display = showFilled ? 'block' : 'none';
    }
    
    if (this.silhouetteFilledBlack) {
      this.silhouetteFilledBlack.style.display = showFilledBlack ? 'block' : 'none';
    }
  };
  
  /**
   * Set left panel background color
   * @private
   * @param {string} backgroundColor - CSS background color
   */
  ChakraApp.UIController.prototype._setLeftPanelBackground = function(backgroundColor) {
    if (this.leftPanel) {
      this.leftPanel.style.backgroundColor = backgroundColor;
    }
  };
  
  /**
   * Update chakra title
   * @private
   * @param {string} circleName - Circle name
   */
  ChakraApp.UIController.prototype._updateChakraTitle = function(circleName) {
    if (!this.chakraTitle) return;
    
    if (!circleName || circleName === ChakraApp.Config.defaultName) {
      this.chakraTitle.textContent = 'Storyboard';
      this.chakraTitle.classList.remove('visible');
    } else {
      this.chakraTitle.textContent = circleName;
      this.chakraTitle.classList.add('visible');
    }
  };
  
  /**
   * Show delete dialog - delegate to DialogController
   * @private
   * @param {Function} onConfirm - Confirmation callback
   */
  ChakraApp.UIController.prototype._showDeleteDialog = function(onConfirm) {
    // Delegate to dialog controller if available
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.dialog) {
      ChakraApp.app.controllers.dialog.showConfirmDialog('Are you sure you want to delete this item?', onConfirm);
    } else {
      // Fallback to simple confirm
      if (confirm('Are you sure you want to delete this item?')) {
        onConfirm();
      }
    }
  };

ChakraApp.UIController.prototype._createHeadersContainer = function() {
  // Create headers container
  this.headersContainer = document.createElement('div');
  this.headersContainer.id = 'headers-container';
  this.headersContainer.className = 'headers-container';
  this.headersContainer.style.position = 'absolute';
  this.headersContainer.style.bottom = '10px';
  this.headersContainer.style.left = '10px';
  this.headersContainer.style.zIndex = '20';
  
  // Define our sections based on circle types instead of panels
  var circleTypes = ChakraApp.Config.circleTypes.map(type => ({
    id: type.id,
    name: type.name,
    color: type.color
  }));
  
  // Create a section for each header
  var self = this;
  circleTypes.forEach(function(circleType, index) {
    self._createHeaderSection(circleType, index);
  });
  
  // Add to left panel
  this.leftPanel.appendChild(this.headersContainer);
};
  

  // Create an individual header section with its buttons
  ChakraApp.UIController.prototype._createHeaderSection = function(section, index) {
    var sectionContainer = document.createElement('div');
    sectionContainer.className = 'header-section';
    sectionContainer.style.display = 'flex';
    sectionContainer.style.alignItems = 'center';
    sectionContainer.style.marginBottom = '0';
    
    // Create toggle document list button
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-document-list-btn-' + section.id;
    toggleBtn.className = 'document-toggle-btn';
    toggleBtn.title = 'Toggle Document List for ' + section.name;
    toggleBtn.dataset.panelId = section.id;
    toggleBtn.style.position = 'relative';
    toggleBtn.style.top = '0';
    toggleBtn.style.left = '0';
    toggleBtn.style.marginRight = '5px';
    
    if (section.id !== 'left') {
      toggleBtn.style.backgroundColor = '#666';
    }
    
    // Create arrow icon - only create one and empty the button first
    toggleBtn.innerHTML = ''; // Clear any existing content
    var arrowIcon = document.createElement('span');
    arrowIcon.innerHTML = '▼';
    arrowIcon.className = 'arrow-icon';
    toggleBtn.appendChild(arrowIcon);
    
    // Create add circle button
    var addBtn = document.createElement('button');
    addBtn.id = 'add-circle-btn-' + section.id;
    addBtn.className = 'add-btn circle-btn';
    addBtn.dataset.panelId = section.id;
    addBtn.textContent = '+';
    addBtn.title = 'Add Circle to ' + section.name;
    addBtn.style.position = 'relative';
    addBtn.style.top = '0';
    addBtn.style.left = '0';
    addBtn.style.marginRight = '5px';
    
    if (section.id !== 'left') {
      addBtn.style.backgroundColor = '#666';
    }
    
    // Create header text
    var header = document.createElement('h3');
    header.textContent = section.name;
    header.style.position = 'relative';
    header.style.margin = '0';
    header.style.padding = '0';
    header.style.top = '0';
    header.style.color = '#666';
    
    // Add elements to section container
    sectionContainer.appendChild(toggleBtn);
    sectionContainer.appendChild(addBtn);
    sectionContainer.appendChild(header);
    
    // Add section to headers container
    this.headersContainer.appendChild(sectionContainer);
    
    // Store button references for DocumentController to use
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
      ChakraApp.app.controllers.document.toggleDocumentListBtns[section.id] = toggleBtn;
    }
    
    // Store add button references
    this.addCircleBtns[section.id] = addBtn;
  };

ChakraApp.UIController.prototype._setupButtonHandlersPostCreation = function() {
  var self = this;
  
  // Process each circle type button
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    var typeId = circleType.id;
    
    // Handle add circle buttons
    var addBtn = document.getElementById('add-circle-btn-' + typeId);
    if (addBtn) {
      var newAddBtn = addBtn.cloneNode(false);
      newAddBtn.textContent = '+';
      
      if (addBtn.parentNode) {
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
      }
      
      // Update reference
      self.addCircleBtns[typeId] = newAddBtn;
      
      // Add click handler
      newAddBtn.addEventListener('click', function(e) {
	      e.stopPropagation();
  
  // Ensure document for circle type
  self._ensureDocumentForCircleType(typeId);
  
  // Create a new circle
  var circleData = {
    circleType: typeId, // Set the circle type explicitly
    color: circleType.color
  };
  
  // Add the circle with the appropriate type
  var circle = ChakraApp.appState.addCircle(circleData);
  
      });
    }
    
    // Handle document toggle buttons (rest of the function remains the same)
    var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
    if (toggleBtn) {
      var newToggleBtn = toggleBtn.cloneNode(true);
      
      if (toggleBtn.parentNode) {
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
      }
      
      // Update reference in DocumentController if needed
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
        ChakraApp.app.controllers.document.toggleDocumentListBtns[typeId] = newToggleBtn;
      }
      
      // Add click handler
      newToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Toggle document list for this circle type
        ChakraApp.appState.toggleDocumentList(typeId);
        
        // Update arrow icon
        var arrowIcon = this.querySelector('.arrow-icon');
        if (arrowIcon) {
          arrowIcon.innerHTML = ChakraApp.appState.documentListVisible[typeId] ? '▲' : '▼';
        }
        
        // Update document list - call through to DocumentController
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._updateDocumentList(typeId);
        }
      });
    }
  });
};

ChakraApp.UIController.prototype._ensureDocumentForCircleType = function(typeId) {
  // Get documents for this circle type
  var docs = ChakraApp.appState.getDocumentsForCircleType(typeId);
  
  if (docs.length === 0) {
    // Find the circle type configuration
    var circleTypeConfig = null;
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
        return type.id === typeId;
      });
    }
    
    // Create a new document for this circle type
    var docName = circleTypeConfig ? circleTypeConfig.name + " Document" : "New Document";
    
    var newDoc = ChakraApp.appState.addDocument({
      name: docName,
      circleType: typeId
    });
    
    ChakraApp.appState.selectDocument(newDoc.id, typeId);
  } else {
    // Select the first document if not already selected
    if (!ChakraApp.appState.selectedDocumentIds[typeId]) {
      ChakraApp.appState.selectDocument(docs[0].id, typeId);
    }
  }
};
  
  /**
   * Clean up resources
   */
  ChakraApp.UIController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up event subscriptions
    Object.values(this.eventSubscriptions).forEach(function(unsubscribe) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    // Clear subscriptions object
    this.eventSubscriptions = {};
  };
  
})(window.ChakraApp = window.ChakraApp || {});
