// src/factories/CharacteristicPickerFactory.js
(function(ChakraApp) {
  ChakraApp.CharacteristicPickerFactory = {
    /**
     * Create a characteristic picker
     * @param {string} key - Characteristic key
     * @returns {HTMLElement} The created picker
     */
    createPicker: function(key) {
      var charDef = ChakraApp.Config.characteristics[key];
      if (!charDef) return null;
      
      // Create picker based on type
      if (key === 'color') {
        return this.createColorPicker();
      } else if (key === 'element') {
        return this.createElementPicker();
      } else {
        return this.createGenericPicker(key, charDef);
      }
    },
    
    // Extract picker creation methods from UIController
    // createColorPicker()
    // createElementPicker()
    // createGenericPicker()
  };
})(window.ChakraApp = window.ChakraApp || {});
