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
  // Create circle reference element
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
      borderRadius: '50%',
      backgroundColor: this.viewModel.color,
      border: '2px solid ' + this.viewModel.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      zIndex: '10',
      transition: 'all 0.2s ease',
      boxShadow: this.viewModel.isSelected ? '0 0 8px 2px rgba(255, 255, 255, 0.6)' : 'none'
    }
  });
  
  // Create icon element
  var iconElement = this._createElement('span', {
    className: 'circle-reference-icon',
    textContent: this.viewModel.icon,
    style: {
      fontSize: '16px',
      color: 'white',
      fontWeight: 'bold',
      textShadow: '1px 1px 1px rgba(0, 0, 0, 0.5)'
    }
  });
  
  this.element.appendChild(iconElement);
  
  // Create name element (similar to circles and squares)
  this.nameElement = this._createElement('div', {
    className: 'item-name',
    contentEditable: false, // Circle references shouldn't be editable since they reflect source circle names
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
      cursor: 'default', // Not editable, so use default cursor
      userSelect: 'text',
      boxSizing: 'border-box',
      maxHeight: 'none',
      spellcheck: false,
      WebkitSpellcheck: false
    }
  });
  
  this.element.appendChild(this.nameElement);
  
  // Create tooltip
  this.element.title = this.viewModel.name + (this.viewModel.isValid ? '' : ' [Deleted]');
  
  // Add event handlers
  this._addEventHandlers();
  
  // Add to parent element
  this.parentElement.appendChild(this.element);
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
  
  // Update position
  this.element.style.left = this.viewModel.x + 'px';
  this.element.style.top = this.viewModel.y + 'px';
  
  // Update color
  this.element.style.backgroundColor = this.viewModel.color;
  this.element.style.borderColor = this.viewModel.color;
  
  // Update icon
  var iconElement = this.element.querySelector('.circle-reference-icon');
  if (iconElement) {
    iconElement.textContent = this.viewModel.icon;
  }
  
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
