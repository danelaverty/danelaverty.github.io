// src/utils/DragHandler.js
// Updated version with Circle MultiSelectionManager integration

(function(ChakraApp) {
  /**
   * Unified drag handler that provides consistent dragging behavior
   * for circles, squares, and circle references
   */
  ChakraApp.DragHandler = {
    // Configuration
    DRAG_THRESHOLD: 5, // Minimum pixels to start dragging
    
    /**
     * Add drag functionality to any element
     * @param {Element} element - The element to make draggable
     * @param {Object} options - Drag configuration options
     */
    addDragFunctionality: function(element, options) {
      if (!element || !options) {
        console.error('DragHandler.addDragFunctionality: Missing element or options');
        return null;
      }
      
      var dragState = this._createDragState(element, options);
      this._attachEventListeners(dragState);
      
      return dragState;
    },
    
    /**
     * Create drag state object
     * @private
     */
    _createDragState: function(element, options) {
      return {
        // Elements
        element: element,
        parentElement: options.parentElement || element.parentNode,
        
        // View model and callbacks
        viewModel: options.viewModel,
        updatePosition: options.updatePosition || function(x, y) {
          if (this.viewModel && this.viewModel.updatePosition) {
            this.viewModel.updatePosition(x, y);
          }
        },
        
        // Drag configuration
        dragTargets: options.dragTargets || [element],
        dragClasses: options.dragClasses || [],
        isDragTarget: options.isDragTarget || this._defaultIsDragTarget,
        
        // Special behaviors
        enableSnapping: options.enableSnapping || false,
        snapThreshold: options.snapThreshold || ChakraApp.Config.meridian.snapThreshold,
        snapPosition: options.snapPosition || ChakraApp.Config.meridian.x,
        
        enableAttributeDrop: options.enableAttributeDrop || false,
        enableGroupDragging: options.enableGroupDragging || false,
        
        // Callbacks
        onDragStart: options.onDragStart || function() {},
        onDragMove: options.onDragMove || function() {},
        onDragEnd: options.onDragEnd || function() {},
        
        // State
        isDragging: false,
        isGroupDragging: false,
        startX: undefined,
        startY: undefined,
        originalX: 0,
        originalY: 0,
        currentHoverBox: null,
        
        // Event handlers (for cleanup)
        mouseMoveHandler: null,
        mouseUpHandler: null
      };
    },
    
    /**
     * Default drag target checker
     * @private
     */
    _defaultIsDragTarget: function(dragState, event) {
      var target = event.target;
      
      // Check if target is in dragTargets array
      if (dragState.dragTargets.includes(target)) {
        return true;
      }
      
      // Check if target has any of the drag classes
      if (dragState.dragClasses.some(function(cls) { 
        return target.classList.contains(cls); 
      })) {
        return true;
      }
      
      // Special case for SVG elements (for gem shapes)
      var svgTags = ['svg', 'polygon', 'path'];
      if (svgTags.includes(target.tagName) || target.closest('svg')) {
        return true;
      }
      
      return false;
    },
    
    /**
     * Attach event listeners
     * @private
     */
    _attachEventListeners: function(dragState) {
      var self = this;
      
      // Mouse down handler
      dragState.element.addEventListener('mousedown', function(e) {
        if (dragState.isDragTarget(dragState, e)) {
          self._handleMouseDown(dragState, e);
        }
      });
      
      // Create global handlers
      dragState.mouseMoveHandler = function(e) {
        self._handleMouseMove(dragState, e);
      };
      
      dragState.mouseUpHandler = function(e) {
        self._handleMouseUp(dragState, e);
      };
      
      // Add global listeners
      document.addEventListener('mousemove', dragState.mouseMoveHandler);
      document.addEventListener('mouseup', dragState.mouseUpHandler);
    },
    
    /**
     * Handle mouse down event
     * @private
     */
    _handleMouseDown: function(dragState, e) {
      e.preventDefault();
      
      // Reset drag state
      window.wasDragged = false;
      dragState.isDragging = false;
      
      // Store initial positions
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.originalX = dragState.viewModel.x || 0;
      dragState.originalY = dragState.viewModel.y || 0;
      
      // Check for group dragging
      if (dragState.enableGroupDragging) {
        if (dragState.viewModel.isSquare) {
          dragState.isGroupDragging = this._shouldEnableSquareGroupDragging(dragState);
        } else if (dragState.viewModel.isCircle) {
          dragState.isGroupDragging = this._shouldEnableCircleGroupDragging(dragState);
        }
      }
      
      // Call start callback
      dragState.onDragStart(dragState, e);
    },
    
    /**
     * Determine if group dragging should be enabled for squares
     * @private
     */
    _shouldEnableSquareGroupDragging: function(dragState) {
      if (!ChakraApp.MultiSelectionManager || !ChakraApp.MultiSelectionManager.hasSelection()) {
        return false;
      }
      
      var squareId = dragState.viewModel.id;
      
      // Check if this square is one of the multi-selected squares
      return ChakraApp.MultiSelectionManager.isSquareSelected(squareId);
    },
    
    /**
     * Determine if group dragging should be enabled for circles
     * @private
     */
    _shouldEnableCircleGroupDragging: function(dragState) {
      if (!ChakraApp.CircleMultiSelectionManager || !ChakraApp.CircleMultiSelectionManager.hasSelection()) {
        return false;
      }
      
      var circleId = dragState.viewModel.id;
      
      // Check if this circle is one of the multi-selected circles
      return ChakraApp.CircleMultiSelectionManager.isCircleSelected(circleId);
    },
    
    /**
     * Handle mouse move event
     * @private
     */
    _handleMouseMove: function(dragState, e) {
      if (dragState.startX === undefined || dragState.startY === undefined) return;
      
      e.preventDefault();
      
      // Calculate total movement from start
      var totalDx = Math.abs(e.clientX - dragState.startX);
      var totalDy = Math.abs(e.clientY - dragState.startY);
      var totalMovement = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
      
      // Only start dragging if we've moved beyond the threshold
      if (!dragState.isDragging && totalMovement >= this.DRAG_THRESHOLD) {
        this._startDragging(dragState);
      }
      
      if (dragState.isDragging) {
        this._performDrag(dragState, e);
      }
    },
    
    /**
     * Start the dragging operation
     * @private
     */
    _startDragging: function(dragState) {
      dragState.isDragging = true;
      window.wasDragged = true;
      
      // Add visual feedback
      dragState.element.style.zIndex = 20;
      dragState.element.classList.add('dragging');
      
      // Special handling for different element types
      if (dragState.viewModel.isSquare) {
        this._handleSquareDragStart(dragState);
      } else if (dragState.viewModel.isCircle) {
        this._handleCircleDragStart(dragState);
      }
    },
    
    /**
     * Perform the actual dragging
     * @private
     */
    _performDrag: function(dragState, e) {
  // Handle group dragging differently
  if (dragState.isGroupDragging) {
    this._handleGroupDrag(dragState, e);
    return;
  }
  
  // Calculate new position for individual dragging
  var newPosition = this._calculateNewPosition(dragState, e);
  
  // Handle snapping if enabled
  if (dragState.enableSnapping) {
    newPosition = this._handleSnapping(dragState, newPosition);
  }
  
  // Update position
  dragState.updatePosition.call(dragState, newPosition.x, newPosition.y);
  
  // Handle special drag behaviors
  if (dragState.enableAttributeDrop) {
    this._handleAttributeBoxHover(dragState);
  }
  
  // Handle real-time connection updates for circles
  if (dragState.viewModel.isCircle) {
    this._updateCircleConnectionsDuringDrag(dragState, newPosition.x, newPosition.y);
  }
  
  // Call move callback
  dragState.onDragMove(dragState, e, newPosition);
},
    
    /**
     * Calculate new position within bounds
     * @private
     */
	_calculateNewPosition: function(dragState, e) {
  var containerRect = dragState.parentElement.getBoundingClientRect();
  var elementWidth = dragState.element.clientWidth;
  var elementHeight = dragState.element.clientHeight;
  
  // For circles and circle references, calculate delta movement like squares
  if (dragState.viewModel.isCircle || dragState.viewModel.isCircleReference) {
    // Calculate delta movement from last position
    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;
    
    // Update start position for next calculation
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    
    // Get current position from element style
    var currentX = parseFloat(dragState.element.style.left) || 0;
    var currentY = parseFloat(dragState.element.style.top) || 0;
    
    // Calculate new position with bounds checking
    var newX = Math.max(elementWidth/2, Math.min(containerRect.width - elementWidth/2, currentX + dx));
    var newY = Math.max(elementHeight/2, Math.min(containerRect.height - elementHeight/2, currentY + dy));
    
    return { x: newX, y: newY };
  }
  
  // For squares, calculate delta movement (original logic)
  var dx = e.clientX - dragState.startX;
  var dy = e.clientY - dragState.startY;
  
  // Update start position for next calculation
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  
  var newX = Math.max(0, Math.min(containerRect.width - elementWidth, 
    dragState.viewModel.x + dx));
  var newY = Math.max(0, Math.min(containerRect.height - elementHeight, 
    dragState.viewModel.y + dy));
  
  return { x: newX, y: newY };
},
    
    /**
     * Handle snapping behavior
     * @private
     */
    _handleSnapping: function(dragState, position) {
      var distanceToSnap = Math.abs(position.x - dragState.snapPosition);
      
      if (distanceToSnap < dragState.snapThreshold) {
        dragState.element.classList.add('snapping');
        return { x: dragState.snapPosition, y: position.y };
      } else {
        dragState.element.classList.remove('snapping');
        return position;
      }
    },
    
    /**
     * Handle group dragging for both squares and circles
     * @private
     */
    _handleGroupDrag: function(dragState, e) {
      // Calculate delta movement
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      
      // Update start position for next movement calculation
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      
      // Handle group dragging based on element type
      if (dragState.viewModel.isSquare && ChakraApp.MultiSelectionManager) {
        // Use MultiSelectionManager to move all selected squares
        ChakraApp.MultiSelectionManager.moveSelectedSquares(
          dragState.viewModel,
          dx,
          dy,
          dragState.parentElement
        );
      } else if (dragState.viewModel.isCircle && ChakraApp.CircleMultiSelectionManager) {
        // Use CircleMultiSelectionManager to move all selected circles
        ChakraApp.CircleMultiSelectionManager.moveSelectedCircles(
          dx,
          dy,
          dragState.parentElement
        );
      }
    },
    
    /**
     * Handle attribute box hover for squares
     * @private
     */
    _handleAttributeBoxHover: function(dragState) {
      if (dragState.viewModel.isMe) return;
      
      var squareRect = dragState.element.getBoundingClientRect();
      var hoveredBox = null;
      var attributeBoxes = document.querySelectorAll('.attribute-box');
      
      for (var i = 0; i < attributeBoxes.length; i++) {
        var box = attributeBoxes[i];
        var boxRect = box.getBoundingClientRect();
        
        if (squareRect.left < boxRect.right && 
            squareRect.right > boxRect.left &&
            squareRect.top < boxRect.bottom &&
            squareRect.bottom > boxRect.top) {
          hoveredBox = box;
          break;
        }
      }
      
      // Update highlight
      if (dragState.currentHoverBox && dragState.currentHoverBox !== hoveredBox) {
        dragState.currentHoverBox.classList.remove('highlight');
      }
      
      if (hoveredBox) {
        hoveredBox.classList.add('highlight');
      }
      
      dragState.currentHoverBox = hoveredBox;
    },
    
    /**
     * Handle square drag start
     * @private
     */
    _handleSquareDragStart: function(dragState) {
      // Show connection radius on all visible squares in the same circle
      if (ChakraApp.appState.selectedCircleId) {
        var allSquareElements = document.querySelectorAll('.square[data-circle-id="' + 
          ChakraApp.appState.selectedCircleId + '"]');
        
        for (var i = 0; i < allSquareElements.length; i++) {
          if (allSquareElements[i] !== dragState.element) {
            allSquareElements[i].classList.add('square-dragging-active');
          }
        }
      }
    },
    
    /**
     * Handle circle drag start
     * @private
     */
    _handleCircleDragStart: function(dragState) {
      dragState.element.classList.add('no-transition');
    },
    
    /**
     * Update circle connections during drag
     * @private
     */
    _updateCircleConnectionsDuringDrag: function(dragState, newX, newY) {
      var circleId = dragState.viewModel.id;
      
      ChakraApp.appState.connections.forEach(function(connection, connectionId) {
        if (connection.connectionType === 'circle' && 
            (connection.sourceId === circleId || connection.targetId === circleId)) {
          
          var connectionView = null;
          if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.connectionViews) {
            connectionView = ChakraApp.app.viewManager.connectionViews.get(connectionId);
          }
          
          if (connectionView) {
            var sourceX, sourceY, targetX, targetY;
            
            if (connection.sourceId === circleId) {
              sourceX = newX;
              sourceY = newY;
              var targetCircle = ChakraApp.appState.getCircle(connection.targetId);
              if (targetCircle) {
                targetX = targetCircle.x;
                targetY = targetCircle.y;
              } else {
                return;
              }
            } else {
              targetX = newX;
              targetY = newY;
              var sourceCircle = ChakraApp.appState.getCircle(connection.sourceId);
              if (sourceCircle) {
                sourceX = sourceCircle.x;
                sourceY = sourceCircle.y;
              } else {
                return;
              }
            }
            
            if (typeof connectionView.updateCircleConnectionPosition === 'function') {
              connectionView.updateCircleConnectionPosition(sourceX, sourceY, targetX, targetY);
            } else {
              connectionView._updateLinePosition();
            }
          }
        }
      });
    },
    
    /**
     * Handle mouse up event
     * @private
     */
    _handleMouseUp: function(dragState, e) {
      if (dragState.isDragging) {
        this._endDragging(dragState);
      }
      
      // Reset drag state
      dragState.startX = undefined;
      dragState.startY = undefined;
      
      // Reset global drag flag after a delay
      setTimeout(function() {
        window.wasDragged = false;
      }, 50);
    },
    
    /**
     * End the dragging operation
     * @private
     */
    _endDragging: function(dragState) {
      dragState.isDragging = false;
      
      // Remove visual feedback
      var zIndex = dragState.viewModel.isSelected ? 15 : 10;
      if (dragState.element.classList.contains('overlapping')) {
        zIndex = 12;
      }
      dragState.element.style.zIndex = zIndex;
      dragState.element.classList.remove('dragging');
      
      // Handle attribute drop for squares
      if (dragState.enableAttributeDrop && dragState.currentHoverBox && !dragState.viewModel.isMe) {
        this._handleAttributeDrop(dragState);
      }
      
      // Clean up special drag states
      if (dragState.viewModel.isSquare) {
        this._handleSquareDragEnd(dragState);
      } else if (dragState.viewModel.isCircle) {
        this._handleCircleDragEnd(dragState);
      }
      
      // Clean up group dragging
      if (dragState.isGroupDragging) {
        if (dragState.viewModel.isSquare && ChakraApp.MultiSelectionManager) {
          ChakraApp.MultiSelectionManager.endGroupDragging();
        } else if (dragState.viewModel.isCircle && ChakraApp.CircleMultiSelectionManager) {
          ChakraApp.CircleMultiSelectionManager.endGroupDragging();
        }
        dragState.isGroupDragging = false;
      }
      
      // Reset hover state
      if (dragState.currentHoverBox) {
        dragState.currentHoverBox.classList.remove('highlight');
        dragState.currentHoverBox = null;
      }
      
      // Save state
      ChakraApp.appState.saveToStorageNow();
      
      // Call end callback
      dragState.onDragEnd(dragState);
    },
    
    /**
     * Handle attribute drop
     * @private
     */
    _handleAttributeDrop: function(dragState) {
      var attributeType = dragState.currentHoverBox.dataset.attribute;
      dragState.viewModel.applyAttribute(attributeType);
      
      // Return square to original position
      dragState.viewModel.updatePosition(dragState.originalX, dragState.originalY);
      
      dragState.currentHoverBox.classList.remove('highlight');
    },
    
    /**
     * Handle square drag end cleanup
     * @private
     */
    _handleSquareDragEnd: function(dragState) {
      // Hide connection radius on all squares
      var activeElements = document.querySelectorAll('.square-dragging-active');
      for (var i = 0; i < activeElements.length; i++) {
        activeElements[i].classList.remove('square-dragging-active');
      }
    },
    
    /**
     * Handle circle drag end cleanup
     * @private
     */
    _handleCircleDragEnd: function(dragState) {
      dragState.element.classList.remove('no-transition');
      
      // Final update of circle connections
      if (ChakraApp.app && ChakraApp.app.viewManager) {
        ChakraApp.app.viewManager._updateCircleConnectionViews();
      }
    },
    
    /**
     * Remove drag functionality from an element
     */
    removeDragFunctionality: function(dragState) {
      if (!dragState) return;
      
      // Remove global event listeners
      if (dragState.mouseMoveHandler) {
        document.removeEventListener('mousemove', dragState.mouseMoveHandler);
      }
      
      if (dragState.mouseUpHandler) {
        document.removeEventListener('mouseup', dragState.mouseUpHandler);
      }
      
      // Clear references
      dragState.element = null;
      dragState.viewModel = null;
      dragState.parentElement = null;
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
