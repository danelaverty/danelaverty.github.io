// src/controllers/KeyboardController.js
// Handles keyboard shortcuts

(function(ChakraApp) {
  /**
   * Keyboard controller for handling keyboard shortcuts
   */
  ChakraApp.KeyboardController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // Keep track of key handlers
    this.keyHandlers = {};
    
    // Keep track of event handlers
    this.keydownHandler = null;
    
    // For notification timeouts
    this.notificationTimeout = null;
  };
  
  // Inherit from BaseController
  ChakraApp.KeyboardController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.KeyboardController.prototype.constructor = ChakraApp.KeyboardController;
  
  // Initialize
  ChakraApp.KeyboardController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Register keyboard shortcuts
    this._registerKeyboardShortcuts();
    
    // Add global keyboard event listener
    var self = this;
    this.keydownHandler = function(e) {
      self._handleKeyDown(e);
    };
    
    document.addEventListener('keydown', this.keydownHandler);
  };

  // Register keyboard shortcuts
  ChakraApp.KeyboardController.prototype._registerKeyboardShortcuts = function() {
    var self = this;

    // Delete key - delete selected item
    // Delete key - delete selected item
    this.keyHandlers['Delete'] = function(e) {
  if (self._isEditingText()) return;

  e.preventDefault();

  // Check if there are selected squares (using multi-selection system)
  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    // Capture the selection state BEFORE showing the dialog
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    var totalCount = selectedIds.length;
    
    self._showDeleteDialog(function() {
      // Delete using the captured state
      var count = ChakraApp.MultiSelectionManager.deleteAllSelected();
      self._showNotification('Deleted ' + count + ' squares');
    });
  }
  // Check if there are selected circles (using multi-selection system)
  else if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    var totalCount = selectedIds.length;
    
    self._showDeleteDialog(function() {
      // Delete using the captured state
      var count = ChakraApp.CircleMultiSelectionManager.deleteAllSelected();
      self._showNotification('Deleted ' + count + ' circles');
    });
  }
  // Fall back to other selections if no squares are multi-selected
  else if (ChakraApp.appState.selectedCircleReferenceId) {
    ChakraApp.appState.removeCircleReference(ChakraApp.appState.selectedCircleReferenceId);
    return;
  }
  else if (ChakraApp.appState.selectedCircleId) {
    self._showDeleteDialog(function() {
      ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
    });
  }
};

ChakraApp.KeyboardController.prototype._handleToggleAllOtherCircles = function() {
  var selectedCircleId = ChakraApp.appState.selectedCircleId;
  
  if (!selectedCircleId) {
    this._showNotification('⚠️ Please select a circle first');
    return;
  }

  var selectedCircle = ChakraApp.appState.getCircle(selectedCircleId);
  if (!selectedCircle) {
    this._showNotification('⚠️ Selected circle not found');
    return;
  }

  // Get the document of the selected circle
  var selectedDoc = ChakraApp.appState.getDocument(selectedCircle.documentId);
  if (!selectedDoc) {
    this._showNotification('⚠️ Document not found for selected circle');
    return;
  }

  // ALWAYS ensure the selected circle is enabled
  if (selectedCircle.disabled) {
    ChakraApp.appState.updateCircle(selectedCircleId, { disabled: false });
  }

  // Get all circles in the same document, excluding the selected circle
  var allCirclesInDoc = ChakraApp.appState.getCirclesForDocument(selectedCircle.documentId);
  var otherCircles = allCirclesInDoc.filter(function(circle) {
    return circle.id !== selectedCircleId;
  });

  if (otherCircles.length === 0) {
    this._showNotification('ℹ️ No other circles in this document (selected circle enabled)');
    return;
  }

  // Check if all other circles are already disabled
  var allOthersDisabled = otherCircles.every(function(circle) {
    return circle.disabled;
  });

  var newDisabledState, actionMessage;
  
  if (allOthersDisabled) {
    // If all others are disabled, enable them all
    newDisabledState = false;
    actionMessage = 'Enabled all other circles';
  } else {
    // If any others are enabled, disable them all
    newDisabledState = true;
    actionMessage = 'Disabled all other circles';
  }

  // Apply the new state to all other circles
  var updatedCount = 0;
  otherCircles.forEach(function(circle) {
    ChakraApp.appState.updateCircle(circle.id, { disabled: newDisabledState });
    updatedCount++;
  });

  // Show notification with count and mention that selected circle is enabled
  this._showNotification(actionMessage + ' (' + updatedCount + ' circles) - selected circle enabled');
};

/**
 * Align and distribute circles vertically
 * Sets all circles to the same X position (midpoint) and distributes them evenly by Y
 * @private
 * @param {Array} circles - Array of circle objects
 */
