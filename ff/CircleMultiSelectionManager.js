// Enhanced CircleMultiSelectionManager.js - Add undimming for multi-selection

(function(ChakraApp) {
  /**
   * CircleMultiSelectionManager - handles selecting, manipulating, and rendering multiple circles
   */
  ChakraApp.CircleMultiSelectionManager = {
    // Array of all selected circle IDs
    selectedCircleIds: [],

    /**
     * Select a single circle (replaces primary selection)
     * @param {string} circleId - The circle to select
     * @returns {Array} Array with the selected circle ID
     */
    selectSingle: function(circleId) {
      // Clear current selection
      this.clearSelection();
      
      // Add the circle to selection
      this.selectedCircleIds.push(circleId);
      
      // Apply multi-selected class
      this._applyMultiSelectedClassToCircle(circleId);
      
      // Update AppState for compatibility
      ChakraApp.appState.selectedCircleId = circleId;
      
      // Select the circle model
      var circle = ChakraApp.appState.getCircle(circleId);
      if (circle) {
        circle.select();
      }
      
      // NEW: For single selection, maintain normal dimming behavior
      // The normal circle selection event will handle dimming other circles
      
      // Publish selection event
      ChakraApp.EventBus.publish('CIRCLES_MULTI_SELECTED', {
        selectedCircleIds: this.selectedCircleIds,
        count: this.selectedCircleIds.length
      });
      
      return this.selectedCircleIds;
    },

    /**
     * Toggle individual circle selection (CTRL-click behavior)
     * @param {string} circleId - The circle to toggle
     * @returns {boolean} True if circle was added to selection, false if removed
     */
    toggleIndividualSelection: function(circleId) {
      var index = this.selectedCircleIds.indexOf(circleId);
      
      if (index !== -1) {
        // Circle is selected, remove it
        this.selectedCircleIds.splice(index, 1);
        this._removeMultiSelectedClassFromCircle(circleId);
        
        // Deselect the circle model
        var circle = ChakraApp.appState.getCircle(circleId);
        if (circle) {
          circle.deselect();
        }
        
        // Update AppState
        this._updateAppStateSelection();
        
        // Hide squares when deselecting
        this._hideSquaresForCircle(circleId);
        
        // NEW: Update dimming based on remaining selection count
        this._updateDimmingForMultiSelection();
        
        ChakraApp.EventBus.publish('CIRCLES_MULTI_UPDATED', {
          selectedCircleIds: this.selectedCircleIds,
          removedCircleId: circleId,
          count: this.selectedCircleIds.length
        });
        
        return false;
      } else {
        // Circle is not selected, add it
        this.selectedCircleIds.push(circleId);
        this._applyMultiSelectedClassToCircle(circleId);
        
        // Select the circle model
        var circle = ChakraApp.appState.getCircle(circleId);
        if (circle) {
          circle.select();
        }
        
        // Update AppState
        this._updateAppStateSelection();
        
        // Hide squares when multi-selecting (show nothing in center panel)
        this._hideAllSquares();
        
        // NEW: Update dimming based on selection count
        this._updateDimmingForMultiSelection();
        
        ChakraApp.EventBus.publish('CIRCLES_MULTI_UPDATED', {
          selectedCircleIds: this.selectedCircleIds,
          addedCircleId: circleId,
          count: this.selectedCircleIds.length
        });
        
        return true;
      }
    },

    /**
     * Get the primary circle for operations that need a reference
     * @returns {string|null} First selected circle ID or null
     */
    getPrimaryCircleId: function() {
      return this.selectedCircleIds.length > 0 ? this.selectedCircleIds[0] : null;
    },

    /**
     * Check if any circle is selected
     * @returns {boolean} True if any circles are selected
     */
    hasCircleSelected: function() {
      return this.selectedCircleIds.length > 0;
    },
    
    /**
     * Add a circle to the current multi-selection
     * @param {string} circleId - The circle to add
     */
    addToSelection: function(circleId) {
      // Don't add if already selected
      if (this.selectedCircleIds.indexOf(circleId) !== -1) {
        return;
      }
      
      this.selectedCircleIds.push(circleId);
      this._applyMultiSelectedClassToCircle(circleId);
      
      // Select the circle model
      var circle = ChakraApp.appState.getCircle(circleId);
      if (circle) {
        circle.select();
      }
      
      // Update AppState
      this._updateAppStateSelection();
      
      // Hide squares when multi-selecting
      this._hideAllSquares();
      
      // NEW: Update dimming based on selection count
      this._updateDimmingForMultiSelection();
      
      ChakraApp.EventBus.publish('CIRCLES_MULTI_UPDATED', {
        selectedCircleIds: this.selectedCircleIds,
        addedCircleId: circleId,
        count: this.selectedCircleIds.length
      });
    },
    
    /**
     * Remove a circle from the multi-selection
     * @param {string} circleId - The circle to remove
     */
    removeFromSelection: function(circleId) {
      var index = this.selectedCircleIds.indexOf(circleId);
      if (index !== -1) {
        this.selectedCircleIds.splice(index, 1);
        this._removeMultiSelectedClassFromCircle(circleId);
        
        // Deselect the circle model
        var circle = ChakraApp.appState.getCircle(circleId);
        if (circle) {
          circle.deselect();
        }
        
        // Update AppState
        this._updateAppStateSelection();
        
        // NEW: Update dimming based on remaining selection count
        this._updateDimmingForMultiSelection();
        
        ChakraApp.EventBus.publish('CIRCLES_MULTI_UPDATED', {
          selectedCircleIds: this.selectedCircleIds,
          removedCircleId: circleId,
          count: this.selectedCircleIds.length
        });
      }
    },
    
    /**
     * Check if a circle is currently selected
     * @param {string} circleId - Circle ID to check
     * @returns {boolean} True if the circle is selected
     */
    isCircleSelected: function(circleId) {
      return this.selectedCircleIds.indexOf(circleId) !== -1;
    },
    
    /**
     * Clear multi-selection
     */
    clearSelection: function() {
      // Remove multi-selected class from all circles
      this._removeMultiSelectedClass();
      
      // Deselect all circle models
      var self = this;
      this.selectedCircleIds.forEach(function(circleId) {
        var circle = ChakraApp.appState.getCircle(circleId);
        if (circle) {
          circle.deselect();
        }
      });
      
      // Clear selection array
      this.selectedCircleIds = [];
      
      // FIXED: Clear AppState selection properly
      ChakraApp.appState.selectedCircleId = null;
      
      // Hide all squares
      this._hideAllSquares();
      
      // NEW: Clear all dimming when no circles are selected
      this._clearAllDimming();
      
      // FIXED: Trigger proper circle deselection handling
      if (ChakraApp.appState._handleCircleDeselection) {
        ChakraApp.appState._handleCircleDeselection();
      }
      
      // FIXED: Publish deselection event through proper AppState method
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DESELECTED, null);
      
      // Publish multi-deselection event
      ChakraApp.EventBus.publish('CIRCLES_MULTI_DESELECTED', {});
    },
    
    /**
     * Check if multi-selection is active
     * @returns {boolean} True if there are multi-selected circles
     */
    hasSelection: function() {
      return this.selectedCircleIds.length > 0;
    },
    
    /**
     * Get all selected circle IDs
     * @returns {Array} Array of all selected circle IDs
     */
    getAllSelectedIds: function() {
      return this.selectedCircleIds.slice(); // Return a copy
    },
    
    /**
     * Get the count of selected circles
     * @returns {number} Number of selected circles
     */
    getSelectionCount: function() {
      return this.selectedCircleIds.length;
    },
    
    /**
     * Get the first selected circle (useful for operations that need a reference circle)
     * @returns {string|null} First selected circle ID or null
     */
    getFirstSelectedId: function() {
      return this.selectedCircleIds.length > 0 ? this.selectedCircleIds[0] : null;
    },
    
    /**
     * NEW: Update dimming based on multi-selection state
     * @private
     */
    _updateDimmingForMultiSelection: function() {
      if (this.selectedCircleIds.length > 1) {
        // When multiple circles are selected, undim all circles
        this._clearAllDimming();
      } else if (this.selectedCircleIds.length === 1) {
        // When only one circle is selected, let the normal dimming behavior handle it
        // Trigger the normal circle selection event to dim other circles
        var selectedCircle = ChakraApp.appState.getCircle(this.selectedCircleIds[0]);
        if (selectedCircle) {
          ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_SELECTED, selectedCircle);
        }
      } else {
        // When no circles are selected, clear all dimming
        this._clearAllDimming();
      }
    },
    
    /**
     * NEW: Clear dimming from all circles
     * @private
     */
    _clearAllDimming: function() {
      // Find all circle elements and remove dimming
      var allCircleElements = document.querySelectorAll('.circle');
      allCircleElements.forEach(function(circleElement) {
        circleElement.classList.remove('dimmed');
      });
      
      // Also update the view models if available
      if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
        ChakraApp.app.viewManager.circleViews.forEach(function(circleView) {
          if (circleView.viewModel) {
            circleView.viewModel.isDimmed = false;
            // Trigger view update to remove dimming visually
            circleView.updateDimmingState();
          }
        });
      }
    },
    
    /**
     * Move all selected circles
     * @param {number} dx - X delta movement
     * @param {number} dy - Y delta movement
     * @param {Element} parentElement - Parent DOM element for boundary checking
     */
    moveSelectedCircles: function(dx, dy, parentElement) {
      if (this.selectedCircleIds.length === 0) {
        return;
      }
      
      // Handle case where parentElement might not be a DOM element
      var parentRect;
      if (parentElement && typeof parentElement.getBoundingClientRect === 'function') {
        parentRect = parentElement.getBoundingClientRect();
      } else {
        // Fallback: use left panel bounds
        var leftPanel = document.querySelector('.left-panel');
        if (leftPanel) {
          parentRect = leftPanel.getBoundingClientRect();
        } else {
          // Ultimate fallback
          parentRect = { width: 400, height: 600 };
        }
      }
      
      var elementSize = 20; // Assuming circle size is 20px
      
      // Calculate the applied delta by checking the first circle's movement
      var firstCircle = ChakraApp.appState.getCircle(this.selectedCircleIds[0]);
      if (!firstCircle) {
        return;
      }
      
      // Get panel width for center-relative positioning
      var panelWidth = ChakraApp.app && ChakraApp.app.resizeController ? 
        ChakraApp.app.resizeController.getCurrentPanelWidth() : 400;
      var panelCenterX = panelWidth / 2;
      
      // Convert center-relative coordinates to absolute for boundary checking
      var currentAbsoluteX = firstCircle.x + panelCenterX;
      var currentAbsoluteY = firstCircle.y;
      
      var newAbsoluteX = Math.max(elementSize/2, Math.min(parentRect.width - elementSize/2, currentAbsoluteX + dx));
      var newAbsoluteY = Math.max(elementSize/2, Math.min(parentRect.height - elementSize/2, currentAbsoluteY + dy));
      
      var appliedDx = newAbsoluteX - currentAbsoluteX;
      var appliedDy = newAbsoluteY - currentAbsoluteY;
      
      // Only proceed if there's actual movement
      if (appliedDx === 0 && appliedDy === 0) {
        return;
      }
      
      // Update all selected circles
      var self = this;
      this.selectedCircleIds.forEach(function(circleId) {
        var circle = ChakraApp.appState.getCircle(circleId);
        if (circle) {
          // Convert current center-relative position to absolute
          var currentCircleAbsX = circle.x + panelCenterX;
          var currentCircleAbsY = circle.y;
          
          // Calculate new absolute position
          var newCircleAbsX = Math.max(elementSize/2, Math.min(parentRect.width - elementSize/2, currentCircleAbsX + appliedDx));
          var newCircleAbsY = Math.max(elementSize/2, Math.min(parentRect.height - elementSize/2, currentCircleAbsY + appliedDy));
          
          // Convert back to center-relative coordinates
          var newCircleX = newCircleAbsX - panelCenterX;
          var newCircleY = newCircleAbsY;
          
          // Update the circle position
          ChakraApp.appState.updateCircle(circleId, {
            x: newCircleX,
            y: newCircleY
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
     * Apply multi-selected class to all selected circles
     * @private
     */
    _applyMultiSelectedClass: function() {
      var self = this;
      this.selectedCircleIds.forEach(function(circleId) {
        self._applyMultiSelectedClassToCircle(circleId);
      });
    },
    
    /**
     * Apply multi-selected class to a specific circle
     * @private
     * @param {string} circleId - Circle ID
     */
    _applyMultiSelectedClassToCircle: function(circleId) {
      var circleElement = document.querySelector('.circle[data-id="' + circleId + '"]');
      if (circleElement) {
        circleElement.classList.add('multi-selected');
      }
    },
    
    /**
     * Remove multi-selected class from all circles
     * @private
     */
    _removeMultiSelectedClass: function() {
      var selectedCircles = document.querySelectorAll('.circle.multi-selected');
      selectedCircles.forEach(function(element) {
        element.classList.remove('multi-selected');
      });
    },
    
    /**
     * Remove multi-selected class from a specific circle
     * @private
     * @param {string} circleId - Circle ID
     */
    _removeMultiSelectedClassFromCircle: function(circleId) {
      var circleElement = document.querySelector('.circle[data-id="' + circleId + '"]');
      if (circleElement) {
        circleElement.classList.remove('multi-selected');
      }
    },
    
    /**
     * Apply group-dragging class to all selected circles
     * @private
     */
    _applyGroupDraggingClass: function() {
      var self = this;
      this.selectedCircleIds.forEach(function(circleId) {
        var circleElement = document.querySelector('.circle[data-id="' + circleId + '"]');
        if (circleElement) {
          circleElement.classList.add('group-dragging');
        }
      });
    },
    
    /**
     * Remove group-dragging class from all circles
     * @private
     */
    _removeGroupDraggingClass: function() {
      var draggingCircles = document.querySelectorAll('.circle.group-dragging');
      draggingCircles.forEach(function(element) {
        element.classList.remove('group-dragging');
      });
    },
    
    /**
     * Update AppState selection for compatibility
     * @private
     */
    _updateAppStateSelection: function() {
      if (this.selectedCircleIds.length === 1) {
        // Single selection: update AppState
        ChakraApp.appState.selectedCircleId = this.selectedCircleIds[0];
      } else {
        // Multi-selection: clear AppState selection
        ChakraApp.appState.selectedCircleId = null;
      }
    },
    
    /**
     * Show squares for a specific circle
     * @private
     * @param {string} circleId - Circle ID
     */
    _showSquaresForCircle: function(circleId) {
      if (ChakraApp.appState._showSquaresForCircle) {
        ChakraApp.appState._showSquaresForCircle(circleId);
      }
    },
    
    /**
     * Hide squares for a specific circle
     * @private
     * @param {string} circleId - Circle ID
     */
    _hideSquaresForCircle: function(circleId) {
      // Hide squares for this circle
      var squares = ChakraApp.appState.getSquaresForCircle(circleId);
      squares.forEach(function(square) {
        square.hide();
      });
    },
    
    /**
     * Hide all squares
     * @private
     */
    _hideAllSquares: function() {
      if (ChakraApp.appState._hideAllSquares) {
        ChakraApp.appState._hideAllSquares();
      }
    },
    
    /**
     * Delete all selected circles
     * @returns {number} Number of circles deleted
     */
    deleteAllSelected: function() {
      var count = 0;
      
      // Store the IDs we need to delete before we start deleting
      var circleIdsToDelete = this.selectedCircleIds.slice(); // Create a copy
      
      // Clear selection first to avoid any state issues during deletion
      this.clearSelection();
      
      // Delete all selected circles
      circleIdsToDelete.forEach(function(circleId) {
        if (circleId && ChakraApp.appState.getCircle(circleId)) {
          ChakraApp.appState.removeCircle(circleId);
          count++;
        }
      });
      
      return count;
    },
    
    /**
     * Apply an indicator to all selected circles
     * @param {string} indicator - Indicator type
     * @returns {number} Number of circles modified
     */
    applyIndicatorToAll: function(indicator) {
      var count = 0;
      
      // Apply to all selected circles
      this.selectedCircleIds.forEach(function(circleId) {
        ChakraApp.appState.updateCircle(circleId, {
          indicator: indicator
        });
        count++;
      });
      
      return count;
    },
    
    /**
     * Toggle disabled state for all selected circles
     * @returns {number} Number of circles modified
     */
    toggleDisabledForAll: function() {
      var count = 0;
      
      // Determine the target state based on the first circle's current state
      var targetState = false;
      if (this.selectedCircleIds.length > 0) {
        var firstCircle = ChakraApp.appState.getCircle(this.selectedCircleIds[0]);
        if (firstCircle) {
          targetState = !firstCircle.disabled;
        }
      }
      
      // Update all selected circles
      this.selectedCircleIds.forEach(function(circleId) {
        ChakraApp.appState.updateCircle(circleId, { disabled: targetState });
        count++;
      });
      
      return count;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
