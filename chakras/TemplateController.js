// src/controllers/TemplateController.js - FIXED VERSION
(function(ChakraApp) {
  /**
   * Controls template-related UI elements and interactions
   */
  ChakraApp.TemplateController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements - per circle type
    this.toggleTemplateListBtns = {};
    this.templateListContainers = {};
    
    // Template state
    this.templateListVisible = {};
    this.selectedTemplateIds = {}; // Track selected template per circle type
    
    // Event handlers
    this.templateClickHandler = null;
    
    // Event subscriptions
    this.eventSubscriptions = {};
  };
  
  // Inherit from BaseController
  ChakraApp.TemplateController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.TemplateController.prototype.constructor = ChakraApp.TemplateController;
  
  // Initialize
  ChakraApp.TemplateController.prototype.init = function() {
  ChakraApp.BaseController.prototype.init.call(this);
  
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self.templateListVisible[circleType.id] = false;
    self.selectedTemplateIds[circleType.id] = null;
  });

  this.selectedTemplateId = null;
  this.selectedTemplateCategory = null;
  this.isTemplateGridExpanded = false;
  this.currentPanelId = 0;
  this._setupInitializationStrategy();
  this._setupTemplateEventListeners();
  this._setupClickOutsideHandler();
  this._setupButtonHandlersEnhanced();
};

ChakraApp.TemplateController.prototype._setupInitializationStrategy = function() {
  var self = this;
  
  // Check if left panels exist
  var leftPanelExists = document.getElementById('left-panel-0') || 
                       document.querySelector('.left-panel[data-panel-index="0"]') ||
                       document.querySelector('#left-container .left-panel:first-child');
  
  if (leftPanelExists) {
    // Panels already exist, initialize immediately
    this._completeInitialization();
  } else {
    console.log('TemplateController: No panels found - will initialize when first panel is created');
    // Wait for panels to be created
    this._waitForPanelsToBeCreated();
  }
};

// Add this new method:
ChakraApp.TemplateController.prototype._waitForPanelsToBeCreated = function() {
  var self = this;
  
  this.eventSubscriptions.leftPanelAdded = ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
    console.log('TemplateController received LEFT_PANEL_ADDED event for panel:', data.panelId);
    
    // Initialize when the first panel is created (any panel, not just panel 0)
    self._completeInitialization();
    
    // Unsubscribe since we only need this once
    if (self.eventSubscriptions.leftPanelAdded) {
      self.eventSubscriptions.leftPanelAdded();
      delete self.eventSubscriptions.leftPanelAdded;
    }
  });
};

