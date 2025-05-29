(function(ChakraApp) {
  'use strict';
  
  ChakraApp.TriangleRenderer = {
    
    /**
     * Renders a triangle shape for a given circle view
     * @param {Object} circleView - The CircleView instance
     */
    render: function(circleView) {
      var completionLevel = this.getCompletionLevel(circleView);
      this.createTriangleShapeWrap(circleView, completionLevel);
      this.createTriangleShapeByCompletionLevel(circleView, completionLevel);
      circleView.element.appendChild(circleView.shapeWrap);
    },

    /**
     * Get the completion level for the triangle
     * @param {Object} circleView - The CircleView instance
     * @returns {string} Completion level
     */
    getCompletionLevel: function(circleView) {
      if (!circleView.viewModel.characteristics || !circleView.viewModel.characteristics.completion) {
        return "no-completion";
      }
      return circleView.viewModel.characteristics.completion;
    },

    /**
     * Create triangle shape wrapper
     * @param {Object} circleView - The CircleView instance
     * @param {string} completionLevel - Completion level
     */
    createTriangleShapeWrap: function(circleView, completionLevel) {
      circleView.shapeWrap = circleView._createElement('div', {
        className: 'shape-wrap triangle-wrap completion-' + completionLevel,
        style: this.getTriangleWrapStyles(),
        events: { click: this.getTriangleClickHandler(circleView) }
      });
    },

    /**
     * Get triangle wrap styles
     * @returns {Object} Style object
     */
    getTriangleWrapStyles: function() {
      return {
        position: 'absolute',
        width: '25px',
        height: '25px',
        cursor: 'pointer',
        backgroundColor: 'rgba(0,0,0,0.001)',
        zIndex: '10'
      };
    },

    /**
     * Get triangle click handler
     * @param {Object} circleView - The CircleView instance
     * @returns {Function} Click handler function
     */
    getTriangleClickHandler: function(circleView) {
      return function(e) {
        e.stopPropagation();
        if (!window.wasDragged) {
          circleView.viewModel.select();
        }
      };
    },

    /**
     * Create triangle shape based on completion level
     * @param {Object} circleView - The CircleView instance
     * @param {string} completionLevel - Completion level
     */
    createTriangleShapeByCompletionLevel: function(circleView, completionLevel) {
      var levelCreators = {
        "level0": this.createLevel0Triangle,
        "level1": this.createLevel1Triangle,
        "level2": this.createLevel2Triangle
      };
      
      var createMethod = levelCreators[completionLevel] || this.createLevel2Triangle;
      createMethod.call(this, circleView);
    },

    /**
     * Create level 0 triangle (dashed outline only)
     * @param {Object} circleView - The CircleView instance
     */
    createLevel0Triangle: function(circleView) {
      circleView.triangleShape = circleView._createElement('div', {
        className: 'triangle-shape level0',
        style: this.getLevel0TriangleStyles()
      });
      circleView.shapeWrap.appendChild(circleView.triangleShape);
    },

    /**
     * Get level 0 triangle styles
     * @returns {Object} Style object
     */
    getLevel0TriangleStyles: function() {
      return {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: 'transparent',
        border: '2px dashed rgba(255, 255, 255, .4)',
        transition: 'transform 0.3s ease',
        transform: 'translate(-1px, -2px)',
        zIndex: '5',
        pointerEvents: 'none'
      };
    },

    /**
     * Create level 1 triangle (partial fill with outline)
     * @param {Object} circleView - The CircleView instance
     */
    createLevel1Triangle: function(circleView) {
      this.createTriangleOutline(circleView);
      this.createTriangleShape(circleView);
      circleView.shapeWrap.appendChild(circleView.triangleShape);
      circleView.shapeWrap.appendChild(circleView.triangleOutline);
    },

    /**
     * Create triangle outline
     * @param {Object} circleView - The CircleView instance
     */
    createTriangleOutline: function(circleView) {
      circleView.triangleOutline = circleView._createElement('div', {
        className: 'triangle-outline',
        style: this.getTriangleOutlineStyles()
      });
    },

    /**
     * Get triangle outline styles
     * @returns {Object} Style object
     */
    getTriangleOutlineStyles: function() {
      return {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: 'transparent',
        border: '2px dashed rgba(255, 255, 255, .4)',
        transform: 'translate(-1px, -2px)',
        zIndex: '6',
        pointerEvents: 'none'
      };
    },

    /**
     * Create triangle shape for level 1
     * @param {Object} circleView - The CircleView instance
     */
    createTriangleShape: function(circleView) {
      circleView.triangleShape = circleView._createElement('div', {
        className: 'triangle-shape level1',
        style: this.getLevel1TriangleStyles(circleView)
      });
    },

    /**
     * Get level 1 triangle styles
     * @param {Object} circleView - The CircleView instance
     * @returns {Object} Style object
     */
    getLevel1TriangleStyles: function(circleView) {
      return {
        position: 'absolute',
        width: '25px',
        height: '25px',
        backgroundColor: circleView.viewModel.color,
        clipPath: 'polygon(20% 70%, 0% 100%, 100% 100%, 80% 70%)',
        transition: 'transform 0.3s ease',
        transform: 'scale(0.90)',
        zIndex: '5',
        pointerEvents: 'none'
      };
    },

    /**
     * Create level 2 triangle (full 3D pyramid)
     * @param {Object} circleView - The CircleView instance
     */
    createLevel2Triangle: function(circleView) {
      this.createMainTriangle(circleView);
      this.createPyramidSide(circleView);
      circleView.shapeWrap.appendChild(circleView.triangleShape);
      circleView.shapeWrap.appendChild(circleView.pyramidSide);
    },

    /**
     * Create main triangle for level 2
     * @param {Object} circleView - The CircleView instance
     */
    createMainTriangle: function(circleView) {
      circleView.triangleShape = circleView._createElement('div', {
        className: 'triangle-shape level2',
        style: this.getLevel2TriangleStyles(circleView)
      });
    },

    /**
     * Get level 2 triangle styles
     * @param {Object} circleView - The CircleView instance
     * @returns {Object} Style object
     */
    getLevel2TriangleStyles: function(circleView) {
      return {
        position: 'absolute',
        width: '30px',
        height: '30px',
        backgroundColor: circleView.viewModel.color,
        clipPath: 'polygon(45% 0%, 0% 100%, 90% 100%)',
        transition: 'transform 0.3s ease',
        transform: 'scale(0.90) translate(-3px, -3px)',
        zIndex: '5',
        pointerEvents: 'none'
      };
    },

    /**
     * Create pyramid side for level 2
     * @param {Object} circleView - The CircleView instance
     */
    createPyramidSide: function(circleView) {
      circleView.pyramidSide = circleView._createElement('div', {
        className: 'pyramid-side level2',
        style: this.getPyramidSideStyles(circleView)
      });
    },

    /**
     * Get pyramid side styles
     * @param {Object} circleView - The CircleView instance
     * @returns {Object} Style object
     */
    getPyramidSideStyles: function(circleView) {
      // Create a darker shade of the triangle color
      var darkerColor = ChakraApp.ColorUtils.createDarkerShade(circleView.viewModel.color);
      
      return {
        position: 'absolute',
        width: '30px',
        height: '30px',
        backgroundColor: darkerColor,
        clipPath: 'polygon(45% 0%, 90% 100%, 100% 70%)',
        transition: 'transform 0.3s ease',
        transform: 'scale(0.90) translate(-3px, -3px)',
        zIndex: '5',
        pointerEvents: 'none'
      };
    },

    /**
     * Update triangle completion level
     * @param {Object} circleView - The CircleView instance
     */
    updateTriangleCompletion: function(circleView) {
      var conceptType = circleView._getConceptTypeForCircle();
      if (conceptType && conceptType.shape === 'triangle' && circleView.shapeWrap) {
        var completionLevel = this.getCompletionLevel(circleView);
        
        // If this is a things panel circle with no completion level, 
        // we need to convert it to a circle-glow
        if (circleView.panelId === 'things' && completionLevel === "no-completion") {
          // Remove the existing triangle shape
          while (circleView.element.firstChild) {
            circleView.element.removeChild(circleView.element.firstChild);
          }
          
          // Render as simple circle glow instead
          circleView._renderSimpleCircleGlow();
          
          // Re-add the name element and closest indicator
          circleView.addNameElement();
          if (circleView.addClosestIndicator) {
            circleView.addClosestIndicator();
          }
        } else {
          // Update the triangle shape as usual
          circleView.shapeWrap.className = 'shape-wrap triangle-wrap completion-' + completionLevel;
          
          while (circleView.shapeWrap.firstChild) {
            circleView.shapeWrap.removeChild(circleView.shapeWrap.firstChild);
          }
          
          this.createTriangleShapeByCompletionLevel(circleView, completionLevel);
        }
      }
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
