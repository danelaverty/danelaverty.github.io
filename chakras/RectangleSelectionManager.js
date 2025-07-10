// src/utils/RectangleSelectionManager.js
// Enhanced with support for both squares and circles

(function(ChakraApp) {
  /**
   * RectangleSelectionManager - handles rectangle selection of squares and circles
   */
  ChakraApp.RectangleSelectionManager = {
    // Selection state
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    
    // DOM elements
    selectionRectangle: null,
    targetPanel: null,
    
    // Event handlers (stored for cleanup)
    mouseMoveHandler: null,
    mouseUpHandler: null,
    mouseDownHandler: null,
    clickHandler: null,
    
    // Selection behavior
    minDragDistance: 5, // Minimum pixels to drag before starting selection
    
    // Flag to prevent click events after drag
    justFinishedDrag: false,
    
    // Track what type of panel we're selecting in
    currentPanelType: null, // 'center' or 'left'
    currentLeftPanelId: null, // For left panels
    
    /**
     * Initialize the rectangle selection manager
     * @param {Element} panel - The panel element to attach selection to
     */
    init: function(panel) {
      this.targetPanel = panel || document.getElementById('center-panel');
      if (!this.targetPanel) {
        console.error('RectangleSelectionManager: No target panel found');
        return;
      }
      
      this._createSelectionRectangle();
      this._attachEventListeners();
      
      // Initialize for all left panels too
      this._initializeLeftPanels();
    },
    
    /**
     * Initialize rectangle selection for all left panels
     * @private
     */
    _initializeLeftPanels: function() {
      var self = this;
      
      // Initialize existing left panels
      document.querySelectorAll('[id^="zoom-container-left-"]').forEach(function(leftPanel) {
        self._initializeLeftPanel(leftPanel);
      });
      
      // Listen for new left panels being created
      ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
        if (data && data.panelId !== undefined) {
          setTimeout(function() {
            var newLeftPanel = document.getElementById('zoom-container-left-' + data.panelId);
            if (newLeftPanel) {
              self._initializeLeftPanel(newLeftPanel);
            }
          }, 100);
        }
      });
    },
    
    /**
     * Initialize rectangle selection for a specific left panel
     * @private
     * @param {Element} leftPanel - The left panel zoom container
     */
    _initializeLeftPanel: function(leftPanel) {
      if (!leftPanel || leftPanel.dataset.rectangleSelectionInitialized) {
        return; // Already initialized
      }
      
      // Mark as initialized to prevent duplicate initialization
      leftPanel.dataset.rectangleSelectionInitialized = 'true';
      
      var self = this;
      
      // Create bound handlers for this specific panel
      var panelMouseDownHandler = function(e) {
        self._handleMouseDownForLeftPanel(e, leftPanel);
      };
      
      var panelClickHandler = function(e) {
        if (self.justFinishedDrag) {
          e.stopPropagation();
          e.preventDefault();
          self.justFinishedDrag = false;
        }
      };
      
      // Attach event listeners
      leftPanel.addEventListener('mousedown', panelMouseDownHandler);
      leftPanel.addEventListener('click', panelClickHandler, true);
      
      // Store handlers for cleanup (if needed later)
      if (!leftPanel._rectangleSelectionHandlers) {
        leftPanel._rectangleSelectionHandlers = {
          mouseDown: panelMouseDownHandler,
          click: panelClickHandler
        };
      }
    },
    
    /**
     * Handle mouse down for left panels (circles)
     * @private
     * @param {MouseEvent} e - Mouse event
     * @param {Element} leftPanel - The left panel element
     */
    _handleMouseDownForLeftPanel: function(e, leftPanel) {
      // Only start selection if conditions are met
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      
      // Check if we clicked directly on the panel
      var isValidTarget = (e.target === leftPanel) || 
                         (e.target.classList && e.target.classList.contains('zoom-container'));
      
      if (!isValidTarget) {
        return;
      }
      
      // Extract panel ID from the left panel
      var panelId = this._extractLeftPanelId(leftPanel);
      if (panelId === null) {
        return;
      }
      
      // Set up for left panel selection
      this.currentPanelType = 'left';
      this.currentLeftPanelId = panelId;
      this.targetPanel = leftPanel;
      
      // Create selection rectangle for this panel if it doesn't exist
      if (!leftPanel.querySelector('#selection-rectangle')) {
        this._createSelectionRectangleForPanel(leftPanel);
      }
      
      // Continue with standard mouse down handling
      this._handleMouseDown(e);
    },
    
    /**
     * Extract panel ID from left panel element
     * @private
     * @param {Element} leftPanel - Left panel element
     * @returns {number|null} Panel ID or null if not found
     */
    _extractLeftPanelId: function(leftPanel) {
      // Try to get from ID: zoom-container-left-X
      var idMatch = leftPanel.id.match(/zoom-container-left-(\d+)/);
      if (idMatch) {
        return parseInt(idMatch[1]);
      }
      
      // Try to get from data attribute
      if (leftPanel.dataset.panelId) {
        var panelIdMatch = leftPanel.dataset.panelId.match(/left-(\d+)/);
        if (panelIdMatch) {
          return parseInt(panelIdMatch[1]);
        }
      }
      
      return null;
    },
    
    /**
     * Create selection rectangle for a specific panel
     * @private
     * @param {Element} panel - Panel element
     */
    _createSelectionRectangleForPanel: function(panel) {
      var existingRectangle = panel.querySelector('#selection-rectangle');
      if (existingRectangle) {
        return existingRectangle;
      }
      
      var selectionRectangle = document.createElement('div');
      selectionRectangle.id = 'selection-rectangle';
      selectionRectangle.style.cssText = `
        position: absolute;
        border: 2px dashed #0078d4;
        background-color: rgba(0, 120, 212, 0.1);
        pointer-events: none;
        z-index: 1000;
        display: none;
        box-sizing: border-box;
      `;
      
      panel.appendChild(selectionRectangle);
      return selectionRectangle;
    },
    
    /**
     * Create the selection rectangle element
     * @private
     */
    _createSelectionRectangle: function() {
      this.selectionRectangle = document.createElement('div');
      this.selectionRectangle.id = 'selection-rectangle';
      this.selectionRectangle.style.cssText = `
        position: absolute;
        border: 2px dashed #0078d4;
        background-color: rgba(0, 120, 212, 0.1);
        pointer-events: none;
        z-index: 1000;
        display: none;
        box-sizing: border-box;
      `;
      
      // Add to the target panel
      this.targetPanel.appendChild(this.selectionRectangle);
    },
    
    /**
     * Attach event listeners to the target panel
     * @private
     */
    _attachEventListeners: function() {
      var self = this;
      
      // Create bound handlers for cleanup
      this.mouseDownHandler = function(e) {
        // Only handle center panel here, left panels have their own handlers
        if (self.targetPanel.id === 'center-panel') {
          self.currentPanelType = 'center';
          self.currentLeftPanelId = null;
          self._handleMouseDown(e);
        }
      };
      
      this.mouseMoveHandler = function(e) {
        self._handleMouseMove(e);
      };
      
      this.mouseUpHandler = function(e) {
        self._handleMouseUp(e);
      };
      
      // Click handler to prevent deselection after drag
      this.clickHandler = function(e) {
        if (self.justFinishedDrag) {
          e.stopPropagation();
          e.preventDefault();
          self.justFinishedDrag = false;
        }
      };
      
      // Mouse down - start selection
      this.targetPanel.addEventListener('mousedown', this.mouseDownHandler);
      
      // Click handler with high priority
      this.targetPanel.addEventListener('click', this.clickHandler, true);
    },
    
    /**
     * Handle mouse down event
     * @private
     * @param {MouseEvent} e - Mouse event
     */
    _handleMouseDown: function(e) {
      // Only start selection if:
      // 1. Left mouse button
      // 2. No modifier keys (to avoid interfering with existing CTRL/SHIFT behavior)
      // 3. Clicking directly on the panel (not on a circle/square or other element)
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      
      // Check if we clicked directly on the panel
      var isValidTarget = false;
      
      if (this.currentPanelType === 'center') {
        isValidTarget = (e.target === this.targetPanel) || 
                       (e.target.id === 'zoom-container-center') ||
                       (e.target.classList && e.target.classList.contains('center-panel'));
      } else if (this.currentPanelType === 'left') {
        isValidTarget = (e.target === this.targetPanel) || 
                       (e.target.classList && e.target.classList.contains('zoom-container'));
      }
      
      if (!isValidTarget) {
        return;
      }
      
      // Get the panel's bounding rect for coordinate calculations
      var panelRect = this.targetPanel.getBoundingClientRect();
      
      // Store starting position relative to the panel
      this.startX = e.clientX - panelRect.left;
      this.startY = e.clientY - panelRect.top;
      this.currentX = this.startX;
      this.currentY = this.startY;
      
      // Mark that we might be starting a selection
      this.isSelecting = false; // We'll set this to true once we've dragged enough
      
      // Add global mouse event listeners
      document.addEventListener('mousemove', this.mouseMoveHandler);
      document.addEventListener('mouseup', this.mouseUpHandler);
      
      // Prevent default to avoid text selection
      e.preventDefault();
    },
    
    /**
     * Handle mouse move event
     * @private
     * @param {MouseEvent} e - Mouse event
     */
    _handleMouseMove: function(e) {
      if (!this.mouseMoveHandler) return; // Safety check
      
      // Get the panel's bounding rect for coordinate calculations
      var panelRect = this.targetPanel.getBoundingClientRect();
      
      // Update current position relative to the panel
      this.currentX = e.clientX - panelRect.left;
      this.currentY = e.clientY - panelRect.top;
      
      // Check if we've moved far enough to start selection
      var dragDistance = Math.sqrt(
        Math.pow(this.currentX - this.startX, 2) + 
        Math.pow(this.currentY - this.startY, 2)
      );
      
      if (!this.isSelecting && dragDistance > this.minDragDistance) {
        this.isSelecting = true;
        this._showSelectionRectangle();
        
        // Clear any existing selection when starting new rectangle selection
        this._clearExistingSelections();
      }
      
      if (this.isSelecting) {
        this._updateSelectionRectangle();
        this._updateElementSelection();
      }
    },
    
    /**
     * Handle mouse up event
     * @private
     * @param {MouseEvent} e - Mouse event
     */
    _handleMouseUp: function(e) {
      // Remove global event listeners
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      document.removeEventListener('mouseup', this.mouseUpHandler);
      
      if (this.isSelecting) {
        // Finalize the selection
        this._finalizeSelection();
        this._hideSelectionRectangle();
        
        // Set flag to prevent immediate deselection on click
        this.justFinishedDrag = true;
        
        // Clear the flag after a short delay to allow normal clicking again
        var self = this;
        setTimeout(function() {
          self.justFinishedDrag = false;
        }, 100);
      }
      
      // Reset state
      this.isSelecting = false;
      this.currentPanelType = null;
      this.currentLeftPanelId = null;
    },
    
    /**
     * Clear existing selections based on panel type
     * @private
     */
    _clearExistingSelections: function() {
      if (this.currentPanelType === 'center') {
        // Clear square multi-selection
        if (ChakraApp.MultiSelectionManager) {
          ChakraApp.MultiSelectionManager.clearSelection();
        }
      } else if (this.currentPanelType === 'left') {
        // Clear circle multi-selection
        if (ChakraApp.CircleMultiSelectionManager) {
          ChakraApp.CircleMultiSelectionManager.clearSelection();
        }
      }
    },
    
    /**
     * Show the selection rectangle
     * @private
     */
    _showSelectionRectangle: function() {
      // Get the appropriate selection rectangle for the current panel
      var rectangle = this._getCurrentSelectionRectangle();
      if (rectangle) {
        rectangle.style.display = 'block';
      }
    },
    
    /**
     * Hide the selection rectangle
     * @private
     */
    _hideSelectionRectangle: function() {
      var rectangle = this._getCurrentSelectionRectangle();
      if (rectangle) {
        rectangle.style.display = 'none';
      }
    },
    
    /**
     * Get the current selection rectangle based on panel type
     * @private
     * @returns {Element|null} Selection rectangle element
     */
    _getCurrentSelectionRectangle: function() {
      if (this.currentPanelType === 'center') {
        return this.selectionRectangle;
      } else if (this.currentPanelType === 'left') {
        return this.targetPanel.querySelector('#selection-rectangle');
      }
      return null;
    },
    
    /**
     * Update the selection rectangle dimensions and position
     * @private
     */
    _updateSelectionRectangle: function() {
      var rectangle = this._getCurrentSelectionRectangle();
      if (!rectangle) return;
      
      // Calculate rectangle bounds
      var left = Math.min(this.startX, this.currentX);
      var top = Math.min(this.startY, this.currentY);
      var width = Math.abs(this.currentX - this.startX);
      var height = Math.abs(this.currentY - this.startY);
      
      // Update rectangle position and size
      rectangle.style.left = left + 'px';
      rectangle.style.top = top + 'px';
      rectangle.style.width = width + 'px';
      rectangle.style.height = height + 'px';
    },
    
    /**
     * Update element selection based on current rectangle and panel type
     * @private
     */
    _updateElementSelection: function() {
      if (this.currentPanelType === 'center') {
        this._updateSquareSelection();
      } else if (this.currentPanelType === 'left') {
        this._updateCircleSelection();
      }
    },
    
    /**
     * Update square selection based on current rectangle
     * @private
     */
    _updateSquareSelection: function() {
      if (!ChakraApp.MultiSelectionManager || !ChakraApp.appState) return;
      
      // Only select squares from the currently selected circle
      if (!ChakraApp.appState.selectedCircleId) return;
      
      // Get all visible squares for the current circle
      var squares = ChakraApp.appState.getSquaresForCircle(ChakraApp.appState.selectedCircleId)
        .filter(function(square) {
          return square.visible;
        });
      
      // Calculate selection rectangle bounds
      var selectionBounds = this._getSelectionBounds();
      
      // Clear current multi-selection
      ChakraApp.MultiSelectionManager.clearSelection();
      
      // Check each square for intersection with selection rectangle
      squares.forEach(function(square) {
        if (this._isSquareInSelection(square, selectionBounds)) {
          ChakraApp.MultiSelectionManager.addToSelection(square.id);
        }
      }, this);
    },
    
    /**
     * Update circle selection based on current rectangle
     * @private
     */
    _updateCircleSelection: function() {
      if (!ChakraApp.CircleMultiSelectionManager || !ChakraApp.appState) return;
      
      // Get all circles for the current left panel
      var circles = this._getCirclesForCurrentLeftPanel();
      
      // Calculate selection rectangle bounds
      var selectionBounds = this._getSelectionBounds();
      
      // Clear current circle multi-selection
      ChakraApp.CircleMultiSelectionManager.clearSelection();
      
      // Check each circle for intersection with selection rectangle
      var selectedCount = 0;
      circles.forEach(function(circle) {
        if (this._isCircleInSelection(circle, selectionBounds)) {
          ChakraApp.CircleMultiSelectionManager.addToSelection(circle.id);
          selectedCount++;
        }
      }, this);
    },
    
    /**
     * Get circles for the current left panel
     * @private
     * @returns {Array} Array of circle models
     */
    _getCirclesForCurrentLeftPanel: function() {
      if (this.currentLeftPanelId === null) return [];
      
      // Get all circles and filter by those that belong to documents in this panel
      var allCircles = [];
      ChakraApp.appState.circles.forEach(function(circle) {
        allCircles.push(circle);
      });
      
      // Filter circles by panel
      return allCircles.filter(function(circle) {
        var document = ChakraApp.appState.getDocument(circle.documentId);
        if (!document) return false;
        
        // Check if this document is selected for this panel
        var panelSelections = ChakraApp.appState.getLeftPanelSelections(this.currentLeftPanelId);
        if (!panelSelections) return false;
        
        // Check if this document is selected for any circle type and list type in this panel
        var circleTypeId = document.circleType;
        var listType = document.listType;
        
        return panelSelections[circleTypeId] && 
               panelSelections[circleTypeId][listType] === document.id;
      }, this);
    },
    
    /**
     * Get the current selection rectangle bounds
     * @private
     * @returns {Object} Rectangle bounds {left, top, right, bottom}
     */
    _getSelectionBounds: function() {
      return {
        left: Math.min(this.startX, this.currentX),
        top: Math.min(this.startY, this.currentY),
        right: Math.max(this.startX, this.currentX),
        bottom: Math.max(this.startY, this.currentY)
      };
    },
    
    /**
     * Check if a square intersects with the selection rectangle
     * @private
     * @param {Object} square - Square model
     * @param {Object} selectionBounds - Selection rectangle bounds
     * @returns {boolean} True if square is in selection
     */
    _isSquareInSelection: function(square, selectionBounds) {
      // Get square bounds (assuming 30px size from your config)
      var squareSize = square.size || 30;
      var squareBounds = {
        left: square.x,
        top: square.y,
        right: square.x + squareSize,
        bottom: square.y + squareSize
      };
      
      // Check for intersection (not just overlap, but any touch)
      return !(selectionBounds.right < squareBounds.left || 
               selectionBounds.left > squareBounds.right || 
               selectionBounds.bottom < squareBounds.top || 
               selectionBounds.top > squareBounds.bottom);
    },
    
    /**
     * Check if a circle intersects with the selection rectangle
     * @private
     * @param {Object} circle - Circle model
     * @param {Object} selectionBounds - Selection rectangle bounds
     * @returns {boolean} True if circle is in selection
     */
    _isCircleInSelection: function(circle, selectionBounds) {
      // Get circle bounds
      var circleSize = circle.size || 20;
      var radius = circleSize / 2;
      
      // Convert circle's center-relative position to absolute position for bounds checking
      var panelWidth = this._getCurrentPanelWidth();
      var panelCenterX = panelWidth / 2;
      var absoluteX = circle.x + panelCenterX;
      
      var circleBounds = {
        left: absoluteX - radius,
        top: circle.y - radius,
        right: absoluteX + radius,
        bottom: circle.y + radius
      };
      
      // Check for intersection
      return !(selectionBounds.right < circleBounds.left || 
               selectionBounds.left > circleBounds.right || 
               selectionBounds.bottom < circleBounds.top || 
               selectionBounds.top > circleBounds.bottom);
    },
    
    /**
     * Get current panel width (needed for circle position calculations)
     * @private
     * @returns {number} Panel width in pixels
     */
    _getCurrentPanelWidth: function() {
      if (ChakraApp.app && ChakraApp.app.resizeController) {
        return ChakraApp.app.resizeController.getCurrentPanelWidth();
      }
      return 400; // Fallback to default width
    },
    
    /**
     * Finalize the selection when mouse is released
     * @private
     */
    _finalizeSelection: function() {
      var selectedCount = 0;
      var elementType = '';
      
      if (this.currentPanelType === 'center' && ChakraApp.MultiSelectionManager) {
        selectedCount = ChakraApp.MultiSelectionManager.getSelectionCount();
        elementType = 'squares';
      } else if (this.currentPanelType === 'left' && ChakraApp.CircleMultiSelectionManager) {
        selectedCount = ChakraApp.CircleMultiSelectionManager.getSelectionCount();
        elementType = 'circles';
      }
      
      // Optionally show a notification about the selection
      if (selectedCount > 0 && window.console) {
        console.log('Rectangle selected ' + selectedCount + ' ' + elementType);
      }
    },
    
    /**
     * Clean up the rectangle selection manager
     */
    destroy: function() {
      // Remove event listeners from center panel
      if (this.targetPanel && this.mouseDownHandler) {
        this.targetPanel.removeEventListener('mousedown', this.mouseDownHandler);
      }
      
      if (this.targetPanel && this.clickHandler) {
        this.targetPanel.removeEventListener('click', this.clickHandler, true);
      }
      
      // Remove event listeners from left panels
      document.querySelectorAll('[id^="zoom-container-left-"]').forEach(function(leftPanel) {
        if (leftPanel._rectangleSelectionHandlers) {
          leftPanel.removeEventListener('mousedown', leftPanel._rectangleSelectionHandlers.mouseDown);
          leftPanel.removeEventListener('click', leftPanel._rectangleSelectionHandlers.click, true);
          delete leftPanel._rectangleSelectionHandlers;
        }
      });
      
      // Remove global event listeners if they exist
      if (this.mouseMoveHandler) {
        document.removeEventListener('mousemove', this.mouseMoveHandler);
      }
      if (this.mouseUpHandler) {
        document.removeEventListener('mouseup', this.mouseUpHandler);
      }
      
      // Remove selection rectangles from DOM
      if (this.selectionRectangle && this.selectionRectangle.parentNode) {
        this.selectionRectangle.parentNode.removeChild(this.selectionRectangle);
      }
      
      // Remove selection rectangles from all left panels
      document.querySelectorAll('#selection-rectangle').forEach(function(rectangle) {
        if (rectangle.parentNode) {
          rectangle.parentNode.removeChild(rectangle);
        }
      });
      
      // Reset state
      this.isSelecting = false;
      this.justFinishedDrag = false;
      this.currentPanelType = null;
      this.currentLeftPanelId = null;
      this.selectionRectangle = null;
      this.targetPanel = null;
      this.mouseDownHandler = null;
      this.mouseMoveHandler = null;
      this.mouseUpHandler = null;
      this.clickHandler = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
