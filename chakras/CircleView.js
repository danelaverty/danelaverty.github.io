(function(ChakraApp) {
  ChakraApp.CircleView = function(viewModel, parentElement) {
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    this.panelId = this.extractPanelId();
    this.setParentPositionIfNeeded();
    this.render();
    this._setupViewModelSubscription();
    this._setupEventListeners();
    this._setupTabEventListeners();
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
  this.indicatorElement = this._createIndicatorElement();
  if (this.indicatorElement) {
    this.element.appendChild(this.indicatorElement);
  }
  this.addNameElement();
  this.addTextElement();
  this.addTabNamesElements();
  this.applySelectionState();
  this.applyDisabledState();
  this.addToParent();
};

ChakraApp.CircleView.prototype.addTextElement = function() {
  // Remove any existing text element
  this.removeTextElement();
  
  if (!this.viewModel.text) {
    return;
  }
  
  this.textElement = this._createElement('div', {
    className: 'circle-text',
    textContent: this.viewModel.text,
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '16px',
      fontWeight: 'bold',
      color: 'white',
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
      pointerEvents: 'none',
      zIndex: '25',
      userSelect: 'none',
      textAlign: 'center',
      lineHeight: '1'
    }
  });
  
  this.element.appendChild(this.textElement);
};

// NEW: Remove text element
ChakraApp.CircleView.prototype.removeTextElement = function() {
  if (this.textElement && this.textElement.parentNode) {
    this.textElement.parentNode.removeChild(this.textElement);
    this.textElement = null;
  }
};

// NEW: Update text content
ChakraApp.CircleView.prototype.updateText = function() {
  this.addTextElement(); // This will remove existing and create new if needed
};

  ChakraApp.CircleView.prototype.createMainElement = function() {
    this.element = this._createElement('div', {
      className: 'circle',
      dataset: { id: this.viewModel.id },
      style: this.getMainElementStyles()
    });
  };
  
ChakraApp.CircleView.prototype.getMainElementStyles = function() {
  var panelWidth = this._getCurrentPanelWidth();
  var panelCenterX = panelWidth / 2;
  var absoluteX = this.viewModel.x + panelCenterX;
  
  return {
    width: this.viewModel.size + 'px',
    height: this.viewModel.size + 'px',
    left: absoluteX + 'px',
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
  } else if (this.viewModel.circleType === 'gem') {
    this._renderGem();
  } else if (this.viewModel.circleType === 'star') {
    this._renderStar();
  } else if (this.viewModel.circleType === 'hexagon') {
    this._renderHexagon();
  } else if (this.viewModel.circleType === 'standard') {
    this._renderStandardCircle();
  }
  // Rest of the original logic...
  else if (conceptType) {
    if (conceptType.shape === 'triangle' && docPanelId === 'things') {
      this._renderTriangle();
    } else {
      this.renderShapeByType(conceptType.shape);
    }
  } else {
    this._renderStandardCircle();
  }
  
  // IMPORTANT: Ensure ALL shapes get proper click handlers after rendering
  this._ensureShapeClickHandler();
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
  
  // Get all possible clickable elements within this circle, EXCEPT the main element
  var clickableElements = [
    this.shapeWrap, // Shape wrapper
    this.glowElement // Glow element for standard circles
  ];
  
  // Also find any rendered shape elements by class
  var shapeSelectors = [
    '.shape-wrap',
    '.triangle-wrap', 
    '.gem-wrap', 
    '.star-wrap', 
    '.hexagon-wrap',
    '.triangle-shape',
    '.gem-shape',
    '.star-shape',
    '.hexagon-shape',
    '.circle-glow',
    'svg' // For gem shapes which use SVG
  ];
  
  shapeSelectors.forEach(function(selector) {
    var elements = self.element.querySelectorAll(selector);
    for (var i = 0; i < elements.length; i++) {
      clickableElements.push(elements[i]);
    }
  });
  
  // Remove duplicates, null elements, AND the main circle element
  clickableElements = clickableElements.filter(function(el, index, arr) {
    return el && el !== self.element && arr.indexOf(el) === index;
  });
  
  // Add click handlers to all clickable elements (but NOT the main element)
  clickableElements.forEach(function(element) {
    if (element) {
      // Remove any existing click handlers by cloning the element
      var newElement = element.cloneNode(true);
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
        element = newElement;
        
        // Update our references if this was a tracked element
        if (element.classList.contains('shape-wrap')) {
          self.shapeWrap = element;
        } else if (element.classList.contains('circle-glow')) {
          self.glowElement = element;
        }
      }
      
      // Add the new click handler that passes the event
      element.style.cursor = "pointer";
      element.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!window.wasDragged) {
          self._handleCircleClick(e);
        }
      });
    }
  });
};

