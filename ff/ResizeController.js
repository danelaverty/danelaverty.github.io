// Simplified ResizeController.js - Removed global divider, focuses on panel coordination
(function(ChakraApp) {
  ChakraApp.ResizeController = function() {
    this.leftContainer = null;
    this.centerContainer = null;
    this.mainContainer = null;
    
    // Event subscriptions
    this.eventSubscriptions = {};
  };

  ChakraApp.ResizeController.prototype.init = function() {
    this._getDOMElements();
    this._setupEventListeners();
    this._calculateMaxWidth();
  };

  ChakraApp.ResizeController.prototype._getDOMElements = function() {
    this.leftContainer = document.getElementById('left-container');
    this.centerContainer = document.getElementById('center-container');
    this.mainContainer = document.getElementById('main-container');
    
    if (!this.leftContainer || !this.centerContainer || !this.mainContainer) {
      console.error('ResizeController: Required DOM elements not found');
      return false;
    }
    return true;
  };

  ChakraApp.ResizeController.prototype._setupEventListeners = function() {
    var self = this;

    // Window resize event - REMOVED the automatic panel width constraining
    window.addEventListener('resize', function() {
      self._calculateMaxWidth();
      // REMOVED: self._constrainPanelWidths(); // This was causing panels to resize on window resize
      self._updateLayout(); // Only update layout, don't change panel widths
    });

    // Listen for panel changes
    this.eventSubscriptions.panelAdded = ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function() {
      self._updateLayout();
    });

    this.eventSubscriptions.panelRemoved = ChakraApp.EventBus.subscribe('LEFT_PANEL_REMOVED', function() {
      self._updateLayout();
    });

    this.eventSubscriptions.panelMinimized = ChakraApp.EventBus.subscribe('LEFT_PANEL_MINIMIZED', function() {
      self._updateLayout();
    });

    this.eventSubscriptions.panelRestored = ChakraApp.EventBus.subscribe('LEFT_PANEL_RESTORED', function() {
      self._updateLayout();
    });

    // Listen for individual panel width changes
    this.eventSubscriptions.panelWidthChanged = ChakraApp.EventBus.subscribe('PANEL_WIDTH_CHANGED', function(data) {
      self._onPanelWidthChanged(data);
    });
  };

  ChakraApp.ResizeController.prototype._calculateMaxWidth = function() {
    var windowWidth = window.innerWidth;
    this.maxTotalWidth = Math.floor(windowWidth * 0.8); // Max 80% of window width
  };

  // MODIFIED: This method is now only called manually, not automatically on window resize
  ChakraApp.ResizeController.prototype._constrainPanelWidths = function() {
    if (!ChakraApp.app.leftPanelManager) return;
    
    var leftPanelManager = ChakraApp.app.leftPanelManager;
    var totalWidth = 0;
    var panelWidths = [];
    
    // Calculate current total width
    leftPanelManager.leftPanels.forEach(function(panelData, panelId) {
      var width = leftPanelManager.getPanelWidth(panelId);
      totalWidth += width;
      panelWidths.push({ panelId: panelId, width: width });
    });
    
    // If total width exceeds maximum, proportionally reduce all panels
    if (totalWidth > this.maxTotalWidth) {
      var scaleFactor = this.maxTotalWidth / totalWidth;
      
      panelWidths.forEach(function(panelInfo) {
        var newWidth = Math.max(
          leftPanelManager.minPanelWidth,
          Math.floor(panelInfo.width * scaleFactor)
        );
        leftPanelManager.setPanelWidth(panelInfo.panelId, newWidth);
      });
    }
  };

  ChakraApp.ResizeController.prototype._updateLayout = function() {
    // Simple layout update - mainly handled by LeftPanelManager now
    if (ChakraApp.app.leftPanelManager) {
      ChakraApp.app.leftPanelManager._updateLeftContainerWidth();
    }
    
    // Update circle positions if needed
    this._updateCirclePositions();
  };

  ChakraApp.ResizeController.prototype._onPanelWidthChanged = function(data) {
    console.log('ResizeController: Panel width changed', data);
    
    // Called when an individual panel width changes
    // Update circle positions for the changed panel
    this._updateCirclePositionsForPanel(data.panelId);
  };
  
  ChakraApp.ResizeController.prototype._updateCirclePositions = function() {
    // Update all visible circle positions when layout changes
    if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
      ChakraApp.app.viewManager.circleViews.forEach(function(circleView, key) {
        if (circleView && circleView.updatePosition) {
          circleView.updatePosition();
        }
      });
    }
  };

  ChakraApp.ResizeController.prototype._updateCirclePositionsForPanel = function(panelId) {
    console.log('ResizeController: Updating circle positions for panel', panelId);
    
    // Update circle positions for a specific panel
    if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
      var updatedCount = 0;
      ChakraApp.app.viewManager.circleViews.forEach(function(circleView, key) {
        // Check if this circle belongs to the specified panel
        if (circleView.model && circleView._shouldUpdateForPanel) {
          var shouldUpdate = circleView._shouldUpdateForPanel(panelId);
          console.log('Circle', circleView.viewModel.id, 'should update for panel', panelId, ':', shouldUpdate);
          
          if (shouldUpdate && circleView.updatePosition) {
            console.log('Updating position for circle', circleView.viewModel.id);
            circleView.updatePosition();
            updatedCount++;
          }
        }
      });
      console.log('Updated positions for', updatedCount, 'circles in panel', panelId);
    }
  };

  ChakraApp.ResizeController.prototype._forceUpdateCirclesInPanel = function(panelId) {
    console.log('ResizeController: Force updating all circles in panel', panelId);
    
    if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
      ChakraApp.app.viewManager.circleViews.forEach(function(circleView, key) {
        // Get the circle's panel ID
        var circlePanelId = circleView._getPanelIdFromCircleView();
        console.log('Circle', circleView.viewModel.id, 'is in panel', circlePanelId);
        
        if (circlePanelId === panelId) {
          console.log('Force updating circle', circleView.viewModel.id, 'position');
          circleView.updatePosition();
        }
      });
    }
  };

  ChakraApp.ResizeController.prototype._updateAllCirclePositions = function() {
    if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
      ChakraApp.app.viewManager.circleViews.forEach(function(circleView, key) {
        if (circleView && circleView.updatePosition) {
          circleView.updatePosition();
        }
      });
    }
  };

  // Compatibility method for CircleView - redirect to LeftPanelManager
  ChakraApp.ResizeController.prototype.getCurrentPanelWidth = function() {
    console.warn('ResizeController.getCurrentPanelWidth() is deprecated. Use LeftPanelManager.getPanelWidth(panelId) instead.');
    
    // Try to get a default panel width from LeftPanelManager
    if (ChakraApp.app && ChakraApp.app.leftPanelManager) {
      // Return width of first panel or default width
      var firstPanelId = null;
      ChakraApp.app.leftPanelManager.leftPanels.forEach(function(panelData, panelId) {
        if (firstPanelId === null) {
          firstPanelId = panelId;
        }
      });
      
      if (firstPanelId !== null) {
        return ChakraApp.app.leftPanelManager.getPanelWidth(firstPanelId);
      }
    }
    
    return 400; // Fallback default
  };

  // Utility method to get current total width of all panels
  ChakraApp.ResizeController.prototype.getCurrentTotalWidth = function() {
    var totalWidth = 0;
    
    if (ChakraApp.app.leftPanelManager) {
      ChakraApp.app.leftPanelManager.leftPanels.forEach(function(panelData, panelId) {
        totalWidth += ChakraApp.app.leftPanelManager.getPanelWidth(panelId);
      });
    }
    
    return totalWidth;
  };

  // NEW: Manual method to constrain panel widths when needed
  ChakraApp.ResizeController.prototype.constrainPanelWidthsManually = function() {
    this._constrainPanelWidths();
  };

  // Method to distribute available space evenly among panels
  ChakraApp.ResizeController.prototype.distributeSpaceEvenly = function() {
    if (!ChakraApp.app.leftPanelManager) return;
    
    var leftPanelManager = ChakraApp.app.leftPanelManager;
    var panelCount = leftPanelManager.leftPanels.size;
    
    if (panelCount === 0) return;
    
    var availableWidth = this.maxTotalWidth;
    var targetPanelWidth = Math.floor(availableWidth / panelCount);
    
    // Ensure minimum width
    targetPanelWidth = Math.max(leftPanelManager.minPanelWidth, targetPanelWidth);
    
    leftPanelManager.leftPanels.forEach(function(panelData, panelId) {
      leftPanelManager.setPanelWidth(panelId, targetPanelWidth);
    });
  };

  ChakraApp.ResizeController.prototype.destroy = function() {
    // Clean up event subscriptions
    Object.values(this.eventSubscriptions).forEach(function(unsubscribe) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    this.eventSubscriptions = {};
  };

})(window.ChakraApp = window.ChakraApp || {});
