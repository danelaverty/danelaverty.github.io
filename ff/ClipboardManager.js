// src/utils/ClipboardManager.js
// Handles clipboard operations for squares and circles

(function(ChakraApp) {
  /**
   * Clipboard Manager - handles copy, cut, and paste operations
   */
  ChakraApp.ClipboardManager = {
    // Storage for copied/cut items
    squareClipboard: [],
    circleClipboard: [],
    
    // Flags to track if items were cut (vs. copied)
    isSquareCutOperation: false,
    isCircleCutOperation: false,
    
    // Source circle ID for the copy/cut operation
    sourceCircleId: null,
    
    /**
     * Copy selected squares to clipboard
     * @returns {boolean} Success indicator
     */
    copySelectedSquares: function() {
      this.squareClipboard = [];
      this.isSquareCutOperation = false;
      
      // Use multi-selection system instead of primary selection
      if (!ChakraApp.MultiSelectionManager.hasSelection()) {
        return false;
      }
      
      var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
      if (selectedIds.length === 0) return false;
      
      // Get the first square to determine source circle
      var firstSquare = ChakraApp.appState.getSquare(selectedIds[0]);
      if (!firstSquare) return false;
      
      // Store source circle ID
      this.sourceCircleId = firstSquare.circleId;
      
      // Add all selected squares to clipboard
      var self = this;
      selectedIds.forEach(function(squareId) {
        var square = ChakraApp.appState.getSquare(squareId);
        if (square) {
          self.squareClipboard.push(self._serializeSquare(square));
        }
      });
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'copy',
        type: 'squares',
        count: this.squareClipboard.length
      });
      
      return this.squareClipboard.length > 0;
    },
    
    /**
     * Cut selected squares to clipboard
     * @returns {boolean} Success indicator
     */
    cutSelectedSquares: function() {
      // First copy the squares
      if (!this.copySelectedSquares()) return false;
      
      // Set the cut flag
      this.isSquareCutOperation = true;
      
      // Delete the squares using MultiSelectionManager if there's a multi-selection
      if (ChakraApp.MultiSelectionManager && ChakraApp.MultiSelectionManager.hasSelection()) {
        ChakraApp.MultiSelectionManager.deleteAllSelected();
      } else {
        // Otherwise just remove the primary square
        var primarySquareId = ChakraApp.appState.selectedSquareId;
        if (primarySquareId) {
          ChakraApp.appState.removeSquare(primarySquareId);
        }
      }
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'cut',
        type: 'squares',
        count: this.squareClipboard.length
      });
      
      return true;
    },
    
    /**
     * Copy selected circle to clipboard
     * @returns {boolean} Success indicator
     */
    copySelectedCircle: function() {
      this.circleClipboard = [];
      this.isCircleCutOperation = false;
      
      // Must have a circle selected
      var selectedCircleId = ChakraApp.appState.selectedCircleId;
      if (!selectedCircleId) return false;
      
      var circle = ChakraApp.appState.getCircle(selectedCircleId);
      if (!circle) return false;
      
      // Get all associated data
      var circleData = this._serializeCircle(circle);
      
      // Get squares for this circle
      var squares = ChakraApp.appState.getSquaresForCircle(selectedCircleId);
      circleData.squares = squares.map(function(square) {
        return this._serializeSquare(square);
      }, this);
      
      // Get tabs for this circle
      var tabs = ChakraApp.appState.getTabsForCircle(selectedCircleId);
      circleData.tabs = tabs.map(function(tab) {
        return this._serializeTab(tab);
      }, this);
      
      // Get circle references for this circle
      var circleReferences = ChakraApp.appState.getCircleReferencesForTab ? 
        ChakraApp.appState.getCircleReferencesForTab(selectedCircleId) : [];
      circleData.circleReferences = circleReferences.map(function(ref) {
        return this._serializeCircleReference(ref);
      }, this);
      
      this.circleClipboard.push(circleData);
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'copy',
        type: 'circle',
        count: 1
      });
      
      return true;
    },

    copySelectedCircles: function() {
      this.circleClipboard = [];
      this.isCircleCutOperation = false;
      
      // Use multi-selection system if available
      if (!ChakraApp.CircleMultiSelectionManager || !ChakraApp.CircleMultiSelectionManager.hasSelection()) {
        return false;
      }
      
      var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
      if (selectedIds.length === 0) return false;
      
      // Add all selected circles to clipboard
      var self = this;
      selectedIds.forEach(function(circleId) {
        var circle = ChakraApp.appState.getCircle(circleId);
        if (circle) {
          // Get all associated data
          var circleData = self._serializeCircle(circle);
          
          // Get squares for this circle
          var squares = ChakraApp.appState.getSquaresForCircle(circleId);
          circleData.squares = squares.map(function(square) {
            return self._serializeSquare(square);
          });
          
          // Get tabs for this circle
          var tabs = ChakraApp.appState.getTabsForCircle(circleId);
          circleData.tabs = tabs.map(function(tab) {
            return self._serializeTab(tab);
          });
          
          // Get circle references for this circle
          var circleReferences = ChakraApp.appState.getCircleReferencesForTab ? 
            ChakraApp.appState.getCircleReferencesForTab(circleId) : [];
          circleData.circleReferences = circleReferences.map(function(ref) {
            return self._serializeCircleReference(ref);
          });
          
          self.circleClipboard.push(circleData);
        }
      });
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'copy',
        type: 'circles',
        count: this.circleClipboard.length
      });
      
      return this.circleClipboard.length > 0;
    },

     cutSelectedCircles: function() {
      // First copy the circles
      if (!this.copySelectedCircles()) return false;
      
      // Set the cut flag
      this.isCircleCutOperation = true;
      
      // Delete the circles using CircleMultiSelectionManager
      if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
        ChakraApp.CircleMultiSelectionManager.deleteAllSelected();
      }
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'cut',
        type: 'circles',
        count: this.circleClipboard.length
      });
      
      return true;
    },

     pasteCircles: function() {
  // Must have circles in clipboard
  if (this.circleClipboard.length === 0) return false;
  
  var createdCircles = [];
  var self = this;
  
  this.circleClipboard.forEach(function(circleData, index) {
    // Calculate offset for each circle
    var offset = self._calculateCirclePasteOffset(index);
    
    // Create the new circle
    var newCircle = Object.assign({}, circleData, {
      x: circleData.x + offset.x,
      y: circleData.y + offset.y
    });
    
    // Remove the ID so a new one will be generated
    delete newCircle.id;
    
    // Remove nested data before creating circle
    var squares = newCircle.squares || [];
    var tabs = newCircle.tabs || [];
    var circleReferences = newCircle.circleReferences || [];
    delete newCircle.squares;
    delete newCircle.tabs;
    delete newCircle.circleReferences;
    
    // Create the circle
    var createdCircle = ChakraApp.appState.addCircle(newCircle);
    if (!createdCircle) return; // Skip this iteration if circle creation failed
    
    createdCircles.push(createdCircle);
    
    // Keep track of ID mappings for references
    var oldToNewSquareIds = {};
    var oldToNewTabIds = {};
    
    // Create all tabs first (squares might reference them)
    tabs.forEach(function(tabData) {
      var newTab = Object.assign({}, tabData, {
        circleId: createdCircle.id
      });
      var oldTabId = newTab.id;
      delete newTab.id;
      
      var createdTab = ChakraApp.appState.addTab(newTab);
      if (createdTab) {
        oldToNewTabIds[oldTabId] = createdTab.id;
      }
    });
    
    // Create all squares
    squares.forEach(function(squareData) {
      var newSquare = Object.assign({}, squareData, {
        circleId: createdCircle.id,
        x: squareData.x + offset.x,
        y: squareData.y + offset.y
      });
      
      // Update tab reference if it exists
      if (newSquare.tabId && oldToNewTabIds[newSquare.tabId]) {
        newSquare.tabId = oldToNewTabIds[newSquare.tabId];
      }
      
      var oldSquareId = newSquare.id;
      delete newSquare.id;
      
      var createdSquare = ChakraApp.appState.addSquare(newSquare);
      if (createdSquare) {
        oldToNewSquareIds[oldSquareId] = createdSquare.id;
      }
    });
    
    // Create circle references
    circleReferences.forEach(function(refData) {
      var newRef = Object.assign({}, refData);
      
      // Update tab reference if it exists
      if (newRef.tabId && oldToNewTabIds[newRef.tabId]) {
        newRef.tabId = oldToNewTabIds[newRef.tabId];
      }
      
      delete newRef.id;
      ChakraApp.appState.addCircleReference(newRef);
    });
    
    // Update connections for the new circle
    ChakraApp.appState._updateConnectionsForCircleId(createdCircle.id);
  });
  
  // Clear cut circles from clipboard if it was a cut operation
  if (this.isCircleCutOperation) {
    this.circleClipboard = [];
    this.isCircleCutOperation = false;
  }
  
  // Select the new circles if multi-selection is available
  if (ChakraApp.CircleMultiSelectionManager && createdCircles.length > 0) {
    ChakraApp.CircleMultiSelectionManager.clearSelection();
    createdCircles.forEach(function(circle) {
      ChakraApp.CircleMultiSelectionManager.addToSelection(circle.id);
    });
  } else if (createdCircles.length > 0) {
    // Fallback: select the first circle
    ChakraApp.appState.selectCircle(createdCircles[0].id);
  }
  
  // FIXED: Ensure createdCircles is always an array and handle potential undefined values
  var safeCreatedCircles = createdCircles || [];
  var circleIds = [];
  
  try {
    circleIds = safeCreatedCircles.map(function(circle) {
      return circle && circle.id ? circle.id : null;
    }).filter(function(id) {
      return id !== null; // Remove any null values
    });
  } catch (error) {
    console.warn('Error creating circle IDs array for event:', error);
    circleIds = []; // Fallback to empty array
  }
  
  // Publish paste event with safe data
  ChakraApp.EventBus.publish('CLIPBOARD_PASTED', {
    type: 'circles',
    count: safeCreatedCircles.length,
    circleIds: circleIds
  });
  
  return true;
},

       _calculateCirclePasteOffset: function(index) {
      index = index || 0;
      return {
        x: 60 + (index * 20), // Stagger multiple circles
        y: 60 + (index * 20)
      };
    },

       getCircleCount: function() {
      return this.circleClipboard.length;
    },
    
    /**
     * Cut selected circle to clipboard
     * @returns {boolean} Success indicator
     */
    cutSelectedCircle: function() {
      // First copy the circle
      if (!this.copySelectedCircle()) return false;
      
      // Set the cut flag
      this.isCircleCutOperation = true;
      
      // Delete the circle (this will also delete its squares and tabs)
      var selectedCircleId = ChakraApp.appState.selectedCircleId;
      if (selectedCircleId) {
        ChakraApp.appState.removeCircle(selectedCircleId);
      }
      
      // Publish clipboard event
      ChakraApp.EventBus.publish('CLIPBOARD_UPDATED', {
        operation: 'cut',
        type: 'circle',
        count: 1
      });
      
      return true;
    },
    
    /**
     * Paste squares from clipboard to the selected circle
     * @returns {boolean} Success indicator
     */
    pasteSquares: function() {
      // Must have squares in clipboard
      if (this.squareClipboard.length === 0) return false;
      
      // Must have a circle selected
      var targetCircleId = ChakraApp.appState.selectedCircleId;
      if (!targetCircleId) return false;
      
      // Get the target circle
      var targetCircle = ChakraApp.appState.getCircle(targetCircleId);
      if (!targetCircle) return false;
      
      // Calculate offset from the center for pasting
      var offset = this._calculatePasteOffset();
      
      // Keep track of new squares for connection recreation
      var newSquareIds = [];
      var oldToNewIdMap = {};
      
      // Create all squares first
      this.squareClipboard.forEach(function(squareData) {
        // Create a new square with the same position plus offset
        var newSquare = Object.assign({}, squareData, {
          circleId: targetCircleId, // Assign to target circle
          x: squareData.x + offset.x,
          y: squareData.y + offset.y
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
            // Force connection update
            ChakraApp.appState._updateConnectionsForCircleId(targetCircleId);
          }
        });
      }
      
      // Clear cut squares from clipboard if it was a cut operation
      if (this.isSquareCutOperation) {
        this.squareClipboard = [];
        this.isSquareCutOperation = false;
      }
      
      // Publish paste event
      ChakraApp.EventBus.publish('CLIPBOARD_PASTED', {
        type: 'squares',
        targetCircleId: targetCircleId,
        count: newSquareIds.length,
        squareIds: newSquareIds
      });
      
      return true;
    },
    
    /**
     * Paste circle from clipboard
     * @returns {boolean} Success indicator
     */
    pasteCircle: function() {
      // Must have circle in clipboard
      if (this.circleClipboard.length === 0) return false;
      
      var circleData = this.circleClipboard[0];
      
      // Calculate offset for the new circle position
      var offset = this._calculateCirclePasteOffset();
      
      // Create the new circle
      var newCircle = Object.assign({}, circleData, {
        x: circleData.x + offset.x,
        y: circleData.y + offset.y
      });
      
      // Remove the ID so a new one will be generated
      delete newCircle.id;
      
      // Remove nested data before creating circle
      var squares = newCircle.squares || [];
      var tabs = newCircle.tabs || [];
      var circleReferences = newCircle.circleReferences || [];
      delete newCircle.squares;
      delete newCircle.tabs;
      delete newCircle.circleReferences;
      
      // Create the circle
      var createdCircle = ChakraApp.appState.addCircle(newCircle);
      if (!createdCircle) return false;
      
      // Keep track of ID mappings for references
      var oldToNewSquareIds = {};
      var oldToNewTabIds = {};
      
      // Create all tabs first (squares might reference them)
      tabs.forEach(function(tabData) {
        var newTab = Object.assign({}, tabData, {
          circleId: createdCircle.id
        });
        var oldTabId = newTab.id;
        delete newTab.id;
        
        var createdTab = ChakraApp.appState.addTab(newTab);
        if (createdTab) {
          oldToNewTabIds[oldTabId] = createdTab.id;
        }
      });
      
      // Create all squares
      squares.forEach(function(squareData) {
        var newSquare = Object.assign({}, squareData, {
          circleId: createdCircle.id,
          x: squareData.x + offset.x,
          y: squareData.y + offset.y
        });
        
        // Update tab reference if it exists
        if (newSquare.tabId && oldToNewTabIds[newSquare.tabId]) {
          newSquare.tabId = oldToNewTabIds[newSquare.tabId];
        }
        
        var oldSquareId = newSquare.id;
        delete newSquare.id;
        
        var createdSquare = ChakraApp.appState.addSquare(newSquare);
        if (createdSquare) {
          oldToNewSquareIds[oldSquareId] = createdSquare.id;
        }
      });
      
      // Create circle references (note: these reference other circles by ID, 
      // so we preserve the original sourceCircleId references)
      circleReferences.forEach(function(refData) {
        var newRef = Object.assign({}, refData);
        
        // Update tab reference if it exists
        if (newRef.tabId && oldToNewTabIds[newRef.tabId]) {
          newRef.tabId = oldToNewTabIds[newRef.tabId];
        }
        
        delete newRef.id;
        ChakraApp.appState.addCircleReference(newRef);
      });
      
      // Update connections for the new circle
      ChakraApp.appState._updateConnectionsForCircleId(createdCircle.id);
      
      // Clear cut circle from clipboard if it was a cut operation
      if (this.isCircleCutOperation) {
        this.circleClipboard = [];
        this.isCircleCutOperation = false;
      }
      
      // Select the new circle
      ChakraApp.appState.selectCircle(createdCircle.id);
      
      // Publish paste event
      ChakraApp.EventBus.publish('CLIPBOARD_PASTED', {
        type: 'circle',
        circleId: createdCircle.id,
        squareCount: squares.length,
        tabCount: tabs.length
      });
      
      return true;
    },
    
    /**
     * Calculate an offset for pasting squares
     * @private
     * @returns {Object} Offset with x and y properties
     */
    _calculatePasteOffset: function() {
      // Default offset
      var offset = {
        x: 20, // Slightly to the right
        y: 20  // Slightly down
      };
      
      // If this is a self-paste (same circle), use offset to make it clear
      if (this.sourceCircleId === ChakraApp.appState.selectedCircleId) {
        offset = {
          x: 40,
          y: 40
        };
      }
      
      return offset;
    },
    
    /**
     * Calculate an offset for pasting circles
     * @private
     * @returns {Object} Offset with x and y properties
     */
    _calculateCirclePasteOffset: function() {
      return {
        x: 60, // Enough space to see both circles
        y: 60
      };
    },
    
    /**
     * Check if there are squares in the clipboard
     * @returns {boolean} True if clipboard has squares
     */
    hasSquares: function() {
      return this.squareClipboard.length > 0;
    },
    
    /**
     * Check if there are circles in the clipboard
     * @returns {boolean} True if clipboard has circles
     */
    hasCircles: function() {
      return this.circleClipboard.length > 0;
    },
    
    /**
     * Get number of squares in clipboard
     * @returns {number} Square count
     */
    getSquareCount: function() {
      return this.squareClipboard.length;
    },
    
    /**
     * Get number of circles in clipboard
     * @returns {number} Circle count
     */
    getCircleCount: function() {
      return this.circleClipboard.length;
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
        isBold: square.isBold,
        indicator: square.indicator,
        tabId: square.tabId,
        disabled: square.disabled
      };
    },
    
    /**
     * Serialize a circle for the clipboard
     * @private
     * @param {Object} circle Circle object
     * @returns {Object} Serialized circle data
     */
    _serializeCircle: function(circle) {
      return {
        id: circle.id,
        x: circle.x,
        y: circle.y,
        color: circle.color,
        name: circle.name,
        circleType: circle.circleType,
        documentId: circle.documentId,
        indicator: circle.indicator,
        disabled: circle.disabled,
        showTabNames: circle.showTabNames,
        squareCount: circle.squareCount
      };
    },
    
    /**
     * Serialize a tab for the clipboard
     * @private
     * @param {Object} tab Tab object
     * @returns {Object} Serialized tab data
     */
    _serializeTab: function(tab) {
      return {
        id: tab.id,
        name: tab.name,
        index: tab.index,
        circleId: tab.circleId,
        color: tab.color
      };
    },
    
    /**
     * Serialize a circle reference for the clipboard
     * @private
     * @param {Object} ref Circle reference object
     * @returns {Object} Serialized circle reference data
     */
    _serializeCircleReference: function(ref) {
      return {
        id: ref.id,
        sourceCircleId: ref.sourceCircleId,
        tabId: ref.tabId,
        createdAt: ref.createdAt,
        updatedAt: ref.updatedAt
      };
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
