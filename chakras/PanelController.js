// src/controllers/PanelController.js
(function(ChakraApp) {
  /**
   * Controls panel visibility and behaviors
   */
  ChakraApp.PanelController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.mainContainer = null;
    this.leftPanel = null;
    this.bottomPanel = null;
    this.centerContainer = null;
    this.topPanel = null;
    this.centerPanel = null;
    
    // Toggle buttons
    this.toggleButtons = {};
    
    // Event subscriptions
    this.eventSubscriptions = {};
  };
  
  // Inherit from BaseController
  ChakraApp.PanelController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.PanelController.prototype.constructor = ChakraApp.PanelController;
  
  // Initialize
  ChakraApp.PanelController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Get DOM elements
    this._initializeDomElements();
    
    // Create panel toggle buttons
    this._createPanelToggleButtons();
    
    // Set up event subscriptions
    this._setupEventSubscriptions();
    
    // Apply initial panel visibility state
    this._applyInitialPanelVisibility();
  };
  
  /**
   * Initialize DOM elements
   * @private
   */
  /**
 * Initialize DOM elements
 * @private
 */
ChakraApp.PanelController.prototype._initializeDomElements = function() {
  // Get panels
  this.mainContainer = document.getElementById('main-container');
  this.leftPanel = document.getElementById('left-panel');
  this.bottomPanel = document.getElementById('bottom-panel');
  this.centerContainer = document.getElementById('center-container');
  this.topPanel = document.getElementById('top-panel');
  this.centerPanel = document.getElementById('center-panel');
  
  // Also initialize any dynamic panels from ConceptPanelManager
  if (ChakraApp.ConceptPanelManager && ChakraApp.ConceptPanelManager.panels) {
    Object.values(ChakraApp.ConceptPanelManager.panels).forEach(function(panel) {
      if (!panel.existing) {
        // Make sure this panel ID is in panelVisibility
        if (!ChakraApp.appState.panelVisibility.hasOwnProperty(panel.id)) {
          ChakraApp.appState.panelVisibility[panel.id] = true;
        }
      }
    });
  }
};
  
  /**
   * Create panel toggle buttons
   * @private
   */
  ChakraApp.PanelController.prototype._createPanelToggleButtons = function() {
    var self = this;
    
    // Create toggle buttons for each panel
    var panels = ['left', 'bottom'];
    
    panels.forEach(function(panelId) {
      var btn = document.createElement('button');
      btn.id = 'toggle-' + panelId + '-panel';
      btn.className = 'panel-toggle-btn';
      btn.dataset.panelId = panelId;
      
      // Add click handler
      btn.addEventListener('click', function() {
        self.togglePanel(panelId);
      });
      
      // Store reference
      self.toggleButtons[panelId] = btn;
      
      // Add to document body
      document.body.appendChild(btn);
    });
  };
  
  /**
   * Apply initial panel visibility state
   * @private
   */
  ChakraApp.PanelController.prototype._applyInitialPanelVisibility = function() {
    var self = this;
    
    // Apply visibility for each panel
    Object.keys(ChakraApp.appState.panelVisibility).forEach(function(panelId) {
      var isVisible = ChakraApp.appState.panelVisibility[panelId];
      self._applyPanelVisibility(panelId, isVisible);
    });
  };
  
  /**
   * Set up event subscriptions
   * @private
   */
  ChakraApp.PanelController.prototype._setupEventSubscriptions = function() {
    // Listen for panel visibility change events
    this.eventSubscriptions.panelVisibility = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED,
      this._handlePanelVisibilityChanged.bind(this)
    );
  };
  
  /**
   * Handle panel visibility changed event
   * @private
   * @param {Object} data - Event data
   */
  ChakraApp.PanelController.prototype._handlePanelVisibilityChanged = function(data) {
    var panelId = data.panel;
    var visible = data.visible;
    
    if (panelId && visible !== undefined) {
      this._applyPanelVisibility(panelId, visible);
    }
  };
  
  /**
   * Apply visibility to a panel
   * @private
   * @param {string} panelId - Panel ID
   * @param {boolean} visible - Whether the panel should be visible
   */
  ChakraApp.PanelController.prototype._applyPanelVisibility = function(panelId, visible) {
  var panel = this._getPanelElement(panelId);
  var toggleBtn = this.toggleButtons[panelId];
  
  if (!panel) return;
  
  if (visible) {
    panel.classList.remove('hidden');
    if (toggleBtn) {
      toggleBtn.classList.remove('panel-hidden');
    }
  } else {
    panel.classList.add('hidden');
    if (toggleBtn) {
      toggleBtn.classList.add('panel-hidden');
    }
  }

  // Adjust layout as needed
  this._adjustLayoutForVisibility();
  
  // Update ConceptPanelManager if available
  if (ChakraApp.ConceptPanelManager) {
    ChakraApp.ConceptPanelManager._updatePanelStyles();
  return;
    ChakraApp.ConceptPanelManager._updateToggleButtonPositions(this);
  }
};
  
  /**
   * Adjust layout based on visible panels
   * @private
   */
  ChakraApp.PanelController.prototype._adjustLayoutForVisibility = function() {
    // Adjust container layout based on which panels are visible
    var leftVisible = ChakraApp.appState.panelVisibility.left;
    var bottomVisible = ChakraApp.appState.panelVisibility.bottom;
    
    if (this.leftPanel) {
      this.leftPanel.style.width = leftVisible ? '400px' : '0';
    }
    
    if (this.bottomPanel) {
      this.bottomPanel.style.height = bottomVisible ? '150px' : '0';
    }
    
    if (this.centerContainer) {
      // Adjust center container to fill space
      var centerWidth = '100%';
      if (leftVisible) centerWidth = '75%';
      
      this.centerContainer.style.width = centerWidth;
      this.centerContainer.style.flex = leftVisible ? '1' : '2';
    }
  };
  
  /**
   * Get panel element by ID
   * @private
   * @param {string} panelId - Panel ID
   * @returns {Element|null} Panel element or null if not found
   */
