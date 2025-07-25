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
    this._setupInitializationStrategy();
  };

  ChakraApp.UIController.prototype._setupInitializationStrategy = function() {
  var self = this;
  
  // FIXED: Check if ANY left panel exists, but don't require one
  var leftPanel = this._findAnyLeftPanel();
  
  if (leftPanel) {
    // Panels already exist, initialize immediately
    this._completeInitialization();
  } else {
    // FIXED: Set up to initialize when the FIRST panel is created (not just panel 0)
    this._waitForFirstPanel();
  }
};

ChakraApp.UIController.prototype._findAnyLeftPanel = function() {
  // Try various selectors to find any left panel
  var selectors = [
    '[id^="left-panel-"]',
    '.left-panel',
    '#left-panel'
  ];
  
  for (var i = 0; i < selectors.length; i++) {
    var panel = document.querySelector(selectors[i]);
    if (panel) {
      return panel;
    }
  }
  
  return null;
};

ChakraApp.UIController.prototype._waitForFirstPanel = function() {
  var self = this;
  
  this.eventSubscriptions.leftPanelAdded = ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
    
    // ANY panel creation should trigger initialization, not just panel 0
    self._completeInitialization();
    
    // Unsubscribe since we only need this once
    if (self.eventSubscriptions.leftPanelAdded) {
      self.eventSubscriptions.leftPanelAdded();
      delete self.eventSubscriptions.leftPanelAdded;
    }
  });
};

// Add this new method:
ChakraApp.UIController.prototype._completeInitialization = function() {
  this._initializeDomElements();
  
  // FIXED: Only proceed if we successfully found elements
  if (this.leftPanel) {
    this._setupEventHandlers();
    this._addHeaderStyles();
    this._setupButtonHandlersPostCreation();
    
    // Initialize silhouette state
    this._updateSilhouetteVisibility(null);
  } else {
    console.warn('UIController: Could not complete initialization - no left panel available');
  }
};

ChakraApp.UIController.prototype._findSilhouetteElements = function() {
  // FIXED: Only try to find silhouettes if we have a left panel
  if (!this.leftPanel) {
    return;
  }
  
  // Extract panel ID from the left panel we found
  var panelId = this._extractPanelId(this.leftPanel);
  
  
  // Try panel-specific IDs first
  if (panelId !== null) {
    this.silhouetteOutline = document.getElementById('silhouette-outline-' + panelId);
    this.silhouetteFilled = document.getElementById('silhouette-filled-' + panelId);
    this.silhouetteFilledBlack = document.getElementById('silhouette-filled-black-' + panelId);
  }
  
  // Fallback to generic IDs
  if (!this.silhouetteOutline) {
    this.silhouetteOutline = document.getElementById('silhouette-outline');
  }
  if (!this.silhouetteFilled) {
    this.silhouetteFilled = document.getElementById('silhouette-filled');
  }
  if (!this.silhouetteFilledBlack) {
    this.silhouetteFilledBlack = document.getElementById('silhouette-filled-black');
  }
  
};

// NEW: Extract panel ID from a panel element
ChakraApp.UIController.prototype._extractPanelId = function(panelElement) {
  if (!panelElement) return null;
  
  // Try dataset first
  if (panelElement.dataset && panelElement.dataset.panelIndex !== undefined) {
    return parseInt(panelElement.dataset.panelIndex);
  }
  
  // Try extracting from ID
  var idMatch = panelElement.id.match(/left-panel-(\d+)/);
  if (idMatch) {
    return parseInt(idMatch[1]);
  }
  
  // Default to 0 for backward compatibility
  return 0;
};
  
  /**
   * Initialize DOM elements
   * @private
   */
