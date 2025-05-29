// src/viewmodels/CircleReferenceViewModel.js
// View model for circle references

(function(ChakraApp) {
  /**
   * Circle Reference View Model
   * @param {Object} circleReferenceModel - Circle reference model
   */
  ChakraApp.CircleReferenceViewModel = function(circleReferenceModel) {
    // Call parent constructor
    ChakraApp.Observable.call(this);
    
    // Store model reference
    this.model = circleReferenceModel;
    
    // Copy properties from model
    this.id = this.model.id;
    this.sourceCircleId = this.model.sourceCircleId;
    this.tabId = this.model.tabId;
    this.x = this.model.x;
    this.y = this.model.y;
    this.isSelected = this.model.selected;
    
    // Display properties (derived from source circle)
    this._updateDisplayProperties();
    
    // Set up subscriptions
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
    var displayProps = this.model.getDisplayProperties();
    
    this.name = displayProps.name;
    this.color = displayProps.color;
    this.icon = displayProps.icon;
    this.circleType = displayProps.circleType;
    this.isValid = this.model.isValid();
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
