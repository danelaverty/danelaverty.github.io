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

         .template-toggle-btn {
        font-size: 10px;
        width: 14px;
        height: 14px;
        margin-right: 2px;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        background-color: #444;
        color: #BBB;
        border: none;
        cursor: pointer;
        transition: background-color var(--transition-fast), transform var(--transition-fast);
        padding: 0;
      }

      .template-toggle-btn:hover {
        background-color: #999;
        transform: scale(1.05);
      }

      /* Use Template Button Styles */
      .use-template-btn {
	      position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 7px;
    background-color: #777;
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    transition: all 0.3s ease;
    z-index: 200;
      }

      .use-template-btn:hover {
        background-color: #45a049;
        transform: translateX(-50%) translateY(-2px);
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
      }

      .use-template-btn:active {
        transform: translateX(-50%) scale(0.95);
      }

      .use-template-btn.visible {
        display: block;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

        /* Mini-icon styles */
      .circle-type-mini-icon {
        width: 12px;
        height: 12px;
        margin-right: 4px;
        margin-left: 2px;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* Standard circle mini-icon */
      .mini-icon-standard {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #666;
        box-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
	      -webkit-filter: blur(1px);
      }

      /* Triangle mini-icon */
      .mini-icon-triangle {
        width: 10px;
        height: 10px;
        background-color: #666;
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
      }

      /* Star mini-icon */
      .mini-icon-star {
        width: 10px;
        height: 10px;
        background-color: #666;
        clip-path: polygon(10% 10%, 90% 50%, 10% 90%);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
      }

      /* Gem mini-icon */
      .mini-icon-gem {
        width: 10px;
        height: 10px;
        background-color: #666;
        clip-path: polygon(50% 0%, 80% 10%, 100% 35%, 82% 70%, 50% 100%, 18% 70%, 0% 35%, 20% 10%);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
      }

      /* Hexagon cluster mini-icon */
      .mini-icon-hexagon {
        width: 12px;
        height: 12px;
        position: relative;
      }

      .mini-icon-hexagon .cluster-mini-standard {
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background-color: #666;
        left: 50%;
        top: 10%;
        transform: translateX(-50%);
      }

      .mini-icon-hexagon .cluster-mini-triangle {
        position: absolute;
        width: 3px;
        height: 3px;
        background-color: #666;
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        left: 20%;
        top: 70%;
        transform: translateX(-50%);
      }

      .mini-icon-hexagon .cluster-mini-star {
        position: absolute;
        width: 3px;
        height: 3px;
        background-color: #666;
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        left: 80%;
        top: 70%;
        transform: translateX(-50%);
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
        padding: 0; /* Add this to ensure proper centering */
      }

      /* Adjust mini-icon styles for use in buttons */
      .add-btn.circle-btn .circle-type-mini-icon {
        width: 12px;
        height: 12px;
        margin: 0; /* Remove margins when used in buttons */
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* Make mini-icons slightly smaller and lighter colored for buttons */
      .add-btn.circle-btn .mini-icon-standard {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #CCC;
        box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
      }

      .add-btn.circle-btn .mini-icon-triangle {
        width: 8px;
        height: 8px;
        background-color: #CCC;
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.5));
      }

      .add-btn.circle-btn .mini-icon-star {
        width: 8px;
        height: 8px;
        background-color: #CCC;
        clip-path: polygon(10% 10%, 90% 50%, 10% 90%);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.5));
      }

      .add-btn.circle-btn .mini-icon-gem {
        width: 8px;
        height: 8px;
        background-color: #CCC;
        clip-path: polygon(50% 0%, 80% 10%, 100% 35%, 82% 70%, 50% 100%, 18% 70%, 0% 35%, 20% 10%);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.5));
      }

      .add-btn.circle-btn .mini-icon-hexagon {
        width: 10px;
        height: 10px;
        position: relative;
      }

      .add-btn.circle-btn .cluster-mini-standard {
        position: absolute;
        width: 2px;
        height: 2px;
        border-radius: 50%;
        background-color: #CCC;
        left: 50%;
        top: 15%;
        transform: translateX(-50%);
      }

      .add-btn.circle-btn .cluster-mini-triangle {
        position: absolute;
        width: 2px;
        height: 2px;
        background-color: #CCC;
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        left: 25%;
        top: 70%;
        transform: translateX(-50%);
      }

      .add-btn.circle-btn .cluster-mini-star {
        position: absolute;
        width: 2px;
        height: 2px;
        background-color: #CCC;
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        left: 75%;
        top: 70%;
        transform: translateX(-50%);
      }
    `;
    document.head.appendChild(style);
  };
  
  ChakraApp.UIController.prototype._createMiniIcon = function(circleType) {
    var iconContainer = document.createElement('div');
    iconContainer.className = 'circle-type-mini-icon';
    
    switch (circleType) {
      case 'standard':
        var standardIcon = document.createElement('div');
        standardIcon.className = 'mini-icon-standard';
        iconContainer.appendChild(standardIcon);
        break;
        
      case 'triangle':
        var triangleIcon = document.createElement('div');
        triangleIcon.className = 'mini-icon-triangle';
        iconContainer.appendChild(triangleIcon);
        break;
        
      case 'star':
        var starIcon = document.createElement('div');
        starIcon.className = 'mini-icon-star';
        iconContainer.appendChild(starIcon);
        break;
        
      case 'gem':
        var gemIcon = document.createElement('div');
        gemIcon.className = 'mini-icon-gem';
        iconContainer.appendChild(gemIcon);
        break;
        
      case 'hexagon':
        var hexagonIcon = document.createElement('div');
        hexagonIcon.className = 'mini-icon-hexagon';
        
        // Create mini cluster elements
        var miniStandard = document.createElement('div');
        miniStandard.className = 'cluster-mini-standard';
        
        var miniTriangle = document.createElement('div');
        miniTriangle.className = 'cluster-mini-triangle';
        
        var miniStar = document.createElement('div');
        miniStar.className = 'cluster-mini-star';
        
        hexagonIcon.appendChild(miniStandard);
        hexagonIcon.appendChild(miniTriangle);
        hexagonIcon.appendChild(miniStar);
        
        iconContainer.appendChild(hexagonIcon);
        break;
        
      default:
        // Fallback to standard icon
        var defaultIcon = document.createElement('div');
        defaultIcon.className = 'mini-icon-standard';
        iconContainer.appendChild(defaultIcon);
        break;
    }
    
    return iconContainer;
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

    this._setupTemplateEvents();
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
      //meridianLine.style.backgroundColor = ChakraApp.Config.meridian.lineColor;
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
  toggleBtn.style.backgroundColor = 'black';
  toggleBtn.style.fontSize = '7px';
  toggleBtn.style.color = '#777';
  
  // Create arrow icon
  toggleBtn.innerHTML = '';
  var arrowIcon = document.createElement('span');
  arrowIcon.innerHTML = '▼';
  arrowIcon.className = 'arrow-icon';
  toggleBtn.appendChild(arrowIcon);
  
  var toggleBtn2 = document.createElement('button');
  toggleBtn2.id = 'toggle-document-list-btn2-' + section.id;
  toggleBtn2.className = 'document-toggle-btn';
  toggleBtn2.title = 'Toggle Document List for ' + section.name;
  toggleBtn2.dataset.panelId = section.id;
  toggleBtn2.style.position = 'relative';
  toggleBtn2.style.top = '0';
  toggleBtn2.style.left = '0';
  toggleBtn2.style.marginRight = '5px';
  toggleBtn2.style.backgroundColor = 'black';
  toggleBtn2.style.fontSize = '7px';
  toggleBtn2.style.color = '#777';
  
  // Create arrow icon
  toggleBtn2.innerHTML = '';
  var arrowIcon2 = document.createElement('span');
  arrowIcon2.innerHTML = '▼';
  arrowIcon2.className = 'arrow-icon';
  toggleBtn2.appendChild(arrowIcon2);

  // Create toggle template list button
  var templateToggleBtn = document.createElement('button');
  templateToggleBtn.id = 'toggle-template-list-btn-' + section.id;
  templateToggleBtn.className = 'template-toggle-btn';
  templateToggleBtn.title = 'Toggle Template List for ' + section.name;
  templateToggleBtn.dataset.panelId = section.id;
  templateToggleBtn.style.position = 'relative';
  templateToggleBtn.style.top = '0';
  templateToggleBtn.style.left = '0';
  templateToggleBtn.style.marginLeft = '5px';
  templateToggleBtn.style.backgroundColor = '#444';
  templateToggleBtn.style.fontSize = '7px';
  templateToggleBtn.style.color = '#BBB';
  
  // Create template arrow icon
  templateToggleBtn.innerHTML = '';
  var templateArrowIcon = document.createElement('span');
  templateArrowIcon.innerHTML = 'T';
  templateArrowIcon.className = 'template-arrow-icon';
  templateToggleBtn.appendChild(templateArrowIcon);
  
  // Create add circle button with mini-icon instead of plus
  var addBtn = document.createElement('button');
  addBtn.id = 'add-circle-btn-' + section.id;
  addBtn.className = 'add-btn circle-btn';
  addBtn.dataset.panelId = section.id;
  addBtn.title = 'Add ' + section.name + ' Circle';
  addBtn.style.position = 'relative';
  addBtn.style.top = '0';
  addBtn.style.left = '0';
  addBtn.style.marginRight = '5px';
  
  if (section.id !== 'left') {
    addBtn.style.backgroundColor = '#666';
  }
  
  // Add mini-icon to the button instead of plus sign
  var miniIcon = this._createMiniIcon(section.id);
  addBtn.appendChild(miniIcon);
  
  // Create header text
  var header = document.createElement('h3');
  header.textContent = section.name;
  header.style.position = 'relative';
  header.style.margin = '0';
  header.style.padding = '0';
  header.style.top = '0';
  header.style.color = '#666';
  header.style.cursor = 'pointer';
  header.style.userSelect = 'none';
  header.title = 'Click to toggle visibility for all ' + section.name + ' circles';
  header.dataset.circleType = section.id; // NEW: Add data attribute for easy finding
  
  // NEW: Add click handler for visibility toggle
  var self = this;
  header.addEventListener('click', function(e) {
    e.stopPropagation();
    
    console.log('Header clicked for circle type visibility toggle:', section.id);
    
    // Toggle visibility for this circle type
    ChakraApp.appState.toggleCircleTypeVisibility(section.id);
  });
  
  // NEW: Add hover effects
  header.addEventListener('mouseenter', function() {
    if (ChakraApp.appState.circleTypeVisibility[section.id] !== false) {
      this.style.color = '#999';
    } else {
      this.style.color = 'rgb(80, 80, 80)'; // Slightly lighter when dimmed
    }
  });
  
  header.addEventListener('mouseleave', function() {
    if (ChakraApp.appState.circleTypeVisibility[section.id] !== false) {
      this.style.color = '#666';
    } else {
      this.style.color = 'rgb(60, 60, 60)'; // Back to dimmed color
    }
  });
  
  // Add elements to section container
  sectionContainer.appendChild(toggleBtn);
  sectionContainer.appendChild(toggleBtn2);
  sectionContainer.appendChild(addBtn);
  sectionContainer.appendChild(header);
  if (section.id == 'gem') {
    sectionContainer.appendChild(templateToggleBtn);
  }
  
  // Add section to headers container
  this.headersContainer.appendChild(sectionContainer);
  
  // Store button references
  if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
    ChakraApp.app.controllers.document.toggleDocumentListBtns[section.id] = toggleBtn;
  }

  if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
    ChakraApp.app.controllers.document.toggleDocumentListBtns2[section.id] = toggleBtn2;
  }
  
  // Store template button reference for the template controller
  if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
    ChakraApp.app.controllers.template.toggleTemplateListBtns[section.id] = templateToggleBtn;
  }
  
  this.addCircleBtns[section.id] = addBtn;
};

ChakraApp.UIController.prototype._setupButtonHandlersPostCreation = function() {
  var self = this;
  
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    var typeId = circleType.id;
    
    // Handle add circle buttons - UPDATED to restore visibility
    var addBtn = document.getElementById('add-circle-btn-' + typeId);
    if (addBtn) {
      var newAddBtn = addBtn.cloneNode(true);
      
      if (addBtn.parentNode) {
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
      }
      
      self.addCircleBtns[typeId] = newAddBtn;
      
      newAddBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // NEW: Restore visibility if it was hidden
        ChakraApp.appState.setCircleTypeVisibility(typeId, true);
        
        // Ensure document for circle type
        self._ensureDocumentForCircleType(typeId);
        
        // Create a new circle
        var circleData = {
          circleType: typeId,
          color: circleType.color
        };
        
        var circle = ChakraApp.appState.addCircle(circleData);
      });
    }
    
    // Handle document toggle buttons - UPDATED to restore visibility
    var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
    if (toggleBtn) {
      var newToggleBtn = toggleBtn.cloneNode(true);
      
      if (toggleBtn.parentNode) {
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
      }
      
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
        ChakraApp.app.controllers.document.toggleDocumentListBtns[typeId] = newToggleBtn;
      }
      
      newToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // NEW: Restore visibility if it was hidden
        ChakraApp.appState.setCircleTypeVisibility(typeId, true);
        
        // Track which button was clicked
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._lastClickedButton = 'btn1-' + typeId;
        }
        
        // Close template lists
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._closeAllTemplateLists();
        }
        
        ChakraApp.appState.toggleDocumentList(typeId);
        
        var arrowIcon = this.querySelector('.arrow-icon');
        if (arrowIcon) {
          arrowIcon.innerHTML = ChakraApp.appState.documentListVisible[typeId] ? '▲' : '▼';
        }
        
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._updateDocumentList(typeId);
          ChakraApp.app.controllers.document._updateDocumentList2(typeId);
        }
      });
    }

    // Handle second document toggle button - UPDATED to restore visibility
    var toggleBtn2 = document.getElementById('toggle-document-list-btn2-' + typeId);
    if (toggleBtn2) {
      var newToggleBtn2 = toggleBtn2.cloneNode(true);
      
      if (toggleBtn2.parentNode) {
        toggleBtn2.parentNode.replaceChild(newToggleBtn2, toggleBtn2);
      }
      
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
        ChakraApp.app.controllers.document.toggleDocumentListBtns2[typeId] = newToggleBtn2;
      }
      
      newToggleBtn2.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // NEW: Restore visibility if it was hidden
        ChakraApp.appState.setCircleTypeVisibility(typeId, true);
        
        // Track which button was clicked
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._lastClickedButton = 'btn2-' + typeId;
        }
        
        // Close template lists
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._closeAllTemplateLists();
        }
        
        ChakraApp.appState.toggleDocumentList(typeId);
        
        var arrowIcon = this.querySelector('.arrow-icon');
        if (arrowIcon) {
          arrowIcon.innerHTML = ChakraApp.appState.documentListVisible[typeId] ? '▲' : '▼';
        }
        
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._updateDocumentList(typeId);
          ChakraApp.app.controllers.document._updateDocumentList2(typeId);
        }
      });
    }
    
    // Handle template toggle button - UPDATED to restore visibility
    var templateToggleBtn = document.getElementById('toggle-template-list-btn-' + typeId);
    if (templateToggleBtn) {
      var newTemplateToggleBtn = templateToggleBtn.cloneNode(true);
      
      if (templateToggleBtn.parentNode) {
        templateToggleBtn.parentNode.replaceChild(newTemplateToggleBtn, templateToggleBtn);
      }
      
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
        ChakraApp.app.controllers.template.toggleTemplateListBtns[typeId] = newTemplateToggleBtn;
      }
      
      newTemplateToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // NEW: Restore visibility if it was hidden
        ChakraApp.appState.setCircleTypeVisibility(typeId, true);
        
        // Continue with normal template toggle logic
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
          var templateController = ChakraApp.app.controllers.template;
          templateController.toggleTemplateList(typeId);
        }
      });
    }
  });
  
  // NEW: Refresh visual indicators after all buttons are created
  setTimeout(function() {
    self._refreshAllDocumentToggleIndicators();
    
    // Also refresh header visual states
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        ChakraApp.appState._updateHeaderVisualState(circleType.id);
      });
    }
  }, 100);
};

ChakraApp.UIController.prototype._ensureDocumentForCircleType = function(typeId) {
  // NEW: Get documents for this circle type from list1 (default list)
  var docs = ChakraApp.appState.getDocumentsForCircleTypeAndList(typeId, 'list1');
  
  if (docs.length === 0) {
    // Find the circle type configuration
    var circleTypeConfig = null;
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
        return type.id === typeId;
      });
    }
    
    // Create a new document for this circle type in list1
    var docName = circleTypeConfig ? circleTypeConfig.name + " Document" : "New Document";
    
    var newDoc = ChakraApp.appState.addDocument({
      name: docName,
      circleType: typeId,
      listType: 'list1' // Explicitly set to list1
    });
    
    // NEW: Pass listType to selectDocument
    ChakraApp.appState.selectDocument(newDoc.id, typeId, 'list1');
  } else {
    // NEW: Select the first document if not already selected for list1
    var currentSelection = ChakraApp.appState.selectedDocumentIds[typeId];
    if (!currentSelection || !currentSelection.list1) {
      ChakraApp.appState.selectDocument(docs[0].id, typeId, 'list1');
    }
  }
};

ChakraApp.UIController.prototype._refreshAllDocumentToggleIndicators = function() {
  var self = this;
  
  // Update visual indicators for all circle types
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      ChakraApp.appState._updateDocumentToggleButtonIndicators(circleType.id);
    });
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

ChakraApp.UIController.prototype._setupTemplateEvents = function() {
  // Listen for template selection events
  this.eventSubscriptions.templateSelected = ChakraApp.EventBus.subscribe(
    'TEMPLATE_SELECTED',
    this._handleTemplateSelected.bind(this)
  );
  
  this.eventSubscriptions.templateDeselected = ChakraApp.EventBus.subscribe(
    'TEMPLATE_DESELECTED',
    this._handleTemplateDeselected.bind(this)
  );
};

/**
 * Handle template selection event
 * @private
 */
ChakraApp.UIController.prototype._handleTemplateSelected = function(template) {
  // Show the "USE THIS TEMPLATE" button
  this._showUseTemplateButton(template);
};

/**
 * Handle template deselection event
 * @private
 */
ChakraApp.UIController.prototype._handleTemplateDeselected = function() {
  // Hide the "USE THIS TEMPLATE" button
  this._hideUseTemplateButton();
};

/**
 * Show the "USE THIS TEMPLATE" button
 * @private
 */
ChakraApp.UIController.prototype._showUseTemplateButton = function(template) {
  var existingBtn = document.getElementById('use-template-btn');
  if (existingBtn) {
    existingBtn.remove();
  }

  var useTemplateBtn = document.createElement('button');
  useTemplateBtn.id = 'use-template-btn';
  useTemplateBtn.className = 'use-template-btn visible';
  useTemplateBtn.textContent = 'USE THIS TEMPLATE';
  
  var self = this;
  useTemplateBtn.addEventListener('click', function() {
    self._useTemplate(template);
  });
  
  this.leftPanel.appendChild(useTemplateBtn);
};

/**
 * Hide the "USE THIS TEMPLATE" button
 * @private
 */
ChakraApp.UIController.prototype._hideUseTemplateButton = function() {
  var useTemplateBtn = document.getElementById('use-template-btn');
  if (useTemplateBtn) {
    useTemplateBtn.remove();
  }
};

/**
 * Use a template to create a new document
 * @private
 */
ChakraApp.UIController.prototype._useTemplate = function(template) {
  if (!ChakraApp.app.controllers.template) {
    console.error('Template controller not available');
    return;
  }
  
  // Use the template controller to create a document from the template
  ChakraApp.app.controllers.template.useTemplate(template.id);
};

  
})(window.ChakraApp = window.ChakraApp || {});