// Add this new method:
ChakraApp.TemplateController.prototype._completeInitialization = function() {
  // Create visual template selector
  this._createVisualTemplateSelector();
  
  // Create UI elements for each circle type (existing functionality)
  this._createTemplateControls();
  
  // Initialize template lists for each circle type
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._updateTemplateList(circleType.id);
  });
};
  
  /**
   * Create template controls for each circle type
   * @private
   */
  ChakraApp.TemplateController.prototype._createTemplateControls = function() {
    var self = this;
    
    // Create controls for each circle type
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      self._createTemplateControlsForCircleType(circleType.id);
    });
  };
  
  /**
   * Create template controls for a specific circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._createTemplateControlsForCircleType = function(circleTypeId) {
	  var circleType = ChakraApp.Config.circleTypes.find(function(type) {
    return type.id === circleTypeId;
  });
  
  if (!circleType) {
    console.error('Invalid circle type ID:', circleTypeId);
    return;
  }
  
  // FIXED: Look for the new left panel structure with better error handling
  var targetPanel = document.getElementById('left-panel-0') ||
                   document.querySelector('.left-panel[data-panel-index="0"]') ||
                   document.querySelector('#left-container .left-panel:first-child') ||
                   document.querySelector('.circle-panel[data-panel-id="left"]') ||
                   document.getElementById('left-panel');
  
  if (!targetPanel) {
    console.warn('Left panel not found for rendering template controls for circle type:', circleTypeId);
    return;
  }
    
    // Create Template List Container
    var listContainer = document.createElement('div');
    listContainer.id = 'template-list-container-' + circleTypeId;
    listContainer.className = 'template-list-container';
    listContainer.dataset.circleTypeId = circleTypeId;
    
    // Apply styles
    listContainer.style.display = 'none';
    listContainer.style.position = 'absolute';
    listContainer.style.left = '105px';
    listContainer.style.bottom = '30px';
    listContainer.style.width = '220px';
    listContainer.style.maxHeight = '300px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.backgroundColor = 'rgba(60, 60, 60, 0.95)';
    listContainer.style.border = '1px solid #777';
    listContainer.style.borderRadius = '5px';
    listContainer.style.zIndex = '100';
    listContainer.style.padding = '4px';
    listContainer.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
    
    // Apply custom styling based on circle type
    if (circleTypeId === 'star') {
      listContainer.style.backgroundColor = 'rgba(255, 153, 51, 0.15)';
      listContainer.style.borderColor = '#FF9933';
    } else if (circleTypeId === 'triangle') {
      listContainer.style.backgroundColor = 'rgba(56, 118, 29, 0.15)';
      listContainer.style.borderColor = '#88B66d';
    } else if (circleTypeId === 'gem') {
      listContainer.style.backgroundColor = 'rgba(74, 111, 201, 0.15)';
      listContainer.style.borderColor = '#4a6fc9';
    } else if (circleTypeId === 'hexagon') {
      listContainer.style.backgroundColor = 'rgba(153, 50, 204, 0.15)';
      listContainer.style.borderColor = '#9932CC';
    }
    
    // Add to left panel
    targetPanel.appendChild(listContainer);
    this.templateListContainers[circleTypeId] = listContainer;
  };
  
  /**
   * Set up button handlers for template toggle buttons
   * @private
   */
  ChakraApp.TemplateController.prototype._setupButtonHandlers = function() {
    var self = this;
    
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      
      // Handle template toggle buttons
      var toggleBtn = document.getElementById('toggle-template-list-btn-' + typeId);
      if (toggleBtn) {
        var newToggleBtn = toggleBtn.cloneNode(true);
        
        if (toggleBtn.parentNode) {
          toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        }
        
        // Store reference
        self.toggleTemplateListBtns[typeId] = newToggleBtn;
        
	newToggleBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  
  // FIRST: Close all document lists before toggling template list
  self._closeAllDocumentLists();
  
  self._toggleTemplateList(typeId);
  
  var arrowIcon = this.querySelector('.template-arrow-icon');
  if (arrowIcon) {
    arrowIcon.innerHTML = self.templateListVisible[typeId] ? 'T' : 'T';
  }
  
  self._updateTemplateList(typeId);
});
      }
    });
  };
  
  /**
   * Toggle template list visibility for a circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._toggleTemplateList = function(circleTypeId) {
    // Toggle current state
    this.templateListVisible[circleTypeId] = !this.templateListVisible[circleTypeId];
    
    // If opening a list, close all other open template lists
    if (this.templateListVisible[circleTypeId]) {
      var self = this;
      ChakraApp.Config.circleTypes.forEach(function(otherType) {
        var otherTypeId = otherType.id;
        // Skip the current type
        if (otherTypeId === circleTypeId) return;
        
        // Close other template lists if open
        if (self.templateListVisible[otherTypeId]) {
          self.templateListVisible[otherTypeId] = false;
          self._updateTemplateList(otherTypeId);
          
          // Update arrow icon
          var otherToggleBtn = self.toggleTemplateListBtns[otherTypeId];
          if (otherToggleBtn) {
            var arrowIcon = otherToggleBtn.querySelector('.template-arrow-icon');
            if (arrowIcon) {
              arrowIcon.innerHTML = '▼';
            }
          }
        }
      });
    }
  };
  
  /**
   * Update template list display for a circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._updateTemplateList = function(circleTypeId) {
    var listContainer = this.templateListContainers[circleTypeId];
    if (!listContainer) return;
    
    // Check visibility state
    var isVisible = this.templateListVisible[circleTypeId];
    listContainer.style.display = isVisible ? 'block' : 'none';
    
    // If not visible, no need to update content
    if (!isVisible) return;
    
    // Clear existing list
    listContainer.innerHTML = '';
    
    // Get templates for this circle type
    var templates = this._getTemplatesForCircleType(circleTypeId);
    
    var selectedId = this.selectedTemplateIds[circleTypeId];
    
    // Create list items for each template
    var self = this;
    templates.forEach(function(template) {
      var listItem = template.id === selectedId ? 
        self._createSelectedTemplateListItem(template, circleTypeId) : 
        self._createTemplateListItem(template, circleTypeId);
      
      listContainer.appendChild(listItem);
    });
    
    // If no templates, show message
    if (templates.length === 0) {
      var noTemplatesMessage = document.createElement('div');
      noTemplatesMessage.className = 'no-templates-message';
      noTemplatesMessage.textContent = 'No templates available';
      noTemplatesMessage.style.color = '#888';
      noTemplatesMessage.style.fontStyle = 'italic';
      noTemplatesMessage.style.textAlign = 'center';
      noTemplatesMessage.style.padding = '20px';
      listContainer.appendChild(noTemplatesMessage);
    }
  };
  
  /**
   * Get templates for a specific circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   * @return {Array} Array of templates
   */
  ChakraApp.TemplateController.prototype._getTemplatesForCircleType = function(circleTypeId) {
    if (!ChakraApp.Config.circleTypeTemplates) {
      return [];
    }
    
    return ChakraApp.Config.circleTypeTemplates.filter(function(template) {
      return template.type === circleTypeId;
    });
  };
  
  /**
   * Create a template list item
   * @private
   * @param {Object} template - Template object
   * @param {string} circleTypeId - Circle type ID
   * @returns {HTMLElement} Template list item
   */
  ChakraApp.TemplateController.prototype._createTemplateListItem = function(template, circleTypeId) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'template-list-item';
    listItem.dataset.id = template.id;
    listItem.dataset.circleTypeId = circleTypeId;
    listItem.style.display = 'flex';
    listItem.style.alignItems = 'center';
    listItem.style.padding = '4px 6px';
    listItem.style.marginBottom = '0px';
    listItem.style.backgroundColor = 'rgba(80, 80, 80, 0.7)';
    listItem.style.borderRadius = '4px';
    listItem.style.cursor = 'pointer';
    listItem.style.transition = 'background-color 0.2s ease';
    
    // Template icon
    var icon = document.createElement('span');
    icon.className = 'template-icon';
    icon.innerHTML = '📋';
    icon.style.marginRight = '10px';
    icon.style.fontSize = '18px';
    listItem.appendChild(icon);
    
    // Template name
    var name = document.createElement('span');
    name.className = 'template-name';
    name.textContent = template.name;
    name.style.flex = '1';
    name.style.color = 'white';
    name.style.fontSize = '14px';
    name.style.whiteSpace = 'nowrap';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    listItem.appendChild(name);
    
    // Template circle count
    var circleCount = document.createElement('span');
    circleCount.className = 'template-circle-count';
    var count = template.circles ? template.circles.length : 0;
    circleCount.textContent = ' (' + count + ')';
    circleCount.style.color = 'rgba(255, 255, 255, 0.6)';
    circleCount.style.fontSize = '0.9em';
    circleCount.style.marginLeft = '3px';
    listItem.appendChild(circleCount);
    
    // Hover effects
    listItem.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(100, 100, 100, 0.9)';
    });
    
    listItem.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(80, 80, 80, 0.7)';
    });
    
    // Click handler to select template
    listItem.addEventListener('click', function(e) {
      e.stopPropagation();
      self._selectTemplate(template.id, circleTypeId);
    });
    
    return listItem;
  };
  
  /**
   * Create a selected template list item
   * @private
   * @param {Object} template - Template object
   * @param {string} circleTypeId - Circle type ID
   * @returns {HTMLElement} Selected template list item
   */
  ChakraApp.TemplateController.prototype._createSelectedTemplateListItem = function(template, circleTypeId) {
    var listItem = this._createTemplateListItem(template, circleTypeId);
    listItem.className += ' selected';
    listItem.style.backgroundColor = 'rgba(120, 120, 120, 0.9)';
    listItem.style.borderLeft = '3px solid #0088ff';
    
    return listItem;
  };
  
  /**
   * Select a template
   * @private
   * @param {string} templateId - Template ID
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._selectTemplate = function(templateId, circleTypeId) {
  // Deselect any selected document of the same circle type
  if (ChakraApp.appState.selectedDocumentIds[circleTypeId]) {
    ChakraApp.appState.deselectDocument(circleTypeId);
    
    // Force update the document list UI
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
      ChakraApp.app.controllers.document._updateDocumentList(circleTypeId);
    }
  }
  
  // Deselect current template of this type if different
  if (this.selectedTemplateIds[circleTypeId] && this.selectedTemplateIds[circleTypeId] !== templateId) {
    this._deselectTemplate(circleTypeId);
  }
  
  // If the same template is already selected, deselect it (toggle behavior)
  if (this.selectedTemplateIds[circleTypeId] === templateId) {
    this._deselectTemplate(circleTypeId);
    return;
  }
  
  // Select the new template
  this.selectedTemplateIds[circleTypeId] = templateId;
  
  // Get the template
  var template = this._getTemplateById(templateId);
  if (template) {
    // Create template circles (non-interactive)
    this._createTemplateCircles(template);
    
    // Publish template selected event
    ChakraApp.EventBus.publish('TEMPLATE_SELECTED', template);
  }
  
  // Update the UI
  this._updateTemplateList(circleTypeId);
};
  
  /**
   * Deselect a template
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
ChakraApp.TemplateController.prototype._deselectTemplate = function(circleTypeId) {
  if (!this.selectedTemplateIds[circleTypeId]) return;
  
  var templateId = this.selectedTemplateIds[circleTypeId];
  this.selectedTemplateIds[circleTypeId] = null;
  
  // Remove template circles for this specific template type only
  this._removeTemplateCirclesForType(circleTypeId);
  
  // Publish template deselected event
  ChakraApp.EventBus.publish('TEMPLATE_DESELECTED', { templateId: templateId, circleTypeId: circleTypeId });
};

ChakraApp.TemplateController.prototype._removeTemplateCirclesForType = function(circleTypeId) {
  var templateCircles = document.querySelectorAll('.template-circle[data-circle-type="' + circleTypeId + '"]');
  templateCircles.forEach(function(circle) {
    if (circle.parentNode) {
      circle.parentNode.removeChild(circle);
    }
  });
  
  // If no templates are selected at all, remove all template circles
  var hasSelectedTemplates = false;
  for (var typeId in this.selectedTemplateIds) {
    if (this.selectedTemplateIds[typeId]) {
      hasSelectedTemplates = true;
      break;
    }
  }
  
  if (!hasSelectedTemplates) {
    this._removeTemplateCircles();
  }
};

  
  /**
   * Get template by ID
   * @private
   * @param {string} templateId - Template ID
   * @return {Object|null} Template object or null
   */
  ChakraApp.TemplateController.prototype._getTemplateById = function(templateId) {
    if (!ChakraApp.Config.circleTypeTemplates) {
      return null;
    }
    
    return ChakraApp.Config.circleTypeTemplates.find(function(template) {
      return template.id === templateId;
    }) || null;
  };
  
  /**
   * Create template circles (non-interactive)
   * @private
   * @param {Object} template - Template object
   */
