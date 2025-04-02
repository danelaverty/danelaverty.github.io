// src/controllers/ZoomController.js
// Handles zoom functionality

(function(ChakraApp) {
  /**
   * Zoom controller for handling zoom functionality
   */
  ChakraApp.ZoomController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.zoomContainer = null;
    this.zoomInBtn = null;
    this.zoomOutBtn = null;
    
    // State variables for dragging
    this.isDragging = false;
    this.startPos = { x: 0, y: 0 };
    
    // Event handlers
    this.zoomInHandler = null;
    this.zoomOutHandler = null;
    this.keyboardHandler = null;
    this.mouseDownHandler = null;
    this.mouseMoveHandler = null;
    this.mouseUpHandler = null;
    this.touchStartHandler = null;
    this.touchMoveHandler = null;
    this.touchEndHandler = null;
    this.zoomChangeSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.ZoomController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.ZoomController.prototype.constructor = ChakraApp.ZoomController;
  
  // Initialize
  ChakraApp.ZoomController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Get DOM elements
    this.zoomContainer = document.getElementById('zoom-container');
    this.zoomInBtn = document.getElementById('zoom-in-btn');
    this.zoomOutBtn = document.getElementById('zoom-out-btn');
    
    // Apply initial zoom level
    this._applyZoom(ChakraApp.appState.zoomLevel);
    
    // Set up button click handlers
    this._setupButtonHandlers();
    
    // Set up keyboard shortcuts
    this._setupKeyboardShortcuts();
    
    // Set up dragging functionality
    this._setupDragFunctionality();
    
    // Subscribe to zoom change events
    var self = this;
    this.zoomChangeSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.ZOOM_CHANGED,
      function(level) {
        self._applyZoom(level);
      }
    );
  };
  
  // Apply zoom scale to container
  ChakraApp.ZoomController.prototype._applyZoom = function(level) {
    if (!this.zoomContainer) return;
    
    var position = ChakraApp.appState.containerPosition;
    
    this.zoomContainer.style.transform = 
      'translate(' + position.x + 'px, ' + position.y + 'px) scale(' + level + ')';
    
    // Update visual state
    if (level > 1.0) {
      this.zoomContainer.classList.add('zoomed');
    } else {
      this.zoomContainer.classList.remove('zoomed');
    }
  };
  
  // Set up button handlers
  ChakraApp.ZoomController.prototype._setupButtonHandlers = function() {
    if (!this.zoomInBtn || !this.zoomOutBtn) return;
    
    var self = this;
    
    // Zoom in button
    this.zoomInHandler = function(e) {
      e.stopPropagation();
      var currentZoom = ChakraApp.appState.zoomLevel;
      var newZoom = Math.min(2.5, currentZoom + 0.2);
      ChakraApp.appState.updateZoomLevel(newZoom);
    };
    
    // Zoom out button
    this.zoomOutHandler = function(e) {
      e.stopPropagation();
      var currentZoom = ChakraApp.appState.zoomLevel;
      var newZoom = Math.max(0.5, currentZoom - 0.2);
      ChakraApp.appState.updateZoomLevel(newZoom);
    };
    
    this.zoomInBtn.addEventListener('click', this.zoomInHandler);
    this.zoomOutBtn.addEventListener('click', this.zoomOutHandler);
  };
  
  // Set up keyboard shortcuts
  ChakraApp.ZoomController.prototype._setupKeyboardShortcuts = function() {
    var self = this;
    
    this.keyboardHandler = function(e) {
      // Skip if we're editing text
      var activeElement = document.activeElement;
      var isEditingText = activeElement && 
                          (activeElement.isContentEditable || 
                           activeElement.tagName.toLowerCase() === 'input' || 
                           activeElement.tagName.toLowerCase() === 'textarea');
      
      if (isEditingText) return;
      
      // Ctrl/Cmd + Plus to zoom in
      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        if (self.zoomInBtn) {
          self.zoomInBtn.click();
        }
      }
      
      // Ctrl/Cmd + Minus to zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (self.zoomOutBtn) {
          self.zoomOutBtn.click();
        }
      }
      
      // Ctrl/Cmd + 0 to reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        ChakraApp.appState.updateZoomLevel(1.0);
      }
    };
    
    document.addEventListener('keydown', this.keyboardHandler);
  };
  
  // Set up dragging functionality
  ChakraApp.ZoomController.prototype._setupDragFunctionality = function() {
    if (!this.zoomContainer) return;
    
    var self = this;
    
    // Start drag
    this.mouseDownHandler = function(e) {
      // Only allow dragging when zoomed in
      if (ChakraApp.appState.zoomLevel <= 1.0) return;
      
      // Prevent dragging if the click/touch was on a circle or button
      if (e.target !== self.zoomContainer) {
        // Check if the parent chain includes a circle or button
        var element = e.target;
        while (element && element !== self.zoomContainer) {
          if (element.classList && (
            element.classList.contains('circle') || 
            element.classList.contains('add-btn') || 
            element.classList.contains('zoom-btn')
          )) {
            return; // Don't start drag on interactive elements
          }
          element = element.parentElement;
        }
      }
      
      e.preventDefault();
      
      // Get start position
      self.startPos.x = e.clientX;
      self.startPos.y = e.clientY;
      
      self.isDragging = true;
      self.zoomContainer.classList.add('dragging');
    };
    
    // Touch start (mobile)
    this.touchStartHandler = function(e) {
      // Only allow dragging when zoomed in
      if (ChakraApp.appState.zoomLevel <= 1.0) return;
      
      // Similar checks as mousedown for touch events
      if (e.target !== self.zoomContainer) {
        var element = e.target;
        while (element && element !== self.zoomContainer) {
          if (element.classList && (
            element.classList.contains('circle') || 
            element.classList.contains('add-btn') || 
            element.classList.contains('zoom-btn')
          )) {
            return;
          }
          element = element.parentElement;
        }
      }
      
      e.preventDefault();
      
      // Get start position from touch
      self.startPos.x = e.touches[0].clientX;
      self.startPos.y = e.touches[0].clientY;
      
      self.isDragging = true;
      self.zoomContainer.classList.add('dragging');
    };
    
    // Drag move
    this.mouseMoveHandler = function(e) {
      if (!self.isDragging) return;
      
      e.preventDefault();
      
      // Calculate movement delta
      var deltaX = e.clientX - self.startPos.x;
      var deltaY = e.clientY - self.startPos.y;
      
      // Update start position for next move
      self.startPos.x = e.clientX;
      self.startPos.y = e.clientY;
      
      // Get current container position
      var containerPos = { 
        x: ChakraApp.appState.containerPosition.x, 
        y: ChakraApp.appState.containerPosition.y 
      };
      
      // Update container position
      containerPos.x += deltaX;
      containerPos.y += deltaY;
      
      // Apply limits to keep container partially visible
      var panelRect = document.getElementById('left-panel').getBoundingClientRect();
      
      // Calculate maximum allowed offsets based on zoom level and panel size
      var zoomLevel = ChakraApp.appState.zoomLevel;
      var maxOffsetX = panelRect.width * (zoomLevel - 0.5);
      var maxOffsetY = panelRect.height * (zoomLevel - 0.5);
      
      // Apply limits
      containerPos.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, containerPos.x));
      containerPos.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, containerPos.y));
      
      // Update app state
      ChakraApp.appState.updateContainerPosition(containerPos);
    };
    
    // Touch move (mobile)
    this.touchMoveHandler = function(e) {
      if (!self.isDragging) return;
      
      e.preventDefault();
      
      // Calculate movement delta from touch
      var deltaX = e.touches[0].clientX - self.startPos.x;
      var deltaY = e.touches[0].clientY - self.startPos.y;
      
      // Update start position for next move
      self.startPos.x = e.touches[0].clientX;
      self.startPos.y = e.touches[0].clientY;
      
      // Get current container position
      var containerPos = { 
        x: ChakraApp.appState.containerPosition.x, 
        y: ChakraApp.appState.containerPosition.y 
      };
      
      // Update container position
      containerPos.x += deltaX;
      containerPos.y += deltaY;
      
      // Apply the same limits as in mouse move
      var panelRect = document.getElementById('left-panel').getBoundingClientRect();
      var zoomLevel = ChakraApp.appState.zoomLevel;
      var maxOffsetX = panelRect.width * (zoomLevel - 0.5);
      var maxOffsetY = panelRect.height * (zoomLevel - 0.5);
      
      containerPos.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, containerPos.x));
      containerPos.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, containerPos.y));
      
      // Update app state
      ChakraApp.appState.updateContainerPosition(containerPos);
    };
    
    // End drag
    this.mouseUpHandler = function() {
      if (!self.isDragging) return;
      
      self.isDragging = false;
      self.zoomContainer.classList.remove('dragging');
    };
    
    // Touch end (mobile)
    this.touchEndHandler = function() {
      if (!self.isDragging) return;
      
      self.isDragging = false;
      self.zoomContainer.classList.remove('dragging');
    };
    
    // Add event listeners
    this.zoomContainer.addEventListener('mousedown', this.mouseDownHandler);
    this.zoomContainer.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    document.addEventListener('mousemove', this.mouseMoveHandler);
    document.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    document.addEventListener('mouseup', this.mouseUpHandler);
    document.addEventListener('touchend', this.touchEndHandler);
  };
  
  // Clean up
  ChakraApp.ZoomController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Remove zoom button event listeners
    if (this.zoomInBtn && this.zoomInHandler) {
      this.zoomInBtn.removeEventListener('click', this.zoomInHandler);
    }
    
    if (this.zoomOutBtn && this.zoomOutHandler) {
      this.zoomOutBtn.removeEventListener('click', this.zoomOutHandler);
    }
    
    // Remove keyboard shortcut handler
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
    
    // Remove drag event listeners
    if (this.zoomContainer) {
      this.zoomContainer.removeEventListener('mousedown', this.mouseDownHandler);
      this.zoomContainer.removeEventListener('touchstart', this.touchStartHandler);
    }
    
    document.removeEventListener('mousemove', this.mouseMoveHandler);
    document.removeEventListener('touchmove', this.touchMoveHandler);
    document.removeEventListener('mouseup', this.mouseUpHandler);
    document.removeEventListener('touchend', this.touchEndHandler);
    
    // Clean up subscription
    if (this.zoomChangeSubscription) {
      this.zoomChangeSubscription();
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
