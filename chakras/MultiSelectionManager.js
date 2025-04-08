// src/utils/MultiSelectionManager.js
// Manages multi-selection of squares

(function(ChakraApp) {
  /**
   * MultiSelectionManager - handles selecting, manipulating, and rendering multiple squares
   */
  ChakraApp.MultiSelectionManager = {
    // Array of selected square IDs (excluding the primary selected square)
    selectedSquareIds: [],
    
    // Primary selected square ID (the one that triggered multi-selection)
    primarySquareId: null,
    
    /**
     * Select a square and all connected squares
     * @param {string} primarySquareId - The square that initiated the selection
     * @returns {Array} Array of connected square IDs (excluding the primary square)
     */
    selectWithConnected: function(primarySquareId) {
      // Store primary square ID
      this.primarySquareId = primarySquareId;
      
      // Find all connected squares
      this.selectedSquareIds = this._findConnectedSquares(primarySquareId, []);
      
      // Apply multi-selected class to all squares
      this._applyMultiSelectedClass();
      
      // Publish multi-selection event
      ChakraApp.EventBus.publish('SQUARES_MULTI_SELECTED', {
        primarySquareId: primarySquareId,
        connectedSquareIds: this.selectedSquareIds
      });
      
      return this.selectedSquareIds;
    },
    
    /**
     * Clear multi-selection
     */
    clearSelection: function() {
      // Remove multi-selected class from all squares
      this._removeMultiSelectedClass();
      
      // Clear selection arrays
      this.selectedSquareIds = [];
      this.primarySquareId = null;
      
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
     * Get all selected square IDs including the primary square
     * @returns {Array} Array of all selected square IDs
     */
    getAllSelectedIds: function() {
      if (!this.primarySquareId) {
        return this.selectedSquareIds.slice();
      }
      
      return [this.primarySquareId].concat(this.selectedSquareIds);
    },
    
    /**
     * Get the count of selected squares
     * @returns {number} Number of selected squares (including primary)
     */
    getSelectionCount: function() {
      return this.selectedSquareIds.length + (this.primarySquareId ? 1 : 0);
    },
    
    /**
     * Move the primary square and all connected squares
     * @param {Object} mainViewModel - Primary square view model
     * @param {number} dx - X delta movement
     * @param {number} dy - Y delta movement
     * @param {Element} parentElement - Parent DOM element for boundary checking
     */
    moveSelectedSquares: function(mainViewModel, dx, dy, parentElement) {
      if (!this.primarySquareId || !mainViewModel) return;
      
      // Calculate new position for the main square
      var currentLeft = mainViewModel.x;
      var currentTop = mainViewModel.y;
      
      // Calculate boundaries
      var parentRect = parentElement.getBoundingClientRect();
      var elementWidth = 30; // Assuming square size is 30px
      var elementHeight = 30;
      
      // Calculate new position within the parent element's bounds
      var newLeft = Math.max(0, Math.min(parentRect.width - elementWidth, currentLeft + dx));
      var newTop = Math.max(0, Math.min(parentRect.height - elementHeight, currentTop + dy));
      
      // Calculate the actual delta applied (might be less than requested due to boundary constraints)
      var appliedDx = newLeft - currentLeft;
      var appliedDy = newTop - currentTop;
      
      // Update the main view model
      mainViewModel.updatePosition(newLeft, newTop);
      
      // Update all connected squares with the same delta
      this.selectedSquareIds.forEach(function(squareId) {
        var square = ChakraApp.appState.getSquare(squareId);
        if (square) {
          var connectedLeft = square.x;
          var connectedTop = square.y;
          
          // Calculate new position for the connected square
          var connectedNewLeft = Math.max(0, Math.min(parentRect.width - elementWidth, connectedLeft + appliedDx));
          var connectedNewTop = Math.max(0, Math.min(parentRect.height - elementHeight, connectedTop + appliedDy));
          
          // Update the connected square position
          ChakraApp.appState.updateSquare(squareId, {
            x: connectedNewLeft,
            y: connectedNewTop
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
      
      // Get all connections
      var connections = [];
      ChakraApp.appState.connections.forEach(function(conn) {
        if (conn.isVisible) {
          if (conn.sourceId === squareId && !visited.includes(conn.targetId)) {
            connections.push(conn.targetId);
          } else if (conn.targetId === squareId && !visited.includes(conn.sourceId)) {
            connections.push(conn.sourceId);
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
      this.selectedSquareIds.forEach(function(squareId) {
        var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
        if (squareElement) {
          squareElement.classList.add('multi-selected');
        }
      });
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
     * Apply group-dragging class to all selected squares
     * @private
     */
    _applyGroupDraggingClass: function() {
      var self = this;
      
      // Apply to primary square
      if (this.primarySquareId) {
        var primaryElement = document.querySelector('.square[data-id="' + this.primarySquareId + '"]');
        if (primaryElement) {
          primaryElement.classList.add('group-dragging');
          primaryElement.classList.add('primary-selection');
        }
      }
      
      // Apply to all multi-selected squares
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
      // Remove from all squares
      var draggingSquares = document.querySelectorAll('.square.group-dragging');
      draggingSquares.forEach(function(element) {
        element.classList.remove('group-dragging');
        element.classList.remove('primary-selection');
      });
    },
    
    /**
     * Delete all selected squares
     * @returns {number} Number of squares deleted
     */
    deleteAllSelected: function() {
      var count = 0;
      
      // First delete the primary selected square
      if (this.primarySquareId) {
        ChakraApp.appState.removeSquare(this.primarySquareId);
        count++;
      }
      
      // Sort IDs in reverse order to avoid issues with indices changing during deletion
      var sortedIds = this.selectedSquareIds.slice().sort().reverse();
      
      // Then delete all multi-selected squares
      sortedIds.forEach(function(squareId) {
        ChakraApp.appState.removeSquare(squareId);
        count++;
      });
      
      // Clear selection
      this.clearSelection();
      
      return count;
    },
    
    /**
     * Apply an attribute to all selected squares
     * @param {string} attributeType - Attribute type
     * @returns {number} Number of squares modified
     */
    applyAttributeToAll: function(attributeType) {
      var count = 0;
      var attributeData = ChakraApp.Config.attributeInfo[attributeType];
      if (!attributeData) return count;
      
      // Apply to primary square
      if (this.primarySquareId) {
        ChakraApp.appState.updateSquare(this.primarySquareId, {
          attribute: attributeType,
          color: attributeData.color
        });
        count++;
      }
      
      // Apply to all multi-selected squares
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
      var targetState = false;
      
      // Determine the target state (opposite of primary square's current state)
      if (this.primarySquareId) {
        var primarySquare = ChakraApp.appState.getSquare(this.primarySquareId);
        if (primarySquare) {
          targetState = !primarySquare.isBold;
          
          // Update primary square
          ChakraApp.appState.updateSquare(this.primarySquareId, { isBold: targetState });
          count++;
        }
      }
      
      // Update all multi-selected squares
      this.selectedSquareIds.forEach(function(squareId) {
        ChakraApp.appState.updateSquare(squareId, { isBold: targetState });
        count++;
      });
      
      return count;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