ChakraApp.TemplateController.prototype._createTemplateCircles = function(template) {
  // Don't remove ALL template circles, just ones for this type
  this._removeTemplateCirclesForType(template.type);
  
  if (!template.circles || !Array.isArray(template.circles)) {
    return;
  }
  
  // FIXED: Look for the new left panel structure
  var leftPanel = document.getElementById('left-panel-0') ||
                  document.querySelector('.left-panel[data-panel-index="0"]') ||
                  document.querySelector('#left-container .left-panel:first-child') ||
                  document.querySelector('.circle-panel[data-panel-id="left"]') ||
                  document.getElementById('left-panel');
  
  if (!leftPanel) return;
  
  // Create template circles
  var self = this;
  template.circles.forEach(function(circleData, index) {
    self._createTemplateCircle(circleData, leftPanel, template.type);
  });
};
  
  /**
   * Create a single template circle
   * @private
   * @param {Object} circleData - Circle data from template
   * @param {HTMLElement} container - Container element
   */
ChakraApp.TemplateController.prototype._createTemplateCircle = function(circleData, container, circleTypeId) {
  var circleElement = document.createElement('div');
  circleElement.className = 'template-circle';
  circleElement.dataset.circleType = circleTypeId; // Add this line
  circleElement.style.position = 'absolute';
  circleElement.style.width = '20px';
  circleElement.style.height = '20px';
  circleElement.style.borderRadius = '50%';
  circleElement.style.backgroundColor = circleData.color || '#C0C0C0';
  circleElement.style.left = circleData.x + 'px';
  circleElement.style.top = circleData.y + 'px';
  circleElement.style.transform = 'translate(-50%, -50%)';
  circleElement.style.opacity = '0.7';
  circleElement.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
  circleElement.style.pointerEvents = 'none'; // Non-interactive
  circleElement.style.zIndex = '5';
  
  // Add circle name
  var nameElement = document.createElement('div');
  nameElement.className = 'template-circle-name';
  nameElement.textContent = circleData.name || '???';
  nameElement.style.position = 'absolute';
  nameElement.style.top = '120%';
  nameElement.style.left = '50%';
  nameElement.style.transform = 'translateX(-50%)';
  nameElement.style.color = 'rgba(255, 255, 255, 0.7)';
  nameElement.style.fontSize = '11px';
  nameElement.style.background = 'rgba(0, 0, 0, 0.5)';
  nameElement.style.padding = '2px 4px';
  nameElement.style.borderRadius = '3px';
  nameElement.style.whiteSpace = 'nowrap';
  nameElement.style.pointerEvents = 'none';
  
  circleElement.appendChild(nameElement);
  container.appendChild(circleElement);
};
  
  /**
   * Remove all template circles
   * @private
   */
  ChakraApp.TemplateController.prototype._removeTemplateCircles = function() {
    var templateCircles = document.querySelectorAll('.template-circle');
    templateCircles.forEach(function(circle) {
      if (circle.parentNode) {
        circle.parentNode.removeChild(circle);
      }
    });
  };
  
  /**
   * Use a template to create a new document
   * @public
   * @param {string} templateId - Template ID
   */