ChakraApp.KeyboardController.prototype._alignAndDistributeCirclesVertically = function(circles) {
  if (circles.length < 2) return;

  // Calculate the midpoint X position
  var totalX = circles.reduce(function(sum, circle) {
    return sum + circle.x;
  }, 0);
  var midpointX = Math.round(totalX / circles.length);

  // Sort circles by Y position to maintain relative order
  var sortedCircles = circles.slice().sort(function(a, b) {
    return a.y - b.y;
  });

  // Calculate Y distribution
  var minY = sortedCircles[0].y;
  var maxY = sortedCircles[sortedCircles.length - 1].y;
  var yStep = sortedCircles.length > 1 ? (maxY - minY) / (sortedCircles.length - 1) : 0;

  // Update positions
  sortedCircles.forEach(function(circle, index) {
    var newY = sortedCircles.length === 1 ? circle.y : Math.round(minY + (yStep * index));
    
    ChakraApp.appState.updateCircle(circle.id, {
      x: midpointX,
      y: newY
    });
  });

  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

/**
 * Align and distribute circles horizontally
 * Sets all circles to the same Y position (midpoint) and distributes them evenly by X
 * @private
 * @param {Array} circles - Array of circle objects
 */
ChakraApp.KeyboardController.prototype._alignAndDistributeCirclesHorizontally = function(circles) {
  if (circles.length < 2) return;

  // Calculate the midpoint Y position
  var totalY = circles.reduce(function(sum, circle) {
    return sum + circle.y;
  }, 0);
  var midpointY = Math.round(totalY / circles.length);

  // Sort circles by X position to maintain relative order
  var sortedCircles = circles.slice().sort(function(a, b) {
    return a.x - b.x;
  });

  // Calculate X distribution
  var minX = sortedCircles[0].x;
  var maxX = sortedCircles[sortedCircles.length - 1].x;
  var xStep = sortedCircles.length > 1 ? (maxX - minX) / (sortedCircles.length - 1) : 0;

  // Update positions
  sortedCircles.forEach(function(circle, index) {
    var newX = sortedCircles.length === 1 ? circle.x : Math.round(minX + (xStep * index));
    
    ChakraApp.appState.updateCircle(circle.id, {
      x: newX,
      y: midpointY
    });
  });

  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

/**
 * Align and distribute circles in circular pattern
 * @private
 * @param {Array} circles - Array of circle objects
 */
ChakraApp.KeyboardController.prototype._alignAndDistributeCirclesCircularly = function(circles) {
  if (circles.length < 2) return;

  // Check if circles are already in a circular arrangement
  var isAlreadyCircular = this._isCircularArrangementCircles(circles);
  
  var centerX, centerY, radius;
  
  if (isAlreadyCircular) {
    // If already circular, maintain the existing center and radius
    var existingCenter = this._getCircularCenterCircles(circles);
    centerX = existingCenter.x;
    centerY = existingCenter.y;
    radius = existingCenter.radius;
  } else {
    // Calculate the geometric center point (midpoint of bounding box)
    var minX = Math.min.apply(Math, circles.map(function(c) { return c.x; }));
    var maxX = Math.max.apply(Math, circles.map(function(c) { return c.x; }));
    var minY = Math.min.apply(Math, circles.map(function(c) { return c.y; }));
    var maxY = Math.max.apply(Math, circles.map(function(c) { return c.y; }));
    
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;

    // Calculate radius based on the current spread of circles
    var maxDistance = Math.max.apply(Math, circles.map(function(circle) {
      var dx = circle.x - centerX;
      var dy = circle.y - centerY;
      return Math.sqrt(dx * dx + dy * dy);
    }));
    
    // Ensure minimum radius for readability (at least 80 pixels for circles)
    radius = Math.max(maxDistance, 80);
  }
  
  // For 2 circles, place them horizontally opposite each other
  if (circles.length === 2) {
    ChakraApp.appState.updateCircle(circles[0].id, {
      x: Math.round(centerX - radius),
      y: Math.round(centerY)
    });
    
    ChakraApp.appState.updateCircle(circles[1].id, {
      x: Math.round(centerX + radius),
      y: Math.round(centerY)
    });
  } else {
    // For 3+ circles, arrange in a circle
    var angleStep = (2 * Math.PI) / circles.length;
    var startAngle = -Math.PI / 2; // Start at the top
    
    // Sort circles by their current angle from center to maintain relative positions
    var circlesWithAngles = circles.map(function(circle) {
      var dx = circle.x - centerX;
      var dy = circle.y - centerY;
      var currentAngle = Math.atan2(dy, dx);
      return {
        circle: circle,
        angle: currentAngle
      };
    });
    
    // Sort by current angle to preserve relative positioning
    circlesWithAngles.sort(function(a, b) {
      return a.angle - b.angle;
    });
    
    // Position circles around the circle
    circlesWithAngles.forEach(function(item, index) {
      var angle = startAngle + (angleStep * index);
      var newX = Math.round(centerX + Math.cos(angle) * radius);
      var newY = Math.round(centerY + Math.sin(angle) * radius);
      
      ChakraApp.appState.updateCircle(item.circle.id, {
        x: newX,
        y: newY
      });
    });
  }

  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

/**
 * Check if circles are already arranged in a roughly circular pattern
 * @private
 * @param {Array} circles - Array of circle objects
 * @returns {boolean} True if circles appear to be in circular arrangement
 */
ChakraApp.KeyboardController.prototype._isCircularArrangementCircles = function(circles) {
  if (circles.length < 3) return false;
  
  var center = this._getCircularCenterCircles(circles);
  var distances = circles.map(function(circle) {
    var dx = circle.x - center.x;
    var dy = circle.y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
  });
  
  var avgDistance = distances.reduce(function(sum, d) { return sum + d; }, 0) / distances.length;
  
  // Check if all circles are roughly the same distance from center (within 15% tolerance)
  var tolerance = avgDistance * 0.15;
  return distances.every(function(distance) {
    return Math.abs(distance - avgDistance) <= tolerance;
  });
};

/**
 * Get the center point and radius of a circular arrangement for circles
 * @private
 * @param {Array} circles - Array of circle objects
 * @returns {Object} Object with x, y, and radius properties
 */
ChakraApp.KeyboardController.prototype._getCircularCenterCircles = function(circles) {
  // Use the centroid (average position) as the center
  var totalX = circles.reduce(function(sum, circle) { return sum + circle.x; }, 0);
  var totalY = circles.reduce(function(sum, circle) { return sum + circle.y; }, 0);
  
  var centerX = totalX / circles.length;
  var centerY = totalY / circles.length;
  
  // Calculate average radius
  var totalDistance = circles.reduce(function(sum, circle) {
    var dx = circle.x - centerX;
    var dy = circle.y - centerY;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  
  var radius = totalDistance / circles.length;
  
  return {
    x: centerX,
    y: centerY,
    radius: radius
  };
};

/**
 * Scale group distances for circles (expand/contract)
 * @private
 * @param {Array} circles - Array of circle objects
 * @param {number} scaleFactor - Scale factor (>1 to expand, <1 to contract)
 */
ChakraApp.KeyboardController.prototype._scaleCircleGroupDistances = function(circles, scaleFactor) {
  if (circles.length < 2) return;

  // Calculate the centroid (center of mass) of the group
  var totalX = circles.reduce(function(sum, circle) { return sum + circle.x; }, 0);
  var totalY = circles.reduce(function(sum, circle) { return sum + circle.y; }, 0);
  
  var centerX = totalX / circles.length;
  var centerY = totalY / circles.length;
  
  // Scale each circle's distance from the center
  circles.forEach(function(circle) {
    // Calculate current distance vector from center
    var dx = circle.x - centerX;
    var dy = circle.y - centerY;
    
    // Scale the distance vector
    var scaledDx = dx * scaleFactor;
    var scaledDy = dy * scaleFactor;
    
    // Calculate new position
    var newX = Math.round(centerX + scaledDx);
    var newY = Math.round(centerY + scaledDy);
    
    ChakraApp.appState.updateCircle(circle.id, {
      x: newX,
      y: newY
    });
  });
  
  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

this.keyHandlers['?'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Check if SHIFT is also held for the new functionality
  if (e.shiftKey) {
    // SHIFT+CTRL+/: Disable all circles except selected, or enable all if all are disabled
    self._handleToggleAllOtherCircles();
    return;
  }
}

this.keyHandlers['/'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Original CTRL+/ functionality for circles/squares
  // Handle circles using multi-selection system
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    var toggleState = null;
    var count = 0;
    
    // Determine toggle state based on first circle
    var firstCircle = ChakraApp.appState.getCircle(selectedIds[0]);
    if (firstCircle) {
      toggleState = !firstCircle.disabled;
    }
    
    // Apply to all selected circles
    selectedIds.forEach(function(circleId) {
      var circle = ChakraApp.appState.getCircle(circleId);
      if (circle) {
        ChakraApp.appState.updateCircle(circleId, { disabled: toggleState });
        count++;
      }
    });
    
    self._showNotification((toggleState ? 'Disabled' : 'Enabled') + ' ' + count + ' circles');
  }
  // Handle squares using multi-selection system
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    var toggleState = null;
    var count = 0;
    
    // Determine toggle state based on first square
    var firstSquare = ChakraApp.appState.getSquare(selectedIds[0]);
    if (firstSquare) {
      toggleState = !firstSquare.disabled;
    }
    
    // Apply to all selected squares
    selectedIds.forEach(function(squareId) {
      var square = ChakraApp.appState.getSquare(squareId);
      if (square) {
        ChakraApp.appState.updateSquare(squareId, { disabled: toggleState });
        count++;
      }
    });
    
    self._showNotification((toggleState ? 'Disabled' : 'Enabled') + ' ' + count + ' squares');
  }
  // Fall back to circle if no squares selected
  else if (ChakraApp.appState.selectedCircleId) {
    var circle = ChakraApp.appState.getCircle(ChakraApp.appState.selectedCircleId);
    if (circle) {
      var newDisabledState = !circle.disabled;
      ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
        disabled: newDisabledState 
      });
      self._showNotification(newDisabledState ? 'Circle disabled' : 'Circle enabled');
    }
  }
};

this.keyHandlers[']'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Must have a circle selected
  if (ChakraApp.appState.selectedCircleId) {
    var selectedCircle = ChakraApp.appState.getCircle(ChakraApp.appState.selectedCircleId);
    if (selectedCircle) {
      
      var newState = selectedCircle.toggleShowTabNames();
      
      // FORCE IMMEDIATE SAVE: Save the state immediately after the toggle
      ChakraApp.appState.saveToStorageNow();
      
      // FORCE IMMEDIATE UPDATE: Get the circle view and force it to update
      if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
        var circleView = ChakraApp.app.viewManager.circleViews.get(ChakraApp.appState.selectedCircleId);
        if (circleView && circleView.viewModel) {
          
          // CRITICAL: Force the view model to update its property immediately
          circleView.viewModel.showTabNames = newState;
          
          // Force update the view immediately
          circleView.updateTabNames();
          
        }
      }
      
      // Show notification
      var message = newState ? 'Tab names shown' : 'Tab names hidden';
      self._showNotification(message);
    }
  } else {
    self._showNotification('⚠️ Please select a circle first');
  }
};

    // Ctrl+= - For squares: cycle indicator emoji; For circle references: increase field radius
this.keyHandlers['='] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Check if a circle reference is selected
  if (ChakraApp.appState.selectedCircleReferenceId) {
    var circleReferenceViewData = self._getCircleReferenceViewData(ChakraApp.appState.selectedCircleReferenceId);
    if (circleReferenceViewData && circleReferenceViewData.viewModel) {
      var oldRadius = circleReferenceViewData.viewModel.fieldRadius;
      circleReferenceViewData.viewModel.increaseFieldRadius();
      self._showNotification('Field radius: ' + circleReferenceViewData.viewModel.fieldRadius + 'px (was ' + oldRadius + 'px)');
    }
    return;
  }

  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    var count = 0;
    var newIndicator = null;
    
    // Use the first square to determine the next indicator
    var firstSquare = ChakraApp.appState.getSquare(selectedIds[0]);
    if (firstSquare) {
      var currentIndex = -1;
      if (firstSquare.indicator) {
        ChakraApp.Config.indicatorEmojis.forEach(function(config, index) {
          if (config.id === firstSquare.indicator) {
            currentIndex = index;
          }
        });
      }
      
      var nextIndex = (currentIndex + 1) % ChakraApp.Config.indicatorEmojis.length;
      newIndicator = ChakraApp.Config.indicatorEmojis[nextIndex];
      
      // Apply to all selected squares
      selectedIds.forEach(function(squareId) {
        ChakraApp.appState.updateSquare(squareId, { indicator: newIndicator.id });
        count++;
      });
      
      self._showNotification('Indicator: ' + newIndicator.emoji + ' ' + newIndicator.name + ' (' + count + ' squares)');
    }
  }
  // Handle circles using multi-selection system
  else if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    var count = 0;
    var newIndicator = null;
    
    // Use the first circle to determine the next indicator
    var firstCircle = ChakraApp.appState.getCircle(selectedIds[0]);
    if (firstCircle) {
      var currentIndex = -1;
      if (firstCircle.indicator) {
        ChakraApp.Config.indicatorEmojis.forEach(function(config, index) {
          if (config.id === firstCircle.indicator) {
            currentIndex = index;
          }
        });
      }
      
      var nextIndex = (currentIndex + 1) % ChakraApp.Config.indicatorEmojis.length;
      newIndicator = ChakraApp.Config.indicatorEmojis[nextIndex];
      
      // Apply to all selected circles
      selectedIds.forEach(function(circleId) {
        ChakraApp.appState.updateCircle(circleId, { indicator: newIndicator.id });
        count++;
      });
      
      self._showNotification('Circle Indicator: ' + newIndicator.emoji + ' ' + newIndicator.name + ' (' + count + ' circles)');
    }
  }
  // Handle squares using multi-selection system
  // Fall back to circle
  else if (ChakraApp.appState.selectedCircleId) {
    var circleId = ChakraApp.appState.selectedCircleId;
    var circle = ChakraApp.appState.getCircle(circleId);

    if (circle) {
      var currentIndex = -1;
      if (circle.indicator) {
        ChakraApp.Config.indicatorEmojis.forEach(function(config, index) {
          if (config.id === circle.indicator) {
            currentIndex = index;
          }
        });
      }

      var nextIndex = (currentIndex + 1) % ChakraApp.Config.indicatorEmojis.length;
      var nextIndicator = ChakraApp.Config.indicatorEmojis[nextIndex];

      ChakraApp.appState.updateCircle(circleId, { indicator: nextIndicator.id });
      self._showNotification('Circle Indicator: ' + nextIndicator.emoji + ' ' + nextIndicator.name);
    }
  }
};

