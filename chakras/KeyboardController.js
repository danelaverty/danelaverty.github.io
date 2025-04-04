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

		  // Prioritize square deletion if a square is selected
		  if (ChakraApp.appState.selectedSquareId) {
			  self._showDeleteDialog(function() {
				  // If there are multi-selected squares, delete them all
				  if (ChakraApp.multiSelectedSquares && ChakraApp.multiSelectedSquares.length > 0) {
					  // First delete the primary selected square
					  ChakraApp.appState.removeSquare(ChakraApp.appState.selectedSquareId);

					  // Then delete all multi-selected squares
					  ChakraApp.multiSelectedSquares.sort().reverse().forEach(function(squareId) {
						  ChakraApp.appState.removeSquare(squareId);
					  });

					  // Clear the multi-selected squares array
					  ChakraApp.multiSelectedSquares = [];
				  } else {
					  // Just delete the selected square
					  ChakraApp.appState.removeSquare(ChakraApp.appState.selectedSquareId);
				  }
			  });
		  }
		  // If only a circle is selected
		  else if (ChakraApp.appState.selectedCircleId) {
			  self._showDeleteDialog(function() {
				  ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
			  });
		  }
	  };

	  // Escape key - deselect current item
	  this.keyHandlers['Escape'] = function(e) {
		  // Don't handle if we're editing text
		  if (self._isEditingText()) return;

		  e.preventDefault();

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

	  this.keyHandlers['b'] = function(e) {
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
				  // Toggle bold state
				  ChakraApp.appState.updateSquare(squareId, { isBold: !square.isBold });

				  // Provide visual feedback
				  //self._showNotification('Font style ' + (square.isBold ? 'normal' : 'bold'));

				  // Also update any multi-selected squares
				  if (ChakraApp.multiSelectedSquares && ChakraApp.multiSelectedSquares.length > 0) {
					  ChakraApp.multiSelectedSquares.forEach(function(multiSquareId) {
						  var multiSquare = ChakraApp.appState.getSquare(multiSquareId);
						  if (multiSquare) {
							  ChakraApp.appState.updateSquare(multiSquareId, { isBold: !square.isBold });
						  }
					  });
				  }
			  }
		  }
	  };

	  // Add a helper method for notifications
	  this._showNotification = function(message) {
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
  };
  
})(window.ChakraApp = window.ChakraApp || {});