ChakraApp.UIController.prototype._initializeDomElements = function() {
  // Get DOM elements
  this.topPanel = document.getElementById('top-panel');
  
  this.leftPanel = this._findAnyLeftPanel();
  
  if (!this.leftPanel) {
    return;
  }

  this._findSilhouetteElements();
  
  var self = this;
  if (ChakraApp.appState.panels && ChakraApp.appState.panels.length > 0) {
    ChakraApp.appState.panels.forEach(function(panelId) {
      self.addCircleBtns[panelId] = document.getElementById('add-circle-btn-' + panelId);
    });
  }
  
  // Create UI elements
  this._createChakraTitle();
  //this._createMeridianLines();
  
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
        border: none;
        cursor: pointer;
        transition: background-color var(--transition-fast), transform var(--transition-fast);
      }

      .add-btn.circle-btn {
        background-color: #666;
      }

      .document-toggle-btn {
		font-size: 7px;
        color: #777;
        background-color: black;
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
    this._setupHeaderToggleEvents();
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
    // FIXED: Find the actual zoom container for the current left panel
    var zoomContainer = null;
    
    if (this.leftPanel) {
      var actualPanelId = this._extractPanelId(this.leftPanel);
      zoomContainer = document.getElementById('zoom-container-left-' + actualPanelId);
      
      if (!zoomContainer) {
        // Try finding zoom container within the left panel we found
        zoomContainer = this.leftPanel.querySelector('.zoom-container');
      }
    }
    
    // Fallback searches
    if (!zoomContainer) {
      zoomContainer = document.getElementById('zoom-container-' + panelId) ||
                     document.querySelector('[id^="zoom-container-left-"]') ||
                     document.querySelector('.zoom-container');
    }
      
    if (!zoomContainer) {
      console.warn('No zoom container found for meridian line');
      return;
    }
      
    var meridianLine = document.createElement('div');
    meridianLine.id = meridianLineId;
    meridianLine.className = 'meridian-line';
    meridianLine.style.position = 'absolute';
    meridianLine.style.top = '0';
    meridianLine.style.left = ChakraApp.Config.meridian.x + 'px';
    meridianLine.style.width = '1px';
    meridianLine.style.height = '100%';
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
  
  // Set up click handlers for each circle panel using new structure
  ChakraApp.appState.panels.forEach(function(panelId) {
    // FIXED: Use the new zoom container ID structure
    var zoomContainer = document.getElementById('zoom-container-' + panelId + '-0') ||
                       document.getElementById('zoom-container-' + panelId); // Fallback
    
    if (zoomContainer) {
      // Panel click - deselect circle
      zoomContainer.addEventListener('click', function(e) {
        // Only handle clicks directly on the panel (not on children)
        if (e.target === zoomContainer) {
          // FIXED: Use CircleMultiSelectionManager for proper deselection
          if (ChakraApp.CircleMultiSelectionManager.hasSelection()) {
            ChakraApp.CircleMultiSelectionManager.clearSelection();
          }
          // FIXED: Also clear the old system selection
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
        // Clear other selections
        if (ChakraApp.appState.selectedSquareId) {
          ChakraApp.appState.deselectSquare();
        }

        // Ensure multi-selection is cleared even if no primary square is selected
        if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
          ChakraApp.MultiSelectionManager.clearSelection();
        }
      }
    });
  }
  
  // FIXED: Add click handlers for ALL left panels (including dynamically created ones)
  var self = this;
  
  // Handle existing left panels
  document.querySelectorAll('[id^="zoom-container-left-"]').forEach(function(zoomContainer) {
    zoomContainer.addEventListener('click', function(e) {
      // Only handle clicks directly on the zoom container (not on children)
      if (e.target === zoomContainer) {
        // FIXED: Clear circle multi-selection first
        if (ChakraApp.CircleMultiSelectionManager.hasSelection()) {
          ChakraApp.CircleMultiSelectionManager.clearSelection();
        }
        
        // FIXED: Clear old system circle selection
        if (ChakraApp.appState.selectedCircleId) {
          ChakraApp.appState.deselectCircle();
        }
      }
    });
  });
  
  // FIXED: Listen for new left panels being created and add handlers
  ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
    if (data && data.panelId !== undefined) {
      setTimeout(function() {
        var newZoomContainer = document.getElementById('zoom-container-left-' + data.panelId);
        if (newZoomContainer) {
          newZoomContainer.addEventListener('click', function(e) {
            if (e.target === newZoomContainer) {
              // Clear circle multi-selection first
              if (ChakraApp.CircleMultiSelectionManager.hasSelection()) {
                ChakraApp.CircleMultiSelectionManager.clearSelection();
              }
              
              // Clear old system circle selection
              if (ChakraApp.appState.selectedCircleId) {
                ChakraApp.appState.deselectCircle();
              }
            }
          });
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  });
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
	  return;
    // FIXED: Check for the new silhouette element IDs
    var silhouetteOutline = this.silhouetteOutline;
    var silhouetteFilled = this.silhouetteFilled;
    var silhouetteFilledBlack = this.silhouetteFilledBlack;
    var leftPanel = this.leftPanel;
    
    if (!silhouetteOutline || !silhouetteFilled || !silhouetteFilledBlack || !leftPanel) {
      return;
    }
    
    // Default state: Only show outline, hide filled versions, reset background
    this._setSilhouetteVisibilityElements(silhouetteOutline, silhouetteFilled, silhouetteFilledBlack, true, false, false);
    this._setLeftPanelBackgroundElement(leftPanel, '');
    
    if (!circle) {
      return; // No circle selected, use default state
    }
    
    // Determine if this is a "things" type circle
    const isThingsCircle = this._isThingsCircle(circle);
    const isLeftCircle = this._isLeftCircle(circle);
    
    if (isThingsCircle) {
      // Show black filled silhouette for "things" circle
      this._setSilhouetteVisibilityElements(silhouetteOutline, silhouetteFilled, silhouetteFilledBlack, true, false, true);
      this._setLeftPanelBackgroundElement(leftPanel, 'rgba(255, 255, 255, 0.1)');
    } else if (isLeftCircle) {
      // Show colored filled silhouette for "left" type circle
      this._setSilhouetteVisibilityElements(silhouetteOutline, silhouetteFilled, silhouetteFilledBlack, true, true, false);
    }
  };

  ChakraApp.UIController.prototype._setLeftPanelBackgroundElement = function(leftPanel, backgroundColor) {
    if (leftPanel) {
      leftPanel.style.backgroundColor = backgroundColor;
    }
  };

  ChakraApp.UIController.prototype._setSilhouetteVisibilityElements = function(outline, filled, filledBlack, showOutline, showFilled, showFilledBlack) {
    if (outline) {
      outline.style.display = showOutline ? 'block' : 'none';
    }
    
    if (filled) {
      filled.style.display = showFilled ? 'block' : 'none';
    }
    
    if (filledBlack) {
      filledBlack.style.display = showFilledBlack ? 'block' : 'none';
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
    this._setSilhouetteVisibilityElements(this.silhouetteOutline, this.silhouetteFilled, this.silhouetteFilledBlack, showOutline, showFilled, showFilledBlack);
  };
  
  /**
   * Set left panel background color
   * @private
   * @param {string} backgroundColor - CSS background color
   */
  ChakraApp.UIController.prototype._setLeftPanelBackground = function(backgroundColor) {
    this._setLeftPanelBackgroundElement(this.leftPanel, backgroundColor);
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

  // New function to create column labels:
  ChakraApp.UIController.prototype._createColumnLabels = function() {
    var labelsContainer = document.createElement('div');
    labelsContainer.className = 'column-labels';
    
    // Create label A
    var labelA = document.createElement('div');
    labelA.className = 'column-label column-label-a';
    labelA.textContent = '●';
    labelA.style.cursor = 'pointer';
    labelA.style.userSelect = 'none';
    
    // Create label B
    var labelB = document.createElement('div');
    labelB.className = 'column-label column-label-b';
    labelB.textContent = '●';
    labelB.style.cursor = 'pointer';
    labelB.style.userSelect = 'none';
    
    // Add click handlers
    var self = this;
    labelA.addEventListener('click', function(e) {
      e.stopPropagation();
      ChakraApp.appState.toggleListTypeVisibility('list1');
    });
    
    labelB.addEventListener('click', function(e) {
      e.stopPropagation();
      ChakraApp.appState.toggleListTypeVisibility('list2');
    });
    
    // Create spacer for the add button column
    var spacerAdd = document.createElement('div');
    spacerAdd.className = 'column-label';
    spacerAdd.textContent = '';
    
    // Create spacer for the header text
    var spacerHeader = document.createElement('div');
    spacerHeader.style.flex = '1';
    
    // Add labels to container
    labelsContainer.appendChild(labelA);
    //labelsContainer.appendChild(labelB);
    labelsContainer.appendChild(spacerAdd);
    labelsContainer.appendChild(spacerHeader);
    
    // Add to headers container
    this.headersContainer.appendChild(labelsContainer);
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
    /*toggleBtn.style.backgroundColor = 'black';
    toggleBtn.style.fontSize = '7px';
    toggleBtn.style.color = '#777';*/
    
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
    /*toggleBtn2.style.backgroundColor = 'black';
    toggleBtn2.style.fontSize = '7px';
    toggleBtn2.style.color = '#777';*/
    
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
    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';
    header.title = 'Click to toggle visibility for all ' + section.name + ' circles';
    header.dataset.circleType = section.id; // NEW: Add data attribute for easy finding
    
    // NEW: Add click handler for visibility toggle
    var self = this;
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Toggle visibility for this circle type
      ChakraApp.appState.toggleCircleTypeVisibility(section.id);
    });
    
    // Add elements to section container
    sectionContainer.appendChild(toggleBtn);
    //sectionContainer.appendChild(toggleBtn2);
    sectionContainer.appendChild(addBtn);
    sectionContainer.appendChild(header);
    /*if (section.id == 'gem') {
      sectionContainer.appendChild(templateToggleBtn);
    }*/
    
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
    
    // Handle add circle buttons - UPDATED to restore both visibilities
    var addBtn = document.getElementById('add-circle-btn-' + typeId);
    if (addBtn) {
      var newAddBtn = addBtn.cloneNode(true);
      
      if (addBtn.parentNode) {
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
      }
      
      self.addCircleBtns[typeId] = newAddBtn;
      
      newAddBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Restore both circle type and list type visibility
        ChakraApp.appState.setCircleTypeVisibility(typeId, true);
        ChakraApp.appState.setListTypeVisibility('list1', true); // Default to list1
        
        // FIXED: Ensure document for circle type in panel 0 (default)
        self._ensureDocumentForCircleTypeInPanel(typeId, 0);
        
        // Create a new circle
        var circleData = {
          circleType: typeId,
          color: circleType.color
        };
        
        var circle = ChakraApp.appState.addCircle(circleData);
      });
    }
    
    // FIXED: Handle toggle document list buttons (List A) - Panel 0
    var toggleBtn = document.getElementById('toggle-document-list-btn-' + typeId);
    if (toggleBtn) {
      var newToggleBtn = toggleBtn.cloneNode(true);
      
      if (toggleBtn.parentNode) {
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
      }
      
      newToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Set the last clicked button to indicate List A (btn1)
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._lastClickedButton = 'btn1-' + typeId;
        }
        
        // Toggle the document list for this circle type
        var isVisible = ChakraApp.appState.toggleDocumentList(typeId);
        
        // Update arrow icon
        var arrowIcon = newToggleBtn.querySelector('.arrow-icon');
        if (arrowIcon) {
          arrowIcon.innerHTML = isVisible ? '▲' : '▼';
        }
        
        // Update BOTH document lists if document controller is available
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._updateDocumentList(typeId);
          ChakraApp.app.controllers.document._updateDocumentList2(typeId);
        }
      });
      
      // Store reference for document controller
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
        ChakraApp.app.controllers.document.toggleDocumentListBtns[typeId] = newToggleBtn;
      }
    }
    
    // FIXED: Handle toggle document list buttons (List B) - Panel 0
    var toggleBtn2 = document.getElementById('toggle-document-list-btn2-' + typeId);
    if (toggleBtn2) {
      var newToggleBtn2 = toggleBtn2.cloneNode(true);
      
      if (toggleBtn2.parentNode) {
        toggleBtn2.parentNode.replaceChild(newToggleBtn2, toggleBtn2);
      }
      
      newToggleBtn2.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Set the last clicked button to indicate List B (btn2)
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._lastClickedButton = 'btn2-' + typeId;
        }
        
        // Toggle the document list for this circle type (List B)
        var isVisible = ChakraApp.appState.toggleDocumentList(typeId);
        
        // Update arrow icon
        var arrowIcon2 = newToggleBtn2.querySelector('.arrow-icon');
        if (arrowIcon2) {
          arrowIcon2.innerHTML = isVisible ? '▲' : '▼';
        }
        
        // Update BOTH document lists if document controller is available
        if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
          ChakraApp.app.controllers.document._updateDocumentList(typeId);
          ChakraApp.app.controllers.document._updateDocumentList2(typeId);
        }
      });
      
      // Store reference for document controller
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
        ChakraApp.app.controllers.document.toggleDocumentListBtns2[typeId] = newToggleBtn2;
      }
    }
    
    // Handle template toggle buttons (if they exist)
    var templateToggleBtn = document.getElementById('toggle-template-list-btn-' + typeId);
    if (templateToggleBtn) {
      var newTemplateToggleBtn = templateToggleBtn.cloneNode(true);
      
      if (templateToggleBtn.parentNode) {
        templateToggleBtn.parentNode.replaceChild(newTemplateToggleBtn, templateToggleBtn);
      }
      
      newTemplateToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
	if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
      ChakraApp.app.controllers.template.currentPanelId = 0;
      ChakraApp.app.controllers.template._closeAllDocumentLists();
      ChakraApp.app.controllers.template._showVisualTemplateSelector(typeId);
    }
      });
      
      // Store reference for template controller
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
        ChakraApp.app.controllers.template.toggleTemplateListBtns[typeId] = newTemplateToggleBtn;
      }
    }
  });
  
  // Refresh visual indicators after all buttons are created
  setTimeout(function() {
    self._refreshAllDocumentToggleIndicators();
    
    // Refresh header visual states
    if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
      ChakraApp.Config.circleTypes.forEach(function(circleType) {
        ChakraApp.appState._updateHeaderVisualState(circleType.id);
      });
    }
    
    // Refresh column header visual states
    ChakraApp.appState._updateColumnHeaderVisualState('list1');
    ChakraApp.appState._updateColumnHeaderVisualState('list2');
  }, 100);
};

  ChakraApp.UIController.prototype._setupPanelSpecificEventHandlers = function(panelId) {
    // Set up click handlers for this specific panel's zoom container
    var zoomContainer = document.getElementById('zoom-container-left-' + panelId);
    if (zoomContainer) {
      zoomContainer.addEventListener('click', function(e) {
        if (e.target === zoomContainer) {
          if (ChakraApp.appState.selectedCircleId) {
            ChakraApp.appState.deselectCircle();
          }
        }
      });
    }
  };

  ChakraApp.UIController.prototype._initializePanelControls = function(panelId) {
    this._createHeadersContainerForPanel(panelId);
    this._setupPanelSpecificEventHandlers(panelId);
  };
  