this.keyHandlers['1'] = this.keyHandlers['2'] = 
this.keyHandlers['3'] = this.keyHandlers['4'] = this.keyHandlers['5'] = 
this.keyHandlers['6'] = this.keyHandlers['7'] = this.keyHandlers['8'] = 
this.keyHandlers['9'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Get the digit that was pressed
  var digitPressed = parseInt(e.key);
  
  // Convert to 0-based index (CTRL+1 = index 0, CTRL+2 = index 1, etc.)
  // CTRL+0 cycles back to the last emoji in the array
  var emojiIndex;
  if (digitPressed === 0) {
    emojiIndex = ChakraApp.Config.indicatorEmojis.length - 1;
  } else {
    emojiIndex = digitPressed - 1;
  }
  
  // Check if the index is valid
  if (emojiIndex < 0 || emojiIndex >= ChakraApp.Config.indicatorEmojis.length) {
    self._showNotification('⚠️ No emoji assigned to CTRL+' + digitPressed);
    return;
  }
  
  var selectedEmoji = ChakraApp.Config.indicatorEmojis[emojiIndex];

  // Handle squares using multi-selection system
  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    var count = 0;
    
    selectedIds.forEach(function(squareId) {
      var square = ChakraApp.appState.getSquare(squareId);
      if (square) {
        ChakraApp.appState.updateSquare(squareId, { indicator: selectedEmoji.id });
        count++;
      }
    });
    
    self._showNotification('Set ' + selectedEmoji.emoji + ' ' + selectedEmoji.name + ' on ' + count + ' squares');
  }
  // Handle circles using multi-selection system
  else if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    var count = 0;
    
    selectedIds.forEach(function(circleId) {
      var circle = ChakraApp.appState.getCircle(circleId);
      if (circle) {
        ChakraApp.appState.updateCircle(circleId, { indicator: selectedEmoji.id });
        count++;
      }
    });
    
    self._showNotification('Set ' + selectedEmoji.emoji + ' ' + selectedEmoji.name + ' on ' + count + ' circles');
  }
  // Fall back to single circle
  else if (ChakraApp.appState.selectedCircleId) {
    var circleId = ChakraApp.appState.selectedCircleId;
    var circle = ChakraApp.appState.getCircle(circleId);

    if (circle) {
      ChakraApp.appState.updateCircle(circleId, { indicator: selectedEmoji.id });
      self._showNotification('Set circle indicator: ' + selectedEmoji.emoji + ' ' + selectedEmoji.name);
    }
  } else {
    self._showNotification('⚠️ Please select a circle or square first');
  }
};

    // Ctrl+- - For squares: remove indicator emoji; For circle references: decrease field radius
