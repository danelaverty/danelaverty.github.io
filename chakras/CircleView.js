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

			  // Calculate raw position - no adjustment needed
			  var newX = (e.clientX - containerRect.left);
			  var newY = (e.clientY - containerRect.top);

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
