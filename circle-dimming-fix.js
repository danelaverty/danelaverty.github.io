// Fix for the circle dimming issue in CircleViewModel.js

/**
 * The main issue is in how the CircleViewModel handles the subscription to circle selection events.
 * This fix enhances the subscription logic to ensure consistent dimming behavior.
 */

(function(ChakraApp) {
  // Get the original CircleViewModel constructor
  var originalCircleViewModel = ChakraApp.CircleViewModel;
  
  // Override with enhanced version
  ChakraApp.CircleViewModel = function(circleModel) {
    // Call the original constructor
    originalCircleViewModel.call(this, circleModel);
    
    // The rest will be the same, but we'll enhance the subscription setup
  };
  
  // Inherit from the original prototype
  ChakraApp.CircleViewModel.prototype = Object.create(originalCircleViewModel.prototype);
  ChakraApp.CircleViewModel.prototype.constructor = ChakraApp.CircleViewModel;
  
  // Override the subscription setup method with enhanced version
  ChakraApp.CircleViewModel.prototype._setupSubscriptions = function() {
    var self = this;
    
    // Listen for model changes (same as original)
    this.modelSubscription = this.model.subscribe(function(change) {
      // Update local properties
      if (change.type === 'update') {
        self._updateFromModel();
      } else if (change.type === 'select') {
        self.isSelected = true;
        self.isDimmed = false; // Ensure selected circle is not dimmed
        self.notify({ type: 'select' });
        self.notify({ type: 'dim', isDimmed: false }); // Explicitly notify about dim state
      } else if (change.type === 'deselect') {
        self.isSelected = false;
        self.notify({ type: 'deselect' });
      }
    });
    
    // Enhanced listener for global circle selection events
    this.selectionSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(selectedCircle) {
        // Dim this circle if it's not the selected one
        if (selectedCircle.id !== self.id) {
          self.isDimmed = true;
          self.notify({ type: 'dim', isDimmed: true });
          
          // Force an update to the DOM if needed
          var circleElement = document.querySelector('.circle[data-id="' + self.id + '"]');
          if (circleElement && !circleElement.classList.contains('dimmed')) {
            circleElement.classList.add('dimmed');
          }
        } else {
          self.isDimmed = false;
          self.notify({ type: 'dim', isDimmed: false });
          
          // Force an update to the DOM if needed
          var circleElement = document.querySelector('.circle[data-id="' + self.id + '"]');
          if (circleElement && circleElement.classList.contains('dimmed')) {
            circleElement.classList.remove('dimmed');
          }
        }
      }
    );
    
    // Enhanced listener for circle deselection
    this.deselectionSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        // Undim all circles when nothing is selected
        self.isDimmed = false;
        self.notify({ type: 'dim', isDimmed: false });
        
        // Force an update to the DOM if needed
        var circleElement = document.querySelector('.circle[data-id="' + self.id + '"]');
        if (circleElement && circleElement.classList.contains('dimmed')) {
          circleElement.classList.remove('dimmed');
        }
      }
    );
  };
  
  // Enhanced update method to ensure dimming state is applied
  var originalUpdate = ChakraApp.CircleViewModel.prototype.update;
  ChakraApp.CircleViewModel.prototype.update = function() {
    // Call the original update method
    originalUpdate.apply(this, arguments);
    
    // Check if a circle is selected and apply dimming accordingly
    if (ChakraApp.appState.selectedCircleId && 
        ChakraApp.appState.selectedCircleId !== this.id &&
        !this.isDimmed) {
      this.isDimmed = true;
      this.notify({ type: 'dim', isDimmed: true });
      
      // Force DOM update if needed
      var circleElement = document.querySelector('.circle[data-id="' + this.id + '"]');
      if (circleElement && !circleElement.classList.contains('dimmed')) {
        circleElement.classList.add('dimmed');
      }
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});


// Fix for CircleView.js to enhance the dimming handling