this.keyHandlers['0'] = this.keyHandlers['-'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Handle squares using multi-selection system
  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    var count = 0;
    
    selectedIds.forEach(function(squareId) {
      var square = ChakraApp.appState.getSquare(squareId);
      if (square && square.indicator) {
        ChakraApp.appState.updateSquare(squareId, { indicator: null });
        count++;
      }
    });
    
    if (count > 0) {
      self._showNotification('Removed indicators from ' + count + ' squares');
    } else {
      self._showNotification('No indicators to remove');
    }
  }
  // Check if a circle reference is selected
  else if (ChakraApp.appState.selectedCircleReferenceId) {
    var circleReferenceViewData = self._getCircleReferenceViewData(ChakraApp.appState.selectedCircleReferenceId);
    if (circleReferenceViewData && circleReferenceViewData.viewModel) {
      var oldRadius = circleReferenceViewData.viewModel.fieldRadius;
      circleReferenceViewData.viewModel.decreaseFieldRadius();
      self._showNotification('Field radius: ' + circleReferenceViewData.viewModel.fieldRadius + 'px (was ' + oldRadius + 'px)');
    }
    return;
  }

  // Handle circles using multi-selection system
  else if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    var count = 0;
    
    selectedIds.forEach(function(circleId) {
      var circle = ChakraApp.appState.getCircle(circleId);
      if (circle && circle.indicator) {
        ChakraApp.appState.updateCircle(circleId, { indicator: null });
        count++;
      }
    });
    
    if (count > 0) {
      self._showNotification('Removed indicators from ' + count + ' circles');
    } else {
      self._showNotification('No indicators to remove');
    }
  }
  // Fall back to circle
  else if (ChakraApp.appState.selectedCircleId) {
    var circleId = ChakraApp.appState.selectedCircleId;
    var circle = ChakraApp.appState.getCircle(circleId);

    if (circle && circle.indicator) {
      ChakraApp.appState.updateCircle(circleId, { indicator: null });
      self._showNotification('Circle indicator removed');
    } else if (circle && !circle.indicator) {
      self._showNotification('No circle indicator to remove');
    }
  }
};

this.keyHandlers['V'] = function(e) {
  // Must be ctrl/cmd + shift
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Priority: circles first, then squares
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 circles selected');
      return;
    }

    // Get all selected circles
    var circles = selectedIds.map(function(id) {
      return ChakraApp.appState.getCircle(id);
    }).filter(function(circle) {
      return circle !== null;
    });

    if (circles.length < 2) {
      self._showNotification('⚠️ Not enough valid circles found');
      return;
    }

    self._alignAndDistributeCirclesVertically(circles);
    self._showNotification('↕️ Aligned and distributed ' + circles.length + ' circles vertically');
  }
  // Fall back to squares if no circles selected
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 squares selected');
      return;
    }

    // Get all selected squares
    var squares = selectedIds.map(function(id) {
      return ChakraApp.appState.getSquare(id);
    }).filter(function(square) {
      return square !== null;
    });

    if (squares.length < 2) {
      self._showNotification('⚠️ Not enough valid squares found');
      return;
    }

    self._alignAndDistributeVertically(squares);
    self._showNotification('↕️ Aligned and distributed ' + squares.length + ' squares vertically');
  } else {
    self._showNotification('⚠️ Please select multiple circles or squares first');
  }
};

