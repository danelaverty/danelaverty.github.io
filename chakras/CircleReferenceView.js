// src/views/CircleReferenceView.js
// View for circle references

(function(ChakraApp) {
  /**
   * Circle Reference View
   * @param {Object} viewModel - Circle reference view model
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.CircleReferenceView = function(viewModel, parentElement) {
    // Call parent constructor
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    
    // Track dragging state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    
    // Create the circle reference element
    this.render();
    
    // Subscribe to view model changes
    this._setupViewModelSubscription();
  };
  
  // Inherit from BaseView
  ChakraApp.CircleReferenceView.prototype = Object.create(ChakraApp.BaseView.prototype);
  ChakraApp.CircleReferenceView.prototype.constructor = ChakraApp.CircleReferenceView;
  
  // Render method
  ChakraApp.CircleReferenceView.prototype.render = function() {
  // Create circle reference element (container)
  this.element = this._createElement('div', {
    className: 'circle-reference' + (this.viewModel.isSelected ? ' selected' : '') + (!this.viewModel.isValid ? ' invalid' : ''),
    dataset: {
      id: this.viewModel.id,
      sourceCircleId: this.viewModel.sourceCircleId,
      type: 'circle-reference'
    },
    style: {
      position: 'absolute',
      left: this.viewModel.x + 'px',
      top: this.viewModel.y + 'px',
      width: '30px',
      height: '30px',
      cursor: 'pointer',
      userSelect: 'none',
      zIndex: '10',
      transition: 'all 0.2s ease'
    }
  });
  
  // Render the appropriate shape using existing renderers
  this._renderShapeUsingExistingRenderers();
  
  // Create name element
  this.nameElement = this._createElement('div', {
    className: 'item-name',
    contentEditable: false,
    textContent: this.viewModel.name,
    style: {
      position: 'absolute',
      top: '120%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'white',
      fontSize: '11px',
      background: 'rgba(0, 0, 0, 0.7)',
      border: 'none',
      textAlign: 'center',
      outline: 'none',
      padding: '3px 5px',
      borderRadius: '3px',
      zIndex: '25',
      whiteSpace: 'nowrap',
      cursor: 'default',
      userSelect: 'text',
      boxSizing: 'border-box',
      maxHeight: 'none',
      spellcheck: false,
      WebkitSpellcheck: false
    }
  });
  
  this.element.appendChild(this.nameElement);
  
  // Update tooltip and selection state
  this.element.title = this.viewModel.name + (this.viewModel.isValid ? '' : ' [Deleted]');
  this._updateSelectionState();
  
  // Add event handlers
  this._addEventHandlers();
  
  // Add to parent element
  this.parentElement.appendChild(this.element);
};

ChakraApp.CircleReferenceView.prototype._renderShapeUsingExistingRenderers = function() {
  // Get the source circle to determine its type
  var sourceCircle = ChakraApp.appState.getCircle(this.viewModel.sourceCircleId);
  var circleType = sourceCircle ? sourceCircle.circleType : 'standard';
  
  console.log('Rendering circle reference shape for type:', circleType);
  
  // Create a mock circle view that has the properties the renderers expect
  var mockCircleView = this._createMockCircleView();
  
  // Use the appropriate existing renderer
  switch (circleType) {
    case 'triangle':
      ChakraApp.TriangleRenderer.render(mockCircleView);
      break;
    case 'gem':
      ChakraApp.GemRenderer.render(mockCircleView);
      break;
    case 'star':
      ChakraApp.SimpleShapeRenderer.renderStar(mockCircleView);
      break;
    case 'hexagon':
      ChakraApp.SimpleShapeRenderer.renderHexagon(mockCircleView);
      break;
    case 'standard':
    default:
      ChakraApp.StandardCircleRenderer.renderSimpleGlow(mockCircleView);
      break;
  }
  
  // Scale and adjust the rendered shape for circle reference size
  this._adjustShapeForReference(circleType);
};

ChakraApp.CircleReferenceView.prototype._createMockCircleView = function() {
  var self = this;
  
  // Create a mock circle view that provides the interface the renderers expect
  var mockCircleView = {
    // Properties the renderers need
    viewModel: {
      color: this.viewModel.color,
      circleType: this.viewModel.circleType,
      characteristics: { completion: 'level2' }, // Default to full completion for references
      chakraForm: [] // Empty chakra form for references
    },
    element: this.element,
    parentElement: this.element,
    
    // Methods the renderers use
    _createElement: function(tagName, options) {
      return self._createElement(tagName, options);
    },
    
    createShapeWrap: function(className) {
      this.shapeWrap = self._createElement('div', {
        className: className || 'shape-wrap',
        style: { 
          position: 'absolute',
          width: '30px',
          height: '30px'
        }
      });
      return this.shapeWrap;
    },
    
    createShapeElement: function(className, styles) {
      var element = self._createElement('div', {
        className: className,
        style: styles
      });
      this.shapeWrap.appendChild(element);
      return element;
    },
    
    appendShapeToElement: function() {
      self.element.appendChild(this.shapeWrap);
    },
    
    getBaseShapeStyles: function(color) {
      return {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: color || this.viewModel.color,
        transition: 'transform 0.3s ease'
      };
    }
  };
  
  return mockCircleView;
};

ChakraApp.CircleReferenceView.prototype._adjustShapeForReference = function(circleType) {
  // Find the shape elements and scale them appropriately for circle references
  var shapes = this.element.querySelectorAll('.shape-wrap, .triangle-wrap, .gem-wrap, .star-wrap, .hexagon-wrap');
  
  for (var i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    
    // Apply reference-specific scaling and positioning
    var currentTransform = shape.style.transform || '';
    
    switch (circleType) {
      case 'triangle':
        // Scale down triangles and center them
        shape.style.transform = 'translate(-50%, -50%) ' + currentTransform;
        shape.style.left = '50%';
        shape.style.top = '70%';
        break;
        
      case 'gem':
        // Gems are already sized well, just center them
        shape.style.transform = 'translate(-50%, -50%) ' + currentTransform;
        shape.style.left = '50%';
        shape.style.top = '70%';
        break;
        
      case 'star':
      case 'hexagon':
        // Scale and center other shapes
        shape.style.transform = currentTransform;
        shape.style.left = '50%';
        shape.style.top = '70%';
        break;
        
      case 'standard':
      default:
        // Standard circles (glow elements)
        var glowElements = this.element.querySelectorAll('.circle-glow');
        for (var j = 0; j < glowElements.length; j++) {
          glowElements[j].style.width = '30px';
          glowElements[j].style.height = '30px';
          glowElements[j].style.borderRadius = '50%';
          glowElements[j].style.position = 'absolute';
          glowElements[j].style.left = '0';
          glowElements[j].style.top = '0';
        }
        break;
    }
  }
  
  // Remove any click handlers that the renderers might have added
  // since we want our own click handling for circle references
  this._removeRendererClickHandlers();
};

ChakraApp.CircleReferenceView.prototype._removeRendererClickHandlers = function() {
  // Remove event listeners that the shape renderers might have added
  var clickableElements = this.element.querySelectorAll('[style*="cursor: pointer"], .shape-wrap');
  
  for (var i = 0; i < clickableElements.length; i++) {
    var elem = clickableElements[i];
    // Clone the element to remove all event listeners
    var newElem = elem.cloneNode(true);
    if (elem.parentNode) {
      elem.parentNode.replaceChild(newElem, elem);
    }
  }
};
  
  /**
   * Add event handlers
   * @private
   */
  ChakraApp.CircleReferenceView.prototype._addEventHandlers = function() {
    var self = this;
    
    // Click handler
    this.element.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (!self.isDragging) {
        // Select this circle reference
        ChakraApp.appState.selectCircleReference(self.viewModel.id);
      }
    });
    
    // Double-click handler (navigate to source circle)
    this.element.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      
      if (self.viewModel.isValid) {
        var sourceCircle = self.viewModel.getSourceCircle();
        if (sourceCircle) {
          // Select the source circle
          ChakraApp.appState.selectCircle(sourceCircle.id);
        }
      }
    });
    
    // Mouse down - start drag
    this.element.addEventListener('mousedown', function(e) {
  e.preventDefault();
  e.stopPropagation();
  
  self.isDragging = false;
  self.dragStartX = e.clientX;
  self.dragStartY = e.clientY;
  
  var startLeft = self.viewModel.x;
  var startTop = self.viewModel.y;
  
  function onMouseMove(e) {
    var dx = e.clientX - self.dragStartX;
    var dy = e.clientY - self.dragStartY;
    
    // If we've moved enough, start dragging
    if (!self.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      self.isDragging = true;
      self.element.classList.add('dragging');
      // ADD THIS LINE: Disable transitions during drag
      self.element.classList.add('no-transition');
    }
    
    if (self.isDragging) {
      self.viewModel.updatePosition(startLeft + dx, startTop + dy);
    }
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    if (self.isDragging) {
      self.element.classList.remove('dragging');
      // ADD THIS LINE: Re-enable transitions after drag
      self.element.classList.remove('no-transition');
      ChakraApp.appState.saveToStorageNow();
    }
    
    // Reset dragging state after a short delay to prevent click from firing
    setTimeout(function() {
      self.isDragging = false;
    }, 10);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});
  };
  
  /**
   * Update view based on model changes
   */
