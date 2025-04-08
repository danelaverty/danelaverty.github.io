// src/controllers/AttributeController.js
(function(ChakraApp) {
  /**
   * Controls square attributes grid and interactions
   */
  ChakraApp.AttributeController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements
    this.attributeGrid = null;
    
    // Event subscriptions
    this.circleSelectedSubscription = null;
    this.circleDeselectedSubscription = null;
  };
  
  // Inherit from BaseController
  ChakraApp.AttributeController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.AttributeController.prototype.constructor = ChakraApp.AttributeController;
  
  // Initialize
  ChakraApp.AttributeController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Get attribute grid element
    this.attributeGrid = document.getElementById('attribute-grid');
    
    // Create attribute grid if needed
    this._createAttributeGrid();
    
    // Subscribe to circle events
    this._setupEventSubscriptions();
  };
  
  /**
   * Create attribute grid
   * @private
   */
  ChakraApp.AttributeController.prototype._createAttributeGrid = function() {
    // Create grid if it doesn't exist or is empty
    if (this.attributeGrid && this.attributeGrid.children.length === 0) {
      // Define the order for attributes to control their placement
      var attributeOrder = [
        'cause', 'push', 'stop',
        'treasure', 'door', 'key', 'demon', 'sword', 'chain', 'ally'
      ];
      
      // Loop through each attribute in the specified order
      for (var i = 0; i < attributeOrder.length; i++) {
        var key = attributeOrder[i];
        var attr = ChakraApp.Config.attributeInfo[key];
        
        // Skip if attribute not found in config
        if (!attr) continue;
        
        // Create the attribute box
        var attrBox = document.createElement('div');
        attrBox.id = key + '-box';
        attrBox.className = 'attribute-box create-button';
        attrBox.dataset.attribute = key;
        
        // Set background color from config
        attrBox.style.backgroundColor = attr.color;
        
        // Add text color adjustments for better readability
        if (attr.color === '#0000FF' || attr.color === '#663399' || attr.color === '#555555' || 
            attr.color === '#2F4F4F' || attr.color == '#66D6FF') {
          attrBox.style.color = 'white';
          attrBox.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
        }
        
        // Add text color adjustment for push button (light yellow background)
        if (key === 'push') {
          attrBox.style.color = 'black';
          attrBox.style.textShadow = '0 0 3px rgba(255, 255, 255, 0.5)';
        }
        
        // Add text color adjustment for stop button
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
  
  /**
   * Set up attribute box handlers
   * @private
   */
  ChakraApp.AttributeController.prototype._setupAttributeBoxHandlers = function() {
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
  
  /**
   * Enable attribute boxes
   * @private
   */
  ChakraApp.AttributeController.prototype._enableAttributeBoxes = function() {
    // Make attribute boxes interactive
    var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box');
    attributeBoxes.forEach(function(box) {
      box.classList.add('interactive');
    });
    
    // Set up click handlers for attribute boxes
    this._setupAttributeBoxHandlers();
  };
  
  /**
   * Toggle attribute grid visibility
   * @param {boolean} show - Whether to show the grid
   */
  ChakraApp.AttributeController.prototype._toggleAttributeGrid = function(show) {
    if (!this.attributeGrid) return;
    
    if (show) {
      this.attributeGrid.classList.add('visible');
      this._enableAttributeBoxes(); // Enable the attribute boxes when showing
    } else {
      this.attributeGrid.classList.remove('visible');
      
      // Disable attribute boxes
      var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box');
      attributeBoxes.forEach(function(box) {
        box.classList.remove('interactive');
      });
    }
  };
  
  /**
   * Set up event subscriptions
   * @private
   */
  ChakraApp.AttributeController.prototype._setupEventSubscriptions = function() {
    var self = this;
    
    // Subscribe to circle selection events
    this.circleSelectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_SELECTED,
      function(circle) {
        self._toggleAttributeGrid(true);
      }
    );
    
    // Subscribe to circle deselection events
    this.circleDeselectedSubscription = ChakraApp.EventBus.subscribe(
      ChakraApp.EventTypes.CIRCLE_DESELECTED,
      function() {
        self._toggleAttributeGrid(false);
      }
    );
  };
  
  /**
   * Clean up resources
   */
  ChakraApp.AttributeController.prototype.destroy = function() {
    // Call parent destroy
    ChakraApp.BaseController.prototype.destroy.call(this);
    
    // Clean up event subscriptions
    if (this.circleSelectedSubscription) {
      this.circleSelectedSubscription();
      this.circleSelectedSubscription = null;
    }
    
    if (this.circleDeselectedSubscription) {
      this.circleDeselectedSubscription();
      this.circleDeselectedSubscription = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
