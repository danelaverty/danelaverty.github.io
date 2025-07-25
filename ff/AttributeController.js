// src/controllers/AttributeController.js - Part 1
(function(ChakraApp) {
  /**
   * Controls square attributes grid and interactions
   */
  ChakraApp.AttributeController = function() {
    // Generate unique instance ID for debugging
    this.instanceId = 'AC_' + Math.random().toString(36).substr(2, 9);
    
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
    this.currentStory = "Factors"; // Default story
    
    // Store the current selected category (null means no category is selected)
    this.selectedCategory = null;
    
    // Define story categories and their stories
    this.storyCategories = {
      "General": {
            "color": "#E8F4FD", // Light blue
            "stories": {
                  "Factors": {
                        "attributes": [
                              "cause",
                        ],
                        "color": "#B3D9FF" // Medium blue
                  },
                  "Directions": {
                        "attributes": [
			      "star",
                              "activity",
			      "example",
                        ],
                        "color": "#C3E9FF" // Medium blue
                  },
                  "Forces": {
                        "attributes": [
                              "magnet",
                              "departure",
                        ],
                        "color": "#D3F9FF" // Medium blue
                  },
                  /*"Interpretations": {
                        "attributes": [
                              "evidence",
                              "push",
                              "stop",
                              "bulbOn",
                              "bulbOff"
                        ],
                        "color": "#99CCFF" // Lighter blue
                  },*/
                  "Characters": {
                        "attributes": [
                              "me",
                              "ally",
                              "group"
                        ],
                        "color": "#E3FFFF" // Lighter blue
                  }
            }
      },
      "Classification": {
            "color": "#FFF8E1", // Light yellow/cream
            "stories": {
                  "Kind of Thing": {
                        "attributes": [
                              "physicalThing",
                              "activity",
                              "event",
                              "conceptualThing",
                              "words"
                        ],
                        "color": "#FFE082" // Golden yellow
                  },
                  "Describing the Thing": {
                        "attributes": [
                              "model",
                              "roleModel",
                              "trait"
                        ],
                        "color": "#FFCC02" // Bright yellow
                  },
                  "Patterns": {
                        "attributes": [
                              "feeling",
                              "action",
                              "thing"
                        ],
                        "color": "#FFF59D" // Pale yellow
                  }
            }
      },
      "🚶 Traveling": {
            "color": "#E8F5E8", // Light green
            "stories": {
                  "a road": {
                        "attributes": [
                              "me",
                              "milestone",
                              "destination"
                        ],
                        "color": "#A5D6A7" // Medium green
                  },
                  "a maze": {
                        "attributes": [
                              "me",
                              "door",
                              "destination"
                        ],
                        "color": "#81C784" // Darker green
                  }
            }
      },
      "⚔️ Fighting": {
            "color": "#FFEBEE", // Light red/pink
            "stories": {
                  "a demon": {
                        "attributes": [
                              "demon",
                              "sword",
                              "chain"
                        ],
                        "color": "#FF5350" // Red
                  },
                  "a war": {
                        "attributes": [
                              "battlefield",
                              "soldier",
                              "enemy"
                        ],
                        "color": "#FF8380" // Red
                  },
                  "a fire": {
                        "attributes": [
                              "fire",
                              "water",
                              "tree"
                        ],
                        "color": "#FFCDD2" // Light pink-red
                  }
            }
      },
      "🏆 Competing": {
            "color": "#FFF3E0", // Light orange
            "stories": {
                  "a race": {
                        "attributes": [
                              "me",
                              "competitor",
                              "milestone",
                              "destination"
                        ],
                        "color": "#FFB74D" // Medium orange
                  },
                  "a sport": {
                        "attributes": [
                              "me",
                              "teammate",
                              "competitor",
                              "soccerBall",
                              "goal",
                              "point"
                        ],
                        "color": "#FF9800" // Orange
                  },
                  "a game": {
                        "attributes": [
                              "me",
                              "competitor",
                              "myPiece",
                              "theirPiece"
                        ],
                        "color": "#FFCC80" // Light orange
                  },
                  /*"performance": {
                        "attributes": [
                              "me",
                              "competitor",
                              "judge",
                              "danceMove",
                              "point",
                              "fail"
                        ],
                        "color": "#FFE0B2" // Very light orange
                  }*/
            }
      },
      "💪 Challenge": {
            "color": "#F3E5F5", // Light purple
            "stories": {
                  "climb the mountain": {
                        "attributes": [
                              "me",
                              "mountain",
                              "milestone",
                              "destination",
                        ],
                        "color": "#BA68C8" // Medium purple
                  },
                  "get strong": {
                        "attributes": [
                              "me",
                              "exercise",
                              "strength",
                        ],
                        "color": "#9C27B0" // Purple
                  },
            }
      },
      "😖 Predicament": {
            "color": "#FFF8E1", // Light amber
            "stories": {
                  "too-big bite": {
                        "attributes": [
                              "chunk",
                              "cut",
                              "spit"
                        ],
                        "color": "#FFEB3B" // Amber
                  },
                  "a storm": {
                        "attributes": [
                              "storm",
                              "shelter"
                        ],
                        "color": "#FFC107" // Dark amber
                  }
            }
      },
      "🏃 Escaping": {
            "color": "#E1F5FE", // Light cyan
            "stories": {
                  "fire": {
                        "attributes": [
                              "me",
                              "fire",
                              "milestone",
                              "destination"
                        ],
                        "color": "#4FC3F7" // Cyan
                  },
                  "a dungeon": {
                        "attributes": [
                              "me",
                              "door",
                              "guard",
                              "lock",
                              "key",
                              "destination"
                        ],
                        "color": "#29B6F6" // Medium cyan
                  }
            }
      },
      "🔨 Building": {
            "color": "#EFEBE9", // Light brown
            "stories": {
                  "a machine": {
                        "attributes": [
                              "tools",
                              "parts",
                              "machine"
                        ],
                        "color": "#8D6E63" // Brown
                  },
                  "a building": {
                        "attributes": [
                              "site",
                              "bricks",
                              "building"
                        ],
                        "color": "#A1887F" // Light brown
                  }
            }
      },
      "🗺️ Finding": {
            "color": "#E8EAF6", // Light indigo
            "stories": {
                  "hidden treasure": {
                        "attributes": [
                              "treasure",
                              "mountain",
                              "pick"
                        ],
                        "color": "#7986CB" // Indigo
                  },
                  "a lost item": {
                        "attributes": [
                              "coin",
                              "hole",
                              "furniture"
                        ],
                        "color": "#9FA8DA" // Light indigo
                  }
            }
      },
      "🔍 Solving": {
            "color": "#FCE4EC", // Light pink
            "stories": {
                  "mystery": {
                        "attributes": [
                              "mystery",
                              "hypothesis",
                              "clue"
                        ],
                        "color": "#F06292" // Pink
                  },
                  "puzzle": {
                        "attributes": [
                              "picture",
                              "piece"
                        ],
                        "color": "#EC407A" // Medium pink
                  }
            }
      },
      "🖌️ Creating": {
            "color": "#F1F8E9", // Very light green
            "stories": {
                  "a book": {
                        "attributes": [
                              "conceptualThing",
                              "book",
                              "chapter",
                              "technique"
                        ],
                        "color": "#8BC34A" // Light green
                  },
                  "a painting": {
                        "attributes": [
                              "conceptualThing",
                              "picture",
                              "physicalThing",
                              "technique"
                        ],
                        "color": "#689F38" // Green
                  }
            }
      },
      "🗣 Speaking": {
            "color": "#E3F2FD", // Very light blue
            "stories": {
                  "a truth": {
                        "attributes": [
                              "conceptualThing",
                              "words",
                              "audience"
                        ],
                        "color": "#42A5F5" // Blue
                  }
            }
      },
      "🌷 Tending": {
            "color": "#F9FBE7", // Very light lime
            "stories": {
                  "a garden": {
                        "attributes": [
                              "flower",
                              "water",
                              "bug"
                        ],
                        "color": "#CDDC39" // Lime
                  },
                  "an injury": {
                        "attributes": [
                              "injury",
                              "remedy"
                        ],
                        "color": "#AFD135" // Darker lime
                  }
            }
      },
      "👥 Gathering": {
            "color": "#EDE7F6", // Light deep purple
            "stories": {
                  "a community": {
                        "attributes": [
                              "vision",
                              "person",
                              "words",
                              "activity"
                        ],
                        "color": "#7E57C2" // Deep purple
                  },
                  "a team": {
                        "attributes": [
                              "vision",
                              "teammate",
                              "strength",
                              "words",
                              "offer"
                        ],
                        "color": "#9575CD" // Light deep purple
                  }
            }
      }
};

    // Create flattened storyGroups for backward compatibility
    this.storyGroups = this._createFlattenedStoryGroups();

    // Define attribute information (migrated from config.js)
    this.attributeInfo = {
      "cause": {
            "emoji": "⚡",
            "color": "#9999CC",
            "displayName": "Factor"
      },
      "push": {
            "emoji": "🏃",
            "color": "#FFFFB0",
            "displayName": "Pushes"
      },
      "stop": {
            "emoji": "🛑",
            "color": "#BD2C2C",
            "displayName": "Stops"
      },
      "furniture": {
            "emoji": "🗄️",
            "color": "#66D6FF",
            "displayName": "Furniture"
      },
      "hole": {
            "emoji": "🕳️",
            "color": "#66D6FF",
            "displayName": "Hole"
      },
      "coin": {
            "emoji": "🥮",
            "color": "#66D6FF",
            "displayName": "Coin"
      },
      "treasure": {
            "emoji": "💎",
            "color": "#66D6FF",
            "displayName": "Treasure"
      },
      "mountain": {
            "emoji": "⛰️",
            "color": "#8B4513",
            "displayName": "Mountain"
      },
      "demon": {
            "emoji": "😈",
            "color": "#663399",
            "displayName": "Demons"
      },
      "sword": {
            "emoji": "🗡️",
            "color": "#C0C0C0",
            "displayName": "Swords"
      },
      "chain": {
            "emoji": "⛓️",
            "color": "#2F4F4F",
            "displayName": "Chains"
      },
      "ally": {
            "emoji": "🧝🏻‍♂️",
            "color": "#FF8C00",
            "displayName": "Allies"
      },
      "audience": {
            "emoji": "👥",
            "color": "#DDCC99",
            "displayName": "Audience"
      },
      "group": {
            "emoji": "👥",
            "color": "#DDCC99",
            "displayName": "Group"
      },
      "injury": {
            "emoji": "🤕",
            "color": "#DDCC99",
            "displayName": "Injury"
      },
      "remedy": {
            "emoji": "🩹",
            "color": "#DDCC99",
            "displayName": "Remedy"
      },
      "vision": {
            "emoji": "👁️",
            "color": "#DDCC99",
            "displayName": "Vision"
      },
      "me": {
            "emoji": "🧑🏼",
            "color": "#FFCC88",
            "displayName": "Me",
            "defaultName": "Me"
      },
      "person": {
            "emoji": "🧑🏻",
            "color": "#77DD77",
            "displayName": "Person"
      },
      "competitor": {
            "emoji": "🧑🏻",
            "color": "#DD7777",
            "displayName": "Competitor"
      },
      "myPiece": {
            "emoji": "♟️",
            "color": "#DDD",
            "displayName": "My Piece",
            "emojiCss": "brightness(4)"
      },
      "theirPiece": {
            "emoji": "♟️",
            "color": "#333",
            "displayName": "Their Piece"
      },
      "battlefield": {
            "emoji": "⚔️",
            "color": "#5B2503",
            "displayName": "Battlefield"
      },
      "soldier": {
            "emoji": "💂",
            "color": "#3366EE",
            "displayName": "Soldier"
      },
      "enemy": {
            "emoji": "💂",
            "color": "#8B0000",
            "displayName": "Enemy"
      },
      "strategy": {
            "emoji": "📝",
            "color": "#DADAC0",
            "displayName": "Strategy"
      },
      "map": {
            "emoji": "🗺️",
            "color": "#5B4072",
            "displayName": "Map"
      },
      "door": {
            "emoji": "🚪",
            "color": "#967CAB",
            "displayName": "Door"
      },
      "guard": {
            "emoji": "👮",
            "color": "#A8B0CC",
            "displayName": "Guard"
      },
      "key": {
            "emoji": "🔑",
            "color": "#D2C0AE",
            "displayName": "Key"
      },
      "fire": {
            "emoji": "🔥",
            "color": "#975",
            "displayName": "Fire"
      },
      "trophy": {
            "emoji": "🏆",
            "color": "#975",
            "displayName": "Trophy"
      },
      "lock": {
            "emoji": "🔒",
            "color": "#C4C4C4",
            "displayName": "Lock"
      },
      "destination": {
            "emoji": "🏁",
            "color": "#92C892",
            "displayName": "Destination"
      },
      "pick": {
            "emoji": "⛏️",
            "color": "#555555",
            "displayName": "Pick"
      },
      "tools": {
            "emoji": "🛠️",
            "color": "#555555",
            "displayName": "Tools"
      },
      "parts": {
            "emoji": "⚙️",
            "color": "#AAAAAA",
            "displayName": "Parts"
      },
      "machine": {
            "emoji": "🏗️",
            "color": "#666633",
            "displayName": "Machine"
      },
      "site": {
            "emoji": "🏞️",
            "color": "#B9DDA7",
            "displayName": "Site"
      },
      "bricks": {
            "emoji": "🧱",
            "color": "#EE7766",
            "displayName": "Bricks"
      },
      "building": {
            "emoji": "🏛️",
            "color": "#DDA",
            "displayName": "Building"
      },
      "event": {
            "emoji": "💥",
            "color": "#EECC99",
            "displayName": "Event"
      },
      "chapter": {
            "emoji": "📃",
            "color": "#EEEEEE",
            "displayName": "Chapter"
      },
      "book": {
            "emoji": "📕",
            "color": "#DDDDAA",
            "displayName": "Book"
      },
      "positive": {
            "emoji": "👍",
            "color": "#AADDAA",
            "displayName": "Positive"
      },
      "negative": {
            "emoji": "👎",
            "color": "#DDAAAA",
            "displayName": "Negative"
      },
      "problem": {
            "emoji": "🔥",
            "color": "#996622",
            "displayName": "Problem"
      },
      "evidence": {
            "emoji": "📃",
            "color": "#EEEEEE",
            "displayName": "Evidence"
      },
      "done": {
            "emoji": "✔️",
            "color": "#AAEEAA",
            "displayName": "Done"
      },
      "technique": {
            "emoji": "✍️",
            "color": "#C99",
            "displayName": "Technique"
      },
      "strength": {
            "emoji": "💪",
            "color": "#C99",
            "displayName": "Strength"
      },
      "offer": {
            "emoji": "💰",
            "color": "#C99",
            "displayName": "Offer"
      },
      "physicalThing": {
            "emoji": "🧊",
            "color": "#C99",
            "displayName": "Thing"
      },
      "activity": {
            "emoji": "🏃",
            "color": "#9CC",
            "displayName": "Activity"
      },
      "example": {
            "emoji": "🧭",
            "color": "#CCC",
            "displayName": "Example"
      },
      "conceptualThing": {
            "emoji": "💭",
            "color": "#C9C",
            "displayName": "Concept"
      },
      "words": {
            "emoji": "💬",
            "color": "#99C",
            "displayName": "Words"
      },
      "model": {
            "emoji": "🖼️",
            "color": "#2D7",
            "displayName": "Example"
      },
      "roleModel": {
            "emoji": "🕺",
            "color": "#D72",
            "displayName": "Role Model"
      },
      "trait": {
            "emoji": "⚡",
            "color": "#D27",
            "displayName": "Trait"
      },
      "mystery": {
            "emoji": "🤔",
            "color": "#858",
            "displayName": "Mystery"
      },
      "hypothesis": {
            "emoji": "💭",
            "color": "#77A",
            "displayName": "Hypothesis"
      },
      "picture": {
            "emoji": "🖼️",
            "color": "#7AA",
            "displayName": "Picture"
      },
      "piece": {
            "emoji": "🧩",
            "color": "#7AA",
            "displayName": "Piece"
      },
      "bug": {
            "emoji": "🐛",
            "color": "#7AA",
            "displayName": "Bug"
      },
      "flower": {
            "emoji": "🌷",
            "color": "#7AA",
            "displayName": "Flower"
      },
      "storm": {
            "emoji": "🌩️",
            "color": "#7AA",
            "displayName": "Storm"
      },
      "shelter": {
            "emoji": "🏠",
            "color": "#D7CA93",
            "displayName": "Shelter"
      },
      "clue": {
            "emoji": "🔍",
            "color": "#7AA",
            "displayName": "Clue"
      },
      "milestone": {
            "emoji": "📍",
            "color": "#D79393",
            "displayName": "Milestone"
      },
      "feeling": {
            "emoji": "⚪",
            "color": "#222",
            "displayName": "Feeling"
      },
      "action": {
            "emoji": "▶︎",
            "color": "#777",
            "displayName": "Action"
      },
      "thing": {
            "emoji": "🔺",
            "color": "#222",
            "displayName": "Thing"
      },
      "pattern": {
            "emoji": "⬡",
            "color": "#AA7",
            "displayName": "Pattern"
      },
      "victory": {
            "emoji": "🏆",
            "color": "#DC7",
            "displayName": "Victory"
      },
      "defeat": {
            "emoji": "🤕",
            "color": "#BBB",
            "displayName": "Defeat"
      },
      "chunk": {
            "emoji": "🥩",
            "color": "#EBB",
            "displayName": "Chunk"
      },
      "cut": {
            "emoji": "🔪",
            "color": "#DDD",
            "displayName": "Cut"
      },
      "spit": {
            "emoji": "💦",
            "color": "#BDE",
            "displayName": "Spit"
      },
      "star": {
            "emoji": "✨",
            "color": "#FE9",
            "displayName": "Goal"
      },
      "departure": {
            "emoji": "🛫",
            "color": "#AAE",
            "displayName": "Departure"
      },
      "magnet": {
            "emoji": "🧲",
            "color": "#EAA",
            "displayName": "Attractor"
      },
      "bulbOn": {
            "emoji": "💡",
            "color": "#EEA",
            "displayName": "On"
      },
      "bulbOff": {
            "emoji": "💡",
            "color": "#444",
            "displayName": "Off",
            "emojiCss": "grayscale(1) brightness(0.5)"
      },
      "point": {
            "emoji": "⭐",
            "color": "#FEA",
            "displayName": "Point"
      },
      "fail": {
            "emoji": "❌",
            "color": "#FAA",
            "displayName": "Fail"
      },
      "water": {
            "emoji": "💦",
            "color": "#667eea",
            "displayName": "Water"
      },
      "tree": {
            "emoji": "🌳",
            "color": "#c2e6c1",
            "displayName": "Tree"
      },
      "teammate": {
            "emoji": "🧑🏻",
            "color": "#67a1fe",
            "displayName": "Teammate"
      },
      "soccerBall": {
            "emoji": "⚽",
            "color": "#ffffff",
            "displayName": "Ball"
      },
      "goal": {
            "emoji": "🥅",
            "color": "#bbdcb7",
            "displayName": "Goal"
      },
      "judge": {
            "emoji": "👨‍⚖️",
            "color": "#e3e3e3",
            "displayName": "Judge"
      },
      "danceMove": {
            "emoji": "💃",
            "color": "#ff6666",
            "displayName": "Move"
      },
      "exercise": {
            "emoji": "🏋️",
            "color": "#f9eea9",
            "displayName": "Exercise"
      },
};
  };

  this.thingStoryGroups = ['Kind of Thing', 'Building the Thing', 'Finding the Thing'];
  
  // Inherit from BaseController
  ChakraApp.AttributeController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.AttributeController.prototype.constructor = ChakraApp.AttributeController;

  /**
   * Create flattened story groups with category separators for dropdown
   * @private
   * @returns {Object} Flattened story groups with category headers
   */
  ChakraApp.AttributeController.prototype._createFlattenedStoryGroups = function() {
    var flattened = {};
    var self = this;
    
    Object.keys(this.storyCategories).forEach(function(categoryName) {
      var categoryStories = self.storyCategories[categoryName].stories;
      Object.keys(categoryStories).forEach(function(storyName) {
        flattened[storyName] = categoryStories[storyName].attributes;
      });
    });
    
    return flattened;
  };

  /**
   * Get category for a given story
   * @param {string} storyName - Name of the story
   * @returns {string|null} Category name or null if not found
   */
  ChakraApp.AttributeController.prototype.getStoryCategory = function(storyName) {
    for (var categoryName in this.storyCategories) {
      if (this.storyCategories[categoryName].stories.hasOwnProperty(storyName)) {
        return categoryName;
      }
    }
    return null;
  };

  /**
   * Get all stories in a category
   * @param {string} categoryName - Name of the category
   * @returns {Object} Object with story names as keys and attribute arrays as values
   */
  ChakraApp.AttributeController.prototype.getStoriesInCategory = function(categoryName) {
    return this.storyCategories[categoryName] || {};
  };

  /**
   * Get all available categories
   * @returns {Array} Array of category names
   */
  ChakraApp.AttributeController.prototype.getCategories = function() {
    return Object.keys(this.storyCategories);
  };

  /**
   * Get attribute information for a given attribute key
   * @param {string} attributeKey - The attribute key
   * @returns {Object|null} Attribute info object or null if not found
   */
  ChakraApp.AttributeController.prototype.getAttributeInfo = function(attributeKey) {
    return this.attributeInfo[attributeKey] || null;
  };

  /**
   * Get all attribute information
   * @returns {Object} All attribute info
   */
  ChakraApp.AttributeController.prototype.getAllAttributeInfo = function() {
    return this.attributeInfo;
  };

  /**
   * Add or update attribute information
   * @param {string} attributeKey - The attribute key
   * @param {Object} attributeData - The attribute data (emoji, color, displayName, etc.)
   */
  ChakraApp.AttributeController.prototype.setAttributeInfo = function(attributeKey, attributeData) {
    this.attributeInfo[attributeKey] = attributeData;
  };
  
  // Initialize
  ChakraApp.AttributeController.prototype.init = function() {
    // Call parent init
    ChakraApp.BaseController.prototype.init.call(this);
    
    // Set the global reference to this instance
    ChakraApp.attributeController = this;
    
    // Get attribute grid element
    this.attributeGrid = document.getElementById('attribute-grid');
    
    // Create story dropdown
    this._createStorySelector();
    
    // Create attribute grid if needed
    this._createAttributeGrid();
    
    // Subscribe to circle events
    this._setupEventSubscriptions();
    
    // Initially hide everything since no circle is selected
    this._toggleAttributeGrid(false);
  };

  // AttributeController Part 2 - Story Selector Methods

  // Updated approach: Change actual dimensions instead of using CSS scale

ChakraApp.AttributeController.prototype._buildStorySelectorGrid = function() {
  var self = this;
  this.storySelector.innerHTML = '';
  
  // Add CSS for flexbox layout with dynamic sizing and card overlap effect
  var style = document.createElement('style');
  style.id = 'story-selector-styles';
  style.textContent = `
    /* Story selector container positioning */
    .story-selector-container {
      position: relative;
    }
    
    /* Toggle button wrapper - now contains both button and attribute grid */
    .story-toggle-wrapper {
      background-color: transparent;
      border-radius: 8px;
      min-height: 40px;
    }
    
    /* Attribute grid when inside toggle wrapper */
    .story-toggle-wrapper #attribute-grid {
      max-height: 60px;
      overflow-y: auto;
    }
    
    .story-toggle-wrapper #attribute-grid.visible {
      display: flex !important;
    }
    
    /* Adjust attribute box sizes when in horizontal layout */
    .story-toggle-wrapper .attribute-box {
      width: 55px !important;
      height: 42px !important;
      font-size: 8px !important;
      margin: 1px !important;
    }
    
    .story-toggle-wrapper .attribute-box .emoji {
      font-size: 20px !important;
      margin: 2px 0 !important;
    }
    
    .story-toggle-wrapper .attribute-box .attribute-name {
      line-height: 1 !important;
      margin-bottom: 1px !important;
      white-space: nowrap;
    }
    
    .story-toggle-wrapper .attribute-box .attribute-desc {
      display: none; /* Hide descriptions in compact layout */
    }
    
    /* Main story selector container - 2 column layout */
    .story-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
    }
    
    /* Override inline display styles when hidden */
    .story-selector[style*="display: none"] {
      display: none !important;
    }
    
    /* Override inline display styles when visible */
    .story-selector[style*="display: block"] {
      display: flex !important;
    }
    
    /* Category sections - each takes up roughly half the width */
    .story-category-section {
      width: 220px;
      margin-bottom: 2px;
    }
    
    .stories-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: flex-start;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      position: relative;
    }
    
    .story-box {
      border-radius: 8px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    
    /* Full size story boxes - normal spacing */
    .story-box.full-size {
      width: 100px;
      height: 100px;
      font-size: 10px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    
    .story-box.full-size .story-name {
      font-size: 15px;
      line-height: 1.1;
      margin-bottom: 2px;
      transition: all 0.3s ease;
    }
    
    .story-box.full-size .mini-attribute-box {
      width: 24px;
      height: 24px;
    }
    
    .story-box.full-size .emoji-span {
      font-size: 18px;
    }
    
    /* Small size story boxes - overlapping like cards in hand */
    .story-box.small-size {
      width: 50px;
      height: 50px;
      font-size: 7px;
      padding: 3px;
      margin-right: -20px; /* Negative margin creates overlap */
      margin-bottom: 4px;
      box-shadow: 1px 1px 2px rgba(0,0,0,1); /* Add shadow for depth */
    }
    
    /* First small card doesn't need left margin adjustment */
    .story-box.small-size:first-child {
      margin-left: 0;
    }
    
    /* Last small card in a row gets normal right margin */
    .story-box.small-size:last-child {
      margin-right: 8px;
    }
    
    /* Selected small card gets higher z-index */
    .story-box.small-size.selected {
      z-index: 5;
      box-shadow: 3px 3px 8px rgba(0,122,204,0.4);
    }
    
    .story-box.small-size .story-name {
      font-size: 7px;
      line-height: 1;
      margin-bottom: 1px;
      transition: all 0.3s ease;
    }
    
    .story-box.small-size .mini-attribute-box {
      width: 8px;
      height: 8px;
    }
    
    .story-box.small-size .emoji-span {
      font-size: 9px;
    }
    
    .attributes-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      justify-content: center;
      align-items: center;
    }
    
    .mini-attribute-box {
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .emoji-span {
      line-height: 1;
      transition: all 0.3s ease;
    }
    
    /* Special styling for stories grids containing small cards */
    .stories-grid.has-small-cards {
      overflow: visible; /* Allow shadows to show outside container */
    }
    
    /* Responsive behavior for smaller screens */
    @media (max-width: 600px) {
      .story-category-section {
        flex: 1 1 100%;
      }
      
      .story-toggle-button {
        width: 100px !important;
        font-size: 11px !important;
      }
    }
  `;
  
  // Remove existing styles if they exist
  var existingStyle = document.getElementById('story-selector-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  document.head.appendChild(style);
  
  // Build category sections (same as before)
  Object.keys(this.storyCategories).forEach(function(categoryName) {
    var categoryData = self.storyCategories[categoryName];
    
    // Create category section
    var categorySection = document.createElement('div');
    categorySection.className = 'story-category-section';
    
    // Create category header
    var categoryHeader = document.createElement('div');
    categoryHeader.className = 'story-category-header';
    categoryHeader.textContent = categoryName.toUpperCase();
    categoryHeader.dataset.category = categoryName;
    
    var isSelectedCategory = categoryName === self.selectedCategory;
    categoryHeader.style.cssText = `
      font-size: 12px;
      font-weight: bold;
      color: #666;
      margin-bottom: 2px;
      padding: 4px 8px;
      background-color: ${categoryData.color};
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid ${isSelectedCategory ? '#007ACC' : 'rgba(0,0,0,0.1)'};
      border-radius: 4px;
    `;
    
    // Add click handler for category header
    categoryHeader.addEventListener('click', function(e) {
      e.stopPropagation();
      self._selectCategory(categoryName);
    });
    
    categorySection.appendChild(categoryHeader);
    
    // Create stories grid for this category
    var storiesGrid = document.createElement('div');
    storiesGrid.className = 'stories-grid';
    storiesGrid.dataset.category = categoryName;
    
    // Add story boxes to the grid
    Object.keys(categoryData.stories).forEach(function(storyName) {
      var storyData = categoryData.stories[storyName];
      var storyBox = self._createStoryBox(storyName, storyData, categoryName);
      storiesGrid.appendChild(storyBox);
    });
    
    categorySection.appendChild(storiesGrid);
    self.storySelector.appendChild(categorySection);
  });
};

ChakraApp.AttributeController.prototype._createStoryBox = function(storyName, storyData, categoryName) {
  var self = this;
  var storyBox = document.createElement('div');
  storyBox.className = 'story-box';
  storyBox.dataset.story = storyName;
  storyBox.dataset.category = categoryName;
  
  var isSelected = storyName === this.currentStory;
  var isCategorySelected = categoryName === this.selectedCategory;
  
  // Set size class based on category selection
  var sizeClass = isCategorySelected ? 'full-size' : 'small-size';
  storyBox.classList.add(sizeClass);
  
  storyBox.style.cssText = `
    background-color: ${storyData.color};
    border: 2px solid ${isSelected ? '#007ACC' : 'transparent'};
    font-weight: ${isSelected ? 'bold' : '500'};
  `;
  
  // Create story name at the top
  var storyNameDiv = document.createElement('div');
  storyNameDiv.className = 'story-name';
  storyNameDiv.textContent = storyName;
  storyNameDiv.style.cssText = `
    font-weight: ${isSelected ? 'bold' : '500'};
  `;
  
  // Create attributes preview container
  var attributesContainer = document.createElement('div');
  attributesContainer.className = 'attributes-preview';
  
  // Create mini attribute boxes
  storyData.attributes.forEach(function(attributeKey) {
    var attributeInfo = self.attributeInfo[attributeKey];
    if (!attributeInfo) return;
    
    var miniAttrBox = document.createElement('div');
    miniAttrBox.className = 'mini-attribute-box';
    miniAttrBox.style.cssText = `
      background-color: ${attributeInfo.color};
    `;
    
    // Add emoji
    var emojiSpan = document.createElement('span');
    emojiSpan.className = 'emoji-span';
    emojiSpan.textContent = attributeInfo.emoji;
    
    // Apply special styling for certain attributes
    if (attributeInfo.emojiCss) {
	    emojiSpan.style.filter = attributeInfo.emojiCss;
    }
    
    miniAttrBox.appendChild(emojiSpan);
    attributesContainer.appendChild(miniAttrBox);
  });
  
  // Append both sections to the story box
  storyBox.appendChild(storyNameDiv);
  storyBox.appendChild(attributesContainer);
  
  // Add click handler with event stopping
  storyBox.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent event bubbling to document
    self._selectStory(this.dataset.story);
  });
  
  return storyBox;
};

ChakraApp.AttributeController.prototype._selectCategory = function(categoryName) {
  // Toggle category selection
  if (this.selectedCategory === categoryName) {
    this.selectedCategory = null; // Deselect if already selected
  } else {
    this.selectedCategory = categoryName; // Select new category
  }
  
  // Update all category headers
  var categoryHeaders = this.storySelector.querySelectorAll('.story-category-header');
  categoryHeaders.forEach(function(header) {
    var isSelected = header.dataset.category === this.selectedCategory;
    header.style.border = `2px solid ${isSelected ? '#007ACC' : 'rgba(0,0,0,0.1)'}`;
  }.bind(this));
  
  // Update all story boxes by changing their size classes
  var storyBoxes = this.storySelector.querySelectorAll('.story-box');
  storyBoxes.forEach(function(box, index) {
    var boxCategory = box.dataset.category;
    var shouldBeFullSize = boxCategory === this.selectedCategory;
    
    // Remove existing size classes and selected state
    box.classList.remove('full-size', 'small-size', 'selected');
    
    // Add appropriate size class
    if (shouldBeFullSize) {
      box.classList.add('full-size');
    } else {
      box.classList.add('small-size');
      
      // For small cards, add staggered z-index to create layered effect
      // Later cards in the DOM appear on top when overlapping
      box.style.zIndex = index + 1;
    }
    
    // If this is the currently selected story, mark it
    if (box.dataset.story === this.currentStory) {
      box.classList.add('selected');
    }
    
  }.bind(this));
  
  // Update stories grids to handle small card containers
  var storiesGrids = this.storySelector.querySelectorAll('.stories-grid');
  storiesGrids.forEach(function(grid) {
    var hasSmallCards = grid.querySelector('.story-box.small-size') !== null;
    
    if (hasSmallCards) {
      grid.classList.add('has-small-cards');
    } else {
      grid.classList.remove('has-small-cards');
    }
  });
};

ChakraApp.AttributeController.prototype._selectStory = function(storyName) {
  this.currentStory = storyName;
  
  // Update visual selection
  var storyBoxes = this.storySelector.querySelectorAll('.story-box');
  storyBoxes.forEach(function(box) {
    var isSelected = box.dataset.story === storyName;
    box.style.border = `2px solid ${isSelected ? '#007ACC' : 'transparent'}`;
    box.style.fontWeight = isSelected ? 'bold' : '500';
  });
  
  this._updateAttributeGrid();
  
  // Close the grid after selection and update button text
  this.isGridExpanded = false;
  this.storySelector.style.display = 'none';
  this._updateToggleButtonText();
};
  
ChakraApp.AttributeController.prototype._createStorySelector = function() {
  // Check if selector already exists to prevent duplicates
  var existingSelector = document.querySelector('.story-selector-container');
  if (existingSelector) {
    this.storySelectorContainer = existingSelector;
    this.storySelector = existingSelector.querySelector('.story-selector');
    this.storyToggleButton = existingSelector.querySelector('.story-toggle-button');
    this._getExistingAttributeBoxesFromDOM();
    return;
  }
  
  // Create main container
  var selectorContainer = document.createElement('div');
  selectorContainer.className = 'story-selector-container';
  selectorContainer.style.cssText = `
    margin: 3px 10px;
    display: none;
    max-width: 730px;
    border-radius: 8px;
    margin-bottom: 10px;
    position: relative;
  `;
  
  this.storySelectorContainer = selectorContainer;
  
  // Create wrapper for toggle button and attribute grid
  var toggleWrapper = document.createElement('div');
  toggleWrapper.className = 'story-toggle-wrapper';
  toggleWrapper.style.cssText = `
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 4px;
    gap: 8px;
    flex-wrap: wrap;
    flex-direction: column;
  `;
  
  // Create toggle button with fixed width
  this.storyToggleButton = document.createElement('div');
  this.storyToggleButton.className = 'story-toggle-button';
  this.storyToggleButton.style.cssText = `
    width: 120px;
    padding: 4px 8px;
    background-color: #666;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
  `;
  
  // Add toggle button content
  this._updateToggleButtonText();
  
  // Create the main selector element (initially hidden, positioned absolutely to not affect container width)
  this.storySelector = document.createElement('div');
  this.storySelector.className = 'story-selector';
  this.storySelector.style.cssText = `
    max-height: 720px;
    overflow-y: auto;
    display: none;
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: #AAA;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    margin-top: 4px;
  `;
  
  // Track if grid is expanded
  this.isGridExpanded = false;
  
  // Add click handler to toggle button
  var self = this;
  this.storyToggleButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent event bubbling
    self._toggleStoryGrid();
  });
  
  // Build the grid structure
  this._buildStorySelectorGrid();
  
  // Assemble the structure
  toggleWrapper.appendChild(this.storyToggleButton);
  
  // Move the attribute grid into the toggle wrapper if it exists
  if (this.attributeGrid) {
    // Remove from its current parent if it has one
    if (this.attributeGrid.parentNode) {
      this.attributeGrid.parentNode.removeChild(this.attributeGrid);
    }
    
    // Update attribute grid styles to work in the horizontal layout
    this.attributeGrid.style.cssText = `
      display: none;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
      flex-grow: 1;
      max-height: 60px;
      overflow-y: auto;
    `;
    
    toggleWrapper.appendChild(this.attributeGrid);
  }
  
  selectorContainer.appendChild(toggleWrapper);
  selectorContainer.appendChild(this.storySelector);
  
  // Add container to the DOM (but don't insert before attribute grid since it's now inside)
  var targetContainer = document.querySelector('#center-panel') || document.body;
  targetContainer.appendChild(selectorContainer);
  
  // Set up click-outside listener
  this._setupClickOutsideListener();
};