// Ctrl+Shift+H - Align and distribute horizontally
this.keyHandlers['H'] = function(e) {
  // Must be ctrl/cmd + shift
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Priority: circles first, then squares
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 circles selected');
      return;
    }

    // Get all selected circles
    var circles = selectedIds.map(function(id) {
      return ChakraApp.appState.getCircle(id);
    }).filter(function(circle) {
      return circle !== null;
    });

    if (circles.length < 2) {
      self._showNotification('⚠️ Not enough valid circles found');
      return;
    }

    self._alignAndDistributeCirclesHorizontally(circles);
    self._showNotification('↔️ Aligned and distributed ' + circles.length + ' circles horizontally');
  }
  // Fall back to squares if no circles selected
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 squares selected');
      return;
    }

    // Get all selected squares
    var squares = selectedIds.map(function(id) {
      return ChakraApp.appState.getSquare(id);
    }).filter(function(square) {
      return square !== null;
    });

    if (squares.length < 2) {
      self._showNotification('⚠️ Not enough valid squares found');
      return;
    }

    self._alignAndDistributeHorizontally(squares);
    self._showNotification('↔️ Aligned and distributed ' + squares.length + ' squares horizontally');
  } else {
    self._showNotification('⚠️ Please select multiple circles or squares first');
  }
};

this.keyHandlers['C'] = function(e) {
  // Must be ctrl/cmd + shift
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Priority: circles first, then squares
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 circles selected');
      return;
    }

    // Get all selected circles
    var circles = selectedIds.map(function(id) {
      return ChakraApp.appState.getCircle(id);
    }).filter(function(circle) {
      return circle !== null;
    });

    if (circles.length < 2) {
      self._showNotification('⚠️ Not enough valid circles found');
      return;
    }

    self._alignAndDistributeCirclesCircularly(circles);
    var shape = circles.length === 2 ? 'line' : circles.length === 3 ? 'triangle' : circles.length === 4 ? 'square' : 'circle';
    self._showNotification('⭕ Arranged ' + circles.length + ' circles in a ' + shape);
  }
  // Fall back to squares if no circles selected
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 squares selected');
      return;
    }

    // Get all selected squares
    var squares = selectedIds.map(function(id) {
      return ChakraApp.appState.getSquare(id);
    }).filter(function(square) {
      return square !== null;
    });

    if (squares.length < 2) {
      self._showNotification('⚠️ Not enough valid squares found');
      return;
    }

    self._alignAndDistributeCircularly(squares);
    var shape = squares.length === 2 ? 'line' : squares.length === 3 ? 'triangle' : squares.length === 4 ? 'square' : 'circle';
    self._showNotification('⭕ Arranged ' + squares.length + ' squares in a ' + shape);
  } else {
    self._showNotification('⚠️ Please select multiple circles or squares first');
  }
};

// Update the 'O' handler (Ctrl+Shift+O - Expand group)
this.keyHandlers['O'] = function(e) {
  // Must be ctrl/cmd + shift
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Priority: circles first, then squares
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 circles selected');
      return;
    }

    // Get all selected circles
    var circles = selectedIds.map(function(id) {
      return ChakraApp.appState.getCircle(id);
    }).filter(function(circle) {
      return circle !== null;
    });

    if (circles.length < 2) {
      self._showNotification('⚠️ Not enough valid circles found');
      return;
    }

    self._scaleCircleGroupDistances(circles, 1.2); // Expand by 20%
    self._showNotification('🔍 Expanded circle group spacing by 20%');
  }
  // Fall back to squares if no circles selected
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 squares selected');
      return;
    }

    // Get all selected squares
    var squares = selectedIds.map(function(id) {
      return ChakraApp.appState.getSquare(id);
    }).filter(function(square) {
      return square !== null;
    });

    if (squares.length < 2) {
      self._showNotification('⚠️ Not enough valid squares found');
      return;
    }

    self._scaleGroupDistances(squares, 1.2); // Expand by 20%
    self._showNotification('🔍 Expanded group spacing by 20%');
  } else {
    self._showNotification('⚠️ Please select multiple circles or squares first');
  }
};


// Ctrl+Shift+- - Contract group (scale distances inward)
this.keyHandlers['P'] = function(e) {
  // Must be ctrl/cmd + shift
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Priority: circles first, then squares
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.CircleMultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 circles selected');
      return;
    }

    // Get all selected circles
    var circles = selectedIds.map(function(id) {
      return ChakraApp.appState.getCircle(id);
    }).filter(function(circle) {
      return circle !== null;
    });

    if (circles.length < 2) {
      self._showNotification('⚠️ Not enough valid circles found');
      return;
    }

    self._scaleCircleGroupDistances(circles, 0.8); // Contract by 20%
    self._showNotification('🔎 Contracted circle group spacing by 20%');
  }
  // Fall back to squares if no circles selected
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var selectedIds = ChakraApp.MultiSelectionManager.getAllSelectedIds();
    if (selectedIds.length < 2) {
      self._showNotification('⚠️ Need at least 2 squares selected');
      return;
    }

    // Get all selected squares
    var squares = selectedIds.map(function(id) {
      return ChakraApp.appState.getSquare(id);
    }).filter(function(square) {
      return square !== null;
    });

    if (squares.length < 2) {
      self._showNotification('⚠️ Not enough valid squares found');
      return;
    }

    self._scaleGroupDistances(squares, 0.8); // Contract by 20%
    self._showNotification('🔎 Contracted group spacing by 20%');
  } else {
    self._showNotification('⚠️ Please select multiple circles or squares first');
  }
};

    // Escape key - deselect current item
this.keyHandlers['Escape'] = function(e) {
  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Clear circle multi-selection if active
  if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    ChakraApp.CircleMultiSelectionManager.clearSelection();
  }
  // Clear square multi-selection if active
  else if (ChakraApp.MultiSelectionManager.hasSelection()) {
    ChakraApp.MultiSelectionManager.clearSelection();
  }
  // Then deselect circle reference if selected
  else if (ChakraApp.appState.selectedCircleReferenceId) {
    ChakraApp.appState.deselectCircleReference();
  }
  // Then deselect circle if selected
  else if (ChakraApp.appState.selectedCircleId) {
    ChakraApp.appState.deselectCircle();
  }
};

    // Ctrl+C - Copy selected items (squares or circles)
this.keyHandlers['c'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    // Copy the selected squares
    var success = ChakraApp.ClipboardManager.copySelectedSquares();

    // Provide visual feedback
    if (success) {
      self._showNotification('✓ Copied ' + ChakraApp.ClipboardManager.getSquareCount() + ' squares');
    }
  } else if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    // Copy the selected circles
    var success = ChakraApp.ClipboardManager.copySelectedCircles();

    // Provide visual feedback
    if (success) {
      self._showNotification('✓ Copied ' + ChakraApp.CircleMultiSelectionManager.getSelectionCount() + ' circles');
    }
  } else if (ChakraApp.appState.selectedCircleId) {
    // Copy the selected circle
    var success = ChakraApp.ClipboardManager.copySelectedCircle();

    // Provide visual feedback
    if (success) {
      var circleData = ChakraApp.ClipboardManager.circleClipboard[0];
      var squareCount = circleData.squares ? circleData.squares.length : 0;
      self._showNotification('✓ Copied circle with ' + squareCount + ' squares');
    }
  } else {
    self._showNotification('⚠️ Please select a circle or square first');
  }
};

    // Ctrl+X - Cut selected items (squares or circles)