ChakraApp.TemplateController.prototype.useTemplate = function(templateId) {
  var template = this._getTemplateById(templateId);
  if (!template) {
    console.error('Template not found:', templateId);
    return;
  }
  
  // Create a new document with the template name
  var newDoc = ChakraApp.appState.addDocument({
    name: template.name,
    circleType: template.type
  });
  
  // Create copies of all circles from the template
  var self = this;
  if (template.circles && Array.isArray(template.circles)) {
    template.circles.forEach(function(circleData) {
      var newCircleData = {
        x: circleData.x,
        y: circleData.y,
        color: circleData.color,
        name: circleData.name,
        circleType: template.type,
        documentId: newDoc.id,
        text: circleData.text || null // NEW: Include text content from template
      };
      
      ChakraApp.appState.addCircle(newCircleData);
    });
  }
  
  // Deselect the template
  var circleTypeId = template.type;
  this._deselectTemplate(circleTypeId);
  
  // Select the new document immediately
  ChakraApp.appState.selectDocument(newDoc.id, circleTypeId);
  
  // Close template list
  this.templateListVisible[circleTypeId] = false;
  this._updateTemplateList(circleTypeId);
  
  // Update template toggle button arrow
  var toggleBtn = this.toggleTemplateListBtns[circleTypeId];
  if (toggleBtn) {
    var arrowIcon = toggleBtn.querySelector('.template-arrow-icon');
    if (arrowIcon) {
      arrowIcon.innerHTML = 'T';
    }
  }
};
  
  /**
   * Set up template event listeners
   * @private
   */
ChakraApp.TemplateController.prototype._setupTemplateEventListeners = function() {
  // Listen for document selection events to deselect templates
  var self = this;
  this.eventSubscriptions.documentSelected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.DOCUMENT_SELECTED,
    function(doc) {
      var circleType = doc.circleType || 'standard';
      if (self.selectedTemplateIds[circleType]) {
        self._deselectTemplate(circleType);
        self._updateTemplateList(circleType);
        
        // Update template toggle button arrow
        var templateToggleBtn = self.toggleTemplateListBtns[circleType];
        if (templateToggleBtn) {
          var arrowIcon = templateToggleBtn.querySelector('.template-arrow-icon');
          if (arrowIcon) {
            arrowIcon.innerHTML = 'T';
          }
        }
      }
    }
  );
}
  
  /**
   * Set up click outside handler for template lists
   * @private
   */
  ChakraApp.TemplateController.prototype._setupClickOutsideHandler = function() {
    var self = this;
    
    if (!this.templateClickHandler) {
      this.templateClickHandler = function(e) {
        // Check if any template lists are visible
        var listsVisible = false;
        var clickedCircleTypeId = null;
        
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
          var typeId = circleType.id;
          if (self.templateListVisible[typeId]) {
            listsVisible = true;
            
            var listContainer = self.templateListContainers[typeId];
            var toggleBtn = document.getElementById('toggle-template-list-btn-' + typeId);
            
            // Check if click was inside this circle type's list or toggle button
            if (listContainer && listContainer.contains(e.target) ||
                toggleBtn && toggleBtn.contains(e.target)) {
              clickedCircleTypeId = typeId;
            }
          }
        });
        
        // If any lists are visible and click was outside all lists and buttons, hide all lists
        if (listsVisible && !clickedCircleTypeId) {
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            var typeId = circleType.id;
            if (self.templateListVisible[typeId]) {
              self.templateListVisible[typeId] = false;
              self._updateTemplateList(typeId);
              
              // Update arrow icon
              var toggleBtn = self.toggleTemplateListBtns[typeId];
              if (toggleBtn) {
                var arrowIcon = toggleBtn.querySelector('.template-arrow-icon');
                if (arrowIcon) {
                  arrowIcon.innerHTML = 'T';
                }
              }
            }
          });
        }
      };
      
      document.addEventListener('click', this.templateClickHandler);
    }
  };

