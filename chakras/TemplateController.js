// src/controllers/TemplateController.js
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
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Initialize template list visibility state for each circle type
    var self = this;
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      self.templateListVisible[circleType.id] = false;
      self.selectedTemplateIds[circleType.id] = null;
    });
    
    // Create UI elements for each circle type
    this._createTemplateControls();
    
    // Add event listeners
    this._setupTemplateEventListeners();
    this._setupClickOutsideHandler();
    this._setupButtonHandlers();
    
    // Initialize template lists for each circle type
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
    // Find the circle type
    var circleType = ChakraApp.Config.circleTypes.find(function(type) {
      return type.id === circleTypeId;
    });
    
    if (!circleType) {
      console.error('Invalid circle type ID:', circleTypeId);
      return;
    }
    
    // Find the left panel to place the template container
    var targetPanel = document.querySelector('.circle-panel[data-panel-id="left"]');
    if (!targetPanel) {
      console.error('Left panel not found for rendering template controls');
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
  
  var leftPanel = document.querySelector('.circle-panel[data-panel-id="left"]');
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
          documentId: newDoc.id
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
    
    // Remove DOM elements
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