ChakraApp.CircleView.prototype.addNameElement = function() {
  // Get the document this circle belongs to
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  var nameColor = 'white'; // Default color
  
  if (doc) {
    if (doc.listType === 'list2') {
      nameColor = '#FFFF99';
    }
  }
  
  this.nameElement = this._createElement('div', {
    className: 'item-name',
    contentEditable: true,
    textContent: this.viewModel.name,
    style: {
      color: nameColor
    }
  });
  this.element.appendChild(this.nameElement);
};

ChakraApp.CircleView.prototype.addTabNamesElements = function() {
  // Remove any existing tab name elements
  this.removeTabNamesElements();
  
  if (!this.viewModel.showTabNames) {
    return;
  }
  
  // Get tabs for this circle
  var tabs = ChakraApp.appState.getTabsForCircle(this.viewModel.id);
  
  // Create tab name elements
  this.tabNameElements = [];
  var self = this;
  
  tabs.forEach(function(tab, index) {
    var tabNameElement = self._createElement('div', {
      className: 'tab-name-display',
      textContent: tab.name,
      style: {
        color: '#AAA',
        fontSize: '9px',
        textAlign: 'center',
        position: 'absolute',
        top: (40 + (index * 12)) + 'px', // Position below the circle name
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '1px 3px',
        borderRadius: '2px',
        whiteSpace: 'nowrap',
        zIndex: '24',
        pointerEvents: 'none',
        maxWidth: '80px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    });
    
    self.element.appendChild(tabNameElement);
    self.tabNameElements.push(tabNameElement);
  });
};

// Add this method after addTabNamesElements
ChakraApp.CircleView.prototype.removeTabNamesElements = function() {
  if (this.tabNameElements) {
    this.tabNameElements.forEach(function(element) {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.tabNameElements = [];
  }
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

ChakraApp.CircleView.prototype._getPanelIdFromCircleView = function() {
  // First check if panelId is stored on the view
  if (this.panelId !== undefined) {
    return this.panelId;
  }
  
  // Try to determine from the parent container
  var element = this.element;
  while (element && element.parentElement) {
    // Look for left-panel-X pattern
    if (element.id && element.id.match(/^left-panel-(\d+)$/)) {
      var match = element.id.match(/^left-panel-(\d+)$/);
      return parseInt(match[1]);
    }
    
    // Look for data-panel-index attribute
    if (element.dataset && element.dataset.panelIndex !== undefined) {
      return parseInt(element.dataset.panelIndex);
    }
    
    // Check class patterns
    if (element.classList.contains('left-panel')) {
      // Try to extract from ID or data attributes
      if (element.dataset.panelIndex !== undefined) {
        return parseInt(element.dataset.panelIndex);
      }
    }
    
    element = element.parentElement;
  }
  
  // Fallback to panel 0 if we can't determine
  return 0;
};

  /**
   * Handle circle click - either select circle or create circle reference
   * @private
   * @param {Event} e - The click event
   */
ChakraApp.CircleView.prototype._handleCircleClick = function(e) {
  var currentSelectedCircleId = ChakraApp.appState.selectedCircleId;
  var currentSelectedTabId = ChakraApp.appState.selectedTabId;
  
  // NEW: Determine which panel this circle is in and select that panel
  var panelId = this._getPanelIdFromCircleView();
  if (panelId !== null) {
    ChakraApp.appState.setSelectedLeftPanel(panelId);
  }
  
  // Check if CTRL/CMD key is held down
  var isCtrlHeld = e && (e.ctrlKey || e.metaKey);
  
  // CTRL-click behavior
  if (isCtrlHeld) {
    // Handle multi-selection
    ChakraApp.CircleMultiSelectionManager.toggleIndividualSelection(this.viewModel.id);
  } else {
    // FIXED: Normal click should clear any existing multi-selection first
    if (ChakraApp.CircleMultiSelectionManager.hasSelection()) {
      // If we have multiple circles selected, clear them and select just this one
      ChakraApp.CircleMultiSelectionManager.selectSingle(this.viewModel.id);
    } else {
      // FIXED: If clicking on the same circle that's already selected, deselect it
      if (currentSelectedCircleId === this.viewModel.id) {
        // Deselect the current circle
        ChakraApp.CircleMultiSelectionManager.clearSelection();
        return;
      }
      
      // Normal single selection
      ChakraApp.CircleMultiSelectionManager.selectSingle(this.viewModel.id);
    }
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
  
ChakraApp.CircleView.prototype.updateTabNames = function() {
  this.addTabNamesElements();
  
};

ChakraApp.CircleView.prototype.update = function() {
  this.updatePosition();
  this.updateTriangleCompletionIfNeeded();
  this.updateColors();
  this.updateName();
  this.updateText();
  this.updateSelectionState();
  this.updateDisabledState();
  this.updateDimmingState();
  this.updateIndicator();
  this.updateTabNames(); // This should be called
  this.updateChakraFormIfNeeded();
  
};
  
ChakraApp.CircleView.prototype.updatePosition = function() {
  // Get current panel width
  var panelWidth = this._getCurrentPanelWidth();
  var panelCenterX = panelWidth / 2;
  
  // Interpret circle's X coordinate as relative to panel center
  var absoluteX = this.viewModel.x + panelCenterX;
  
  this.element.style.left = absoluteX + 'px';
  this.element.style.top = this.viewModel.y + 'px'; // Y remains unchanged
};

ChakraApp.CircleView.prototype._getCurrentPanelWidth = function() {
  if (ChakraApp.app && ChakraApp.app.resizeController) {
    return ChakraApp.app.resizeController.getCurrentPanelWidth();
  }
  return 400; // Fallback to default width
};


ChakraApp.CircleView.prototype.updateDisabledState = function() {
  this.element.classList.toggle('disabled', this.viewModel.disabled);
};

ChakraApp.CircleView.prototype.updateIndicator = function() {
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
};

ChakraApp.CircleView.prototype.applyDisabledState = function() {
  if (this.viewModel.disabled) {
    this.element.classList.add('disabled');
  }
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
  // Update regular circle elements first
  ChakraApp.StandardCircleRenderer.updateColors(this);
  
  // Handle gem-type circles
  ChakraApp.GemRenderer.updateColors(this);
  
  // Handle triangle shapes
  ChakraApp.TriangleRenderer.updateColors(this);

  // Handle other shape types (hexagon, star, diamond, oval) via SimpleShapeRenderer
  ChakraApp.SimpleShapeRenderer.updateColors(this);
};
  
 ChakraApp.CircleView.prototype.updateName = function() {
  this.nameElement.textContent = this.viewModel.name;
  
  // Preserve the color based on document list type
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  var nameColor = 'white'; // Default color
  
  if (doc) {
    if (doc.listType === 'list2') {
      nameColor = '#FFFF99';
    }
  }
  
  this.nameElement.style.color = nameColor;
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
    
    // Main circle element click handler - handle clicks on the circle itself or any child
    this.element.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!window.wasDragged) {
        self._handleCircleClick(e);
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
    
    this._addDragFunctionality();
  };
  
ChakraApp.CircleView.prototype._addDragFunctionality = function() {
  var self = this;
  
  // Mark view model as circle for drag handler
  this.viewModel.isCircle = true;
  
  // Determine drag targets based on circle type
  var dragTargets = [this.element];
  var dragClasses = ['shape-wrap', 'triangle-shape', 'star-shape', 
                     'hexagon-shape', 'oval-shape', 'diamond-shape', 'gem-shape'];
  
  // Add glow element if it exists
  if (this.glowElement) {
    dragTargets.push(this.glowElement);
  }
  
  // Add shape wrap if it exists
  if (this.shapeWrap) {
    dragTargets.push(this.shapeWrap);
  }
  
  // Check if this circle is in the left panel for meridian snapping
  var panelId = this.parentElement.getAttribute('data-panel-id');
  var enableSnapping = panelId === 'left';
  
  var dragConfig = {
    viewModel: this.viewModel,
    parentElement: this.parentElement,
    dragTargets: dragTargets,
    dragClasses: dragClasses,
    enableSnapping: enableSnapping,
    enableGroupDragging: true, // FIX: Enable group dragging for circles
    
    // Custom drag target checker for circles (includes SVG elements for gems)
    isDragTarget: function(dragState, event) {
      var target = event.target;
      
      // Check standard targets
      if (dragTargets.includes(target)) return true;
      
      // Check drag classes
      if (dragClasses.some(function(cls) { return target.classList.contains(cls); })) {
        return true;
      }
      
      // Special handling for gem SVG elements
      var svgTags = ['svg', 'polygon', 'path'];
      if (svgTags.includes(target.tagName) || target.closest('svg')) {
        return true;
      }
      
      return false;
    },
    
    updatePosition: function(x, y) {
      // Update visual position immediately for smooth dragging
      self.element.style.left = x + 'px';
      self.element.style.top = y + 'px';
    },
    
    onDragEnd: function(dragState) {
      // Convert absolute position back to center-relative for storage
      var finalAbsoluteX = parseFloat(self.element.style.left);
      var finalY = parseFloat(self.element.style.top);
      
      var panelWidth = self._getCurrentPanelWidth();
      var panelCenterX = panelWidth / 2;
      var centerRelativeX = finalAbsoluteX - panelCenterX;
      
      // Update the model with center-relative coordinates
      self.viewModel.updatePosition(centerRelativeX, finalY);
    }
  };
  
  // Add drag functionality using the unified system
  this.dragState = ChakraApp.DragHandler.addDragFunctionality(this.element, dragConfig);
  
  // Store cleanup function
  this._addHandler(function() {
    ChakraApp.DragHandler.removeDragFunctionality(self.dragState);
  });
};

ChakraApp.CircleView.prototype._createIndicatorElement = function() {
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
    className: 'circle-indicator',
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

ChakraApp.CircleView.prototype._updateCircleConnectionsDuringDrag = function(newX, newY) {
  var circleId = this.viewModel.id;
  
  // Find all circle connections involving this circle
  ChakraApp.appState.connections.forEach(function(connection, connectionId) {
    if (connection.connectionType === 'circle' && 
        (connection.sourceId === circleId || connection.targetId === circleId)) {
      
      // Get the connection view
      var connectionView = null;
      if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.connectionViews) {
        connectionView = ChakraApp.app.viewManager.connectionViews.get(connectionId);
      }
      
      if (connectionView) {
        // Determine source and target positions
        var sourceX, sourceY, targetX, targetY;
        
        if (connection.sourceId === circleId) {
          // This circle is the source
          sourceX = newX;
          sourceY = newY;
          
          // Get target circle position
          var targetCircle = ChakraApp.appState.getCircle(connection.targetId);
          if (targetCircle) {
            targetX = targetCircle.x;
            targetY = targetCircle.y;
          } else {
            return; // Skip if target circle not found
          }
        } else {
          // This circle is the target
          targetX = newX;
          targetY = newY;
          
          // Get source circle position
          var sourceCircle = ChakraApp.appState.getCircle(connection.sourceId);
          if (sourceCircle) {
            sourceX = sourceCircle.x;
            sourceY = sourceCircle.y;
          } else {
            return; // Skip if source circle not found
          }
        }
        
        // Use the optimized update method if available, otherwise fallback to full update
        if (typeof connectionView.updateCircleConnectionPosition === 'function') {
          connectionView.updateCircleConnectionPosition(sourceX, sourceY, targetX, targetY);
        } else {
          connectionView._updateLinePosition();
        }
      }
    }
  }, this);
};

ChakraApp.CircleView.prototype._setupTabEventListeners = function() {
  var self = this;
  
  // Subscribe to tab events that affect this circle's tabs
  this.tabEventSubscriptions = [];
  
  // Listen for tab creation
  this.tabEventSubscriptions.push(
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.TAB_CREATED, function(tab) {
      // Safety check: ensure tab exists and has required properties
      if (tab && tab.circleId === self.viewModel.id) {
        self.updateTabNames();
      }
    })
  );
  
  // Listen for tab updates (name changes, etc.)
  this.tabEventSubscriptions.push(
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.TAB_UPDATED, function(tab) {
      // Safety check: ensure tab exists and has required properties
      if (tab && tab.circleId === self.viewModel.id) {
        self.updateTabNames();
      }
    })
  );
  
  // Listen for tab deletion - use a more robust approach
  this.tabEventSubscriptions.push(
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.TAB_DELETED, function(data) {
      // For deletion events, we might receive null or an object with just the ID
      // The safest approach is to refresh tabs for any circle that's currently selected
      // since we know tabs only exist for the selected circle
      if (ChakraApp.appState.selectedCircleId === self.viewModel.id) {
        self.updateTabNames();
      }
    })
  );
};

// **NEW METHOD**: Finalize circle connections after drag
ChakraApp.CircleView.prototype._finalizeCircleConnectionsAfterDrag = function() {
  // Trigger a full update of circle connections to ensure everything is correct
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    ChakraApp.app.viewManager._updateCircleConnectionViews();
  }
};

ChakraApp.CircleView.prototype.destroy = function() {
  // Clean up tab event subscriptions
  if (this.tabEventSubscriptions) {
    this.tabEventSubscriptions.forEach(function(unsubscribe) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.tabEventSubscriptions = null;
  }
  
  this.removeTabNamesElements();
  this.removeTextElement();
  
  ChakraApp.BaseView.prototype.destroy.call(this);
};

})(window.ChakraApp = window.ChakraApp || {});
