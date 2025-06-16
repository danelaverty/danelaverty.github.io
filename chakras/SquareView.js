// src/views/SquareView.js
// Consolidated Square View implementation

(function(ChakraApp) {
  /**
   * Square view component
   * @param {Object} viewModel - Square view model
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.SquareView = function(viewModel, parentElement) {
    // Call parent constructor
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    
    // Create the square element
    this.render();
    
    // Subscribe to view model changes
    this._setupViewModelSubscription();
    
    // Add event listeners
    this._setupEventListeners();
  };
  
  // Inherit from BaseView
  ChakraApp.SquareView.prototype = Object.create(ChakraApp.BaseView.prototype);
  ChakraApp.SquareView.prototype.constructor = ChakraApp.SquareView;

  ChakraApp.SquareView.prototype._createIndicatorElement = function() {
  if (!this.viewModel.indicator) return null;
  
  // Find the emoji for this indicator
  var indicatorConfig = null;
  ChakraApp.Config.indicatorEmojis.forEach(function(config) {
    if (config.id === this.viewModel.indicator) {
      indicatorConfig = config;
    }
  }, this);
  
  if (!indicatorConfig) return null;
  
  // Create indicator element
  var indicator = this._createElement('div', {
    className: 'square-indicator',
    textContent: indicatorConfig.emoji,
    style: {
      position: 'absolute',
      top: '-18px',
      right: '-18px',
      fontSize: '22px',
      zIndex: '10',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }
  });
  
  return indicator;
};
  
  // Render method
ChakraApp.SquareView.prototype.render = function() {
  // Create main square element
  this.element = this._createElement('div', {
    className: 'square',
    dataset: { 
      id: this.viewModel.id,
      circleId: this.viewModel.circleId
    },
    style: {
      width: this.viewModel.size + 'px',
      height: this.viewModel.size + 'px',
      left: this.viewModel.x + 'px',
      top: this.viewModel.y + 'px',
      backgroundColor: this.viewModel.color,
      display: this.viewModel.isVisible ? 'flex' : 'none',
      filter: this.viewModel.isBold ? 'brightness(1.4)' : 'none'
    }
  });

  // Add connection radius indicator
  var maxLineLength = ChakraApp.Config.connections.maxLineLength;
  this.radiusIndicator = this._createElement('div', {
    className: 'connection-radius-indicator',
    style: {
      width: (maxLineLength * 2) + 'px',
      height: (maxLineLength * 2) + 'px'
    }
  });
  this.element.appendChild(this.radiusIndicator);

  // Add attribute emoji if it exists
  if (this.viewModel.emoji) {
    var squareContent = this._createElement('div', {
      className: 'square-content',
      textContent: this.viewModel.emoji
    });
    if (this.viewModel.model.attribute == 'bulbOff') {
	    squareContent.style.filter = 'grayscale(1) brightness(0.5)';
    }
    this.element.appendChild(squareContent);
  }

  // Create name element
  this.nameElement = this._createElement('div', {
    className: 'item-name',
    contentEditable: true,
    textContent: this.viewModel.name,
    style: {
      fontWeight: this.viewModel.isBold ? 'bold' : 'normal',
    }
  });
  this.element.appendChild(this.nameElement);

  // Create and add indicator element if it exists
  this.indicatorElement = this._createIndicatorElement();
  if (this.indicatorElement) {
    this.element.appendChild(this.indicatorElement);
  }

  // Apply indicator border class
  this._updateIndicatorBorder();

  // Apply selection state
  if (this.viewModel.isSelected) {
    this.element.classList.add('selected');
  }

  if (this.viewModel.disabled) {
  this.element.classList.add('disabled');
}

  // Add to parent element
  this.parentElement.appendChild(this.element);
};
  
  // Update view based on model changes
ChakraApp.SquareView.prototype.update = function() {
  // Update position
  this.element.style.left = this.viewModel.x + 'px';
  this.element.style.top = this.viewModel.y + 'px';
  
  // Update color
  this.element.style.backgroundColor = this.viewModel.color;
  
  // Update attribute emoji
  var existingEmoji = this.element.querySelector('.square-content');
  if (existingEmoji) {
    this.element.removeChild(existingEmoji);
  }
  
  if (this.viewModel.emoji) {
    var squareContent = this._createElement('div', {
      className: 'square-content',
      textContent: this.viewModel.emoji
    });
    this.element.appendChild(squareContent);
  }
  
  // Update name
  this.nameElement.textContent = this.viewModel.name;
  
  // Update bold state
  if (this.viewModel.isBold) {
    this.nameElement.style.fontWeight = 'bold';
    this.element.style.filter = 'brightness(1.4)';
  } else {
    this.nameElement.style.fontWeight = 'normal';
    this.element.style.filter = 'none';
  }

  // Update indicator
  this._updateIndicator();
  this._updateIndicatorBorder();

  this.element.classList.toggle('disabled', this.viewModel.disabled);
};

ChakraApp.SquareView.prototype._updateIndicator = function() {
  // Remove existing indicator if it exists
  if (this.indicatorElement) {
    this.element.removeChild(this.indicatorElement);
    this.indicatorElement = null;
  }
  
  // Create new indicator if needed
  this.indicatorElement = this._createIndicatorElement();
  if (this.indicatorElement) {
    this.element.appendChild(this.indicatorElement);
  }
  
  // Update the border class
  this._updateIndicatorBorder();
};

ChakraApp.SquareView.prototype._updateIndicatorBorder = function() {
  // Remove all existing indicator border classes
  this.element.classList.remove('indicator-good', 'indicator-bad', 'indicator-start', 'indicator-finish', 'indicator-done', 'indicator-important');
  
  // Add the appropriate border class based on current indicator
  if (this.viewModel.indicator) {
    this.element.classList.add('indicator-' + this.viewModel.indicator);
  }
};


  
  // Set up event listeners
  ChakraApp.SquareView.prototype._setupEventListeners = function() {
    var self = this;

    // Click handler for selection
    this.element.addEventListener('click', function(e) {
      e.stopPropagation();

      // Only select if we weren't just dragging
      if (!window.wasDragged) {
        if (e.shiftKey) {
          // Multi-select mode - select this square and all connected squares
          if (ChakraApp.appState.selectedSquareId && 
              ChakraApp.appState.selectedSquareId !== self.viewModel.id) {
            // Deselect previous square without clearing multi-selection state
            var previousSquare = ChakraApp.appState.getSquare(ChakraApp.appState.selectedSquareId);
            if (previousSquare) {
              previousSquare.deselect();
              ChakraApp.appState.selectedSquareId = null;
            }
          }
          
          // Select this square and its connections
          ChakraApp.MultiSelectionManager.selectWithConnected(self.viewModel.id);
          self.viewModel.select();
        } else {
          // Normal selection - clear any existing multi-selection
          if (ChakraApp.MultiSelectionManager.hasSelection()) {
            ChakraApp.MultiSelectionManager.clearSelection();
          }
          self.viewModel.select();
        }
      }
    });

    // Name input events
    this.nameElement.addEventListener('blur', function() {
      self.viewModel.updateName(this.textContent);
    });

    this.nameElement.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });

    this.nameElement.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Add drag functionality
    this._addDragFunctionality();
  };
  
  // Add drag functionality
ChakraApp.SquareView.prototype._addDragFunctionality = function() {
  var self = this;
  
  // Mark view model as square for drag handler
  this.viewModel.isSquare = true;
  
  // Set up drag configuration
  var dragConfig = {
    viewModel: this.viewModel,
    parentElement: this.parentElement,
    dragTargets: [this.element], // Only allow dragging from the main element
    enableAttributeDrop: !this.viewModel.isMe, // Enable attribute drop for non-Me squares
    enableGroupDragging: true, // Enable multi-selection dragging
    
    onDragStart: function(dragState) {
      // Store original position for potential attribute drop reset
      dragState.originalX = self.viewModel.x;
      dragState.originalY = self.viewModel.y;
    },
    
    onDragEnd: function(dragState) {
      // Any additional cleanup specific to squares
    }
  };
  
  // Add drag functionality using the unified system
  this.dragState = ChakraApp.DragHandler.addDragFunctionality(this.element, dragConfig);
  
  // Store cleanup function
  this._addHandler(function() {
    ChakraApp.DragHandler.removeDragFunctionality(self.dragState);
  });
};
})(window.ChakraApp = window.ChakraApp || {});
