(function(ChakraApp) {
  'use strict';
  
  ChakraApp.StandardCircleRenderer = {
    
    /**
     * Renders a standard circle with glow, particles, and chakra forms
     * @param {Object} circleView - The CircleView instance
     */
    render: function(circleView) {
      this.createGlowElement(circleView);
      this.createParticles(circleView);
      this.createChakraForm(circleView);
      
      // NEW: Start color cycling if multiple colors
      if (circleView.viewModel.hasMultipleColors()) {
        this.startColorCycling(circleView);
      }
    },

    /**
     * Renders just a simple circle glow (used for fallback cases)
     * @param {Object} circleView - The CircleView instance
     */
    renderSimpleGlow: function(circleView) {
      this.createGlowElement(circleView);
      
      // NEW: Start color cycling if multiple colors
      if (circleView.viewModel.hasMultipleColors()) {
        this.startColorCycling(circleView);
      }
    },

    /**
     * Creates the main glow element for the circle
     * @param {Object} circleView - The CircleView instance
     */
    createGlowElement: function(circleView) {
      circleView.glowElement = circleView._createElement('div', {
        className: 'circle-glow',
        style: { backgroundColor: circleView.viewModel.color }
      });
      circleView.element.appendChild(circleView.glowElement);
    },

    /**
     * NEW: Start color cycling animation for multi-color circles
     * @param {Object} circleView - The CircleView instance
     */
    startColorCycling: function(circleView) {
      // Clean up any existing cycling
      this.stopColorCycling(circleView);
      
      var colors = circleView.viewModel.getColors();
      if (colors.length <= 1) return;
      
      var currentColorIndex = 0;
      var cycleDuration = 4000; // 4 seconds per color
      var transitionDuration = 1000; // 1 second fade transition
      
      var cycleColors = function() {
        if (!circleView.glowElement || !circleView.element.parentNode) {
          // Element was removed, stop cycling
          return;
        }
        
        var currentColor = colors[currentColorIndex];
        var nextIndex = (currentColorIndex + 1) % colors.length;
        var nextColor = colors[nextIndex];
        
        // Apply transition
        circleView.glowElement.style.transition = 'background-color ' + transitionDuration + 'ms ease-in-out';
        circleView.glowElement.style.backgroundColor = nextColor;
        
        // Update particles if they exist
        var particles = circleView.element.querySelectorAll('.particle');
        for (var i = 0; i < particles.length; i++) {
          particles[i].style.transition = 'background-color ' + transitionDuration + 'ms ease-in-out';
          particles[i].style.backgroundColor = nextColor;
        }
        
        currentColorIndex = nextIndex;
        
        // Schedule next color change
        circleView._colorCycleTimeout = setTimeout(cycleColors, cycleDuration);
      };
      
      // Start the cycling
      circleView._colorCycleTimeout = setTimeout(cycleColors, cycleDuration);
    },

    /**
     * NEW: Stop color cycling animation
     * @param {Object} circleView - The CircleView instance
     */
    stopColorCycling: function(circleView) {
      if (circleView._colorCycleTimeout) {
        clearTimeout(circleView._colorCycleTimeout);
        circleView._colorCycleTimeout = null;
      }
    },

    /**
     * Creates particle effects for the circle
     * @param {Object} circleView - The CircleView instance
     */
    createParticles: function(circleView) {
      var particlesElement = circleView._createElement('div', { className: 'particles' });
      this.createParticleSet(circleView, particlesElement, 1);
      this.createParticleSet(circleView, particlesElement, 2);
      circleView.element.appendChild(particlesElement);
    },

    /**
     * Creates a set of particles
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} parentElement - Parent element to append to
     * @param {number} index - Particle set index
     */
    createParticleSet: function(circleView, parentElement, index) {
      var angleElement = circleView._createElement('div', { className: 'angle' });
      var positionElement = circleView._createElement('div', { className: 'position' });
      var pulseElement = circleView._createElement('div', { className: 'pulse' });
      
      this.createParticleElement(circleView, pulseElement);
      positionElement.appendChild(pulseElement);
      angleElement.appendChild(positionElement);
      parentElement.appendChild(angleElement);
    },

    /**
     * Creates individual particle element
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} parentElement - Parent element to append to
     */
    createParticleElement: function(circleView, parentElement) {
      var particleElement = circleView._createElement('div', {
        className: 'particle',
        style: { backgroundColor: circleView.viewModel.color }
      });
      parentElement.appendChild(particleElement);
    },

    /**
     * Creates chakra form shapes for the circle
     * @param {Object} circleView - The CircleView instance
     */
    createChakraForm: function(circleView) {
      var chakraForm = circleView.viewModel.chakraForm;
      var outerContainer = circleView._createElement('div', { className: 'outer-polygon-container' });
      
      for (var i = 0; i < chakraForm.length; i++) {
        this.createChakraFormShape(circleView, outerContainer, chakraForm[i]);
      }
      
      circleView.element.appendChild(outerContainer);
    },

    /**
     * Creates individual chakra form shape
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} outerContainer - Outer container element
     * @param {Object} form - Form configuration object
     */
    createChakraFormShape: function(circleView, outerContainer, form) {
      var innerContainer = circleView._createElement('div', {
        className: 'inner-polygon-container',
        style: { 
          transform: 'rotate(' + (form.rotate || 0) + 'deg) scale(' + (form.scale || 1) + ')'
        }
      });
      
      var innermostContainer = circleView._createElement('div', {
        className: 'inner-polygon-container',
        style: {
          filter: 'drop-shadow(0 0 3px #AAA)',
          mixBlendMode: 'screen',
          animation: (form.reverse ? 'anglerev' : 'angle') + ' ' + 
                    (form.spinTime || 16) + 's linear infinite'
        }
      });
      
      var shapeElement = circleView._createElement('div', {
        className: 'shape',
        style: {
          clipPath: ChakraApp.Utils.getPolyPoints(
            form.sides, 
            form.starFactor, 
            form.borderPercent
          )
        }
      });
      
      innermostContainer.appendChild(shapeElement);
      innerContainer.appendChild(innermostContainer);
      outerContainer.appendChild(innerContainer);
    },

    /**
     * Updates colors for standard circle elements
     * @param {Object} circleView - The CircleView instance
     */
    updateColors: function(circleView) {
      // Update glow element
      if (circleView.glowElement) {
        // NEW: Handle multi-color vs single color
        if (circleView.viewModel.hasMultipleColors()) {
          // Start or restart color cycling
          this.startColorCycling(circleView);
        } else {
          // Stop cycling and set single color
          this.stopColorCycling(circleView);
          circleView.glowElement.style.backgroundColor = circleView.viewModel.color;
          
          // Update particle colors to single color
          var particles = circleView.element.querySelectorAll('.particle');
          for (var i = 0; i < particles.length; i++) {
            particles[i].style.backgroundColor = circleView.viewModel.color;
          }
        }
      }
    },

    /**
     * Updates chakra form if needed (when square count changes)
     * @param {Object} circleView - The CircleView instance
     */
    updateChakraForm: function(circleView) {
      if (circleView.viewModel.circleType !== 'standard') return;

      if (circleView.viewModel.squareCountChanged) {
        var existingContainer = circleView.element.querySelector('.outer-polygon-container');
        if (existingContainer) {
          circleView.element.removeChild(existingContainer);
        }
        
        this.createChakraForm(circleView);
      }
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
