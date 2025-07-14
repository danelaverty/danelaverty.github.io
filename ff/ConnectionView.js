// src/views/ConnectionView.js
// Consolidated Connection View implementation

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
  
  // Validate parent element
  if (!this.parentElement) {
    console.error('Cannot render connection view - no parent element provided for:', this.viewModel.id);
    return;
  }
  
  // Create line element
  this.element = this._createElement('div', {
    id: this.viewModel.id,
    className: 'connection-line',
    style: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      height: '1px',
      transformOrigin: 'left center',
      zIndex: '1',
      display: this.viewModel.isVisible ? 'block' : 'none'
    }
  });

  // Apply circle connection styling if this is a circle connection
  if (this._isCircleConnection()) {
    this.element.classList.add('circle-connection');
  }

  // Apply multi-select highlight if needed
  if (this._checkIfMultiSelected()) {
    this.element.classList.add('connecting-line-multi-selected');
  }

  // Calculate and update line position
  this._updateLinePosition();

  // Add to parent element with error handling
  try {
    this.parentElement.appendChild(this.element);
    var parentId = this.parentElement.id || this.parentElement.className || 'unknown';
  } catch (error) {
    console.error('Error appending connection element to parent:', error);
    return;
  }
  
};
  
  // Update line position
  ChakraApp.ConnectionView.prototype._updateLinePosition = function() {
	  if (this._isCircleConnection()) {
    this._updateCircleLinePosition();
  } else {
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

  // Calculate center points of squares
  var x1 = square1.x;
  var y1 = square1.y;
  var x2 = square2.x;
  var y2 = square2.y;

  // Calculate line length and angle
  var dx = x2 - x1;
  var dy = y2 - y1;
  var length = Math.sqrt(dx * dx + dy * dy);
  var angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Get config values
  var maxLineLength = ChakraApp.Config.connections ? 
    ChakraApp.Config.connections.maxLineLength : 120;
  
  // NEW: Check if either square is bold, and if so, use extended connection length
  var boldMaxLineLength = 180; // Extended range for bold squares
  var effectiveMaxLength = (square1.isBold || square2.isBold) ? boldMaxLineLength : maxLineLength;
  
  var overlapThreshold = ChakraApp.Config.connections ? 
    ChakraApp.Config.connections.overlapThreshold : 40;

  // Set line position
  this.element.style.width = length + 'px';
  this.element.style.left = x1 + 'px';
  this.element.style.top = y1 + 'px';
  this.element.style.transform = 'rotate(' + angle + 'deg)';
  
  // Show/hide line based on visibility and distance
  // NEW: Update visibility calculation based on bold status
  var isVisible = length <= effectiveMaxLength;
  this.element.style.display = isVisible ? 'block' : 'none';

  // Check if squares are close enough to overlap
  if (length < overlapThreshold) {
    // Add the overlap-connection class to the line
    this.element.classList.add('overlap-connection');
    
    // Register the overlap with the manager
    if (square1 && square2) {
      ChakraApp.OverlappingSquaresManager.registerOverlap(square1, square2);
    }
  } else {
    // Remove the overlap-connection class
    this.element.classList.remove('overlap-connection');
    
    // Unregister the overlap
    ChakraApp.OverlappingSquaresManager.removeOverlap(
      this.viewModel.sourceId, 
      this.viewModel.targetId
    );
  }
  
  // NEW: Add visual style for connections involving bold squares
  if (square1.isBold || square2.isBold) {
    this.element.classList.add('bold-connection');
  } else {
    this.element.classList.remove('bold-connection');
  }

  }
};

ChakraApp.ConnectionView.prototype._isCircleConnection = function() {
  return this.viewModel.connectionType === 'circle';
};

ChakraApp.ConnectionView.prototype._updateCircleLinePosition = function() {
  // Get the circles
  var circle1 = ChakraApp.appState.getCircle(this.viewModel.sourceId);
  var circle2 = ChakraApp.appState.getCircle(this.viewModel.targetId);

  if (!circle1 || !circle2) {
    this.element.style.display = 'none';
    return;
  }

  // Calculate center points of circles
  var x1 = circle1.x;
  var y1 = circle1.y;
  var x2 = circle2.x;
  var y2 = circle2.y;

  // Calculate line length and angle
  var dx = x2 - x1;
  var dy = y2 - y1;
  var length = Math.sqrt(dx * dx + dy * dy);
  var angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Set line position
  this.element.style.width = length + 'px';
  this.element.style.left = x1 + 'px';
  this.element.style.top = y1 + 'px';
  this.element.style.transform = 'rotate(' + angle + 'deg)';
  
  // Circle connections are always visible
  this.element.style.display = 'block';
  
  // Apply special styling for circle connections
  this.element.classList.add('circle-connection');
  
  // Add directional arrow if this is a directional connection
  if (this.viewModel.isDirectional) {
    this.element.classList.add('directional-connection');
    this._addDirectionalArrow(angle, length);
  }
};