ChakraApp.CircleReferenceView.prototype.update = function() {
  if (!this.element) return;
  
  console.log('Circle reference view updating with color:', this.viewModel.color, 'and name:', this.viewModel.name);
  
  // Update position
  this.element.style.left = this.viewModel.x + 'px';
  this.element.style.top = this.viewModel.y + 'px';
  
  // Update shape colors using existing renderer update methods
  this._updateShapeColorsUsingRenderers();
  
  // Update name
  if (this.nameElement) {
    this.nameElement.textContent = this.viewModel.name;
  }
  
  // Update tooltip
  this.element.title = this.viewModel.name + (this.viewModel.isValid ? '' : ' [Deleted]');
  
  // Update validity classes
  if (this.viewModel.isValid) {
    this.element.classList.remove('invalid');
  } else {
    this.element.classList.add('invalid');
  }
  
  // Update selection state
  this._updateSelectionState();
};

ChakraApp.CircleReferenceView.prototype._updateShapeColorsUsingRenderers = function() {
  var sourceCircle = ChakraApp.appState.getCircle(this.viewModel.sourceCircleId);
  var circleType = sourceCircle ? sourceCircle.circleType : 'standard';
  
  // Create mock circle view for color updates
  var mockCircleView = this._createMockCircleView();
  
  // Find the shape elements in our reference
  mockCircleView.triangleShape = this.element.querySelector('.triangle-shape');
  mockCircleView.pyramidSide = this.element.querySelector('.pyramid-side');
  mockCircleView.starShape = this.element.querySelector('.star-shape');
  mockCircleView.hexagonShape = this.element.querySelector('.hexagon-shape');
  mockCircleView.hexagonShape2 = this.element.querySelectorAll('.hexagon-shape')[1];
  mockCircleView.glowElement = this.element.querySelector('.circle-glow');
  mockCircleView.shapeWrap = this.element.querySelector('.shape-wrap');
  
  // Use existing renderer color update methods
  switch (circleType) {
    case 'standard':
      ChakraApp.StandardCircleRenderer.updateColors(mockCircleView);
      break;
    case 'triangle':
      // Triangle color updating is handled in CircleView.updateColors
      if (mockCircleView.triangleShape) {
        mockCircleView.triangleShape.style.backgroundColor = this.viewModel.color;
      }
      if (mockCircleView.pyramidSide) {
        mockCircleView.pyramidSide.style.backgroundColor = ChakraApp.ColorUtils.createDarkerShade(this.viewModel.color);
      }
      break;
    case 'star':
    case 'hexagon':
      ChakraApp.SimpleShapeRenderer.updateColors(mockCircleView);
      break;
    case 'gem':
      // Gem color updating (complex SVG updating)
      var svg = this.element.querySelector('svg');
      if (svg) {
        var baseColor = this.viewModel.color;
        var darkerColor = ChakraApp.ColorUtils.createDarkerShade(baseColor);
        var lighterColor = ChakraApp.ColorUtils.createLighterShade(baseColor);
        
        var polygons = svg.querySelectorAll('polygon');
        for (var i = 0; i < polygons.length; i++) {
          var color = (i === 0) ? lighterColor : 
                     (i % 2 === 1) ? baseColor : darkerColor;
          
          if (!polygons[i].getAttribute('fill').startsWith('url(#')) {
            polygons[i].setAttribute('fill', color);
          }
          
          if (polygons[i].hasAttribute('stroke')) {
            polygons[i].setAttribute('stroke', lighterColor);
          }
        }
      }
      break;
  }
};

