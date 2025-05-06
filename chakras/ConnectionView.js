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
    
    var overlapThreshold = ChakraApp.Config.connections ? 
      ChakraApp.Config.connections.overlapThreshold : 40;

    // Set line position
    this.element.style.width = length + 'px';
    this.element.style.left = x1 + 'px';
    this.element.style.top = y1 + 'px';
    this.element.style.transform = 'rotate(' + angle + 'deg)';
    
    // Show/hide line based on visibility
    this.element.style.display = this.viewModel.isVisible ? 'block' : 'none';

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
