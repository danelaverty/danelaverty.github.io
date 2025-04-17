// src/controllers/CharacteristicController.js - OPTIMIZED
(function(ChakraApp) {
  /**
   * Controls circle characteristics UI (color, element, etc.)
   */
  ChakraApp.CharacteristicController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.topPanel = null;
    this.characteristicButtons = {};
    this.characteristicValueDisplays = {};
    this.deleteCircleBtn = null;
    this.deleteValueDisplay = null;
    this.pickers = {};
    
    // Event subscriptions
    this.circleSelectedSubscription = null;
    this.circleUpdatedSubscription = null;
    this.circleDeselectedSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.CharacteristicController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.CharacteristicController.prototype.constructor = ChakraApp.CharacteristicController;
  
  // Initialize
  ChakraApp.CharacteristicController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Get DOM elements
    this.topPanel = document.getElementById('top-panel');
    
    // Create characteristic buttons and value displays
    this._createCharacteristicControls();
    
    // Subscribe to circle events
    this._setupEventSubscriptions();
  };
  
  // Helper function for creating DOM elements
  ChakraApp.CharacteristicController.prototype._createElem = function(tag, props, parent) {
    var el = document.createElement(tag);
    
    if (props) {
      for (var key in props) {
        if (key === 'style' && typeof props[key] === 'object') {
          // Handle style object
          for (var styleKey in props[key]) {
            el.style[styleKey] = props[key][styleKey];
          }
        } else if (key === 'events' && typeof props[key] === 'object') {
          // Handle event listeners
          for (var event in props[key]) {
            el.addEventListener(event, props[key][event]);
          }
        } else {
          // Set other properties directly
          el[key] = props[key];
        }
      }
    }
    
    if (parent) parent.appendChild(el);
    return el;
  };
  
  // Helper for common action button container
  ChakraApp.CharacteristicController.prototype._createActionContainer = function(title, btnProps, valueProps, parent) {
    var container = this._createElem('div', { className: 'action-btn-container' }, parent);
    
    // Create title
    this._createElem('div', { 
      className: 'action-btn-title',
      textContent: title
    }, container);
    
    // Create button (hidden but referenced)
    var btn = this._createElem('button', Object.assign({
      className: 'action-btn',
      style: { display: 'none' }
    }, btnProps), container);
    
    // Create value display (clickable)
    var valueDisplay = this._createElem('div', Object.assign({
      className: 'current-value clickable',
      textContent: 'None',
      style: { 
        display: 'none',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '4px',
        backgroundColor: 'rgba(60, 60, 60, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.2s ease'
      },
      events: {
        mouseover: function() {
          this.style.backgroundColor = 'rgba(80, 80, 80, 0.8)';
          this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        },
        mouseout: function() {
          this.style.backgroundColor = 'rgba(60, 60, 60, 0.8)';
          this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
      }
    }, valueProps), container);
    
    return { container, btn, valueDisplay };
  };

  /**
   * Create all characteristic controls
   * @private
   */
  ChakraApp.CharacteristicController.prototype._createCharacteristicControls = function() {
    // Create button container if needed
    var buttonContainer = document.getElementById('top-panel-controls');
    if (!buttonContainer) {
      buttonContainer = this._createElem('div', {
        id: 'top-panel-controls',
        className: 'top-panel-controls'
      }, this.topPanel);
    }
    
    // Create buttons for each characteristic
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    // Process each characteristic
    Object.keys(characteristics).forEach(function(key) {
      var charDef = characteristics[key];
      
      // Create control elements
      var control = self._createActionContainer(
        charDef.displayName,
        {
          id: key + '-change-btn',
          innerHTML: charDef.buttonEmoji,
          title: charDef.buttonTitle,
          events: {
            click: function(e) {
              e.stopPropagation();
              if (ChakraApp.appState.selectedCircleId) {
                self._showCharacteristicPicker(key, this);
              }
            }
          }
        },
        {
          className: 'current-value ' + key + '-value clickable',
          title: charDef.buttonTitle,
          events: {
            click: function(e) {
              e.stopPropagation();
              if (ChakraApp.appState.selectedCircleId) {
                self._showCharacteristicPicker(key, this);
              }
            }
          }
        },
        buttonContainer
      );
      
      // Store references
      self.characteristicButtons[key] = control.btn;
      self.characteristicValueDisplays[key] = control.valueDisplay;
    });
    
    // Create delete button container
    var deleteControl = this._createActionContainer(
      'Delete',
      {
        id: 'delete-circle-btn',
        innerHTML: '🗑️',
        title: 'Delete Circle',
        events: {
          click: function(e) {
            e.stopPropagation();
            if (ChakraApp.appState.selectedCircleId) {
              self._showDeleteDialog(function() {
                ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
              });
            }
          }
        }
      },
      {
        className: 'current-value delete-value clickable',
        innerHTML: '🗑️ Delete',
        title: 'Delete Circle',
        style: {
          backgroundColor: 'rgba(180, 60, 60, 0.8)'
        },
        events: {
          mouseover: function() {
            this.style.backgroundColor = 'rgba(220, 80, 80, 0.8)';
          },
          mouseout: function() {
            this.style.backgroundColor = 'rgba(180, 60, 60, 0.8)';
          },
          click: function(e) {
            e.stopPropagation();
            if (ChakraApp.appState.selectedCircleId) {
              self._showDeleteDialog(function() {
                ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
              });
            }
          }
        }
      },
      buttonContainer
    );
    
    // Store delete button references
    this.deleteCircleBtn = deleteControl.btn;
    this.deleteValueDisplay = deleteControl.valueDisplay;
  };
  
  /**
   * Show the characteristic picker
   * @private
   */
  ChakraApp.CharacteristicController.prototype._showCharacteristicPicker = function(key, buttonOrDisplay) {
    // Get the characteristic definition
    var charDef = ChakraApp.Config.characteristics[key];
    if (!charDef) return;
    
    // Get the current circle
    var circleId = ChakraApp.appState.selectedCircleId;
    var circle = ChakraApp.appState.getCircle(circleId);
    if (!circle) return;
    
    // Create picker if it doesn't exist
    var picker = this.pickers[key];
    if (!picker) {
      picker = this._createPicker(key, charDef);
      this.pickers[key] = picker;
    }
    if (!picker) return;
    
    // Show the picker
    picker.style.display = 'block';
    
    // Position the picker near the button or value display that was clicked
    var elementRect = buttonOrDisplay.getBoundingClientRect();
    var leftPos = elementRect.left;
    var topPos = elementRect.bottom + 10;
    
    // Make sure it stays within the viewport
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var pickerWidth = 280;
    var pickerHeight = Math.min(450, viewportHeight * 0.7);
    
    leftPos = Math.max(10, Math.min(viewportWidth - pickerWidth - 10, leftPos));
    topPos = Math.max(10, Math.min(viewportHeight - pickerHeight - 10, topPos));
    
    picker.style.left = leftPos + 'px';
    picker.style.top = topPos + 'px';
    
    // Get current value based on characteristic key
    var currentValue = null;
    if (key === 'color') {
      currentValue = circle.color;
    } else if (key === 'element') {
      currentValue = circle.element;
    } else if (circle.characteristics && circle.characteristics[key] !== undefined) {
      currentValue = circle.characteristics[key];
    }
    
    // Highlight appropriate option
    var allOptions = picker.querySelectorAll('.characteristic-option');
    allOptions.forEach(function(option) {
      option.classList.remove('selected');
      if ((currentValue && option.dataset.value === currentValue) ||
          (!currentValue && option.classList.contains('no-value'))) {
        option.classList.add('selected');
      }
    });
  };

  /**
   * Create characteristic picker - unified approach for all picker types
   * @private
   */
  ChakraApp.CharacteristicController.prototype._createPicker = function(key, charDef) {
    var config = {
      id: key + '-picker',
      title: charDef.modalTitle || 'Select ' + charDef.displayName,
      noValueOption: {
        text: 'No ' + charDef.displayName,
        description: 'Clear ' + charDef.displayName.toLowerCase()
      }
    };
    
    // Special configurations for each type
    if (key === 'color') {
      return this._createColorPicker(config);
    } else if (key === 'element') {
      return this._createElementPicker(config);
    } else {
      return this._createGenericPicker(key, charDef, config);
    }
  };
  
  /**
   * Create a color picker
   * @private
   */
  ChakraApp.CharacteristicController.prototype._createColorPicker = function(config) {
    var self = this;
    
    // Create picker container
    var picker = this._createElem('div', {
      id: config.id,
      className: 'color-picker-modal',
      style: {
        position: 'fixed',
        display: 'none',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)',
        zIndex: '1000',
        maxWidth: '600px',
        maxHeight: '500px',
        overflowY: 'auto'
      }
    }, document.body);
    
    // Create close button
    this._createElem('button', {
      className: 'color-picker-close',
      innerHTML: '×',
      title: 'Close',
      style: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer'
      },
      events: {
        click: function() {
          picker.style.display = 'none';
        }
      }
    }, picker);
    
    // Optional header
    this._createElem('div', {
      className: 'color-picker-header',
      textContent: 'Crystal Colors',
      style: {
        marginBottom: '15px',
        fontSize: '16px',
        fontWeight: 'bold'
      }
    }, picker);
    
    // Create content container
    var content = this._createElem('div', {
      className: 'color-picker-content'
    }, picker);
    
    // Create color grid
    var colorGrid = this._createElem('div', {
      className: 'color-grid',
      style: {
        display: 'flex',
        gap: '10px'
      }
    }, content);
    
    // Process color families
    var colorFamilies = [
      { 
        name: "Warm Crystals", 
        colors: [
          { color: '#FF0050', crystal: 'Ruby' },
          { color: '#FF0000', crystal: 'Garnet' },
          { color: '#FFAAAA', crystal: 'Rose Quartz' },
          { color: '#FF5234', crystal: 'Carnelian' },
          { color: '#FFAC00', crystal: 'Amber' },
          { color: '#FFE700', crystal: 'Citrine' },
          { color: '#B87333', crystal: 'Tiger\'s Eye' },
          { color: '#CD7F32', crystal: 'Sunstone' },
          { color: '#D35400', crystal: 'Fire Agate' },
          { color: '#A52A2A', crystal: 'Smoky Quartz' },
          { color: '#FFFFFF', crystal: 'Clear Quartz' },
          { color: '#FFC0CB', crystal: 'Rhodochrosite' }
        ], 
        bg: '#FFF5F5' 
      },
      { 
        name: "Cool Crystals", 
        colors: [
          { color: '#D0FF00', crystal: 'Peridot' },
          { color: '#00FF00', crystal: 'Emerald' },
          { color: '#00FFD0', crystal: 'Aquamarine' },
          { color: '#99EEFF', crystal: 'Turquoise' },
          { color: '#0000FF', crystal: 'Sapphire' },
          { color: '#AA2BFF', crystal: 'Amethyst' },
          { color: '#FF00FF', crystal: 'Sugilite' },
          { color: '#800080', crystal: 'Charoite' },
          { color: '#483D8B', crystal: 'Lapis Lazuli' },
          { color: '#999999', crystal: 'Hematite' },
          { color: '#000000', crystal: 'Obsidian' },
          { color: '#40E0D0', crystal: 'Amazonite' }
        ], 
        bg: '#F5F5FF' 
      }
    ];
    
    colorFamilies.forEach(function(family) {
      // Create family container
      var familyContainer = self._createElem('div', {
        className: 'color-family',
        style: {
          backgroundColor: family.bg,
          borderRadius: '5px',
          padding: '10px',
          flex: '1'
        }
      }, colorGrid);
      
      // Create family label
      self._createElem('div', {
        className: 'family-name',
        textContent: family.name,
        style: {
          fontWeight: 'bold',
          marginBottom: '10px'
        }
      }, familyContainer);
      
      // Create swatches container
      var swatchesContainer = self._createElem('div', {
        className: 'swatches-container',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }
      }, familyContainer);
      
      // Add color options with crystal names
      family.colors.forEach(function(item) {
        var colorOption = self._createElem('div', {
          className: 'color-option characteristic-option',
          dataset: {
            value: item.color,
            characteristic: 'color'
          },
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '5px',
            borderRadius: '3px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          },
          events: {
            mouseover: function() {
              this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            },
            mouseout: function() {
              this.style.backgroundColor = '';
            },
            click: function() {
              if (ChakraApp.appState.selectedCircleId) {
                // Update the circle data
                ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
                  color: item.color,
                  crystal: item.crystal
                });
                
                // Close color picker
                picker.style.display = 'none';
              }
            }
          }
        }, swatchesContainer);
        
        // Create crystal name label (left)
        self._createElem('div', {
          className: 'crystal-name',
          textContent: item.crystal,
          style: {
            flex: '1'
          }
        }, colorOption);
        
        // Create color swatch (right)
        self._createElem('div', {
          className: 'color-picker-swatch',
          style: {
            backgroundColor: item.color,
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            border: '1px solid rgba(0, 0, 0, 0.3)'
          },
          dataset: {
            color: item.color
          },
          title: item.crystal + ': ' + item.color
        }, colorOption);
      });
    });
    
    // Close picker when clicking outside
    document.addEventListener('click', function(e) {
      if (picker.style.display === 'block' && 
          !picker.contains(e.target) && 
          e.target.id !== 'color-change-btn') {
        picker.style.display = 'none';
      }
    });
    
    return picker;
  };
  
  /**
   * Create an element picker or other characteristic picker
   * @private
   */
  ChakraApp.CharacteristicController.prototype._createElementPicker = function(config) {
    return this._createGenericPicker('element', ChakraApp.Config.characteristics.element, config);
  };

  /**
   * Create a generic characteristic picker (used for elements and other characteristics)
   * @private
   */
  ChakraApp.CharacteristicController.prototype._createGenericPicker = function(key, charDef, config) {
    var self = this;
    
    // Create picker container
    var picker = this._createElem('div', {
      id: config.id,
      className: 'characteristic-picker-modal',
      style: {
        position: 'fixed',
        display: 'none',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)',
        zIndex: '1000',
        maxWidth: '400px',
        maxHeight: '500px',
        overflowY: 'auto'
      }
    }, document.body);
    
    // Create close button
    this._createElem('button', {
      className: 'characteristic-picker-close',
      innerHTML: '×',
      title: 'Close',
      style: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer'
      },
      events: {
        click: function() {
          picker.style.display = 'none';
        }
      }
    }, picker);
    
    // Header
    this._createElem('div', {
      className: 'characteristic-picker-header',
      textContent: config.title,
      style: {
        marginBottom: '15px',
        fontSize: '16px',
        fontWeight: 'bold'
      }
    }, picker);
    
    // Create picker content
    var pickerContent = this._createElem('div', {
      className: 'characteristic-picker-content'
    }, picker);
    
    // Main grid
    var mainGrid = this._createElem('div', {
      className: 'characteristic-grid'
    }, pickerContent);
    
    // Add a "No Value" option first
    var optionsContainer = this._createElem('div', {
      className: 'characteristic-options-container'
    }, mainGrid);
    
    var noValueOption = this._createElem('div', {
      className: 'characteristic-option no-value',
      dataset: {
        value: '',
        characteristic: key
      },
      style: {
        backgroundColor: '#333',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '10px',
        cursor: 'pointer'
      },
      events: {
        click: function() {
          if (ChakraApp.appState.selectedCircleId) {
            var circle = ChakraApp.appState.getCircle(ChakraApp.appState.selectedCircleId);
            if (!circle) return;
            
            // Get the view model if needed
            var viewModel = null;
            ChakraApp.app.viewManager.circleViews.forEach(function(view) {
              if (view.viewModel.id === circle.id) {
                viewModel = view.viewModel;
              }
            });
            
            if (!viewModel) return;
            
            // Update the characteristic
            viewModel.updateCharacteristic(key, null);
            
            // Update UI state
            var allOptions = picker.querySelectorAll('.characteristic-option');
            allOptions.forEach(function(option) {
              option.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Close picker
            picker.style.display = 'none';
          }
        }
      }
    }, optionsContainer);
    
    // Create symbol for No Value
    this._createElem('span', {
      className: 'characteristic-emoji',
      textContent: '∅',
      style: {
        fontSize: '24px',
        marginRight: '10px'
      }
    }, noValueOption);
    
    // Create name
    this._createElem('div', {
      className: 'characteristic-name',
      textContent: config.noValueOption.text,
      style: {
        fontWeight: 'bold',
        marginBottom: '5px'
      }
    }, noValueOption);
    
    // Create description
    this._createElem('div', {
      className: 'characteristic-desc',
      textContent: config.noValueOption.description,
      style: {
        fontSize: '12px',
        opacity: '0.8'
      }
    }, noValueOption);
    
    // Process each category
    charDef.categories.forEach(function(category) {
      var categoryContainer = self._createElem('div', {
        className: 'characteristic-options-container'
      }, mainGrid);
      
      // Add category heading if it has a name
      if (category.name) {
        self._createElem('div', {
          className: 'category-heading',
          textContent: category.name,
          style: {
            fontWeight: 'bold',
            marginTop: '10px',
            marginBottom: '5px'
          }
        }, categoryContainer);
      }
      
      // Add each option
      category.options.forEach(function(option) {
        var optionElement = self._createElem('div', {
          className: 'characteristic-option',
          dataset: {
            value: option.value,
            characteristic: key
          },
          style: {
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '5px',
            cursor: 'pointer',
            backgroundColor: option.visualStyle && option.visualStyle.color || '#333'
          },
          events: {
            click: function() {
              if (ChakraApp.appState.selectedCircleId) {
                var circle = ChakraApp.appState.getCircle(ChakraApp.appState.selectedCircleId);
                if (!circle) return;
                
                // Get the view model
                var viewModel = null;
                ChakraApp.app.viewManager.circleViews.forEach(function(view) {
                  if (view.viewModel.id === circle.id) {
                    viewModel = view.viewModel;
                  }
                });
                
                if (!viewModel) return;
                
                // Update the characteristic
                viewModel.updateCharacteristic(key, option.value);
                
                // Update UI state
                var allOptions = picker.querySelectorAll('.characteristic-option');
                allOptions.forEach(function(opt) {
                  opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                // Close picker
                picker.style.display = 'none';
              }
            }
          }
        }, categoryContainer);

	// Add appropriate elements based on characteristic type
        if (key === 'identity' && option.visualStyle && option.visualStyle.number) {
          self._createElem('div', {
            className: 'identity-number',
            textContent: option.visualStyle.number,
            style: {
              fontWeight: 'bold',
              fontSize: '18px'
            }
          }, optionElement);
        }
        
        // Add emoji if available
        if (option.visualStyle && option.visualStyle.emoji) {
          self._createElem('span', {
            className: 'characteristic-emoji',
            textContent: option.visualStyle.emoji,
            style: {
              fontSize: '24px',
              marginRight: '10px'
            }
          }, optionElement);
        }
        
        // Create name
        self._createElem('div', {
          className: 'characteristic-name',
          textContent: option.display,
          style: {
            fontWeight: 'bold'
          }
        }, optionElement);
        
        // Create description if available
        if (option.secondary) {
          self._createElem('div', {
            className: 'characteristic-desc',
            textContent: option.secondary,
            style: {
              fontSize: '12px',
              opacity: '0.8'
            }
          }, optionElement);
        }
      });
    });
    
    // Hide picker when clicking outside
    document.addEventListener('click', function(e) {
      if (picker.style.display === 'block' && 
          !picker.contains(e.target) && 
          e.target.id !== key + '-change-btn') {
        picker.style.display = 'none';
      }
    });
    
    return picker;
  };
  
  /**
   * Show delete dialog
   * @private
   */
  ChakraApp.CharacteristicController.prototype._showDeleteDialog = function(onConfirm) {
    // Use the DialogController if available
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.dialog) {
      ChakraApp.app.controllers.dialog.showConfirmDialog('Are you sure you want to delete this circle?', onConfirm);
    } else {
      // Fallback to simple confirm
      if (confirm('Are you sure you want to delete this circle?')) {
        onConfirm();
      }
    }
  };
  
  /**
   * Set up event subscriptions
   * @private
   */
  ChakraApp.CharacteristicController.prototype._setupEventSubscriptions = function() {
    var self = this;
    
    // Subscribe to circle selection events
    this.circleSelectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(circle) {
        self._toggleActionButtons(true);
	document.body.classList.add('circle-selected');
        self._updateValueDisplays(circle);
      }
    );
    
    // Subscribe to circle update events
    this.circleUpdatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_UPDATED,
      function(circle) {
        if (circle.id === ChakraApp.appState.selectedCircleId) {
          self._updateValueDisplays(circle);
        }
      }
    );
    
    // Subscribe to circle deselection events
    this.circleDeselectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        self._toggleActionButtons(false);
	document.body.classList.add('circle-selected');
      }
    );
  };
  
  /**
   * Toggle action buttons visibility
   * @private
   */
  ChakraApp.CharacteristicController.prototype._toggleActionButtons = function(show) {
    // Update all characteristic value displays
    Object.values(this.characteristicValueDisplays).forEach(function(display) {
      if (display) {
        display.style.display = show ? 'flex' : 'none';
      }
    });
    
    // Show/hide the delete value display
    if (this.deleteValueDisplay) {
      this.deleteValueDisplay.style.display = show ? 'flex' : 'none';
    }
  };
  
  /**
   * Update value displays based on circle characteristics
   * @private
   */
  ChakraApp.CharacteristicController.prototype._updateValueDisplays = function(circle) {
    if (!circle) return;
    
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    // Update all characteristic value displays
    Object.keys(characteristics).forEach(function(key) {
      var charDef = characteristics[key];
      var displayEl = self.characteristicValueDisplays[key];
      if (!displayEl) return;
      
      var value = null;
      
      // Get the current value based on characteristic key
      if (key === 'color') {
        value = circle.color;
      } else if (key === 'element') {
        value = circle.element;
      } else if (circle.characteristics && circle.characteristics[key] !== undefined) {
        value = circle.characteristics[key];
      }
      
      // Update the display based on the value and display style
      if (value) {
        // Find the option definition for this value
        var option = null;
        charDef.categories.forEach(function(category) {
          category.options.forEach(function(opt) {
            if (opt.value === value) {
              option = opt;
            }
          });
        });
        
        if (option) {
          var displayType = charDef.valueDisplayStyle.type;
          var template = charDef.valueDisplayStyle.template;
          
          if (displayType === 'swatch' && template) {
            displayEl.innerHTML = template
              .replace('{VALUE}', value)
              .replace('{DISPLAY}', option.display);
          } else if (displayType === 'emoji' && template && option.visualStyle && option.visualStyle.emoji) {
            displayEl.innerHTML = template
              .replace('{EMOJI}', option.visualStyle.emoji)
              .replace('{DISPLAY}', option.display);
          } else if (displayType === 'number' && template && option.visualStyle && option.visualStyle.number) {
            displayEl.innerHTML = template
              .replace('{NUMBER}', option.visualStyle.number)
              .replace('{DISPLAY}', option.display);
          } else {
            displayEl.textContent = option.display;
          }
        } else {
          displayEl.textContent = value;
        }
      } else {
        displayEl.textContent = 'None';
      }
    });
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.CharacteristicController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up event subscriptions
    if (this.circleSelectedSubscription) {
      this.circleSelectedSubscription();
      this.circleSelectedSubscription = null;
    }
    
    if (this.circleUpdatedSubscription) {
      this.circleUpdatedSubscription();
      this.circleUpdatedSubscription = null;
    }
    
    if (this.circleDeselectedSubscription) {
      this.circleDeselectedSubscription();
      this.circleDeselectedSubscription = null;
    }
    
    // Clean up pickers
    for (var key in this.pickers) {
      if (this.pickers.hasOwnProperty(key)) {
        var picker = this.pickers[key];
        if (picker && picker.parentNode) {
          picker.parentNode.removeChild(picker);
        }
      }
    }
    this.pickers = {};
  };
  
})(window.ChakraApp = window.ChakraApp || {});
