// src/controllers/ControllerFactory.js
(function(ChakraApp) {
  ChakraApp.ControllerFactory = {
    /**
     * Create and initialize all controllers
     * @returns {Object} Map of controller instances
     */
    createControllers: function() {
      var controllers = {
        document: new ChakraApp.DocumentController(),
        characteristic: new ChakraApp.CharacteristicController(),
        attribute: new ChakraApp.AttributeController(),
        dialog: new ChakraApp.DialogController(),
        notification: new ChakraApp.NotificationController(),
        panel: new ChakraApp.PanelController(),
        ui: new ChakraApp.UIController(),
        tab: new ChakraApp.TabController(),
        importExport: new ChakraApp.ImportExportController() // Added import/export controller
      };
      
      // Initialize all controllers
      Object.values(controllers).forEach(function(controller) {
        controller.init();
      });
      
      return controllers;
    },
    
    /**
     * Destroy all controllers
     * @param {Object} controllers - Map of controller instances
     */
    destroyControllers: function(controllers) {
      if (!controllers) return;
      
      // Destroy all controllers
      Object.values(controllers).forEach(function(controller) {
        if (typeof controller.destroy === 'function') {
          controller.destroy();
        }
      });
    }
  };
})(window.ChakraApp = window.ChakraApp || {});