this.keyHandlers['x'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Priority: circles first, then squares
  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    // Cut the selected squares
    var success = ChakraApp.ClipboardManager.cutSelectedSquares();

    // Provide visual feedback
    if (success) {
      self._showNotification('✂️ Cut ' + ChakraApp.ClipboardManager.getSquareCount() + ' squares');
    }
  } else if (ChakraApp.CircleMultiSelectionManager && ChakraApp.CircleMultiSelectionManager.hasSelection()) {
    // Cut the selected circles
    var success = ChakraApp.ClipboardManager.cutSelectedCircles();

    // Provide visual feedback
    if (success) {
      self._showNotification('✂️ Cut ' + ChakraApp.CircleMultiSelectionManager.getSelectionCount() + ' circles');
    }
  } else if (ChakraApp.appState.selectedCircleId) {
    // Cut the selected circle
    var success = ChakraApp.ClipboardManager.cutSelectedCircle();

    // Provide visual feedback
    if (success) {
      self._showNotification('✂️ Cut circle');
    }
  } else {
    self._showNotification('⚠️ Please select a circle or square first');
  }
};

    // Ctrl+V - Paste items (squares or circles)
this.keyHandlers['v'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Check what's available to paste
  var hasSquares = ChakraApp.ClipboardManager.hasSquares();
  var hasCircles = ChakraApp.ClipboardManager.hasCircles();

  if (hasSquares && ChakraApp.appState.selectedCircleId) {
    // Paste squares to the selected circle
    var success = ChakraApp.ClipboardManager.pasteSquares();

    // Provide visual feedback
    if (success) {
      self._showNotification('📋 Pasted ' + ChakraApp.ClipboardManager.getSquareCount() + ' squares');
    }
  } else if (hasCircles) {
    // FIXED: Paste circles considering the currently selected left panel
    var success = self._pasteCirclesToSelectedPanel();

    // Provide visual feedback
    if (success) {
      var circleCount = ChakraApp.ClipboardManager.getCircleCount();
      self._showNotification('📋 Pasted ' + circleCount + ' circle' + (circleCount === 1 ? '' : 's'));
    }
  } else if (hasSquares && !ChakraApp.appState.selectedCircleId) {
    self._showNotification('⚠️ Please select a circle to paste squares');
  } else {
    self._showNotification('⚠️ Clipboard is empty');
  }
};

ChakraApp.KeyboardController.prototype._pasteCirclesToSelectedPanel = function() {
  // Get the currently selected left panel
  var selectedPanelId = ChakraApp.appState.getSelectedLeftPanelId();
  
  if (selectedPanelId === null) {
    this._showNotification('⚠️ No panel selected');
    return false;
  }

  // Get circles from clipboard
  var circleClipboard = ChakraApp.ClipboardManager.circleClipboard;
  if (!circleClipboard || circleClipboard.length === 0) {
    return false;
  }

  var pastedCount = 0;
  var self = this;

  // For each circle in clipboard
  circleClipboard.forEach(function(circleData) {
    var circleInfo = circleData.circle || circleData;
    if (!circleInfo || !circleInfo.circleType) {
      console.warn('Invalid circle data in clipboard:', circleData);
      return; // Skip this item
    }
    
    var originalCircleType = circleInfo.circleType;
    
    // Get the panel's current selections for this circle type
    var panelSelections = ChakraApp.appState.getLeftPanelSelections(selectedPanelId);
    var typeSelections = panelSelections[originalCircleType];
    
    var targetDocumentId = null;
    
    // Try to use an existing selected document in the target panel
    if (typeSelections && typeSelections.list1) {
      targetDocumentId = typeSelections.list1;
    } else if (typeSelections && typeSelections.list2) {
      targetDocumentId = typeSelections.list2;
    }
    
    // If no document is selected in the target panel for this circle type, create one
    if (!targetDocumentId) {
      var newDocName = ChakraApp.appState.generateDateBasedDocumentName(originalCircleType, 'list1');
      
      var newDoc = ChakraApp.appState.addDocument({
        name: newDocName,
        circleType: originalCircleType,
        listType: 'list1'
      });
      
      targetDocumentId = newDoc.id;
      
      // Select this new document in the target panel
      ChakraApp.appState.selectDocumentForPanel(targetDocumentId, originalCircleType, 'list1', selectedPanelId);
    }
    
    // Create the new circle with the target document
    var newCircleData = Object.assign({}, circleInfo);
    newCircleData.documentId = targetDocumentId;
    
    // Generate new ID to avoid conflicts
    delete newCircleData.id;
    
    // Offset position slightly so it doesn't overlap exactly
    newCircleData.x = (newCircleData.x || 0) + 20;
    newCircleData.y = (newCircleData.y || 0) + 20;
    
    // Create the circle in the target panel
    var newCircle = ChakraApp.appState.addCircle(newCircleData, selectedPanelId);
    
    if (newCircle && circleData.squares && circleData.squares.length > 0) {
      // Also paste the squares if they exist
      circleData.squares.forEach(function(squareData) {
        var newSquareData = Object.assign({}, squareData);
        newSquareData.circleId = newCircle.id;
        
        // Generate new ID to avoid conflicts
        delete newSquareData.id;
        
        // Offset square position slightly
        newSquareData.x = (newSquareData.x || 0) + 20;
        newSquareData.y = (newSquareData.y || 0) + 20;
        
        ChakraApp.appState.addSquare(newSquareData);
      });
    }
    
    pastedCount++;
  });

  // Update the view for the target panel
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    setTimeout(function() {
      ChakraApp.app.viewManager.renderCirclesForLeftPanel(selectedPanelId);
    }, 50);
  }

  return pastedCount > 0;
};

    // Ctrl+B - Toggle bold for selected squares
this.keyHandlers['b'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // Use multi-selection system for bold toggle
  if (ChakraApp.MultiSelectionManager.hasSelection()) {
    var count = ChakraApp.MultiSelectionManager.toggleBoldForAll();
    self._showNotification('Changed ' + count + ' squares');
  }
};

    // Ctrl+A - Select all squares in the current circle