ChakraApp.TemplateController.prototype._closeAllDocumentLists = function() {
  // Close all document lists when a template list is opened
  if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      if (ChakraApp.appState.documentListVisible[typeId]) {
        ChakraApp.appState.documentListVisible[typeId] = false;
        
        // Update document list UI
        ChakraApp.app.controllers.document._updateDocumentList(typeId);
        
        // Update document toggle button arrow
        var documentToggleBtn = ChakraApp.app.controllers.document.toggleDocumentListBtns[typeId];
        if (documentToggleBtn) {
          var arrowIcon = documentToggleBtn.querySelector('.arrow-icon');
          if (arrowIcon) {
            arrowIcon.innerHTML = 'T';
          }
        }
      }
    });
  }
};

ChakraApp.TemplateController.prototype._createVisualTemplateSelector = function() {
  // Check if selector already exists to prevent duplicates
  var existingSelector = document.querySelector('.template-selector-container');
  if (existingSelector) {
    this.templateSelectorContainer = existingSelector;
    this.templateSelector = existingSelector.querySelector('.template-selector');
    this.templateToggleButton = existingSelector.querySelector('.template-toggle-button');
    return;
  }
  
  // Create selector container
  var selectorContainer = document.createElement('div');
  selectorContainer.className = 'template-selector-container';
  selectorContainer.style.cssText = `
    position: absolute;
    top: 50px;
    left: 10px;
    right: 10px;
    max-width: 380px;
    background-color: #AAA;
    border-radius: 8px;
    z-index: 1000;
    display: none;
  `;
  
  this.templateSelectorContainer = selectorContainer;
  
  // Create toggle button
  this.templateToggleButton = document.createElement('div');
  this.templateToggleButton.className = 'template-toggle-button';
  this.templateToggleButton.style.cssText = `
    padding: 8px;
    background-color: #444;
    color: #BBB;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s ease;
  `;
  
  // Add toggle button content
  this._updateTemplateToggleButtonText();
  
  // Create the main selector element
  this.templateSelector = document.createElement('div');
  this.templateSelector.className = 'template-selector';
  this.templateSelector.style.cssText = `
    max-height: 500px;
    overflow-y: auto;
    display: none;
    background-color: #888;
    border: 2px solid #666;
    border-radius: 6px;
    padding: 10px;
  `;
  
  // Track state
  this.isTemplateGridExpanded = false;
  this.selectedTemplateCategory = null;
  this.currentPanelId = null;
  
  // Add click handler to toggle button
  var self = this;
  this.templateToggleButton.addEventListener('click', function(e) {
    e.stopPropagation();
    self._toggleTemplateGrid();
  });
  
  // Build the grid structure
  this._buildTemplateSelectorGrid();
  
  //selectorContainer.appendChild(this.templateToggleButton);
  selectorContainer.appendChild(this.templateSelector);
  
  // Add to the first left panel by default
  var leftPanel = document.getElementById('left-panel-0') || 
                  document.querySelector('.left-panel') ||
                  document.getElementById('left-panel');
  
  if (leftPanel) {
    leftPanel.appendChild(selectorContainer);
  }
  
  // Set up click-outside listener
  this._setupTemplateClickOutsideListener();
};

ChakraApp.TemplateController.prototype._buildTemplateSelectorGrid = function() {
  var self = this;
  this.templateSelector.innerHTML = '';
  
  // Add CSS for template selector layout
  this._addTemplateSelectorStyles();
  
  // Get template categories from config
  var templateCategories = ChakraApp.Config.templateCategories || {};
  
  Object.keys(templateCategories).forEach(function(categoryName) {
    var categoryData = templateCategories[categoryName];
    
    // Create category section
    var categorySection = document.createElement('div');
    categorySection.className = 'template-category-section';
    
    // Create category header
    var categoryHeader = document.createElement('div');
    categoryHeader.className = 'template-category-header';
    categoryHeader.textContent = categoryName.toUpperCase();
    categoryHeader.dataset.category = categoryName;
    
    var isSelectedCategory = categoryName === self.selectedTemplateCategory;
    categoryHeader.style.cssText = `
      font-size: 12px;
      font-weight: bold;
      color: #666;
      margin-bottom: 2px;
      padding: 4px 8px;
      background-color: ${categoryData.color};
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid ${isSelectedCategory ? '#007ACC' : 'rgba(0,0,0,0.1)'};
      border-radius: 4px;
    `;
    
    // Add click handler for category header
    categoryHeader.addEventListener('click', function(e) {
      e.stopPropagation();
      self._selectTemplateCategory(categoryName);
    });
    
    categorySection.appendChild(categoryHeader);
    
    // Create templates grid for this category
    var templatesGrid = document.createElement('div');
    templatesGrid.className = 'templates-grid';
    templatesGrid.dataset.category = categoryName;
    
    // Add template boxes to the grid
    Object.keys(categoryData.templates).forEach(function(templateName) {
      var templateData = categoryData.templates[templateName];
      var templateBox = self._createTemplateBox(templateName, templateData, categoryName);
      templatesGrid.appendChild(templateBox);
    });
    
    categorySection.appendChild(templatesGrid);
    self.templateSelector.appendChild(categorySection);
  });
};

