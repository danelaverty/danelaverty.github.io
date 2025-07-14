// src/controllers/PanelManager.js - Part 1
(function(ChakraApp) {
  ChakraApp.PanelController = function() {
    ChakraApp.BaseController.call(this);
    this.initializePanelElements();
    this.initializeToggleButtons();
    this.initializeEventSubscriptions();
    this.initializePanelSizes();
    this.initializeNewPanelsList();
  };
  
  ChakraApp.PanelController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.PanelController.prototype.constructor = ChakraApp.PanelController;
  
  ChakraApp.PanelController.prototype.initializePanelElements = function() {
    this.mainContainer = null;
    this.leftPanel = null;
    this.bottomPanel = null;
    this.centerContainer = null;
    this.topPanel = null;
    this.centerPanel = null;
  };
  
  ChakraApp.PanelController.prototype.initializeToggleButtons = function() {
    this.toggleButtons = {};
  };
  
  ChakraApp.PanelController.prototype.initializeEventSubscriptions = function() {
    this.eventSubscriptions = {};
  };
  
  ChakraApp.PanelController.prototype.initializePanelSizes = function() {
    this.panelSizes = {
      width: 310,
      gap: 2
    };
  };
  
  ChakraApp.PanelController.prototype.initializeNewPanelsList = function() {
    this.newlyCreatedPanels = [];
  };
  
  ChakraApp.PanelController.prototype.init = function() {
    ChakraApp.BaseController.prototype.init.call(this);
    this.findDomElements();
    this.setupDynamicPanels();
    this.createToggleButtonsForPanels();
    this.setupEventListeners();
    this.applyInitialPanelStates();
    this.updatePanelStacking();
    this.notifyPanelsCreated();
    this.addHidingStyles();
    this.updatePanelStyles();
  };
  
  ChakraApp.PanelController.prototype.findDomElements = function() {
    this.mainContainer = document.getElementById('main-container');
    this.leftPanel = document.getElementById('left-panel');
    this.bottomPanel = document.getElementById('bottom-panel');
    this.centerContainer = document.getElementById('center-container');
    this.topPanel = document.getElementById('top-panel');
    this.centerPanel = document.getElementById('center-panel');
  };
  
  ChakraApp.PanelController.prototype.setupDynamicPanels = function() {
    this.concepts = {
      panels: {}
    };
    
    this.mapExistingPanels();
    this.createNewPanels();
    this.updateAppState();
    this.updatePanelStyles();
  };
  
  ChakraApp.PanelController.prototype.mapExistingPanels = function() {
  // Use circleTypes instead of conceptTypes
  var circleTypes = ChakraApp.Config.circleTypes || [];
  
  circleTypes.forEach(function(circleType) {
    // Adapt the circleType to the format expected by mapPanelIfExists
    var adaptedType = {
      id: circleType.id,
      name: circleType.name,
      description: circleType.description,
      shape: circleType.shape,
      color: circleType.color,
      position: circleType.position,
      panelId: circleType.id  // Add a panelId property for backward compatibility
    };
    
    this.mapPanelIfExists(adaptedType);
  }, this);
};
  
  ChakraApp.PanelController.prototype.mapPanelIfExists = function(conceptType) {
    if (!conceptType.panelId) return;
    
    var panel = document.getElementById(conceptType.panelId + '-panel');
    if (!panel) return;
    
    this.storeExistingPanelReference(conceptType, panel);
    this.updateExistingPanelAttributes(conceptType, panel);
  };
  
  ChakraApp.PanelController.prototype.storeExistingPanelReference = function(conceptType, panel) {
    this.concepts.panels[conceptType.id] = {
      element: panel,
      id: conceptType.panelId,
      conceptType: conceptType,
      existing: true
    };
  };
  
  ChakraApp.PanelController.prototype.updateExistingPanelAttributes = function(conceptType, panel) {
    panel.dataset.conceptType = conceptType.id;
  };
  
ChakraApp.PanelController.prototype.createNewPanels = function() {
  var circleTypes = ChakraApp.Config.circleTypes || [];
  
  circleTypes.forEach(function(circleType) {
    // Adapt the circleType to the format expected by createPanelIfNeeded
    var adaptedType = {
      id: circleType.id,
      name: circleType.name,
      description: circleType.description,
      shape: circleType.shape,
      color: circleType.color,
      position: circleType.position,
      panelId: circleType.id  // Add a panelId property for backward compatibility
    };
    
    this.createPanelIfNeeded(adaptedType);
  }, this);
};
  
  ChakraApp.PanelController.prototype.createPanelIfNeeded = function(conceptType) {
    if (conceptType.panelId || this.concepts.panels[conceptType.id]) return;
    
    var panelId = this.generatePanelId(conceptType);
    var panel = this.createPanelElement(conceptType, panelId);
    
    this.appendPanelToMainContainer(panel);
    this.storePanelReference(conceptType, panel, panelId);
    
    this.trackNewlyCreatedPanel(panelId);
  };
  
  ChakraApp.PanelController.prototype.trackNewlyCreatedPanel = function(panelId) {
    this.newlyCreatedPanels.push(panelId);
  };
  
  ChakraApp.PanelController.prototype.notifyPanelsCreated = function() {
    if (this.newlyCreatedPanels.length === 0) return;
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANELS_CREATED, {
      panels: this.newlyCreatedPanels.slice()
    });
    
    this.newlyCreatedPanels = [];
  };
  
  ChakraApp.PanelController.prototype.generatePanelId = function(conceptType) {
    return conceptType.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  };
  
  ChakraApp.PanelController.prototype.createPanelElement = function(conceptType, panelId) {
    var panel = document.createElement('div');
    this.setupPanelAttributes(panel, conceptType, panelId);
    this.addPanelHeader(panel, conceptType);
    this.addCircleButton(panel, panelId);
    this.addZoomContainer(panel, panelId);
    
    return panel;
  };
  
  ChakraApp.PanelController.prototype.setupPanelAttributes = function(panel, conceptType, panelId) {
    panel.id = panelId + '-panel';
    panel.className = 'circle-panel concept-panel';
    panel.dataset.panelId = panelId;
    panel.dataset.conceptType = conceptType.id;
    
    panel.style.height = '100%';
    panel.style.borderLeft = 'var(--panel-border)';
    panel.style.position = 'relative';
    panel.style.width = this.panelSizes.width + 'px';
  };
  
  ChakraApp.PanelController.prototype.addPanelHeader = function(panel, conceptType) {
    var header = document.createElement('h3');
    header.textContent = conceptType.name;
    panel.appendChild(header);
  };
  
  ChakraApp.PanelController.prototype.addCircleButton = function(panel, panelId) {
    var addBtn = document.createElement('button');
    addBtn.id = 'add-circle-btn-' + panelId;
    addBtn.className = 'add-btn circle-btn';
    addBtn.dataset.panelId = panelId;
    addBtn.textContent = '+';
    panel.appendChild(addBtn);
  };
  
  ChakraApp.PanelController.prototype.addZoomContainer = function(panel, panelId) {
    var zoomContainer = document.createElement('div');
    zoomContainer.id = 'zoom-container-' + panelId;
    zoomContainer.className = 'zoom-container';
    zoomContainer.dataset.panelId = panelId;
    zoomContainer.style.position = 'relative';
    zoomContainer.style.overflow = 'hidden';
    zoomContainer.style.width = '100%';
    zoomContainer.style.height = '100%';
    panel.appendChild(zoomContainer);
  };
  
  ChakraApp.PanelController.prototype.appendPanelToMainContainer = function(panel) {
    this.mainContainer.appendChild(panel);
  };
  
  ChakraApp.PanelController.prototype.storePanelReference = function(conceptType, panel, panelId) {
    this.concepts.panels[conceptType.id] = {
      element: panel,
      id: panelId,
      conceptType: conceptType,
      existing: false
    };
  };
  
  ChakraApp.PanelController.prototype.updateAppState = function() {
    if (!ChakraApp.appState) return;
    
    var panelIds = this.collectAllPanelIds();
    this.updateAppStatePanels(panelIds);
    this.initializeAppPanelVisibility(panelIds);
    //this.initializeSelectedDocumentIds(panelIds);
    this.initializeDocumentListVisibility(panelIds);
  };
  
  ChakraApp.PanelController.prototype.collectAllPanelIds = function() {
    var panelIds = ['left'];
    
    Object.values(this.concepts.panels).forEach(function(panel) {
      if (panel.id !== 'left' && !panelIds.includes(panel.id)) {
        panelIds.push(panel.id);
      }
    });
    
    return panelIds;
  };
  
  ChakraApp.PanelController.prototype.updateAppStatePanels = function(panelIds) {
    ChakraApp.appState.panels = panelIds;
  };
  
ChakraApp.PanelController.prototype.initializeAppPanelVisibility = function(panelIds) {
  var savedPanelVisibility = this.loadSavedPanelVisibility();
  
  panelIds.forEach(function(panelId) {
    this.initializeSinglePanelVisibility(panelId, savedPanelVisibility);
  }, this);
};
  
  ChakraApp.PanelController.prototype.loadSavedPanelVisibility = function() {
    try {
      var savedState = localStorage.getItem('chakraPanelVisibility');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error('Error loading panel visibility state:', e);
    }
    return {};
  };
  
  ChakraApp.PanelController.prototype.initializeSinglePanelVisibility = function(panelId, savedPanelVisibility) {
    if (savedPanelVisibility && savedPanelVisibility[panelId] !== undefined) {
      ChakraApp.appState.panelVisibility[panelId] = savedPanelVisibility[panelId];
    } else if (ChakraApp.appState.panelVisibility[panelId] === undefined) {
      ChakraApp.appState.panelVisibility[panelId] = true;
    }
  };
  
  ChakraApp.PanelController.prototype.initializeSelectedDocumentIds = function(panelIds) {
    panelIds.forEach(function(panelId) {
      if (ChakraApp.appState.selectedDocumentIds[panelId] === undefined) {
        ChakraApp.appState.selectedDocumentIds[panelId] = null;
      }
    });
  };
  
ChakraApp.PanelController.prototype.initializeDocumentListVisibility = function() {
  // Initialize for all circle types, not panels
  if (ChakraApp.Config && ChakraApp.Config.circleTypes) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      if (ChakraApp.appState.documentListVisible[circleType.id] === undefined) {
        ChakraApp.appState.documentListVisible[circleType.id] = false;
      }
    });
  }
};

  ChakraApp.PanelController.prototype.createToggleButtonsForPanels = function() {
    var standardPanels = ['left'];
    standardPanels.forEach(this.createToggleButtonForPanel.bind(this));
    //this.createToggleButtonsForDynamicPanels();
  };
  
  ChakraApp.PanelController.prototype.createToggleButtonForPanel = function(panelId) {
    var button = this.buildPanelToggleButton(panelId);
    this.registerToggleButtonForPanel(panelId, button);
    this.addToggleButtonToDocument(button);
  };
  
  ChakraApp.PanelController.prototype.createToggleButtonsForDynamicPanels = function() {
    var self = this;
    Object.values(this.concepts.panels).forEach(function(panel, index) {
      if (panel.existing || panel.id === 'left') return;
      
      if (!self.toggleButtons[panel.id]) {
        self.createDynamicPanelToggleButton(panel, index);
      }
    });
  };
  
  ChakraApp.PanelController.prototype.createDynamicPanelToggleButton = function(panel, index) {
    var btn = document.createElement('button');
    var panelId = panel.id;
    
    this.setupDynamicToggleButtonAttributes(btn, panelId, panel, index);
    
    var btnLabel = this.createToggleButtonLabel(panelId);
    btn.appendChild(btnLabel);
    
    this.attachToggleButtonClickHandler(btn, panelId);
    this.toggleButtons[panelId] = btn;
    
    document.body.appendChild(btn);
  };
  
  ChakraApp.PanelController.prototype.setupDynamicToggleButtonAttributes = function(btn, panelId, panel, index) {
    btn.id = 'toggle-' + panelId + '-panel';
    btn.className = 'panel-toggle-btn';
    btn.dataset.panelId = panelId;
    
    btn.style.position = 'fixed';
    btn.style.top = (50 + 5 * index) + '%';
    btn.style.right = '0px';
    btn.style.transform = 'translateY(-50%)';
  };
  
  ChakraApp.PanelController.prototype.createToggleButtonLabel = function(panelId) {
    var btnLabel = document.createElement('span');
    btnLabel.className = 'panel-toggle-btn-label';
    btnLabel.innerHTML = panelId;
    return btnLabel;
  };
  
  ChakraApp.PanelController.prototype.buildPanelToggleButton = function(panelId) {
    var button = document.createElement('button');
    this.setupToggleButtonAttributes(button, panelId);
    this.attachToggleButtonClickHandler(button, panelId);
    return button;
  };
  
  ChakraApp.PanelController.prototype.setupToggleButtonAttributes = function(button, panelId) {
    button.id = 'toggle-' + panelId + '-panel';
    button.className = 'panel-toggle-btn';
    button.dataset.panelId = panelId;
  };
  
  ChakraApp.PanelController.prototype.attachToggleButtonClickHandler = function(button, panelId) {
    button.addEventListener('click', this.createPanelToggleHandler(panelId));
  };
  
  ChakraApp.PanelController.prototype.createPanelToggleHandler = function(panelId) {
    var self = this;
    return function() {
      self.togglePanel(panelId);
    };
  };
  
  ChakraApp.PanelController.prototype.registerToggleButtonForPanel = function(panelId, button) {
    this.toggleButtons[panelId] = button;
  };
  
  ChakraApp.PanelController.prototype.addToggleButtonToDocument = function(button) {
    //document.body.appendChild(button);
  };
  
  ChakraApp.PanelController.prototype.setupEventListeners = function() {
    this.subscribeToVisibilityChanges();
  };
  
  ChakraApp.PanelController.prototype.subscribeToVisibilityChanges = function() {
    this.eventSubscriptions.panelVisibility = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED,
      this.handlePanelVisibilityChanged.bind(this)
    );
  };
  
  ChakraApp.PanelController.prototype.handlePanelVisibilityChanged = function(data) {
    if (!this.isValidVisibilityChangeEvent(data)) return;
    
    this.applyVisibilityToPanel(data.panel, data.visible);
    this.updatePanelStyles();
    this.updateToggleButtonPositions();
  };
  
  ChakraApp.PanelController.prototype.isValidVisibilityChangeEvent = function(data) {
    return data.panel && data.visible !== undefined;
  };
  
  ChakraApp.PanelController.prototype.applyInitialPanelStates = function() {
    var self = this;
    Object.keys(ChakraApp.appState.panelVisibility).forEach(function(panelId) {
      var isVisible = ChakraApp.appState.panelVisibility[panelId];
      self.applyVisibilityToPanel(panelId, isVisible);
    });
  };
  
  ChakraApp.PanelController.prototype.applyVisibilityToPanel = function(panelId, visible) {
    var panel = this.getPanelElement(panelId);
    var toggleBtn = this.toggleButtons[panelId];
    
    if (!panel) return;
    
    this.updatePanelVisibilityClasses(panel, toggleBtn, visible);
    this.updateLayoutForVisibilityChanges();
  };
  
  ChakraApp.PanelController.prototype.updatePanelVisibilityClasses = function(panel, toggleBtn, visible) {
    if (visible) {
      this.showPanelElements(panel, toggleBtn);
    } else {
      this.hidePanelElements(panel, toggleBtn);
    }
  };
  
  ChakraApp.PanelController.prototype.showPanelElements = function(panel, toggleBtn) {
  panel.classList.remove('hidden');
  if (toggleBtn) {
    toggleBtn.classList.remove('panel-hidden');
  }
  
  if (panel.classList.contains('concept-panel')) {
    panel.style.visibility = 'visible';
  }
};
  
  ChakraApp.PanelController.prototype.hidePanelElements = function(panel, toggleBtn) {
  panel.classList.add('hidden');
  if (toggleBtn) {
    toggleBtn.classList.add('panel-hidden');
  }
  
  if (panel.classList.contains('concept-panel')) {
    panel.style.visibility = 'hidden';
    panel.style.zIndex = '-1';
  }
};
  
  ChakraApp.PanelController.prototype.updateLayoutForVisibilityChanges = function() {
    this.adjustLayoutBasedOnVisibility();
  };
  
  ChakraApp.PanelController.prototype.adjustLayoutBasedOnVisibility = function() {
    var leftVisible = ChakraApp.appState.panelVisibility.left;
    var bottomVisible = ChakraApp.appState.panelVisibility.bottom;
    
    this.adjustLeftPanelSize(leftVisible);
    this.adjustBottomPanelSize(bottomVisible);
    this.adjustCenterContainerSize(leftVisible);
  };
  
  ChakraApp.PanelController.prototype.adjustLeftPanelSize = function(leftVisible) {
    if (!this.leftPanel) return;
    
    this.leftPanel.style.width = leftVisible ? '400px' : '0';
  };
  
  ChakraApp.PanelController.prototype.adjustBottomPanelSize = function(bottomVisible) {
    if (!this.bottomPanel) return;
    
    this.bottomPanel.style.height = bottomVisible ? '150px' : '0';
  };
  
  ChakraApp.PanelController.prototype.adjustCenterContainerSize = function(leftVisible) {
    if (!this.centerContainer) return;
    
    this.centerContainer.style.width = leftVisible ? '75%' : '100%';
    this.centerContainer.style.flex = leftVisible ? '1' : '2';
  };
  
  ChakraApp.PanelController.prototype.getPanelElement = function(panelId) {
    switch (panelId) {
      case 'left': return this.leftPanel;
      case 'bottom': return this.bottomPanel;
      case 'center': return this.centerPanel;
      default: return this.findDynamicPanelById(panelId);
    }
  };
  
  ChakraApp.PanelController.prototype.findDynamicPanelById = function(panelId) {
    return document.querySelector('.circle-panel[data-panel-id="' + panelId + '"]');
  };
  