ChakraApp.UIController.prototype._createHeadersContainerForPanel = function(panelId) {
  var leftPanel = document.getElementById('left-panel-' + panelId);
  if (!leftPanel) return;
  
  // Get current header type for this panel
  var currentHeaderType = ChakraApp.appState.getLeftPanelHeaderType(panelId);
  
  // Create headers container for this specific panel
  var headersContainer = document.createElement('div');
  headersContainer.id = 'headers-container-' + panelId;
  headersContainer.className = 'headers-container';
  headersContainer.style.position = 'absolute';
  headersContainer.style.bottom = '10px';
  headersContainer.style.left = '10px';
  headersContainer.style.zIndex = '20';
  
  // Create sections only for the current header type
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType, index) {
    // Only create section for the current header type
    if (circleType.id === currentHeaderType) {
      self._createHeaderSectionForPanel(headersContainer, circleType, index, panelId);
    }
  });
  
  leftPanel.appendChild(headersContainer);
};

ChakraApp.UIController.prototype._setupHeaderToggleEvents = function() {
  var self = this;
  
  this.eventSubscriptions.headerTypeChanged = ChakraApp.EventBus.subscribe(
    'LEFT_PANEL_HEADER_TYPE_CHANGED',
    function(data) {
      if (data && data.panelId !== undefined) {
        // Refresh the headers container for the changed panel
        self._refreshHeadersContainerForPanel(data.panelId);
      }
    }
  );
};
  
  ChakraApp.UIController.prototype._createColumnLabelsForPanel = function(container, panelId) {
    var labelsContainer = document.createElement('div');
    labelsContainer.className = 'column-labels';
    
    var labelA = document.createElement('div');
    labelA.className = 'column-label column-label-a';
    labelA.textContent = '●';
    labelA.style.cursor = 'pointer';
    labelA.style.userSelect = 'none';
    
    var labelB = document.createElement('div');
    labelB.className = 'column-label column-label-b';
    labelB.textContent = '●';
    labelB.style.cursor = 'pointer';
    labelB.style.userSelect = 'none';
    
    // Add click handlers specific to this panel
    labelA.addEventListener('click', function(e) {
      e.stopPropagation();
      ChakraApp.appState.toggleListTypeVisibility('list1');
    });
    
    labelB.addEventListener('click', function(e) {
      e.stopPropagation();
      ChakraApp.appState.toggleListTypeVisibility('list2');
    });
    
    var spacerAdd = document.createElement('div');
    spacerAdd.className = 'column-label';
    spacerAdd.textContent = '';
    
    var spacerHeader = document.createElement('div');
    spacerHeader.style.flex = '1';
    
    labelsContainer.appendChild(labelA);
    //labelsContainer.appendChild(labelB);
    labelsContainer.appendChild(spacerAdd);
    labelsContainer.appendChild(spacerHeader);
    
    container.appendChild(labelsContainer);
  };
  