ChakraApp.TemplateController.prototype._addTemplateSelectorStyles = function() {
  var style = document.createElement('style');
  style.id = 'template-selector-styles';
  style.textContent = `
    /* Template selector container positioning */
    .template-selector-container {
      position: absolute !important;
      z-index: 1000 !important;
    }
    
    /* Main template selector container */
    .template-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
      background-color: #888;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 2px solid #666;
    }
    
    /* Override inline display styles */
    .template-selector[style*="display: none"] {
      display: none !important;
    }
    
    .template-selector[style*="display: block"] {
      display: flex !important;
    }
    
    /* Category sections */
    .template-category-section {
      width: 100%;
      margin-bottom: 8px;
    }
    
    .templates-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: flex-start;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px;
      position: relative;
    }
    
    .template-box {
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      min-height: 80px;
      margin: 4px;
    }
    
    /* Full size template boxes */
    .template-box.full-size {
      width: 120px;
      height: 120px;
      font-size: 10px;
    }
    
    .template-box.full-size .template-name {
      font-size: 14px;
      line-height: 1.1;
      margin-bottom: 4px;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    
    .template-box.full-size .template-description {
      font-size: 9px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    
    .template-box.full-size .mini-circle-preview {
      width: 20px;
      height: 20px;
    }
    
    /* Small size template boxes */
    .template-box.small-size {
      width: 60px;
      height: 60px;
      font-size: 7px;
      padding: 4px;
      box-shadow: 1px 1px 2px rgba(0,0,0,1);
    }
    
    .template-box.small-size.selected {
      z-index: 5;
      box-shadow: 3px 3px 8px rgba(0,122,204,0.4);
    }
    
    .template-box.small-size .template-name {
      font-size: 8px;
      line-height: 1;
      margin-bottom: 2px;
      font-weight: bold;
    }
    
    .template-box.small-size .template-description {
      display: none;
    }
    
    .template-box.small-size .mini-circle-preview {
      width: 8px;
      height: 8px;
    }
    
    .circles-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
    }
    
    .mini-circle-preview {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      font-size: 6px;
      color: white;
      text-shadow: 0 0 2px rgba(0,0,0,0.5);
    }
    
    .template-category-header {
      font-size: 12px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
      padding: 6px 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.2);
    }
    
    .template-category-header:hover {
      background-color: rgba(255,255,255,0.1);
    }
    
    /* Template box hover effects */
    .template-box:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
  `;
  
  // Remove existing styles if they exist
  var existingStyle = document.getElementById('template-selector-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  document.head.appendChild(style);
};

ChakraApp.TemplateController.prototype._createTemplateBox = function(templateName, templateData, categoryName) {
  var self = this;
  var templateBox = document.createElement('div');
  templateBox.className = 'template-box';
  templateBox.dataset.template = templateData.id;
  templateBox.dataset.category = categoryName;
  
  var isSelected = templateData.id === this.selectedTemplateId;
  var isCategorySelected = categoryName === this.selectedTemplateCategory;
  
  // Set size class based on category selection
  var sizeClass = isCategorySelected ? 'full-size' : 'small-size';
  templateBox.classList.add(sizeClass);
  
  templateBox.style.cssText = `
    background-color: ${templateData.color};
    border: 2px solid ${isSelected ? '#007ACC' : 'transparent'};
    font-weight: ${isSelected ? 'bold' : '500'};
  `;
  
  // Create template name
  var templateNameDiv = document.createElement('div');
  templateNameDiv.className = 'template-name';
  templateNameDiv.textContent = templateName;
  
  // Create description (only shown in full size)
  var descriptionDiv = document.createElement('div');
  descriptionDiv.className = 'template-description';
  descriptionDiv.textContent = templateData.description || '';
  
  // Create circles preview container
  var circlesContainer = document.createElement('div');
  circlesContainer.className = 'circles-preview';
  
  // Create mini circle previews (show first few circles)
  var maxCircles = isCategorySelected ? 12 : 6;
  templateData.circles.slice(0, maxCircles).forEach(function(circle, index) {
    var miniCircle = document.createElement('div');
    miniCircle.className = 'mini-circle-preview';
    miniCircle.style.cssText = `
      background-color: ${circle.color};
    `;
    
    // Add first letter of name for larger circles
    if (isCategorySelected && circle.name) {
      miniCircle.textContent = circle.name.charAt(0);
    }
    
    circlesContainer.appendChild(miniCircle);
  });
  
  // Show "..." if there are more circles
  if (templateData.circles.length > maxCircles) {
    var moreIndicator = document.createElement('div');
    moreIndicator.className = 'mini-circle-preview';
    moreIndicator.textContent = '...';
    moreIndicator.style.cssText = `
      background-color: rgba(255,255,255,0.3);
      color: #333;
    `;
    circlesContainer.appendChild(moreIndicator);
  }
  
  // Append sections to template box
  templateBox.appendChild(templateNameDiv);
  templateBox.appendChild(descriptionDiv);
  templateBox.appendChild(circlesContainer);
  
  // Add click handler
  templateBox.addEventListener('click', function(e) {
    e.stopPropagation();
    self._selectTemplateForUse(templateData.id, templateName, templateData);
  });
  
  return templateBox;
};

ChakraApp.TemplateController.prototype._selectTemplateCategory = function(categoryName) {
  // Toggle category selection
  if (this.selectedTemplateCategory === categoryName) {
    this.selectedTemplateCategory = null;
  } else {
    this.selectedTemplateCategory = categoryName;
  }
  
  // Rebuild template selector grid with new sizing
  this._buildTemplateSelectorGrid();
};

ChakraApp.TemplateController.prototype._selectTemplateForUse = function(templateId, templateName, templateData) {
  // Close the template selector
  this.isTemplateGridExpanded = false;
  this.templateSelector.style.display = 'none';
  this._updateTemplateToggleButtonText();
  
  // Use the template immediately
  this._useTemplateInPanel(templateName, templateData, this.currentPanelId || 0);
};

ChakraApp.TemplateController.prototype._useTemplateInPanel = function(templateName, templateData, panelId) {
  if (!templateData || !templateData.circles) {
    console.error('Invalid template data:', templateData);
    return;
  }
  
  // Create a new document with the template name for the specific circle type
  var newDoc = ChakraApp.appState.addDocument({
    name: templateName || 'Template Document',
    circleType: templateData.type,
    listType: 'list1' // Default to list1
  });
  
  // Create copies of all circles from the template
  var self = this;
  templateData.circles.forEach(function(circleData) {
    var newCircleData = {
      x: circleData.x,
      y: circleData.y,
      color: circleData.color,
      name: circleData.name,
      circleType: templateData.type,
      documentId: newDoc.id,
      text: circleData.text || null // NEW: Include text content from template
    };
    
    ChakraApp.appState.addCircle(newCircleData);
  });
  
  // Select the new document for the specific panel
  ChakraApp.appState.selectDocumentForPanel(newDoc.id, templateData.type, 'list1', panelId);
  
  // Update the UI for this panel
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    ChakraApp.app.viewManager.renderCirclesForPanel('left-' + panelId);
  }
  
  // Close any open template lists for this circle type
  if (this.templateListVisible[templateData.type]) {
    this.templateListVisible[templateData.type] = false;
    this._updateTemplateList(templateData.type);
  }
};

