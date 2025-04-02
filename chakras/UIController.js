// src/controllers/UIController.js
// Handles UI-related functionality

(function(ChakraApp) {
  /**
   * UI controller for handling UI elements and interactions
   */
  ChakraApp.UIController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.topPanel = null;
    this.chakraTitle = null;
    this.addCircleBtn = null;
    this.colorChangeBtn = null;
    this.deleteCircleBtn = null;
    this.attributeGrid = null;
    this.dialogOverlay = null;
  };
  
  // Inherit from BaseController
  ChakraApp.UIController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.UIController.prototype.constructor = ChakraApp.UIController;
  
  // Initialize
  ChakraApp.UIController.prototype.init = function() {
	  // Call parent init
	  ChakraApp.BaseController.prototype.init.call(this);

	  // Get DOM elements
	  this.topPanel = document.getElementById('top-panel');
	  this.addCircleBtn = document.getElementById('add-circle-btn');
	  this.attributeGrid = document.getElementById('attribute-grid');
	  this.dialogOverlay = document.getElementById('dialog-overlay');

	  // Create chakra title element if it doesn't exist
	  this._createChakraTitle();

	  // Create action buttons if they don't exist
	  this._createActionButtons();

	  // Initialize meridian line
	  this._createMeridianLine();

	  // Set up button handlers
	  this._setupButtonHandlers();

	  // Set up attribute box click handlers
	  this._setupAttributeBoxHandlers();

	  // Set up panel click handlers for deselection
	  this._setupPanelClickHandlers();

	  // Create attribute grid if needed
	  this._createAttributeGrid();

	  // Subscribe to circle selection events
	  var self = this;
	  this.circleSelectedSubscription = ChakraApp.EventBus.subscribe(
			  ChakraApp.EventTypes.CIRCLE_SELECTED,
			  function(circle) {
				  self._updateChakraTitle(circle.name);
				  self._toggleActionButtons(true);
				  self._updateValueDisplays(circle); // Add this line
				  self._toggleAttributeGrid(true);
			  }
			  );

	  // Subscribe to circle update events to refresh displays
	  this.circleUpdatedSubscription = ChakraApp.EventBus.subscribe(
			  ChakraApp.EventTypes.CIRCLE_UPDATED,
			  function(circle) {
				  if (circle.id === ChakraApp.appState.selectedCircleId) {
					  self._updateChakraTitle(circle.name);
					  self._updateValueDisplays(circle);
				  }
			  }
			  );

	  // Subscribe to circle deselection events
	  this.circleDeselectedSubscription = ChakraApp.EventBus.subscribe(
			  ChakraApp.EventTypes.CIRCLE_DESELECTED,
			  function() {
				  self._updateChakraTitle(null);
				  self._toggleActionButtons(false);
				  self._toggleAttributeGrid(false);
			  }
			  );

	  // Subscribe to panel visibility changes
	  this.panelVisibilitySubscription = ChakraApp.EventBus.subscribe(
			  ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED,
			  function(visible) {
				  self._toggleRightPanelVisibility(visible);
			  }
			  );
  }; 

  
  ChakraApp.UIController.prototype._showElementPicker = function(button) {
	  // Get the current circle
	  var circleId = ChakraApp.appState.selectedCircleId;
	  var circle = ChakraApp.appState.getCircle(circleId);

	  if (!circle) return;

	  // Create element picker if it doesn't exist
	  var elementPicker = document.getElementById('element-picker');
	  if (!elementPicker) {
		  elementPicker = this._createElementPicker();
	  }

	  // Show the element picker
	  elementPicker.style.display = 'block';

	  // Position the element picker near the button
	  var btnRect = button.getBoundingClientRect();

	  // Position below the button
	  var leftPos = btnRect.left;
	  var topPos = btnRect.bottom + 10; // Position below with some offset

	  // Make sure it stays within the viewport
	  var viewportWidth = window.innerWidth;
	  var viewportHeight = window.innerHeight;
	  var pickerWidth = 280; // Should match the width in CSS
	  var pickerHeight = Math.min(380, viewportHeight * 0.7); // Approximate max height

	  // Adjust if would go off-screen to the right
	  if (leftPos + pickerWidth > viewportWidth) {
		  leftPos = Math.max(10, viewportWidth - pickerWidth - 10);
	  }

	  // Adjust if would go off-screen at the bottom
	  if (topPos + pickerHeight > viewportHeight) {
		  topPos = Math.max(10, viewportHeight - pickerHeight - 10);
	  }

	  // Apply the calculated position
	  elementPicker.style.left = leftPos + 'px';
	  elementPicker.style.top = topPos + 'px';

	  // Highlight the currently selected element
	  if (circle.element) {
		  var selectedItem = elementPicker.querySelector('.element-option[data-element="' + circle.element + '"]');
		  if (selectedItem) {
			  selectedItem.classList.add('selected');
		  }
	  } else {
		  // If no element is selected, highlight the "No Element" option
		  var noElementOption = elementPicker.querySelector('.element-option.no-element');
		  if (noElementOption) {
			  noElementOption.classList.add('selected');
		  }
	  }
  };

  ChakraApp.UIController.prototype._createCharacteristicPicker = function(key) {
	  var charDef = ChakraApp.Config.characteristics[key];
	  if (!charDef) return null;

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

	  // Use appropriate class based on characteristic type
	  if (key === 'color') {
		  mainGrid.className = 'color-grid';
	  } else {
		  mainGrid.className = 'characteristic-grid';
	  }

	  // Add a "No Value" option first if not color (color has its own categories)
	  if (key !== 'color') {
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
	  }

	  // Process each category
	  charDef.categories.forEach(function(category) {
		  var categoryContainer;

		  if (key === 'color') {
			  // For color, create a color family container
			  categoryContainer = document.createElement('div');
			  categoryContainer.className = 'color-family';
			  if (category.bg) {
				  categoryContainer.style.backgroundColor = category.bg;
			  }

			  // Create family label if name exists
			  if (category.name) {
				  var familyLabel = document.createElement('div');
				  familyLabel.className = 'family-name';
				  familyLabel.textContent = category.name;
				  categoryContainer.appendChild(familyLabel);
			  }

			  // Create color swatches container
			  var swatchesContainer = document.createElement('div');
			  swatchesContainer.className = 'swatches-container';
			  categoryContainer.appendChild(swatchesContainer);

			  // Add each option
			  category.options.forEach(function(option) {
				  var colorOption = document.createElement('div');
				  colorOption.className = 'color-option characteristic-option';
				  colorOption.dataset.value = option.value;
				  colorOption.dataset.characteristic = key;

				  // Create crystal name label (left)
				  var crystalLabel = document.createElement('div');
				  crystalLabel.className = 'crystal-name';
				  crystalLabel.textContent = option.display;

				  // Create color swatch (right)
				  var swatch = document.createElement('div');
				  swatch.className = 'color-picker-swatch';
				  swatch.style.backgroundColor = option.value;
				  swatch.title = option.display;

				  // Add elements to color option
				  colorOption.appendChild(crystalLabel);
				  colorOption.appendChild(swatch);
				  swatchesContainer.appendChild(colorOption);
			  });

			  mainGrid.appendChild(categoryContainer);
		  } else {
			  // For other characteristics, create a simple option
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
		  }
	  });

	  pickerContent.appendChild(mainGrid);
	  picker.appendChild(pickerContent);
	  document.body.appendChild(picker);

	  // Add click handlers to all options
	  var self = this;
	  var allOptions = picker.querySelectorAll('.characteristic-option');
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

  // Add method to show characteristic picker
  ChakraApp.UIController.prototype._showCharacteristicPicker = function(key, buttonOrDisplay) {
  // Get the characteristic definition
  var charDef = ChakraApp.Config.characteristics[key];
  if (!charDef) return;

  // Get the current circle
  var circleId = ChakraApp.appState.selectedCircleId;
  var circle = ChakraApp.appState.getCircle(circleId);
  if (!circle) return;

  // Create picker if it doesn't exist
  var picker = document.getElementById(key + '-picker');
  if (!picker) {
    picker = this._createCharacteristicPicker(key);
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

  // Add this method to create the element picker
  ChakraApp.UIController.prototype._createElementPicker = function() {
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
	  noElementOption.className = 'element-option no-element';
	  noElementOption.dataset.element = '';
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
			  if (self.elementValueDisplay) {
				  self.elementValueDisplay.textContent = 'None';
			  }

			  // Close element picker
			  elementPicker.style.display = 'none';
		  }
	  });

	  elementGrid.appendChild(noElementOption);

	  // Process each element
	  var self = this;
	  for (var key in elements) {
		  if (elements.hasOwnProperty(key)) {
			  var element = elements[key];

			  // Create element option
			  var elementOption = document.createElement('div');
			  elementOption.className = 'element-option';
			  elementOption.dataset.element = key;
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

  // Create chakra title element
  ChakraApp.UIController.prototype._createChakraTitle = function() {
    // Create title container if it doesn't exist
    if (!document.getElementById('chakra-title')) {
      this.chakraTitle = document.createElement('div');
      this.chakraTitle.id = 'chakra-title';
      this.chakraTitle.className = 'chakra-title';
      this.chakraTitle.textContent = 'No Chakra Selected';
      
      // Add to top panel
      this.topPanel.insertBefore(this.chakraTitle, this.topPanel.firstChild);
    } else {
      this.chakraTitle = document.getElementById('chakra-title');
    }
  };

  ChakraApp.UIController.prototype._updateValueDisplays = function(circle) {
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
  
  // Create and add the action buttons
  ChakraApp.UIController.prototype._createActionButtons = function() {
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

  // Add click handler for delete button
  this.deleteCircleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (ChakraApp.appState.selectedCircleId) {
      self._showDeleteDialog(function() {
        ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
      });
    }
  });
  
  // Add click handler for delete value display
  deleteValueDisplay.addEventListener('click', function(e) {
    e.stopPropagation();
    if (ChakraApp.appState.selectedCircleId) {
      self._showDeleteDialog(function() {
        ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
      });
    }
  });
};
  
  // Create meridian line
  ChakraApp.UIController.prototype._createMeridianLine = function() {
    // Create meridian line if it doesn't exist
    if (!document.getElementById('meridian-line')) {
      var zoomContainer = document.getElementById('zoom-container');
      var meridianLine = document.createElement('div');
      meridianLine.id = 'meridian-line';
      meridianLine.style.position = 'absolute';
      meridianLine.style.top = '0';
      meridianLine.style.left = ChakraApp.Config.meridian.x + 'px';
      meridianLine.style.width = '1px';
      meridianLine.style.height = '100%';
      meridianLine.style.backgroundColor = ChakraApp.Config.meridian.lineColor;
      meridianLine.style.zIndex = '2';
      meridianLine.style.pointerEvents = 'none';
      
      zoomContainer.appendChild(meridianLine);
    }
  };
  
  // Create attribute grid
ChakraApp.UIController.prototype._createAttributeGrid = function() {
	// Create grid if it doesn't exist or is empty
	if (this.attributeGrid && this.attributeGrid.children.length === 0) {
		// Define the order for attributes to control their placement
		// Updated to include the new chain button in the demon/sword group
		var attributeOrder = ['treasure', 'door', 'key', 'demon', 'sword', 'chain', 'ally', 
		    //'push', 'stop'
			    ];

		// Loop through each attribute in the specified order
		for (var i = 0; i < attributeOrder.length; i++) {
			var key = attributeOrder[i];
			var attr = ChakraApp.Config.attributeInfo[key];

			// Create the attribute box
			var attrBox = document.createElement('div');
			attrBox.id = key + '-box';
			attrBox.className = 'attribute-box create-button';
			attrBox.dataset.attribute = key;

			// Set background color from config
			attrBox.style.backgroundColor = attr.color;

			// Add text color adjustments for better readability
			if (attr.color === '#0000FF' || attr.color === '#663399' || attr.color === '#555555' || attr.color === '#2F4F4F' || attr.color == '#66D6FF') {
				attrBox.style.color = 'white';
				attrBox.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
			}

			// Add text color adjustment for push button (light yellow background)
			if (key === 'push') {
				attrBox.style.color = 'black';
				attrBox.style.textShadow = '0 0 3px rgba(255, 255, 255, 0.5)';
			}

			// Add text color adjustment for stop button (light yellow background)
			if (key === 'stop') {
				attrBox.style.color = 'white';
			}

			// Create display name element (at the top)
			var nameDiv = document.createElement('div');
			nameDiv.className = 'attribute-name';
			nameDiv.textContent = attr.displayName;

			// Create emoji element (in the middle)
			var emojiDiv = document.createElement('div');
			emojiDiv.className = 'emoji';
			emojiDiv.textContent = attr.emoji;

			// Create description element (at the bottom)
			var descDiv = document.createElement('div');
			descDiv.className = 'attribute-desc';
			descDiv.textContent = attr.description;

			// Append children to the attribute box
			attrBox.appendChild(nameDiv);
			attrBox.appendChild(emojiDiv);
			attrBox.appendChild(descDiv);

			// Add to grid
			this.attributeGrid.appendChild(attrBox);
		}

		// Add CSS to style the grid layout 
		var style = document.createElement('style');
		style.textContent = `
			/* Update attribute grid layout to include the new buttons */
#attribute-grid {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	padding: 10px;
		 gap: 8px;
		      width: auto;
			     max-width: 800px;
			     justify-content: left;
}

/* Add spacing between categories */
.attribute-box[data-attribute="key"] {
	margin-right: 15px; /* Add space after Tools (key) */
}

.attribute-box[data-attribute="chain"] {
	margin-right: 15px; /* Add space after Chains */
}

.attribute-box[data-attribute="ally"] {
	margin-right: 15px; /* Add space after Allies */
}

.attribute-box[data-attribute="stop"] {
	margin-right: 15px; /* Add space after Stops */
}

/* Style adjustments for specific buttons */
.attribute-box[data-attribute="push"] {
	border: 1px solid rgba(0, 0, 0, 0.1);
}

.attribute-box[data-attribute="stop"] {
	border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Style adjustments for the Chains button */
.attribute-box[data-attribute="chain"] {
	border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Style the Demon-Sword-Chain trio as a group */
.attribute-box[data-attribute="demon"],
	.attribute-box[data-attribute="sword"],
	.attribute-box[data-attribute="chain"] {
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
	}
`;
document.head.appendChild(style);
}
};
  
  // Setup button handlers
  ChakraApp.UIController.prototype._setupButtonHandlers = function() {
	  var self = this;

	  // Add circle button
	  if (this.addCircleBtn) {
		  this.addCircleBtn.addEventListener('click', function(e) {
			  e.stopPropagation();

			  // Deselect current items
			  if (ChakraApp.appState.selectedCircleId) {
				  ChakraApp.appState.deselectCircle();
			  }

			  // Create a new circle at a random position near the center
			  var leftPanel = document.getElementById('left-panel');
			  var panelRect = leftPanel.getBoundingClientRect();
			  var centerX = panelRect.width / 2;
			  var centerY = panelRect.height / 2;

			  // Random position within ±100px of center
			  var randomX = Math.max(50, Math.min(panelRect.width - 100, centerX + (Math.random() * 200 - 100)));
			  var randomY = Math.max(50, Math.min(panelRect.height - 100, centerY + (Math.random() * 200 - 100)));

			  // Create circle
			  var circleData = {
				  x: randomX,
				  y: randomY,
				  color: ChakraApp.Config.predefinedColors[0],
				  name: ChakraApp.Config.defaultName
			  };

			  var circle = ChakraApp.appState.addCircle(circleData);

			  // Select the new circle
			  ChakraApp.appState.selectCircle(circle.id);
		  });
	  }

	  // Color change button
	  if (this.colorChangeBtn) {
		  this.colorChangeBtn.addEventListener('click', function(e) {
			  e.stopPropagation();

			  if (ChakraApp.appState.selectedCircleId) {
				  // Show color picker
				  self._showColorPicker(this);
			  }
		  });
	  }

	  // Element change button
	  if (this.elementChangeBtn) {
		  this.elementChangeBtn.addEventListener('click', function(e) {
			  e.stopPropagation();

			  if (ChakraApp.appState.selectedCircleId) {
				  // Show element picker
				  self._showElementPicker(this);
			  }
		  });
	  }

	  // Delete circle button
	  if (this.deleteCircleBtn) {
		  this.deleteCircleBtn.addEventListener('click', function(e) {
			  e.stopPropagation();

			  if (ChakraApp.appState.selectedCircleId) {
				  self._showDeleteDialog(function() {
					  ChakraApp.appState.removeCircle(ChakraApp.appState.selectedCircleId);
				  });
			  }
		  });
	  }
  };
  
  // Setup attribute box click handlers
ChakraApp.UIController.prototype._setupAttributeBoxHandlers = function() {
	var self = this;

	// Find all attribute boxes
	var attributeBoxes = document.querySelectorAll('.attribute-box');

	attributeBoxes.forEach(function(box) {
		// Remove any existing event listeners first to avoid duplicates
		var newBox = box.cloneNode(true);
		box.parentNode.replaceChild(newBox, box);

		newBox.addEventListener('click', function() {
			// Only create square if a circle is selected
			if (!ChakraApp.appState.selectedCircleId) return;

			// Get the attribute type
			var attributeType = this.dataset.attribute;

			// Create a square at a random position
			var bottomPanel = document.getElementById('bottom-panel');
			var panelRect = bottomPanel.getBoundingClientRect();
			var centerX = panelRect.width / 2;
			var centerY = panelRect.height / 2;

			// Random position within ±100px of center
			var randomX = Math.max(50, Math.min(panelRect.width - 100, centerX + (Math.random() * 200 - 100)));
			var randomY = Math.max(50, Math.min(panelRect.height - 100, centerY + (Math.random() * 200 - 100)));

			// Get attribute data
			var attributeData = ChakraApp.Config.attributeInfo[attributeType];

			// Create square
			var squareData = {
				circleId: ChakraApp.appState.selectedCircleId,
				x: randomX,
				y: randomY,
				color: attributeData.color,
				name: attributeType, // Set initial name to attribute type
				attribute: attributeType
			};

			var square = ChakraApp.appState.addSquare(squareData);

			// Select the new square
			ChakraApp.appState.selectSquare(square.id);
		});
	});
};
  
// This method needs to be called whenever a circle is selected to ensure the attribute boxes are properly set up
ChakraApp.UIController.prototype._enableAttributeBoxes = function() {
	// Make attribute boxes interactive
	var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box');
	attributeBoxes.forEach(function(box) {
		box.classList.add('interactive');
	});

	// Set up click handlers for attribute boxes
	this._setupAttributeBoxHandlers();
};

  // Setup panel click handlers for deselection
  ChakraApp.UIController.prototype._setupPanelClickHandlers = function() {
    var zoomContainer = document.getElementById('zoom-container');
    var bottomPanel = document.getElementById('bottom-panel');
    
    // Left panel click - deselect circle
    zoomContainer.addEventListener('click', function(e) {
      // Only handle clicks directly on the panel (not on children)
      if (e.target === zoomContainer) {
        if (ChakraApp.appState.selectedCircleId) {
          ChakraApp.appState.deselectCircle();
        }
      }
    });
    
    // Bottom panel click - deselect square
    bottomPanel.addEventListener('click', function(e) {
      // Only handle clicks directly on the panel (not on children)
      if (e.target === bottomPanel) {
        if (ChakraApp.appState.selectedSquareId) {
          ChakraApp.appState.deselectSquare();
        }
      }
    });
  };
  
  // Update chakra title
  ChakraApp.UIController.prototype._updateChakraTitle = function(circleName) {
    if (!this.chakraTitle) return;
    
    if (!circleName || circleName === ChakraApp.Config.defaultName) {
      this.chakraTitle.textContent = 'No Chakra Selected';
      this.chakraTitle.classList.remove('visible');
    } else {
      this.chakraTitle.textContent = circleName;
      this.chakraTitle.classList.add('visible');
    }
  };
  
  // Toggle action buttons visibility
ChakraApp.UIController.prototype._toggleActionButtons = function(show) {
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

  
  // Toggle attribute grid visibility
ChakraApp.UIController.prototype._toggleAttributeGrid = function(show) {
  if (!this.attributeGrid) return;
  
  if (show) {
    this.attributeGrid.classList.add('visible');
    this._enableAttributeBoxes(); // Add this line to enable the attribute boxes
  } else {
    this.attributeGrid.classList.remove('visible');
    
    // Disable attribute boxes
    var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box');
    attributeBoxes.forEach(function(box) {
      box.classList.remove('interactive');
    });
  }
};
  
  // Toggle right panel visibility
  ChakraApp.UIController.prototype._toggleRightPanelVisibility = function(visible) {
    var rightContainer = document.getElementById('right-container');
    var body = document.body;
    
    if (visible) {
      rightContainer.classList.add('visible');
      body.classList.remove('right-panel-hidden');
      body.classList.add('right-panel-visible');
    } else {
      rightContainer.classList.remove('visible');
      body.classList.add('right-panel-hidden');
      body.classList.remove('right-panel-visible');
    }
  };
  
  // Show color picker
  ChakraApp.UIController.prototype._showColorPicker = function(button) {
    // Get the current circle
    var circleId = ChakraApp.appState.selectedCircleId;
    var circle = ChakraApp.appState.getCircle(circleId);
    
    if (!circle) return;
    
    // For this simple example, we'll just cycle through predefined colors
    // In a real implementation, you'd show a proper color picker dialog
    var currentColor = circle.color;
    var colorIndex = ChakraApp.Config.predefinedColors.indexOf(currentColor);
    var nextColorIndex = (colorIndex + 1) % ChakraApp.Config.predefinedColors.length;
    var newColor = ChakraApp.Config.predefinedColors[nextColorIndex];
    
    // Update the circle color
    ChakraApp.appState.updateCircle(circleId, { color: newColor });
  };
  
  // Show delete dialog
  ChakraApp.UIController.prototype._showDeleteDialog = function(onConfirm) {
    if (!this.dialogOverlay) return;
    
    this.dialogOverlay.style.display = 'flex';
    
    var dialogConfirm = document.getElementById('dialog-confirm');
    var dialogCancel = document.getElementById('dialog-cancel');
    
    var confirmHandler = function() {
      onConfirm();
      this.dialogOverlay.style.display = 'none';
      dialogConfirm.removeEventListener('click', confirmHandler);
      dialogCancel.removeEventListener('click', cancelHandler);
      document.removeEventListener('keydown', keyHandler);
    }.bind(this);
    
    var cancelHandler = function() {
      this.dialogOverlay.style.display = 'none';
      dialogConfirm.removeEventListener('click', confirmHandler);
      dialogCancel.removeEventListener('click', cancelHandler);
      document.removeEventListener('keydown', keyHandler);
    }.bind(this);
    
    // Handle keyboard events
    var keyHandler = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmHandler();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelHandler();
      }
    };
    
    // Add event listeners
    dialogConfirm.addEventListener('click', confirmHandler);
    dialogCancel.addEventListener('click', cancelHandler);
    document.addEventListener('keydown', keyHandler);
  };
  
  // Clean up
  ChakraApp.UIController.prototype.destroy = function() {
	  // Call parent destroy
	  ChakraApp.BaseController.prototype.destroy.call(this);

	  // Clean up event subscriptions
	  if (this.circleSelectedSubscription) {
		  this.circleSelectedSubscription();
	  }

	  if (this.circleUpdatedSubscription) {
		  this.circleUpdatedSubscription();
	  }

	  if (this.circleDeselectedSubscription) {
		  this.circleDeselectedSubscription();
	  }

	  if (this.panelVisibilitySubscription) {
		  this.panelVisibilitySubscription();
	  }
  };
  

  ChakraApp.UIController.prototype._showColorPicker = function(button) {
	  // Get the current circle
	  var circleId = ChakraApp.appState.selectedCircleId;
	  var circle = ChakraApp.appState.getCircle(circleId);

	  if (!circle) return;

	  // Create color picker if it doesn't exist
	  var colorPicker = document.getElementById('color-picker');
	  if (!colorPicker) {
		  colorPicker = this._createColorPicker();
	  }

	  // Show the color picker
	  colorPicker.style.display = 'block';

	  // Position the color picker near the button
	  var btnRect = button.getBoundingClientRect();

	  // Position below the button
	  var leftPos = btnRect.left;
	  var topPos = btnRect.bottom + 10; // Position below with some offset

	  // Make sure it stays within the viewport
	  var viewportWidth = window.innerWidth;
	  var viewportHeight = window.innerHeight;
	  var pickerWidth = 280; // Should match the width in CSS
	  var pickerHeight = Math.min(500, viewportHeight * 0.8); // Approximate max height

	  // Adjust if would go off-screen to the right
	  if (leftPos + pickerWidth > viewportWidth) {
		  leftPos = Math.max(10, viewportWidth - pickerWidth - 10);
	  }

	  // Adjust if would go off-screen at the bottom
	  if (topPos + pickerHeight > viewportHeight) {
		  topPos = Math.max(10, viewportHeight - pickerHeight - 10);
	  }

	  // Apply the calculated position
	  colorPicker.style.left = leftPos + 'px';
	  colorPicker.style.top = topPos + 'px';
  };

  // Add this method to create the color picker
  ChakraApp.UIController.prototype._createColorPicker = function() {
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
			colorOption.className = 'color-option';

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
					if (self.colorValueDisplay) {
						var colorSwatch = self.colorValueDisplay.querySelector('.color-value-swatch');
						if (colorSwatch) {
							colorSwatch.style.backgroundColor = selectedColor;
						}

						var colorText = self.colorValueDisplay.querySelector('span:last-child');
						if (colorText) {
							colorText.textContent = item.crystal || 'Custom';
						}
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
})(window.ChakraApp = window.ChakraApp || {});