ChakraApp.UIController.prototype._createHeaderSectionForPanel = function(container, circleType, index, panelId) {
  // Get current header type for this panel
  var currentHeaderType = ChakraApp.appState.getLeftPanelHeaderType(panelId);
  
  // Only create header section if this circle type matches the current header type
  if (circleType.id !== currentHeaderType) {
    return; // Skip creating this header section
  }
  
  var sectionContainer = document.createElement('div');
  sectionContainer.className = 'header-section';
  sectionContainer.id = 'header-section-' + panelId; // Add ID for easy finding
  sectionContainer.style.display = 'flex';
  sectionContainer.style.alignItems = 'center';
  sectionContainer.style.marginBottom = '0';
  
  // Create buttons with panel-specific IDs
  var toggleBtn = this._createDocumentToggleButton(circleType.id, 'list1', panelId);
  var addBtn = this._createAddCircleButton(circleType, panelId);
  var header = this._createToggleableCircleTypeHeader(circleType, panelId); 
  
  // Create template toggle button (only for 'gem' circle type)
  var templateToggleBtn = null;
  if (circleType.id === 'gem') {
    templateToggleBtn = document.createElement('button');
    templateToggleBtn.id = 'toggle-template-list-btn-' + circleType.id + '-panel-' + panelId;
    templateToggleBtn.className = 'template-toggle-btn';
    templateToggleBtn.title = 'Toggle Template List for ' + circleType.name;
    templateToggleBtn.dataset.panelId = panelId;
    templateToggleBtn.dataset.circleTypeId = circleType.id;
    templateToggleBtn.style.position = 'relative';
    templateToggleBtn.style.top = '0';
    templateToggleBtn.style.left = '0';
    templateToggleBtn.style.marginLeft = '13px';
    templateToggleBtn.style.backgroundColor = '#444';
    templateToggleBtn.style.fontSize = '7px';
    templateToggleBtn.style.color = '#BBB';
    
    // Create template arrow icon
    templateToggleBtn.innerHTML = '';
    var templateArrowIcon = document.createElement('span');
    templateArrowIcon.innerHTML = 'T';
    templateArrowIcon.className = 'template-arrow-icon';
    templateToggleBtn.appendChild(templateArrowIcon);
    
    // Add event handler
    var self = this;
    templateToggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Toggle the template list for this circle type
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
        ChakraApp.app.controllers.template.currentPanelId = panelId;
        ChakraApp.app.controllers.template._closeAllDocumentLists();
        ChakraApp.app.controllers.template._showVisualTemplateSelector(circleType.id);
      }
    });
    
    // Store reference for template controller
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.template) {
      ChakraApp.app.controllers.template.toggleTemplateListBtns[circleType.id] = templateToggleBtn;
    }
  }
  
  // Append all elements to section container
  sectionContainer.appendChild(toggleBtn);
  sectionContainer.appendChild(addBtn);
  sectionContainer.appendChild(header);
  
  // Add template button only if it was created (for 'gem' type)
  /*if (templateToggleBtn) {
    sectionContainer.appendChild(templateToggleBtn);
  }*/
  
  container.appendChild(sectionContainer);
};