this.keyHandlers['a'] = function(e) {
  // Must be ctrl/cmd key
  if (!(e.ctrlKey || e.metaKey)) return;

  // Don't handle if we're editing text
  if (self._isEditingText()) return;

  e.preventDefault();

  // UPDATED: Check if we have a circle selected first (old behavior)
  if (ChakraApp.appState.selectedCircleId) {
    // Get all visible squares for this circle
    var circleId = ChakraApp.appState.selectedCircleId;
    var squares = ChakraApp.appState.getSquaresForCircle(circleId).filter(function(square) {
      return square.visible;
    });

    // Clear any existing multi-selection first
    if (ChakraApp.MultiSelectionManager.hasSelection()) {
      ChakraApp.MultiSelectionManager.clearSelection();
    }

    if (squares.length > 0) {
      // Add all squares to multi-selection
      squares.forEach(function(square) {
        ChakraApp.MultiSelectionManager.addToSelection(square.id);
      });
      
      self._showNotification('Selected ' + squares.length + ' squares');
    }
  } 
  // NEW: If no circle is selected, select all circles in the selected left panel
  else {
    var selectedPanelId = ChakraApp.appState.getSelectedLeftPanelId();
    
    if (selectedPanelId === null) {
      self._showNotification('⚠️ No panel selected');
      return;
    }
    
    // Get all circles that should be visible in the selected panel
    var circlesInPanel = ChakraApp.appState.getCirclesInSelectedLeftPanel();
    
    if (circlesInPanel.length === 0) {
      self._showNotification('⚠️ No circles in selected panel');
      return;
    }
    
    // Clear any existing circle multi-selection first
    if (ChakraApp.CircleMultiSelectionManager.hasSelection()) {
      ChakraApp.CircleMultiSelectionManager.clearSelection();
    }
    
    // Add all circles in the panel to multi-selection
    circlesInPanel.forEach(function(circle) {
      ChakraApp.CircleMultiSelectionManager.addToSelection(circle.id);
    });
    
    self._showNotification('Selected ' + circlesInPanel.length + ' circles in panel ' + selectedPanelId);
  }
};
  };
  
  // Helper method to get circle reference view data
  ChakraApp.KeyboardController.prototype._getCircleReferenceViewData = function(circleReferenceId) {
    // Access the circle references controller to get the view model
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.circleReferences) {
      return ChakraApp.app.controllers.circleReferences.circleReferenceViews.get(circleReferenceId);
    }
    return null;
  };
  
  // Handle keydown events
  ChakraApp.KeyboardController.prototype._handleKeyDown = function(e) {
    var handler = this.keyHandlers[e.key];
    
    if (handler) {
      handler(e);
    }
  };
  
  // Check if currently editing text
  ChakraApp.KeyboardController.prototype._isEditingText = function() {
    var activeElement = document.activeElement;
    return activeElement && (
      activeElement.isContentEditable || 
      activeElement.tagName.toLowerCase() === 'input' || 
      activeElement.tagName.toLowerCase() === 'textarea'
    );
  };
  
  // Show delete confirmation dialog
  ChakraApp.KeyboardController.prototype._showDeleteDialog = function(onConfirm) {
    var dialogOverlay = document.getElementById('dialog-overlay');
    if (!dialogOverlay) {
      // If dialog doesn't exist, just confirm directly
      onConfirm();
      return;
    }
    
    dialogOverlay.style.display = 'flex';
    
    var dialogConfirm = document.getElementById('dialog-confirm');
    var dialogCancel = document.getElementById('dialog-cancel');
    
    var confirmHandler = function() {
      onConfirm();
      dialogOverlay.style.display = 'none';
      dialogConfirm.removeEventListener('click', confirmHandler);
      dialogCancel.removeEventListener('click', cancelHandler);
      document.removeEventListener('keydown', keyHandler);
    };
    
    var cancelHandler = function() {
      dialogOverlay.style.display = 'none';
      dialogConfirm.removeEventListener('click', confirmHandler);
      dialogCancel.removeEventListener('click', cancelHandler);
      document.removeEventListener('keydown', keyHandler);
    };
    
    // Handle keyboard events
    var keyHandler = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmHandler();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelHandler();
      }
    };
    
    // Add event listeners
    dialogConfirm.addEventListener('click', confirmHandler);
    dialogCancel.addEventListener('click', cancelHandler);
    document.addEventListener('keydown', keyHandler);
  };

