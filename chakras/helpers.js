// src/utils/helpers.js
// Utility helper functions

(function(ChakraApp) {
  // Create Utils namespace
  ChakraApp.Utils = {
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId: function() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    /**
     * Calculate the distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance
     */
    calculateDistance: function(x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },
    
    /**
     * Generate a consistent line ID for two squares
     * @param {string} id1 - First square ID
     * @param {string} id2 - Second square ID
     * @returns {string} Line ID
     */
    getLineId: function(id1, id2) {
      // Sort IDs to ensure consistent order regardless of which square is first
      var sortedIds = [id1, id2].sort();
      return 'connection-' + sortedIds[0] + '-' + sortedIds[1];
    },
    
    /**
     * Format a polygon point value
     * @param {number} val - Value to format
     * @returns {string} Formatted value as percentage
     */
    formatPolyPoint: function(val) {
      return (Math.round(10000 * ((val + 1) / 2)) / 100) + '%';
    },
    
    /**
     * Generate polygon points for SVG paths
     * @param {number} sides - Number of sides
     * @param {number} starFactor - Star factor (default: 1)
     * @param {number} borderPercent - Border percentage (default: 0.08)
     * @returns {string} Polygon points string for clip-path
     */
    getPolyPoints: function(sides, starFactor, borderPercent) {
      starFactor = starFactor || 1;
      borderPercent = borderPercent || 0.08;
      
      var eachAngle = 360 * starFactor / sides;
      var angles = [];
      
      for (var i = 0; i < sides; i++) {
        angles.push(eachAngle * i);
      }
      
      var coordinates = [];
      for (var j = 0; j < angles.length; j++) {
        var angle = angles[j];
        var radians = angle * (Math.PI / 180);
        var xVal = Math.cos(radians);
        var yVal = Math.sin(radians);
        coordinates.push({ x: xVal, y: yVal });
      }
      
      // Add first point again to close the shape
      coordinates.push({
        x: coordinates[0].x, 
        y: coordinates[0].y
      });
      
      var reverseShrunkCoordinates = [];
      for (var k = 0; k < coordinates.length; k++) {
        var coordinate = coordinates[k];
        reverseShrunkCoordinates.push({
          x: coordinate.x * (1 - borderPercent),
          y: coordinate.y * (1 - borderPercent)
        });
      }
      
      // Add points in reverse order
      for (var l = reverseShrunkCoordinates.length - 1; l >= 0; l--) {
        coordinates.push(reverseShrunkCoordinates[l]);
      }
      
      var coordinatesString = '';
      var self = this;
      coordinates.forEach(function(coordinate) {
        coordinatesString += self.formatPolyPoint(coordinate.x) + ' ' + self.formatPolyPoint(coordinate.y) + ', ';
      });
      
      // Remove trailing comma and space
      return 'polygon(' + coordinatesString.substring(0, coordinatesString.length - 2) + ')';
    },
    
    /**
     * Get the chakra form for a circle based on square count
     * @param {string} circleId - Circle ID
     * @param {string} circleName - Circle name
     * @param {number} squareCount - Number of squares
     * @returns {Array} Chakra form array
     */
    getChakraFormForCircle: function(circleId, circleName, squareCount) {
      // Add one to the count if the circle has a name other than the default
      var effectiveCount = squareCount + (circleName === ChakraApp.Config.defaultName ? 0 : 1);
      
      // Get the chakra form index based on square count, with a fallback to the last form if count exceeds array length
      var formIndex = Math.min(effectiveCount, ChakraApp.Config.chakraForms.length - 1);
      
      return ChakraApp.Config.chakraForms[formIndex];
    },
    
    /**
     * Debug log helper
     * @param {string} message - Log message
     * @param {any} data - Optional data to log
     */
    debugLog: function(message, data) {
      console.log('[DEBUG] ' + message, data || '');
      
      // Also update debug panel if it exists
      var debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        var logEntry = document.createElement('div');
        logEntry.textContent = message + ': ' + (data ? JSON.stringify(data) : '');
        debugPanel.appendChild(logEntry);
        
        // Keep only the last 10 entries
        while (debugPanel.childElementCount > 10) {
          debugPanel.removeChild(debugPanel.firstChild);
        }
        
        // Scroll to bottom
        debugPanel.scrollTop = debugPanel.scrollHeight;
      }
    }
  };

})(window.ChakraApp = window.ChakraApp || {});