/**
 * Get panel element by ID
 * @private
 * @param {string} panelId - Panel ID
 * @returns {Element|null} Panel element or null if not found
 */
ChakraApp.PanelController.prototype._getPanelElement = function(panelId) {
  switch (panelId) {
    case 'left': return this.leftPanel;
    case 'bottom': return this.bottomPanel;
    case 'center': return this.centerPanel;
    default: 
      // For dynamic panels, search by data-panel-id attribute
      return document.querySelector('.circle-panel[data-panel-id="' + panelId + '"]');
  }
};
  
  /**
   * Toggle panel visibility
   * @param {string} panelId - Panel ID
   * @returns {boolean} New visibility state
   */
  ChakraApp.PanelController.prototype.togglePanel = function(panelId) {
  // First check if the panel is a concept panel that wasn't initialized with appState
  if (!ChakraApp.appState.panelVisibility.hasOwnProperty(panelId)) {
    // Initialize it in the panelVisibility object if it's missing
    ChakraApp.appState.panelVisibility[panelId] = true;
  }

  // Now toggle the visibility
  ChakraApp.appState.panelVisibility[panelId] = !ChakraApp.appState.panelVisibility[panelId];
  
  // Apply the visibility change
  this._applyPanelVisibility(panelId, ChakraApp.appState.panelVisibility[panelId]);
  return;
  
  // Publish the event
  ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
    panel: panelId,
    visible: ChakraApp.appState.panelVisibility[panelId]
  });
  
  // Save panel state to local storage
  ChakraApp.appState._savePanelState();
  
  return ChakraApp.appState.panelVisibility[panelId];
};
  
  /**
   * Show a panel
   * @param {string} panelId - Panel ID
   */
  ChakraApp.PanelController.prototype.showPanel = function(panelId) {
    if (!ChakraApp.appState.isPanelVisible(panelId)) {
      ChakraApp.appState.togglePanelVisibility(panelId);
    }
  };
  
  /**
   * Hide a panel
   * @param {string} panelId - Panel ID
   */
  ChakraApp.PanelController.prototype.hidePanel = function(panelId) {
    if (ChakraApp.appState.isPanelVisible(panelId)) {
      ChakraApp.appState.togglePanelVisibility(panelId);
    }
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.PanelController.prototype.destroy = function() {
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
    
    // Remove toggle buttons
    Object.values(this.toggleButtons).forEach(function(btn) {
      if (btn && btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });
    
    // Clear toggle buttons object
    this.toggleButtons = {};
  };
  
})(window.ChakraApp = window.ChakraApp || {});
