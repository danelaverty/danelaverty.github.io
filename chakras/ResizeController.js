// ResizeController.js - Handles draggable divider between left-container and center-container
(function(ChakraApp) {
  ChakraApp.ResizeController = function() {
    this.isDragging = false;
    this.divider = null;
    this.leftContainer = null;
    this.centerContainer = null;
    this.mainContainer = null;
    this.startX = 0;
    this.startLeftWidth = 0;
    this.minLeftWidth = 200; // Minimum width for left container
    this.maxLeftWidth = null; // Will be calculated based on window width
    
    // Dynamic panel width management
    this.basePanelWidth = 400; // Default panel width
    this.currentPanelWidth = 400; // Current dynamic panel width
    this.panelWidthKey = 'chakra_panel_width';
  };

  ChakraApp.ResizeController.prototype.init = function() {
    this._getDOMElements();
    this._loadSavedPanelWidth();
    this._createDivider();
    this._setupEventListeners();
    this._calculateMaxWidth();
    this._updatePanelWidths();
    this._enableTransitionsAfterDelay(); // NEW: Enable transitions after initial setup
  };

  // NEW: Enable transitions after initial load to prevent flash
  ChakraApp.ResizeController.prototype._enableTransitionsAfterDelay = function() {
    var self = this;
    setTimeout(function() {
      // Add transition classes to enable smooth animations
      if (self.leftContainer) {
        self.leftContainer.classList.add('transitions-enabled');
      }
      
      // Add transitions to all existing panels
      document.querySelectorAll('.left-panel').forEach(function(panel) {
        panel.classList.add('transitions-enabled');
      });
    }, 100); // Small delay to ensure initial layout is complete
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

  ChakraApp.ResizeController.prototype._loadSavedPanelWidth = function() {
    try {
      var savedWidth = localStorage.getItem(this.panelWidthKey);
      if (savedWidth) {
        this.currentPanelWidth = Math.max(200, Math.min(600, parseInt(savedWidth)));
      }
    } catch (e) {
      console.warn('Could not load saved panel width:', e);
    }
  };

  ChakraApp.ResizeController.prototype._savePanelWidth = function() {
    try {
      localStorage.setItem(this.panelWidthKey, this.currentPanelWidth.toString());
    } catch (e) {
      console.warn('Could not save panel width:', e);
    }
  };

  ChakraApp.ResizeController.prototype._createDivider = function() {
    this.divider = document.createElement('div');
    this.divider.id = 'resize-divider';
    this.divider.className = 'resize-divider';
    
    // Style the divider
    Object.assign(this.divider.style, {
      position: 'absolute',
      top: '0',
      bottom: '0',
      width: '4px',
      backgroundColor: 'transparent',
      cursor: 'ew-resize',
      zIndex: '1001',
      borderLeft: '1px solid #444',
      borderRight: '1px solid #444'
    });

    // Add hover effect
    this.divider.addEventListener('mouseenter', () => {
      this.divider.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });

    this.divider.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.divider.style.backgroundColor = 'transparent';
      }
    });

    this.mainContainer.appendChild(this.divider);
    this._updateDividerPosition();
  };

  ChakraApp.ResizeController.prototype._updateDividerPosition = function() {
    if (this.divider && this.leftContainer) {
      var leftWidth = parseInt(this.leftContainer.style.width) || 0;
      this.divider.style.left = leftWidth + 'px';
    }
  };

  ChakraApp.ResizeController.prototype._setupEventListeners = function() {
    var self = this;

    // Mouse events for dragging
    this.divider.addEventListener('mousedown', function(e) {
      self._startDrag(e);
    });

    document.addEventListener('mousemove', function(e) {
      self._handleDrag(e);
    });

    document.addEventListener('mouseup', function(e) {
      self._endDrag(e);
    });

    // Window resize event
    window.addEventListener('resize', function() {
      self._calculateMaxWidth();
      self._constrainLeftWidth();
    });

    // Listen for panel changes
    ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function() {
      self._updateContainerForPanelChange('add');
    });

    ChakraApp.EventBus.subscribe('LEFT_PANEL_REMOVED', function() {
      self._updateContainerForPanelChange('remove');
    });

    ChakraApp.EventBus.subscribe('LEFT_PANEL_MINIMIZED', function() {
      self._updateContainerForPanelChange('minimize');
    });

    ChakraApp.EventBus.subscribe('LEFT_PANEL_RESTORED', function() {
      self._updateContainerForPanelChange('restore');
    });
  };

  ChakraApp.ResizeController.prototype._startDrag = function(e) {
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.clientX;
    this.startLeftWidth = parseInt(this.leftContainer.style.width) || 0;
    
    this.divider.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    // NEW: Disable transitions during dragging to prevent lag
    this._disableTransitionsDuringDrag();
  };

  ChakraApp.ResizeController.prototype._handleDrag = function(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    var deltaX = e.clientX - this.startX;
    var newLeftWidth = this.startLeftWidth + deltaX;

    // Constrain the width
    newLeftWidth = Math.max(this.minLeftWidth, newLeftWidth);
    newLeftWidth = Math.min(this.maxLeftWidth, newLeftWidth);

    // Update the layout
    this._setLeftContainerWidth(newLeftWidth);
    this._updateDividerPosition();

    // Calculate new panel width based on number of visible panels
    this._calculatePanelWidthFromContainer();
  };

  ChakraApp.ResizeController.prototype._handleDrag = function(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    var deltaX = e.clientX - this.startX;
    var newLeftWidth = this.startLeftWidth + deltaX;

    // Constrain the width
    newLeftWidth = Math.max(this.minLeftWidth, newLeftWidth);
    newLeftWidth = Math.min(this.maxLeftWidth, newLeftWidth);

    // Update the layout
    this._setLeftContainerWidth(newLeftWidth);
    this._updateDividerPosition();

    // Calculate new panel width based on number of visible panels
    this._calculatePanelWidthFromContainer();
  };

  ChakraApp.ResizeController.prototype._endDrag = function(e) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.divider.style.backgroundColor = 'transparent';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // NEW: Re-enable transitions after dragging
    this._enableTransitionsAfterDrag();

    // Save the new panel width
    this._savePanelWidth();

    // Update all existing panels to use the new width
    this._updatePanelWidths();
  };

  ChakraApp.ResizeController.prototype._disableTransitionsDuringDrag = function() {
    if (this.leftContainer) {
      this.leftContainer.classList.add('no-transition');
    }
    
    // Disable transitions on all panels
    document.querySelectorAll('.left-panel').forEach(function(panel) {
      panel.classList.add('no-transition');
    });
    
    // Disable transition on center container if it exists
    var centerContainer = document.getElementById('center-container');
    if (centerContainer) {
      centerContainer.classList.add('no-transition');
    }
  };

  // NEW: Re-enable transitions after drag
  ChakraApp.ResizeController.prototype._enableTransitionsAfterDrag = function() {
    var self = this;
    
    // Small delay to ensure layout has settled
    setTimeout(function() {
      if (self.leftContainer) {
        self.leftContainer.classList.remove('no-transition');
      }
      
      // Re-enable transitions on all panels
      document.querySelectorAll('.left-panel').forEach(function(panel) {
        panel.classList.remove('no-transition');
      });
      
      // Re-enable transition on center container
      var centerContainer = document.getElementById('center-container');
      if (centerContainer) {
        centerContainer.classList.remove('no-transition');
      }
    }, 50);
  };

  ChakraApp.ResizeController.prototype._calculateMaxWidth = function() {
    var windowWidth = window.innerWidth;
    this.maxLeftWidth = Math.floor(windowWidth * 0.8); // Max 80% of window width
  };

  ChakraApp.ResizeController.prototype._constrainLeftWidth = function() {
    var currentWidth = parseInt(this.leftContainer.style.width) || 0;
    if (currentWidth > this.maxLeftWidth) {
      this._setLeftContainerWidth(this.maxLeftWidth);
      this._updateDividerPosition();
      this._calculatePanelWidthFromContainer();
      this._updatePanelWidths();
    }
  };

  ChakraApp.ResizeController.prototype._setLeftContainerWidth = function(width) {
    this.leftContainer.style.width = width + 'px';
    this.leftContainer.style.minWidth = width + 'px';
  };

  ChakraApp.ResizeController.prototype._calculatePanelWidthFromContainer = function() {
    var containerWidth = parseInt(this.leftContainer.style.width) || 0;
    var visiblePanelCount = this._getVisiblePanelCount();
    
    if (visiblePanelCount > 0) {
      this.currentPanelWidth = Math.floor(containerWidth / visiblePanelCount);
    }
  };

  ChakraApp.ResizeController.prototype._getVisiblePanelCount = function() {
    if (ChakraApp.appState && ChakraApp.appState.leftPanels) {
      var visibleCount = 0;
      ChakraApp.appState.leftPanels.forEach(function(panelState) {
        if (!panelState.minimized) {
          visibleCount++;
        }
      });
      return visibleCount;
    }
    return 0;
  };

  ChakraApp.ResizeController.prototype._updateContainerForPanelChange = function(changeType) {
    var visiblePanelCount = this._getVisiblePanelCount();
    var newContainerWidth;

    switch (changeType) {
      case 'add':
      case 'restore':
        // Add one panel width to container
        newContainerWidth = visiblePanelCount * this.currentPanelWidth;
        break;
      case 'remove':
      case 'minimize':
        // Remove one panel width from container
        newContainerWidth = visiblePanelCount * this.currentPanelWidth;
        break;
      default:
        newContainerWidth = visiblePanelCount * this.currentPanelWidth;
    }

    // Ensure minimum width
    newContainerWidth = Math.max(this.minLeftWidth, newContainerWidth);
    newContainerWidth = Math.min(this.maxLeftWidth, newContainerWidth);

    this._setLeftContainerWidth(newContainerWidth);
    this._updateDividerPosition();
    this._updatePanelWidths();
  };

  ChakraApp.ResizeController.prototype._updatePanelWidths = function() {
  var self = this;
  
  // Update all existing panel elements
  document.querySelectorAll('.left-panel').forEach(function(panel) {
    panel.style.width = self.currentPanelWidth + 'px';
  });

  // Update the LeftPanelManager if it exists
  if (ChakraApp.app && ChakraApp.app.leftPanelManager) {
    ChakraApp.app.leftPanelManager._updateLeftContainerWidth();
  }
  
  // Update circle positions to maintain center-relative positioning
  this._updateCirclePositions();
};

  ChakraApp.ResizeController.prototype.getCurrentPanelWidth = function() {
    return this.currentPanelWidth;
  };

  ChakraApp.ResizeController.prototype._updateCirclePositions = function() {
  // Update all visible circle positions when panel width changes
  if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
    ChakraApp.app.viewManager.circleViews.forEach(function(circleView, key) {
      if (circleView && circleView.updatePosition) {
        circleView.updatePosition(); // This will use the new center-relative logic
      }
    });
  }
};

  ChakraApp.ResizeController.prototype.setPanelWidth = function(width) {
    this.currentPanelWidth = Math.max(200, Math.min(600, width));
    this._savePanelWidth();
    
    var visiblePanelCount = this._getVisiblePanelCount();
    var newContainerWidth = visiblePanelCount * this.currentPanelWidth;
    
    this._setLeftContainerWidth(newContainerWidth);
    this._updateDividerPosition();
    this._updatePanelWidths();
  };

  ChakraApp.ResizeController.prototype.destroy = function() {
    if (this.divider && this.divider.parentNode) {
      this.divider.parentNode.removeChild(this.divider);
    }
    
    // Reset body styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

})(window.ChakraApp = window.ChakraApp || {});
