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
    this.storyDropdown = null;
    this.storyDropdownContainer = null;
    
    // Event subscriptions
    this.circleSelectedSubscription = null;
    this.circleDeselectedSubscription = null;
    
    // Store the current story selection
    this.currentStory = "Cause & Effects"; // Default story
    
    // Define story groups
    this.storyGroups = {
      "- GENERAL -": [],
      "Cause & Effects": ["cause", "push", "stop"],
      "Interpretations": ["positive", "negative", "evidence"],
      "Cast of Characters": ["me", "ally", "demon"],
      "- FEELINGS -": [],
      "Quest for Treasure": ["treasure", "mountain", "tools"],
      "Navigating a Maze": ["door", "lock", "key", "destination"],
      "Traveling a Road": ["me", "milestone", "destination"],
      "Battling Demons": ["demon", "sword", "chain"],
      "Battle for Conquest": ["battlefield", "soldier", "enemy", "strategy", "victory", "defeat"],
      "Building the Machine": ["tools", "parts", "machine"],
      "Solving a Mystery": ["mystery", "hypothesis", "clue"],
      "Writing the Book": ["chapter", "key", "book"],
      "A Too-Big Bite": ["chunk", "cut", "spit"],
      "- THINGS -": [],
      "Kind of Thing": ['physicalThing', 'behavioralThing', 'event', 'conceptualThing'],
      "Describing the Thing": ['model', 'roleModel', 'trait'],
      "- PATTERNS -": [],
      "Patterns": ['feeling', 'action', 'thing', 'pattern'],
    };
  };

  this.thingStoryGroups = ['Kind of Thing', 'Building the Thing', 'Finding the Thing'];
  
  // Inherit from BaseController
  ChakraApp.AttributeController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.AttributeController.prototype.constructor = ChakraApp.AttributeController;
  
  // Initialize
  ChakraApp.AttributeController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Get attribute grid element
    this.attributeGrid = document.getElementById('attribute-grid');
    
    // Create story dropdown
    this._createStoryDropdown();
    
    // Create attribute grid if needed
    this._createAttributeGrid();
    
    // Subscribe to circle events
    this._setupEventSubscriptions();
    
    // Initially hide everything since no circle is selected
    this._toggleAttributeGrid(false);
  };
  
  /**
   * Create story dropdown menu
   * @private
   */
  ChakraApp.AttributeController.prototype._createStoryDropdown = function() {
    // Create dropdown container
    var dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'story-dropdown-container';
    dropdownContainer.style.padding = '1px';
    dropdownContainer.style.display = 'none'; // Initially hidden
    dropdownContainer.style.alignItems = 'center';
    
    this.storyDropdownContainer = dropdownContainer;
    
    // Create select element
    this.storyDropdown = document.createElement('select');
    this.storyDropdown.className = 'story-dropdown';
    
    // Add options for each story
    var self = this;
    Object.keys(this.storyGroups).forEach(function(storyName) {
      var option = document.createElement('option');
      option.value = storyName;
      option.textContent = storyName;
      if (storyName === self.currentStory) {
        option.selected = true;
      }
      self.storyDropdown.appendChild(option);
    });
    
    // Handle dropdown change
    this.storyDropdown.addEventListener('change', function() {
      self.currentStory = this.value;
      self._updateAttributeGrid();
    });
    
    // Add dropdown to container
    dropdownContainer.appendChild(this.storyDropdown);
    
    // Add container above attribute grid
    if (this.attributeGrid && this.attributeGrid.parentNode) {
      this.attributeGrid.parentNode.insertBefore(dropdownContainer, this.attributeGrid);
    }
  };
  
  /**
   * Create attribute grid
   * @private
   */
  ChakraApp.AttributeController.prototype._createAttributeGrid = function() {
    // Create grid if it doesn't exist or is empty
    if (this.attributeGrid) {
      // Set initial display to none
      this.attributeGrid.style.display = 'none';
      
      // Clear existing children
      this.attributeGrid.innerHTML = '';
      
      // Define all attributes for later use
      this.allAttributeBoxes = {};
      
      // Get all attributes from all stories
      var allAttributes = [];
      var self = this;
      Object.keys(this.storyGroups).forEach(function(storyName) {
        allAttributes = allAttributes.concat(self.storyGroups[storyName]);
      });
      
      // Create all attribute boxes but keep them hidden initially
      allAttributes.forEach(function(key) {
        var attr = ChakraApp.Config.attributeInfo[key];
        
        // Skip if attribute not found in config
        if (!attr) return;
        
        // Create the attribute box
        var attrBox = document.createElement('div');
        attrBox.id = key + '-box';
        attrBox.className = 'attribute-box create-button';
        attrBox.dataset.attribute = key;
        attrBox.style.display = 'none'; // Hidden by default
        
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
        if (['door', 'stop', 'battlefield', 'soldier', 'enemy', 'path', 'destination', 'machine', 'feeling', 'thing', 'mountain'].indexOf(key) > -1) {
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
        
        // Store reference to the box
        self.allAttributeBoxes[key] = attrBox;
        
        // Add to grid
        self.attributeGrid.appendChild(attrBox);
      });
      
      // Update the grid to show the current story's attributes
      this._updateAttributeGrid();
      
      // Add CSS to style the grid layout
      var style = document.createElement('style');
      style.textContent = `
        /* Update attribute grid layout to include the new buttons */
        #attribute-grid {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          padding: 5px;
          gap: 8px;
          width: auto;
          max-width: 800px;
          justify-content: left;
        }
        
        /* Style for story dropdown container */
        .story-dropdown-container {
          margin: 5px;
        }
        
        .story-dropdown {
          cursor: pointer;
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
   * Update attribute grid to show only attributes for the current story
   * @private
   */
  ChakraApp.AttributeController.prototype._updateAttributeGrid = function() {
    if (!this.attributeGrid || !this.allAttributeBoxes) return;
    
    // Hide all attribute boxes first
    for (var key in this.allAttributeBoxes) {
      if (this.allAttributeBoxes.hasOwnProperty(key)) {
        this.allAttributeBoxes[key].style.display = 'none';
      }
    }
    
    // Get attributes for the current story
    var storyAttributes = this.storyGroups[this.currentStory] || [];
    
    // Show only the relevant attribute boxes
    var self = this;
    storyAttributes.forEach(function(key) {
      if (self.allAttributeBoxes[key]) {
        self.allAttributeBoxes[key].style.display = '';
      }
    });
    
    // Re-setup attribute box handlers since visibility changed
    if (this.attributeGrid.classList.contains('visible')) {
      this._setupAttributeBoxHandlers();
    }
  };
  
  /**
   * Set up attribute box handlers
   * @private
   */
  ChakraApp.AttributeController.prototype._setupAttributeBoxHandlers = function() {
    var self = this;
    
    // Find all visible attribute boxes
    var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box[style*="display: block"], .attribute-box:not([style*="display: none"])');
    
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
        var centerPanel = document.getElementById('center-panel');
        var panelRect = centerPanel.getBoundingClientRect();
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
          name: '???',
          attribute: attributeType
        };
        
        var square = ChakraApp.appState.addSquare(squareData);
        
        // Select the new square
        ChakraApp.appState.selectSquare(square.id);
      });
      
      // Update reference in the allAttributeBoxes object
      if (newBox.dataset.attribute && self.allAttributeBoxes) {
        self.allAttributeBoxes[newBox.dataset.attribute] = newBox;
      }
    });
  };
  
  /**
   * Enable attribute boxes
   * @private
   */
  ChakraApp.AttributeController.prototype._enableAttributeBoxes = function() {
    // Make attribute boxes interactive
    var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box[style*="display: block"], .attribute-box:not([style*="display: none"])');
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
    if (!this.attributeGrid || !this.storyDropdownContainer) return;
    
    if (show) {
      // Show the attribute grid and story dropdown
      this.attributeGrid.style.display = 'flex';
      this.attributeGrid.classList.add('visible');
      this.storyDropdownContainer.style.display = 'flex';
      
      // Enable the attribute boxes
      this._enableAttributeBoxes();
    } else {
      // Hide the attribute grid and story dropdown
      this.attributeGrid.style.display = 'none';
      this.attributeGrid.classList.remove('visible');
      this.storyDropdownContainer.style.display = 'none';
      
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