ChakraApp.AttributeController.prototype._setupClickOutsideListener = function() {
  var self = this;
  
  // Store reference to the listener so we can remove it later
  this.clickOutsideListener = function(event) {
    // Only close if grid is expanded
    if (!self.isGridExpanded) return;
    
    // Check if click is outside the story selector container
    if (self.storySelectorContainer && !self.storySelectorContainer.contains(event.target)) {
      self._closeStoryGrid();
    }
  };
  
  // Add the listener to document
  document.addEventListener('click', this.clickOutsideListener);
};

// Add method to close the story grid (similar to toggle but only closes)
ChakraApp.AttributeController.prototype._closeStoryGrid = function() {
  if (!this.isGridExpanded) return;
  
  this.isGridExpanded = false;
  this.storySelector.style.display = 'none';
  this._updateToggleButtonText();
};

ChakraApp.AttributeController.prototype._toggleStoryGrid = function() {
  if (!this.storySelector) return;
  
  this.isGridExpanded = !this.isGridExpanded;
  
  if (this.isGridExpanded) {
    this.storySelector.style.display = 'block';
  } else {
    this.storySelector.style.display = 'none';
  }
  
  this._updateToggleButtonText();
};

ChakraApp.AttributeController.prototype._updateToggleButtonText = function() {
  if (!this.storyToggleButton) return;
  
  var arrow = this.isGridExpanded ? '▼' : '▶';
  var category = this.getStoryCategory(this.currentStory);
  
  this.storyToggleButton.innerHTML = `
    <span>${this.currentStory}</span>
    <span style="margin-left: 10px;">${arrow}</span>
  `;
};