ChakraApp.TemplateController.prototype._setupButtonHandlersEnhanced = function() {
  var self = this;
  
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    var typeId = circleType.id;
    
    // Handle template toggle buttons for all panels
    var allToggleBtns = document.querySelectorAll('[id*="toggle-template-list-btn-' + typeId + '"]');
    
    allToggleBtns.forEach(function(toggleBtn) {
      // Clone the button to remove existing event listeners
      var newToggleBtn = toggleBtn.cloneNode(true);
      
      if (toggleBtn.parentNode) {
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
      }
      
      // Extract panel ID from button ID or dataset
      var panelId = 0; // Default to panel 0
      if (newToggleBtn.dataset.panelId !== undefined) {
        panelId = parseInt(newToggleBtn.dataset.panelId);
      } else {
        // Try to extract from ID pattern like "toggle-template-list-btn-gem-panel-1"
        var idMatch = newToggleBtn.id.match(/panel-(\d+)$/);
        if (idMatch) {
          panelId = parseInt(idMatch[1]);
        }
      }
      
      // Add the click event listener
      newToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Template button clicked for type:', typeId, 'panel:', panelId);
        
        // Set the current panel ID for template selection
        self.currentPanelId = panelId;
        
        // Close all document lists before opening template selector
        self._closeAllDocumentLists();
        
        // Show the visual template selector
        self._showVisualTemplateSelector(typeId);
      });
      
      // Store reference (use the first one found for the main reference)
      if (!self.toggleTemplateListBtns[typeId]) {
        self.toggleTemplateListBtns[typeId] = newToggleBtn;
      }
    });
  });
};


ChakraApp.TemplateController.prototype._showVisualTemplateSelector = function(circleTypeId) {
  console.log('=== SHOWING VISUAL TEMPLATE SELECTOR ===');
  console.log('Circle Type ID:', circleTypeId);
  
  // Create visual selector if it doesn't exist
  if (!this.templateSelectorContainer) {
    console.log('Creating visual template selector...');
    this._createVisualTemplateSelector();
    console.log('Template selector container created:', this.templateSelectorContainer);
  } else {
    console.log('Template selector container already exists:', this.templateSelectorContainer);
  }
  
  // Check if elements exist
  console.log('templateSelectorContainer:', this.templateSelectorContainer);
  console.log('templateSelector:', this.templateSelector);
  console.log('templateToggleButton:', this.templateToggleButton);
  
  if (!this.templateSelectorContainer) {
    console.error('FAILED: templateSelectorContainer is null');
    return;
  }
  
  if (!this.templateSelector) {
    console.error('FAILED: templateSelector is null');
    return;
  }
  
  // Check if container is attached to DOM
  var isInDOM = document.body.contains(this.templateSelectorContainer);
  console.log('Template selector container in DOM:', isInDOM);
  
  if (!isInDOM) {
    console.log('Container not in DOM, trying to find left panel...');
    var leftPanel = document.getElementById('left-panel-0') || 
                    document.querySelector('.left-panel') ||
                    document.getElementById('left-panel');
    console.log('Found left panel:', leftPanel);
    
    if (leftPanel) {
      leftPanel.appendChild(this.templateSelectorContainer);
      console.log('Appended template selector to left panel');
    } else {
      console.error('FAILED: No left panel found to append template selector');
      return;
    }
  }
  
  // Show the template selector
  console.log('Setting display styles...');
  this.templateSelectorContainer.style.display = 'block';
  this.isTemplateGridExpanded = true;
  this.templateSelector.style.display = 'block';
  
  // Log current styles
  console.log('Container display:', this.templateSelectorContainer.style.display);
  console.log('Container computed display:', window.getComputedStyle(this.templateSelectorContainer).display);
  console.log('Selector display:', this.templateSelector.style.display);
  console.log('Selector computed display:', window.getComputedStyle(this.templateSelector).display);
  
  // Check dimensions
  var rect = this.templateSelectorContainer.getBoundingClientRect();
  console.log('Container dimensions:', rect);
  
  this._updateTemplateToggleButtonText();
  
  // Filter templates to show only those matching the circle type
  this._filterTemplatesByType(circleTypeId);
  
  // Final check
  setTimeout(function() {
    var finalRect = this.templateSelectorContainer.getBoundingClientRect();
    console.log('Final container dimensions:', finalRect);
    console.log('Final container visibility:', window.getComputedStyle(this.templateSelectorContainer).visibility);
    console.log('Final container opacity:', window.getComputedStyle(this.templateSelectorContainer).opacity);
  }.bind(this), 100);
  
  console.log('=== END VISUAL TEMPLATE SELECTOR DEBUG ===');
};

