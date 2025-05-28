// src/controllers/CharacteristicController.js - REFACTORED
(function(ChakraApp) {

  ChakraApp.CharacteristicController = function() {
    ChakraApp.BaseController.call(this);
    this.initDOMElements();
    this.initEventSubscriptions();
  };
  
  // Static reference to colorFamilies that can be used across methods
  ChakraApp.CharacteristicController.colorFamilies = [
  {
    name: "Red",
    light: { color: '#FFC0CB', crystal: 'Pink' },
    solid: { color: '#FF0000', crystal: 'Red' },
    dark: { color: '#900000', crystal: 'Maroon' }
  },
  {
    name: "Crimson",
    light: { color: '#FFB6C1', crystal: 'Light Pink' },
    solid: { color: '#DC143C', crystal: 'Crimson' },
    dark: { color: '#8B0000', crystal: 'Dark Red' }
  },
  {
    name: "Rose",
    light: { color: '#FFCCCB', crystal: 'Light Rose' },
    solid: { color: '#FF007F', crystal: 'Rose' },
    dark: { color: '#B22222', crystal: 'Fire Brick' }
  },
  {
    name: "Ruby",
    light: { color: '#FFE4E6', crystal: 'Blush' },
    solid: { color: '#E0115F', crystal: 'Ruby' },
    dark: { color: '#722F37', crystal: 'Dark Ruby' }
  },
  {
    name: "Pink",
    light: { color: '#FFE4E1', crystal: 'Misty Rose' },
    solid: { color: '#FF69B4', crystal: 'Hot Pink' },
    dark: { color: '#C71585', crystal: 'Deep Pink' }
  },
  {
    name: "Fuchsia",
    light: { color: '#FFE1FF', crystal: 'Pale Fuchsia' },
    solid: { color: '#FF1493', crystal: 'Fuchsia' },
    dark: { color: '#C41E3A', crystal: 'Cardinal' }
  },
  {
    name: "Salmon",
    light: { color: '#FFF5EE', crystal: 'Seashell' },
    solid: { color: '#FA8072', crystal: 'Salmon' },
    dark: { color: '#CD5C5C', crystal: 'Indian Red' }
  },
  {
    name: "Coral",
    light: { color: '#FFEFD5', crystal: 'Papaya Whip' },
    solid: { color: '#FF7F50', crystal: 'Coral' },
    dark: { color: '#A0522D', crystal: 'Sienna' }
  },
  {
    name: "Orange", 
    light: { color: '#FFAF90', crystal: 'Light Coral' },
    solid: { color: '#FF4500', crystal: 'Vermilion' },
    dark: { color: '#8B4000', crystal: 'Dark Orange' }
  },
  {
    name: "Tangerine",
    light: { color: '#FFE4B5', crystal: 'Moccasin' },
    solid: { color: '#FF8C00', crystal: 'Tangerine' },
    dark: { color: '#B8860B', crystal: 'Dark Goldenrod' }
  },
  {
    name: "Amber",
    light: { color: '#FFF8DC', crystal: 'Cornsilk' },
    solid: { color: '#FFBF00', crystal: 'Amber' },
    dark: { color: '#B8860B', crystal: 'Dark Goldenrod' }
  },
  {
    name: "Brown",
    light: { color: '#DEB887', crystal: 'Tan' },
    solid: { color: '#CD853F', crystal: 'Bronze' },
    dark: { color: '#8B4513', crystal: 'Brown' }
  },
  {
    name: "Rust",
    light: { color: '#DDBF94', crystal: 'Wheat' },
    solid: { color: '#B7410E', crystal: 'Rust' },
    dark: { color: '#8B4513', crystal: 'Saddle Brown' }
  },
  {
    name: "Copper",
    light: { color: '#FFDDAA', crystal: 'Peach Puff' },
    solid: { color: '#B87333', crystal: 'Copper' },
    dark: { color: '#654321', crystal: 'Dark Brown' }
  },
  {
    name: "Yellow",
    light: { color: '#FFF0B6', crystal: 'Marigold' },
    solid: { color: '#FFD700', crystal: 'Gold' },
    dark: { color: '#D8A600', crystal: 'Sunset' }
  },
  {
    name: "Lemon",
    light: { color: '#FFFACD', crystal: 'Lemon Chiffon' },
    solid: { color: '#FFF700', crystal: 'Lemon' },
    dark: { color: '#DAA520', crystal: 'Goldenrod' }
  },
  {
    name: "Khaki",
    light: { color: '#F0E68C', crystal: 'Light Khaki' },
    solid: { color: '#C3B091', crystal: 'Khaki' },
    dark: { color: '#BDB76B', crystal: 'Dark Khaki' }
  },
  {
    name: "Olive",
    light: { color: '#F5F5DC', crystal: 'Beige' },
    solid: { color: '#808000', crystal: 'Olive' },
    dark: { color: '#556B2F', crystal: 'Dark Olive Green' }
  },
  {
    name: "Chartreuse",
    light: { color: '#F0FFF0', crystal: 'Honeydew' },
    solid: { color: '#7FFF00', crystal: 'Chartreuse' },
    dark: { color: '#6B8E23', crystal: 'Olive Drab' }
  },
  {
    name: "Lime",
    light: { color: '#F5FFFA', crystal: 'Mint Cream' },
    solid: { color: '#32CD32', crystal: 'Lime Green' },
    dark: { color: '#228B22', crystal: 'Forest Green' }
  },
  {
    name: "Green",
    light: { color: '#C0FFC0', crystal: 'Light Green' },
    solid: { color: '#00EE00', crystal: 'Green' },
    dark: { color: '#2E8B57', crystal: 'Sea Green' }
  },
  {
    name: "Emerald",
    light: { color: '#AFEEEE', crystal: 'Pale Turquoise' },
    solid: { color: '#50C878', crystal: 'Emerald' },
    dark: { color: '#2E8B57', crystal: 'Sea Green' }
  },
  {
    name: "Jade",
    light: { color: '#E0FFFF', crystal: 'Light Cyan' },
    solid: { color: '#00A86B', crystal: 'Jade' },
    dark: { color: '#2F4F4F', crystal: 'Dark Slate Gray' }
  },
  {
    name: "Mint",
    light: { color: '#F5FFFA', crystal: 'Mint Cream' },
    solid: { color: '#98FB98', crystal: 'Pale Green' },
    dark: { color: '#3CB371', crystal: 'Medium Sea Green' }
  },
  {
    name: "Turquoise",
    light: { color: '#E0FFFF', crystal: 'Light Cyan' },
    solid: { color: '#40E0D0', crystal: 'Turquoise' },
    dark: { color: '#2E8B57', crystal: 'Sea Green' }
  },
  {
    name: "Teal",
    light: { color: '#E0FFFF', crystal: 'Light Cyan' },
    solid: { color: '#008080', crystal: 'Teal' },
    dark: { color: '#2F4F4F', crystal: 'Dark Slate Gray' }
  },
  {
    name: "Cyan",
    light: { color: '#E0FFFF', crystal: 'Light Cyan' },
    solid: { color: '#00FFFF', crystal: 'Cyan' },
    dark: { color: '#008B8B', crystal: 'Dark Cyan' }
  },
  {
    name: "Aqua",
    light: { color: '#F0FFFF', crystal: 'Azure' },
    solid: { color: '#00FFFF', crystal: 'Aqua' },
    dark: { color: '#5F9EA0', crystal: 'Cadet Blue' }
  },
  {
    name: "Sky",
    light: { color: '#F0F8FF', crystal: 'Alice Blue' },
    solid: { color: '#87CEEB', crystal: 'Sky Blue' },
    dark: { color: '#4682B4', crystal: 'Steel Blue' }
  },
  {
    name: "Powder",
    light: { color: '#F0F8FF', crystal: 'Alice Blue' },
    solid: { color: '#B0E0E6', crystal: 'Powder Blue' },
    dark: { color: '#4682B4', crystal: 'Steel Blue' }
  },
  {
    name: "Blue",
    light: { color: '#E6F3FF', crystal: 'Light Blue' },
    solid: { color: '#0000FF', crystal: 'Blue' },
    dark: { color: '#00008B', crystal: 'Dark Blue' }
  },
  {
    name: "Cobalt",
    light: { color: '#E6F2FF', crystal: 'Light Steel Blue' },
    solid: { color: '#0047AB', crystal: 'Cobalt' },
    dark: { color: '#191970', crystal: 'Midnight Blue' }
  },
  {
    name: "Navy",
    light: { color: '#F0F8FF', crystal: 'Alice Blue' },
    solid: { color: '#000080', crystal: 'Navy' },
    dark: { color: '#191970', crystal: 'Midnight Blue' }
  },
  {
    name: "Royal",
    light: { color: '#E6E6FA', crystal: 'Lavender' },
    solid: { color: '#4169E1', crystal: 'Royal Blue' },
    dark: { color: '#191970', crystal: 'Midnight Blue' }
  },
  {
    name: "Periwinkle",
    light: { color: '#F0F0FF', crystal: 'Lavender Blush' },
    solid: { color: '#CCCCFF', crystal: 'Periwinkle' },
    dark: { color: '#6495ED', crystal: 'Cornflower Blue' }
  },
  {
    name: "Violet",
    light: { color: '#F8F8FF', crystal: 'Ghost White' },
    solid: { color: '#8A2BE2', crystal: 'Blue Violet' },
    dark: { color: '#663399', crystal: 'Rebecca Purple' }
  },
  {
    name: "Indigo",
    light: { color: '#E6E6FA', crystal: 'Lavender' },
    solid: { color: '#4B0082', crystal: 'Indigo' },
    dark: { color: '#301934', crystal: 'Dark Purple' }
  },
  {
    name: "Purple",
    light: { color: '#E6E6FA', crystal: 'Lavender' },
    solid: { color: '#C000C0', crystal: 'Purple' },
    dark: { color: '#4B0082', crystal: 'Deep Purple' }
  },
  {
    name: "Plum",
    light: { color: '#DDA0DD', crystal: 'Plum' },
    solid: { color: '#8B008B', crystal: 'Dark Magenta' },
    dark: { color: '#663399', crystal: 'Rebecca Purple' }
  },
  {
    name: "Magenta",
    light: { color: '#F5F0FF', crystal: 'Ghost White' },
    solid: { color: '#FF00FF', crystal: 'Magenta' },
    dark: { color: '#8B008B', crystal: 'Dark Magenta' }
  },
  {
    name: "Gray",
    light: { color: '#FFFFFF', crystal: 'White' },
    solid: { color: '#808080', crystal: 'Gray' },
    dark: { color: '#000000', crystal: 'Black' }
  }
];
  ChakraApp.CharacteristicController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.CharacteristicController.prototype.constructor = ChakraApp.CharacteristicController;
  
  ChakraApp.CharacteristicController.prototype.initDOMElements = function() {
    this.topPanel = null;
    this.characteristicButtons = {};
    this.characteristicValueDisplays = {};
    this.deleteCircleBtn = null;
    this.deleteValueDisplay = null;
    this.pickers = {};
    this.imageInput = null;
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

  ChakraApp.CharacteristicController.prototype._createImageInput = function(parent) {
  var container = this._createElem('div', { 
    className: 'action-btn-container image-input-container',
    style: {
      marginLeft: '10px'
    }
  }, parent);
  
  this._createElem('div', { 
    className: 'action-btn-title', 
    textContent: 'Image'
  }, container);
  
  var self = this;
  
  // Create the input field
  this.imageInput = this._createElem('input', {
    type: 'text',
    id: 'circle-image-input',
    className: 'circle-image-input',
    placeholder: '',
    style: {
      display: 'none',
      padding: '2px 4px',
      width: '200px',
      borderRadius: '4px',
      backgroundColor: 'rgba(60, 60, 60, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      transition: 'all 0.2s ease'
    },
    events: {
      keydown: function(e) {
        if (e.key === 'Enter') {
          self._saveImageValue(this.value);
        }
      },
      blur: function() {
        self._saveImageValue(this.value);
      },
      focus: function() {
        this.style.backgroundColor = 'rgba(80, 80, 80, 0.8)';
        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      },
      mouseover: function() {
        this.style.backgroundColor = 'rgba(80, 80, 80, 0.8)';
        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      },
      mouseout: function() {
        if (document.activeElement !== this) {
          this.style.backgroundColor = 'rgba(60, 60, 60, 0.8)';
          this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
      }
    }
  }, container);
};

ChakraApp.CharacteristicController.prototype._saveImageValue = function(value) {
  if (!ChakraApp.appState.selectedCircleId) return;
  
  var circle = this._getSelectedCircle();
  if (!circle) return;
  
  // Initialize characteristics object if needed
  if (!circle.characteristics) {
    circle.characteristics = {};
  }
  
  // Only update if value has changed
  if (circle.characteristics.image !== value) {
    ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, {
      characteristics: Object.assign({}, circle.characteristics, { image: value })
    });
  }
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
	    if (key == 'image') { return; }
      self._createActionButton(key, characteristics[key], buttonContainer);
    });
    
    this._createImageInput(buttonContainer);
    //this._createDeleteButton(buttonContainer);
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
  
  if (key === 'color') {
    // Handle color swatches differently - show selection indicator
    var allSwatches = picker.querySelectorAll('.color-swatch');
    allSwatches.forEach(function(swatch) {
      var indicator = swatch.querySelector('.selection-indicator');
      swatch.classList.remove('selected');
      
      if (currentValue && swatch.dataset.value === currentValue) {
        swatch.classList.add('selected');
        swatch.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        swatch.style.transform = 'scale(1.1)';
        if (indicator) {
          indicator.style.display = 'block';
        }
      } else {
        swatch.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        swatch.style.transform = 'scale(1)';
        if (indicator) {
          indicator.style.display = 'none';
        }
      }
    });
  } else {
    // Handle other characteristics as before
    var allOptions = picker.querySelectorAll('.characteristic-option');
    allOptions.forEach(function(option) {
      option.classList.remove('selected');
      if ((currentValue && option.dataset.value === currentValue) ||
          (!currentValue && option.classList.contains('no-value'))) {
        option.classList.add('selected');
      }
    });
  }
};
  
  ChakraApp.CharacteristicController.prototype._getCircleValue = function(key, circle) {
    if (key === 'color') return circle.color;
    return circle.characteristics && circle.characteristics[key] !== undefined ? 
           circle.characteristics[key] : null;
  };
  
  // Helper method to find color info from colorFamilies
ChakraApp.CharacteristicController.prototype._findColorInfo = function(colorValue) {
  var colorFamilies = ChakraApp.CharacteristicController.colorFamilies;
  
  // Search through all color families to find the matching color
  for (var i = 0; i < colorFamilies.length; i++) {
    var family = colorFamilies[i];
    
    // Check light variant
    if (family.light && family.light.color.toLowerCase() === colorValue.toLowerCase()) {
      return family.light;
    }
    
    // Check solid variant
    if (family.solid && family.solid.color.toLowerCase() === colorValue.toLowerCase()) {
      return family.solid;
    }
    
    // Check dark variant
    if (family.dark && family.dark.color.toLowerCase() === colorValue.toLowerCase()) {
      return family.dark;
    }
  }
  
  return null; // Color not found
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
    //this._createPickerHeader(picker, charDef.modalTitle || 'Select ' + charDef.displayName);
    
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
  var colorList = this._createElem('div', {
    className: 'color-list',
    style: { 
      display: 'flex', 
      flexDirection: 'column',
      gap: '0px'
    }
  }, content);
  
  // Use the updated colorFamilies structure
  var colorFamilies = ChakraApp.CharacteristicController.colorFamilies;
  
  var self = this;
  colorFamilies.forEach(function(family) {
    self._createColorRow(colorList, family);
  });
};

ChakraApp.CharacteristicController.prototype._createColorRow = function(container, family) {
  var row = this._createElem('div', {
    className: 'color-row',
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '2px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      gap: '8px'
    }
  }, container);
  
  var self = this;
  
  // Create swatches container
  var swatchesContainer = this._createElem('div', {
    className: 'color-swatches',
    style: {
      display: 'flex',
      gap: '2px'
    }
  }, row);
  
  // Add light, solid, and dark swatches
  if (family.light) {
    this._createColorSwatch(swatchesContainer, family.light, 'light');
  }
  if (family.solid) {
    this._createColorSwatch(swatchesContainer, family.solid, 'solid');
  }
  if (family.dark) {
    this._createColorSwatch(swatchesContainer, family.dark, 'dark');
  }
  
  // Add color name
  this._createElem('div', {
    className: 'color-name',
    textContent: family.name,
    style: {
      flex: '1',
      color: 'white',
      fontSize: '11px',
      fontWeight: '500'
    }
  }, row);
};