ChakraApp.ConnectionView.prototype._addDirectionalArrow = function(angle, length) {
  // Remove existing arrow
  var existingArrow = this.element.querySelector('.connection-arrow');
  if (existingArrow) {
    existingArrow.remove();
  }
  
  // Determine arrow color based on connection type
  var arrowColor = this._isCircleConnection() ? 
    'rgba(100, 149, 237, 0.9)' : // Blue for circle connections
    'rgba(255, 255, 255, 0.8)';  // White for square connections
  
  // Create arrow element
  var arrow = this._createElement('div', {
    className: 'connection-arrow',
    style: {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '0',
      height: '0',
      borderLeft: '8px solid ' + arrowColor,
      borderTop: '4px solid transparent',
      borderBottom: '4px solid transparent',
      pointerEvents: 'none',
      zIndex: '4'
    }
  });
  
  this.element.appendChild(arrow);
};

ChakraApp.ConnectionView.prototype.updateCircleConnectionPosition = function(sourceX, sourceY, targetX, targetY) {
  if (!this._isCircleConnection()) {
    return; // Only update circle connections
  }
  
  // Calculate line length and angle
  var dx = targetX - sourceX;
  var dy = targetY - sourceY;
  var length = Math.sqrt(dx * dx + dy * dy);
  var angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Set line position immediately without validation checks for performance
  this.element.style.width = length + 'px';
  this.element.style.left = sourceX + 'px';
  this.element.style.top = sourceY + 'px';
  this.element.style.transform = 'rotate(' + angle + 'deg)';
  
  // Update arrow if directional
  if (this.viewModel.isDirectional && this.element.querySelector('.connection-arrow')) {
    // Arrow position is relative to line, so no additional update needed during drag
  }
};

  // Update view based on model changes
  ChakraApp.ConnectionView.prototype.update = function() {
    // If not visible, hide and exit
    if (!this.viewModel.isVisible) {
      this.element.style.display = 'none';
      return;
    }

    // Check if both squares are multi-selected
    var isMultiSelected = this._checkIfMultiSelected();

    // Update multi-selected state
    if (isMultiSelected) {
      this.element.classList.add('connecting-line-multi-selected');
    } else {
      this.element.classList.remove('connecting-line-multi-selected');
    }

    // Update position
    this._updateLinePosition();
  };

  // Check if both connection endpoints are multi-selected
  ChakraApp.ConnectionView.prototype._checkIfMultiSelected = function() {
    // If multi-selected squares array doesn't exist, return false
    if (!ChakraApp.multiSelectedSquares) return false;

    // Get the source and target IDs
    var sourceId = this.viewModel.sourceId;
    var targetId = this.viewModel.targetId;
    var primarySelectedId = ChakraApp.appState.selectedSquareId;
    
    // Check if both squares are in the multi-selected array or are the primary selected square
    var isSourceSelected = ChakraApp.multiSelectedSquares.includes(sourceId) || sourceId === primarySelectedId;
    var isTargetSelected = ChakraApp.multiSelectedSquares.includes(targetId) || targetId === primarySelectedId;

    return isSourceSelected && isTargetSelected;
  };
  
  // Set up event subscriptions
  ChakraApp.ConnectionView.prototype._setupViewModelSubscription = function() {
    // Call parent method first
    ChakraApp.BaseView.prototype._setupViewModelSubscription.call(this);
    
    var self = this;

    // Subscribe to multi-selection events
    this._addHandler(ChakraApp.EventBus.subscribe('SQUARES_MULTI_SELECTED', function() {
      self.update();
    }));

    // Subscribe to multi-deselection events
    this._addHandler(ChakraApp.EventBus.subscribe('SQUARES_MULTI_DESELECTED', function() {
      self.update();
    }));
  };
  
  // Extend destroy method to handle overlaps
  ChakraApp.ConnectionView.prototype.destroy = function() {
    // Get the squares
    var square1 = ChakraApp.appState.getSquare(this.viewModel.sourceId);
    var square2 = ChakraApp.appState.getSquare(this.viewModel.targetId);
    
    // Remove any overlap registration if this connection is being destroyed
    if (square1 && square2) {
      ChakraApp.OverlappingSquaresManager.removeOverlap(square1.id, square2.id);
    }
    
    // Call parent destroy method
    ChakraApp.BaseView.prototype.destroy.call(this);
  };
})(window.ChakraApp = window.ChakraApp || {});
