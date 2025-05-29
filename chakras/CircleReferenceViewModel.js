// src/viewmodels/CircleReferenceViewModel.js
// View model for circle references

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
  
  // Initialize display properties
  this.color = '#C0C0C0';
  this.name = 'Loading...';
  this.icon = '◉';
  this.isValid = true;
  this.circleType = 'standard'; // Add this line!
  
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
    this.circleType = sourceCircle.circleType; // Add this line!
    this.isValid = true;
    
    // Update icon based on circle type
    this.icon = this._getIconForCircleType(sourceCircle.circleType);
    
    console.log('Updated circle reference display properties:', {
      color: this.color,
      name: this.name,
      circleType: this.circleType,
      icon: this.icon
    });
  } else {
    // Source circle no longer exists
    this.isValid = false;
    this.name = '[Deleted Circle]';
    this.icon = '❌';
    
    console.log('Source circle no longer exists for reference:', this.sourceCircleId);
  }
};

ChakraApp.CircleReferenceViewModel.prototype._getIconForCircleType = function(circleType) {
  var iconMap = {
    'standard': '◉',    // Circle with dot
    'triangle': '▲',    // Triangle
    'gem': '💎',        // Diamond/gem
    'star': '★',        // Star
    'hexagon': '⬡'      // Hexagon
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
  
  // ADDITIONAL: Direct subscription to circle updates for immediate name changes
  this.directCircleUpdateSubscription = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.CIRCLE_UPDATED,
    function(circle) {
      if (circle.id === self.sourceCircleId) {
        // Update all display properties including name
        var oldName = self.name;
        self._updateDisplayProperties();
        
        // Immediately notify the view to update
        self.notify({ type: 'update' });
      }
    }
  );
};
  
  /**
   * Update properties from model
   * @private
   */
  ChakraApp.CircleReferenceViewModel.prototype._updateFromModel = function() {
  this.x = this.model.x;
  this.y = this.model.y;
  
  // Update display properties in case source circle changed
  this._updateDisplayProperties();
  
  this.notify({ type: 'update' });
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
    
    this.model = null;
  };
  
})(window.ChakraApp = window.ChakraApp || {});
