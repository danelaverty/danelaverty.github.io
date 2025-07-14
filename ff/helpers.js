// src/utils/helpers.js
// Utility helper functions

(function(ChakraApp) {
	// Create the cleanupOverlappingGroups function in the global ChakraApp namespace
  ChakraApp.cleanupOverlappingGroups = function() {
    if (!ChakraApp.overlappingGroups) return;
    
    // Remove all combined names lists
    ChakraApp.overlappingGroups.forEach(function(group) {
      var namesListElement = document.getElementById('combined-names-' + group.id);
      if (namesListElement) {
        namesListElement.parentNode.removeChild(namesListElement);
      }
    });
    
    // Reset the groups array
    ChakraApp.overlappingGroups = [];
    
    // Remove overlapping class from all squares
    var overlappingSquares = document.querySelectorAll('.square.overlapping');
    overlappingSquares.forEach(function(square) {
      square.classList.remove('overlapping');
      delete square.dataset.overlapConnectionId;
    });
  };

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
      //var effectiveCount = squareCount + (circleName === ChakraApp.Config.defaultName ? 0 : 1);
      var effectiveCount = squareCount;
      
      // Get the chakra form index based on square count, with a fallback to the last form if count exceeds array length
      var formIndex = Math.min(effectiveCount, ChakraApp.Config.chakraForms.length - 1);
      
      return ChakraApp.Config.chakraForms[formIndex];
    },

    debugCircleConnections: function() {
  console.log('=== DEBUG CIRCLE CONNECTIONS ===');
  console.log('Circle references:', ChakraApp.appState.circleReferences.length);
  
  ChakraApp.appState.circleReferences.forEach(function(ref, index) {
    console.log('Reference', index + ':', {
      id: ref.id,
      sourceCircleId: ref.sourceCircleId,
      tabId: ref.tabId,
      tab: ChakraApp.appState.getTab(ref.tabId),
      sourceCircle: ChakraApp.appState.getCircle(ref.sourceCircleId)
    });
  });
  
  console.log('Total connections:', ChakraApp.appState.connections.size);
  var circleConnections = [];
  ChakraApp.appState.connections.forEach(function(conn, id) {
    if (conn.connectionType === 'circle') {
      circleConnections.push({
        id: id,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        isVisible: conn.isVisible
      });
    }
  });
  console.log('Circle connections:', circleConnections);
  
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    var circleConnectionViews = 0;
    ChakraApp.app.viewManager.connectionViews.forEach(function(view) {
      if (view.viewModel.connectionType === 'circle') {
        circleConnectionViews++;
      }
    });
    console.log('Circle connection views:', circleConnectionViews);
  }
  
  console.log('=== END DEBUG ===');
},

	debugCircleConnectionsDOM: function() {
  console.log('=== DEBUG CIRCLE CONNECTIONS DOM ===');
  
  // Check the left panel container
  var leftPanelContainer = document.getElementById('zoom-container-left');
  console.log('Left panel container exists:', !!leftPanelContainer);
  
  if (leftPanelContainer) {
    console.log('Left panel container children:', leftPanelContainer.children.length);
    for (var i = 0; i < leftPanelContainer.children.length; i++) {
      var child = leftPanelContainer.children[i];
      console.log('Left panel child', i, ':', child.id, child.className);
    }
  }
  
  // Check the circle line container
  var circleLineContainer = document.getElementById('circle-line-container');
  console.log('Circle line container exists:', !!circleLineContainer);
  
  if (circleLineContainer) {
    console.log('Circle line container parent:', circleLineContainer.parentNode ? circleLineContainer.parentNode.id : 'no parent');
    console.log('Circle line container children:', circleLineContainer.children.length);
    
    for (var i = 0; i < circleLineContainer.children.length; i++) {
      var child = circleLineContainer.children[i];
      console.log('Child', i, ':', {
        id: child.id,
        className: child.className,
        display: child.style.display,
        width: child.style.width,
        height: child.style.height,
        left: child.style.left,
        top: child.style.top,
        transform: child.style.transform
      });
    }
  }
  
  // Check all connection lines in the document
  var allConnectionLines = document.querySelectorAll('.connection-line');
  console.log('Total connection lines in DOM:', allConnectionLines.length);
  
  var circleConnectionLines = document.querySelectorAll('.connection-line.circle-connection');
  console.log('Circle connection lines in DOM:', circleConnectionLines.length);
  
  circleConnectionLines.forEach(function(line, index) {
    console.log('Circle connection line', index, ':', {
      id: line.id,
      display: line.style.display,
      width: line.style.width,
      height: line.style.height,
      position: line.style.left + ', ' + line.style.top,
      transform: line.style.transform,
      parent: line.parentNode ? line.parentNode.id : 'no parent'
    });
  });
  
  console.log('=== END DEBUG DOM ===');
},
	testCreateCircleConnection: function() {
  console.log('=== TESTING CIRCLE CONNECTION CREATION ===');
  
  // Get two circles
  var circles = Array.from(ChakraApp.appState.circles.values());
  if (circles.length < 2) {
    console.log('Need at least 2 circles to test');
    return;
  }
  
  var circle1 = circles[0];
  var circle2 = circles[1];
  
  console.log('Testing with circles:', circle1.name, 'and', circle2.name);
  
  // Create a test connection
  var connectionId = 'test-circle-connection';
  var testConnection = new ChakraApp.Connection({
    id: connectionId,
    sourceId: circle1.id,
    targetId: circle2.id,
    length: 100,
    isVisible: true,
    connectionType: 'circle',
    isDirectional: true
  });
  
  // Get the container
  var leftPanelContainer = document.getElementById('zoom-container-left');
  var circleLineContainer = leftPanelContainer.querySelector('#circle-line-container');
  
  if (!circleLineContainer) {
    circleLineContainer = document.createElement('div');
    circleLineContainer.id = 'circle-line-container';
    circleLineContainer.style.position = 'absolute';
    circleLineContainer.style.top = '0';
    circleLineContainer.style.left = '0';
    circleLineContainer.style.width = '100%';
    circleLineContainer.style.height = '100%';
    circleLineContainer.style.pointerEvents = 'none';
    circleLineContainer.style.zIndex = '3';
    leftPanelContainer.appendChild(circleLineContainer);
  }
  
  // Create the view manually
  var viewModel = new ChakraApp.ConnectionViewModel(testConnection);
  var view = new ChakraApp.ConnectionView(viewModel, circleLineContainer);
  
  console.log('Created test view:', view.element);
  
  // Check if it's visible
  setTimeout(() => {
    console.log('Test connection visibility check:');
    console.log('Element in DOM:', document.body.contains(view.element));
    console.log('Element styles:', view.element.style.cssText);
    ChakraApp.debugCircleConnectionsDOM();
  }, 500);
  
  console.log('=== END TEST ===');
},

	testBasicLine: function() {
  console.log('=== TESTING BASIC LINE CREATION ===');
  
  var leftPanelContainer = document.getElementById('zoom-container-left');
  if (!leftPanelContainer) {
    console.log('No left panel container found');
    return;
  }
  
  // Create a simple test line
  var testLine = document.createElement('div');
  testLine.id = 'test-line';
  testLine.style.position = 'absolute';
  testLine.style.left = '50px';
  testLine.style.top = '50px';
  testLine.style.width = '100px';
  testLine.style.height = '3px';
  testLine.style.backgroundColor = 'red';
  testLine.style.zIndex = '999';
  
  leftPanelContainer.appendChild(testLine);
  
  setTimeout(function() {
    console.log('Test line created, checking visibility...');
    var testLineCheck = document.getElementById('test-line');
    console.log('Test line exists in DOM:', !!testLineCheck);
    if (testLineCheck) {
      console.log('Test line position:', testLineCheck.getBoundingClientRect());
    }
  }, 500);
  
  console.log('=== END TEST ===');
},

	debugCircleConnectionState: function() {
  console.log('=== DEBUG CIRCLE CONNECTION STATE ===');
  
  // Check circle connections in appState
  var circleConnections = [];
  ChakraApp.appState.connections.forEach(function(conn, id) {
    if (conn.connectionType === 'circle') {
      circleConnections.push({
        id: id,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        visible: conn.isVisible
      });
    }
  });
  
  console.log('Circle connections in appState:', circleConnections.length);
  circleConnections.forEach(function(conn) {
    console.log('Connection:', conn.id, 'from', conn.sourceId, 'to', conn.targetId, 'visible:', conn.visible);
  });
  
  // Check circle connection views
  var circleViews = [];
  ChakraApp.app.viewManager.connectionViews.forEach(function(view, id) {
    if (view.viewModel && view.viewModel.connectionType === 'circle') {
      circleViews.push({
        id: id,
        sourceId: view.viewModel.sourceId,
        targetId: view.viewModel.targetId,
        elementExists: !!view.element,
        elementVisible: view.element ? view.element.style.display !== 'none' : false
      });
    }
  });
  
  console.log('Circle connection views:', circleViews.length);
  circleViews.forEach(function(view) {
    console.log('View:', view.id, 'from', view.sourceId, 'to', view.targetId, 
                'element exists:', view.elementExists, 'visible:', view.elementVisible);
  });
  
  console.log('=== END DEBUG ===');
},
	restoreCircleConnections: function() {
  console.log('Manually restoring circle connections');
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    ChakraApp.app.viewManager._updateCircleConnectionViews();
  }
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
