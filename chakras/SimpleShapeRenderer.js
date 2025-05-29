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
     * Renders a hexagon shape
     * @param {Object} circleView - The CircleView instance
     */
    renderHexagon: function(circleView) {
      var self = this;
      circleView.createShapeWrap('hexagon-wrap');

      var hexagonClipPath = 'polygon(50% 0%, 96% 25%, 96% 75%, 50% 100%, 4% 75%, 4% 25%, 50% 0%, 50% 17%, 17% 30%, 17% 70%, 50% 85%, 83% 70%, 83% 30%, 50% 17%)';
      
      // Main hexagon
      var styles = circleView.getBaseShapeStyles(circleView.viewModel.color);
      styles.clipPath = hexagonClipPath;
      styles.transform = 'translate(-50%, -50%) scale(1.2)';
      circleView.hexagonShape = circleView.createShapeElement('hexagon-shape', styles);
      
      // Inner hexagon with darker color
      var darkerColor = ChakraApp.ColorUtils.createDarkerShade(circleView.viewModel.color);
      var styles2 = circleView.getBaseShapeStyles(darkerColor);
      styles2.clipPath = hexagonClipPath;
      styles2.transform = 'translate(-50%, -50%) scale(.6)';
      circleView.hexagonShape2 = circleView.createShapeElement('hexagon-shape', styles2);

      // Add explicit click handler to the shape wrap
      this.addClickHandler(circleView);
      
      circleView.appendShapeToElement();
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
     * Updates colors for simple shapes
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

      // Handle hexagon shapes
      if (circleView.viewModel.circleType === 'hexagon' && circleView.hexagonShape) {
        circleView.hexagonShape.style.backgroundColor = circleView.viewModel.color;
        var darkerColor = ChakraApp.ColorUtils.createDarkerShade(circleView.viewModel.color);
        if (circleView.hexagonShape2) {
          circleView.hexagonShape2.style.backgroundColor = darkerColor;
        }
        
        // If the hexagon has any specific styling elements, update those as well
        var hexagonElement = circleView.element.querySelector('.hexagon-shape');
        if (hexagonElement) {
          hexagonElement.style.backgroundColor = circleView.viewModel.color;
        }
      }

      // Handle diamond shapes
      if (circleView.viewModel.circleType === 'diamond' && circleView.diamondShape) {
        circleView.diamondShape.style.backgroundColor = circleView.viewModel.color;
      }

      // Handle oval shapes
      if (circleView.viewModel.circleType === 'oval' && circleView.ovalShape) {
        circleView.ovalShape.style.backgroundColor = circleView.viewModel.color;
      }
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
