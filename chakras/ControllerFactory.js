// src/controllers/ControllerFactory.js
(function(ChakraApp) {
  ChakraApp.ControllerFactory = {
    /**
     * Create and initialize all controllers
     * @returns {Object} Map of controller instances
     */
	  createControllers: function() {
  var controllers = {
    ui: new ChakraApp.UIController(),
    document: new ChakraApp.DocumentController(),
    dialog: new ChakraApp.DialogController(),
    notification: new ChakraApp.NotificationController(),
    panel: new ChakraApp.PanelController(),
    characteristic: new ChakraApp.CharacteristicController(),
    tab: new ChakraApp.TabController(),
    attribute: new ChakraApp.AttributeController(),
    importExport: new ChakraApp.ImportExportController(),
    // Add zoom controller
    zoom: new ChakraApp.ZoomController()
  };
  
  // Initialize controllers
  Object.values(controllers).forEach(function(controller) {
    if (typeof controller.init === 'function') {
      controller.init();
    }
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
