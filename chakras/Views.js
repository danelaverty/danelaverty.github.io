// src/views/BaseView.js
// Base class for all views

(function(ChakraApp) {
  /**
   * Base view class
   * @param {Object} viewModel - View model instance
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.BaseView = function(viewModel, parentElement) {
    this.viewModel = viewModel;
    this.parentElement = parentElement;
    this.element = null;
  };
  
  // Base methods
  ChakraApp.BaseView.prototype = {
    render: function() {
      // Override in derived classes
      throw new Error('render() must be implemented by derived classes');
    },
    
    update: function() {
      // Override in derived classes
      throw new Error('update() must be implemented by derived classes');
    },
    
    remove: function() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    },
    
    destroy: function() {
      this.remove();
      // Clean up any event listeners or other resources
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});

// src/views/CircleView.js
// View component for Circle

(function(ChakraApp) {
  /**
   * Circle view component
   * @param {Object} viewModel - Circle view model
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.CircleView = function(viewModel, parentElement) {
    // Call parent constructor
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    
    // Create the circle element
    this.render();
    
    // Subscribe to view model changes
    this._setupViewModelSubscription();
    
    // Add event listeners
    this._setupEventListeners();
  };
  
  // Inherit from BaseView
  ChakraApp.CircleView.prototype = Object.create(ChakraApp.BaseView.prototype);
  ChakraApp.CircleView.prototype.constructor = ChakraApp.CircleView;
  
  // Render method
  ChakraApp.CircleView.prototype.render = function() {
	  // Create main circle element
	  this.element = document.createElement('div');
	  this.element.className = 'circle';
	  this.element.dataset.id = this.viewModel.id;

	  // Set position and size
	  this.element.style.width = this.viewModel.size + 'px';
	  this.element.style.height = this.viewModel.size + 'px';
	  this.element.style.left = this.viewModel.x + 'px';
	  this.element.style.top = this.viewModel.y + 'px';

	  // Create the glowing background element
	  this.glowElement = document.createElement('div');
	  this.glowElement.className = 'circle-glow';
	  this.glowElement.style.backgroundColor = this.viewModel.color;
	  this.element.appendChild(this.glowElement);

	  // Create particles
	  this._createParticles();

	  // Create polygon containers based on the circle's chakra form
	  this._createChakraForm();

	  // Create element symbol if circle has an element
	  this._createElementSymbol();

	  this._createCharacteristicDisplays();

	  // Create name input
	  this.nameElement = document.createElement('div');
	  this.nameElement.className = 'item-name';
	  this.nameElement.contentEditable = true;
	  this.nameElement.textContent = this.viewModel.name;
	  this.element.appendChild(this.nameElement);

	  // Create closest square indicator if it exists
	  this._createClosestSquareIndicator();

	  // Apply selection state
	  if (this.viewModel.isSelected) {
		  this.element.classList.add('selected');
	  }

	  // Apply dimming state
	  if (this.viewModel.isDimmed) {
		  this.element.classList.add('dimmed');
	  }

	  // Add to parent element
	  this.parentElement.appendChild(this.element);
  };
  
  // Create particle effects
  ChakraApp.CircleView.prototype._createParticles = function() {
    var particlesElement = document.createElement('div');
    particlesElement.className = 'particles';
    
    // First angle element
    var angleElement1 = document.createElement('div');
    angleElement1.className = 'angle';
    
    var positionElement1 = document.createElement('div');
    positionElement1.className = 'position';
    
    var pulseElement1 = document.createElement('div');
    pulseElement1.className = 'pulse';
    
    var particleElement1 = document.createElement('div');
    particleElement1.className = 'particle';
    particleElement1.style.backgroundColor = this.viewModel.color;
    
    pulseElement1.appendChild(particleElement1);
    positionElement1.appendChild(pulseElement1);
    angleElement1.appendChild(positionElement1);
    particlesElement.appendChild(angleElement1);
    
    // Second angle element (clone of first)
    var angleElement2 = angleElement1.cloneNode(true);
    particlesElement.appendChild(angleElement2);
    
    this.element.appendChild(particlesElement);
  };

  // Create characteristic displays
ChakraApp.CircleView.prototype._createCharacteristicDisplays = function() {
    // For each characteristic in the config
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    this.characteristicDisplays = {}; // Store references to displays
    
    Object.keys(characteristics).forEach(function(key) {
        var charDef = characteristics[key];
        var charValue = null;
        
        // Handle legacy properties (color, element) and new characteristics system
        if (key === 'color') {
            charValue = self.viewModel.color;
        } else if (key === 'element') {
            charValue = self.viewModel.element;
        } else if (self.viewModel.characteristics && 
                  self.viewModel.characteristics[key] !== undefined) {
            charValue = self.viewModel.characteristics[key];
        }
        
        // If we have a value and a visualStyle defined
        if (charValue && charDef.visualStyle) {
            var display = self._createCharacteristicDisplay(key, charValue, charDef);
            if (display) {
                self.element.appendChild(display);
                self.characteristicDisplays[key] = display;
            }
        }
    });
};

// Helper to create a single characteristic display
ChakraApp.CircleView.prototype._createCharacteristicDisplay = function(key, value, charDef) {
    var display = null;
    
    // Create appropriate display based on visualStyle type
    switch (charDef.visualStyle.type) {
        case 'background':
            // For color, we already have the glow element
            // No need to create a new element
            return null;
            
        case 'symbol':
            display = document.createElement('div');
            display.className = charDef.visualStyle.cssClass;
            
            // Find the option
            var option = this._findCharOption(value, charDef);
            if (option && option.visualStyle && option.visualStyle.emoji) {
                display.textContent = option.visualStyle.emoji;
                display.style.display = '';
            } else {
                display.style.display = 'none';
            }
            break;
            
        case 'number':
            display = document.createElement('div');
            display.className = charDef.visualStyle.cssClass;
            
            // Find the option
            var option = this._findCharOption(value, charDef);
            if (option && option.visualStyle && option.visualStyle.number) {
                display.textContent = option.visualStyle.number;
                display.style.display = '';
                display.title = option.display;
            } else {
                display.style.display = 'none';
            }
            break;
    }
    
    return display;
};

// Helper to find a characteristic option
ChakraApp.CircleView.prototype._findCharOption = function(value, charDef) {
    for (var i = 0; i < charDef.categories.length; i++) {
        var category = charDef.categories[i];
        for (var j = 0; j < category.options.length; j++) {
            var option = category.options[j];
            if (option.value === value) {
                return option;
            }
        }
    }
    return null;
};
  
  // Create chakra form
  ChakraApp.CircleView.prototype._createChakraForm = function() {
    // Get the chakra form from the view model
    var chakraForm = this.viewModel.chakraForm;
    
    // Create outer polygon container
    var outerPolygonContainer = document.createElement('div');
    outerPolygonContainer.className = 'outer-polygon-container';
    
    // Create the chakra form shapes
    var self = this;
    chakraForm.forEach(function(form) {
      var innerPolygonContainer = document.createElement('div');
      innerPolygonContainer.className = 'inner-polygon-container';
      innerPolygonContainer.style.transform = 
        'rotate(' + (form.rotate || 0) + 'deg) scale(' + (form.scale || 1) + ')';
      
      var innermostPolygonContainer = document.createElement('div');
      innermostPolygonContainer.className = 'inner-polygon-container';
      innermostPolygonContainer.style.filter = 'drop-shadow(0 0 3px #AAA)';
      innermostPolygonContainer.style.mixBlendMode = 'screen';
      innermostPolygonContainer.style.animation = 
        (form.reverse ? 'anglerev' : 'angle') + ' ' + (form.spinTime || 16) + 's linear infinite';
      
      var shapeElement = document.createElement('div');
      shapeElement.className = 'shape';
      shapeElement.style.clipPath = ChakraApp.Utils.getPolyPoints(
        form.sides, 
        form.starFactor, 
        form.borderPercent
      );
      
      innermostPolygonContainer.appendChild(shapeElement);
      innerPolygonContainer.appendChild(innermostPolygonContainer);
      outerPolygonContainer.appendChild(innerPolygonContainer);
    });
    
    this.element.appendChild(outerPolygonContainer);
  };
  
  // Create closest square indicator
  ChakraApp.CircleView.prototype._createClosestSquareIndicator = function() {
    // Create closest square indicator
    this.closestIndicator = document.createElement('div');
    this.closestIndicator.className = 'closest-square-indicator';
    
    if (this.viewModel.closestSquareName) {
      this.closestIndicator.textContent = this.viewModel.closestSquareName;
    } else {
      this.closestIndicator.style.display = 'none';
    }
    
    this.element.appendChild(this.closestIndicator);
  };

  // Create element symbol display
  ChakraApp.CircleView.prototype._createElementSymbol = function() {
	  // Create element symbol container
	  this.elementSymbol = document.createElement('div');
	  this.elementSymbol.className = 'circle-element-symbol';

	  // Set symbol if circle has an element
	  if (this.viewModel.element && ChakraApp.Config.elements[this.viewModel.element]) {
		  this.elementSymbol.textContent = ChakraApp.Config.elements[this.viewModel.element].emoji;
		  this.elementSymbol.style.display = '';
	  } else {
		  this.elementSymbol.style.display = 'none';
	  }

	  this.element.appendChild(this.elementSymbol);
  };
  
  // Update view based on model changes
  ChakraApp.CircleView.prototype.update = function() {
	  // Update position
	  this.element.style.left = this.viewModel.x + 'px';
	  this.element.style.top = this.viewModel.y + 'px';

	  // Update color
	  this.glowElement.style.backgroundColor = this.viewModel.color;

	  // Update all particle elements
	  var particles = this.element.querySelectorAll('.particle');
	  var self = this;
	  particles.forEach(function(particle) {
		  particle.style.backgroundColor = self.viewModel.color;
	  });

	  // Update name
	  this.nameElement.textContent = this.viewModel.name;

	  // Update element symbol
	  if (this.elementSymbol) {
		  if (this.viewModel.element && ChakraApp.Config.elements[this.viewModel.element]) {
			  this.elementSymbol.textContent = ChakraApp.Config.elements[this.viewModel.element].emoji;
			  this.elementSymbol.style.display = '';
		  } else {
			  this.elementSymbol.style.display = 'none';
		  }
	  }

	  // Update closest square indicator
	  if (this.viewModel.closestSquareName) {
		  this.closestIndicator.textContent = this.viewModel.closestSquareName;
		  this.closestIndicator.style.display = '';
	  } else {
		  this.closestIndicator.style.display = 'none';
	  }

	  // Update selection state
	  if (this.viewModel.isSelected) {
		  this.element.classList.add('selected');
	  } else {
		  this.element.classList.remove('selected');
	  }

	  // Update dimming state
	  if (this.viewModel.isDimmed) {
		  this.element.classList.add('dimmed');
	  } else {
		  this.element.classList.remove('dimmed');
	  }

	  // Update chakra form if needed
	  // This is more complex and would require removing and recreating the chakra form
	  // We'll do this when the square count changes
	  if (this.viewModel.squareCountChanged) {
		  this._updateChakraForm();
	  }

	  // Update all characteristic displays
	  var characteristics = ChakraApp.Config.characteristics;
	  var self = this;

	  Object.keys(characteristics).forEach(function(key) {
		  var charDef = characteristics[key];
		  var charValue = null;

		  // Get the current value from the viewModel
		  if (key === 'color') {
			  charValue = self.viewModel.color;
			  // Update the glow element for color
			  self.glowElement.style.backgroundColor = charValue;
		  } else if (key === 'element') {
			  charValue = self.viewModel.element;
		  } else if (self.viewModel.characteristics && 
			  self.viewModel.characteristics[key] !== undefined) {
				  charValue = self.viewModel.characteristics[key];
			  }

		  // Update existing display if we have one
		  if (self.characteristicDisplays[key]) {
			  var display = self.characteristicDisplays[key];

			  switch (charDef.visualStyle.type) {
				  case 'symbol':
					  var option = self._findCharOption(charValue, charDef);
					  if (option && option.visualStyle && option.visualStyle.emoji) {
						  display.textContent = option.visualStyle.emoji;
						  display.style.display = '';
					  } else {
						  display.style.display = 'none';
					  }
					  break;

				  case 'number':
					  var option = self._findCharOption(charValue, charDef);
					  if (option && option.visualStyle && option.visualStyle.number) {
						  display.textContent = option.visualStyle.number;
						  display.style.display = '';
						  display.title = option.display;
					  } else {
						  display.style.display = 'none';
					  }
					  break;
			  }
		  }
	  });
  };
  
  // Update chakra form
  ChakraApp.CircleView.prototype._updateChakraForm = function() {
    // Remove existing polygon container
    var existingPolygonContainer = this.element.querySelector('.outer-polygon-container');
    if (existingPolygonContainer) {
      this.element.removeChild(existingPolygonContainer);
    }
    
    // Create new chakra form
    this._createChakraForm();
  };
  
  // Subscribe to view model changes
  ChakraApp.CircleView.prototype._setupViewModelSubscription = function() {
    var self = this;
    
    // Subscribe to view model changes
    this.viewModelSubscription = this.viewModel.subscribe(function(change) {
      if (change.type === 'update') {
        self.update();
      } else if (change.type === 'select') {
        self.element.classList.add('selected');
      } else if (change.type === 'deselect') {
        self.element.classList.remove('selected');
      } else if (change.type === 'dim') {
        if (change.isDimmed) {
          self.element.classList.add('dimmed');
        } else {
          self.element.classList.remove('dimmed');
        }
      }
    });
  };
  
  // Setup event listeners
  ChakraApp.CircleView.prototype._setupEventListeners = function() {
    var self = this;
    
    // Click handler for selection
    this.element.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Only select if we weren't just dragging
      if (!window.wasDragged) {
        self.viewModel.select();
      }
    });
    
    // Name input events
    this.nameElement.addEventListener('blur', function() {
	    var oldName = self.viewModel.name;
	    var newName = this.textContent;

	    // Only update if the name actually changed
	    if (oldName !== newName) {
		    self.viewModel.updateName(newName);

		    // Check if name changed between default and non-default
		    var wasDefaultName = oldName === ChakraApp.Config.defaultName;
		    var isDefaultName = newName === ChakraApp.Config.defaultName;

		    if (wasDefaultName !== isDefaultName) {
			    // Name changed between default and non-default, force chakra form update
			    self._updateChakraForm();
		    }
	    }
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
  ChakraApp.CircleView.prototype._addDragFunctionality = function() {
	  var isDragging = false;
	  var self = this;

	  // Mouse down to start drag
	  this.element.addEventListener('mousedown', function(e) {
		  // Only start dragging if clicking on the circle itself (not its children)
		  if (e.target === self.element) {
			  e.preventDefault();
			  isDragging = true;
			  window.wasDragged = false;

			  // Disable transitions completely while dragging
			  self.element.classList.add('no-transition');

			  // Add dragging styles
			  self.element.style.zIndex = 20;
		  }
	  });

	  // Global mouse move for drag
	  var mouseMoveHandler = function(e) {
		  if (isDragging) {
			  e.preventDefault();
			  window.wasDragged = true;

			  // Get cursor position within the zoom container
			  var zoomContainer = document.getElementById('zoom-container');
			  var containerRect = zoomContainer.getBoundingClientRect();
			  var zoomLevel = ChakraApp.appState.zoomLevel;

			  // Calculate raw position - no adjustment needed
			  var newX = (e.clientX - containerRect.left) / zoomLevel;
			  var newY = (e.clientY - containerRect.top) / zoomLevel;

			  // Set position directly on DOM element - bypass view model for dragging
			  self.element.style.left = newX + 'px';
			  self.element.style.top = newY + 'px';

			  // Check for meridian snap
			  var meridianX = ChakraApp.Config.meridian.x;
			  var distanceToMeridian = Math.abs(newX - meridianX);

			  if (distanceToMeridian < ChakraApp.Config.meridian.snapThreshold) {
				  // Snap to meridian
				  self.element.style.left = meridianX + 'px';
				  self.element.classList.add('snapping');
			  } else {
				  // Regular position update
				  self.element.classList.remove('snapping');
			  }
		  }
	  };

	  // Global mouse up to end drag
	  var mouseUpHandler = function() {
		  if (isDragging) {
			  isDragging = false;

			  // Update the model with the final position
			  var finalX = parseFloat(self.element.style.left);
			  var finalY = parseFloat(self.element.style.top);
			  self.viewModel.updatePosition(finalX, finalY);

			  // Restore normal z-index
			  self.element.style.zIndex = self.viewModel.isSelected ? 15 : 10;

			  // Re-enable transitions
			  self.element.classList.remove('no-transition');

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
  ChakraApp.CircleView.prototype.destroy = function() {
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

	    // Lighten the background color of the square
	    /*var originalColor = this.element.style.backgroundColor;
	    var lighterColor = this._lightenColor(originalColor, 40); // Lighten by 20%
	    this.element.style.backgroundColor = lighterColor;*/
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

	    // Lighten the background color
	    /*var originalColor = this.viewModel.color;
	    var lighterColor = this._lightenColor(originalColor, 40); // Lighten by 20%
	    this.element.style.backgroundColor = lighterColor;*/
    } else {
	    this.nameElement.style.fontWeight = 'normal';
	    this.element.style.filter = 'none';
	    // Reset to original color
	    this.element.style.backgroundColor = this.viewModel.color;
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
				  self._selectWithConnected();
			  } else {
				  // Normal selection
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

  // Add a new method to select a square and all its connected squares
  ChakraApp.SquareView.prototype._selectWithConnected = function() {
	  // First, select this square
	  this.viewModel.select();

	  // Find all connected squares
	  var connectedSquares = this._findConnectedSquares(this.viewModel.id, []);

	  // Create a visual selection effect for all connected squares
	  connectedSquares.forEach(function(squareId) {
		  var square = ChakraApp.appState.getSquare(squareId);
		  if (square) {
			  // Add a "multi-selected" class to the square's DOM element
			  var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
			  if (squareElement) {
				  squareElement.classList.add('multi-selected');
			  }
		  }
	  });

	  // Store the list of multi-selected squares in a global state
	  if (!ChakraApp.multiSelectedSquares) {
		  ChakraApp.multiSelectedSquares = [];
	  }
	  ChakraApp.multiSelectedSquares = connectedSquares;

	  // Publish a custom event for multi-selection
	  ChakraApp.EventBus.publish('SQUARES_MULTI_SELECTED', {
		  primarySquareId: this.viewModel.id,
		  connectedSquareIds: connectedSquares
	  });
  };
  
  // Add drag functionality
  ChakraApp.SquareView.prototype._addDragFunctionality = function() {
	  var isDragging = false;
	  var isGroupDragging = false;
	  var startX, startY;
	  var currentHoverBox = null;
	  var self = this;
	  var connectedSquares = [];

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

			  // Check if Shift key is pressed for group dragging
			  isGroupDragging = e.shiftKey;

			  if (isGroupDragging) {
				  // Find all connected squares recursively
				  connectedSquares = self._findConnectedSquares(self.viewModel.id, []);

				  // Highlight all connected squares
				  connectedSquares.forEach(function(squareId) {
					  var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
					  if (squareElement) {
						  squareElement.classList.add('group-dragging');
					  }
				  });
			  }

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
				  // Move the main square and all connected squares
				  self._moveSquareWithConnected(self.viewModel, dx, dy, connectedSquares);
			  } else {
				  // Calculate new position
				  var currentLeft = self.viewModel.x;
				  var currentTop = self.viewModel.y;

				  // Calculate new position within the parent element's bounds
				  var parentRect = self.parentElement.getBoundingClientRect();
				  var newLeft = Math.max(0, Math.min(parentRect.width - self.element.clientWidth, currentLeft + dx));
				  var newTop = Math.max(0, Math.min(parentRect.height - self.element.clientHeight, currentTop + dy));

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
			  self.element.style.zIndex = self.viewModel.isSelected ? 15 : 10;

			  // Remove group-dragging highlighting
			  if (isGroupDragging) {
				  connectedSquares.forEach(function(squareId) {
					  var squareElement = document.querySelector('.square[data-id="' + squareId + '"]');
					  if (squareElement) {
						  squareElement.classList.remove('group-dragging');
					  }
				  });

				  // Reset state variables
				  isGroupDragging = false;
				  connectedSquares = [];
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

  // Find all squares connected to a given square recursively
  ChakraApp.SquareView.prototype._findConnectedSquares = function(squareId, visited) {
	  // Initialize visited array if not provided
	  visited = visited || [];

	  // Mark current square as visited
	  visited.push(squareId);

	  // Get all connections
	  var connections = [];
	  ChakraApp.appState.connections.forEach(function(conn) {
		  if (conn.isVisible) {
			  if (conn.sourceId === squareId && !visited.includes(conn.targetId)) {
				  connections.push(conn.targetId);
			  } else if (conn.targetId === squareId && !visited.includes(conn.sourceId)) {
				  connections.push(conn.sourceId);
			  }
		  }
	  });

	  // Recursively find all connected squares
	  for (var i = 0; i < connections.length; i++) {
		  var connectedId = connections[i];
		  if (!visited.includes(connectedId)) {
			  this._findConnectedSquares(connectedId, visited);
		  }
	  }

	  // Return all connected squares (excluding the starting square)
	  return visited.filter(function(id) {
		  return id !== squareId;
	  });
  };

  // Move a square and all its connected squares
  ChakraApp.SquareView.prototype._moveSquareWithConnected = function(mainViewModel, dx, dy, connectedSquareIds) {
	  // Calculate new position for the main square
	  var currentLeft = mainViewModel.x;
	  var currentTop = mainViewModel.y;

	  // Calculate new position within the parent element's bounds
	  var parentRect = this.parentElement.getBoundingClientRect();
	  var newLeft = Math.max(0, Math.min(parentRect.width - this.element.clientWidth, currentLeft + dx));
	  var newTop = Math.max(0, Math.min(parentRect.height - this.element.clientHeight, currentTop + dy));

	  // Calculate the actual delta applied (might be less than requested due to boundary constraints)
	  var appliedDx = newLeft - currentLeft;
	  var appliedDy = newTop - currentTop;

	  // Update the main view model
	  mainViewModel.updatePosition(newLeft, newTop);

	  // Update all connected squares with the same delta
	  connectedSquareIds.forEach(function(squareId) {
		  var square = ChakraApp.appState.getSquare(squareId);
		  if (square) {
			  var connectedLeft = square.x;
			  var connectedTop = square.y;

			  // Calculate new position for the connected square
			  var connectedNewLeft = Math.max(0, Math.min(parentRect.width - 30, connectedLeft + appliedDx));
			  var connectedNewTop = Math.max(0, Math.min(parentRect.height - 30, connectedTop + appliedDy));

			  // Update the connected square position
			  ChakraApp.appState.updateSquare(squareId, {
				  x: connectedNewLeft,
				  y: connectedNewTop
			  });
		  }
	  });
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

// src/views/ConnectionView.js
// View component for Connection

(function(ChakraApp) {
  /**
   * Connection view component
   * @param {Object} viewModel - Connection view model
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.ConnectionView = function(viewModel, parentElement) {
    // Call parent constructor
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    
    // Create the connection element
    this.render();
    
    // Subscribe to view model changes
    this._setupViewModelSubscription();
  };
  
  // Inherit from BaseView
  ChakraApp.ConnectionView.prototype = Object.create(ChakraApp.BaseView.prototype);
  ChakraApp.ConnectionView.prototype.constructor = ChakraApp.ConnectionView;
  
  // Render method
  ChakraApp.ConnectionView.prototype.render = function() {
	  // Create line element
	  this.element = document.createElement('div');
	  this.element.id = this.viewModel.id;
	  this.element.className = 'connection-line';

	  // Apply styling
	  this.element.style.position = 'absolute';
	  this.element.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
	  this.element.style.height = '1px';
	  this.element.style.transformOrigin = 'left center';
	  this.element.style.zIndex = '1';

	  // Set visibility
	  if (!this.viewModel.isVisible) {
		  this.element.style.display = 'none';
	  }

	  // Apply highlight if needed
	  if (this.viewModel.isHighlighted) {
		  this.element.classList.add('connecting-line-highlight');
	  }

	  // Apply multi-select highlight if needed
	  if (this._checkIfMultiSelected()) {
		  this.element.classList.add('connecting-line-multi-selected');
	  }

	  // Calculate and update line position
	  this._updateLinePosition();

	  // Add to parent element
	  this.parentElement.appendChild(this.element);
  };
  
  // Update line position
  // Update line position
  ChakraApp.ConnectionView.prototype._updateLinePosition = function() {
	  // Get the squares
	  var square1 = ChakraApp.appState.getSquare(this.viewModel.sourceId);
	  var square2 = ChakraApp.appState.getSquare(this.viewModel.targetId);

	  if (!square1 || !square2) {
		  this.element.style.display = 'none';
		  return;
	  }

	  // Get the DOM elements for the squares
	  var square1Element = document.querySelector('.square[data-id="' + square1.id + '"]');
	  var square2Element = document.querySelector('.square[data-id="' + square2.id + '"]');

	  if (!square1Element || !square2Element) {
		  this.element.style.display = 'none';
		  return;
	  }

	  // Use square size to calculate centers
	  var squareSize = parseInt(square1Element.style.width) || 30; // Default to 30px
	  var halfSize = squareSize / 2;

	  // Calculate center points of squares (x and y are already the center due to CSS transform)
	  var x1 = square1.x;
	  var y1 = square1.y;
	  var x2 = square2.x;
	  var y2 = square2.y;

	  // Calculate line length and angle using the centers of the squares
	  var dx = x2 - x1;
	  var dy = y2 - y1;
	  var length = Math.sqrt(dx * dx + dy * dy);
	  var angle = Math.atan2(dy, dx) * 180 / Math.PI;

	  // Get max line length from config
	  var maxLineLength = ChakraApp.Config.connections ? 
		  ChakraApp.Config.connections.maxLineLength : 120;

	  // Hide lines that are longer than the specified max length
	  if (length > maxLineLength) {
		  this.element.style.display = 'none';
	  } else {
		  this.element.style.display = 'block';

		  // Position line at center of first square
		  this.element.style.width = length + 'px';
		  this.element.style.left = x1 + 'px';
		  this.element.style.top = y1 + 'px';
		  this.element.style.transform = 'rotate(' + angle + 'deg)';
	  }
  };
  
  // Update view based on model changes
  ChakraApp.ConnectionView.prototype.update = function() {
	  // Update visibility
	  if (!this.viewModel.isVisible) {
		  this.element.style.display = 'none';
		  return;
	  }

	  // Check if both squares are multi-selected
	  var isMultiSelected = this._checkIfMultiSelected();

	  // Update highlight state
	  if (this.viewModel.isHighlighted) {
		  this.element.classList.add('connecting-line-highlight');
	  } else {
		  this.element.classList.remove('connecting-line-highlight');
	  }

	  // Add multi-selected highlighting
	  if (isMultiSelected) {
		  this.element.classList.add('connecting-line-multi-selected');
	  } else {
		  this.element.classList.remove('connecting-line-multi-selected');
	  }

	  // Update position
	  this._updateLinePosition();
  };

  // Add a helper method to check if both endpoints are multi-selected
  ChakraApp.ConnectionView.prototype._checkIfMultiSelected = function() {
	  // If multi-selected squares array doesn't exist, return false
	  if (!ChakraApp.multiSelectedSquares) return false;

	  // Get the source and target IDs
	  var sourceId = this.viewModel.sourceId;
	  var targetId = this.viewModel.targetId;

	  // Check if both squares are in the multi-selected array or are the primary selected square
	  var primarySelectedId = ChakraApp.appState.selectedSquareId;
	  var isSourceSelected = ChakraApp.multiSelectedSquares.includes(sourceId) || sourceId === primarySelectedId;
	  var isTargetSelected = ChakraApp.multiSelectedSquares.includes(targetId) || targetId === primarySelectedId;

	  return isSourceSelected && isTargetSelected;
  };
  
  // Subscribe to view model changes
  ChakraApp.ConnectionView.prototype._setupViewModelSubscription = function() {
	  var self = this;

	  // Subscribe to view model changes
	  this.viewModelSubscription = this.viewModel.subscribe(function(change) {
		  if (change.type === 'update') {
			  self.update();
		  }
	  });

	  // Subscribe to multi-selection events
	  this.multiSelectSubscription = ChakraApp.EventBus.subscribe('SQUARES_MULTI_SELECTED', function() {
		  self.update();
	  });

	  // Subscribe to multi-deselection events
	  this.multiDeselectSubscription = ChakraApp.EventBus.subscribe('SQUARES_MULTI_DESELECTED', function() {
		  self.update();
	  });
  };
  
  
  // Clean up resources
  ChakraApp.ConnectionView.prototype.destroy = function() {
    // Call parent destroy method
    ChakraApp.BaseView.prototype.destroy.call(this);
    
    // Clean up view model subscription
    if (this.viewModelSubscription) {
      this.viewModelSubscription();
    }
  };

  var originalConnectionViewDestroy = ChakraApp.ConnectionView.prototype.destroy;
  ChakraApp.ConnectionView.prototype.destroy = function() {
	  // Call original destroy method
	  originalConnectionViewDestroy.call(this);

	  // Clean up additional subscriptions
	  if (this.multiSelectSubscription) {
		  this.multiSelectSubscription();
	  }

	  if (this.multiDeselectSubscription) {
		  this.multiDeselectSubscription();
	  }
  };
  
})(window.ChakraApp = window.ChakraApp || {});

// src/views/ViewManager.js
// Manages all view components

(function(ChakraApp) {
  /**
   * View manager - coordinates creation and updates of views
   */
  ChakraApp.ViewManager = function() {
    // Reference to DOM containers
    this.zoomContainer = null;
    this.bottomPanel = null;
    this.lineContainer = null;
    
    // Maps to track view instances
    this.circleViews = new Map();
    this.squareViews = new Map();
    this.connectionViews = new Map();
  };
  
  ChakraApp.ViewManager.prototype.init = function() {
    // Get DOM containers
    this.zoomContainer = document.getElementById('zoom-container');
    this.bottomPanel = document.getElementById('bottom-panel');
    
    // Create line container
    this._createLineContainer();
    
    // Set up event listeners
    this._setupEventListeners();
  };
  
  ChakraApp.ViewManager.prototype._createLineContainer = function() {
    // Create container for connection lines
    this.lineContainer = document.createElement('div');
    this.lineContainer.id = 'line-container';
    this.lineContainer.style.position = 'absolute';
    this.lineContainer.style.top = '0';
    this.lineContainer.style.left = '0';
    this.lineContainer.style.width = '100%';
    this.lineContainer.style.height = '100%';
    this.lineContainer.style.pointerEvents = 'none';
    this.lineContainer.style.zIndex = '5';
    
    // Add to bottom panel before any squares (to ensure squares are above lines)
    this.bottomPanel.insertBefore(this.lineContainer, this.bottomPanel.firstChild);
  };
  
  ChakraApp.ViewManager.prototype._setupEventListeners = function() {
  var self = this;
  
  // Listen for circle events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_CREATED, function(circle) {
    // Only create view if circle belongs to selected document or no document selected
    var selectedDocumentId = ChakraApp.appState.selectedDocumentId;
    if (!selectedDocumentId || circle.documentId === selectedDocumentId) {
      self.createCircleView(circle);
    }
  });
  
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_DELETED, function(circle) {
    self.removeCircleView(circle.id);
  });
  
  // Listen for square events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_CREATED, function(square) {
    self.createSquareView(square);
  });
  
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_DELETED, function(square) {
    self.removeSquareView(square.id);
  });
  
  // Listen for connection events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CONNECTION_UPDATED, function(circleId) {
    // When connections are updated, refresh all connection views
    self._updateConnectionViews();
  });
  
  // Listen for state loaded event
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.STATE_LOADED, function() {
    self.renderAllViews();
  });
  
  // Listen for document selection events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_SELECTED, function(doc) {
    // Re-render all views when document is selected
    self.renderAllViews();
  });
  
  // Listen for document deletion events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.DOCUMENT_DELETED, function(doc) {
    // Re-render all views when document is deleted
    self.renderAllViews();
  });
};
  
  /**
   * Create a circle view
   * @param {Circle} circleModel - Circle model
   * @returns {CircleView} The created view
   */
  ChakraApp.ViewManager.prototype.createCircleView = function(circleModel) {
    // Create view model
    var viewModel = new ChakraApp.CircleViewModel(circleModel);
    
    // Create view
    var view = new ChakraApp.CircleView(viewModel, this.zoomContainer);
    
    // Store the view
    this.circleViews.set(circleModel.id, view);
    
    return view;
  };
  
  /**
   * Create a square view
   * @param {Square} squareModel - Square model
   * @returns {SquareView} The created view
   */
  ChakraApp.ViewManager.prototype.createSquareView = function(squareModel) {
    // Create view model
    var viewModel = new ChakraApp.SquareViewModel(squareModel);
    
    // Create view
    var view = new ChakraApp.SquareView(viewModel, this.bottomPanel);
    
    // Store the view
    this.squareViews.set(squareModel.id, view);
    
    return view;
  };
  
  /**
   * Create a connection view
   * @param {Connection} connectionModel - Connection model
   * @returns {ConnectionView} The created view
   */
  ChakraApp.ViewManager.prototype.createConnectionView = function(connectionModel) {
    // Create view model
    var viewModel = new ChakraApp.ConnectionViewModel(connectionModel);
    
    // Create view
    var view = new ChakraApp.ConnectionView(viewModel, this.lineContainer);
    
    // Store the view
    this.connectionViews.set(connectionModel.id, view);
    
    return view;
  };
  
  /**
   * Remove a circle view
   * @param {string} circleId - Circle ID
   */
  ChakraApp.ViewManager.prototype.removeCircleView = function(circleId) {
    var view = this.circleViews.get(circleId);
    if (view) {
      view.destroy();
      this.circleViews.delete(circleId);
    }
  };
  
  /**
   * Remove a square view
   * @param {string} squareId - Square ID
   */
  ChakraApp.ViewManager.prototype.removeSquareView = function(squareId) {
    var view = this.squareViews.get(squareId);
    if (view) {
      view.destroy();
      this.squareViews.delete(squareId);
    }
    
    // Also remove any connection views involving this square
    this._removeConnectionViewsForSquare(squareId);
  };
  
  /**
   * Remove connection views for a square
   * @private
   * @param {string} squareId - Square ID
   */
  ChakraApp.ViewManager.prototype._removeConnectionViewsForSquare = function(squareId) {
    var connectionsToRemove = [];
    
    // Find all connections that involve this square
    this.connectionViews.forEach(function(view, connectionId) {
      if (connectionId.includes(squareId)) {
        connectionsToRemove.push(connectionId);
      }
    });
    
    // Remove the connection views
    var self = this;
    connectionsToRemove.forEach(function(connectionId) {
      var view = self.connectionViews.get(connectionId);
      if (view) {
        view.destroy();
        self.connectionViews.delete(connectionId);
      }
    });
  };
  
  /**
   * Update all connection views
   * @private
   */
  ChakraApp.ViewManager.prototype._updateConnectionViews = function() {
	  // Clear existing connection views
	  var self = this;
	  this.connectionViews.forEach(function(view) {
		  view.destroy();
	  });
	  this.connectionViews.clear();

	  // Verify that the line container is empty
	  if (this.lineContainer) {
		  // Remove all child elements to ensure a clean start
		  while (this.lineContainer.firstChild) {
			  this.lineContainer.removeChild(this.lineContainer.firstChild);
		  }
	  }

	  // Create views for all current connections
	  ChakraApp.appState.connections.forEach(function(connectionModel, connectionId) {
		  // Verify connection belongs to the selected circle before creating view
		  var sourceSquare = ChakraApp.appState.getSquare(connectionModel.sourceId);
		  var targetSquare = ChakraApp.appState.getSquare(connectionModel.targetId);

		  // Only create connection if both squares exist and are visible
		  if (sourceSquare && targetSquare && sourceSquare.visible && targetSquare.visible) {
			  self.createConnectionView(connectionModel);
		  }
	  });
  };
  
  /**
   * Render all views from current state
   */
  ChakraApp.ViewManager.prototype.renderAllViews = function() {
  // Clear existing views
  this.clearAllViews();
  
  var self = this;
  var selectedDocumentId = ChakraApp.appState.selectedDocumentId;
  
  // Create views for circles that belong to the selected document
  ChakraApp.appState.circles.forEach(function(circleModel) {
    // Only render circles for the selected document, or all if no document selected
    if (!selectedDocumentId || circleModel.documentId === selectedDocumentId) {
      self.createCircleView(circleModel);
    }
  });
  
  // Create views for squares
  ChakraApp.appState.squares.forEach(function(squareModel) {
    self.createSquareView(squareModel);
  });
  
  // Create views for connections
  ChakraApp.appState.connections.forEach(function(connectionModel) {
    self.createConnectionView(connectionModel);
  });
};
  
  /**
   * Clear all views
   */
  ChakraApp.ViewManager.prototype.clearAllViews = function() {
    var self = this;
    
    // Destroy all circle views
    this.circleViews.forEach(function(view) {
      view.destroy();
    });
    this.circleViews.clear();
    
    // Destroy all square views
    this.squareViews.forEach(function(view) {
      view.destroy();
    });
    this.squareViews.clear();
    
    // Destroy all connection views
    this.connectionViews.forEach(function(view) {
      view.destroy();
    });
    this.connectionViews.clear();
  };
  
  ChakraApp.ViewManager.prototype.destroy = function() {
    // Clean up all views
    this.clearAllViews();
    
    // Remove event listeners
    // (If we had stored references to event subscriptions)
  };
  
})(window.ChakraApp = window.ChakraApp || {});

