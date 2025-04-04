// src/utils/ClipboardManager.js
// Handles clipboard operations for squares

(function(ChakraApp) {
  /**
   * Clipboard Manager - handles copy, cut, and paste operations
   */
  ChakraApp.ClipboardManager = {
    // Storage for copied/cut squares
    clipboard: [],
    
    // Flag to track if squares were cut (vs. copied)
    isCutOperation: false,
    
    // Source circle ID for the copy/cut operation
    sourceCircleId: null,
    
    /**
     * Copy selected squares to clipboard
     * @returns {boolean} Success indicator
     */
    copySelectedSquares: function() {
      this.clipboard = [];
      this.isCutOperation = false;
      
      // Get primary selected square
      var primarySquareId = ChakraApp.appState.selectedSquareId;
      if (!primarySquareId) return false;
      
      var primarySquare = ChakraApp.appState.getSquare(primarySquareId);
      if (!primarySquare) return false;
      
      // Store source circle ID
      this.sourceCircleId = primarySquare.circleId;
      
      // Add primary square to clipboard
      this.clipboard.push(this._serializeSquare(primarySquare));
      
      // Add multi-selected squares if any
      if (ChakraApp.multiSelectedSquares && ChakraApp.multiSelectedSquares.length > 0) {
        var self = this;
        ChakraApp.multiSelectedSquares.forEach(function(squareId) {
          var square = ChakraApp.appState.getSquare(squareId);
          if (square) {
            self.clipboard.push(self._serializeSquare(square));
          }
        });
      }
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'copy',
        count: this.clipboard.length
      });
      
      return this.clipboard.length > 0;
    },
    
    /**
     * Cut selected squares to clipboard
     * @returns {boolean} Success indicator
     */
    cutSelectedSquares: function() {
      // First copy the squares
      if (!this.copySelectedSquares()) return false;
      
      // Set the cut flag
      this.isCutOperation = true;
      
      // Delete the cut squares (we need to take care with multi-selection)
      var squaresToRemove = [];
      
      // Add primary square to removal list
      var primarySquareId = ChakraApp.appState.selectedSquareId;
      if (primarySquareId) {
        squaresToRemove.push(primarySquareId);
      }
      
      // Add multi-selected squares to removal list
      if (ChakraApp.multiSelectedSquares && ChakraApp.multiSelectedSquares.length > 0) {
        squaresToRemove = squaresToRemove.concat(ChakraApp.multiSelectedSquares);
      }
      
      // Remove squares in reverse order to avoid index shifting issues
      squaresToRemove.sort().reverse().forEach(function(squareId) {
        ChakraApp.appState.removeSquare(squareId);
      });
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'cut',
        count: this.clipboard.length
      });
      
      return true;
    },
    
    /**
     * Paste squares from clipboard to the selected circle
     * @returns {boolean} Success indicator
     */
    pasteSquares: function() {
      // Must have squares in clipboard
      if (this.clipboard.length === 0) return false;
      
      // Must have a circle selected
      var targetCircleId = ChakraApp.appState.selectedCircleId;
      if (!targetCircleId) return false;
      
      // Get the target circle
      var targetCircle = ChakraApp.appState.getCircle(targetCircleId);
      if (!targetCircle) return false;
      
      // Keep track of new squares for connection recreation
      var newSquareIds = [];
      var oldToNewIdMap = {};
      
      // Create all squares first, preserving original coordinates
      this.clipboard.forEach(function(squareData) {
        // Create a new square with the same position
        var newSquare = Object.assign({}, squareData, {
          circleId: targetCircleId // Assign to target circle
        });
        
        // Remove the ID so a new one will be generated
        var oldId = newSquare.id;
        delete newSquare.id;
        
        // Create the new square
        var createdSquare = ChakraApp.appState.addSquare(newSquare);
        
        // Store mapping from old to new IDs
        oldToNewIdMap[oldId] = createdSquare.id;
        newSquareIds.push(createdSquare.id);
      });
      
      // Now, recreate connections if pasting to the same circle
      if (targetCircleId === this.sourceCircleId) {
        // Iterate through all original connections
        ChakraApp.appState.connections.forEach(function(connection) {
          var sourceId = connection.sourceId;
          var targetId = connection.targetId;
          
          // Check if both endpoints are in our old-to-new mapping
          if (oldToNewIdMap[sourceId] && oldToNewIdMap[targetId]) {
            // These squares had a connection in the original group
            // Create a connection between the new squares
            var newSourceId = oldToNewIdMap[sourceId];
            var newTargetId = oldToNewIdMap[targetId];
            
            // Force connection update
            ChakraApp.appState._updateConnectionsForCircleId(targetCircleId);
          }
        });
      }
      
      // Clear cut squares from clipboard if it was a cut operation
      if (this.isCutOperation) {
        this.clipboard = [];
        this.isCutOperation = false;
      }
      
      // Publish paste event
      ChakraApp.EventBus.publish('CLIPBOARD_PASTED', {
        targetCircleId: targetCircleId,
        count: newSquareIds.length,
        squareIds: newSquareIds
      });
      
      return true;
    },
    
    /**
     * Check if there are squares in the clipboard
     * @returns {boolean} True if clipboard has squares
     */
    hasSquares: function() {
      return this.clipboard.length > 0;
    },
    
    /**
     * Get number of squares in clipboard
     * @returns {number} Square count
     */
    getSquareCount: function() {
      return this.clipboard.length;
    },
    
    /**
     * Serialize a square for the clipboard
     * @private
     * @param {Object} square Square object
     * @returns {Object} Serialized square data
     */
    _serializeSquare: function(square) {
      // Create a copy of the square with only the necessary properties
      return {
        id: square.id,
        x: square.x,
        y: square.y,
        color: square.color,
        name: square.name,
        attribute: square.attribute,
        isMe: square.isMe
      };
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
