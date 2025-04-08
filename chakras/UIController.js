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
    this.addCircleBtn = null;
    
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
  };
  
  /**
   * Initialize DOM elements
   * @private
   */
  ChakraApp.UIController.prototype._initializeDomElements = function() {
    // Get DOM elements
    this.topPanel = document.getElementById('top-panel');
    this.addCircleBtn = document.getElementById('add-circle-btn');
    
    // Create UI elements
    this._createChakraTitle();
    this._createMeridianLine();
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
      this.chakraTitle = document.createElement('div');
      this.chakraTitle.id = 'chakra-title';
      this.chakraTitle.className = 'chakra-title';
      this.chakraTitle.textContent = 'No Chakra Selected';
      
      // Add to top panel
      this.topPanel.insertBefore(this.chakraTitle, this.topPanel.firstChild);
    } else {
      this.chakraTitle = document.getElementById('chakra-title');
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
      this.chakraTitle.textContent = 'No Chakra Selected';
      this.chakraTitle.classList.remove('visible');
    } else {
      this.chakraTitle.textContent = circleName;
      this.chakraTitle.classList.add('visible');
    }
  };
  
  /**
   * Create meridian line
   * @private
   */
  ChakraApp.UIController.prototype._createMeridianLine = function() {
    // Create meridian line if it doesn't exist
    if (!document.getElementById('meridian-line')) {
      var zoomContainer = document.getElementById('zoom-container');
      var meridianLine = document.createElement('div');
      meridianLine.id = 'meridian-line';
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
    
    // Add circle button
    if (this.addCircleBtn) {
      this.addCircleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Deselect current items
        if (ChakraApp.appState.selectedCircleId) {
          ChakraApp.appState.deselectCircle();
        }
        
        // Create a new circle at a random position near the center
        var leftPanel = document.getElementById('left-panel');
        var panelRect = leftPanel.getBoundingClientRect();
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
        
        var circle = ChakraApp.appState.addCircle(circleData);
        
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
    var zoomContainer = document.getElementById('zoom-container');
    var bottomPanel = document.getElementById('bottom-panel');
    
    // Left panel click - deselect circle
    zoomContainer.addEventListener('click', function(e) {
      // Only handle clicks directly on the panel (not on children)
      if (e.target === zoomContainer) {
        if (ChakraApp.appState.selectedCircleId) {
          ChakraApp.appState.deselectCircle();
        }
      }
    });
    
    // Bottom panel click - deselect square
    bottomPanel.addEventListener('click', function(e) {
      // Only handle clicks directly on the panel (not on children)
      if (e.target === bottomPanel) {
        if (ChakraApp.appState.selectedSquareId) {
          ChakraApp.appState.deselectSquare();
        }
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
    
    // Ensure panel controller exists and show the right panel
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
      ChakraApp.app.controllers.panel.showRightPanel();
    }
  };
  
  /**
   * Handle circle update event
   * @private
   * @param {Object} circle - Updated circle
   */
  ChakraApp.UIController.prototype._handleCircleUpdated = function(circle) {
    if (circle.id === ChakraApp.appState.selectedCircleId) {
      this._updateChakraTitle(circle.name);
    }
  };
  
  /**
   * Handle circle deselection event
   * @private
   */
  ChakraApp.UIController.prototype._handleCircleDeselected = function() {
    this._updateChakraTitle(null);
    
    // Ensure panel controller exists and hide the right panel
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
      ChakraApp.app.controllers.panel.hideRightPanel();
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
