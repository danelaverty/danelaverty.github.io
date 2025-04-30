// src/controllers/UIController.js
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
      this.topPanel.insertBefore(this.chakraTitle, this.topPanel.firstChild);
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
  var self = this;
  
  // Clear all existing event listeners for the add buttons first
  ChakraApp.appState.panels.forEach(function(panelId) {
    var addCircleBtn = self.addCircleBtns[panelId];
    if (addCircleBtn) {
      // Clone and replace to remove all event listeners
      var newBtn = addCircleBtn.cloneNode(true);
      if (addCircleBtn.parentNode) {
        addCircleBtn.parentNode.replaceChild(newBtn, addCircleBtn);
        self.addCircleBtns[panelId] = newBtn;
      }
    }
  });
  
  // Also handle the things button in the left panel separately
  var thingsAddBtn = document.getElementById('add-circle-btn-things');
  if (thingsAddBtn) {
    var newThingsBtn = thingsAddBtn.cloneNode(true);
    if (thingsAddBtn.parentNode) {
      thingsAddBtn.parentNode.replaceChild(newThingsBtn, thingsAddBtn);
      thingsAddBtn = newThingsBtn;
    }
  }
  
  // Now set up fresh event listeners for each button
  ChakraApp.appState.panels.forEach(function(panelId) {
    if (panelId === 'things') return; // Skip normal handling for things panel
    
    var addCircleBtn = self.addCircleBtns[panelId];
    if (addCircleBtn) {
      addCircleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Deselect current items
        if (ChakraApp.appState.selectedCircleId) {
          ChakraApp.appState.deselectCircle();
        }
        
        // Create a new circle at a random position near the center of this panel
        var panel = document.querySelector('.circle-panel[data-panel-id="' + panelId + '"]');
        if (!panel) return;
        
        var panelRect = panel.getBoundingClientRect();
        var centerX = panelRect.width / 2;
        var centerY = panelRect.height / 2;
        
        // Random position within ±100px of center
        var randomX = Math.max(50, Math.min(panelRect.width - 100, centerX + (Math.random() * 200 - 100)));
        var randomY = Math.max(50, Math.min(panelRect.height - 100, centerY + (Math.random() * 200 - 100)));
        
        // Create circle
        var circleData = {
          x: randomX,
          y: randomY,
          color: ChakraApp.Config.predefinedColors[0],
          name: ChakraApp.Config.defaultName
        };
        
        var circle = ChakraApp.appState.addCircle(circleData, panelId);
        
        // Select the new circle
        ChakraApp.appState.selectCircle(circle.id);
      });
    }
  });
  
  // Add special handling for the things button in the left panel
  if (thingsAddBtn) {
    thingsAddBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Deselect current items
      if (ChakraApp.appState.selectedCircleId) {
        ChakraApp.appState.deselectCircle();
      }
      
      // Get the left panel for sizing
      var panel = document.querySelector('.circle-panel[data-panel-id="left"]');
      if (!panel) return;
      
      var panelRect = panel.getBoundingClientRect();
      var centerX = panelRect.width / 2;
      var centerY = panelRect.height / 2;
      
      // Random position within ±100px of center
      var randomX = Math.max(50, Math.min(panelRect.width - 100, centerX + (Math.random() * 200 - 100)));
      var randomY = Math.max(50, Math.min(panelRect.height - 100, centerY + (Math.random() * 200 - 100)));
      
      // Find things panel color
      var thingsColor = '#88B66d'; // Default
      ChakraApp.Config.conceptTypes.forEach(function(type) {
        if (type.panelId === 'things') {
          thingsColor = type.color;
        }
      });
      
      // Create circle for things panel type
      var circleData = {
        x: randomX,
        y: randomY,
        color: thingsColor,
        name: ChakraApp.Config.defaultName,
        // Add characteristics explicitly to make it a triangle
        characteristics: {
          completion: "level2" // This should make it render as a full triangle
        }
      };
      
      // Explicitly specify 'things' as the panel ID
      var circle = ChakraApp.appState.addCircle(circleData, 'things');
      
      // Select the new circle
      ChakraApp.appState.selectCircle(circle.id);
    });
  }
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
    
    if (isThingsCircle) {
      // Show black filled silhouette for "things" circle
      this._setSilhouetteVisibility(true, false, true);
      this._setLeftPanelBackground('rgba(255, 255, 255, 0.2)');
    } else {
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
