(function(ChakraApp) {
  'use strict';
  
  ChakraApp.SimpleShapeRenderer = {
    
    /**
     * Renders a star shape
     * @param {Object} circleView - The CircleView instance
     */
    renderStar: function(circleView) {
      var self = this;
      circleView.createShapeWrap('star-wrap');
      
      var styles = circleView.getBaseShapeStyles(circleView.viewModel.color);
      styles.clipPath = 'polygon(10% 10%, 90% 50%, 10% 90%)';
      styles.transform = 'translate(-50%, -50%)';
      
      circleView.starShape = circleView.createShapeElement('star-shape', styles);
      
      // Add explicit click handler to the shape wrap
      this.addClickHandler(circleView);
      
      circleView.appendShapeToElement();
    },

    /**
     * Renders a hexagon shape as a cluster of mini standard, triangle, and star
     * @param {Object} circleView - The CircleView instance
     */
    renderHexagon: function(circleView) {
      circleView.createShapeWrap('hexagon-wrap');
      
      // Create container for the cluster
      var clusterContainer = circleView._createElement('div', {
        className: 'hexagon-cluster-container',
        style: {
          position: 'absolute',
          width: '30px',
          height: '30px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }
      });
      
      // Create mini standard circle (top)
      this._createMiniStandardCircle(circleView, clusterContainer, {
        x: '50%',
        y: '15%',
        size: '13px'
      });
      
      // Create mini triangle (bottom left)
      this._createMiniTriangle(circleView, clusterContainer, {
        x: '20%',
        y: '70%',
        size: '13px'
      });
      
      // Create mini star (bottom right)
      this._createMiniStar(circleView, clusterContainer, {
        x: '80%',
        y: '70%',
        size: '13px'
      });
      
      circleView.shapeWrap.appendChild(clusterContainer);
      
      // Add explicit click handler to the shape wrap
      this.addClickHandler(circleView);
      
      circleView.appendShapeToElement();
    },

    /**
     * Create a mini standard circle for the cluster
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} container - Container element
     * @param {Object} position - Position and size info
     */
    _createMiniStandardCircle: function(circleView, container, position) {
      var miniCircle = circleView._createElement('div', {
        className: 'mini-standard-circle',
        style: {
          position: 'absolute',
          width: position.size,
          height: position.size,
          borderRadius: '50%',
          backgroundColor: circleView.viewModel.color,
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 3px rgba(255, 255, 255, 0.5)',
          zIndex: '3',
          pointerEvents: 'none',
	      webkitFilter: 'blur(2px)',
        }
      });
      
      container.appendChild(miniCircle);
      
      // Store reference for color updates
      if (!circleView.miniShapes) circleView.miniShapes = [];
      circleView.miniShapes.push({type: 'standard', element: miniCircle});
    },

    /**
     * Create a mini triangle for the cluster
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} container - Container element
     * @param {Object} position - Position and size info
     */
    _createMiniTriangle: function(circleView, container, position) {
      var miniTriangle = circleView._createElement('div', {
        className: 'mini-triangle',
        style: {
          position: 'absolute',
          width: position.size,
          height: position.size,
          backgroundColor: circleView.viewModel.color,
          clipPath: 'polygon(45% 0%, 0% 100%, 90% 100%)',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
          zIndex: '3',
          pointerEvents: 'none'
        }
      });
      container.appendChild(miniTriangle);
      

      var miniPyramidSide = circleView._createElement('div', {
        className: 'mini-pyramid-side',
        style: {
          position: 'absolute',
          width: position.size,
          height: position.size,
          backgroundColor: ChakraApp.ColorUtils.createDarkerShade(circleView.viewModel.color),
        clipPath: 'polygon(45% 0%, 90% 100%, 100% 70%)',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
          zIndex: '3',
          pointerEvents: 'none'
        }
      });
      container.appendChild(miniPyramidSide);

      // Store reference for color updates
      if (!circleView.miniShapes) circleView.miniShapes = [];
      circleView.miniShapes.push({type: 'triangle', element: miniTriangle});
    },

    /**
     * Create a mini star for the cluster
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} container - Container element
     * @param {Object} position - Position and size info
     */
    _createMiniStar: function(circleView, container, position) {
      var miniStar = circleView._createElement('div', {
        className: 'mini-star',
        style: {
          position: 'absolute',
          width: position.size,
          height: position.size,
          backgroundColor: circleView.viewModel.color,
      clipPath: 'polygon(10% 10%, 90% 50%, 10% 90%)',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
          zIndex: '3',
          pointerEvents: 'none'
        }
      });
      
      container.appendChild(miniStar);
      
      // Store reference for color updates
      if (!circleView.miniShapes) circleView.miniShapes = [];
      circleView.miniShapes.push({type: 'star', element: miniStar});
    },

    /**
     * Renders a diamond shape
     * @param {Object} circleView - The CircleView instance
     */
    renderDiamond: function(circleView) {
      this.renderBasicShape(circleView, 'diamond', 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)');
    },

    /**
     * Renders an oval shape
     * @param {Object} circleView - The CircleView instance
     */
    renderOval: function(circleView) {
      circleView.createShapeWrap();
      var styles = circleView.getBaseShapeStyles();
      styles.width = '30px';
      styles.height = '20px';
      styles.borderRadius = '50%';
      styles.transform = 'translate(-50%, -50%)';
      
      circleView.ovalShape = circleView.createShapeElement('oval-shape', styles);
      this.addClickHandler(circleView);
      circleView.appendShapeToElement();
    },

    /**
     * Renders a basic shape with clip path
     * @param {Object} circleView - The CircleView instance
     * @param {string} shapeType - Type of shape
     * @param {string} clipPath - CSS clip path
     */
    renderBasicShape: function(circleView, shapeType, clipPath) {
      circleView.createShapeWrap();
      var styles = circleView.getBaseShapeStyles();
      styles.clipPath = clipPath;
      styles.transform = 'translate(-50%, -50%)';
      
      circleView[shapeType + 'Shape'] = circleView.createShapeElement(shapeType + '-shape', styles);
      this.addClickHandler(circleView);
      circleView.appendShapeToElement();
    },

    /**
     * Adds click handler to shape wrap
     * @param {Object} circleView - The CircleView instance
     */
    addClickHandler: function(circleView) {
      circleView.shapeWrap.style.cursor = "pointer";
      circleView.shapeWrap.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!window.wasDragged) {
          circleView._handleCircleClick();
        }
      });
    },

    /**
     * Updates colors for simple shapes including the new hexagon cluster
     * @param {Object} circleView - The CircleView instance
     */
    updateColors: function(circleView) {
      // Handle star shapes
      if (circleView.viewModel.circleType === 'star' && circleView.starShape) {
        circleView.starShape.style.backgroundColor = circleView.viewModel.color;
        
        // If the star has any specific styling elements, update those as well
        var starElement = circleView.element.querySelector('.star-shape');
        if (starElement) {
          starElement.style.backgroundColor = circleView.viewModel.color;
        }
      }

      // Handle hexagon cluster shapes
      if (circleView.viewModel.circleType === 'hexagon') {
        // Update mini shapes in the cluster
        if (circleView.miniShapes) {
          circleView.miniShapes.forEach(function(miniShape) {
            miniShape.element.style.backgroundColor = circleView.viewModel.color;
          });
        }
        
        // Also update any mini shapes found in the DOM
        var miniElements = circleView.element.querySelectorAll('.mini-standard-circle, .mini-triangle, .mini-star');
        for (var i = 0; i < miniElements.length; i++) {
          miniElements[i].style.backgroundColor = circleView.viewModel.color;
        }

        var miniElements = circleView.element.querySelectorAll('.mini-pyramid-side');
        for (var i = 0; i < miniElements.length; i++) {
          miniElements[i].style.backgroundColor = ChakraApp.ColorUtils.createDarkerShade(circleView.viewModel.color);
        }
      }

      // Handle diamond shapes
      if (circleView.viewModel.circleType === 'diamond' && circleView.diamondShape) {
        circleView.diamondShape.style.backgroundColor = circleView.viewModel.color;
        
        // Also update any diamond shapes found in the DOM
        var diamondElements = circleView.element.querySelectorAll('.diamond-shape');
        for (var i = 0; i < diamondElements.length; i++) {
          diamondElements[i].style.backgroundColor = circleView.viewModel.color;
        }
      }

      // Handle oval shapes
      if (circleView.viewModel.circleType === 'oval' && circleView.ovalShape) {
        circleView.ovalShape.style.backgroundColor = circleView.viewModel.color;
        
        // Also update any oval shapes found in the DOM
        var ovalElements = circleView.element.querySelectorAll('.oval-shape');
        for (var i = 0; i < ovalElements.length; i++) {
          ovalElements[i].style.backgroundColor = circleView.viewModel.color;
        }
      }
    },
  };
  
})(window.ChakraApp = window.ChakraApp || {});
