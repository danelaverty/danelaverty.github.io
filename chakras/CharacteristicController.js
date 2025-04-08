// src/controllers/CharacteristicController.js
(function(ChakraApp) {
  /**
   * Controls circle characteristics UI (color, element, etc.)
   */
  ChakraApp.CharacteristicController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.topPanel = null;
    
    // Button references
    this.characteristicButtons = {};
    this.characteristicValueDisplays = {};
    this.deleteCircleBtn = null;
    this.deleteValueDisplay = null;
    
    // Characteristic pickers
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
  
  /**
   * Create all characteristic controls
   * @private
   */
  ChakraApp.CharacteristicController.prototype._createCharacteristicControls = function() {
    // Create button container if it doesn't exist
    var buttonContainer = document.getElementById('top-panel-controls');
    if (!buttonContainer) {
      buttonContainer = document.createElement('div');
      buttonContainer.id = 'top-panel-controls';
      buttonContainer.className = 'top-panel-controls';
      this.topPanel.appendChild(buttonContainer);
    }
    
    // Create action buttons for each characteristic
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    // Store references to buttons and displays
    this.characteristicButtons = {};
    this.characteristicValueDisplays = {};
    
    // Create button for each characteristic
    Object.keys(characteristics).forEach(function(key) {
      var charDef = characteristics[key];
      
      // Create button container
      var btnContainer = document.createElement('div');
      btnContainer.className = 'action-btn-container';
      
      // Create title above the button
      var titleLabel = document.createElement('div');
      titleLabel.className = 'action-btn-title';
      titleLabel.textContent = charDef.displayName;
      btnContainer.appendChild(titleLabel);
      
      // Create button (but keep it hidden)
      var btn = document.createElement('button');
      btn.id = key + '-change-btn';
      btn.className = 'action-btn';
      btn.innerHTML = charDef.buttonEmoji;
      btn.style.display = 'none'; // Always hide the button
      btn.title = charDef.buttonTitle;
      
      // Store reference to button
      self.characteristicButtons[key] = btn;
      
      // Create value display (make it clickable)
      var valueDisplay = document.createElement('div');
      valueDisplay.className = 'current-value ' + key + '-value clickable';
      valueDisplay.textContent = 'None';
      valueDisplay.style.display = 'none'; // Initially hidden
      valueDisplay.style.cursor = 'pointer'; // Make it look clickable
      valueDisplay.title = charDef.buttonTitle; // Add the same tooltip
      
      // Style the value display to look more button-like
      valueDisplay.style.padding = '2px';
      valueDisplay.style.borderRadius = '4px';
      valueDisplay.style.backgroundColor = 'rgba(60, 60, 60, 0.8)';
      valueDisplay.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      valueDisplay.style.transition = 'all 0.2s ease';
      
      // Add hover effect
      valueDisplay.addEventListener('mouseover', function() {
        this.style.backgroundColor = 'rgba(80, 80, 80, 0.8)';
        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      });
      
      valueDisplay.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'rgba(60, 60, 60, 0.8)';
        this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
      
      // Store reference to value display
      self.characteristicValueDisplays[key] = valueDisplay;
      
      // Add to container
      btnContainer.appendChild(btn);
      btnContainer.appendChild(valueDisplay);
      
      // Add to button container
      buttonContainer.appendChild(btnContainer);
      
      // Add click handler to the value display (same functionality as the button)
      valueDisplay.addEventListener('click', function(e) {
        e.stopPropagation();
        if (ChakraApp.appState.selectedCircleId) {
          self._showCharacteristicPicker(key, this);
        }
      });
      
      // Keep the original button click handler (even though button is hidden)
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (ChakraApp.appState.selectedCircleId) {
          self._showCharacteristicPicker(key, this);
        }
      });
    });
    
    // Create delete button container with title
    var deleteBtnContainer = document.createElement('div');
    deleteBtnContainer.className = 'action-btn-container';
    
    // Add title for delete button
    var deleteTitle = document.createElement('div');
    deleteTitle.className = 'action-btn-title';
    deleteTitle.textContent = 'Delete';
    deleteBtnContainer.appendChild(deleteTitle);
    
    // Create delete button (hidden)
    this.deleteCircleBtn = document.createElement('button');
    this.deleteCircleBtn.id = 'delete-circle-btn';
    this.deleteCircleBtn.className = 'action-btn';
    this.deleteCircleBtn.innerHTML = '🗑️'; // Trash emoji
    this.deleteCircleBtn.style.display = 'none'; // Hide the button
    this.deleteCircleBtn.title = "Delete Circle";
    
    // Create delete value display (clickable)
    var deleteValueDisplay = document.createElement('div');
    deleteValueDisplay.className = 'current-value delete-value clickable';
    deleteValueDisplay.textContent = 'Delete';
    deleteValueDisplay.style.display = 'none'; // Initially hidden
    deleteValueDisplay.style.cursor = 'pointer';
    deleteValueDisplay.title = "Delete Circle";
    
    // Style the delete button to look more button-like, with a trash icon
    deleteValueDisplay.style.padding = '2px';
    deleteValueDisplay.style.borderRadius = '4px';
    deleteValueDisplay.style.backgroundColor = 'rgba(180, 60, 60, 0.8)';
    deleteValueDisplay.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    deleteValueDisplay.style.transition = 'all 0.2s ease';
    deleteValueDisplay.innerHTML = '🗑️ Delete';
    
    // Add hover effect for delete button
    deleteValueDisplay.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(220, 80, 80, 0.8)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    deleteValueDisplay.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(180, 60, 60, 0.8)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    // Store reference to delete value display
    this.deleteValueDisplay = deleteValueDisplay;
    
    // Add to container
    deleteBtnContainer.appendChild(this.deleteCircleBtn);
    deleteBtnContainer.appendChild(deleteValueDisplay);
    
    // Add to button container
    buttonContainer.appendChild(deleteBtnContainer);
    
    // Add click handler for delete value display
    var self = this;
    deleteValueDisplay.addEventListener('click', function(e) {
      e.stopPropagation();
      if (ChakraApp.appState.selectedCircleId) {
        self._showDeleteDialog(function() {
          ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
        });
      }
    });
    
    // Add click handler for delete button
    this.deleteCircleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (ChakraApp.appState.selectedCircleId) {
        self._showDeleteDialog(function() {
          ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
        });
      }
    });
  };
  
  /**
   * Show the characteristic picker
   * @private
   * @param {string} key - Characteristic key
   * @param {HTMLElement} buttonOrDisplay - Button or display element that triggered this
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
      picker = this._createCharacteristicPicker(key);
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
    
    if (leftPos + pickerWidth > viewportWidth) {
      leftPos = Math.max(10, viewportWidth - pickerWidth - 10);
    }
    if (topPos + pickerHeight > viewportHeight) {
      topPos = Math.max(10, viewportHeight - pickerHeight - 10);
    }
    
    picker.style.left = leftPos + 'px';
    picker.style.top = topPos + 'px';
    
    // Highlight the currently selected value
    var currentValue = null;
    
    // Get current value based on characteristic key
    if (key === 'color') {
      currentValue = circle.color;
    } else if (key === 'element') {
      currentValue = circle.element;
    } else if (circle.characteristics && circle.characteristics[key] !== undefined) {
      currentValue = circle.characteristics[key];
    }
    
    // Highlight appropriate option
    var allOptions = picker.querySelectorAll('.characteristic-option');
    
    // First, remove any previous selection
    allOptions.forEach(function(option) {
      option.classList.remove('selected');
    });
    
    if (currentValue) {
      var selectedItem = picker.querySelector('.characteristic-option[data-value="' + currentValue + '"]');
      if (selectedItem) {
        selectedItem.classList.add('selected');
      }
    } else {
      // If no value, highlight the "No X" option
      var noValueOption = picker.querySelector('.characteristic-option.no-value');
      if (noValueOption) {
        noValueOption.classList.add('selected');
      }
    }
  };
  
  /**
   * Show delete dialog
   * @private
   * @param {Function} onConfirm - Callback for confirmation
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
        self._updateValueDisplays(circle);
      }
    );
    
    // Subscribe to circle update events to refresh displays
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
      }
    );
  };
  
  /**
   * Toggle action buttons visibility
   * @private
   * @param {boolean} show - Whether to show or hide buttons
   */
  ChakraApp.CharacteristicController.prototype._toggleActionButtons = function(show) {
    // Show/hide all characteristic value displays
    var characteristics = ChakraApp.Config.characteristics;
    var self = this;
    
    Object.keys(characteristics).forEach(function(key) {
      var display = self.characteristicValueDisplays[key];
      
      // Show/hide the value display (not the button)
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
   * @param {Object} circle - Circle model
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
          switch (charDef.valueDisplayStyle.type) {
            case 'swatch':
              // For color, show swatch and crystal name
              var html = charDef.valueDisplayStyle.template
                .replace('{VALUE}', value)
                .replace('{DISPLAY}', option.display);
              displayEl.innerHTML = html;
              break;
              
            case 'emoji':
              // For element, show emoji and name
              if (option.visualStyle && option.visualStyle.emoji) {
                var html = charDef.valueDisplayStyle.template
                  .replace('{EMOJI}', option.visualStyle.emoji)
                  .replace('{DISPLAY}', option.display);
                displayEl.innerHTML = html;
              } else {
                displayEl.textContent = option.display;
              }
              break;
              
            case 'number':
              // For identity, show number and name
              if (option.visualStyle && option.visualStyle.number) {
                var html = charDef.valueDisplayStyle.template
                  .replace('{NUMBER}', option.visualStyle.number)
                  .replace('{DISPLAY}', option.display);
                displayEl.innerHTML = html;
              } else {
                displayEl.textContent = option.display;
              }
              break;
              
            default:
              // Default to just showing the display value
              displayEl.textContent = option.display;
          }
        } else {
          displayEl.textContent = value;
        }
      } else {
        displayEl.textContent = 'None';
      }
      
      displayEl.style.display = '';
    });
  };

  /**
   * Create a characteristic picker
   * @private
   * @param {string} key - Characteristic key
   * @returns {HTMLElement} Created picker
   */
  ChakraApp.CharacteristicController.prototype._createCharacteristicPicker = function(key) {
    var charDef = ChakraApp.Config.characteristics[key];
    if (!charDef) return null;
    
    // Create picker based on type
    if (key === 'color') {
      return this._createColorPicker();
    } else if (key === 'element') {
      return this._createElementPicker();
    } else {
      return this._createGenericPicker(key, charDef);
    }
  };
  
  /**
   * Create a color picker
   * @private
   * @returns {HTMLElement} Created color picker
   */
  ChakraApp.CharacteristicController.prototype._createColorPicker = function() {
    // Create color picker container
    var colorPicker = document.createElement('div');
    colorPicker.id = 'color-picker';
    colorPicker.className = 'color-picker-modal';
    
    // Create close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'color-picker-close';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      colorPicker.style.display = 'none';
    });
    colorPicker.appendChild(closeBtn);
    
    // Optional header
    var header = document.createElement('div');
    header.className = 'color-picker-header';
    header.textContent = 'Crystal Colors';
    colorPicker.appendChild(header);
    
    // Create color picker content
    var colorPickerContent = document.createElement('div');
    colorPickerContent.className = 'color-picker-content';
    
    // Set up color families with crystal names - 12 in each column
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
    
    // Create grid for two column layout - directly use the two color families as columns
    var colorGrid = document.createElement('div');
    colorGrid.className = 'color-grid';
    
    // Process each color family
    var self = this;
    colorFamilies.forEach(function(family) {
      // Create family container
      var familyContainer = document.createElement('div');
      familyContainer.className = 'color-family';
      familyContainer.style.backgroundColor = family.bg;
      
      // Create family label
      var familyLabel = document.createElement('div');
      familyLabel.className = 'family-name';
      familyLabel.textContent = family.name;
      familyContainer.appendChild(familyLabel);
      
      // Create color swatches container
      var swatchesContainer = document.createElement('div');
      swatchesContainer.className = 'swatches-container';
      
      // Add color options with crystal names on the left
      family.colors.forEach(function(item) {
        var colorOption = document.createElement('div');
        colorOption.className = 'color-option characteristic-option';
        colorOption.dataset.value = item.color;
        colorOption.dataset.characteristic = 'color';
        
        // Create crystal name label (left)
        var crystalLabel = document.createElement('div');
        crystalLabel.className = 'crystal-name';
        crystalLabel.textContent = item.crystal;
        
        // Create color swatch (right)
        var swatch = document.createElement('div');
        swatch.className = 'color-picker-swatch';
        swatch.style.backgroundColor = item.color;
        swatch.dataset.color = item.color;
        swatch.title = item.crystal + ': ' + item.color;
        
        // Add click event to apply color
        colorOption.addEventListener('click', function(e) {
          e.stopPropagation();
          
          if (ChakraApp.appState.selectedCircleId) {
            var selectedColor = item.color;
            
            // Update the circle data
            ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
              color: selectedColor,
              crystal: item.crystal // Store the crystal name with the circle
            });
            
            // Update the color value display
            var colorValueDisplay = self.characteristicValueDisplays['color'];
            if (colorValueDisplay) {
              var html = '<span class="color-value-swatch" style="background-color: ' + 
                selectedColor + '"></span><span>' + item.crystal + '</span>';
              colorValueDisplay.innerHTML = html;
            }
            
            // Close color picker
            colorPicker.style.display = 'none';
          }
        });
        
        // Add elements to color option
        colorOption.appendChild(crystalLabel);
        colorOption.appendChild(swatch);
        swatchesContainer.appendChild(colorOption);
      });
      
      familyContainer.appendChild(swatchesContainer);
      colorGrid.appendChild(familyContainer);
    });
    
    colorPickerContent.appendChild(colorGrid);
    colorPicker.appendChild(colorPickerContent);
    document.body.appendChild(colorPicker);
    
    // Hide color picker when clicking outside
    document.addEventListener('click', function(e) {
      if (colorPicker.style.display === 'block' && 
          !colorPicker.contains(e.target) && 
          e.target.id !== 'color-change-btn') {
        colorPicker.style.display = 'none';
      }
    });
    
    return colorPicker;
  };
  
  /**
   * Create an element picker
   * @private
   * @returns {HTMLElement} Created element picker
   */
  ChakraApp.CharacteristicController.prototype._createElementPicker = function() {
    // Create element picker container
    var elementPicker = document.createElement('div');
    elementPicker.id = 'element-picker';
    elementPicker.className = 'element-picker-modal';
    
    // Create close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'element-picker-close';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      elementPicker.style.display = 'none';
    });
    elementPicker.appendChild(closeBtn);
    
    // Header
    var header = document.createElement('div');
    header.className = 'element-picker-header';
    header.textContent = 'Select Element';
    elementPicker.appendChild(header);
    
    // Create element picker content
    var elementPickerContent = document.createElement('div');
    elementPickerContent.className = 'element-picker-content';
    
    // Get elements from config
    var elements = ChakraApp.Config.elements;
    
    // Create element grid
    var elementGrid = document.createElement('div');
    elementGrid.className = 'element-grid';
    
    // Add a "No Element" option first
    var noElementOption = document.createElement('div');
    noElementOption.className = 'element-option no-element characteristic-option';
    noElementOption.dataset.element = '';
    noElementOption.dataset.value = '';
    noElementOption.dataset.characteristic = 'element';
    noElementOption.style.backgroundColor = '#333';
    
    // Create symbol for No Element
    var noElementSymbol = document.createElement('span');
    noElementSymbol.className = 'element-emoji';
    noElementSymbol.textContent = '∅'; // Empty set symbol
    noElementOption.appendChild(noElementSymbol);
    
    // Create name
    var noElementName = document.createElement('div');
    noElementName.className = 'element-name';
    noElementName.textContent = 'No Element';
    noElementOption.appendChild(noElementName);
    
    // Create description
    var noElementDesc = document.createElement('div');
    noElementDesc.className = 'element-desc';
    noElementDesc.textContent = 'Clear element assignment';
    noElementOption.appendChild(noElementDesc);
    
    // Add click event to clear element
    var self = this;
    noElementOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (ChakraApp.appState.selectedCircleId) {
        // Update the circle data to remove element
        ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
          element: null
        });
        
        // Remove selected class from all elements
        var allOptions = elementPicker.querySelectorAll('.element-option');
        allOptions.forEach(function(option) {
          option.classList.remove('selected');
        });
        
        // Add selected class to this element
        this.classList.add('selected');
        
        // Update value display
        var elementValueDisplay = self.characteristicValueDisplays['element'];
        if (elementValueDisplay) {
          elementValueDisplay.textContent = 'None';
        }
        
        // Close element picker
        elementPicker.style.display = 'none';
      }
    });
    
    elementGrid.appendChild(noElementOption);
    
    // Process each element
    for (var key in elements) {
      if (elements.hasOwnProperty(key)) {
        var element = elements[key];
        
        // Create element option
        var elementOption = document.createElement('div');
        elementOption.className = 'element-option characteristic-option';
        elementOption.dataset.element = key;
        elementOption.dataset.value = key;
        elementOption.dataset.characteristic = 'element';
        elementOption.style.backgroundColor = element.color;
        
        // Create emoji
        var emojiSpan = document.createElement('span');
        emojiSpan.className = 'element-emoji';
        emojiSpan.textContent = element.emoji;
        elementOption.appendChild(emojiSpan);
        
        // Create name
        var nameDiv = document.createElement('div');
        nameDiv.className = 'element-name';
        nameDiv.textContent = element.displayName;
        elementOption.appendChild(nameDiv);
        
        // Create description
        var descDiv = document.createElement('div');
        descDiv.className = 'element-desc';
        descDiv.textContent = element.description;
        elementOption.appendChild(descDiv);
        
        // Add click event to apply element
        elementOption.addEventListener('click', function(e) {
          e.stopPropagation();
          
          if (ChakraApp.appState.selectedCircleId) {
            var selectedElement = this.dataset.element;
            
            // Update the circle data
            ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
              element: selectedElement
            });
            
            // Remove selected class from all elements
            var allOptions = elementPicker.querySelectorAll('.element-option');
            allOptions.forEach(function(option) {
              option.classList.remove('selected');
            });
            
            // Add selected class to this element
            this.classList.add('selected');
            
            // Update element value display
            var elementValueDisplay = self.characteristicValueDisplays['element'];
            if (elementValueDisplay) {
              var selectedElementDef = elements[selectedElement];
              if (selectedElementDef) {
                var html = selectedElementDef.emoji + ' ' + selectedElementDef.displayName;
                elementValueDisplay.innerHTML = html;
              } else {
                elementValueDisplay.textContent = selectedElement;
              }
            }
            
            // Close element picker
            elementPicker.style.display = 'none';
          }
        });
        
        elementGrid.appendChild(elementOption);
      }
    }
    
    elementPickerContent.appendChild(elementGrid);
    elementPicker.appendChild(elementPickerContent);
    document.body.appendChild(elementPicker);
    
    // Hide element picker when clicking outside
    document.addEventListener('click', function(e) {
      if (elementPicker.style.display === 'block' && 
          !elementPicker.contains(e.target) && 
          e.target.id !== 'element-change-btn') {
        elementPicker.style.display = 'none';
      }
    });
    
    return elementPicker;
  };
  
  /**
   * Create a generic characteristic picker
   * @private
   * @param {string} key - Characteristic key
   * @param {Object} charDef - Characteristic definition
   * @returns {HTMLElement} Created picker
   */
  ChakraApp.CharacteristicController.prototype._createGenericPicker = function(key, charDef) {
    // Create picker container
    var picker = document.createElement('div');
    picker.id = key + '-picker';
    picker.className = 'characteristic-picker-modal';
    
    // Create close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'characteristic-picker-close';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      picker.style.display = 'none';
    });
    picker.appendChild(closeBtn);
    
    // Header
    var header = document.createElement('div');
    header.className = 'characteristic-picker-header';
    header.textContent = charDef.modalTitle;
    picker.appendChild(header);
    
    // Create picker content
    var pickerContent = document.createElement('div');
    pickerContent.className = 'characteristic-picker-content';
    
    // Main grid to hold categories
    var mainGrid = document.createElement('div');
    mainGrid.className = 'characteristic-grid';
    
    // Add a "No Value" option first
    var noValueOption = document.createElement('div');
    noValueOption.className = 'characteristic-option no-value';
    noValueOption.dataset.value = '';
    noValueOption.dataset.characteristic = key;
    noValueOption.style.backgroundColor = '#333';
    
    // Create symbol for No Value
    var noValueSymbol = document.createElement('span');
    noValueSymbol.className = 'characteristic-emoji';
    noValueSymbol.textContent = '∅'; // Empty set symbol
    noValueOption.appendChild(noValueSymbol);
    
    // Create name
    var noValueName = document.createElement('div');
    noValueName.className = 'characteristic-name';
    noValueName.textContent = 'No ' + charDef.displayName;
    noValueOption.appendChild(noValueName);
    
    // Create description
    var noValueDesc = document.createElement('div');
    noValueDesc.className = 'characteristic-desc';
    noValueDesc.textContent = 'Clear ' + charDef.displayName.toLowerCase();
    noValueOption.appendChild(noValueDesc);
    
    // Add click event to clear characteristic
    var self = this;
    noValueOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
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
        viewModel.updateCharacteristic(key, null);
        
        // Remove selected class from all options
        var allOptions = picker.querySelectorAll('.characteristic-option');
        allOptions.forEach(function(option) {
          option.classList.remove('selected');
        });
        
        // Add selected class to this option
        this.classList.add('selected');
        
        // Update value display
        var valueDisplay = self.characteristicValueDisplays[key];
        if (valueDisplay) {
          valueDisplay.textContent = 'None';
        }
        
        // Close picker
        picker.style.display = 'none';
      }
    });
    
    var optionsContainer = document.createElement('div');
    optionsContainer.className = 'characteristic-options-container';
    optionsContainer.appendChild(noValueOption);
    mainGrid.appendChild(optionsContainer);
    
    // Process each category
    charDef.categories.forEach(function(category) {
      var optionsContainer = document.createElement('div');
      optionsContainer.className = 'characteristic-options-container';
      
      // Add category heading if it has a name
      if (category.name) {
        var categoryHeading = document.createElement('div');
        categoryHeading.className = 'category-heading';
        categoryHeading.textContent = category.name;
        optionsContainer.appendChild(categoryHeading);
      }
      
      // Add each option
      category.options.forEach(function(option) {
        var charOption = document.createElement('div');
        charOption.className = 'characteristic-option';
        charOption.dataset.value = option.value;
        charOption.dataset.characteristic = key;
        
        if (option.visualStyle && option.visualStyle.color) {
          charOption.style.backgroundColor = option.visualStyle.color;
        }
        
        // Add appropriate elements based on characteristic type
        if (key === 'identity') {
          // Number display for identity
          var numberDiv = document.createElement('div');
          numberDiv.className = 'identity-number';
          numberDiv.textContent = option.visualStyle.number;
          charOption.appendChild(numberDiv);
        }
        
        // Add emoji if available
        if (option.visualStyle && option.visualStyle.emoji) {
          var emojiSpan = document.createElement('span');
          emojiSpan.className = 'characteristic-emoji';
          emojiSpan.textContent = option.visualStyle.emoji;
          charOption.appendChild(emojiSpan);
        }
        
        // Create name
        var nameDiv = document.createElement('div');
        nameDiv.className = 'characteristic-name';
        nameDiv.textContent = option.display;
        charOption.appendChild(nameDiv);
        
        // Create description if available
        if (option.secondary) {
          var descDiv = document.createElement('div');
          descDiv.className = 'characteristic-desc';
          descDiv.textContent = option.secondary;
          charOption.appendChild(descDiv);
        }
        
        optionsContainer.appendChild(charOption);
      });
      
      mainGrid.appendChild(optionsContainer);
    });
    
    pickerContent.appendChild(mainGrid);
    picker.appendChild(pickerContent);
    document.body.appendChild(picker);
    
    // Add click handlers to all options
    var self = this;
    var allOptions = picker.querySelectorAll('.characteristic-option:not(.no-value)');
    allOptions.forEach(function(option) {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (ChakraApp.appState.selectedCircleId) {
          var characteristic = this.dataset.characteristic;
          var value = this.dataset.value;
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
          viewModel.updateCharacteristic(characteristic, value);
          
          // Remove selected class from all options
          var allOptions = picker.querySelectorAll('.characteristic-option');
          allOptions.forEach(function(opt) {
            opt.classList.remove('selected');
          });
          
          // Add selected class to this option
          this.classList.add('selected');
          
          // Close picker
          picker.style.display = 'none';
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
