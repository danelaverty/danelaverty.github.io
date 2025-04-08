// src/controllers/PanelController.js
(function(ChakraApp) {
  /**
   * Controls panel visibility and behaviors
   */
  ChakraApp.PanelController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.rightContainer = null;
    
    // State
    this.rightPanelVisible = false;
    
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
    
    // Set up event subscriptions
    this._setupEventSubscriptions();
  };
  
  /**
   * Initialize DOM elements
   * @private
   */
  ChakraApp.PanelController.prototype._initializeDomElements = function() {
    this.rightContainer = document.getElementById('right-container');
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
   * @param {boolean} visible - Whether panel should be visible
   */
  ChakraApp.PanelController.prototype._handlePanelVisibilityChanged = function(visible) {
    if (visible) {
      this.showRightPanel();
    } else {
      this.hideRightPanel();
    }
  };
  
  /**
   * Show right panel
   */
  ChakraApp.PanelController.prototype.showRightPanel = function() {
    if (!this.rightContainer) return;
    
    this.rightPanelVisible = true;
    this.rightContainer.classList.add('visible');
    document.body.classList.remove('right-panel-hidden');
    document.body.classList.add('right-panel-visible');
  };
  
  /**
   * Hide right panel
   */
  ChakraApp.PanelController.prototype.hideRightPanel = function() {
    if (!this.rightContainer) return;
    
    this.rightPanelVisible = false;
    this.rightContainer.classList.remove('visible');
    document.body.classList.add('right-panel-hidden');
    document.body.classList.remove('right-panel-visible');
  };
  
  /**
   * Toggle right panel visibility
   * @param {boolean} visible - Whether panel should be visible (if not provided, current state is toggled)
   */
  ChakraApp.PanelController.prototype.toggleRightPanel = function(visible) {
    if (visible === undefined) {
      visible = !this.rightPanelVisible;
    }
    
    if (visible) {
      this.showRightPanel();
    } else {
      this.hideRightPanel();
    }
    
    // Publish the event
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, visible);
    
    return visible;
  };
  
  /**
   * Check if right panel is visible
   * @returns {boolean} Is the right panel visible
   */
  ChakraApp.PanelController.prototype.isRightPanelVisible = function() {
    return this.rightPanelVisible;
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
  };
  
})(window.ChakraApp = window.ChakraApp || {});
