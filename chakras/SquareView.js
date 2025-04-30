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
  
  // Render method
  ChakraApp.SquareView.prototype.render = function() {
    // Create main square element
    this.element = this._createElement('div', {
      className: this.viewModel.isMe ? 'square special-me-square' : 'square',
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
      this.element.appendChild(squareContent);
    }

    // Create name element
    this.nameElement = this._createElement('div', {
      className: 'item-name',
      contentEditable: !this.viewModel.isMe,
      textContent: this.viewModel.name,
      style: {
        fontWeight: this.viewModel.isBold ? 'bold' : 'normal',
      }
    });
    this.element.appendChild(this.nameElement);

    // Apply selection state
    if (this.viewModel.isSelected) {
      this.element.classList.add('selected');
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
    var isDragging = false;
    var isGroupDragging = false;
    var startX, startY;
    var currentHoverBox = null;
    var self = this;
    // Store original position at the start of drag
    var originalX, originalY;

    // Mouse down to start drag
    this.element.addEventListener('mousedown', function(e) {
      // Only start dragging if the element is the target (not children)
      if (e.target === self.element) {
        e.preventDefault();
        isDragging = true;
        window.wasDragged = false;

        // Store initial mouse position
        startX = e.clientX;
        startY = e.clientY;
        
        // Store original square position
        originalX = self.viewModel.x;
        originalY = self.viewModel.y;

        // Check if we should do group dragging
        isGroupDragging = ChakraApp.MultiSelectionManager.hasSelection() && 
            (self.viewModel.id === ChakraApp.MultiSelectionManager.primarySquareId || 
            ChakraApp.MultiSelectionManager.selectedSquareIds.includes(self.viewModel.id));

        // Add dragging styles
        self.element.style.zIndex = 20;
        self.element.classList.add('dragging');

        // Show connection radius on all visible squares in the same circle
        if (ChakraApp.appState.selectedCircleId) {
          var allSquareElements = document.querySelectorAll('.square[data-circle-id="' + 
              ChakraApp.appState.selectedCircleId + '"]');
              
          for (var i = 0; i < allSquareElements.length; i++) {
            if (allSquareElements[i] !== self.element) {
              allSquareElements[i].classList.add('square-dragging-active');
            }
          }
        }
      }
    });

    // Global mouse move for drag
    var mouseMoveHandler = function(e) {
      if (isDragging) {
        e.preventDefault();
        window.wasDragged = true;

        // Calculate movement delta
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;

        // Update start position for next move
        startX = e.clientX;
        startY = e.clientY;

        if (isGroupDragging) {
          // Move the main square and all connected squares
          ChakraApp.MultiSelectionManager.moveSelectedSquares(
              self.viewModel, 
              dx, 
              dy, 
              self.parentElement
          );
        } else {
          // Regular single square dragging
          // Calculate new position within the parent element's bounds
          var parentRect = self.parentElement.getBoundingClientRect();
          var newLeft = Math.max(0, Math.min(parentRect.width - self.element.clientWidth, 
              self.viewModel.x + dx));
          var newTop = Math.max(0, Math.min(parentRect.height - self.element.clientHeight, 
              self.viewModel.y + dy));

          // Update view model
          self.viewModel.updatePosition(newLeft, newTop);
        }

        // Check if over an attribute box (only for single square dragging)
        if (!self.viewModel.isMe && !isGroupDragging) {
          var squareRect = self.element.getBoundingClientRect();
          var hoveredBox = null;

          // Get all attribute boxes
          var attributeBoxes = document.querySelectorAll('.attribute-box');

          // Check each attribute box for intersection
          for (var i = 0; i < attributeBoxes.length; i++) {
            var box = attributeBoxes[i];
            var boxRect = box.getBoundingClientRect();

            // Simple intersection check
            if (squareRect.left < boxRect.right && 
                squareRect.right > boxRect.left &&
                squareRect.top < boxRect.bottom &&
                squareRect.bottom > boxRect.top) {
              hoveredBox = box;
              break;
            }
          }

          // Update highlight
          if (currentHoverBox && currentHoverBox !== hoveredBox) {
            currentHoverBox.classList.remove('highlight');
          }

          if (hoveredBox) {
            hoveredBox.classList.add('highlight');
          }

          currentHoverBox = hoveredBox;
        }
      }
    };

    // Global mouse up to end drag
    var mouseUpHandler = function() {
      if (isDragging) {
        isDragging = false;
        self.element.style.zIndex = self.viewModel.isSelected ? 15 : 
            (self.element.classList.contains('overlapping') ? 12 : 10);

        // Remove dragging class
        self.element.classList.remove('dragging');

        // Hide connection radius on all squares
        var activeElements = document.querySelectorAll('.square-dragging-active');
        for (var i = 0; i < activeElements.length; i++) {
          activeElements[i].classList.remove('square-dragging-active');
        }

        // Clean up group dragging state
        if (isGroupDragging) {
          ChakraApp.MultiSelectionManager.endGroupDragging();
          isGroupDragging = false;
        }

        // Check if dropped on an attribute box
        if (currentHoverBox && !self.viewModel.isMe && !isGroupDragging) {
          // Apply the attribute
          var attributeType = currentHoverBox.dataset.attribute;
          self.viewModel.applyAttribute(attributeType);
          
          // Return square to its original position
          self.viewModel.updatePosition(originalX, originalY);
          
          // Remove highlight
          currentHoverBox.classList.remove('highlight');
        }

        currentHoverBox = null;

        // Save state when drag completes
        ChakraApp.appState.saveToStorageNow();

        // Reset drag state after a short delay
        setTimeout(function() {
          window.wasDragged = false;
        }, 50);
      }
    };

    // Add global event listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    // Store handlers for cleanup
    this._addHandler(function() {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    });
  };
})(window.ChakraApp = window.ChakraApp || {});
