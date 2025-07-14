// src/controllers/TabController.js
(function(ChakraApp) {
  /**
   * Controls tabs UI and interactions
   */
  ChakraApp.TabController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.tabsContainer = null;
    this.addTabButton = null;
    
    // Event subscriptions
    this.circleSelectedSubscription = null;
    this.circleDeselectedSubscription = null;
    this.tabCreatedSubscription = null;
    this.tabUpdatedSubscription = null;
    this.tabDeletedSubscription = null;
    this.tabSelectedSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.TabController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.TabController.prototype.constructor = ChakraApp.TabController;
  
  // Initialize
  ChakraApp.TabController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Create tabs container
    this._createTabsContainer();
    
    // Set up event subscriptions
    this._setupEventSubscriptions();
  };
  
  /**
   * Create tabs container
   * @private
   */
  ChakraApp.TabController.prototype._createTabsContainer = function() {
    // Create tabs container if it doesn't exist
    if (!document.getElementById('tabs-container')) {
      var topPanel = document.getElementById('top-panel');
      
      this.tabsContainer = document.createElement('div');
      this.tabsContainer.id = 'tabs-container';
      this.tabsContainer.className = 'tabs-container';
      
      // Add to top panel
      topPanel.appendChild(this.tabsContainer);
      
      // Add CSS to style the tabs
      var style = document.createElement('style');
      style.textContent = `
        .tabs-container {
          display: none;
          width: 100%;
          overflow-x: auto;
          border-bottom: 1px solid #444;
	  margin-top: 15px;
        }
        
        .tab {
          margin-right: 2px;
          background-color: #333;
          color: #aaa;
          border-radius: 5px 5px 0 0;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          position: relative;
          transition: all 0.2s ease;
		      padding: 0px 4px;
        }
        
        .tab:hover {
          background-color: #444;
        }
        
        .tab.active {
          background-color: #555;
          color: white;
        }
        
        .tab-name {
          display: inline-block;
          min-width: 40px;
          max-width: 150px;
          text-overflow: ellipsis;
	  font-size: 11px;
        }
        
        .tab.add-tab {
          width: 30px;
          text-align: center;
          flex-shrink: 0;
          background-color: #2a2a2a;
        }
        
        .tab.add-tab:hover {
          background-color: #444;
        }
        
        .tab-close {
          margin-left: 8px;
          font-size: 14px;
          display: inline-block;
          width: 16px;
          text-align: center;
          line-height: 14px;
          border-radius: 50%;
	  font-size: 11px;
        }
        
        .tab-close:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .tab.active .tab-close:hover {
          background-color: rgba(255, 0, 0, 0.3);
        }
        
        .tab-input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          width: 100%;
          min-width: 50px;
        }
      `;
      document.head.appendChild(style);
    } else {
      this.tabsContainer = document.getElementById('tabs-container');
    }
  };
  
  /**
   * Set up event subscriptions
   * @private
   */
  ChakraApp.TabController.prototype._setupEventSubscriptions = function() {
    var self = this;
    
    // Subscribe to circle selection events
    this.circleSelectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(circle) {
        self._handleCircleSelected(circle);
      }
    );
    
    // Subscribe to circle deselection events
    this.circleDeselectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        self._handleCircleDeselected();
      }
    );
    
    // Subscribe to tab events
    this.tabCreatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.TAB_CREATED,
      function(tab) {
        self._updateTabs();
      }
    );
    
    this.tabUpdatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.TAB_UPDATED,
      function(tab) {
        self._updateTabs();
      }
    );
    
    this.tabDeletedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.TAB_DELETED,
      function() {
        self._updateTabs();
      }
    );
    
    this.tabSelectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.TAB_SELECTED,
      function(tab) {
        self._updateTabs();
      }
    );
  };
  
  /**
   * Handle circle selection
   * @private
   * @param {Circle} circle - Selected circle
   */
  ChakraApp.TabController.prototype._handleCircleSelected = function(circle) {
    // Show tabs container
    if (this.tabsContainer) {
      this.tabsContainer.style.display = 'flex';
    }
    
    // Get tabs for this circle
    var tabs = ChakraApp.appState.getTabsForCircle(circle.id);
    
    var selectedTabId = null;
    
    // If no tabs exist, create a default tab
    if (tabs.length === 0) {
      var newTab = ChakraApp.appState.addTab({
        name: "Story",
        circleId: circle.id,
        index: 0
      });
      selectedTabId = newTab.id;
    } else {
      // Select the first tab
      selectedTabId = tabs[0].id;
    }
    
    // FIXED: Select the tab BEFORE migrating squares and updating display
    ChakraApp.appState.selectTab(selectedTabId);

    // Migrate any unassigned squares to the first tab
    this._migrateUnassignedSquares(circle.id);
    
    // FIXED: Now show squares for the selected tab only
    if (selectedTabId) {
        this._showSquaresForSelectedTab(circle.id, selectedTabId);
    }
    
    // Update the tabs display
    this._updateTabs();
};

