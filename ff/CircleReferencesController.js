ChakraApp.CircleReferencesController = function() {
  ChakraApp.BaseController.call(this);
  
  // View management
  this.circleReferenceViews = new Map();
  this.centerPanel = null;
  
  // Event subscriptions
  this.eventSubscriptions = {};
};

ChakraApp.CircleReferencesController.prototype = Object.create(ChakraApp.BaseController.prototype);
ChakraApp.CircleReferencesController.prototype.constructor = ChakraApp.CircleReferencesController;

ChakraApp.CircleReferencesController.prototype.init = function() {
  ChakraApp.BaseController.prototype.init.call(this);
  
  this.centerPanel = document.getElementById('center-panel');
  
  // Set up event subscriptions
  this._setupEventSubscriptions();
  
  // Render existing circle references
  this._renderExistingCircleReferences();
};

ChakraApp.CircleReferencesController.prototype._setupEventSubscriptions = function() {
  var self = this;
  
  // Circle reference created
  this.eventSubscriptions.created = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.CIRCLE_REFERENCE_CREATED,
    function(circleReference) {
      self._createCircleReferenceView(circleReference);
    }
  );
  
  // Circle reference deleted
  this.eventSubscriptions.deleted = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.CIRCLE_REFERENCE_DELETED,
    function(data) {
      self._removeCircleReferenceView(data.id);
    }
  );
  
  // Tab selected - show/hide appropriate circle references
  this.eventSubscriptions.tabSelected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.TAB_SELECTED,
    function(tab) {
      self._showCircleReferencesForTab(tab.id);
    }
  );
  
  // Tab deselected - hide all circle references  
  this.eventSubscriptions.tabDeselected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.TAB_DESELECTED,
    function() {
      self._hideAllCircleReferences();
    }
  );
  
  // Circle selected - show circle references for current tab
  this.eventSubscriptions.circleSelected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.CIRCLE_SELECTED,
    function(circle) {
      // Show circle references for the current tab if one is selected
      if (ChakraApp.appState.selectedTabId) {
        self._showCircleReferencesForTab(ChakraApp.appState.selectedTabId);
      }
    }
  );
  
  // Circle deselected - hide all circle references
  this.eventSubscriptions.circleDeselected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.CIRCLE_DESELECTED,
    function() {
      self._hideAllCircleReferences();
    }
  );
  
  // State loaded - re-render existing circle references after data is loaded
  this.eventSubscriptions.stateLoaded = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.STATE_LOADED,
    function() {
      self._renderExistingCircleReferences();
    }
  );
};

ChakraApp.CircleReferencesController.prototype._renderExistingCircleReferences = function() {
  var self = this;
  ChakraApp.appState.circleReferences.forEach(function(circleReference) {
    self._createCircleReferenceView(circleReference);
  });
  
  // Show circle references for current tab if any
  if (ChakraApp.appState.selectedTabId) {
    this._showCircleReferencesForTab(ChakraApp.appState.selectedTabId);
  }
};

ChakraApp.CircleReferencesController.prototype._createCircleReferenceView = function(circleReference) {
  if (!this.centerPanel) {
    console.error('Center panel not found!');
    return;
  }
  
  try {
    var viewModel = new ChakraApp.CircleReferenceViewModel(circleReference);
    
    var view = new ChakraApp.CircleReferenceView(viewModel, this.centerPanel);
    
    this.circleReferenceViews.set(circleReference.id, {
      viewModel: viewModel,
      view: view
    });
    
    // Initially hidden until shown by tab selection
    view.element.style.display = 'none';
    
    // If there's a currently selected tab, show this circle reference if it belongs to that tab
    if (ChakraApp.appState.selectedTabId && circleReference.tabId === ChakraApp.appState.selectedTabId) {
      view.element.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error creating circle reference view:', error);
  }
};

ChakraApp.CircleReferencesController.prototype._removeCircleReferenceView = function(circleReferenceId) {
  var viewData = this.circleReferenceViews.get(circleReferenceId);
  if (viewData) {
    viewData.view.destroy();
    viewData.viewModel.destroy();
    this.circleReferenceViews.delete(circleReferenceId);
  }
};

ChakraApp.CircleReferencesController.prototype._showCircleReferencesForTab = function(tabId) {
  // Hide all circle references first
  this._hideAllCircleReferences();
  
  var shownCount = 0;
  
  // Show circle references for this tab
  this.circleReferenceViews.forEach(function(viewData, circleReferenceId) {
    if (viewData.viewModel.tabId === tabId) {
      viewData.view.element.style.display = 'block';
      shownCount++;
    }
  });
  
};

ChakraApp.CircleReferencesController.prototype._hideAllCircleReferences = function() {
  this.circleReferenceViews.forEach(function(viewData) {
    viewData.view.element.style.display = 'none';
  });
};

ChakraApp.CircleReferencesController.prototype.destroy = function() {
  ChakraApp.BaseController.prototype.destroy.call(this);
  
  // Clean up all views
  this.circleReferenceViews.forEach(function(viewData) {
    viewData.view.destroy();
    viewData.viewModel.destroy();
  });
  this.circleReferenceViews.clear();
  
  // Clean up event subscriptions
  Object.values(this.eventSubscriptions).forEach(function(unsubscribe) {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
  this.eventSubscriptions = {};
};