(function(ChakraApp) {
  // Get the original CircleView constructor
  var originalCircleView = ChakraApp.CircleView;
  
  // Override with enhanced version
  ChakraApp.CircleView = function(viewModel, parentElement) {
    // Call the original constructor
    originalCircleView.call(this, viewModel, parentElement);
    
    // Apply initial dimming state if needed
    if (viewModel.isDimmed) {
      this.element.classList.add('dimmed');
    }
  };
  
  // Inherit from the original prototype
  ChakraApp.CircleView.prototype = Object.create(originalCircleView.prototype);
  ChakraApp.CircleView.prototype.constructor = ChakraApp.CircleView;
  
  // Override the _setupViewModelSubscription method with enhanced version
  var originalSetupViewModelSubscription = ChakraApp.CircleView.prototype._setupViewModelSubscription;
  ChakraApp.CircleView.prototype._setupViewModelSubscription = function() {
    // Call the parent method
    originalSetupViewModelSubscription.call(this);
    
    var self = this;
    
    // Add explicit handler for dim events
    if (this.viewModel && typeof this.viewModel.subscribe === 'function') {
      this._addHandler(this.viewModel.subscribe(function(change) {
        if (change.type === 'dim') {
          if (change.isDimmed) {
            self.element.classList.add('dimmed');
          } else {
            self.element.classList.remove('dimmed');
          }
        }
      }));
    }
    
    // Add a global listener for circle selection to ensure dimming
    this._addHandler(ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(selectedCircle) {
        if (selectedCircle.id !== self.viewModel.id) {
          self.element.classList.add('dimmed');
        } else {
          self.element.classList.remove('dimmed');
        }
      }
    ));
    
    // Add a global listener for circle deselection to ensure undimming
    this._addHandler(ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        self.element.classList.remove('dimmed');
      }
    ));
  };
  
  // Override the update method with enhanced version
  var originalUpdate = ChakraApp.CircleView.prototype.update;
  ChakraApp.CircleView.prototype.update = function() {
    // Call the original update method
    originalUpdate.call(this);
    
    // Ensure dimming state is correct
    if (this.viewModel.isDimmed && !this.element.classList.contains('dimmed')) {
      this.element.classList.add('dimmed');
    } else if (!this.viewModel.isDimmed && this.element.classList.contains('dimmed')) {
      this.element.classList.remove('dimmed');
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});


// Additional CSS enhancements for more pronounced dimming effect

// This code should be added to your styles.css or embedded in the head
(function() {
  // Create a style element
  var style = document.createElement('style');
  
  // Add enhanced dimming styles
  style.textContent = `
    /* Enhanced dimming styles */
    .circle.dimmed {
      opacity: 0.35 !important;
      transition: opacity 0.3s ease !important;
    }
    
    .circle.dimmed:hover {
      opacity: 0.6 !important;
    }
    
    /* Make selected circles glow a bit more */
    .circle.selected {
      box-shadow: 0 0 12px 4px rgba(255, 255, 255, 0.8) !important;
      z-index: 15 !important;
    }
  `;
  
  // Append to document head
  document.head.appendChild(style);
})();


// Implementation checker function - Add this to help diagnose
// if the fix is properly applied

function checkCircleDimmingFixApplied() {
  console.log('Checking if circle dimming fix is applied...');
  
  // Check if our enhancements have been applied
  var enhancements = {
    viewModel: typeof ChakraApp.CircleViewModel.prototype._setupSubscriptions === 'function',
    view: typeof ChakraApp.CircleView.prototype._setupViewModelSubscription === 'function',
    cssAdded: document.querySelector('style[data-circle-dimming-fix]') !== null
  };
  
  console.log('Enhancement status:', enhancements);
  
  // Check current circle states
  var circles = document.querySelectorAll('.circle');
  var selectedId = ChakraApp.appState.selectedCircleId;
  
  console.log('Selected circle ID:', selectedId);
  console.log('Total circles:', circles.length);
  
  var dimmingStatus = {
    selectedCircle: null,
    totalDimmed: 0,
    totalUndimmed: 0,
    incorrect: []
  };
  
  circles.forEach(function(circle) {
    var id = circle.dataset.id;
    var isDimmed = circle.classList.contains('dimmed');
    var shouldBeDimmed = selectedId && id !== selectedId;
    
    if (id === selectedId) {
      dimmingStatus.selectedCircle = {
        id: id,
        isDimmed: isDimmed,
        correct: !isDimmed
      };
    }
    
    if (isDimmed) {
      dimmingStatus.totalDimmed++;
    } else {
      dimmingStatus.totalUndimmed++;
    }
    
    if ((shouldBeDimmed && !isDimmed) || (!shouldBeDimmed && isDimmed)) {
      dimmingStatus.incorrect.push({
        id: id,
        isDimmed: isDimmed,
        shouldBeDimmed: shouldBeDimmed
      });
    }
  });
  
  console.log('Dimming status:', dimmingStatus);
  
  // Verdict
  if (dimmingStatus.incorrect.length === 0) {
    console.log('✅ Circle dimming appears to be working correctly!');
    return true;
  } else {
    console.log('❌ Circle dimming issues detected. See incorrect circles above.');
    return false;
  }
}

// Run this function in the browser console after the page loads to check if
// the fix is working properly
// window.addEventListener('load', function() {
//   setTimeout(checkCircleDimmingFixApplied, 1000);
// });
