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
    this.addClosestIndicator();
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

  ChakraApp.CircleView.prototype.renderShapeBasedOnConcept = function() {
  var conceptType = this._getConceptTypeForCircle();
  
  if (conceptType) {
    // For triangles in things panel, check if there's a completion level
    if (conceptType.shape === 'triangle' && this.panelId === 'things') {
      var completionLevel = this.getCompletionLevel();
      // If no completion level, render simple circle glow
      if (completionLevel === "no-completion") {
        this._renderSimpleCircleGlow();
      } else {
        this.renderShapeByType(conceptType.shape);
      }
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

  ChakraApp.CircleView.prototype.addClosestIndicator = function() {
    this.closestIndicator = this._createElement('div', {
      className: 'closest-square-indicator',
      style: { display: this.viewModel.closestSquareName ? '' : 'none' },
      textContent: this.viewModel.closestSquareName || ''
    });
    this.element.appendChild(this.closestIndicator);
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
	  var completionLevel = this.getCompletionLevel();
	  this.createTriangleShapeWrap(completionLevel);
	  this.createTriangleShapeByCompletionLevel(completionLevel);
	    this._createChakraForm();
	  this.element.appendChild(this.shapeWrap);
  };
  
  ChakraApp.CircleView.prototype.getCompletionLevel = function() {
  if (!this.viewModel.characteristics || !this.viewModel.characteristics.completion) {
    return "no-completion";
  }
  return this.viewModel.characteristics.completion;
};
  
  ChakraApp.CircleView.prototype.createTriangleShapeWrap = function(completionLevel) {
    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap triangle-wrap completion-' + completionLevel,
      style: this.getTriangleWrapStyles(),
      events: { click: this.getTriangleClickHandler() }
    });
  };
  
  ChakraApp.CircleView.prototype.getTriangleWrapStyles = function() {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      cursor: 'pointer',
      backgroundColor: 'rgba(0,0,0,0.001)',
      zIndex: '10'
    };
  };
  
  ChakraApp.CircleView.prototype.getTriangleClickHandler = function() {
    return (e) => {
      e.stopPropagation();
      if (!window.wasDragged) {
        this.viewModel.select();
      }
    };
  };
  
  ChakraApp.CircleView.prototype.createTriangleShapeByCompletionLevel = function(completionLevel) {
    var levelCreators = {
      "level0": this.createLevel0Triangle,
      "level1": this.createLevel1Triangle,
      "level2": this.createLevel2Triangle
    };
    
    var createMethod = levelCreators[completionLevel] || this.createLevel2Triangle;
    createMethod.call(this);
  };

  ChakraApp.CircleView.prototype.createLevel0Triangle = function() {
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape level0',
      style: this.getLevel0TriangleStyles()
    });
    this.shapeWrap.appendChild(this.triangleShape);
  };
  
  ChakraApp.CircleView.prototype.getLevel0TriangleStyles = function() {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      backgroundColor: 'transparent',
      border: '2px dashed rgba(255, 255, 255, .4)',
      transition: 'transform 0.3s ease',
      transform: 'translate(-1px, -2px)',
      zIndex: '5',
      pointerEvents: 'none'
    };
  };
  
  ChakraApp.CircleView.prototype.createLevel1Triangle = function() {
    this.createTriangleOutline();
    this.createTriangleShape();
    this.shapeWrap.appendChild(this.triangleShape);
    this.shapeWrap.appendChild(this.triangleOutline);
  };
  
  ChakraApp.CircleView.prototype.createTriangleOutline = function() {
    this.triangleOutline = this._createElement('div', {
      className: 'triangle-outline',
      style: this.getTriangleOutlineStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getTriangleOutlineStyles = function() {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      backgroundColor: 'transparent',
      border: '2px dashed rgba(255, 255, 255, .4)',
      transform: 'translate(-1px, -2px)',
      zIndex: '6',
      pointerEvents: 'none'
    };
  };
  
  ChakraApp.CircleView.prototype.createTriangleShape = function() {
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape level1',
      style: this.getLevel1TriangleStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getLevel1TriangleStyles = function() {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      backgroundColor: this.viewModel.color,
      clipPath: 'polygon(20% 70%, 0% 100%, 100% 100%, 80% 70%)',
      transition: 'transform 0.3s ease',
      transform: 'scale(0.90)',
      zIndex: '5',
      pointerEvents: 'none'
    };
  };
  
  ChakraApp.CircleView.prototype.createLevel2Triangle = function() {
    this.createMainTriangle();
    this.createPyramidSide();
    this.shapeWrap.appendChild(this.triangleShape);
    this.shapeWrap.appendChild(this.pyramidSide);
  };
  
  ChakraApp.CircleView.prototype.createMainTriangle = function() {
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape level2',
      style: this.getLevel2TriangleStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getLevel2TriangleStyles = function() {
    return {
      position: 'absolute',
      width: '30px',
      height: '30px',
      backgroundColor: this.viewModel.color,
      clipPath: 'polygon(45% 0%, 0% 100%, 90% 100%)',
      transition: 'transform 0.3s ease',
      transform: 'scale(0.90) translate(-3px, -3px)',
      zIndex: '5',
      pointerEvents: 'none'
    };
  };
  
  ChakraApp.CircleView.prototype.createPyramidSide = function() {
    this.pyramidSide = this._createElement('div', {
      className: 'pyramid-side level2',
      style: this.getPyramidSideStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getPyramidSideStyles = function() {
  // Create a darker shade of the triangle color
  var darkerColor = this.createDarkerShade(this.viewModel.color);
  
  return {
    position: 'absolute',
    width: '30px',
    height: '30px',
    backgroundColor: darkerColor,
    clipPath: 'polygon(45% 0%, 90% 100%, 100% 70%)',
    transition: 'transform 0.3s ease',
      transform: 'scale(0.90) translate(-3px, -3px)',
    zIndex: '5',
    pointerEvents: 'none'
  };
};

ChakraApp.CircleView.prototype._renderSimpleCircleGlow = function() {
  this.createGlowElement();
};

ChakraApp.CircleView.prototype.createDarkerShade = function(color) {
  // Handle different color formats
  var r, g, b;
  
  // Parse rgb/rgba format
  if (color.startsWith('rgb')) {
    var rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      r = parseInt(rgbValues[0]);
      g = parseInt(rgbValues[1]);
      b = parseInt(rgbValues[2]);
    }
  } 
  // Parse hex format
  else if (color.startsWith('#')) {
    var hex = color.substring(1);
    // Handle both 3-digit and 6-digit hex
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  
  // If parsing failed or color format is not recognized, return a default darker gray
  if (r === undefined || g === undefined || b === undefined) {
    return 'rgb(100, 100, 100)';
  }
  
  // Darken the color by reducing each component by 30%
  r = Math.max(0, Math.floor(r * 0.7));
  g = Math.max(0, Math.floor(g * 0.7));
  b = Math.max(0, Math.floor(b * 0.7));
  
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
};

  // Consolidated similar shape rendering methods
  ChakraApp.CircleView.prototype._renderBasicShape = function(shapeType, clipPath) {
    this.createShapeWrap();
    var styles = this.getBaseShapeStyles();
    styles.clipPath = clipPath;
    styles.transform = 'translate(-50%, -50%)';
    
    this[shapeType + 'Shape'] = this.createShapeElement(shapeType + '-shape', styles);
    this.appendShapeToElement();
  };
  
  ChakraApp.CircleView.prototype._renderHexagon = function() {
    this._renderBasicShape('hexagon', 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)');
  };

  ChakraApp.CircleView.prototype._renderDiamond = function() {
    this._renderBasicShape('diamond', 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)');
  };

  ChakraApp.CircleView.prototype._renderStar = function() {
    this._renderBasicShape('star', 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)');
  };

  ChakraApp.CircleView.prototype._renderOval = function() {
    this.createShapeWrap();
    var styles = this.getBaseShapeStyles();
    styles.width = '30px';
    styles.height = '20px';
    styles.borderRadius = '50%';
    styles.transform = 'translate(-50%, -50%)';
    
    this.ovalShape = this.createShapeElement('oval-shape', styles);
    this.appendShapeToElement();
  };

  ChakraApp.CircleView.prototype._renderStandardCircle = function() {
    this.createGlowElement();
    this._createParticles();
    this._createChakraForm();
  };
  
  ChakraApp.CircleView.prototype.createGlowElement = function() {
    this.glowElement = this._createElement('div', {
      className: 'circle-glow',
      style: { backgroundColor: this.viewModel.color }
    });
    this.element.appendChild(this.glowElement);
  };

  ChakraApp.CircleView.prototype._createParticles = function() {
    var particlesElement = this._createElement('div', { className: 'particles' });
    this.createParticleSet(particlesElement, 1);
    this.createParticleSet(particlesElement, 2);
    this.element.appendChild(particlesElement);
  };
  
  ChakraApp.CircleView.prototype.createParticleSet = function(parentElement, index) {
    var angleElement = this._createElement('div', { className: 'angle' });
    var positionElement = this._createElement('div', { className: 'position' });
    var pulseElement = this._createElement('div', { className: 'pulse' });
    
    this.createParticleElement(pulseElement);
    positionElement.appendChild(pulseElement);
    angleElement.appendChild(positionElement);
    parentElement.appendChild(angleElement);
  };
  
  ChakraApp.CircleView.prototype.createParticleElement = function(parentElement) {
    var particleElement = this._createElement('div', {
      className: 'particle',
      style: { backgroundColor: this.viewModel.color }
    });
    parentElement.appendChild(particleElement);
  };
  
  ChakraApp.CircleView.prototype._createChakraForm = function() {
    var chakraForm = this.viewModel.chakraForm;
    var outerContainer = this._createElement('div', { className: 'outer-polygon-container' });
    
    for (var i = 0; i < chakraForm.length; i++) {
      this.createChakraFormShape(outerContainer, chakraForm[i]);
    }
    
    this.element.appendChild(outerContainer);
  };
  
  ChakraApp.CircleView.prototype.createChakraFormShape = function(outerContainer, form) {
    var innerContainer = this._createElement('div', {
      className: 'inner-polygon-container',
      style: { 
        transform: 'rotate(' + (form.rotate || 0) + 'deg) scale(' + (form.scale || 1) + ')'
      }
    });
    
    var innermostContainer = this._createElement('div', {
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
    
    innermostContainer.appendChild(shapeElement);
    innerContainer.appendChild(innermostContainer);
    outerContainer.appendChild(innerContainer);
  };
  
  ChakraApp.CircleView.prototype.update = function() {
    this.updatePosition();
    this.updateTriangleCompletionIfNeeded();
    this.updateColors();
    this.updateName();
    this.updateClosestIndicator();
    this.updateSelectionState();
    this.updateDimmingState();
    this.updateChakraFormIfNeeded();
  };
  
  ChakraApp.CircleView.prototype.updatePosition = function() {
    this.element.style.left = this.viewModel.x + 'px';
    this.element.style.top = this.viewModel.y + 'px';
  };
  
ChakraApp.CircleView.prototype.updateTriangleCompletionIfNeeded = function() {
  var conceptType = this._getConceptTypeForCircle();
  if (conceptType && conceptType.shape === 'triangle' && this.shapeWrap) {
    var completionLevel = this.getCompletionLevel();
    
    // If this is a things panel circle with no completion level, 
    // we need to convert it to a circle-glow
    if (this.panelId === 'things' && completionLevel === "no-completion") {
      // Remove the existing triangle shape
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      
      // Render as simple circle glow instead
      this._renderSimpleCircleGlow();
      
      // Re-add the name element and closest indicator
      this.addNameElement();
      this.addClosestIndicator();
    } else {
      // Update the triangle shape as usual
      this.shapeWrap.className = 'shape-wrap triangle-wrap completion-' + completionLevel;
      
      while (this.shapeWrap.firstChild) {
        this.shapeWrap.removeChild(this.shapeWrap.firstChild);
      }
      
      this.createTriangleShapeByCompletionLevel(completionLevel);
    }
  }
};
  
  ChakraApp.CircleView.prototype.updateColors = function() {
    if (this.glowElement) {
      this.glowElement.style.backgroundColor = this.viewModel.color;
      
      var particles = this.element.querySelectorAll('.particle');
      for (var i = 0; i < particles.length; i++) {
        particles[i].style.backgroundColor = this.viewModel.color;
      }
    }
  };
  
  ChakraApp.CircleView.prototype.updateName = function() {
    this.nameElement.textContent = this.viewModel.name;
  };
  
  ChakraApp.CircleView.prototype.updateClosestIndicator = function() {
    if (this.viewModel.closestSquareName) {
      this.closestIndicator.textContent = this.viewModel.closestSquareName;
      this.closestIndicator.style.display = '';
    } else {
      this.closestIndicator.style.display = 'none';
    }
  };
  
  ChakraApp.CircleView.prototype.updateSelectionState = function() {
    this.element.classList.toggle('selected', this.viewModel.isSelected);
  };
  
  ChakraApp.CircleView.prototype.updateDimmingState = function() {
    this.element.classList.toggle('dimmed', this.viewModel.isDimmed);
  };
  
  ChakraApp.CircleView.prototype.updateChakraFormIfNeeded = function() {
    if (this.viewModel.squareCountChanged) {
      var existingContainer = this.element.querySelector('.outer-polygon-container');
      if (existingContainer) {
        this.element.removeChild(existingContainer);
      }
      
      this._createChakraForm();
    }
  };
  
  ChakraApp.CircleView.prototype._setupEventListeners = function() {
    var self = this;
    
    this.element.addEventListener('click', function(e) {
      if (e.target === self.element) {
        e.stopPropagation();
        if (!window.wasDragged) {
          self.viewModel.select();
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
