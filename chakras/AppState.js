// src/state/AppState.js
// Central state management for the application

(function(ChakraApp) {
  /**
   * Application State Manager
   * Handles all application state and serves as the central store
   */
  ChakraApp.AppState = function() {
    // Inherit from Observable
    ChakraApp.Observable.call(this);
    
    // Core state
    this.circles = new Map();
    this.squares = new Map();
    this.connections = new Map();
    
    // UI state
    this.selectedCircleId = null;
    this.selectedSquareId = null;
    this.zoomLevel = 1.0;
    this.containerPosition = { x: 0, y: 0 };
    this.rightPanelVisible = false;
    
    // Setup event listeners
    this._setupEventListeners();
  };
  
  // Inherit from Observable
  ChakraApp.AppState.prototype = Object.create(ChakraApp.Observable.prototype);
  ChakraApp.AppState.prototype.constructor = ChakraApp.AppState;
  
  // State notification
  ChakraApp.AppState.prototype._notifyStateChanged = function(section, data) {
    this.notify({ section: section, data: data });
  };
  
  // Event Listeners
  ChakraApp.AppState.prototype._setupEventListeners = function() {
    var self = this;
    
    // Listen for square updates to update connections
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.SQUARE_UPDATED, function(square) {
      self._updateConnectionsForSquare(square.id);
    });
    
    // Circle selection shows related squares
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_SELECTED, function(circle) {
      self._handleCircleSelection(circle.id);
    });
    
    // Circle deselection hides all squares
    ChakraApp.EventBus.subscribe(ChakraApp.EventTypes.CIRCLE_DESELECTED, function() {
      self._handleCircleDeselection();
    });
  };
  
  // ----- Circle Operations -----
  
  ChakraApp.AppState.prototype.addCircle = function(circleData) {
    var circle;
    
    if (circleData instanceof ChakraApp.Circle) {
      circle = circleData;
    } else {
      circle = new ChakraApp.Circle(circleData);
    }
    
    this.circles.set(circle.id, circle);
    
    // Subscribe to circle changes
    var self = this;
    circle.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged('circles', circle);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('circles', circle);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_CREATED, circle);
    
    // Save state to localStorage
    this.saveToStorage();
    
    return circle;
  };
  
  ChakraApp.AppState.prototype.updateCircle = function(id, changes) {
    var circle = this.circles.get(id);
    if (!circle) return null;
    
    circle.update(changes);
    
    // Save state to localStorage
    this.saveToStorage();
    
    return circle;
  };
  
  ChakraApp.AppState.prototype.removeCircle = function(id) {
    if (!this.circles.has(id)) return false;
    
    var circle = this.circles.get(id);
    
    // Deselect if this was the selected circle
    if (this.selectedCircleId === id) {
      this.deselectCircle();
    }
    
    // Remove the circle
    this.circles.delete(id);
    
    // Remove all associated squares
    var self = this;
    this.squares.forEach(function(square, squareId) {
      if (square.circleId === id) {
        self.removeSquare(squareId);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('circles', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CIRCLE_DELETED, circle);
    
    // Save state to localStorage
    this.saveToStorage();
    
    return true;
  };
  
  ChakraApp.AppState.prototype.getCircle = function(id) {
    return this.circles.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllCircles = function() {
    return Array.from(this.circles.values());
  };
  
  ChakraApp.AppState.prototype.selectCircle = function(id) {
    // Deselect current selection if different
    if (this.selectedCircleId && this.selectedCircleId !== id) {
      this.deselectCircle();
    }
    
    var circle = this.circles.get(id);
    if (!circle) return null;
    
    this.selectedCircleId = id;
    circle.select();
    
    // Show right panel
    this.rightPanelVisible = true;
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, this.rightPanelVisible);
    
    return circle;
  };
  
  ChakraApp.AppState.prototype.deselectCircle = function() {
    if (!this.selectedCircleId) return false;
    
    var circle = this.circles.get(this.selectedCircleId);
    if (circle) {
      circle.deselect();
    }
    
    this.selectedCircleId = null;
    
    // Hide right panel
    this.rightPanelVisible = false;
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.PANEL_VISIBILITY_CHANGED, this.rightPanelVisible);
    
    return true;
  };
  
  // ----- Square Operations -----
  
  ChakraApp.AppState.prototype.addSquare = function(squareData) {
    var square;
    
    if (squareData instanceof ChakraApp.Square) {
      square = squareData;
    } else {
      square = new ChakraApp.Square(squareData);
    }
    
    this.squares.set(square.id, square);
    
    // Subscribe to square changes
    var self = this;
    square.subscribe(function(change) {
      if (change.type === 'update') {
        self._notifyStateChanged('squares', square);
        self._updateConnectionsForSquare(square.id);
      }
    });
    
    // Notify and publish event
    this._notifyStateChanged('squares', square);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_CREATED, square);
    
    // Update the associated circle's chakra form
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    // Create or update connections
    this._updateConnectionsForCircleId(square.circleId);
    
    // Save state to localStorage
    this.saveToStorage();
    
    return square;
  };
  
  ChakraApp.AppState.prototype.updateSquare = function(id, changes) {
    var square = this.squares.get(id);
    if (!square) return null;
    
    square.update(changes);
    
    // Save state to localStorage
    this.saveToStorage();
    
    return square;
  };
  
  ChakraApp.AppState.prototype.removeSquare = function(id) {
    if (!this.squares.has(id)) return false;
    
    var square = this.squares.get(id);
    
    // Deselect if selected
    if (this.selectedSquareId === id) {
      this.deselectSquare();
    }
    
    // Remove the square
    this.squares.delete(id);
    
    // Remove connections involving this square
    this._removeConnectionsForSquare(id);
    
    // Notify and publish event
    this._notifyStateChanged('squares', null);
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.SQUARE_DELETED, square);
    
    // Update the associated circle's chakra form
    if (square.circleId) {
      this._updateChakraFormForCircle(square.circleId);
    }
    
    // Save state to localStorage
    this.saveToStorage();
    
    return true;
  };
  
  ChakraApp.AppState.prototype.getSquare = function(id) {
    return this.squares.get(id) || null;
  };
  
  ChakraApp.AppState.prototype.getAllSquares = function() {
    return Array.from(this.squares.values());
  };
  
  ChakraApp.AppState.prototype.getSquaresForCircle = function(circleId) {
    var result = [];
    this.squares.forEach(function(square) {
      if (square.circleId === circleId) {
        result.push(square);
      }
    });
    return result;
  };
  
  ChakraApp.AppState.prototype.selectSquare = function(id) {
    // Deselect current selection if different
    if (this.selectedSquareId && this.selectedSquareId !== id) {
      this.deselectSquare();
    }
    
    var square = this.squares.get(id);
    if (!square) return null;
    
    this.selectedSquareId = id;
    square.select();
    
    return square;
  };
  
  ChakraApp.AppState.prototype.deselectSquare = function() {
    if (!this.selectedSquareId) return false;
    
    var square = this.squares.get(this.selectedSquareId);
    if (square) {
      square.deselect();
    }
    
    this.selectedSquareId = null;
    
    return true;
  };
  
  // ----- Connection Operations -----
  
  ChakraApp.AppState.prototype._createConnection = function(square1, square2) {
    var connectionId = ChakraApp.Utils.getLineId(square1.id, square2.id);
    
    // Calculate the distance between squares
    var distance = ChakraApp.Utils.calculateDistance(
      square1.x, square1.y, 
      square2.x, square2.y
    );
    
    // Get max visible connection length from config
    var maxLineLength = ChakraApp.Config.connections ? 
      ChakraApp.Config.connections.maxLineLength : 120;
    
    // Determine if connection should be visible
    var isVisible = distance <= maxLineLength;
    
    // Create or update the connection
    var connectionData = {
      id: connectionId,
      sourceId: square1.id,
      targetId: square2.id,
      length: distance,
      isVisible: isVisible,
      isHighlighted: false
    };
    
    // Create connection model if it doesn't exist
    if (!this.connections.has(connectionId)) {
      var connection = new ChakraApp.Connection(connectionData);
      this.connections.set(connectionId, connection);
    } else {
      // Update existing connection
      var existingConnection = this.connections.get(connectionId);
      existingConnection.update({
        length: distance,
        isVisible: isVisible
      });
    }
    
    return this.connections.get(connectionId);
  };
  
  ChakraApp.AppState.prototype._updateClosestMeConnection = function(circleId) {
    // Find the Me square
    var meSquare = null;
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe && square.visible) {
        meSquare = square;
      }
    });
    
    if (!meSquare) return;
    
    // Find all connections that involve the Me square
    var meConnections = [];
    var self = this;
    
    this.connections.forEach(function(conn) {
      if ((conn.sourceId === meSquare.id || conn.targetId === meSquare.id) && conn.isVisible) {
        meConnections.push(conn);
      }
    });
    
    if (meConnections.length === 0) {
      // No visible connections to Me square
      this._updateClosestSquareName(circleId, null);
      return;
    }
    
    // Find the shortest connection
    var shortestConnection = meConnections.reduce(function(shortest, conn) {
      return conn.length < shortest.length ? conn : shortest;
    }, meConnections[0]);
    
    // Reset highlights on all connections
    this.connections.forEach(function(conn) {
      if (conn.isHighlighted) {
        conn.update({ isHighlighted: false });
      }
    });
    
    // Highlight the shortest connection
    shortestConnection.update({ isHighlighted: true });
    
    // Get the other square ID
    var otherSquareId = shortestConnection.sourceId === meSquare.id 
      ? shortestConnection.targetId 
      : shortestConnection.sourceId;
    
    // Get the name of the closest square
    var closestSquare = this.squares.get(otherSquareId);
    if (closestSquare) {
      this._updateClosestSquareName(circleId, closestSquare.name);
    }
    
    // Save state to localStorage after updating connections
    this.saveToStorage();
  };
  
  ChakraApp.AppState.prototype._updateClosestSquareName = function(circleId, squareName) {
    var circle = this.circles.get(circleId);
    if (circle) {
      circle.update({ closestSquareName: squareName });
    }
  };
  
  ChakraApp.AppState.prototype._removeConnectionsForSquare = function(squareId) {
    var connectionsToRemove = [];
    
    // Find all connections involving this square
    this.connections.forEach(function(conn, connId) {
      if (conn.sourceId === squareId || conn.targetId === squareId) {
        connectionsToRemove.push(connId);
      }
    });
    
    // Remove the connections
    var self = this;
    connectionsToRemove.forEach(function(connId) {
      self.connections.delete(connId);
    });
    
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
    
    // Save state to localStorage after removing connections
    this.saveToStorage();
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForSquare = function(squareId) {
    var square = this.squares.get(squareId);
    if (!square || !square.visible) return;
    
    this._updateConnectionsForCircleId(square.circleId);
  };
  
  ChakraApp.AppState.prototype._updateConnectionsForCircleId = function(circleId) {
    // Get all visible squares for this circle
    var visibleSquares = this.getSquaresForCircle(circleId).filter(function(square) {
      return square.visible;
    });
    
    // Create connections between each pair of squares
    for (var i = 0; i < visibleSquares.length; i++) {
      for (var j = i + 1; j < visibleSquares.length; j++) {
        this._createConnection(visibleSquares[i], visibleSquares[j]);
      }
    }
    
    // Find the "Me" square and update the closest connection
    this._updateClosestMeConnection(circleId);
    
    // Notify about connection updates
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, circleId);
    
    // Save state to localStorage after updating connections
    this.saveToStorage();
  };
  
  ChakraApp.AppState.prototype._updateAllConnections = function() {
    // Clear all existing connections
    this.connections.clear();
    
    // If a circle is selected, update its connections
    if (this.selectedCircleId) {
      this._updateConnectionsForCircleId(this.selectedCircleId);
    }
    
    // Save state to localStorage after updating all connections
    this.saveToStorage();
  };
  
  // ----- UI State Operations -----
  
  ChakraApp.AppState.prototype.updateZoomLevel = function(level) {
    // Constrain zoom level
    this.zoomLevel = Math.max(0.5, Math.min(2.5, level));
    
    // Reset container position if zoom is back to default
    if (this.zoomLevel === 1.0) {
      this.containerPosition = { x: 0, y: 0 };
    }
    
    this._notifyStateChanged('ui', { zoomLevel: this.zoomLevel });
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.ZOOM_CHANGED, this.zoomLevel);
    
    // Save state to localStorage after updating zoom level
    this.saveToStorage();
  };
  
  ChakraApp.AppState.prototype.updateContainerPosition = function(position) {
    this.containerPosition = { x: position.x, y: position.y };
    this._notifyStateChanged('ui', { containerPosition: this.containerPosition });
    
    // Save state to localStorage after updating container position
    this.saveToStorage();
  };
  
  // ----- Circle Selection Handlers -----
  
  ChakraApp.AppState.prototype._handleCircleSelection = function(circleId) {
    var self = this;
    
    // Hide all squares first
    this.squares.forEach(function(square) {
      square.hide();
    });
    
    // Show only squares for the selected circle
    this.getSquaresForCircle(circleId).forEach(function(square) {
      square.show();
    });
    
    // Create or show the "Me" square for this circle if it doesn't exist
    this._ensureMeSquareExists(circleId);
    
    // Update connections
    this._updateConnectionsForCircleId(circleId);
  };
  
  ChakraApp.AppState.prototype._handleCircleDeselection = function() {
    var self = this;
    
    // Hide all squares
    this.squares.forEach(function(square) {
      square.hide();
    });
    
    // Deselect any selected square
    this.deselectSquare();
    
    // Clear connections
    this.connections.clear();
    ChakraApp.EventBus.publish(ChakraApp.EventTypes.CONNECTION_UPDATED, null);
  };
  
  ChakraApp.AppState.prototype._ensureMeSquareExists = function(circleId) {
    // Check if a "Me" square already exists for this circle
    var meSquare = null;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && square.isMe) {
        meSquare = square;
      }
    });
    
    if (meSquare) {
      // If exists, make sure it's visible
      meSquare.show();
    } else {
      // Create a new "Me" square
      this.addSquare({
        circleId: circleId,
        x: 200,
        y: 200,
        color: '#FFCC88',
        name: 'Me',
        isMe: true
      });
    }
  };
  
  ChakraApp.AppState.prototype._updateChakraFormForCircle = function(circleId) {
    var circle = this.circles.get(circleId);
    if (!circle) return;
    
    // Count the non-Me squares for this circle
    var squareCount = 0;
    
    this.squares.forEach(function(square) {
      if (square.circleId === circleId && !square.isMe) {
        squareCount++;
      }
    });
    
    // Notify about the chakra form update
    circle.update({ squareCount: squareCount });
    
    // Save state to localStorage after updating chakra form
    this.saveToStorage();
  };
  
  // ----- Storage Operations -----
  
  ChakraApp.AppState.prototype.loadFromStorage = function() {
    try {
      var savedData = localStorage.getItem('chakraVisualizerData');
      if (!savedData) return false;
      
      var data = JSON.parse(savedData);
      
      // Reset current state
      this.circles.clear();
      this.squares.clear();
      this.connections.clear();
      this.selectedCircleId = null;
      this.selectedSquareId = null;
      
      // Load circles
      if (data.circles && Array.isArray(data.circles)) {
        var self = this;
        data.circles.forEach(function(circleData) {
          self.addCircle(circleData);
        });
      }
      
      // Load squares
      if (data.squares && Array.isArray(data.squares)) {
        var self = this;
        data.squares.forEach(function(squareData) {
          self.addSquare(squareData);
        });
      }
      
      // Load UI state
      if (data.zoomLevel) {
        this.zoomLevel = data.zoomLevel;
        ChakraApp.EventBus.publish(ChakraApp.EventTypes.ZOOM_CHANGED, this.zoomLevel);
      }
      
      if (data.containerPosition) {
        this.containerPosition = data.containerPosition;
      }
      
      // Hide all squares initially
      var self = this;
      this.squares.forEach(function(square) {
        square.hide();
      });
      
      // Notify and publish event
      this._notifyStateChanged('all', data);
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_LOADED, data);
      
      return true;
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      return false;
    }
  };
  
  ChakraApp.AppState.prototype.saveToStorage = function() {
    try {
      var circles = [];
      this.circles.forEach(function(circle) {
        circles.push(circle.toJSON());
      });
      
      var squares = [];
      this.squares.forEach(function(square) {
        squares.push(square.toJSON());
      });
      
      var data = {
        circles: circles,
        squares: squares,
        zoomLevel: this.zoomLevel,
        containerPosition: this.containerPosition
      };
      
      localStorage.setItem('chakraVisualizerData', JSON.stringify(data));
      
      // Publish event
      ChakraApp.EventBus.publish(ChakraApp.EventTypes.STATE_SAVED, data);
      
      console.log('State saved to localStorage');
      
      return true;
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
      return false;
    }
  };
  
  // ----- Create the singleton instance -----
  ChakraApp.appState = new ChakraApp.AppState();
  
})(window.ChakraApp = window.ChakraApp || {});
