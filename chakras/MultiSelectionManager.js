// src/utils/MultiSelectionManager.js
// Unified selection system - handles all square selection as multi-selection

(function(ChakraApp) {
  /**
   * MultiSelectionManager - handles selecting, manipulating, and rendering multiple squares
   */
  ChakraApp.MultiSelectionManager = {
    // Array of all selected square IDs
    selectedSquareIds: [],

    /**
     * Select a single square (replaces primary selection)
     * @param {string} squareId - The square to select
     * @returns {Array} Array with the selected square ID
     */
    selectSingle: function(squareId) {
      // Clear current selection
      this.clearSelection();
      
      // Add the square to selection
      this.selectedSquareIds.push(squareId);
      
      // Apply multi-selected class
      this._applyMultiSelectedClassToSquare(squareId);
      
      // Publish selection event
      ChakraApp.EventBus.publish('SQUARES_MULTI_SELECTED', {
        selectedSquareIds: this.selectedSquareIds,
        count: this.selectedSquareIds.length
      });
      
      return this.selectedSquareIds;
    },

    /**
     * Select a square and all connected squares (Shift-click behavior)
     * @param {string} squareId - The square that initiated the selection
     * @returns {Array} Array of all selected square IDs
     */
    selectWithConnected: function(squareId) {
      // Clear current selection
      this.clearSelection();
      
      // Add the clicked square
      this.selectedSquareIds.push(squareId);
      
      // Find all connected squares and add them
      var connectedSquares = this._findConnectedSquares(squareId, []);
      var self = this;
      connectedSquares.forEach(function(connectedId) {
        if (self.selectedSquareIds.indexOf(connectedId) === -1) {
          self.selectedSquareIds.push(connectedId);
        }
      });
      
      // Apply multi-selected class to all squares
      this._applyMultiSelectedClass();
      
      // Publish multi-selection event
      ChakraApp.EventBus.publish('SQUARES_MULTI_SELECTED', {
        selectedSquareIds: this.selectedSquareIds,
        count: this.selectedSquareIds.length
      });
      
      return this.selectedSquareIds;
    },

    /**
     * Toggle individual square selection (CTRL-click behavior)
     * @param {string} squareId - The square to toggle
     * @returns {boolean} True if square was added to selection, false if removed
     */
    toggleIndividualSelection: function(squareId) {
      var index = this.selectedSquareIds.indexOf(squareId);
      
      if (index !== -1) {
        // Square is selected, remove it
        this.selectedSquareIds.splice(index, 1);
        this._removeMultiSelectedClassFromSquare(squareId);
        
        ChakraApp.EventBus.publish('SQUARES_MULTI_UPDATED', {
          selectedSquareIds: this.selectedSquareIds,
          removedSquareId: squareId,
          count: this.selectedSquareIds.length
        });
        
        return false;
      } else {
        // Square is not selected, add it
        this.selectedSquareIds.push(squareId);
        this._applyMultiSelectedClassToSquare(squareId);
        
        ChakraApp.EventBus.publish('SQUARES_MULTI_UPDATED', {
          selectedSquareIds: this.selectedSquareIds,
          addedSquareId: squareId,
          count: this.selectedSquareIds.length
        });
        
        return true;
      }
    },

    /**
     * Get the primary square for operations that need a reference
     * @returns {string|null} First selected square ID or null
     */
    getPrimarySquareId: function() {
      return this.selectedSquareIds.length > 0 ? this.selectedSquareIds[0] : null;
    },

    /**
     * Check if any square is selected (replaces checking appState.selectedSquareId)
     * @returns {boolean} True if any squares are selected
     */
    hasSquareSelected: function() {
      return this.selectedSquareIds.length > 0;
    },
    
    /**
     * Add a square to the current multi-selection
     * @param {string} squareId - The square to add
     */
    addToSelection: function(squareId) {
      // Don't add if already selected
      if (this.selectedSquareIds.indexOf(squareId) !== -1) {
        return;
      }
      
      this.selectedSquareIds.push(squareId);
      this._applyMultiSelectedClassToSquare(squareId);
      
      ChakraApp.EventBus.publish('SQUARES_MULTI_UPDATED', {
        selectedSquareIds: this.selectedSquareIds,
        addedSquareId: squareId,
        count: this.selectedSquareIds.length
      });
    },
    
    /**
     * Remove a square from the multi-selection
     * @param {string} squareId - The square to remove
     */
    removeFromSelection: function(squareId) {
      var index = this.selectedSquareIds.indexOf(squareId);
      if (index !== -1) {
        this.selectedSquareIds.splice(index, 1);
        this._removeMultiSelectedClassFromSquare(squareId);
        
        ChakraApp.EventBus.publish('SQUARES_MULTI_UPDATED', {
          selectedSquareIds: this.selectedSquareIds,
          removedSquareId: squareId,
          count: this.selectedSquareIds.length
        });
      }
    },
    
    /**
     * Check if a square is currently selected
     * @param {string} squareId - Square ID to check
     * @returns {boolean} True if the square is selected
     */
    isSquareSelected: function(squareId) {
      return this.selectedSquareIds.indexOf(squareId) !== -1;
    },
    
    /**
     * Clear multi-selection
     */
    clearSelection: function() {
      // Remove multi-selected class from all squares
      this._removeMultiSelectedClass();
      
      // Clear selection array
      this.selectedSquareIds = [];
      
      // Publish multi-deselection event
      ChakraApp.EventBus.publish('SQUARES_MULTI_DESELECTED', {});
    },
    
    /**
     * Check if multi-selection is active
     * @returns {boolean} True if there are multi-selected squares
     */
    hasSelection: function() {
      return this.selectedSquareIds.length > 0;
    },
    
    /**
     * Get all selected square IDs
     * @returns {Array} Array of all selected square IDs
     */
    getAllSelectedIds: function() {
      return this.selectedSquareIds.slice(); // Return a copy
    },
    
    /**
     * Get the count of selected squares
     * @returns {number} Number of selected squares
     */
    getSelectionCount: function() {
      return this.selectedSquareIds.length;
    },
    
    /**
     * Get the first selected square (useful for operations that need a reference square)
     * @returns {string|null} First selected square ID or null
     */
    getFirstSelectedId: function() {
      return this.selectedSquareIds.length > 0 ? this.selectedSquareIds[0] : null;
    },
    
    /**
     * Move all selected squares
     * Handles both old interface (mainViewModel, dx, dy, parentElement) 
     * and new interface (dx, dy, parentElement)
     * @param {Object|number} mainViewModelOrDx - Primary square view model OR dx movement
     * @param {number} dx - X delta movement (if first param is view model)
     * @param {number} dy - Y delta movement
     * @param {Element} parentElement - Parent DOM element for boundary checking
     */
    moveSelectedSquares: function(mainViewModelOrDx, dx, dy, parentElement) {
      if (this.selectedSquareIds.length === 0) {
        return;
      }
      
      // Handle parameter overloading - detect if first param is a view model or dx value
      var actualDx, actualDy, actualParentElement;
      
      if (typeof mainViewModelOrDx === 'object' && mainViewModelOrDx !== null && mainViewModelOrDx.x !== undefined) {
        // Old interface: (mainViewModel, dx, dy, parentElement)
        actualDx = dx;
        actualDy = dy;
        actualParentElement = parentElement;
      } else {
        // New interface: (dx, dy, parentElement)
        actualDx = mainViewModelOrDx;
        actualDy = dx;
        actualParentElement = dy;
      }
      
      // Handle case where parentElement might not be a DOM element
      var parentRect;
      if (actualParentElement && typeof actualParentElement.getBoundingClientRect === 'function') {
        parentRect = actualParentElement.getBoundingClientRect();
      } else {
        // Fallback: use center panel bounds
        var centerPanel = document.getElementById('center-panel');
        if (centerPanel) {
          parentRect = centerPanel.getBoundingClientRect();
        } else {
          // Ultimate fallback
          parentRect = { width: 800, height: 600 };
        }
      }
      
      var elementWidth = 30; // Assuming square size is 30px
      var elementHeight = 30;
      
      // Calculate the applied delta by checking the first square's movement
      var firstSquare = ChakraApp.appState.getSquare(this.selectedSquareIds[0]);
      if (!firstSquare) {
        return;
      }
      
      var currentLeft = firstSquare.x;
      var currentTop = firstSquare.y;
      
      var newLeft = Math.max(0, Math.min(parentRect.width - elementWidth, currentLeft + actualDx));
      var newTop = Math.max(0, Math.min(parentRect.height - elementHeight, currentTop + actualDy));
      
      var appliedDx = newLeft - currentLeft;
      var appliedDy = newTop - currentTop;
      
      // Only proceed if there's actual movement
      if (appliedDx === 0 && appliedDy === 0) {
        return;
      }
      
      // Update all selected squares
      var self = this;
      this.selectedSquareIds.forEach(function(squareId, index) {
        var square = ChakraApp.appState.getSquare(squareId);
        if (square) {
          var currentSquareLeft = square.x;
          var currentSquareTop = square.y;
          
          // Calculate new position for this square
          var newSquareLeft = Math.max(0, Math.min(parentRect.width - elementWidth, currentSquareLeft + appliedDx));
          var newSquareTop = Math.max(0, Math.min(parentRect.height - elementHeight, currentSquareTop + appliedDy));
          
          // Update the square position
          ChakraApp.appState.updateSquare(squareId, {
            x: newSquareLeft,
            y: newSquareTop
          });
        }
      });
      
      // Add visual feedback for dragging
      this._applyGroupDraggingClass();
    },
    
    /**
     * End the group dragging operation
     */
    endGroupDragging: function() {
      this._removeGroupDraggingClass();
      
      // Save state when drag completes
      ChakraApp.appState.saveToStorageNow();
    },
    
    /**
     * Find all squares connected to a given square recursively
     * @private
     * @param {string} squareId - Square ID to find connections for
     * @param {Array} visited - Array of already visited square IDs
     * @returns {Array} Array of connected square IDs (excluding the starting square)
     */
    _findConnectedSquares: function(squareId, visited) {
      // Initialize visited array if not provided
      visited = visited || [];
      
      // Mark current square as visited
      visited.push(squareId);
      
      // Get the current tab ID to filter connections
      var currentTabId = ChakraApp.appState.selectedTabId;
      
      // Get all connections, but only consider squares on the current tab
      var connections = [];
      ChakraApp.appState.connections.forEach(function(conn) {
        if (conn.isVisible) {
          var sourceSquare = ChakraApp.appState.getSquare(conn.sourceId);
          var targetSquare = ChakraApp.appState.getSquare(conn.targetId);
          
          // Only consider connections where both squares are on the current tab
          if (sourceSquare && targetSquare && 
              sourceSquare.tabId === currentTabId && 
              targetSquare.tabId === currentTabId) {
            
            if (conn.sourceId === squareId && !visited.includes(conn.targetId)) {
              connections.push(conn.targetId);
            } else if (conn.targetId === squareId && !visited.includes(conn.sourceId)) {
              connections.push(conn.sourceId);
            }
          }
        }
      });
      
      // Recursively find all connected squares
      for (var i = 0; i < connections.length; i++) {
        var connectedId = connections[i];
        if (!visited.includes(connectedId)) {
          this._findConnectedSquares(connectedId, visited);
        }
      }
      
      // Return all connected squares (excluding the starting square)
      return visited.filter(function(id) {
        return id !== squareId;
      });
    },
    
    /**
     * Apply multi-selected class to all selected squares
     * @private
     */
    _applyMultiSelectedClass: function() {
      var self = this;
      this.selectedSquareIds.forEach(function(squareId) {
        self._applyMultiSelectedClassToSquare(squareId);
      });
    },
    
    /**
     * Apply multi-selected class to a specific square
     * @private
     * @param {string} squareId - Square ID
     */
    _applyMultiSelectedClassToSquare: function(squareId) {
      var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
      if (squareElement) {
        squareElement.classList.add('multi-selected');
      }
    },
    
    /**
     * Remove multi-selected class from all squares
     * @private
     */
    _removeMultiSelectedClass: function() {
      var selectedSquares = document.querySelectorAll('.square.multi-selected');
      selectedSquares.forEach(function(element) {
        element.classList.remove('multi-selected');
      });
    },
    
    /**
     * Remove multi-selected class from a specific square
     * @private
     * @param {string} squareId - Square ID
     */
    _removeMultiSelectedClassFromSquare: function(squareId) {
      var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
      if (squareElement) {
        squareElement.classList.remove('multi-selected');
      }
    },
    
    /**
     * Apply group-dragging class to all selected squares
     * @private
     */
    _applyGroupDraggingClass: function() {
      var self = this;
      this.selectedSquareIds.forEach(function(squareId) {
        var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
        if (squareElement) {
          squareElement.classList.add('group-dragging');
        }
      });
    },
    
    /**
     * Remove group-dragging class from all squares
     * @private
     */
    _removeGroupDraggingClass: function() {
      var draggingSquares = document.querySelectorAll('.square.group-dragging');
      draggingSquares.forEach(function(element) {
        element.classList.remove('group-dragging');
      });
    },
    
    /**
     * Delete all selected squares
     * @returns {number} Number of squares deleted
     */
    deleteAllSelected: function() {
      var count = 0;
      
      // Store the IDs we need to delete before we start deleting
      var squareIdsToDelete = this.selectedSquareIds.slice(); // Create a copy
      
      // Clear selection first to avoid any state issues during deletion
      this.clearSelection();
      
      // Delete all selected squares
      squareIdsToDelete.forEach(function(squareId) {
        if (squareId && ChakraApp.appState.getSquare(squareId)) {
          ChakraApp.appState.removeSquare(squareId);
          count++;
        }
      });
      
      return count;
    },
    
    /**
     * Apply an attribute to all selected squares
     * @param {string} attributeType - Attribute type
     * @returns {number} Number of squares modified
     */
    applyAttributeToAll: function(attributeType) {
      var count = 0;
      var attributeData = ChakraApp.getAttributeInfo(attributeType);
      if (!attributeData) return count;
      
      // Apply to all selected squares
      this.selectedSquareIds.forEach(function(squareId) {
        ChakraApp.appState.updateSquare(squareId, {
          attribute: attributeType,
          color: attributeData.color
        });
        count++;
      });
      
      return count;
    },
    
    /**
     * Toggle bold state for all selected squares
     * @returns {number} Number of squares modified
     */
    toggleBoldForAll: function() {
      var count = 0;
      
      // Determine the target state based on the first square's current state
      var targetState = false;
      if (this.selectedSquareIds.length > 0) {
        var firstSquare = ChakraApp.appState.getSquare(this.selectedSquareIds[0]);
        if (firstSquare) {
          targetState = !firstSquare.isBold;
        }
      }
      
      // Update all selected squares
      this.selectedSquareIds.forEach(function(squareId) {
        ChakraApp.appState.updateSquare(squareId, { isBold: targetState });
        count++;
      });
      
      return count;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
