// src/controllers/NotificationController.js
(function(ChakraApp) {
  /**
   * Controls notifications and status indicators
   */
  ChakraApp.NotificationController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.clipboardStatus = null;
    this.notificationElement = null;
    this.multiSelectionCounter = null;
    
    // Timeouts
    this.clipboardStatusTimeout = null;
    this.notificationTimeout = null;
    
    // Event subscriptions
    this.clipboardUpdatedSubscription = null;
    this.clipboardPastedSubscription = null;
    this.multiSelectSubscription = null;
    this.multiDeselectSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.NotificationController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.NotificationController.prototype.constructor = ChakraApp.NotificationController;
  
  // Initialize
  ChakraApp.NotificationController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Create clipboard status element
    this._setupClipboardUI();
    
    // Setup multi-selection counter
    this._setupMultiSelectionListeners();
  };
  
  /**
   * Set up clipboard UI
   * @private
   */
  ChakraApp.NotificationController.prototype._setupClipboardUI = function() {
    // Create clipboard status indicator
    this.clipboardStatus = document.createElement('div');
    this.clipboardStatus.className = 'clipboard-status';
    
    // Create icon and text elements
    var icon = document.createElement('span');
    icon.className = 'icon';
    
    var text = document.createElement('span');
    text.className = 'text';
    
    this.clipboardStatus.appendChild(icon);
    this.clipboardStatus.appendChild(text);
    
    // Add to document
    document.body.appendChild(this.clipboardStatus);
    
    // Setup clipboard event listeners
    var self = this;
    
    this.clipboardUpdatedHandler = function(data) {
      // Update the clipboard status
      var operation = data.operation;
      var count = data.count;
      
      // Update class for icon
      self.clipboardStatus.className = 'clipboard-status visible ' + operation;
      
      // Update text
      text.textContent = count + ' squares ' + (operation === 'copy' ? 'copied' : 'cut');
      
      // Hide after a delay
      clearTimeout(self.clipboardStatusTimeout);
      self.clipboardStatusTimeout = setTimeout(function() {
        self.clipboardStatus.className = 'clipboard-status';
      }, 3000);
    };
    
    this.clipboardPastedHandler = function(data) {
  // Handle different paste types
  if (data.type === 'squares' && data.squareIds) {
    // Animate the pasted squares
    data.squareIds.forEach(function(squareId) {
      var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
      if (squareElement) {
        // Add the pasted class temporarily
        squareElement.classList.add('pasted');
        
        // Remove after animation completes
        setTimeout(function() {
          squareElement.classList.remove('pasted');
        }, 1000);
      }
    });
  } else if ((data.type === 'circles' || data.type === 'circle') && data.circleIds) {
    // Animate the pasted circles
    data.circleIds.forEach(function(circleId) {
      var circleElement = document.querySelector('.circle[data-id="' + circleId + '"]');
      if (circleElement) {
        // Add the pasted class temporarily
        circleElement.classList.add('pasted');
        
        // Remove after animation completes
        setTimeout(function() {
          circleElement.classList.remove('pasted');
        }, 1000);
      }
    });
  } else if (data.type === 'circle' && data.circleId) {
    // Handle single circle paste (legacy support)
    var circleElement = document.querySelector('.circle[data-id="' + data.circleId + '"]');
    if (circleElement) {
      circleElement.classList.add('pasted');
      setTimeout(function() {
        circleElement.classList.remove('pasted');
      }, 1000);
    }
  }
  
  // Hide clipboard status
  self.clipboardStatus.className = 'clipboard-status';
};
    
    // Subscribe to clipboard events
    this.clipboardUpdatedSubscription = ChakraApp.EventBus.subscribe('CLIPBOARD_UPDATED', this.clipboardUpdatedHandler);
    this.clipboardPastedSubscription = ChakraApp.EventBus.subscribe('CLIPBOARD_PASTED', this.clipboardPastedHandler);
  };
  
  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {number} [duration=2000] - Duration in milliseconds
   */
  ChakraApp.NotificationController.prototype.showNotification = function(message, duration) {
    duration = duration || 2000;
    
    // Create notification element if needed
    if (!this.notificationElement) {
      this.notificationElement = document.createElement('div');
      this.notificationElement.id = 'keyboard-notification';
      this.notificationElement.className = 'keyboard-notification';
      document.body.appendChild(this.notificationElement);
    }
    
    // Set message and show
    this.notificationElement.textContent = message;
    this.notificationElement.classList.add('visible');
    
    // Hide after duration
    clearTimeout(this.notificationTimeout);
    var self = this;
    this.notificationTimeout = setTimeout(function() {
      self.notificationElement.classList.remove('visible');
    }, duration);
  };
  
  /**
   * Set up multi-selection listeners
   * @private
   */
  ChakraApp.NotificationController.prototype._setupMultiSelectionListeners = function() {
  var self = this;
  
  // Listen for multi-selection events
  this.multiSelectSubscription = ChakraApp.EventBus.subscribe('SQUARES_MULTI_SELECTED', function(data) {
    // Show a counter of how many squares are selected
    var count = data.count || data.selectedSquareIds.length;
    self._showMultiSelectionCounter(count);
  });
  
  // Listen for multi-selection update events
  this.multiUpdateSubscription = ChakraApp.EventBus.subscribe('SQUARES_MULTI_UPDATED', function(data) {
    // Update the counter
    var count = data.count || data.selectedSquareIds.length;
    if (count > 0) {
      self._showMultiSelectionCounter(count);
    } else {
      self._hideMultiSelectionCounter();
    }
  });
  
  // Listen for multi-deselection events
  this.multiDeselectSubscription = ChakraApp.EventBus.subscribe('SQUARES_MULTI_DESELECTED', function() {
    // Hide multi-selection UI elements
    self._hideMultiSelectionCounter();
  });
};
  
  /**
   * Show multi-selection counter
   * @private
   * @param {number} count - Number of selected squares
   */
  ChakraApp.NotificationController.prototype._showMultiSelectionCounter = function(count) {
    // Create or update a counter element
    if (!this.multiSelectionCounter) {
      this.multiSelectionCounter = document.createElement('div');
      this.multiSelectionCounter.id = 'multi-selection-counter';
      this.multiSelectionCounter.className = 'multi-selection-counter';
      document.body.appendChild(this.multiSelectionCounter);
    }
    
    this.multiSelectionCounter.textContent = count + ' squares selected';
    this.multiSelectionCounter.style.display = 'block';
  };
  
  /**
   * Hide multi-selection counter
   * @private
   */
  ChakraApp.NotificationController.prototype._hideMultiSelectionCounter = function() {
    if (this.multiSelectionCounter) {
      this.multiSelectionCounter.style.display = 'none';
    }
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.NotificationController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up timeouts
    if (this.clipboardStatusTimeout) {
      clearTimeout(this.clipboardStatusTimeout);
      this.clipboardStatusTimeout = null;
    }
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    
    // Clean up event subscriptions
    if (this.clipboardUpdatedSubscription) {
      this.clipboardUpdatedSubscription();
      this.clipboardUpdatedSubscription = null;
    }
    
    if (this.clipboardPastedSubscription) {
      this.clipboardPastedSubscription();
      this.clipboardPastedSubscription = null;
    }
    
    if (this.multiUpdateSubscription) {
  this.multiUpdateSubscription();
  this.multiUpdateSubscription = null;
}
    
    if (this.multiDeselectSubscription) {
      this.multiDeselectSubscription();
      this.multiDeselectSubscription = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