ChakraApp.PanelController.prototype.togglePanel = function(panelId) {
  this.ensurePanelInAppState(panelId);
  this.flipPanelVisibility(panelId);
  
  // Get updated visibility state
  var isVisible = ChakraApp.appState.panelVisibility[panelId];
  
  // Find the panel element
  var panel = this.getPanelElement(panelId);
  
  if (panel) {
    // Apply basic visibility class
    if (isVisible) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
    
    // Update toggle button if available
    var toggleBtn = this.toggleButtons[panelId];
    if (toggleBtn) {
      if (isVisible) {
        toggleBtn.classList.remove('panel-hidden');
      } else {
        toggleBtn.classList.add('panel-hidden');
      }
    }
  }
  
  // Trigger a complete layout update
  this.updateLayoutForVisibilityChanges();
  this.updatePanelStyles();
  this.updateToggleButtonPositions();
  
  // Publish event and save state
  this.publishVisibilityChangeEvent(panelId);
  this.savePanelStateToStorage();
  
  return isVisible;
};

ChakraApp.PanelController.prototype.addHidingStyles = function() {
  // Add a style element to enforce hiding
  var styleId = 'panel-hiding-styles';
  if (!document.getElementById(styleId)) {
    var style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .circle-panel.hidden,
      .concept-panel.hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        width: 0 !important;
        height: 0 !important;
        clip: rect(0, 0, 0, 0) !important;
        clip-path: polygon(0 0, 0 0, 0 0) !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        z-index: -999 !important;
      }
    `;
    document.head.appendChild(style);
  }
};
  
  ChakraApp.PanelController.prototype.ensurePanelInAppState = function(panelId) {
    if (!ChakraApp.appState.panelVisibility.hasOwnProperty(panelId)) {
      ChakraApp.appState.panelVisibility[panelId] = true;
    }
  };
  
  ChakraApp.PanelController.prototype.flipPanelVisibility = function(panelId) {
    ChakraApp.appState.panelVisibility[panelId] = !ChakraApp.appState.panelVisibility[panelId];
  };
  
  ChakraApp.PanelController.prototype.publishVisibilityChangeEvent = function(panelId) {
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, {
      panel: panelId,
      visible: ChakraApp.appState.panelVisibility[panelId]
    });
  };
  
  ChakraApp.PanelController.prototype.savePanelStateToStorage = function() {
    ChakraApp.appState._savePanelState();
  };
  
  ChakraApp.PanelController.prototype.showPanel = function(panelId) {
    if (!this.isPanelVisible(panelId)) {
      this.togglePanelVisibility(panelId);
    }
  };
  
  ChakraApp.PanelController.prototype.isPanelVisible = function(panelId) {
    return ChakraApp.appState.isPanelVisible(panelId);
  };
  
  ChakraApp.PanelController.prototype.togglePanelVisibility = function(panelId) {
    ChakraApp.appState.togglePanelVisibility(panelId);
  };
  
  ChakraApp.PanelController.prototype.hidePanel = function(panelId) {
    if (this.isPanelVisible(panelId)) {
      this.togglePanelVisibility(panelId);
    }
  };
  
  ChakraApp.PanelController.prototype.updatePanelStacking = function() {
    this.setMainPanelsZIndex();
    this.setConceptPanelsZIndex();
  };
  
  ChakraApp.PanelController.prototype.setMainPanelsZIndex = function() {
    if (this.leftPanel) this.leftPanel.style.zIndex = 10;
    if (this.bottomPanel) this.bottomPanel.style.zIndex = 10;
    if (this.centerPanel) this.centerPanel.style.zIndex = 10;
  };
  
  ChakraApp.PanelController.prototype.setConceptPanelsZIndex = function() {
    let panelIndex = 0;
    document.querySelectorAll('.concept-panel').forEach((panel) => {
      panel.style.zIndex = 20 + panelIndex;
      panel.style.overflow = 'hidden';
      panelIndex++;
    });
  };
  
  ChakraApp.PanelController.prototype.updatePanelStyles = function() {
    var sortedTypes = this.getSortedConceptTypes();
    //this.positionPanelsFromRight(sortedTypes);
    this.setMainPanelsZIndex();
  };
  
ChakraApp.PanelController.prototype.getSortedConceptTypes = function() {
  var circleTypes = ChakraApp.Config.circleTypes || [];
  return circleTypes.slice().sort(function(a, b) {
    return a.position - b.position;
  });
};
  
ChakraApp.PanelController.prototype.positionPanelsFromRight = function(sortedTypes) {
  // Reset positions of all panels first
  this.resetAllPanelPositions();
  
  // Get only the visible panels
  var visiblePanels = this.getVisiblePanelsSorted(sortedTypes);
  
  // Now position only the visible panels
  var currentRight = 0;
  
  visiblePanels.forEach(function(panelData, index) {
    this.positionVisiblePanel(panelData.panel, currentRight, panelData.zIndex);
    currentRight += this.panelSizes.width + this.panelSizes.gap;
  }, this);
  
  // Make sure invisible panels are truly hidden
  this.ensureInvisiblePanelsHidden(sortedTypes);
};

ChakraApp.PanelController.prototype.resetAllPanelPositions = function() {
  // Reset all custom panels
  Object.values(this.concepts.panels).forEach(function(panel) {
    if (panel && panel.element && panel.id !== 'left' && panel.id !== 'bottom') {
      panel.element.style.position = '';
      panel.element.style.top = '';
      panel.element.style.right = '';
      panel.element.style.zIndex = '';
    }
  });
};

ChakraApp.PanelController.prototype.getVisiblePanelsSorted = function(sortedTypes) {
  var visiblePanels = [];
  var highestZIndex = 20;
  
  // Process panels from right to left (highest to lowest position)
  for (var i = sortedTypes.length - 1; i >= 0; i--) {
    var conceptType = sortedTypes[i];
    var panel = this.concepts.panels[conceptType.id];
    
    if (panel && panel.element) {
      if (panel.id === 'left' || panel.id === 'bottom') continue;
      
      var isVisible = this.isPanelVisible(panel.id);
      
      if (isVisible) {
        visiblePanels.push({
          panel: panel,
          zIndex: highestZIndex + (sortedTypes.length - i)
        });
      }
    }
  }
  
  return visiblePanels;
};

ChakraApp.PanelController.prototype.ensureInvisiblePanelsHidden = function(sortedTypes) {
  sortedTypes.forEach(function(conceptType) {
    var panel = this.concepts.panels[conceptType.id];
    
    if (panel && panel.element && panel.id !== 'left' && panel.id !== 'bottom') {
      var isVisible = this.isPanelVisible(panel.id);
      
      if (!isVisible) {
        this.completelyHidePanel(panel.element);
      }
    }
  }, this);
};

ChakraApp.PanelController.prototype.completelyHidePanel = function(panelElement) {
  panelElement.style.display = 'none';
  panelElement.style.visibility = 'hidden';
  panelElement.style.position = 'absolute';
  panelElement.style.width = '0';
  panelElement.style.height = '0';
  panelElement.style.opacity = '0';
  panelElement.style.overflow = 'hidden';
  panelElement.style.pointerEvents = 'none';
  panelElement.style.zIndex = '-999';
  panelElement.style.clipPath = 'polygon(0 0, 0 0, 0 0, 0 0)'; // Clip to nothing
  panelElement.style.margin = '0';
  panelElement.style.padding = '0';
  panelElement.style.minWidth = '0';
  panelElement.style.minHeight = '0';
};
  
ChakraApp.PanelController.prototype.positionVisiblePanel = function(panel, currentRight, zIndex) {
  var element = panel.element;
  
  // Reset any hiding properties first
  element.style.display = 'block';
  element.style.visibility = 'visible';
  element.style.opacity = '1';
  element.style.pointerEvents = 'auto';
  element.style.clipPath = 'none';
  
  // Position the panel
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.right = currentRight + 'px';
  element.style.width = this.panelSizes.width + 'px';
  element.style.height = '100%';
  
  // Set stacking order
  element.style.zIndex = zIndex;
  element.style.overflow = 'hidden';
  
  // Remove any transforms
  element.style.transform = 'none';
};
  
  ChakraApp.PanelController.prototype.hideConceptPanel = function(panel) {
  panel.element.style.transform = 'translateX(100%)';
  panel.element.style.visibility = 'hidden';
  panel.element.style.zIndex = '-1';
};
  
  ChakraApp.PanelController.prototype.updateToggleButtonPositions = function() {
    var sortedTypes = this.getSortedConceptTypes();
    this.calculateButtonPositions(sortedTypes);
  };
  
  ChakraApp.PanelController.prototype.calculateButtonPositions = function(sortedTypes) {
    var buttonWidth = 10;
    var buttonSpacing = 30;
    var currentRight = 0;
    
    for (var i = sortedTypes.length - 1; i >= 0; i--) {
      var conceptType = sortedTypes[i];
      var panel = this.concepts.panels[conceptType.id];
      
      this.updateButtonPositionIfExists(panel, conceptType);
      
      if (panel && this.isPanelVisible(panel.id)) {
        currentRight += this.panelSizes.width + this.panelSizes.gap;
      } else if (panel) {
        currentRight += buttonWidth + buttonSpacing;
      }
    }
  };
  
  ChakraApp.PanelController.prototype.updateButtonPositionIfExists = function(panel, conceptType) {
    if (!panel || panel.id === 'left' || panel.id === 'bottom') return;
    
    var btn = this.toggleButtons[panel.id];
    if (!btn) return;
    
    var isVisible = ChakraApp.appState.panelVisibility[panel.id];
    this.positionToggleButton(btn, isVisible);
  };
  
  ChakraApp.PanelController.prototype.positionToggleButton = function(btn, isVisible) {
    btn.style.right = '0px';
    
    if (isVisible) {
      btn.classList.remove('panel-hidden');
    } else {
      btn.classList.add('panel-hidden');
    }
  };
  
  ChakraApp.PanelController.prototype.destroy = function() {
    ChakraApp.BaseController.prototype.destroy.call(this);
    this.unsubscribeFromAllEvents();
    this.removeAllToggleButtons();
    this.clearObjectReferences();
  };
  
  ChakraApp.PanelController.prototype.unsubscribeFromAllEvents = function() {
    Object.values(this.eventSubscriptions).forEach(this.unsubscribeFromEvent);
    this.eventSubscriptions = {};
  };
  
  ChakraApp.PanelController.prototype.unsubscribeFromEvent = function(unsubscribe) {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
  
  ChakraApp.PanelController.prototype.removeAllToggleButtons = function() {
    Object.values(this.toggleButtons).forEach(this.removeButtonFromDOM);
    this.toggleButtons = {};
  };
  
  ChakraApp.PanelController.prototype.removeButtonFromDOM = function(btn) {
    if (btn && btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
  };
  
  ChakraApp.PanelController.prototype.clearObjectReferences = function() {
    this.mainContainer = null;
    this.leftPanel = null;
    this.bottomPanel = null;
    this.centerContainer = null;
    this.topPanel = null;
    this.centerPanel = null;
    this.concepts.panels = {};
  };
  
  // Backward compatibility for any code that might directly reference ConceptPanelManager
  ChakraApp.ConceptPanelManager = {
    initialize: function() {
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
        ChakraApp.app.controllers.panel.updatePanelStacking();
      }
    },
    
    _updatePanelStyles: function() {
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
        ChakraApp.app.controllers.panel.updatePanelStyles();
      }
    },
    
    _updateToggleButtonPositions: function() {
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
        ChakraApp.app.controllers.panel.updateToggleButtonPositions();
      }
    },
    
    get panels() {
      if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.panel) {
        return ChakraApp.app.controllers.panel.concepts.panels;
      }
      return {};
    }
  };
  
  // Add the PANELS_CREATED event type if it doesn't already exist
  if (!ChakraApp.EventTypes) {
    ChakraApp.EventTypes = {};
  }
  
  if (!ChakraApp.EventTypes.PANELS_CREATED) {
    ChakraApp.EventTypes.PANELS_CREATED = 'panels_created';
  }
  
})(window.ChakraApp = window.ChakraApp || {});