ChakraApp.UIController.prototype._createToggleableCircleTypeHeader = function(circleType, panelId) {
  var header = document.createElement('h3');
  header.textContent = circleType.name;
  header.style.position = 'relative';
  header.style.margin = '0';
  header.style.padding = '0';
  header.style.top = '0';
  header.style.cursor = 'pointer';
  header.style.userSelect = 'none';
  header.title = 'Click to toggle between Feelings and Concepts'; // NEW: Updated title
  header.dataset.circleType = circleType.id;
  header.dataset.panelId = panelId; // NEW: Add panel ID
  
  var self = this;
  header.addEventListener('click', function(e) {
    e.stopPropagation();
    // NEW: Toggle header type instead of visibility
    self._togglePanelHeaderType(panelId);
  });
  
  return header;
};

// NEW: Handle header type toggle
ChakraApp.UIController.prototype._togglePanelHeaderType = function(panelId) {
  var newHeaderType = ChakraApp.appState.toggleLeftPanelHeaderType(panelId);
  
  // Refresh the headers container for this panel
  this._refreshHeadersContainerForPanel(panelId);
  
};

// NEW: Refresh headers container for a specific panel
ChakraApp.UIController.prototype._refreshHeadersContainerForPanel = function(panelId) {
  var leftPanel = document.getElementById('left-panel-' + panelId);
  if (!leftPanel) return;
  
  // Find and remove existing headers container
  var existingContainer = document.getElementById('headers-container-' + panelId);
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Recreate headers container with current header type
  this._createHeadersContainerForPanel(panelId);
};
  
  ChakraApp.UIController.prototype._createDocumentToggleButton = function(circleTypeId, listType, panelId) {
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-document-list-btn-' + listType + '-' + circleTypeId + '-panel-' + panelId;
    toggleBtn.className = 'document-toggle-btn';
    toggleBtn.title = 'Toggle Document List for ' + circleTypeId;
    toggleBtn.dataset.panelId = panelId;
    toggleBtn.dataset.circleTypeId = circleTypeId;
    toggleBtn.dataset.listType = listType;
    
    var arrowIcon = document.createElement('span');
    arrowIcon.innerHTML = '▼';
    arrowIcon.className = 'arrow-icon';
    toggleBtn.appendChild(arrowIcon);
    
    // Add event handler
    var self = this;
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self._handleDocumentToggleClick(circleTypeId, listType, panelId);
    });
    
    return toggleBtn;
  };
  
  ChakraApp.UIController.prototype._createAddCircleButton = function(circleType, panelId) {
    var addBtn = document.createElement('button');
    addBtn.id = 'add-circle-btn-' + circleType.id + '-panel-' + panelId;
    addBtn.className = 'add-btn circle-btn';
    addBtn.dataset.panelId = panelId;
    addBtn.dataset.circleTypeId = circleType.id;
    addBtn.title = 'Add ' + circleType.name + ' Circle';
    
    var miniIcon = this._createMiniIcon(circleType.id);
    addBtn.appendChild(miniIcon);
    
    // Add event handler
    var self = this;
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self._handleAddCircleClick(circleType, panelId);
    });
    
    return addBtn;
  };
  
  ChakraApp.UIController.prototype._handleDocumentToggleClick = function(circleTypeId, listType, panelId) {

  // Toggle document list for specific panel
  if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
    ChakraApp.app.controllers.document.toggleDocumentListForPanel(circleTypeId, listType, panelId);
  } else {
  }
};
  
