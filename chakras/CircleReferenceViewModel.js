// Updated CircleReferenceViewModel.js with hexagon cluster icon
(function(ChakraApp) {
  /**
   * Circle Reference View Model
   * @param {Object} circleReferenceModel - Circle reference model
   */
  ChakraApp.CircleReferenceViewModel = function(circleReferenceModel) {
    // Call parent constructor
    ChakraApp.BaseViewModel.call(this);
    
    this.model = circleReferenceModel;
    this.id = circleReferenceModel.id;
    this.sourceCircleId = circleReferenceModel.sourceCircleId;
    this.tabId = circleReferenceModel.tabId;
    this.x = circleReferenceModel.x;
    this.y = circleReferenceModel.y;
    this.isSelected = circleReferenceModel.selected || false;
    this.fieldRadius = circleReferenceModel.fieldRadius || 80; // Add fieldRadius to view model
    
    // Initialize display properties
    this.color = '#C0C0C0';
    this.name = 'Loading...';
    this.icon = '◉';
    this.isValid = true;
    this.circleType = 'standard';
    
    // Update display properties from source circle
    this._updateDisplayProperties();
    
    // Subscribe to model and circle changes
    this._setupSubscriptions();
  };
  
  // Inherit from Observable
  ChakraApp.CircleReferenceViewModel.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.CircleReferenceViewModel.prototype.constructor = ChakraApp.CircleReferenceViewModel;
  
  /**
   * Update display properties from source circle
   * @private
   */
  ChakraApp.CircleReferenceViewModel.prototype._updateDisplayProperties = function() {
    // Get the source circle
    var sourceCircle = ChakraApp.appState.getCircle(this.sourceCircleId);
    
    if (sourceCircle) {
      // Update all display properties from source circle
      this.color = sourceCircle.color;
      this.name = sourceCircle.name;
      this.circleType = sourceCircle.circleType;
      this.isValid = true;
      
      // Update icon based on circle type
      this.icon = this._getIconForCircleType(sourceCircle.circleType);
    } else {
      // Source circle no longer exists
      this.isValid = false;
      this.name = '[Deleted Circle]';
      this.icon = '❌';
    }
  };

  ChakraApp.CircleReferenceViewModel.prototype._getIconForCircleType = function(circleType) {
    var iconMap = {
      'standard': '◉',     // Circle with dot
      'triangle': '▲',     // Triangle
      'gem': '💎',         // Diamond/gem
      'star': '★',         // Star
      'hexagon': '◉▲★'     // Cluster showing standard circle, triangle, and star together
    };
    
    return iconMap[circleType] || iconMap['standard'];
  };
  
  /**
   * Set up event subscriptions
   * @private
   */
  ChakraApp.CircleReferenceViewModel.prototype._setupSubscriptions = function() {
    var self = this;
    
    // Listen for model changes
    this.modelSubscription = this.model.subscribe(function(change) {
      if (change.type === 'update') {
        self._updateFromModel();
      } else if (change.type === 'select') {
        self.isSelected = true;
        self.notify({ type: 'select' });
      } else if (change.type === 'deselect') {
        self.isSelected = false;
        self.notify({ type: 'deselect' });
      }
    });
    
    // Listen for direct circle reference updates via EventBus
    this.circleReferenceUpdateSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_REFERENCE_UPDATED,
      function(circleReference) {
        if (circleReference.id === self.id) {
          self._updateFromModel();
        }
      }
    );
    
    // Listen for source circle changes - this should trigger name AND color updates
    this.circleUpdateSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_UPDATED,
      function(circle) {
        if (circle.id === self.sourceCircleId) {
          self._updateDisplayProperties();
          self.notify({ type: 'update' });
        }
      }
    );
    
    // Listen for source circle deletion
    this.circleDeletedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DELETED,
      function(data) {
        if (data.id === self.sourceCircleId) {
          // Source circle was deleted, this reference should be removed
          ChakraApp.appState.removeCircleReference(self.id);
        }
      }
    );
  };
  
  /**
   * Update properties from model
   * @private
   */
  ChakraApp.CircleReferenceViewModel.prototype._updateFromModel = function() {
    // Store the old field radius to check for changes
    var oldFieldRadius = this.fieldRadius;
    
    // Update all properties from model
    this.x = this.model.x;
    this.y = this.model.y;
    this.fieldRadius = this.model.fieldRadius; // Update fieldRadius from model
    
    // Update display properties in case source circle changed
    this._updateDisplayProperties();
    
    // Always notify of update, but include info about field radius change
    this.notify({ 
      type: 'update',
      fieldRadiusChanged: oldFieldRadius !== this.fieldRadius
    });
  };
  
  /**
   * Update position
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  ChakraApp.CircleReferenceViewModel.prototype.updatePosition = function(x, y) {
    this.x = x;
    this.y = y;
    
    // Update the model
    ChakraApp.appState.updateCircleReference(this.id, { x: x, y: y });
  };
  
  /**
   * Update field radius
   * @param {number} newRadius - New field radius
   */
  ChakraApp.CircleReferenceViewModel.prototype.updateFieldRadius = function(newRadius) {
    var oldRadius = this.fieldRadius;
    this.fieldRadius = newRadius;
    
    // Update the model - this will trigger the AppState update chain
    ChakraApp.appState.updateCircleReference(this.id, { fieldRadius: newRadius });
    
    // Immediately notify the view of the change (don't wait for model update chain)
    this.notify({ 
      type: 'update',
      fieldRadiusChanged: true,
      immediate: true
    });
  };
  
  /**
   * Increase field radius
   */
  ChakraApp.CircleReferenceViewModel.prototype.increaseFieldRadius = function() {
    var newRadius = Math.min(300, this.fieldRadius + 20); // Max radius of 300
    this.updateFieldRadius(newRadius);
  };
  
  /**
   * Decrease field radius
   */  
  ChakraApp.CircleReferenceViewModel.prototype.decreaseFieldRadius = function() {
    var newRadius = Math.max(20, this.fieldRadius - 20); // Min radius of 20
    this.updateFieldRadius(newRadius);
  };
  
  /**
   * Get source circle
   * @returns {Object|null} Source circle or null
   */
  ChakraApp.CircleReferenceViewModel.prototype.getSourceCircle = function() {
    return this.model.getSourceCircle();
  };
  
  /**
   * Clean up subscriptions
   */
  ChakraApp.CircleReferenceViewModel.prototype.destroy = function() {
    if (this.modelSubscription) {
      this.modelSubscription();
    }
    if (this.circleUpdateSubscription) {
      this.circleUpdateSubscription();
    }
    if (this.circleDeletedSubscription) {
      this.circleDeletedSubscription();
    }
    if (this.circleReferenceUpdateSubscription) {
      this.circleReferenceUpdateSubscription();
    }
    
    this.model = null;
  };
  
})(window.ChakraApp = window.ChakraApp || {});