ChakraApp.TabController.prototype._showSquaresForSelectedTab = function(circleId, tabId) {
    // Get squares for this circle
    var squaresForCircle = ChakraApp.appState.getSquaresForCircle(circleId);
    
    var viewManager = ChakraApp.app && ChakraApp.app.viewManager;
    
    // Show only squares that belong to the selected tab
    squaresForCircle.forEach(function(square) {
        if (square.tabId === tabId) {
            square.show();
            
            // Create view if it doesn't exist
            if (viewManager && !viewManager.squareViews.has(square.id)) {
                viewManager.createSquareView(square);
            } else if (viewManager) {
                // Update existing view visibility
                var squareView = viewManager.squareViews.get(square.id);
                if (squareView && squareView.element) {
                    squareView.element.style.display = 'flex';
                    if (typeof squareView.update === 'function') {
                        squareView.update();
                    }
                }
            }
        } else {
            // Hide squares that don't belong to this tab
            square.hide();
            
            // Hide view if it exists
            if (viewManager && viewManager.squareViews.has(square.id)) {
                var squareView = viewManager.squareViews.get(square.id);
                if (squareView && squareView.element) {
                    squareView.element.style.display = 'none';
                }
            }
        }
    });
    
    // Update connections for the visible squares
    ChakraApp.appState._updateConnectionsForCircleId(circleId);
};
  
  /**
   * Handle circle deselection
   * @private
   */
  ChakraApp.TabController.prototype._handleCircleDeselected = function() {
    // Hide tabs container
    if (this.tabsContainer) {
      this.tabsContainer.style.display = 'none';
    }
    
    // Deselect current tab
    ChakraApp.appState.deselectTab();
    
    // Clear the tabs UI
    this._clearTabs();
  };
  
  /**
   * Clear tabs UI
   * @private
   */
  ChakraApp.TabController.prototype._clearTabs = function() {
    if (this.tabsContainer) {
      this.tabsContainer.innerHTML = '';
    }
  };
  
  /**
   * Update tabs UI
   * @private
   */
  ChakraApp.TabController.prototype._updateTabs = function() {
    if (!ChakraApp.appState.selectedCircleId || !this.tabsContainer) {
      return;
    }
    
    // Clear existing tabs
    this._clearTabs();
    
    // Get tabs for the selected circle
    var tabs = ChakraApp.appState.getTabsForCircle(ChakraApp.appState.selectedCircleId);
    var selectedTabId = ChakraApp.appState.selectedTabId;
    
    // Create tabs UI
    var self = this;
    tabs.forEach(function(tab) {
      var tabElement = self._createTabElement(tab, tab.id === selectedTabId);
      self.tabsContainer.appendChild(tabElement);
    });
    
    // Add the "+" tab at the end
    this.addTabButton = this._createAddTabButton();
    this.tabsContainer.appendChild(this.addTabButton);
  };
  
  /**
   * Create a tab element
   * @private
   * @param {Tab} tab - Tab model
   * @param {boolean} isActive - Whether this tab is active
   * @returns {HTMLElement} Created tab element
   */
  ChakraApp.TabController.prototype._createTabElement = function(tab, isActive) {
    var self = this;
    
    // Create tab element
    var tabElement = document.createElement('div');
    tabElement.className = 'tab' + (isActive ? ' active' : '');
    tabElement.dataset.id = tab.id;
    
    // Create tab name
    var tabName = document.createElement('span');
    tabName.className = 'tab-name';
    tabName.textContent = tab.name;
    tabElement.appendChild(tabName);
    
    // Create close button (only if there are multiple tabs)
    if (ChakraApp.appState.getTabsForCircle(tab.circleId).length > 1) {
      var closeButton = document.createElement('span');
      closeButton.className = 'tab-close';
      closeButton.innerHTML = '&times;';
      closeButton.title = 'Close Tab';
      
      // Close button click handler
      closeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Show a confirmation dialog if there are squares in this tab
        var hasSquares = false;
        ChakraApp.appState.squares.forEach(function(square) {
          if (square.tabId === tab.id) {
            hasSquares = true;
          }
        });
        
        if (hasSquares) {
          if (confirm('Are you sure you want to close this tab? All squares in this tab will be deleted.')) {
            self._removeTab(tab.id);
          }
        } else {
          self._removeTab(tab.id);
        }
      });
      
      tabElement.appendChild(closeButton);
    }
    
    // Double click to rename
    tabElement.addEventListener('dblclick', function(e) {
      // Replace tab name with input
      var input = document.createElement('input');
      input.className = 'tab-input';
      input.value = tab.name;
      input.maxLength = 30;
      
      // Replace tab name with input
      tabName.textContent = '';
      tabName.appendChild(input);
      
      // Focus the input
      input.focus();
      input.select();
      
      // Stop propagation
      e.stopPropagation();
      
      // Handle input events
      function saveTabName() {
        var newName = input.value.trim() || 'Tab ' + (tab.index + 1);
        ChakraApp.appState.updateTab(tab.id, { name: newName });
        
        // Remove input and restore tab name
        tabName.textContent = newName;
      }
      
      input.addEventListener('blur', saveTabName);
      
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          saveTabName();
          e.preventDefault();
        } else if (e.key === 'Escape') {
          // Cancel editing
          tabName.textContent = tab.name;
          e.preventDefault();
        }
        
        e.stopPropagation();
      });
    });
    
    // Tab click handler
    tabElement.addEventListener('click', function(e) {
      if (e.target !== closeButton) {
        ChakraApp.appState.selectTab(tab.id);
      }
    });
    
    return tabElement;
  };
  
  /**
   * Create add tab button
   * @private
   * @returns {HTMLElement} Add tab button element
   */
  ChakraApp.TabController.prototype._createAddTabButton = function() {
    var self = this;
    
    // Create add tab button
    var addButton = document.createElement('div');
    addButton.className = 'tab add-tab';
    addButton.innerHTML = '+';
    addButton.title = 'Add New Tab';
    
    // Add tab click handler
    addButton.addEventListener('click', function() {
      // Get current circle ID
      var circleId = ChakraApp.appState.selectedCircleId;
      if (!circleId) return;
      
      // Get existing tabs for this circle
      var tabs = ChakraApp.appState.getTabsForCircle(circleId);
      var nextIndex = tabs.length;
      
      // Create a new tab
      var newTab = ChakraApp.appState.addTab({
        name: 'Tab ' + (nextIndex + 1),
        circleId: circleId,
        index: nextIndex
      });
      
      // Select the new tab
      ChakraApp.appState.selectTab(newTab.id);
      
      // Update tabs UI
      self._updateTabs();
    });
    
    return addButton;
  };
  
  /**
   * Remove a tab
   * @private
   * @param {string} tabId - ID of tab to remove
   */
  ChakraApp.TabController.prototype._removeTab = function(tabId) {
    // Get the circle ID and tabs
    var circleId = ChakraApp.appState.selectedCircleId;
    var tabs = ChakraApp.appState.getTabsForCircle(circleId);
    
    // Get the tab to be removed
    var tabToRemove = ChakraApp.appState.getTab(tabId);
    var tabIndex = tabToRemove.index;
    
    // If this was the selected tab, select another tab
    if (ChakraApp.appState.selectedTabId === tabId) {
      // Try to select the previous tab, or the next one if it was the first
      var newSelectedIndex = tabIndex > 0 ? tabIndex - 1 : (tabs.length > 1 ? 1 : 0);
      
      // Find the tab with this index
      var newSelectedTab = null;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].index === newSelectedIndex) {
          newSelectedTab = tabs[i];
          break;
        }
      }
      
      if (newSelectedTab) {
        ChakraApp.appState.selectTab(newSelectedTab.id);
      }
    }
    
    // Remove the tab
    ChakraApp.appState.removeTab(tabId);
    
    // Update the indices of the remaining tabs
    var updatedTabs = ChakraApp.appState.getTabsForCircle(circleId);
    for (var i = 0; i < updatedTabs.length; i++) {
      var tab = updatedTabs[i];
      if (tab.index > tabIndex) {
        ChakraApp.appState.updateTab(tab.id, { index: tab.index - 1 });
      }
    }
    
    // Update the tabs UI
    this._updateTabs();
  };

  /**
 * Migrate existing unassigned squares to the first tab of their circle
 * @private
 */
  ChakraApp.TabController.prototype._migrateUnassignedSquares = function(circleId) {
	  // Get the first tab for this circle
	  var tabs = ChakraApp.appState.getTabsForCircle(circleId);
	  if (tabs.length === 0) {
		  // No tabs exist yet, nothing to migrate to
		  return;
	  }

	  var firstTab = tabs[0];

	  // Find all squares for this circle that don't have a tabId
	  var squaresToMigrate = [];
	  ChakraApp.appState.squares.forEach(function(square) {
		  if (square.circleId === circleId && (!square.tabId || square.tabId === null)) {
			  squaresToMigrate.push(square);
		  }
	  });

	  // Assign these squares to the first tab
	  squaresToMigrate.forEach(function(square) {
		  ChakraApp.appState.updateSquare(square.id, { tabId: firstTab.id });
	  });
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.TabController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up event subscriptions
    if (this.circleSelectedSubscription) {
      this.circleSelectedSubscription();
      this.circleSelectedSubscription = null;
    }
    
    if (this.circleDeselectedSubscription) {
      this.circleDeselectedSubscription();
      this.circleDeselectedSubscription = null;
    }
    
    if (this.tabCreatedSubscription) {
      this.tabCreatedSubscription();
      this.tabCreatedSubscription = null;
    }
    
    if (this.tabUpdatedSubscription) {
      this.tabUpdatedSubscription();
      this.tabUpdatedSubscription = null;
    }
    
    if (this.tabDeletedSubscription) {
      this.tabDeletedSubscription();
      this.tabDeletedSubscription = null;
    }
    
    if (this.tabSelectedSubscription) {
      this.tabSelectedSubscription();
      this.tabSelectedSubscription = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
