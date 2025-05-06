
// src/viewmodels/BaseViewModel.js
// Base class for view models

(function(ChakraApp) {
  /**
   * Base view model class
   */
  ChakraApp.BaseViewModel = function() {
    // Inherit from Observable
    ChakraApp.Observable.call(this);
  };
  
  // Inherit from Observable
  ChakraApp.BaseViewModel.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.BaseViewModel.prototype.constructor = ChakraApp.BaseViewModel;
  
  // Common functionality for all view models
  ChakraApp.BaseViewModel.prototype.destroy = function() {
    // Clean up any resources or subscriptions
  };
  
})(window.ChakraApp = window.ChakraApp || {});


// src/viewmodels/CircleViewModel.js
// View model for Circle

(function(ChakraApp) {
  /**
   * Circle view model
   * @param {Circle} circleModel - Circle model instance
   */
  ChakraApp.CircleViewModel = function(circleModel) {
    // Call parent constructor
    ChakraApp.BaseViewModel.call(this);
    
    this.model = circleModel;
    this.id = circleModel.id;
    
    // Properties derived from the model
    this.name = circleModel.name;
    this.x = circleModel.x;
    this.y = circleModel.y;
    this.color = circleModel.color;
    this.crystal = circleModel.crystal;
    this.isSelected = circleModel.selected;
    this.isDimmed = false;
    this.size = circleModel.size || 20;
    this.characteristics = circleModel.characteristics || {};
    this.documentId = circleModel.documentId;
    
    // Calculate chakra form based on square count
    this.chakraForm = ChakraApp.Utils.getChakraFormForCircle(
      circleModel.id,
      circleModel.name,
      circleModel.squareCount || 0
    );
    
    // Flag to track if square count has changed
    this.squareCountChanged = false;
    this._previousSquareCount = circleModel.squareCount || 0;
    
    // Subscribe to model changes
    this._setupSubscriptions();
  };
  
  // Inherit from BaseViewModel
  ChakraApp.CircleViewModel.prototype = Object.create(ChakraApp.BaseViewModel.prototype);
  ChakraApp.CircleViewModel.prototype.constructor = ChakraApp.CircleViewModel;
  
  // Set up subscriptions to model changes
  ChakraApp.CircleViewModel.prototype._setupSubscriptions = function() {
    var self = this;
    
    // Listen for model changes
    this.modelSubscription = this.model.subscribe(function(change) {
      // Update local properties
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
    
    // Listen for global circle selection events
    this.selectionSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(selectedCircle) {
        // Dim this circle if it's not the selected one
        if (selectedCircle.id !== self.id) {
          self.isDimmed = true;
          self.notify({ type: 'dim', isDimmed: true });
        } else {
          self.isDimmed = false;
          self.notify({ type: 'dim', isDimmed: false });
        }
      }
    );
    
    // Listen for circle deselection
    this.deselectionSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        // Undim all circles when nothing is selected
        self.isDimmed = false;
        self.notify({ type: 'dim', isDimmed: false });
      }
    );
  };
  
  // Update view model properties from model
  ChakraApp.CircleViewModel.prototype._updateFromModel = function() {
  // Store previous name to detect changes from/to default
  var previousName = this.name;

  // Update properties from model
  this.name = this.model.name;
  this.x = this.model.x;
  this.y = this.model.y;
  this.color = this.model.color;
  this.crystal = this.model.crystal;
  this.characteristics = this.model.characteristics || {}; // Add this line
  this.documentId = this.model.documentId; // Fixed: changed from circleModel to this.model

  // Check if square count has changed
  var currentSquareCount = this.model.squareCount || 0;
  this.squareCountChanged = currentSquareCount !== this._previousSquareCount;

  // Check if name changed between default and non-default
  var wasDefaultName = previousName === ChakraApp.Config.defaultName;
  var isDefaultName = this.name === ChakraApp.Config.defaultName;
  var nameStatusChanged = wasDefaultName !== isDefaultName;

  // Update chakra form if square count changed OR name changed between default/non-default
  if (this.squareCountChanged || nameStatusChanged) {
    this.chakraForm = ChakraApp.Utils.getChakraFormForCircle(
      this.model.id,
      this.model.name,
      currentSquareCount
    );
    this._previousSquareCount = currentSquareCount;
  }

  // Notify observers
  this.notify({ type: 'update' });
};

ChakraApp.CircleViewModel.prototype.updateCharacteristic = function(key, value) {
  var update = {};
  
  // Handle legacy properties (color) and new characteristics
  if (key === 'color') {
    update.color = value;
  } else {
    // For new characteristics (including completion), update the characteristics object
    var characteristics = Object.assign({}, this.characteristics || {});
    if (value === null || value === '') {
      // Remove the characteristic if null/empty value
      delete characteristics[key];
    } else {
      // Otherwise set the new value
      characteristics[key] = value;
    }
    update.characteristics = characteristics;
  }
  
  ChakraApp.appState.updateCircle(this.id, update);
};
  
  // UI actions
  
  // Select this circle
  ChakraApp.CircleViewModel.prototype.select = function() {
    ChakraApp.appState.selectCircle(this.id);
  };
  
  // Deselect this circle
  ChakraApp.CircleViewModel.prototype.deselect = function() {
    if (this.isSelected) {
      ChakraApp.appState.deselectCircle();
    }
  };
  
  // Update position
  ChakraApp.CircleViewModel.prototype.updatePosition = function(x, y) {
    ChakraApp.appState.updateCircle(this.id, { x: x, y: y });
  };
  
  // Update name
  ChakraApp.CircleViewModel.prototype.updateName = function(name) {
    ChakraApp.appState.updateCircle(this.id, { name: name });
  };
  
  // Update color
  ChakraApp.CircleViewModel.prototype.updateColor = function(color, crystal) {
    ChakraApp.appState.updateCircle(this.id, { color: color, crystal: crystal });
  };
  
  // Delete this circle
  ChakraApp.CircleViewModel.prototype.delete = function() {
    ChakraApp.appState.removeCircle(this.id);
  };
  
  // Clean up resources
  ChakraApp.CircleViewModel.prototype.destroy = function() {
    // Call parent destroy method
    ChakraApp.BaseViewModel.prototype.destroy.call(this);
    
    if (this.modelSubscription) {
      this.modelSubscription();
    }
    
    if (this.selectionSubscription) {
      this.selectionSubscription();
    }
    
    if (this.deselectionSubscription) {
      this.deselectionSubscription();
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});

// src/viewmodels/SquareViewModel.js
// View model for Square

(function(ChakraApp) {
  /**
   * Square view model
   * @param {Square} squareModel - Square model instance
   */
  ChakraApp.SquareViewModel = function(squareModel) {
    // Call parent constructor
    ChakraApp.BaseViewModel.call(this);
    
    this.model = squareModel;
    this.id = squareModel.id;
    
    // Properties derived from the model
    this.name = squareModel.name;
    this.x = squareModel.x;
    this.y = squareModel.y;
    this.color = squareModel.color;
    this.attribute = squareModel.attribute;
    this.circleId = squareModel.circleId;
    this.isSelected = squareModel.selected;
    this.isVisible = squareModel.visible;
    this.size = squareModel.size || 30;
    this.isBold = squareModel.isBold || false;
    
    // Emoji for the attribute
    this.emoji = this._getEmojiForAttribute();
    
    // Subscribe to model changes
    this._setupSubscriptions();
  };
  
  // Inherit from BaseViewModel
  ChakraApp.SquareViewModel.prototype = Object.create(ChakraApp.BaseViewModel.prototype);
  ChakraApp.SquareViewModel.prototype.constructor = ChakraApp.SquareViewModel;
  
  // Get emoji based on attribute or if it's a Me square
  ChakraApp.SquareViewModel.prototype._getEmojiForAttribute = function() {
    if (this.attribute && ChakraApp.Config.attributeInfo[this.attribute]) {
      return ChakraApp.Config.attributeInfo[this.attribute].emoji;
    }
    
    return null;
  };

  ChakraApp.SquareViewModel.prototype.toggleBold = function() {
	  // Toggle bold state
	  ChakraApp.appState.updateSquare(this.id, { isBold: !this.isBold });
  };
  
  // Set up subscriptions to model changes
  ChakraApp.SquareViewModel.prototype._setupSubscriptions = function() {
    var self = this;
    
    // Listen for model changes
    this.modelSubscription = this.model.subscribe(function(change) {
      // Update local properties
      if (change.type === 'update') {
        self._updateFromModel();
      } else if (change.type === 'select') {
        self.isSelected = true;
        self.notify({ type: 'select' });
      } else if (change.type === 'deselect') {
        self.isSelected = false;
        self.notify({ type: 'deselect' });
      } else if (change.type === 'visibility') {
        self.isVisible = change.model.visible;
        self.notify({ type: 'visibility', isVisible: self.isVisible });
      }
    });
  };
  
  // Update view model properties from model
  ChakraApp.SquareViewModel.prototype._updateFromModel = function() {
    this.name = this.model.name;
    this.x = this.model.x;
    this.y = this.model.y;
    this.color = this.model.color;
    this.attribute = this.model.attribute;
    this.isBold = this.model.isBold;
    
    // Update emoji if attribute changed
    this.emoji = this._getEmojiForAttribute();
    
    // Notify observers
    this.notify({ type: 'update' });
  };
  
  // UI actions
  
  // Select this square
  ChakraApp.SquareViewModel.prototype.select = function() {
    ChakraApp.appState.selectSquare(this.id);
  };
  
  // Deselect this square
  ChakraApp.SquareViewModel.prototype.deselect = function() {
    if (this.isSelected) {
      ChakraApp.appState.deselectSquare();
    }
  };
  
  // Update position
  ChakraApp.SquareViewModel.prototype.updatePosition = function(x, y) {
    ChakraApp.appState.updateSquare(this.id, { x: x, y: y });
  };
  
  // Update name
  ChakraApp.SquareViewModel.prototype.updateName = function(name) {
    ChakraApp.appState.updateSquare(this.id, { name: name });
  };
  
  // Apply attribute to the square
  ChakraApp.SquareViewModel.prototype.applyAttribute = function(attribute) {
    // Get attribute data
    var attributeData = ChakraApp.Config.attributeInfo[attribute];
    if (!attributeData) return;
    
    // Update square with new attribute
    ChakraApp.appState.updateSquare(this.id, {
      attribute: attribute,
      color: attributeData.color
    });
  };
  
  // Delete this square
  ChakraApp.SquareViewModel.prototype.delete = function() {
    ChakraApp.appState.removeSquare(this.id);
  };
  
  // Clean up resources
  ChakraApp.SquareViewModel.prototype.destroy = function() {
    // Call parent destroy method
    ChakraApp.BaseViewModel.prototype.destroy.call(this);
    
    if (this.modelSubscription) {
      this.modelSubscription();
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});

// src/viewmodels/ConnectionViewModel.js
// View model for Connection

(function(ChakraApp) {
  /**
   * Connection view model
   * @param {Connection} connectionModel - Connection model instance
   */
  ChakraApp.ConnectionViewModel = function(connectionModel) {
    // Call parent constructor
    ChakraApp.BaseViewModel.call(this);
    
    this.model = connectionModel;
    this.id = connectionModel.id;
    
    // Properties derived from the model
    this.sourceId = connectionModel.sourceId;
    this.targetId = connectionModel.targetId;
    this.length = connectionModel.length;
    this.isHighlighted = connectionModel.isHighlighted;
    this.isVisible = connectionModel.isVisible;
    
    // Subscribe to model changes
    this._setupSubscriptions();
  };
  
  // Inherit from BaseViewModel
  ChakraApp.ConnectionViewModel.prototype = Object.create(ChakraApp.BaseViewModel.prototype);
  ChakraApp.ConnectionViewModel.prototype.constructor = ChakraApp.ConnectionViewModel;
  
  // Set up subscriptions to model changes
  ChakraApp.ConnectionViewModel.prototype._setupSubscriptions = function() {
    var self = this;
    
    // Listen for model changes
    this.modelSubscription = this.model.subscribe(function(change) {
      // Update local properties
      if (change.type === 'update') {
        self._updateFromModel();
      }
    });
  };
  
  // Update view model properties from model
  ChakraApp.ConnectionViewModel.prototype._updateFromModel = function() {
    this.sourceId = this.model.sourceId;
    this.targetId = this.model.targetId;
    this.length = this.model.length;
    this.isHighlighted = this.model.isHighlighted;
    this.isVisible = this.model.isVisible;
    
    // Notify observers
    this.notify({ type: 'update' });
  };
  
  // Clean up resources
  ChakraApp.ConnectionViewModel.prototype.destroy = function() {
    // Call parent destroy method
    ChakraApp.BaseViewModel.prototype.destroy.call(this);
    
    if (this.modelSubscription) {
      this.modelSubscription();
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});

