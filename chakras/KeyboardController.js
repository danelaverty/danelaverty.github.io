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
          ChakraApp.appState.removeSquare(ChakraApp.appState.selectedSquareId);
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
