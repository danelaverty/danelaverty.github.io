// Consolidated implementation for OverlappingSquaresManager.js

(function(ChakraApp) {
  /**
   * Manages overlapping squares and their combined name displays
   */
  ChakraApp.OverlappingSquaresManager = {
    // Store all the active overlapping groups
    groups: [],
    
    // Reference to the container for name lists
    container: null,
    
    /**
     * Initialize the manager
     */
    init: function() {
      // Create the container for name lists if it doesn't exist
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'overlapping-names-container';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '100';
        
        // Add to bottom panel
        var bottomPanel = document.getElementById('center-panel');
        if (bottomPanel) {
          bottomPanel.appendChild(this.container);
          console.log("Overlapping squares manager initialized");
        } else {
          console.error("Bottom panel not found, cannot initialize overlapping squares manager");
        }
      }
    },
    
    /**
     * Register an overlapping pair of squares
     * @param {Object} square1 - First square model
     * @param {Object} square2 - Second square model
     */
    registerOverlap: function(square1, square2) {
      if (!square1 || !square2) return;

      // Apply overlapping class to square DOM elements
      this._applyOverlappingClass(square1.id);
      this._applyOverlappingClass(square2.id);
      
      // Check if either square is already in a group
      var existingGroup = this._findGroupForSquare(square1.id) || this._findGroupForSquare(square2.id);
      
      if (existingGroup) {
        // Add squares to existing group if not already present
        if (!existingGroup.squares.includes(square1.id)) {
          existingGroup.squares.push(square1.id);
        }
        if (!existingGroup.squares.includes(square2.id)) {
          existingGroup.squares.push(square2.id);
        }
      } else {
        // Create a new group
        existingGroup = {
          id: ChakraApp.Utils.generateId(),
          squares: [square1.id, square2.id]
        };
        this.groups.push(existingGroup);
      }
      
      // Update the visual display
      this.updateNamesList(existingGroup);
      
      // Update emoji visibility for the group
      this._updateEmojiVisibility(existingGroup);
      
      return existingGroup;
    },
    
    /**
     * Remove overlap registration for a pair of squares
     * @param {string} square1Id - First square ID
     * @param {string} square2Id - Second square ID
     */
    removeOverlap: function(square1Id, square2Id) {
      // Find affected groups
      var group1 = this._findGroupForSquare(square1Id);
      var group2 = this._findGroupForSquare(square2Id);
      
      // If both squares in same group
      if (group1 && group1 === group2) {
        // Remove squares from group
        var idx1 = group1.squares.indexOf(square1Id);
        if (idx1 > -1) group1.squares.splice(idx1, 1);
        
        var idx2 = group1.squares.indexOf(square2Id);
        if (idx2 > -1) group1.squares.splice(idx2, 1);
        
        // Reset emoji visibility for removed squares
        this._showEmoji(square1Id);
        this._showEmoji(square2Id);
        
        // If group now has fewer than 2 squares, remove it
        if (group1.squares.length < 2) {
          this._removeGroup(group1);
        } else {
          // Otherwise update its display
          this.updateNamesList(group1);
          this._updateEmojiVisibility(group1);
        }
      }
      
      // Check if the squares need their overlapping class removed
      // Only remove if they're not in any groups anymore
      if (!this._findGroupForSquare(square1Id)) {
        this._removeOverlappingClass(square1Id);
      }
      
      if (!this._findGroupForSquare(square2Id)) {
        this._removeOverlappingClass(square2Id);
      }
    },
    
    /**
     * Update the names list display for a group
     * @param {Object} group - The group to update
     */
    updateNamesList: function(group) {
      if (!this.container) this.init();
      if (!group || !group.squares || group.squares.length < 2) return;
      
      var listId = 'overlapping-names-' + group.id;
      var namesList = document.getElementById(listId);
      
      // Create list element if it doesn't exist
      if (!namesList) {
        namesList = document.createElement('div');
        namesList.id = listId;
        namesList.className = 'combined-names-list';
        
        // Style for visibility
        namesList.style.position = 'absolute';
        namesList.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        namesList.style.color = 'white';
        namesList.style.borderRadius = '5px';
        namesList.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
        namesList.style.minWidth = '100px';
        namesList.style.maxWidth = '200px';
        namesList.style.zIndex = '50';
        namesList.style.pointerEvents = 'none';
        namesList.style.transform = 'translateX(-50%)';
        
        // Add to container
        this.container.appendChild(namesList);
      }
      
      // Get square names
      var names = [];
      var lowestSquare = null;
      var lowestY = -1;
      
      group.squares.forEach(function(squareId) {
        var square = ChakraApp.appState.getSquare(squareId);
        if (square) {
          names.push(square.name);
          
          // Track lowest square for positioning
          if (square.y > lowestY) {
            lowestSquare = square;
            lowestY = square.y;
          }
        }
      });
      
      // Update content
      if (names.length > 0) {
        var html = '<ul style="margin: 0; padding: 0 0 0 18px; list-style-type: disc; text-align: left;">';
        names.forEach(function(name) {
          html += '<li style="margin: 3px 0; line-height: 1.2; white-space: normal;">' + 
                  name + '</li>';
        });
        html += '</ul>';
        namesList.innerHTML = html;
        
        // Position below lowest square
        if (lowestSquare) {
          namesList.style.left = lowestSquare.x + 'px';
          namesList.style.top = (lowestSquare.y + 30) + 'px';
        }
        
        namesList.style.display = 'block';
      } else {
        namesList.style.display = 'none';
      }
    },
    
    /**
     * Clean up all overlapping groups
     */
    cleanup: function() {
      if (!this.container) return;
      
      // Remove all name lists
      this.container.innerHTML = '';
      
      // Reset emoji visibility for all squares before clearing groups
      this.groups.forEach(function(group) {
        group.squares.forEach(function(squareId) {
          var element = document.querySelector('.square[data-id="' + squareId + '"]');
          if (element) {
            // Show all emojis again
            var emojiElement = element.querySelector('.emoji');
            if (emojiElement) {
              emojiElement.style.display = '';
            }
          }
        });
      });
      
      // Clear groups
      this.groups = [];
      
      // Remove overlapping class from all squares
      var overlappingSquares = document.querySelectorAll('.square.overlapping');
      overlappingSquares.forEach(function(square) {
        square.classList.remove('overlapping');
      });
    },
    
    // Private helper methods
    
    /**
     * Find the group containing a square
     * @private
     * @param {string} squareId - Square ID to find
     * @returns {Object|null} The group or null if not found
     */
    _findGroupForSquare: function(squareId) {
      for (var i = 0; i < this.groups.length; i++) {
        if (this.groups[i].squares.includes(squareId)) {
          return this.groups[i];
        }
      }
      return null;
    },
    
    /**
     * Remove a group and its display
     * @private
     * @param {Object} group - Group to remove
     */
    _removeGroup: function(group) {
      // Show emojis for all squares in the group before removing it
      group.squares.forEach(function(squareId) {
        this._showEmoji(squareId);
      }, this);
      
      // Remove the names list
      var listId = 'overlapping-names-' + group.id;
      var namesList = document.getElementById(listId);
      if (namesList && namesList.parentNode) {
        namesList.parentNode.removeChild(namesList);
      }
      
      // Remove from groups array
      var index = this.groups.indexOf(group);
      if (index > -1) {
        this.groups.splice(index, 1);
      }
    },
    
    /**
     * Apply overlapping class to a square
     * @private
     * @param {string} squareId - Square ID
     */
    _applyOverlappingClass: function(squareId) {
      var element = document.querySelector('.square[data-id="' + squareId + '"]');
      if (element) {
        element.classList.add('overlapping');
      }
    },
    
    /**
     * Remove overlapping class from a square
     * @private
     * @param {string} squareId - Square ID
     */
    _removeOverlappingClass: function(squareId) {
      var element = document.querySelector('.square[data-id="' + squareId + '"]');
      if (element) {
        element.classList.remove('overlapping');
      }
    },
    
    /**
     * Update emoji visibility for a group - show emoji only on front-most square
     * @private
     * @param {Object} group - Group to update emoji visibility for
     */
    _updateEmojiVisibility: function(group) {
      if (!group || !group.squares || group.squares.length < 2) return;
      
      // Get all square elements in this group
      var squareElements = [];
      group.squares.forEach(function(squareId) {
        var element = document.querySelector('.square[data-id="' + squareId + '"]');
        if (element) {
          squareElements.push(element);
        }
      });
      
      if (squareElements.length < 2) return;
      
      // Find the front-most square (last in DOM order among the group)
      var parentElement = squareElements[0].parentElement;
      var allSquares = Array.from(parentElement.querySelectorAll('.square'));
      
      // Filter to only get squares from this group
      var groupSquares = allSquares.filter(function(el) {
        return group.squares.includes(el.getAttribute('data-id'));
      });
      
      // The last square in DOM order is the front-most
      var frontSquare = groupSquares[groupSquares.length - 1];
      var frontSquareId = frontSquare.getAttribute('data-id');
      
      // Hide emojis on all squares except the front one
      group.squares.forEach(function(squareId) {
        if (squareId === frontSquareId) {
          this._showEmoji(squareId);
        } else {
          this._hideEmoji(squareId);
        }
      }, this);
    },
    
    /**
     * Hide emoji on a square
     * @private
     * @param {string} squareId - Square ID
     */
    _hideEmoji: function(squareId) {
      var element = document.querySelector('.square[data-id="' + squareId + '"]');
      if (element) {
        var emojiElement = element.querySelector('.square-content');
        if (emojiElement) {
          emojiElement.style.display = 'none';
        }
      }
    },
    
    /**
     * Show emoji on a square
     * @private
     * @param {string} squareId - Square ID
     */
    _showEmoji: function(squareId) {
      var element = document.querySelector('.square[data-id="' + squareId + '"]');
      if (element) {
        var emojiElement = element.querySelector('.square-content');
        if (emojiElement) {
          emojiElement.style.display = '';
        }
      }
    }
  };
  
  // Add a global cleanup function that delegates to the manager
  ChakraApp.cleanupOverlappingGroups = function() {
    ChakraApp.OverlappingSquaresManager.cleanup();
  };
  
})(window.ChakraApp = window.ChakraApp || {});
