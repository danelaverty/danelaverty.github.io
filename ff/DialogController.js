// src/controllers/DialogController.js
(function(ChakraApp) {
  /**
   * Controls dialog boxes and confirmations
   */
  ChakraApp.DialogController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.dialogOverlay = null;
    this.dialogMessage = null;
    this.dialogConfirm = null;
    this.dialogCancel = null;
    
    // Event handlers
    this.confirmHandler = null;
    this.cancelHandler = null;
    this.keyHandler = null;
  };
  
  // Inherit from BaseController
  ChakraApp.DialogController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.DialogController.prototype.constructor = ChakraApp.DialogController;
  
  // Initialize
  ChakraApp.DialogController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Get dialog overlay element
    this.dialogOverlay = document.getElementById('dialog-overlay');
    
    // Get dialog elements
    if (this.dialogOverlay) {
      this.dialogMessage = document.getElementById('dialog-message');
      this.dialogConfirm = document.getElementById('dialog-confirm');
      this.dialogCancel = document.getElementById('dialog-cancel');
    } else {
      // Create dialog overlay if it doesn't exist
      this._createDialogOverlay();
    }
  };
  
  /**
   * Create dialog overlay
   * @private
   */
  ChakraApp.DialogController.prototype._createDialogOverlay = function() {
    // Create dialog overlay
    this.dialogOverlay = document.createElement('div');
    this.dialogOverlay.id = 'dialog-overlay';
    this.dialogOverlay.className = 'dialog-overlay';
    this.dialogOverlay.style.position = 'fixed';
    this.dialogOverlay.style.top = '0';
    this.dialogOverlay.style.left = '0';
    this.dialogOverlay.style.width = '100%';
    this.dialogOverlay.style.height = '100%';
    this.dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.dialogOverlay.style.display = 'none';
    this.dialogOverlay.style.zIndex = '1000';
    this.dialogOverlay.style.justifyContent = 'center';
    this.dialogOverlay.style.alignItems = 'center';
    
    // Create dialog box
    var dialogBox = document.createElement('div');
    dialogBox.id = 'dialog-box';
    dialogBox.className = 'dialog-box';
    dialogBox.style.backgroundColor = '#222';
    dialogBox.style.padding = '20px';
    dialogBox.style.borderRadius = '5px';
    dialogBox.style.color = 'white';
    dialogBox.style.textAlign = 'center';
    
    // Create dialog message
    this.dialogMessage = document.createElement('div');
    this.dialogMessage.id = 'dialog-message';
    this.dialogMessage.className = 'dialog-message';
    this.dialogMessage.textContent = 'Are you sure you want to delete this item?';
    
    // Create dialog buttons container
    var dialogButtons = document.createElement('div');
    dialogButtons.id = 'dialog-buttons';
    dialogButtons.className = 'dialog-buttons';
    dialogButtons.style.marginTop = '15px';
    dialogButtons.style.display = 'flex';
    dialogButtons.style.justifyContent = 'center';
    dialogButtons.style.gap = '10px';
    
    // Create confirm button
    this.dialogConfirm = document.createElement('button');
    this.dialogConfirm.id = 'dialog-confirm';
    this.dialogConfirm.className = 'dialog-button';
    this.dialogConfirm.textContent = 'Delete';
    this.dialogConfirm.style.padding = '5px 15px';
    this.dialogConfirm.style.border = 'none';
    this.dialogConfirm.style.borderRadius = '3px';
    this.dialogConfirm.style.cursor = 'pointer';
    this.dialogConfirm.style.backgroundColor = '#f44336';
    this.dialogConfirm.style.color = 'white';
    
    // Create cancel button
    this.dialogCancel = document.createElement('button');
    this.dialogCancel.id = 'dialog-cancel';
    this.dialogCancel.className = 'dialog-button';
    this.dialogCancel.textContent = 'Cancel';
    this.dialogCancel.style.padding = '5px 15px';
    this.dialogCancel.style.border = 'none';
    this.dialogCancel.style.borderRadius = '3px';
    this.dialogCancel.style.cursor = 'pointer';
    this.dialogCancel.style.backgroundColor = '#555';
    this.dialogCancel.style.color = 'white';
    
    // Append elements
    dialogButtons.appendChild(this.dialogConfirm);
    dialogButtons.appendChild(this.dialogCancel);
    
    dialogBox.appendChild(this.dialogMessage);
    dialogBox.appendChild(dialogButtons);
    
    this.dialogOverlay.appendChild(dialogBox);
    
    // Add to document
    document.body.appendChild(this.dialogOverlay);
  };
  
  /**
   * Show confirmation dialog
   * @param {string} message - Dialog message
   * @param {Function} onConfirm - Callback on confirm
   * @param {Function} [onCancel] - Optional callback on cancel
   */
  ChakraApp.DialogController.prototype.showConfirmDialog = function(message, onConfirm, onCancel) {
    if (!this.dialogOverlay) return;
    
    // Set message if provided
    if (message && this.dialogMessage) {
      this.dialogMessage.textContent = message;
    }
    
    // Show dialog
    this.dialogOverlay.style.display = 'flex';
    
    // Clean up existing handlers
    this._cleanupHandlers();
    
    // Create new handlers
    var self = this;
    this.confirmHandler = function() {
      if (onConfirm) onConfirm();
      self.dialogOverlay.style.display = 'none';
      self._cleanupHandlers();
    };
    
    this.cancelHandler = function() {
      if (onCancel) onCancel();
      self.dialogOverlay.style.display = 'none';
      self._cleanupHandlers();
    };
    
    // Handle keyboard events
    this.keyHandler = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        self.confirmHandler();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        self.cancelHandler();
      }
    };
    
    // Add event listeners
    this.dialogConfirm.addEventListener('click', this.confirmHandler);
    this.dialogCancel.addEventListener('click', this.cancelHandler);
    document.addEventListener('keydown', this.keyHandler);
  };
  
  /**
   * Clean up event handlers
   * @private
   */
  ChakraApp.DialogController.prototype._cleanupHandlers = function() {
    if (this.confirmHandler && this.dialogConfirm) {
      this.dialogConfirm.removeEventListener('click', this.confirmHandler);
    }
    
    if (this.cancelHandler && this.dialogCancel) {
      this.dialogCancel.removeEventListener('click', this.cancelHandler);
    }
    
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    
    this.confirmHandler = null;
    this.cancelHandler = null;
    this.keyHandler = null;
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.DialogController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up event handlers
    this._cleanupHandlers();
  };
  
})(window.ChakraApp = window.ChakraApp || {});
