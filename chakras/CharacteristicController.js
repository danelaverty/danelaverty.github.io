// src/controllers/CharacteristicController.js - REFACTORED
(function(ChakraApp) {
  ChakraApp.CharacteristicController = function() {
    ChakraApp.BaseController.call(this);
    this.initDOMElements();
    this.initEventSubscriptions();
  };
  
  ChakraApp.CharacteristicController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.CharacteristicController.prototype.constructor = ChakraApp.CharacteristicController;
  
  ChakraApp.CharacteristicController.prototype.initDOMElements = function() {
    this.topPanel = null;
    this.characteristicButtons = {};
    this.characteristicValueDisplays = {};
    this.deleteCircleBtn = null;
    this.deleteValueDisplay = null;
    this.pickers = {};
  };
  
  ChakraApp.CharacteristicController.prototype.initEventSubscriptions = function() {
    this.circleSelectedSubscription = null;
    this.circleUpdatedSubscription = null;
    this.circleDeselectedSubscription = null;
  };
  
  ChakraApp.CharacteristicController.prototype.init = function() {
    ChakraApp.BaseController.prototype.init.call(this);
    this.topPanel = document.getElementById('top-panel');
    this._createCharacteristicControls();
    this._setupEventSubscriptions();
  };
  
  // UI Helper Methods
  ChakraApp.CharacteristicController.prototype._createElem = function(tag, props, parent) {
    var el = document.createElement(tag);
    if (props) {
      for (var key in props) {
        if (key === 'style' && typeof props[key] === 'object') {
          for (var styleKey in props[key]) {
            el.style[styleKey] = props[key][styleKey];
          }
        } else if (key === 'events' && typeof props[key] === 'object') {
          for (var event in props[key]) {
            el.addEventListener(event, props[key][event]);
          }
        } else if (key === 'dataset' && typeof props[key] === 'object') {
          for (var dataKey in props[key]) {
            el.dataset[dataKey] = props[key][dataKey];
          }
        } else {
          el[key] = props[key];
        }
      }
    }
    if (parent) parent.appendChild(el);
    return el;
  };
  
  // Control Creation
  ChakraApp.CharacteristicController.prototype._createCharacteristicControls = function() {
    var buttonContainer = this._createElem('div', {
      id: 'top-panel-controls',
      className: 'top-panel-controls'
    }, this.topPanel) || document.getElementById('top-panel-controls');
    
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    Object.keys(characteristics).forEach(function(key) {
	    if (ChakraApp.appState.circles) {
		    console.log(ChakraApp.appState.selectedCircleId);
		    console.log(ChakraApp.appState.circles[ChakraApp.appState.selectedCircleId]);
	    }
	    console.log(key);
      self._createActionButton(key, characteristics[key], buttonContainer);
    });
    
    this._createDeleteButton(buttonContainer);
  };
  
  ChakraApp.CharacteristicController.prototype._createActionButton = function(key, charDef, parent) {
    var container = this._createElem('div', { className: 'action-btn-container' }, parent);
    this._createElem('div', { className: 'action-btn-title', textContent: charDef.displayName }, container);
    
    var self = this;
    this.characteristicButtons[key] = this._createElem('button', {
      id: key + '-change-btn',
      className: 'action-btn',
      innerHTML: charDef.buttonEmoji,
      title: charDef.buttonTitle,
      style: { display: 'none' },
      events: {
        click: function(e) {
          e.stopPropagation();
          self._showCharacteristicPicker(key, this);
        }
      }
    }, container);
    
    this.characteristicValueDisplays[key] = this._createElem('div', {
      className: 'current-value ' + key + '-value clickable',
      textContent: 'None',
      title: charDef.buttonTitle,
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
        },
        click: function(e) {
          e.stopPropagation();
          self._showCharacteristicPicker(key, this);
        }
      }
    }, container);
  };
  
  ChakraApp.CharacteristicController.prototype._createDeleteButton = function(parent) {
    var container = this._createElem('div', { className: 'action-btn-container' }, parent);
    this._createElem('div', { className: 'action-btn-title', textContent: 'Delete' }, container);
    
    var self = this;
    this.deleteCircleBtn = this._createElem('button', {
      id: 'delete-circle-btn',
      className: 'action-btn',
      innerHTML: '🗑️',
      title: 'Delete Circle',
      style: { display: 'none' },
      events: {
        click: function(e) {
          e.stopPropagation();
          self._confirmDelete();
        }
      }
    }, container);
    
    this.deleteValueDisplay = this._createElem('div', {
      className: 'current-value delete-value clickable',
      innerHTML: '🗑️ Delete',
      title: 'Delete Circle',
      style: {
        display: 'none',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '4px',
        backgroundColor: 'rgba(180, 60, 60, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.2s ease'
      },
      events: {
        mouseover: function() {
          this.style.backgroundColor = 'rgba(220, 80, 80, 0.8)';
          this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        },
        mouseout: function() {
          this.style.backgroundColor = 'rgba(180, 60, 60, 0.8)';
          this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        },
        click: function(e) {
          e.stopPropagation();
          self._confirmDelete();
        }
      }
    }, container);
  };
  
  ChakraApp.CharacteristicController.prototype._confirmDelete = function() {
    if (!ChakraApp.appState.selectedCircleId) return;
    
    var self = this;
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.dialog) {
      ChakraApp.app.controllers.dialog.showConfirmDialog(
        'Are you sure you want to delete this circle?', 
        function() {
          ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
        }
      );
    } else if (confirm('Are you sure you want to delete this circle?')) {
      ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
    }
  };
  
  // Pickers
  ChakraApp.CharacteristicController.prototype._showCharacteristicPicker = function(key, buttonOrDisplay) {
    var charDef = ChakraApp.Config.characteristics[key];
    if (!charDef) return;
    
    var circle = this._getSelectedCircle();
    if (!circle) return;
    
    var picker = this._getOrCreatePicker(key, charDef);
    if (!picker) return;
    
    this._positionPicker(picker, buttonOrDisplay);
    this._highlightCurrentValue(picker, key, circle);
  };
  
  ChakraApp.CharacteristicController.prototype._getSelectedCircle = function() {
    var circleId = ChakraApp.appState.selectedCircleId;
    return circleId ? ChakraApp.appState.getCircle(circleId) : null;
  };
  
  ChakraApp.CharacteristicController.prototype._getOrCreatePicker = function(key, charDef) {
    if (!this.pickers[key]) {
      this.pickers[key] = this._createPicker(key, charDef);
    }
    return this.pickers[key];
  };
  
  ChakraApp.CharacteristicController.prototype._positionPicker = function(picker, element) {
    picker.style.display = 'block';
    var rect = element.getBoundingClientRect();
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var pickerWidth = 280;
    var pickerHeight = Math.min(450, viewportHeight * 0.7);
    
    var left = Math.max(10, Math.min(viewportWidth - pickerWidth - 10, rect.left));
    var top = Math.max(10, Math.min(viewportHeight - pickerHeight - 10, rect.bottom + 10));
    
    picker.style.left = left + 'px';
    picker.style.top = top + 'px';
  };
  
  ChakraApp.CharacteristicController.prototype._highlightCurrentValue = function(picker, key, circle) {
    var currentValue = this._getCircleValue(key, circle);
    
    var allOptions = picker.querySelectorAll('.characteristic-option');
    allOptions.forEach(function(option) {
      option.classList.remove('selected');
      if ((currentValue && option.dataset.value === currentValue) ||
          (!currentValue && option.classList.contains('no-value'))) {
        option.classList.add('selected');
      }
    });
  };
  
  ChakraApp.CharacteristicController.prototype._getCircleValue = function(key, circle) {
    if (key === 'color') return circle.color;
    return circle.characteristics && circle.characteristics[key] !== undefined ? 
           circle.characteristics[key] : null;
  };
  
  ChakraApp.CharacteristicController.prototype._createPicker = function(key, charDef) {
    var picker = this._createElem('div', {
      id: key + '-picker',
      className: key === 'color' ? 'color-picker-modal' : 'characteristic-picker-modal',
      style: {
        position: 'fixed',
        display: 'none',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)',
        zIndex: '1000',
        maxWidth: key === 'color' ? '600px' : '400px',
        maxHeight: '500px',
        overflowY: 'auto'
      }
    }, document.body);
    
    this._createPickerCloseButton(picker);
    this._createPickerHeader(picker, charDef.modalTitle || 'Select ' + charDef.displayName);
    
    var content = this._createElem('div', {
      className: key === 'color' ? 'color-picker-content' : 'characteristic-picker-content'
    }, picker);
    
    if (key === 'color') {
      this._createColorContent(content);
    } else {
      this._createGenericContent(key, charDef, content);
    }
    
    this._addOutsideClickHandler(picker, key);
    
    return picker;
  };
  
  ChakraApp.CharacteristicController.prototype._createPickerCloseButton = function(picker) {
    this._createElem('button', {
      className: 'picker-close',
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
  };
  
  ChakraApp.CharacteristicController.prototype._createPickerHeader = function(picker, headerText) {
    this._createElem('div', {
      className: 'picker-header',
      textContent: headerText,
      style: {
        marginBottom: '15px',
        fontSize: '16px',
        fontWeight: 'bold',
	    color: 'white',
      }
    }, picker);
  };
  
  ChakraApp.CharacteristicController.prototype._addOutsideClickHandler = function(picker, key) {
    document.addEventListener('click', function(e) {
      if (picker.style.display === 'block' && 
          !picker.contains(e.target) && 
          e.target.id !== key + '-change-btn') {
        picker.style.display = 'none';
      }
    });
  };
  
  // Color Picker
  ChakraApp.CharacteristicController.prototype._createColorContent = function(content) {
    var colorGrid = this._createElem('div', {
      className: 'color-grid',
      style: { display: 'flex', gap: '10px' }
    }, content);
    
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
    
    var self = this;
    colorFamilies.forEach(function(family) {
      var familyContainer = self._createElem('div', {
        className: 'color-family',
        style: {
          backgroundColor: family.bg,
          borderRadius: '5px',
          padding: '10px',
          flex: '1'
        }
      }, colorGrid);
      
      self._createElem('div', {
        className: 'family-name',
        textContent: family.name,
        style: {
          fontWeight: 'bold',
          marginBottom: '10px'
        }
      }, familyContainer);
      
      var swatchContainer = self._createElem('div', {
        className: 'swatches-container',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }
      }, familyContainer);
      
      family.colors.forEach(function(item) {
        self._createColorOption(swatchContainer, item);
      });
    });
  };
  
  ChakraApp.CharacteristicController.prototype._createColorOption = function(container, item) {
    var self = this;
    var colorOption = this._createElem('div', {
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
            ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
              color: item.color,
              crystal: item.crystal
            });

	    var circle = ChakraApp.appState.getCircle(ChakraApp.appState.selectedCircleId);
	    if (circle) {
		    self._updateValueDisplays(circle);
	    }
            self._closeAllPickers();
          }
        }
      }
    }, container);
    
    this._createElem('div', {
      className: 'crystal-name',
      textContent: item.crystal,
      style: { flex: '1' }
    }, colorOption);
    
    this._createElem('div', {
      className: 'color-picker-swatch',
      style: {
        backgroundColor: item.color,
        width: '20px',
        height: '20px',
        borderRadius: '3px',
        border: '1px solid rgba(0, 0, 0, 0.3)'
      },
      dataset: { color: item.color },
      title: item.crystal + ': ' + item.color
    }, colorOption);
  };
  
  // Generic Picker
  ChakraApp.CharacteristicController.prototype._createGenericContent = function(key, charDef, content) {
    var mainGrid = this._createElem('div', { className: 'characteristic-grid' }, content);
    
    // Add "None" option
    var optionsContainer = this._createElem('div', { className: 'characteristic-options-container' }, mainGrid);
    this._createNoValueOption(optionsContainer, key, charDef);
    
    // Add category options
    var self = this;
    charDef.categories.forEach(function(category) {
      var categoryContainer = self._createElem('div', { className: 'characteristic-options-container' }, mainGrid);
      
      if (category.name) {
        self._createElem('div', {
          className: 'category-heading',
          textContent: category.name,
          style: {
            fontWeight: 'bold',
            marginTop: '10px',
            marginBottom: '5px',
		color: 'white',
          }
        }, categoryContainer);
      }
      
      category.options.forEach(function(option) {
        self._createCharacteristicOption(categoryContainer, key, option);
      });
    });
  };
  
  ChakraApp.CharacteristicController.prototype._createNoValueOption = function(container, key, charDef) {
    var self = this;
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
          if (!ChakraApp.appState.selectedCircleId) return;
          
          var circle = self._getSelectedCircle();
          if (!circle) return;
          
          var viewModel = null;
          ChakraApp.app.viewManager.circleViews.forEach(function(view) {
            if (view.viewModel.id === circle.id) {
              viewModel = view.viewModel;
            }
          });
          
          if (viewModel) {
            viewModel.updateCharacteristic(key, null);
	    setTimeout(function() {
		    var updatedCircle = ChakraApp.appState.getCircle(circle.id);
		    if (updatedCircle) {
			    self._updateValueDisplays(updatedCircle);
		    }
	    }, 0);
            self._closeAllPickers();
          }
        }
      }
    }, container);
    
    this._createElem('span', {
      className: 'characteristic-emoji',
      textContent: '∅',
      style: {
        fontSize: '24px',
        marginRight: '10px',
	    color: 'white',
      }
    }, noValueOption);
    
    this._createElem('div', {
      className: 'characteristic-name',
      textContent: 'No ' + charDef.displayName,
      style: {
        fontWeight: 'bold',
        marginBottom: '5px',
        color: 'white',
      }
    }, noValueOption);
    
    this._createElem('div', {
      className: 'characteristic-desc',
      textContent: 'Clear ' + charDef.displayName.toLowerCase(),
      style: {
        fontSize: '12px',
        opacity: '0.8',
        color: 'white',
      }
    }, noValueOption);
  };
  
  ChakraApp.CharacteristicController.prototype._createCharacteristicOption = function(container, key, option) {
    var self = this;
    var backgroundColor = option.visualStyle && option.visualStyle.color || '#333';
    
    var optionElement = this._createElem('div', {
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
        backgroundColor: backgroundColor
      },
      events: {
        click: function() {
          if (!ChakraApp.appState.selectedCircleId) return;
          
          var circle = self._getSelectedCircle();
          if (!circle) return;
          
          var viewModel = null;
          ChakraApp.app.viewManager.circleViews.forEach(function(view) {
            if (view.viewModel.id === circle.id) {
              viewModel = view.viewModel;
            }
          });
          
          if (viewModel) {
            viewModel.updateCharacteristic(key, option.value);

	    setTimeout(function() {
		    var updatedCircle = ChakraApp.appState.getCircle(circle.id);
		    if (updatedCircle) {
			    self._updateValueDisplays(updatedCircle);
		    }
	    }, 0);
            self._closeAllPickers();
          }
        }
      }
    }, container);
    
    // Special case for identity
    if (key === 'identity' && option.visualStyle && option.visualStyle.number) {
      this._createElem('div', {
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
      this._createElem('span', {
        className: 'characteristic-emoji',
        textContent: option.visualStyle.emoji,
        style: {
          fontSize: '24px',
          marginRight: '10px',
	    color: 'white',
        }
      }, optionElement);
    }
    
    this._createElem('div', {
      className: 'characteristic-name',
      textContent: option.display,
      style: {
        fontWeight: 'bold',
        color: 'white',
      }
    }, optionElement);
    
    if (option.secondary) {
      this._createElem('div', {
        className: 'characteristic-desc',
        textContent: option.secondary,
        style: {
          fontSize: '12px',
          opacity: '0.8',
          color: 'white',
        }
      }, optionElement);
    }
  };
  
  ChakraApp.CharacteristicController.prototype._closeAllPickers = function() {
    for (var key in this.pickers) {
      if (this.pickers[key]) {
        this.pickers[key].style.display = 'none';
      }
    }
  };
  
  // Event Handling
  ChakraApp.CharacteristicController.prototype._setupEventSubscriptions = function() {
    var self = this;
    
    this.circleSelectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(circle) {
        self._toggleActionButtons(true);
        document.body.classList.add('circle-selected');
        self._updateValueDisplays(circle);
      }
    );
    
    this.circleUpdatedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_UPDATED,
      function(circle) {
	      if (circle && circle.id === ChakraApp.appState.selectedCircleId) {
		      var updatedCircle = ChakraApp.appState.getCircle(circle.id);
		      if (updatedCircle) {
			      self._updateValueDisplays(updatedCircle);
		      }
	      }
      }
    );
    
    this.circleDeselectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        self._toggleActionButtons(false);
        document.body.classList.remove('circle-selected');
      }
    );
  };
  
  ChakraApp.CharacteristicController.prototype._toggleActionButtons = function(show) {
    Object.values(this.characteristicValueDisplays).forEach(function(display) {
      if (display) display.style.display = show ? 'flex' : 'none';
    });
    
    if (this.deleteValueDisplay) {
      this.deleteValueDisplay.style.display = show ? 'flex' : 'none';
    }
  };
  
  ChakraApp.CharacteristicController.prototype._updateValueDisplays = function(circle) {
    if (!circle) return;
    
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    Object.keys(characteristics).forEach(function(key) {
      var displayEl = self.characteristicValueDisplays[key];
      if (!displayEl) return;
      
      var value = self._getCircleValue(key, circle);
      
      if (value) {
        var charDef = characteristics[key];
        var option = null;
        
        charDef.categories.forEach(function(category) {
          category.options.forEach(function(opt) {
            if (opt.value === value) option = opt;
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
  
  ChakraApp.CharacteristicController.prototype.destroy = function() {
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    if (this.circleSelectedSubscription) this.circleSelectedSubscription();
    if (this.circleUpdatedSubscription) this.circleUpdatedSubscription();
    if (this.circleDeselectedSubscription) this.circleDeselectedSubscription();
    
    for (var key in this.pickers) {
      var picker = this.pickers[key];
      if (picker && picker.parentNode) {
        picker.parentNode.removeChild(picker);
      }
    }
    
    this.pickers = {};
  };
  
})(window.ChakraApp = window.ChakraApp || {});