ChakraApp.UIController.prototype._handleAddCircleClick = function(circleType, panelId) {
  console.log('Add circle clicked for type', circleType.id, 'in panel', panelId);
  
  // FIXED: Ensure document for circle type in this specific panel
  this._ensureDocumentForCircleTypeInPanel(circleType.id, panelId);
  
  // Create a new circle with targetPanelId specified
  var circleData = {
    circleType: circleType.id,
    color: circleType.color
  };
  
  // FIXED: Pass the panelId as the second parameter
  var circle = ChakraApp.appState.addCircle(circleData, panelId);
  
  console.log('Created circle', circle.id, 'for panel', panelId, 'with document', circle.documentId);
};
  
ChakraApp.UIController.prototype._ensureDocumentForCircleTypeInPanel = function(circleTypeId, panelId) {
  var selections = ChakraApp.appState.getLeftPanelSelections(panelId);
  var docs = ChakraApp.appState.getDocumentsForCircleTypeAndList(circleTypeId, 'list1');
  
  if (docs.length === 0 || !selections[circleTypeId] || !selections[circleTypeId].list1) {
    var circleTypeConfig = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    
      var docName = ChakraApp.appState.generateDateBasedDocumentName(circleTypeId, 'list1');
    
    var newDoc = ChakraApp.appState.addDocument({
      name: docName,
      circleType: circleTypeId,
      listType: 'list1'
    });
    
    // FIXED: Select document for the specific panel
    ChakraApp.appState.selectDocumentForPanel(newDoc.id, circleTypeId, 'list1', panelId);
  }
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
    
    // FIXED: Make sure we have a valid left panel to append to
    var leftPanel = this.leftPanel;
    if (leftPanel) {
      leftPanel.appendChild(useTemplateBtn);
    }
  };

  ChakraApp.UIController.prototype._createCircleTypeHeader = function(circleType) {
    var header = document.createElement('h3');
    header.textContent = circleType.name;
    header.style.position = 'relative';
    header.style.margin = '0';
    header.style.padding = '0';
    header.style.top = '0';
    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';
    header.title = 'Click to toggle visibility for all ' + circleType.name + ' circles';
    header.dataset.circleType = circleType.id;
    
    var self = this;
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      ChakraApp.appState.toggleCircleTypeVisibility(circleType.id);
    });
    
    return header;
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