ChakraApp.CharacteristicController.prototype._createColorSwatch = function(container, colorInfo, variant) {
  var self = this;
  var swatch = this._createElem('div', {
    className: 'color-swatch characteristic-option',
    dataset: {
      value: colorInfo.color,
      characteristic: 'color'
    },
    style: {
      width: '14px',
      height: '14px',
      backgroundColor: colorInfo.color,
      borderRadius: '3px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
    },
    title: colorInfo.crystal + ': ' + colorInfo.color,
    events: {
      mouseover: function() {
        this.style.borderColor = 'rgba(255, 255, 255, 0.6)';
        this.style.transform = 'scale(1.1)';
      },
      mouseout: function() {
        if (!this.classList.contains('selected')) {
          this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          this.style.transform = 'scale(1)';
        }
      },
      click: function() {
        if (ChakraApp.appState.selectedCircleId) {
          ChakraApp.appState.updateCircle(ChakraApp.appState.selectedCircleId, { 
            color: colorInfo.color,
            crystal: colorInfo.crystal
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
  
  // Add selection indicator
  this._createElem('div', {
    className: 'selection-indicator',
    innerHTML: '✓',
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
      textShadow: '0 0 2px rgba(0,0,0,0.8)',
      display: 'none'
    }
  }, swatch);
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
        padding: '0px',
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
      className: 'color-picker-swatch',
      style: {
        backgroundColor: item.color,
        width: '16px',
        height: '16px',
        borderRadius: '3px',
        border: '1px solid rgba(0, 0, 0, 0.3)'
      },
      dataset: { color: item.color },
      title: item.crystal + ': ' + item.color
    }, colorOption);

    this._createElem('div', {
      className: 'crystal-name',
      textContent: item.crystal,
      style: { flex: '1' }
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
    self._updateImageInputValue(circle); // Add this line
  }
);
    
   this.circleUpdatedSubscription = ChakraApp.EventBus.subscribe(
  ChakraApp.EventTypes.CIRCLE_UPDATED,
  function(circle) {
    if (circle && circle.id === ChakraApp.appState.selectedCircleId) {
      var updatedCircle = ChakraApp.appState.getCircle(circle.id);
      if (updatedCircle) {
        self._updateValueDisplays(updatedCircle);
        self._updateImageInputValue(updatedCircle); // Add this line
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
  
  // Toggle image input field
  if (this.imageInput) {
    this.imageInput.style.display = show ? 'block' : 'none';
  }
  
  if (this.deleteValueDisplay) {
    this.deleteValueDisplay.style.display = show ? 'flex' : 'none';
  }
};

ChakraApp.CharacteristicController.prototype._updateImageInputValue = function(circle) {
  if (!this.imageInput || !circle) return;
  
  const imageValue = circle.characteristics && circle.characteristics.image ? 
                     circle.characteristics.image : '';
  this.imageInput.value = imageValue;
};
  
ChakraApp.CharacteristicController.prototype._updateValueDisplays = function(circle) {
  if (!circle) return;
  
  // Make sure we have access to the characteristics from Config
  var characteristics = ChakraApp.Config.characteristics;
  if (!characteristics) return; // Guard against undefined characteristics
  
  var self = this;
  
  // Use Object.keys safely with a null check
  Object.keys(characteristics || {}).forEach(function(key) {
    var displayEl = self.characteristicValueDisplays[key];
    if (!displayEl) return;
    
    var value = self._getCircleValue(key, circle);
    
    if (value) {
      if (key === 'color') {
        // For colors, use the crystal name from colorFamilies
        var colorInfo = self._findColorInfo(value);
        
        if (colorInfo) {
          var template = characteristics[key].valueDisplayStyle.template;
          displayEl.innerHTML = template
            .replace('{VALUE}', value)
            .replace('{DISPLAY}', colorInfo.crystal);
        } else {
          // Fallback if color not found
          displayEl.textContent = value;
        }
      } else {
        // For other characteristics, use the existing logic
        var charDef = characteristics[key];
        if (!charDef || !charDef.categories) {
          // Handle characteristics without categories (like our new image field)
          displayEl.textContent = value;
          return;
        }
        
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
      }
    } else {
      displayEl.textContent = 'None';
    }
  });
};

  // These are methods that were omitted from part 2 to fit within message limits
// They should be included in the final CharacteristicController.js file

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
