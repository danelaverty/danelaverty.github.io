// src/views/SquareView.js
// View component for Square

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
    this.element = document.createElement('div');
    this.element.className = 'square';
    
    // Add special class for Me square
    if (this.viewModel.isMe) {
      this.element.classList.add('special-me-square');
    }
    
    // Set attributes
    this.element.dataset.id = this.viewModel.id;
    this.element.dataset.circleId = this.viewModel.circleId;
    
    // Set position and style
    this.element.style.width = this.viewModel.size + 'px';
    this.element.style.height = this.viewModel.size + 'px';
    this.element.style.left = this.viewModel.x + 'px';
    this.element.style.top = this.viewModel.y + 'px';
    this.element.style.backgroundColor = this.viewModel.color;
    
    // Set visibility
    this.element.style.display = this.viewModel.isVisible ? 'flex' : 'none';
    
    // Add attribute emoji if it exists
    if (this.viewModel.emoji) {
      var squareContent = document.createElement('div');
      squareContent.className = 'square-content';
      squareContent.textContent = this.viewModel.emoji;
      this.element.appendChild(squareContent);
    }
    
    // Create name element
    this.nameElement = document.createElement('div');
    this.nameElement.className = 'item-name';
    
    // Me squares have non-editable names
    if (this.viewModel.isMe) {
      this.nameElement.contentEditable = false;
    } else {
      this.nameElement.contentEditable = true;
    }
    
    this.nameElement.textContent = this.viewModel.name;
    if (this.viewModel.isBold) {
      this.nameElement.style.fontWeight = 'bold';
      this.element.style.filter = 'brightness(1.4)';
    }
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
      var squareContent = document.createElement('div');
      squareContent.className = 'square-content';
      squareContent.textContent = this.viewModel.emoji;
      this.element.appendChild(squareContent);
    }
    
    // Update name
    this.nameElement.textContent = this.viewModel.name;
    if (this.viewModel.isBold) {
      this.nameElement.style.fontWeight = 'bold';
      this.element.style.filter = 'brightness(1.4)';
    } else {
      this.nameElement.style.fontWeight = 'normal';
      this.element.style.filter = 'none';
    }
    
    // Update visibility
    this.element.style.display = this.viewModel.isVisible ? 'flex' : 'none';
    
    // Update selection state
    if (this.viewModel.isSelected) {
      this.element.classList.add('selected');
    } else {
      this.element.classList.remove('selected');
    }
  };
  
  // Subscribe to view model changes
  ChakraApp.SquareView.prototype._setupViewModelSubscription = function() {
    var self = this;
    
    // Subscribe to view model changes
    this.viewModelSubscription = this.viewModel.subscribe(function(change) {
      if (change.type === 'update') {
        self.update();
      } else if (change.type === 'select') {
        self.element.classList.add('selected');
      } else if (change.type === 'deselect') {
        self.element.classList.remove('selected');
      } else if (change.type === 'visibility') {
        self.element.style.display = change.isVisible ? 'flex' : 'none';
      }
    });
  };

  ChakraApp.SquareView.prototype._lightenColor = function(color, percent) {
    // If color is in named format or rgba, return as is (could be enhanced to handle these)
    if (!color.startsWith('#') && !color.startsWith('rgb(')) {
      return color;
    }

    var rgb;

    // Parse hex color
    if (color.startsWith('#')) {
      var hex = color.substring(1);
      // Convert from shorthand hex if needed
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      // Parse to RGB
      rgb = [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ];
    } 
    // Parse rgb() format
    else if (color.startsWith('rgb(')) {
      var rgbStr = color.match(/\d+/g);
      rgb = [
        parseInt(rgbStr[0]),
        parseInt(rgbStr[1]),
        parseInt(rgbStr[2])
      ];
    }

    // Lighten each component
    for (var i = 0; i < 3; i++) {
      rgb[i] = Math.min(255, Math.floor(rgb[i] + (255 - rgb[i]) * (percent / 100)));
    }

    // Convert back to rgb format
    return 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
  };
  
  // Setup event listeners
  ChakraApp.SquareView.prototype._setupEventListeners = function() {
    var self = this;

    // Click handler for selection
    this.element.addEventListener('click', function(e) {
      e.stopPropagation();

      // Only select if we weren't just dragging
      if (!window.wasDragged) {
        if (e.shiftKey) {
          // Multi-select mode - select this square and all connected squares
          ChakraApp.MultiSelectionManager.selectWithConnected(self.viewModel.id);
          
          // Select this square as primary
          self.viewModel.select();
        } else {
          // Normal selection
          // Clear any existing multi-selection
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

        // Check if we should do group dragging
        isGroupDragging = ChakraApp.MultiSelectionManager.hasSelection() && 
                        (self.viewModel.id === ChakraApp.MultiSelectionManager.primarySquareId || 
                         ChakraApp.MultiSelectionManager.selectedSquareIds.includes(self.viewModel.id));

        // Add dragging styles
        self.element.style.zIndex = 20;
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
          // Move the main square and all connected squares using the MultiSelectionManager
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
          var newLeft = Math.max(0, Math.min(parentRect.width - self.element.clientWidth, self.viewModel.x + dx));
          var newTop = Math.max(0, Math.min(parentRect.height - self.element.clientHeight, self.viewModel.y + dy));

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
          attributeBoxes.forEach(function(box) {
            var boxRect = box.getBoundingClientRect();

            // Simple intersection check
            if (squareRect.left < boxRect.right && 
                squareRect.right > boxRect.left &&
                squareRect.top < boxRect.bottom &&
                squareRect.bottom > boxRect.top) {
                  hoveredBox = box;
                }
          });

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
    var mouseUpHandler = function(e) {
      if (isDragging) {
        isDragging = false;
        self.element.style.zIndex = self.viewModel.isSelected ? 15 : (self.element.classList.contains('overlapping') ? 12 : 10);

        // Clean up group dragging state
        if (isGroupDragging) {
          ChakraApp.MultiSelectionManager.endGroupDragging();
          isGroupDragging = false;
        }

        // Check if dropped on an attribute box (only for single square drag)
        if (currentHoverBox && !self.viewModel.isMe && !isGroupDragging) {
          var attributeType = currentHoverBox.dataset.attribute;

          // Apply the attribute
          self.viewModel.applyAttribute(attributeType);

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
    this.dragHandlers = {
      mouseMoveHandler: mouseMoveHandler,
      mouseUpHandler: mouseUpHandler
    };
  };
  
  // Clean up resources
  ChakraApp.SquareView.prototype.destroy = function() {
    // Call parent destroy method
    ChakraApp.BaseView.prototype.destroy.call(this);
    
    // Clean up view model subscription
    if (this.viewModelSubscription) {
      this.viewModelSubscription();
    }
    
    // Clean up drag handlers
    if (this.dragHandlers) {
      document.removeEventListener('mousemove', this.dragHandlers.mouseMoveHandler);
      document.removeEventListener('mouseup', this.dragHandlers.mouseUpHandler);
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
