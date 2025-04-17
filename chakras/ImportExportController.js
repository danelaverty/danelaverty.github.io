// src/controllers/ImportExportController.js
(function(ChakraApp) {
  /**
   * Controls import/export functionality for app state
   */
  ChakraApp.ImportExportController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.modalOverlay = null;
    this.modalBox = null;
    this.jsonTextarea = null;
    this.copyButton = null;
    this.importButton = null;
    this.closeButton = null;
    
    // Event subscriptions
    this.keydownSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.ImportExportController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.ImportExportController.prototype.constructor = ChakraApp.ImportExportController;
  
  // Initialize
  ChakraApp.ImportExportController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Create modal UI
    this._createModalUI();
    
    // Setup keyboard shortcut
    this._setupKeyboardShortcut();
  };
  
  /**
   * Create modal UI
   * @private
   */
  ChakraApp.ImportExportController.prototype._createModalUI = function() {
    // Create modal overlay
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'import-export-overlay';
    this.modalOverlay.className = 'modal-overlay';
    this.modalOverlay.style.position = 'fixed';
    this.modalOverlay.style.top = '0';
    this.modalOverlay.style.left = '0';
    this.modalOverlay.style.width = '100%';
    this.modalOverlay.style.height = '100%';
    this.modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.modalOverlay.style.display = 'none';
    this.modalOverlay.style.justifyContent = 'center';
    this.modalOverlay.style.alignItems = 'center';
    this.modalOverlay.style.zIndex = '2000';
    
    // Create modal box
    this.modalBox = document.createElement('div');
    this.modalBox.className = 'modal-box';
    this.modalBox.style.backgroundColor = '#222';
    this.modalBox.style.borderRadius = '8px';
    this.modalBox.style.padding = '20px';
    this.modalBox.style.width = '80%';
    this.modalBox.style.maxWidth = '800px';
    this.modalBox.style.maxHeight = '80vh';
    this.modalBox.style.display = 'flex';
    this.modalBox.style.flexDirection = 'column';
    this.modalBox.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    
    // Create header
    var header = document.createElement('div');
    header.className = 'modal-header';
    header.style.marginBottom = '15px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    
    var title = document.createElement('h2');
    title.textContent = 'Import/Export App State';
    title.style.color = 'white';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    
    this.closeButton = document.createElement('button');
    this.closeButton.textContent = '×';
    this.closeButton.style.backgroundColor = 'transparent';
    this.closeButton.style.border = 'none';
    this.closeButton.style.color = 'white';
    this.closeButton.style.fontSize = '24px';
    this.closeButton.style.cursor = 'pointer';
    this.closeButton.style.padding = '0 5px';
    
    header.appendChild(title);
    header.appendChild(this.closeButton);
    
    // Create textarea for JSON
    this.jsonTextarea = document.createElement('textarea');
    this.jsonTextarea.style.width = '100%';
    this.jsonTextarea.style.height = '300px';
    this.jsonTextarea.style.backgroundColor = '#333';
    this.jsonTextarea.style.color = 'white';
    this.jsonTextarea.style.border = '1px solid #444';
    this.jsonTextarea.style.borderRadius = '4px';
    this.jsonTextarea.style.padding = '10px';
    this.jsonTextarea.style.marginBottom = '15px';
    this.jsonTextarea.style.resize = 'vertical';
    this.jsonTextarea.style.fontFamily = 'monospace';
    this.jsonTextarea.style.fontSize = '14px';
    
    // Create buttons container
    var buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    
    // Create copy button
    this.copyButton = document.createElement('button');
    this.copyButton.textContent = 'Copy to Clipboard';
    this.copyButton.className = 'modal-button';
    this.copyButton.style.backgroundColor = '#555';
    this.copyButton.style.color = 'white';
    this.copyButton.style.border = 'none';
    this.copyButton.style.borderRadius = '4px';
    this.copyButton.style.padding = '8px 15px';
    this.copyButton.style.cursor = 'pointer';
    this.copyButton.style.transition = 'background-color 0.2s';
    
    // Create import button
    this.importButton = document.createElement('button');
    this.importButton.textContent = 'Import Data';
    this.importButton.className = 'modal-button';
    this.importButton.style.backgroundColor = '#4CAF50';
    this.importButton.style.color = 'white';
    this.importButton.style.border = 'none';
    this.importButton.style.borderRadius = '4px';
    this.importButton.style.padding = '8px 15px';
    this.importButton.style.cursor = 'pointer';
    this.importButton.style.transition = 'background-color 0.2s';
    
    buttonContainer.appendChild(this.copyButton);
    buttonContainer.appendChild(this.importButton);
    
    // Assemble modal
    this.modalBox.appendChild(header);
    this.modalBox.appendChild(this.jsonTextarea);
    this.modalBox.appendChild(buttonContainer);
    this.modalOverlay.appendChild(this.modalBox);
    
    // Add to document body
    document.body.appendChild(this.modalOverlay);
    
    // Setup event handlers
    this._setupModalEvents();
  };
  
  /**
   * Setup event handlers for modal
   * @private
   */
  ChakraApp.ImportExportController.prototype._setupModalEvents = function() {
    var self = this;
    
    // Close button
    this.closeButton.addEventListener('click', function() {
      self.hideModal();
    });
    
    // Click outside to close
    this.modalOverlay.addEventListener('click', function(e) {
      if (e.target === self.modalOverlay) {
        self.hideModal();
      }
    });
    
    // Copy button
    this.copyButton.addEventListener('click', function() {
      self.jsonTextarea.select();
      document.execCommand('copy');
      
      // Visual feedback
      self.copyButton.textContent = 'Copied!';
      self.copyButton.style.backgroundColor = '#45a049';
      
      setTimeout(function() {
        self.copyButton.textContent = 'Copy to Clipboard';
        self.copyButton.style.backgroundColor = '#555';
      }, 2000);
    });
    
    // Import button
    this.importButton.addEventListener('click', function() {
      self._importData();
    });
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && self.modalOverlay.style.display === 'flex') {
        self.hideModal();
      }
    });
  };
  
  /**
   * Setup keyboard shortcut (Ctrl+S)
   * @private
   */
  ChakraApp.ImportExportController.prototype._setupKeyboardShortcut = function() {
    var self = this;
    
    this.keydownSubscription = function(e) {
      // Check for Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault(); // Prevent browser save dialog
        self.showModal();
      }
    };
    
    document.addEventListener('keydown', this.keydownSubscription);
  };
  
  /**
   * Show modal with current app state
   */
  ChakraApp.ImportExportController.prototype.showModal = function() {
    // Get current app state
    var appState = this._getAppState();
    
    // Format JSON with 2 spaces indentation
    this.jsonTextarea.value = JSON.stringify(appState, null, 2);
    
    // Show modal
    this.modalOverlay.style.display = 'flex';
    
    // Focus textarea for easier copying
    this.jsonTextarea.focus();
  };
  
  /**
   * Hide modal
   */
  ChakraApp.ImportExportController.prototype.hideModal = function() {
    this.modalOverlay.style.display = 'none';
  };
  
  /**
   * Get current app state from localStorage
   * @private
   * @returns {Object} App state data
   */
  ChakraApp.ImportExportController.prototype._getAppState = function() {
    var stateData = {};
    
    // Get chakraVisualizerData
    var chakraData = localStorage.getItem('chakraVisualizerData');
    if (chakraData) {
      stateData.chakraVisualizerData = JSON.parse(chakraData);
    }
    
    // Get all panel-specific document IDs
    ChakraApp.appState.panels.forEach(function(panelId) {
      var lastViewedDocId = localStorage.getItem('chakraLastViewedDocumentId_' + panelId);
      if (lastViewedDocId) {
        stateData['chakraLastViewedDocumentId_' + panelId] = lastViewedDocId;
      }
    });
    
    // Get panel visibility state
    var panelVisibility = localStorage.getItem('chakraPanelVisibility');
    if (panelVisibility) {
      stateData.chakraPanelVisibility = JSON.parse(panelVisibility);
    }
    
    return stateData;
  };
  
  /**
   * Import data from JSON in textarea
   * @private
   */
  ChakraApp.ImportExportController.prototype._importData = function() {
    try {
      // Parse JSON data
      var jsonData = JSON.parse(this.jsonTextarea.value);
      
      // Validate data structure
      if (!(jsonData.chakraVisualizerData && 
            typeof jsonData.chakraVisualizerData === 'object')) {
        throw new Error('Invalid data format: missing chakraVisualizerData');
      }
      
      // Save to localStorage
      localStorage.setItem('chakraVisualizerData', 
                          JSON.stringify(jsonData.chakraVisualizerData));
      
      // Save panel-specific document IDs
      Object.keys(jsonData).forEach(function(key) {
        if (key.startsWith('chakraLastViewedDocumentId_')) {
          localStorage.setItem(key, jsonData[key]);
        }
      });
      
      // Save panel visibility state
      if (jsonData.chakraPanelVisibility) {
        localStorage.setItem('chakraPanelVisibility', 
                            JSON.stringify(jsonData.chakraPanelVisibility));
      }
      
      // Visual feedback
      this.importButton.textContent = 'Import Successful!';
      this.importButton.style.backgroundColor = '#45a049';
      
      var self = this;
      setTimeout(function() {
        self.importButton.textContent = 'Import Data';
        self.importButton.style.backgroundColor = '#4CAF50';
        
        // Reload the page to apply imported state
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      alert('Error importing data: ' + error.message);
      console.error('Import error:', error);
      
      // Visual feedback for error
      this.importButton.textContent = 'Import Failed';
      this.importButton.style.backgroundColor = '#f44336';
      
      var self = this;
      setTimeout(function() {
        self.importButton.textContent = 'Import Data';
        self.importButton.style.backgroundColor = '#4CAF50';
      }, 1500);
    }
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.ImportExportController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Remove event listeners
    if (this.keydownSubscription) {
      document.removeEventListener('keydown', this.keydownSubscription);
    }
    
    // Remove modal from DOM
    if (this.modalOverlay && this.modalOverlay.parentNode) {
      this.modalOverlay.parentNode.removeChild(this.modalOverlay);
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
