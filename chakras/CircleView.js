(function(ChakraApp) {
  ChakraApp.CircleView = function(viewModel, parentElement) {
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    this.panelId = this.extractPanelId();
    this.setParentPositionIfNeeded();
    this.render();
    this._setupViewModelSubscription();
    this._setupEventListeners();
  };
  
  ChakraApp.CircleView.prototype = Object.create(ChakraApp.BaseView.prototype);
  ChakraApp.CircleView.prototype.constructor = ChakraApp.CircleView;
  
  ChakraApp.CircleView.prototype.extractPanelId = function() {
    return this.parentElement ? this.parentElement.getAttribute('data-panel-id') : null;
  };
  
  ChakraApp.CircleView.prototype.setParentPositionIfNeeded = function() {
    if (this.parentElement && !this.parentElement.style.position) {
      this.parentElement.style.position = 'relative';
    }
  };
  
  ChakraApp.CircleView.prototype.render = function() {
    this.createMainElement();
    this.addPanelSpecificClass();
    this.renderShapeBasedOnConcept();
    this.addNameElement();
    this.applySelectionState();
    this.addToParent();
  };

  ChakraApp.CircleView.prototype.createMainElement = function() {
    this.element = this._createElement('div', {
      className: 'circle',
      dataset: { id: this.viewModel.id },
      style: this.getMainElementStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getMainElementStyles = function() {
    return {
      width: this.viewModel.size + 'px',
      height: this.viewModel.size + 'px',
      left: this.viewModel.x + 'px',
      top: this.viewModel.y + 'px'
    };
  };

  ChakraApp.CircleView.prototype.addPanelSpecificClass = function() {
    if (this.panelId) {
      this.element.classList.add('circle-' + this.panelId);
    }
  };

  ChakraApp.CircleView.prototype._renderGem = function() {
  ChakraApp.GemRenderer.render(this);
};

ChakraApp.CircleView.prototype.renderShapeBasedOnType = function() {
  var circleType = this.viewModel.circleType;
  
  switch (circleType) {
    case 'triangle':
      this._renderTriangle();
      break;
    case 'gem':
      this._renderGem();
      break;
    case 'star':
      this._renderStar();
      break;
    case 'hexagon':
      this._renderHexagon();  // Add this case
      break;
    case 'standard':
    default:
      this._renderStandardCircle();
      break;
  }
};



ChakraApp.CircleView.prototype.renderShapeBasedOnConcept = function() {
  var conceptType = this._getConceptTypeForCircle();
  
  // Get the circle's document
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  var docPanelId = doc ? doc.panelId : null;
  
  // DIRECT CHECK: Check for each circle type
  if (this.viewModel.circleType === 'triangle') {
    this._renderTriangle();
    return;
  } else if (this.viewModel.circleType === 'gem') {
    this._renderGem();
    return;
  } else if (this.viewModel.circleType === 'star') {
    this._renderStar();
    return;
  } else if (this.viewModel.circleType === 'hexagon') {
    this._renderHexagon();  // Add this case
    return;
  } else if (this.viewModel.circleType === 'standard') {
    this._renderStandardCircle();
    return;
  }
  
  // Rest of the original logic...
  if (conceptType) {
    if (conceptType.shape === 'triangle' && docPanelId === 'things') {
      this._renderTriangle();
    } else {
      this.renderShapeByType(conceptType.shape);
    }
  } else {
    this._renderStandardCircle();
  }
};
  
ChakraApp.CircleView.prototype.renderShapeByType = function(shapeType) {
  var shapeRenderers = {
    'triangle': this._renderTriangle,
    'star': this._renderStar,
    'hexagon': this._renderHexagon,
    'oval': this._renderOval,
    'diamond': this._renderDiamond
  };
  
  var renderMethod = shapeRenderers[shapeType] || this._renderStandardCircle;
  renderMethod.call(this);
  
  // Ensure all shapes have click handlers
  this._ensureShapeClickHandler();
};

ChakraApp.CircleView.prototype._ensureShapeClickHandler = function() {
  var self = this;
  
  // Only add click handler if we have a shape wrap and it doesn't already have one
  if (this.shapeWrap) {
    // Remove existing handlers to avoid duplicates
    var newShapeWrap = this.shapeWrap.cloneNode(true);
    if (this.shapeWrap.parentNode) {
      this.shapeWrap.parentNode.replaceChild(newShapeWrap, this.shapeWrap);
    }
    this.shapeWrap = newShapeWrap;
    
    // Add click handler
    this.shapeWrap.style.cursor = "pointer";
    this.shapeWrap.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!window.wasDragged) {
        self._handleCircleClick();
      }
    });
  }
};

  ChakraApp.CircleView.prototype.addNameElement = function() {
    this.nameElement = this._createElement('div', {
      className: 'item-name',
      contentEditable: true,
      textContent: this.viewModel.name,
      style: {
	    color: ChakraApp.appState.getDocument(ChakraApp.appState.circles.get(this.viewModel.id).documentId).panelId == 'things' ? '#88B66d' : 'white',
      }
    });
    this.element.appendChild(this.nameElement);
  };

  ChakraApp.CircleView.prototype.applySelectionState = function() {
    if (this.viewModel.isSelected) {
      this.element.classList.add('selected');
    }
  };

  ChakraApp.CircleView.prototype.addToParent = function() {
    this.parentElement.appendChild(this.element);
  };

  ChakraApp.CircleView.prototype._getConceptTypeForCircle = function() {
    if (!this.ensureConceptTypesExist()) return null;
    var panelId = ChakraApp.appState.getDocument(this.viewModel.documentId).panelId
    var conceptType = this.getConceptTypeByPanelId(panelId);
    return conceptType;
  };
  
  ChakraApp.CircleView.prototype._getConceptTypeForPanel = function() {
    if (!this.ensureConceptTypesExist()) return null;
    
    var conceptType = this.getConceptTypeFromDataAttribute();
    if (conceptType) return conceptType;
    
    return this.getConceptTypeByPanelId();
  };
  
  ChakraApp.CircleView.prototype.ensureConceptTypesExist = function() {
    return !!ChakraApp.Config.conceptTypes;
  };
  
  ChakraApp.CircleView.prototype.getConceptTypeFromDataAttribute = function() {
    if (this.panelId && this.parentElement) {
      var panel = this.parentElement.closest('.circle-panel');
      if (panel && panel.dataset.conceptType) {
        var conceptTypeId = panel.dataset.conceptType;
        return this.findConceptTypeById(conceptTypeId);
      }
    }
    return null;
  };
  
  ChakraApp.CircleView.prototype.findConceptTypeById = function(conceptTypeId) {
    return ChakraApp.Config.conceptTypes.find(function(type) {
      return type.id === conceptTypeId;
    });
  };
  
  ChakraApp.CircleView.prototype.getConceptTypeByPanelId = function(panelId) {
	  if (!panelId) { panelId = this.panelId };
    if (panelId) {
      return ChakraApp.Config.conceptTypes.find(function(type) {
        return type.id === panelId;
      }, this);
    }
    return null;
  };

  // Shared shape rendering utilities
  ChakraApp.CircleView.prototype.createShapeWrap = function(className) {
    this.shapeWrap = this._createElement('div', {
      className: className || 'shape-wrap',
      style: { position: 'absolute' }
    });
    return this.shapeWrap;
  };
  
  ChakraApp.CircleView.prototype.createShapeElement = function(className, styles) {
    var element = this._createElement('div', {
      className: className,
      style: styles
    });
    this.shapeWrap.appendChild(element);
    return element;
  };
  
  ChakraApp.CircleView.prototype.appendShapeToElement = function() {
    this.element.appendChild(this.shapeWrap);
  };
  
  ChakraApp.CircleView.prototype.getBaseShapeStyles = function(color) {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      backgroundColor: color || this.viewModel.color,
      transition: 'transform 0.3s ease'
    };
  };

ChakraApp.CircleView.prototype._renderTriangle = function() {
  ChakraApp.TriangleRenderer.render(this);
};
  
ChakraApp.CircleView.prototype._renderSimpleCircleGlow = function() {
  ChakraApp.StandardCircleRenderer.renderSimpleGlow(this);
};

  // Consolidated similar shape rendering methods
ChakraApp.CircleView.prototype._renderHexagon = function() {
  ChakraApp.SimpleShapeRenderer.renderHexagon(this);
};

ChakraApp.CircleView.prototype._renderDiamond = function() {
  ChakraApp.SimpleShapeRenderer.renderDiamond(this);
};

ChakraApp.CircleView.prototype._renderStar = function() {
  ChakraApp.SimpleShapeRenderer.renderStar(this);
};

ChakraApp.CircleView.prototype._renderOval = function() {
  ChakraApp.SimpleShapeRenderer.renderOval(this);
};

ChakraApp.CircleView.prototype._renderStandardCircle = function() {
  ChakraApp.StandardCircleRenderer.render(this);
};

  /**
   * Handle circle click - either select circle or create circle reference
   * @private
   */
  ChakraApp.CircleView.prototype._handleCircleClick = function() {
    var currentSelectedCircleId = ChakraApp.appState.selectedCircleId;
    var currentSelectedTabId = ChakraApp.appState.selectedTabId;
    
    // If clicking on the same circle that's already selected, do nothing special
    if (currentSelectedCircleId === this.viewModel.id) {
      return;
    }
    
    // If we have a different circle selected AND a tab selected, create a circle reference
    if (currentSelectedCircleId && currentSelectedTabId && currentSelectedCircleId !== this.viewModel.id) {
      this._createCircleReference(currentSelectedTabId);
    } else {
      // Otherwise, just select this circle normally
      this.viewModel.select();
    }
  };
  
  /**
   * Create a circle reference for the clicked circle
   * @private
   * @param {string} tabId - The tab to add the circle reference to
   */
ChakraApp.CircleView.prototype._createCircleReference = function(tabId) {
  // Generate a random position in the center panel
  var centerPanel = document.getElementById('center-panel');
  var centerRect = centerPanel ? centerPanel.getBoundingClientRect() : { width: 800, height: 600 };
  
  var x = Math.floor(Math.random() * (centerRect.width - 100)) + 50;
  var y = Math.floor(Math.random() * (centerRect.height - 100)) + 50;
  
  // Create the circle reference
  var circleReference = ChakraApp.appState.addCircleReference({
    sourceCircleId: this.viewModel.id,
    tabId: tabId,
    x: x,
    y: y
  });
};
  
  ChakraApp.CircleView.prototype.update = function() {
    this.updatePosition();
    this.updateTriangleCompletionIfNeeded();
    this.updateColors();
    this.updateName();
    this.updateSelectionState();
    this.updateDimmingState();
    this.updateChakraFormIfNeeded();
  };
  
  ChakraApp.CircleView.prototype.updatePosition = function() {
    this.element.style.left = this.viewModel.x + 'px';
    this.element.style.top = this.viewModel.y + 'px';
  };
  
ChakraApp.CircleView.prototype.updateTriangleCompletionIfNeeded = function() {
  ChakraApp.TriangleRenderer.updateTriangleCompletion(this);
};

ChakraApp.CircleView.prototype._isGemType = function() {
  // Check explicit circle type
  if (this.viewModel.circleType === 'gem') {
    return true;
  }
  
  // Check color as a fallback
  if (this.viewModel.color === '#4a6fc9') {
    return true;
  }
  
  // Check document panel for backward compatibility
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  if (doc && doc.panelId === 'bottom') {
    return true;
  }
  
  return false;
};
  
ChakraApp.CircleView.prototype.updateColors = function() {
  // Update regular circle elements
	ChakraApp.StandardCircleRenderer.updateColors(this);
  
  // Check if this is a gem-type circle by direct property or by panel type
  var isGemType = this._isGemType();
  
  if (isGemType && this.shapeWrap) {
    // Find the SVG element inside the shape wrap
    var svg = this.shapeWrap.querySelector('svg');
    if (svg) {
      // Calculate new colors based on the updated viewModel color
      var baseColor = this.viewModel.color;
      var darkerColor = ChakraApp.ColorUtils.createDarkerShade(baseColor);
      var lighterColor = ChakraApp.ColorUtils.createLighterShade(baseColor);
      
      // Update all polygon facets
      var polygons = svg.querySelectorAll('polygon');
      for (var i = 0; i < polygons.length; i++) {
        // Alternate between base color and darker color for facets
        // First polygon is often the table, which might have a special color
        var color = (i === 0) ? lighterColor : 
                   (i % 2 === 1) ? baseColor : darkerColor;
        
        // Update fill color directly for simple fills
        if (!polygons[i].getAttribute('fill').startsWith('url(#')) {
          polygons[i].setAttribute('fill', color);
        }
        
        // Update stroke color for all polygons
        if (polygons[i].hasAttribute('stroke')) {
          polygons[i].setAttribute('stroke', lighterColor);
        }
      }
      
      // Update path stroke colors (outlines)
      var paths = svg.querySelectorAll('path');
      for (var i = 0; i < paths.length; i++) {
        if (paths[i].hasAttribute('stroke')) {
          paths[i].setAttribute('stroke', 'rgba(255,255,255,.8)');
        }
      }
      
      // Update gradients if they exist
      var gradients = svg.querySelectorAll('linearGradient, radialGradient');
      for (var i = 0; i < gradients.length; i++) {
        var stops = gradients[i].querySelectorAll('stop');
        for (var j = 0; j < stops.length; j++) {
          // Update stop colors based on position
          if (stops[j].getAttribute('offset') === "0%" || 
              stops[j].getAttribute('offset') === "100%") {
            // Edge stops use the base or darker color
            stops[j].setAttribute('stop-color', j % 2 === 0 ? baseColor : darkerColor);
          } else {
            // Middle stops use lighter color for sheen
            stops[j].setAttribute('stop-color', lighterColor);
          }
        }
      }
    }
  }
  
  // Handle triangle shapes
  if (this.viewModel.circleType === 'triangle' && this.triangleShape) {
    this.triangleShape.style.backgroundColor = this.viewModel.color;
    if (this.pyramidSide) {
      this.pyramidSide.style.backgroundColor = ChakraApp.ColorUtils.createDarkerShade(this.viewModel.color);
    }
  }

  ChakraApp.SimpleShapeRenderer.updateColors(this);
};
  
  ChakraApp.CircleView.prototype.updateName = function() {
    this.nameElement.textContent = this.viewModel.name;
  };
  
  ChakraApp.CircleView.prototype.updateSelectionState = function() {
    this.element.classList.toggle('selected', this.viewModel.isSelected);
  };
  
  ChakraApp.CircleView.prototype.updateDimmingState = function() {
    this.element.classList.toggle('dimmed', this.viewModel.isDimmed);
  };
  
ChakraApp.CircleView.prototype.updateChakraFormIfNeeded = function() {
  ChakraApp.StandardCircleRenderer.updateChakraForm(this);
};
  
  ChakraApp.CircleView.prototype._setupEventListeners = function() {
    var self = this;
    
    this.element.addEventListener('click', function(e) {
      if (e.target === self.element) {
        e.stopPropagation();
        if (!window.wasDragged) {
          self._handleCircleClick();
        }
      }
    });
    
    this.nameElement.addEventListener('blur', function() {
      var oldName = self.viewModel.name;
      var newName = this.textContent;
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
    
    this._addDragFunctionality();
  };
  
  ChakraApp.CircleView.prototype._addDragFunctionality = function() {
    var isDragging = false;
    var self = this;
    
    this.element.addEventListener('mousedown', function(e) {
      var dragTargets = [self.element, self.glowElement, self.shapeWrap];
      var dragClasses = ['shape-wrap', 'triangle-shape', 'star-shape', 
                        'hexagon-shape', 'oval-shape', 'diamond-shape'];
      
      var isTarget = dragTargets.includes(e.target) || 
                     dragClasses.some(function(cls) { return e.target.classList.contains(cls); });
      
      if (isTarget) {
        e.preventDefault();
        isDragging = true;
        window.wasDragged = false;
        self.element.classList.add('no-transition');
        self.element.style.zIndex = 20;
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        e.preventDefault();
        window.wasDragged = true;
        
        var zoomContainer = self.parentElement;
        var containerRect = zoomContainer.getBoundingClientRect();
        
        var x = Math.max(0, Math.min(containerRect.width, e.clientX - containerRect.left));
        var y = Math.max(0, Math.min(containerRect.height, e.clientY - containerRect.top));
        
        self.element.style.left = x + 'px';
        self.element.style.top = y + 'px';
        
        var panelId = self.parentElement.getAttribute('data-panel-id');
        if (panelId === 'left') {
          var meridianX = ChakraApp.Config.meridian.x;
          var distanceToMeridian = Math.abs(x - meridianX);
          
          if (distanceToMeridian < ChakraApp.Config.meridian.snapThreshold) {
            self.element.style.left = meridianX + 'px';
            self.element.classList.add('snapping');
          } else {
            self.element.classList.remove('snapping');
          }
        }
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        
        var finalX = parseFloat(self.element.style.left);
        var finalY = parseFloat(self.element.style.top);
        self.viewModel.updatePosition(finalX, finalY);
        
        self.element.style.zIndex = self.viewModel.isSelected ? 15 : 10;
        self.element.classList.remove('no-transition');
        
        ChakraApp.appState.saveToStorageNow();
        
        setTimeout(function() {
          window.wasDragged = false;
        }, 50);
      }
    });
    
    this._addHandler(function() {
      document.removeEventListener('mousemove', self.mouseMoveHandler);
      document.removeEventListener('mouseup', self.mouseUpHandler);
    });
  };
})(window.ChakraApp = window.ChakraApp || {});
