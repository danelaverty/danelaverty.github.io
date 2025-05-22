// src/controllers/ZoomController.js
(function(ChakraApp) {
  /**
   * Zoom controller for silhouette SVG
   */
  ChakraApp.ZoomController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.zoomInBtn = null;
    this.zoomOutBtn = null;
    this.zoomResetBtn = null;
    this.zoomLevelDisplay = null;
    this.silhouetteSvgs = [];
    
    // State
    this.defaultTransform = {
      translateX: -50,
      translateY: -50,
      scale: 1
    };
    
    this.currentZoom = {
      translateX: -50,
      translateY: -50,
      scale: 1
    };
    
    // Constants
    this.zoomStep = 0.1;
    this.translateYStep = 4.5;
    this.minZoom = 0.1;
    this.maxZoom = 20.0;
    
    // Event subscriptions
    this.eventSubscriptions = {};
  };
  
  // Inherit from BaseController
  ChakraApp.ZoomController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.ZoomController.prototype.constructor = ChakraApp.ZoomController;
  
  // Initialize
  ChakraApp.ZoomController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Create UI elements
    this._createZoomControls();
    
    // Find silhouette SVGs
    this._findSilhouetteSvgs();
    
    // Add event listeners
    this._setupEventListeners();
  };
  
  /**
   * Create zoom controls (buttons and level display)
   * @private
   */
  ChakraApp.ZoomController.prototype._createZoomControls = function() {
    var controlsContainer = document.createElement('div');
    controlsContainer.id = 'zoom-controls';
    controlsContainer.className = 'zoom-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '10px';
    controlsContainer.style.right = '10px';
    controlsContainer.style.zIndex = '50';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '5px';
    
    // Zoom Out Button
    this.zoomOutBtn = document.createElement('button');
    this.zoomOutBtn.id = 'zoom-out-btn';
    this.zoomOutBtn.className = 'btn-round';
    this.zoomOutBtn.innerHTML = '−';
    this.zoomOutBtn.title = 'Zoom Out';
    this.zoomOutBtn.style.fontSize = '12px';
    
    // Zoom Level Display
    this.zoomLevelDisplay = document.createElement('div');
    this.zoomLevelDisplay.id = 'zoom-level-display';
    this.zoomLevelDisplay.className = 'current-value';
    this.zoomLevelDisplay.innerHTML = '100%';
    
    // Zoom Reset Button
    this.zoomResetBtn = document.createElement('button');
    this.zoomResetBtn.id = 'zoom-reset-btn';
    this.zoomResetBtn.className = 'btn-round';
    this.zoomResetBtn.innerHTML = '⟲';
    this.zoomResetBtn.title = 'Reset Zoom';
    this.zoomResetBtn.style.fontSize = '12px';
    
    // Zoom In Button
    this.zoomInBtn = document.createElement('button');
    this.zoomInBtn.id = 'zoom-in-btn';
    this.zoomInBtn.className = 'btn-round';
    this.zoomInBtn.innerHTML = '+';
    this.zoomInBtn.title = 'Zoom In';
    this.zoomInBtn.style.fontSize = '12px';
    
    // Add buttons to container
    controlsContainer.appendChild(this.zoomOutBtn);
    //controlsContainer.appendChild(this.zoomLevelDisplay);
    //controlsContainer.appendChild(this.zoomResetBtn);
    controlsContainer.appendChild(this.zoomInBtn);
    
    // Add container to left panel
    var leftPanel = document.getElementById('left-panel');
    if (leftPanel) {
      leftPanel.appendChild(controlsContainer);
    }
  };
  
  /**
   * Find silhouette SVGs
   * @private
   */
  ChakraApp.ZoomController.prototype._findSilhouetteSvgs = function() {
    this.silhouetteSvgs = document.querySelectorAll('.silhouette-svg');
  };
  
  /**
   * Set up event listeners
   * @private
   */
  ChakraApp.ZoomController.prototype._setupEventListeners = function() {
    var self = this;
    
    // Zoom in button click handler
    this.zoomInBtn.addEventListener('click', function() {
      self.zoomIn();
    });
    
    // Zoom out button click handler
    this.zoomOutBtn.addEventListener('click', function() {
      self.zoomOut();
    });
    
    // Zoom reset button click handler
    this.zoomResetBtn.addEventListener('click', function() {
      self.resetZoom();
    });
    
    // Document selection event
    this.eventSubscriptions.documentSelected = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.DOCUMENT_SELECTED,
      function(doc) {
        if (doc.circleType === 'standard') {
          self._loadZoomFromDocument(doc);
        }
      }
    );
  };
  
  /**
   * Zoom in
   */
  ChakraApp.ZoomController.prototype.zoomIn = function() {
    if (this.currentZoom.scale >= this.maxZoom) return;
    
    // Increase scale and adjust translateY
    this.currentZoom.scale += this.zoomStep;
    this.currentZoom.translateY += this.translateYStep;
    
    // Apply new transform
    this._applyTransform();
    
    // Save zoom to current document
    this._saveZoomToCurrentDocument();
  };
  
  /**
   * Zoom out
   */
  ChakraApp.ZoomController.prototype.zoomOut = function() {
    if (this.currentZoom.scale <= this.minZoom) return;
    
    // Decrease scale and adjust translateY
    this.currentZoom.scale -= this.zoomStep;
    this.currentZoom.translateY -= this.translateYStep;
    
    // Apply new transform
    this._applyTransform();
    
    // Save zoom to current document
    this._saveZoomToCurrentDocument();
  };
  
  /**
   * Reset zoom to default
   */
  ChakraApp.ZoomController.prototype.resetZoom = function() {
    // Reset to default values
    this.currentZoom = {
      translateX: this.defaultTransform.translateX,
      translateY: this.defaultTransform.translateY,
      scale: this.defaultTransform.scale
    };
    
    // Apply transform
    this._applyTransform();
    
    // Save zoom to current document
    this._saveZoomToCurrentDocument();
  };
  
  /**
   * Apply current transform to silhouette SVGs
   * @private
   */
  ChakraApp.ZoomController.prototype._applyTransform = function() {
    //const transformValue = `translate(${this.currentZoom.translateX}%, ${this.currentZoom.translateY}%) scale(${this.currentZoom.scale})`;
    const transformValue = `translate(${this.currentZoom.translateX}%, 0px) scale(${this.currentZoom.scale})`;
    
    // Apply to all silhouette SVGs
    for (let i = 0; i < this.silhouetteSvgs.length; i++) {
      this.silhouetteSvgs[i].style.transform = transformValue;
    }
    
    // Update zoom level display
    this._updateZoomLevelDisplay();
    
    // Update button states
    this._updateButtonStates();
  };
  
  /**
   * Update zoom level display
   * @private
   */
  ChakraApp.ZoomController.prototype._updateZoomLevelDisplay = function() {
    const zoomPercent = Math.round(this.currentZoom.scale * 100);
    this.zoomLevelDisplay.innerHTML = zoomPercent + '%';
  };
  
  /**
   * Update button states based on current zoom
   * @private
   */
  ChakraApp.ZoomController.prototype._updateButtonStates = function() {
    // Disable zoom in button if at max zoom
    this.zoomInBtn.disabled = this.currentZoom.scale >= this.maxZoom;
    this.zoomInBtn.style.opacity = this.zoomInBtn.disabled ? '0.5' : '1';
    
    // Disable zoom out button if at min zoom
    this.zoomOutBtn.disabled = this.currentZoom.scale <= this.minZoom;
    this.zoomOutBtn.style.opacity = this.zoomOutBtn.disabled ? '0.5' : '1';
    
    // Disable reset button if at default zoom
    this.zoomResetBtn.disabled = this.currentZoom.scale === this.defaultTransform.scale;
    this.zoomResetBtn.style.opacity = this.zoomResetBtn.disabled ? '0.5' : '1';
  };
  
  /**
   * Save current zoom to the selected standard document
   * @private
   */
  ChakraApp.ZoomController.prototype._saveZoomToCurrentDocument = function() {
    // Get current standard document
    var docId = ChakraApp.appState.selectedDocumentIds.standard;
    if (!docId) return;
    
    var doc = ChakraApp.appState.getDocument(docId);
    if (!doc) return;
    
    // Prepare the zoom data to save
    var zoomData = {
      zoomLevel: {
        translateX: this.currentZoom.translateX,
        translateY: this.currentZoom.translateY,
        scale: this.currentZoom.scale
      }
    };
    
    // Update the document
    ChakraApp.appState.updateDocument(docId, zoomData);
  };
  
  /**
   * Load zoom from selected document
   * @private
   * @param {Object} doc - Selected document
   */
  ChakraApp.ZoomController.prototype._loadZoomFromDocument = function(doc) {
    if (!doc || doc.circleType !== 'standard') return;
    
    // Check if document has zoom data
    if (doc.zoomLevel) {
      // Use document's zoom level
      this.currentZoom = {
        translateX: doc.zoomLevel.translateX,
        translateY: doc.zoomLevel.translateY,
        scale: doc.zoomLevel.scale
      };
    } else {
      // Reset to default if no zoom data exists
      this.resetZoom();
      return;
    }
    
    // Apply the loaded zoom
    this._applyTransform();
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.ZoomController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Remove event listeners
    if (this.zoomInBtn) {
      this.zoomInBtn.removeEventListener('click', this.zoomInBtn.onclick);
    }
    
    if (this.zoomOutBtn) {
      this.zoomOutBtn.removeEventListener('click', this.zoomOutBtn.onclick);
    }
    
    if (this.zoomResetBtn) {
      this.zoomResetBtn.removeEventListener('click', this.zoomResetBtn.onclick);
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
    
    // Remove DOM elements
    var controlsContainer = document.getElementById('zoom-controls');
    if (controlsContainer && controlsContainer.parentNode) {
      controlsContainer.parentNode.removeChild(controlsContainer);
    }
    
    // Clear references
    this.zoomInBtn = null;
    this.zoomOutBtn = null;
    this.zoomResetBtn = null;
    this.zoomLevelDisplay = null;
    this.silhouetteSvgs = [];
  };
  
})(window.ChakraApp = window.ChakraApp || {});