/**
 * Filter templates by circle type
 * @private
 */
ChakraApp.TemplateController.prototype._filterTemplatesByType = function(circleTypeId) {
  console.log('=== FILTERING TEMPLATES BY TYPE ===');
  console.log('Circle Type ID:', circleTypeId);
  
  if (!this.templateSelector) {
    console.error('No template selector to filter');
    return;
  }
  
  var templateBoxes = this.templateSelector.querySelectorAll('.template-box');
  console.log('Found template boxes:', templateBoxes.length);
  
  var visibleCount = 0;
  templateBoxes.forEach(function(box) {
    var templateId = box.dataset.template;
    var template = this._findTemplateById(templateId);
    
    console.log('Checking template:', templateId, 'type:', template ? template.type : 'not found');
    
    if (template && template.type === circleTypeId) {
      box.style.display = 'flex';
      visibleCount++;
      console.log('Showing template:', template.name);
    } else {
      box.style.display = 'none';
      console.log('Hiding template:', templateId);
    }
  }.bind(this));
  
  console.log('Visible templates after filtering:', visibleCount);
  
  // Hide categories that have no visible templates
  var categorySections = this.templateSelector.querySelectorAll('.template-category-section');
  console.log('Found category sections:', categorySections.length);
  
  categorySections.forEach(function(section) {
    var visibleTemplates = section.querySelectorAll('.template-box[style*="display: flex"]');
    console.log('Category section visible templates:', visibleTemplates.length);
    
    if (visibleTemplates.length > 0) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
  
  console.log('=== END FILTERING TEMPLATES ===');
};

/**
 * Find template by ID across all categories
 * @private
 */
ChakraApp.TemplateController.prototype._findTemplateById = function(templateId) {
  var templateCategories = ChakraApp.Config.templateCategories || {};
  
  for (var categoryName in templateCategories) {
    var templates = templateCategories[categoryName].templates;
    for (var templateName in templates) {
      if (templates[templateName].id === templateId) {
        return Object.assign({}, templates[templateName], { name: templateName });
      }
    }
  }
  return null;
};

/**
 * Toggle template grid
 * @private
 */
ChakraApp.TemplateController.prototype._toggleTemplateGrid = function() {
  if (!this.templateSelector) return;
  
  this.isTemplateGridExpanded = !this.isTemplateGridExpanded;
  
  if (this.isTemplateGridExpanded) {
    this.templateSelector.style.display = 'block';
  } else {
    this.templateSelector.style.display = 'none';
  }
  
  this._updateTemplateToggleButtonText();
};

/**
 * Update toggle button text
 * @private
 */
ChakraApp.TemplateController.prototype._updateTemplateToggleButtonText = function() {
  if (!this.templateToggleButton) return;
  
  var arrow = this.isTemplateGridExpanded ? '▼' : 'T';
  var text = 'Templates';
  
  this.templateToggleButton.innerHTML = `
    <span>${text}</span>
    <span style="margin-left: 10px;">${arrow}</span>
  `;
};

/**
 * Set up click-outside listener for template selector
 * @private
 */
ChakraApp.TemplateController.prototype._setupTemplateClickOutsideListener = function() {
  var self = this;
  
  this.templateClickOutsideListener = function(event) {
    if (!self.isTemplateGridExpanded) return;
    
    if (self.templateSelectorContainer && !self.templateSelectorContainer.contains(event.target)) {
      self._closeTemplateGrid();
    }
  };
  
  document.addEventListener('click', this.templateClickOutsideListener);
};

/**
 * Close template grid
 * @private
 */
ChakraApp.TemplateController.prototype._closeTemplateGrid = function() {
  if (!this.isTemplateGridExpanded) return;
  
  this.isTemplateGridExpanded = false;
  this.templateSelector.style.display = 'none';
  this._updateTemplateToggleButtonText();
};
  
  /**
   * Clean up resources
   */
ChakraApp.TemplateController.prototype.destroy = function() {
  // Call parent destroy
  ChakraApp.BaseController.prototype.destroy.call(this);
  
  // Remove template click handler
  if (this.templateClickHandler) {
    document.removeEventListener('click', this.templateClickHandler);
    this.templateClickHandler = null;
  }
  
  // Clean up visual template selector click-outside listener
  if (this.templateClickOutsideListener) {
    document.removeEventListener('click', this.templateClickOutsideListener);
    this.templateClickOutsideListener = null;
  }
  
  // Clean up event subscriptions
  Object.keys(this.eventSubscriptions).forEach(function(key) {
    var unsubscribe = this.eventSubscriptions[key];
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  }, this);
  
  // Clear subscriptions object
  this.eventSubscriptions = {};
  
  // Remove template circles
  this._removeTemplateCircles();
  
  // Remove visual template selector from DOM
  if (this.templateSelectorContainer && this.templateSelectorContainer.parentNode) {
    this.templateSelectorContainer.parentNode.removeChild(this.templateSelectorContainer);
  }
  
  // Remove other DOM elements
  Object.values(this.toggleTemplateListBtns).forEach(function(btn) {
    if (btn && btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
  });
  
  Object.values(this.templateListContainers).forEach(function(container) {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  
  // Clear DOM element references
  this.toggleTemplateListBtns = {};
  this.templateListContainers = {};
};
  
})(window.ChakraApp = window.ChakraApp || {});
