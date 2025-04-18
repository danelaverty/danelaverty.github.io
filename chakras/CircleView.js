// src/views/CircleView.js
// Modified to display triangles and stars in specific panels

(function(ChakraApp) {
  /**
   * Circle view component
   * @param {Object} viewModel - Circle view model
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.CircleView = function(viewModel, parentElement) {
    // Call parent constructor
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    
    // Store panel ID for shape-specific rendering
    this.panelId = parentElement ? parentElement.getAttribute('data-panel-id') : null;
    if (this.parentElement && !this.parentElement.style.position) {
	    this.parentElement.style.position = 'relative';
    }
    
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
    this.element = this._createElement('div', {
      className: 'circle',
      dataset: { id: this.viewModel.id },
      style: {
        width: this.viewModel.size + 'px',
        height: this.viewModel.size + 'px',
        left: this.viewModel.x + 'px',
        top: this.viewModel.y + 'px'
      }
    });

    // Add panel-specific class if needed
    if (this.panelId) {
      this.element.classList.add('circle-' + this.panelId);
    }

    // Get concept type for this panel
    var conceptType = this._getConceptTypeForPanel();

    // Render appropriate shape based on concept type or panel ID
    if (conceptType) {
      switch (conceptType.shape) {
        case 'triangle':
          this._renderTriangle();
          break;
        case 'star':
          this._renderStar();
          break;
        case 'hexagon':
          this._renderHexagon();
          break;
        case 'oval':
          this._renderOval();
          break;
        case 'diamond':
          this._renderDiamond();
          break;
        default:
          this._renderStandardCircle();
          break;
      }
    } else {
      // Fallback to panel ID-based rendering (for backward compatibility)
      {
        this._renderStandardCircle();
      }
    }
    
    // Create name input (for all shapes)
    this.nameElement = this._createElement('div', {
      className: 'item-name',
      contentEditable: true,
      textContent: this.viewModel.name
    });
    this.element.appendChild(this.nameElement);

    // Create closest square indicator
    this.closestIndicator = this._createElement('div', {
      className: 'closest-square-indicator',
      style: { display: this.viewModel.closestSquareName ? '' : 'none' },
      textContent: this.viewModel.closestSquareName || ''
    });
    this.element.appendChild(this.closestIndicator);

    // Apply selection state
    if (this.viewModel.isSelected) {
      this.element.classList.add('selected');
    }

    // Add to parent element
    this.parentElement.appendChild(this.element);
  };

  ChakraApp.CircleView.prototype._getConceptTypeForPanel = function() {
    // Ensure concept types are defined
    if (!ChakraApp.Config.conceptTypes) return null;
    
    // Try to get concept type from panel's data attribute
    if (this.panelId && this.parentElement) {
      var panel = this.parentElement.closest('.circle-panel');
      if (panel && panel.dataset.conceptType) {
        var conceptTypeId = panel.dataset.conceptType;
        
        // Find matching concept type
        return ChakraApp.Config.conceptTypes.find(function(type) {
          return type.id === conceptTypeId;
        });
      }
    }
    
    // Fallback: try to match by panel ID
    if (this.panelId) {
      return ChakraApp.Config.conceptTypes.find(function(type) {
        return type.panelId === this.panelId;
      }, this);
    }
    
    return null;
  };

  // Render triangle shape for right panel
  ChakraApp.CircleView.prototype._renderTriangle = function() {
    // Create triangle shape
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape',
      style: {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: this.viewModel.color,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', // Equilateral triangle
        transition: 'transform 0.3s ease',
	    transform: 'translate(-50%, -50%)',
      }
    });

    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap',
      style: {
        position: 'absolute',
      }
    });
    
    // Create element symbol if circle has an element
    if (this.viewModel.element && ChakraApp.Config.elements[this.viewModel.element]) {
      this.elementSymbol = this._createElement('div', {
        className: 'circle-element-symbol',
        textContent: ChakraApp.Config.elements[this.viewModel.element].emoji
      });
      this.element.appendChild(this.elementSymbol);
    }
    
    this.shapeWrap.appendChild(this.triangleShape);
    this.element.appendChild(this.shapeWrap);
  };

  // Render hexagon shape for concepts panel
  ChakraApp.CircleView.prototype._renderHexagon = function() {
    // Create hexagon shape
    this.hexagonShape = this._createElement('div', {
      className: 'hexagon-shape',
      style: {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: this.viewModel.color,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        transition: 'transform 0.3s ease',
        transform: 'translate(-50%, -50%)',
      }
    });
    
    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap',
      style: {
        position: 'absolute',
      }
    });
    
    // Create element symbol if circle has an element
    if (this.viewModel.element && ChakraApp.Config.elements && ChakraApp.Config.elements[this.viewModel.element]) {
      this.elementSymbol = this._createElement('div', {
        className: 'circle-element-symbol',
        textContent: ChakraApp.Config.elements[this.viewModel.element].emoji
      });
      this.element.appendChild(this.elementSymbol);
    }
    
    this.shapeWrap.appendChild(this.hexagonShape);
    this.element.appendChild(this.shapeWrap);
  };

  // Render oval shape for people panel
  ChakraApp.CircleView.prototype._renderOval = function() {
    // Create oval shape
    this.ovalShape = this._createElement('div', {
      className: 'oval-shape',
      style: {
        position: 'absolute',
        width: '30px',
        height: '20px',
        backgroundColor: this.viewModel.color,
        borderRadius: '50%',
        transition: 'transform 0.3s ease',
        transform: 'translate(-50%, -50%)',
      }
    });
    
    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap',
      style: {
        position: 'absolute',
      }
    });
    
    // Create element symbol if circle has an element
    if (this.viewModel.element && ChakraApp.Config.elements && ChakraApp.Config.elements[this.viewModel.element]) {
      this.elementSymbol = this._createElement('div', {
        className: 'circle-element-symbol',
        textContent: ChakraApp.Config.elements[this.viewModel.element].emoji
      });
      this.element.appendChild(this.elementSymbol);
    }
    
    this.shapeWrap.appendChild(this.ovalShape);
    this.element.appendChild(this.shapeWrap);
  };

  // Render diamond shape for events panel
  ChakraApp.CircleView.prototype._renderDiamond = function() {
    // Create diamond shape
    this.diamondShape = this._createElement('div', {
      className: 'diamond-shape',
      style: {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: this.viewModel.color,
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        transition: 'transform 0.3s ease',
        transform: 'translate(-50%, -50%)',
      }
    });
    
    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap',
      style: {
        position: 'absolute',
      }
    });
    
    // Create element symbol if circle has an element
    if (this.viewModel.element && ChakraApp.Config.elements && ChakraApp.Config.elements[this.viewModel.element]) {
      this.elementSymbol = this._createElement('div', {
        className: 'circle-element-symbol',
        textContent: ChakraApp.Config.elements[this.viewModel.element].emoji
      });
      this.element.appendChild(this.elementSymbol);
    }
    
    this.shapeWrap.appendChild(this.diamondShape);
    this.element.appendChild(this.shapeWrap);
  };

  ChakraApp.CircleView.prototype._renderStar = function() {
    // Create star shape
    this.starShape = this._createElement('div', {
      className: 'star-shape',
      style: {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: this.viewModel.color,
        // 5-pointed star
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        transition: 'transform 0.3s ease',
	    transform: 'translate(-50%, -50%)',
      }
    });
    
    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap',
      style: {
        position: 'absolute',
      }
    });

    // Create element symbol if circle has an element
    if (this.viewModel.element && ChakraApp.Config.elements[this.viewModel.element]) {
      this.elementSymbol = this._createElement('div', {
        className: 'circle-element-symbol',
        textContent: ChakraApp.Config.elements[this.viewModel.element].emoji
      });
      this.element.appendChild(this.elementSymbol);
    }
    
    this.shapeWrap.appendChild(this.starShape);
    this.element.appendChild(this.shapeWrap);
  };
  
  // Standard circle rendering with glow and particles
  ChakraApp.CircleView.prototype._renderStandardCircle = function() {
    // Create the glowing background
    this.glowElement = this._createElement('div', {
      className: 'circle-glow',
      style: { backgroundColor: this.viewModel.color }
    });
    this.element.appendChild(this.glowElement);

    // Create particles
    this._createParticles();

    // Create chakra form
    this._createChakraForm();

    // Create element symbol
    this._createElementSymbol();
  };
  
  // Helper methods (unchanged)
  ChakraApp.CircleView.prototype._createParticles = function() {
    var particlesElement = this._createElement('div', { className: 'particles' });
    
    // Create first angle element
    var angleElement1 = this._createElement('div', { className: 'angle' });
    var positionElement1 = this._createElement('div', { className: 'position' });
    var pulseElement1 = this._createElement('div', { className: 'pulse' });
    var particleElement1 = this._createElement('div', {
      className: 'particle',
      style: { backgroundColor: this.viewModel.color }
    });
    
    pulseElement1.appendChild(particleElement1);
    positionElement1.appendChild(pulseElement1);
    angleElement1.appendChild(positionElement1);
    particlesElement.appendChild(angleElement1);
    
    // Create second angle element
    var angleElement2 = this._createElement('div', { className: 'angle' });
    var positionElement2 = this._createElement('div', { className: 'position' });
    var pulseElement2 = this._createElement('div', { className: 'pulse' });
    var particleElement2 = this._createElement('div', {
      className: 'particle',
      style: { backgroundColor: this.viewModel.color }
    });
    
    pulseElement2.appendChild(particleElement2);
    positionElement2.appendChild(pulseElement2);
    angleElement2.appendChild(positionElement2);
    particlesElement.appendChild(angleElement2);
    
    this.element.appendChild(particlesElement);
  };
  
  ChakraApp.CircleView.prototype._createChakraForm = function() {
    // Get the chakra form
    var chakraForm = this.viewModel.chakraForm;
    
    // Create outer container
    var outerPolygonContainer = this._createElement('div', {
      className: 'outer-polygon-container'
    });
    
    // Create the chakra form shapes
    for (var i = 0; i < chakraForm.length; i++) {
      var form = chakraForm[i];
      
      var innerPolygonContainer = this._createElement('div', {
        className: 'inner-polygon-container',
        style: { 
          transform: 'rotate(' + (form.rotate || 0) + 'deg) scale(' + (form.scale || 1) + ')'
        }
      });
      
      var innermostPolygonContainer = this._createElement('div', {
        className: 'inner-polygon-container',
        style: {
          filter: 'drop-shadow(0 0 3px #AAA)',
          mixBlendMode: 'screen',
          animation: (form.reverse ? 'anglerev' : 'angle') + ' ' + 
                    (form.spinTime || 16) + 's linear infinite'
        }
      });
      
      var shapeElement = this._createElement('div', {
        className: 'shape',
        style: {
          clipPath: ChakraApp.Utils.getPolyPoints(
            form.sides, 
            form.starFactor, 
            form.borderPercent
          )
        }
      });
      
      innermostPolygonContainer.appendChild(shapeElement);
      innerPolygonContainer.appendChild(innermostPolygonContainer);
      outerPolygonContainer.appendChild(innerPolygonContainer);
    }
    
    this.element.appendChild(outerPolygonContainer);
  };
  
  ChakraApp.CircleView.prototype._createElementSymbol = function() {
    this.elementSymbol = this._createElement('div', {
      className: 'circle-element-symbol',
      style: { display: 'none' }
    });

    // Set symbol if circle has an element
    if (this.viewModel.element && ChakraApp.Config.elements[this.viewModel.element]) {
      this.elementSymbol.textContent = ChakraApp.Config.elements[this.viewModel.element].emoji;
      this.elementSymbol.style.display = '';
    }

    this.element.appendChild(this.elementSymbol);
  };
  
  // Update view based on model changes
  ChakraApp.CircleView.prototype.update = function() {
    // Update position
    this.element.style.left = this.viewModel.x + 'px';
    this.element.style.top = this.viewModel.y + 'px';

    // Update color based on panel type
    if (this.glowElement) {
      // Standard circle
      this.glowElement.style.backgroundColor = this.viewModel.color;
      
      // Update particles
      var particles = this.element.querySelectorAll('.particle');
      for (var i = 0; i < particles.length; i++) {
        particles[i].style.backgroundColor = this.viewModel.color;
      }
    }

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
    this.element.classList.toggle('selected', this.viewModel.isSelected);
    
    // Update dimming state
    this.element.classList.toggle('dimmed', this.viewModel.isDimmed);

    // Update chakra form if needed (only for standard circles)
    if (this.viewModel.squareCountChanged && this.panelId == 'left') {
      this._updateChakraForm();
    }
  };
  
  ChakraApp.CircleView.prototype._updateChakraForm = function() {
    // Only for standard circles
    if (this.panelId != 'left') return;
    
    // Remove existing container
    var existingContainer = this.element.querySelector('.outer-polygon-container');
    if (existingContainer) {
      this.element.removeChild(existingContainer);
    }
    
    // Create new chakra form
    this._createChakraForm();
  };
  
  // Set up event listeners
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
    if (e.target === self.element || 
        e.target === self.triangleShape || 
        e.target === self.starShape || 
        e.target === self.hexagonShape ||  // Add new shape types
        e.target === self.ovalShape || 
        e.target === self.diamondShape ||
        e.target === self.glowElement) {
      e.preventDefault();
      isDragging = true;
      window.wasDragged = false;

      // Disable transitions while dragging
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
      var zoomContainer = self.parentElement;
      var containerRect = zoomContainer.getBoundingClientRect();

      // Calculate raw position with bounds checking
      var newX = Math.max(0, Math.min(containerRect.width, e.clientX - containerRect.left));
      var newY = Math.max(0, Math.min(containerRect.height, e.clientY - containerRect.top));

      // Set position directly on DOM element
      self.element.style.left = newX + 'px';
      self.element.style.top = newY + 'px';

      // Handle meridian snap if in left panel
      var panelId = zoomContainer.getAttribute('data-panel-id');
      if (panelId === 'left') {
        // Check for meridian snap
        var meridianX = ChakraApp.Config.meridian.x;
        var distanceToMeridian = Math.abs(newX - meridianX);

        if (distanceToMeridian < ChakraApp.Config.meridian.snapThreshold) {
          // Snap to meridian
          self.element.style.left = meridianX + 'px';
          self.element.classList.add('snapping');
        } else {
          self.element.classList.remove('snapping');
        }
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
  this._addHandler(function() {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  });
};
})(window.ChakraApp = window.ChakraApp || {});