ChakraApp.KeyboardController.prototype._alignAndDistributeVertically = function(squares) {
  if (squares.length < 2) return;

  // Calculate the midpoint X position
  var totalX = squares.reduce(function(sum, square) {
    return sum + square.x;
  }, 0);
  var midpointX = Math.round(totalX / squares.length);

  // Sort squares by Y position to maintain relative order
  var sortedSquares = squares.slice().sort(function(a, b) {
    return a.y - b.y;
  });

  // Calculate Y distribution
  var minY = sortedSquares[0].y;
  var maxY = sortedSquares[sortedSquares.length - 1].y;
  var yStep = sortedSquares.length > 1 ? (maxY - minY) / (sortedSquares.length - 1) : 0;

  // Update positions
  sortedSquares.forEach(function(square, index) {
    var newY = sortedSquares.length === 1 ? square.y : Math.round(minY + (yStep * index));
    
    ChakraApp.appState.updateSquare(square.id, {
      x: midpointX,
      y: newY
    });
  });

  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

/**
 * Align and distribute squares horizontally
 * Sets all squares to the same Y position (midpoint) and distributes them evenly by X
 * @private
 * @param {Array} squares - Array of square objects
 */
ChakraApp.KeyboardController.prototype._alignAndDistributeHorizontally = function(squares) {
  if (squares.length < 2) return;

  // Calculate the midpoint Y position
  var totalY = squares.reduce(function(sum, square) {
    return sum + square.y;
  }, 0);
  var midpointY = Math.round(totalY / squares.length);

  // Sort squares by X position to maintain relative order
  var sortedSquares = squares.slice().sort(function(a, b) {
    return a.x - b.x;
  });

  // Calculate X distribution
  var minX = sortedSquares[0].x;
  var maxX = sortedSquares[sortedSquares.length - 1].x;
  var xStep = sortedSquares.length > 1 ? (maxX - minX) / (sortedSquares.length - 1) : 0;

  // Update positions
  sortedSquares.forEach(function(square, index) {
    var newX = sortedSquares.length === 1 ? square.x : Math.round(minX + (xStep * index));
    
    ChakraApp.appState.updateSquare(square.id, {
      x: newX,
      y: midpointY
    });
  });

  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

ChakraApp.KeyboardController.prototype._alignAndDistributeCircularly = function(squares) {
  if (squares.length < 2) return;

  // Check if squares are already in a circular arrangement
  // by checking if they're roughly equidistant from their geometric center
  var isAlreadyCircular = this._isCircularArrangement(squares);
  
  var centerX, centerY, radius;
  
  if (isAlreadyCircular) {
    // If already circular, maintain the existing center and radius
    var existingCenter = this._getCircularCenter(squares);
    centerX = existingCenter.x;
    centerY = existingCenter.y;
    radius = existingCenter.radius;
  } else {
    // Calculate the geometric center point (midpoint of bounding box)
    var minX = Math.min.apply(Math, squares.map(function(s) { return s.x; }));
    var maxX = Math.max.apply(Math, squares.map(function(s) { return s.x; }));
    var minY = Math.min.apply(Math, squares.map(function(s) { return s.y; }));
    var maxY = Math.max.apply(Math, squares.map(function(s) { return s.y; }));
    
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;

    // Calculate radius based on the current spread of squares
    var maxDistance = Math.max.apply(Math, squares.map(function(square) {
      var dx = square.x - centerX;
      var dy = square.y - centerY;
      return Math.sqrt(dx * dx + dy * dy);
    }));
    
    // Ensure minimum radius for readability (at least 50 pixels)
    radius = Math.max(maxDistance, 50);
  }
  
  // For 2 squares, place them horizontally opposite each other
  if (squares.length === 2) {
    ChakraApp.appState.updateSquare(squares[0].id, {
      x: Math.round(centerX - radius),
      y: Math.round(centerY)
    });
    
    ChakraApp.appState.updateSquare(squares[1].id, {
      x: Math.round(centerX + radius),
      y: Math.round(centerY)
    });
  } else {
    // For 3+ squares, arrange in a circle
    // Calculate angle step between squares (360 degrees / number of squares)
    var angleStep = (2 * Math.PI) / squares.length;
    
    // Start at the top (90 degrees) for a more natural arrangement
    var startAngle = -Math.PI / 2;
    
    // Sort squares by their current angle from center to maintain relative positions
    var squaresWithAngles = squares.map(function(square) {
      var dx = square.x - centerX;
      var dy = square.y - centerY;
      var currentAngle = Math.atan2(dy, dx);
      return {
        square: square,
        angle: currentAngle
      };
    });
    
    // Sort by current angle to preserve relative positioning
    squaresWithAngles.sort(function(a, b) {
      return a.angle - b.angle;
    });
    
    // Position squares around the circle
    squaresWithAngles.forEach(function(item, index) {
      var angle = startAngle + (angleStep * index);
      var newX = Math.round(centerX + Math.cos(angle) * radius);
      var newY = Math.round(centerY + Math.sin(angle) * radius);
      
      ChakraApp.appState.updateSquare(item.square.id, {
        x: newX,
        y: newY
      });
    });
  }

  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};

/**
 * Check if squares are already arranged in a roughly circular pattern
 * @private
 * @param {Array} squares - Array of square objects
 * @returns {boolean} True if squares appear to be in circular arrangement
 */
ChakraApp.KeyboardController.prototype._isCircularArrangement = function(squares) {
  if (squares.length < 3) return false;
  
  var center = this._getCircularCenter(squares);
  var distances = squares.map(function(square) {
    var dx = square.x - center.x;
    var dy = square.y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
  });
  
  var avgDistance = distances.reduce(function(sum, d) { return sum + d; }, 0) / distances.length;
  
  // Check if all squares are roughly the same distance from center (within 10% tolerance)
  var tolerance = avgDistance * 0.1;
  return distances.every(function(distance) {
    return Math.abs(distance - avgDistance) <= tolerance;
  });
};

/**
 * Get the center point and radius of a circular arrangement
 * @private
 * @param {Array} squares - Array of square objects
 * @returns {Object} Object with x, y, and radius properties
 */
ChakraApp.KeyboardController.prototype._getCircularCenter = function(squares) {
  // Use the centroid (average position) as the center
  var totalX = squares.reduce(function(sum, square) { return sum + square.x; }, 0);
  var totalY = squares.reduce(function(sum, square) { return sum + square.y; }, 0);
  
  var centerX = totalX / squares.length;
  var centerY = totalY / squares.length;
  
  // Calculate average radius
  var totalDistance = squares.reduce(function(sum, square) {
    var dx = square.x - centerX;
    var dy = square.y - centerY;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  
  var radius = totalDistance / squares.length;
  
  return {
    x: centerX,
    y: centerY,
    radius: radius
  };
};

ChakraApp.KeyboardController.prototype._scaleGroupDistances = function(squares, scaleFactor) {
  if (squares.length < 2) return;

  // Calculate the centroid (center of mass) of the group
  var totalX = squares.reduce(function(sum, square) { return sum + square.x; }, 0);
  var totalY = squares.reduce(function(sum, square) { return sum + square.y; }, 0);
  
  var centerX = totalX / squares.length;
  var centerY = totalY / squares.length;
  
  // Scale each square's distance from the center
  squares.forEach(function(square) {
    // Calculate current distance vector from center
    var dx = square.x - centerX;
    var dy = square.y - centerY;
    
    // Scale the distance vector
    var scaledDx = dx * scaleFactor;
    var scaledDy = dy * scaleFactor;
    
    // Calculate new position
    var newX = Math.round(centerX + scaledDx);
    var newY = Math.round(centerY + scaledDy);
    
    // Ensure the new position is within reasonable bounds
    // (optional: add bounds checking here if needed)
    
    ChakraApp.appState.updateSquare(square.id, {
      x: newX,
      y: newY
    });
  });
  
  // Save state after all updates
  ChakraApp.appState.saveToStorageNow();
};
  
  // Helper method for notifications
  ChakraApp.KeyboardController.prototype._showNotification = function(message) {
    // Create or get the notification element
    var notification = document.getElementById('keyboard-notification');

    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'keyboard-notification';
      notification.className = 'keyboard-notification';
      document.body.appendChild(notification);
    }

    // Set the message and show the notification
    notification.textContent = message;
    notification.classList.add('visible');

    // Hide the notification after a delay
    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(function() {
      notification.classList.remove('visible');
    }, 2000);
  };
  
  // Clean up
  ChakraApp.KeyboardController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Remove event listeners
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    
    // Clear key handlers
    this.keyHandlers = {};
    
    // Clear any pending notification timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
