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
    this.keyHandlers['Delete'] = function(e) {
      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Check if there is a multi-selection
      if (ChakraApp.MultiSelectionManager.hasSelection()) {
        self._showDeleteDialog(function() {
          // Delete all selected squares
          var count = ChakraApp.MultiSelectionManager.deleteAllSelected();
          self._showNotification(`Deleted ${count} squares`);
        });
      }
      // Prioritize square deletion if a square is selected
      else if (ChakraApp.appState.selectedSquareId) {
        self._showDeleteDialog(function() {
          ChakraApp.appState.removeSquare(ChakraApp.appState.selectedSquareId);
        });
      }
      else if (ChakraApp.appState.selectedCircleReferenceId) {
	      ChakraApp.appState.removeCircleReference(ChakraApp.appState.selectedCircleReferenceId);
	      return;
      }
      // If only a circle is selected
      else if (ChakraApp.appState.selectedCircleId) {
        self._showDeleteDialog(function() {
          ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
        });
      }
    };

       this.keyHandlers['='] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Must have a square selected
      if (ChakraApp.appState.selectedSquareId) {
        var squareId = ChakraApp.appState.selectedSquareId;
        var square = ChakraApp.appState.getSquare(squareId);

        if (square) {
          // Get current indicator index
          var currentIndex = -1;
          if (square.indicator) {
            ChakraApp.Config.indicatorEmojis.forEach(function(config, index) {
              if (config.id === square.indicator) {
                currentIndex = index;
              }
            });
          }

          // Get next indicator
          var nextIndex = (currentIndex + 1) % ChakraApp.Config.indicatorEmojis.length;
          var nextIndicator = ChakraApp.Config.indicatorEmojis[nextIndex];

          // Update square with new indicator
          ChakraApp.appState.updateSquare(squareId, { indicator: nextIndicator.id });

          // Show notification
          self._showNotification('Indicator: ' + nextIndicator.emoji + ' ' + nextIndicator.name);
        }
      }
    };

    // Ctrl+- - Remove indicator emoji
    this.keyHandlers['-'] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Must have a square selected
      if (ChakraApp.appState.selectedSquareId) {
        var squareId = ChakraApp.appState.selectedSquareId;
        var square = ChakraApp.appState.getSquare(squareId);

        if (square && square.indicator) {
          // Remove indicator
          ChakraApp.appState.updateSquare(squareId, { indicator: null });

          // Show notification
          self._showNotification('Indicator removed');
        } else if (square && !square.indicator) {
          // Show notification that there's no indicator to remove
          self._showNotification('No indicator to remove');
        }
      }
    };

    // Escape key - deselect current item
    this.keyHandlers['Escape'] = function(e) {
      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Clear multi-selection if active
      if (ChakraApp.MultiSelectionManager.hasSelection()) {
        ChakraApp.MultiSelectionManager.clearSelection();
      }

      // Deselect square first if selected
      if (ChakraApp.appState.selectedSquareId) {
        ChakraApp.appState.deselectSquare();
      }
      // Then deselect circle if selected
      else if (ChakraApp.appState.selectedCircleId) {
        ChakraApp.appState.deselectCircle();
      }
    };

    // Ctrl+C - Copy selected squares
    this.keyHandlers['c'] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Must have a square selected
      if (ChakraApp.appState.selectedSquareId) {
        // Copy the selected squares
        var success = ChakraApp.ClipboardManager.copySelectedSquares();

        // Provide visual feedback
        if (success) {
          self._showNotification('✓ Copied ' + ChakraApp.ClipboardManager.getSquareCount() + ' squares');
        }
      }
    };

    // Ctrl+X - Cut selected squares
    this.keyHandlers['x'] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Must have a square selected
      if (ChakraApp.appState.selectedSquareId) {
        // Cut the selected squares
        var success = ChakraApp.ClipboardManager.cutSelectedSquares();

        // Provide visual feedback
        if (success) {
          self._showNotification('✂️ Cut ' + ChakraApp.ClipboardManager.getSquareCount() + ' squares');
        }
      }
    };

    // Ctrl+V - Paste squares
    this.keyHandlers['v'] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Must have a circle selected and squares in clipboard
      if (ChakraApp.appState.selectedCircleId && ChakraApp.ClipboardManager.hasSquares()) {
        // Paste the squares
        var success = ChakraApp.ClipboardManager.pasteSquares();

        // Provide visual feedback
        if (success) {
          self._showNotification('📋 Pasted ' + ChakraApp.ClipboardManager.getSquareCount() + ' squares');
        }
      } else if (!ChakraApp.appState.selectedCircleId) {
        self._showNotification('⚠️ Please select a circle first');
      } else if (!ChakraApp.ClipboardManager.hasSquares()) {
        self._showNotification('⚠️ Clipboard is empty');
      }
    };

    // Ctrl+B - Toggle bold for selected squares
    this.keyHandlers['b'] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Check if there is a multi-selection
      if (ChakraApp.MultiSelectionManager.hasSelection()) {
        // Toggle bold for all selected squares
        var count = ChakraApp.MultiSelectionManager.toggleBoldForAll();
        self._showNotification(`Changed ${count} squares`);
      }
      // Single square case
      else if (ChakraApp.appState.selectedSquareId) {
        var squareId = ChakraApp.appState.selectedSquareId;
        var square = ChakraApp.appState.getSquare(squareId);

        if (square) {
          // Toggle bold state
          ChakraApp.appState.updateSquare(squareId, { isBold: !square.isBold });
        }
      }
    };

    // Ctrl+A - Select all squares in the current circle
    this.keyHandlers['a'] = function(e) {
      // Must be ctrl/cmd key
      if (!(e.ctrlKey || e.metaKey)) return;

      // Don't handle if we're editing text
      if (self._isEditingText()) return;

      e.preventDefault();

      // Must have a circle selected
      if (ChakraApp.appState.selectedCircleId) {
        // Get all visible squares for this circle
        var circleId = ChakraApp.appState.selectedCircleId;
        var squares = ChakraApp.appState.getSquaresForCircle(circleId).filter(function(square) {
          return square.visible;
        });

        // Select the first square as primary
        if (squares.length > 0) {
          // Select the first square
          ChakraApp.appState.selectSquare(squares[0].id);
          
          // Select all other squares as secondary
          if (squares.length > 1) {
            var secondaryIds = squares.slice(1).map(function(square) {
              return square.id;
            });
            
            // Manually set selection (skipping the connection logic)
            ChakraApp.MultiSelectionManager.primarySquareId = squares[0].id;
            ChakraApp.MultiSelectionManager.selectedSquareIds = secondaryIds;
            ChakraApp.MultiSelectionManager._applyMultiSelectedClass();
            
            // Publish selection event
            ChakraApp.EventBus.publish('SQUARES_MULTI_SELECTED', {
              primarySquareId: squares[0].id,
              connectedSquareIds: secondaryIds
            });
            
            self._showNotification(`Selected ${squares.length} squares`);
          }
        }
      }
    };
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