// Update the selection state method
ChakraApp.CircleReferenceView.prototype._updateSelectionState = function() {
  if (this.viewModel.isSelected) {
    this.element.classList.add('selected');
    this.element.style.boxShadow = '0 0 8px 2px rgba(255, 255, 255, 0.6)';
  } else {
    this.element.classList.remove('selected');
    this.element.style.boxShadow = 'none';
  }
};
  
  /**
   * Set up view model subscriptions
   * @private
   */
ChakraApp.CircleReferenceView.prototype._setupViewModelSubscription = function() {
  // Call parent method
  ChakraApp.BaseView.prototype._setupViewModelSubscription.call(this);
  
  var self = this;
  
  // Additional subscription for updates that need special handling
  if (this.viewModel && typeof this.viewModel.subscribe === 'function') {
    this._addHandler(this.viewModel.subscribe(function(change) {
      if (change.type === 'update') {
        self.update();
      }
    }));
  }
  
  // ADDITIONAL: Direct subscription to circle updates for immediate color changes
  this.circleUpdateSubscription = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.CIRCLE_UPDATED,
    function(circle) {
      if (circle.id === self.viewModel.sourceCircleId) {
        // Force update the view model's display properties
        self.viewModel._updateDisplayProperties();
        // Immediately update the view
        self.update();
      }
    }
  );
  
  // Store the subscription for cleanup
  this._addHandler(this.circleUpdateSubscription);
};
  
})(window.ChakraApp = window.ChakraApp || {});