// AttributeController Part 3 - Remaining Methods

  /**
   * Get existing attribute boxes from DOM (for instances that reuse the dropdown)
   * @private
   */
  ChakraApp.AttributeController.prototype._getExistingAttributeBoxesFromDOM = function() {
    
    this.allAttributeBoxes = {};
    
    if (this.attributeGrid) {
      var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box');
      var self = this;
      
      attributeBoxes.forEach(function(box) {
        var attributeKey = box.dataset.attribute;
        if (attributeKey) {
          self.allAttributeBoxes[attributeKey] = box;
        }
      });
      
    }
  };
  
  /**
   * Create attribute grid
   * @private
   */
  ChakraApp.AttributeController.prototype._createAttributeGrid = function() {
    
    // If we already have attribute boxes (from reusing dropdown), don't recreate them
    if (this.allAttributeBoxes && Object.keys(this.allAttributeBoxes).length > 0) {
      this._updateAttributeGrid();
      return;
    }
    
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
        var attr = self.attributeInfo[key];
        
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
        if (['stop', 'battlefield', 'soldier', 'enemy', 'path', 'machine', 'feeling', 'goodFeeling', 'badFeeling', 'thing', 'mountain', 'bulbOff'].indexOf(key) > -1) {
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
	if (attr.emojiCss) {
		emojiDiv.style.filter = attr.emojiCss;
	}
        
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
        /* Style for story dropdown container */
        .story-dropdown-container {
          margin: 5px;
        }
        
        .story-dropdown {
          cursor: pointer;
        }
        
        /* Style for category headers in dropdown */
        .story-dropdown option:disabled {
          font-weight: bold;
          color: #666 !important;
          background-color: #f0f0f0;
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
  
  // Clear the grid and re-append in the correct order
  this.attributeGrid.innerHTML = '';
  
  // Show and append attribute boxes in the order they appear in the story definition
  var self = this;
  var shownCount = 0;
  storyAttributes.forEach(function(key) {
    if (self.allAttributeBoxes[key]) {
      self.allAttributeBoxes[key].style.display = 'block';
      self.attributeGrid.appendChild(self.allAttributeBoxes[key]);
      shownCount++;
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
    var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box[style*="display: block"]');
    
    attributeBoxes.forEach(function(box) {
      // Skip if already has event listener to prevent duplicates
      if (box.hasAttribute('data-listener-attached')) {
        return;
      }
      
      // Mark as having listener attached
      box.setAttribute('data-listener-attached', 'true');
      
      box.addEventListener('click', function() {
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
        var attributeData = self.attributeInfo[attributeType];
        
        // Determine the name to use - check if attribute has a defaultName
        var squareName = attributeData.defaultName || ChakraApp.Config.defaultName;
        
        // Create square
        var squareData = {
          circleId: ChakraApp.appState.selectedCircleId,
          x: randomX,
          y: randomY,
          color: attributeData.color,
          name: squareName, // Use the determined name (defaultName if available, otherwise global default)
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
    var attributeBoxes = this.attributeGrid.querySelectorAll('.attribute-box[style*="display: block"]');
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
  if (!this.attributeGrid || !this.storySelectorContainer) return;
  
  if (show) {
    this.attributeGrid.style.display = 'flex';
    this.attributeGrid.classList.add('visible');
    this.storySelectorContainer.style.display = 'block';
    this._enableAttributeBoxes();
  } else {
    this.attributeGrid.style.display = 'none';
    this.attributeGrid.classList.remove('visible');
    this.storySelectorContainer.style.display = 'none';
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
  
  // Clean up click-outside listener
  if (this.clickOutsideListener) {
    document.removeEventListener('click', this.clickOutsideListener);
    this.clickOutsideListener = null;
  }
};
  
})(window.ChakraApp = window.ChakraApp || {});
