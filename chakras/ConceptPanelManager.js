// src/controllers/ConceptPanelManager.js
(function(ChakraApp) {
  /**
   * Manages concept panels dynamically based on configuration
   */
  ChakraApp.ConceptPanelManager = {
    // Keep track of created panels
    panels: {},
    
    // Panel size configuration
    panelSizes: {
      width: 210,
      gap: 2
    },
    
    /**
     * Initialize all concept panels
     */
initialize: function() {
  // First, map the existing panels to their concept types
  this._mapExistingPanels();
  
  // Then, create the new panels
  this._createNewPanels();
  
  // Update styles for all panels
  this._updatePanelStyles();
  
  // Update AppState with the new panels
  this._updateAppState();
  
  // Listen for panel visibility changes
  this._setupEventListeners();
},

_setupEventListeners: function() {
  var self = this;
  
  // Subscribe to panel visibility events
  ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, function(data) {
    // Update panel styles when any panel visibility changes
    self._updatePanelStyles();
    
    // Update toggle button positions if panel controller is available
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
      self._updateToggleButtonPositions(ChakraApp.app.controllers.panel);
    }
  });
},
    
    /**
     * Map existing panels to their concept types
     * @private
     */
    _mapExistingPanels: function() {
      var conceptTypes = ChakraApp.Config.conceptTypes;
      
      // Find concept types that map to existing panels
      conceptTypes.forEach(function(conceptType) {
        if (conceptType.panelId) {
          var panel = document.getElementById(conceptType.panelId + '-panel');
          
          if (panel) {
            // Store reference to the panel
            this.panels[conceptType.id] = {
              element: panel,
              id: conceptType.panelId,
              conceptType: conceptType,
              existing: true
            };
            
            // Update panel attributes
            panel.dataset.conceptType = conceptType.id;
            
            // Update panel title
            var titleElement = panel.querySelector('h3');
            if (titleElement) {
              titleElement.textContent = conceptType.name;
            }
          }
        }
      }, this);
    },
    
    /**
     * Create new panels for concept types that don't map to existing ones
     * @private
     */
    _createNewPanels: function() {
      var conceptTypes = ChakraApp.Config.conceptTypes;
      var mainContainer = document.getElementById('main-container');
      
      // Create panels for concept types without existing panels
      conceptTypes.forEach(function(conceptType) {
        if (!conceptType.panelId && !this.panels[conceptType.id]) {
          // Generate a panel ID
          var panelId = conceptType.id.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Create the panel element
          var panel = document.createElement('div');
          panel.id = panelId + '-panel';
          panel.className = 'circle-panel concept-panel';
          panel.dataset.panelId = panelId;
          panel.dataset.conceptType = conceptType.id;
          
          // Set initial panel style
          panel.style.height = '100%';
          panel.style.borderLeft = 'var(--panel-border)';
          panel.style.position = 'relative';
          panel.style.width = this.panelSizes.width + 'px';
          
          // Add panel header
          var header = document.createElement('h3');
          header.textContent = conceptType.name;
          panel.appendChild(header);
          
          // Add the "Add Circle" button
          var addBtn = document.createElement('button');
          addBtn.id = 'add-circle-btn-' + panelId;
          addBtn.className = 'add-btn circle-btn';
          addBtn.dataset.panelId = panelId;
          addBtn.textContent = '+';
          panel.appendChild(addBtn);
          
          // Create the zoom container for the panel
	  var zoomContainer = document.createElement('div');
zoomContainer.id = 'zoom-container-' + panelId;
zoomContainer.className = 'zoom-container';
zoomContainer.dataset.panelId = panelId;
zoomContainer.style.position = 'relative'; // Ensure position is set
zoomContainer.style.overflow = 'hidden';  // Ensure overflow is handled
zoomContainer.style.width = '100%';       // Ensure width is set
zoomContainer.style.height = '100%';      // Ensure height is set
panel.appendChild(zoomContainer);
          
          // Add to main container
          mainContainer.appendChild(panel);
          
          // Store reference to the new panel
          this.panels[conceptType.id] = {
            element: panel,
            id: panelId,
            conceptType: conceptType,
            existing: false
          };
        }
      }, this);
    },
    
    /**
     * Update panel styles based on position
     * @private
     */
    _updatePanelStyles: function() {
  var conceptTypes = ChakraApp.Config.conceptTypes;
  
  // Sort concept types by position
  var sortedTypes = conceptTypes.slice().sort(function(a, b) {
    return a.position - b.position;
  });
  
  // Calculate right position for each panel
  var currentRight = 0;
  
  // Start from the rightmost panel
  for (var i = sortedTypes.length - 1; i >= 0; i--) {
    var conceptType = sortedTypes[i];
    var panel = this.panels[conceptType.id];
    
    if (panel && panel.element) {
      // Skip left panel
      if (panel.id === 'left') continue;
      
      // Check panel visibility
      var isVisible = true;
      if (ChakraApp.appState.panelVisibility.hasOwnProperty(panel.id)) {
        isVisible = ChakraApp.appState.panelVisibility[panel.id];
      }
      
      if (isVisible) {
        // Set position for visible panel
        panel.element.style.position = 'absolute';
        panel.element.style.top = '0';
        panel.element.style.right = currentRight + 'px';
        panel.element.style.width = this.panelSizes.width + 'px';
        
        // Update current right position for next panel
        currentRight += this.panelSizes.width + this.panelSizes.gap;
        panel.element.style.transform = 'none';
      } else {
        // Hide panel
        panel.element.style.transform = 'translateX(100%)';
      }
    }
  }
},
    
    /**
     * Update AppState with the new panels
     * @private
     */
    _updateAppState: function() {
      // Only proceed if AppState exists
      if (!ChakraApp.appState) return;
      
      // Get all panel IDs
      var panelIds = ['left', 'bottom']; // Keep the existing ones
      
      // Add new panel IDs
      Object.values(this.panels).forEach(function(panel) {
        if (panel.id !== 'left' && panel.id !== 'bottom' && !panelIds.includes(panel.id)) {
          panelIds.push(panel.id);
        }
      });
      
      // Update AppState panels array
      ChakraApp.appState.panels = panelIds;
      
      // Initialize panel visibility
      panelIds.forEach(function(panelId) {
        if (ChakraApp.appState.panelVisibility[panelId] === undefined) {
          ChakraApp.appState.panelVisibility[panelId] = false;
        }
      });
      
      // Initialize selected document IDs
      panelIds.forEach(function(panelId) {
        if (ChakraApp.appState.selectedDocumentIds[panelId] === undefined) {
          ChakraApp.appState.selectedDocumentIds[panelId] = null;
        }
      });
      
      // Initialize document list visibility
      panelIds.forEach(function(panelId) {
        if (ChakraApp.appState.documentListVisible[panelId] === undefined) {
          ChakraApp.appState.documentListVisible[panelId] = false;
        }
      });
    },

    createToggleButtons: function() {
  console.log('Creating toggle buttons for dynamic panels');
  
  // Get panel controller
  if (!ChakraApp.app || !ChakraApp.app.controllers || !ChakraApp.app.controllers.panel) {
    console.error('Panel controller not found');
    return;
  }
  
  var panelController = ChakraApp.app.controllers.panel;
  
  // Create buttons for new panels
  Object.values(this.panels).forEach(function(panel, ind) {
    // Skip existing panels
    if (panel.existing) return;
    
    var panelId = panel.id;
    
    // Create button if it doesn't exist
    if (!panelController.toggleButtons[panelId]) {
      console.log('Creating toggle button for panel', panelId);
      
      var btn = document.createElement('button');
      btn.id = 'toggle-' + panelId + '-panel';
      btn.className = 'panel-toggle-btn';
      btn.dataset.panelId = panelId;

      var btnLabel = document.createElement('span');
      btnLabel.className = 'panel-toggle-btn-label';
      btnLabel.innerHTML = panelId;
      
      // CHANGED: Create a simpler button content without nested elements
      // Just add the arrow character directly to the button
      //btn.innerHTML = '◀'; // Single arrow character
      
      // Set initial position
      btn.style.position = 'fixed';
      btn.style.top = (50 + 5 * ind) + '%';
      btn.style.right = (this.panels[panel.conceptType.id].element.offsetWidth) + 'px';
      btn.style.transform = 'translateY(-50%)';
      
      // Add click handler
      btn.addEventListener('click', function() {
        panelController.togglePanel(panelId);
      });
      
      // Store reference
      panelController.toggleButtons[panelId] = btn;

      btn.appendChild(btnLabel);
      
      // Add to document body
      document.body.appendChild(btn);
    }
  }, this);
  
  // Update panel visibility based on AppState
  this._updateToggleButtonPositions(panelController);
},

_updateToggleButtonPositions: function(panelController) {
  var conceptTypes = ChakraApp.Config.conceptTypes;
  
  // Sort concept types by position
  var sortedTypes = conceptTypes.slice().sort(function(a, b) {
    return a.position - b.position;
  });
  
  // Calculate positions for right panel toggle buttons
  var buttonWidth = 10;
  var buttonSpacing = 30;
  var currentRight = 0;
  
  // Update positions for right panels
  for (var i = sortedTypes.length - 1; i >= 0; i--) {
    var conceptType = sortedTypes[i];
    var panel = this.panels[conceptType.id];
    var subsequentVisiblePanelCount = 0;
	  for (var j = sortedTypes.length - 1; j >= 0; j--) {
		var compConceptType = sortedTypes[j];
		if (compConceptType.position > conceptType.position && ChakraApp.appState.panelVisibility[compConceptType.id]) {
			subsequentVisiblePanelCount++;
		}
	  }
    
    if (panel && panel.id !== 'left' && panel.id !== 'bottom') {
      var btn = panelController.toggleButtons[panel.id];
      
      if (btn) {
        // Calculate position based on panel visibility
        var isVisible = ChakraApp.appState.panelVisibility[panel.id];
        var buttonRight = isVisible ? 
          (currentRight + this.panelSizes.width) : 
          currentRight;
        
        // Update button position
        //btn.style.right = buttonRight + 'px';
        //btn.style.right = (subsequentVisiblePanelCount * 211 + 211) + 'px';
        btn.style.right = '0px';
        
        if (isVisible) {
          btn.classList.remove('panel-hidden');
        } else {
          btn.classList.add('panel-hidden');
        }
        
        // Update current right position for next button
        if (isVisible) {
          currentRight += this.panelSizes.width + this.panelSizes.gap;
        } else {
          currentRight += buttonWidth + buttonSpacing;
        }
      }
    }
  }
}
    
  };
  
})(window.ChakraApp = window.ChakraApp || {});
