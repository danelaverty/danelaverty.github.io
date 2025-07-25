// Enhanced StandardCircleRenderer with organic multi-color flow
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
      
      // NEW: Start organic color flow if multiple colors
      if (circleView.viewModel.hasMultipleColors()) {
        this.startOrganicColorFlow(circleView);
      }
    },

    /**
     * Renders just a simple circle glow (used for fallback cases)
     * @param {Object} circleView - The CircleView instance
     */
    renderSimpleGlow: function(circleView) {
      this.createGlowElement(circleView);
      
      // NEW: Start organic color flow if multiple colors
      if (circleView.viewModel.hasMultipleColors()) {
        this.startOrganicColorFlow(circleView);
      }
    },

    /**
     * Creates the main glow element for the circle
     * @param {Object} circleView - The CircleView instance
     */
    createGlowElement: function(circleView) {
      circleView.glowElement = circleView._createElement('div', {
        className: 'circle-glow',
        style: { 
          backgroundColor: circleView.viewModel.color,
          position: 'relative',
          overflow: 'hidden' // Important for masking the gradient overlay
        }
      });
      circleView.element.appendChild(circleView.glowElement);
    },

    /**
     * NEW: Create organic color flow effect for multi-color circles
     * @param {Object} circleView - The CircleView instance
     */
    startOrganicColorFlow: function(circleView) {
      // Clean up any existing flow
      this.stopOrganicColorFlow(circleView);
      
      var colors = circleView.viewModel.getColors();
      if (colors.length <= 1) return;
      
      // Create the gradient overlay element
      var gradientOverlay = circleView._createElement('div', {
        className: 'color-flow-overlay',
        style: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: '1'
        }
      });
      
      // Create multiple gradient layers for more complex flow
      this.createGradientLayers(circleView, gradientOverlay, colors);
      
      // Add to glow element
      circleView.glowElement.appendChild(gradientOverlay);
      circleView._gradientOverlay = gradientOverlay;
      
      // Start the animation
      this.animateColorFlow(circleView, colors);
    },

    /**
     * Create multiple gradient layers for complex color mixing
     * @param {Object} circleView - The CircleView instance
     * @param {HTMLElement} container - Container for gradient layers
     * @param {Array} colors - Array of colors
     */
    createGradientLayers: function(circleView, container, colors) {
      var layerCount = Math.min(colors.length, 4); // Max 4 layers for performance
      
      circleView._gradientLayers = [];
      
      for (var i = 0; i < layerCount; i++) {
        var layer = circleView._createElement('div', {
          className: 'gradient-layer gradient-layer-' + i,
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            mixBlendMode: i === 0 ? 'normal' : 'overlay',
            opacity: '0.8'
          }
        });
        
        container.appendChild(layer);
        circleView._gradientLayers.push(layer);
      }
    },

generateRandomTimingCoefficient: function(circleId) {
  // Use the circle ID as a seed for consistent but unique randomization
  var seed = 0;
  for (var i = 0; i < circleId.length; i++) {
    seed += circleId.charCodeAt(i);
  }
  
  // Simple pseudo-random generator using the seed
  var random = Math.sin(seed) * 10000;
  random = random - Math.floor(random);
  
  // Map to range 0.7 to 1.5 for reasonable variation
  return 0.7 + (random * 0.8);
},
    

    /**
     * Animate the color flow with organic movement
     * @param {Object} circleView - The CircleView instance
     * @param {Array} colors - Array of colors
     */
    animateColorFlow: function(circleView, colors) {
      var layers = circleView._gradientLayers;
      if (!layers || layers.length === 0) return;
      
      var animationSpeed = 5; // seconds for one complete cycle
      var time = 0;
      
      var animate = function() {
        if (!circleView.glowElement || !circleView.element.parentNode) {
          // Element was removed, stop animation
          return;
        }
        
        time += 0.02; // Increment time
        
        // Update each gradient layer
        layers.forEach(function(layer, index) {
          if (!layer || index >= colors.length) return;
          
          var color1 = colors[index];
          var color2 = colors[(index + 1) % colors.length];
          var color3 = colors[(index + 2) % colors.length];
          
          // Create organic movement with different phases for each layer
          var phase1 = time + (index * Math.PI / 2);
          var phase2 = time * 0.7 + (index * Math.PI / 3);
          
          // Calculate dynamic gradient positions
          var x1 = 50 + Math.sin(phase1) * 30;
          var y1 = 50 + Math.cos(phase1) * 30;
          var x2 = 50 + Math.sin(phase2) * 40;
          var y2 = 50 + Math.cos(phase2) * 40;
          
          // Create flowing radial gradient
          var gradient = 'radial-gradient(ellipse ' + 
            (60 + Math.sin(time * 0.5 + index) * 20) + '% ' +
            (60 + Math.cos(time * 0.3 + index) * 20) + '% at ' +
            x1 + '% ' + y1 + '%, ' +
            color1 + ' 0%, ' +
            'transparent 40%, ' +
            color2 + ' 70%, ' +
            'transparent 100%)';
          
          layer.style.background = gradient;
          
          // Add subtle rotation
          var rotation = (time * 10 + index * 45) % 360;
          layer.style.transform = 'rotate(' + rotation + 'deg)';
        });
        
        // Continue animation
        circleView._colorFlowAnimation = requestAnimationFrame(animate);
      };
      
      // Start the animation
      animate();
    },

    /**
     * Alternative: Create CSS-based organic color flow (more performant)
     * @param {Object} circleView - The CircleView instance
     * @param {Array} colors - Array of colors
     */
    createCSSOrganicFlow: function(circleView, colors) {
      if (colors.length <= 1) return;
      
      // Create CSS keyframes for organic flow
      var keyframeName = 'colorFlow' + circleView.viewModel.id;
      var keyframeCSS = this.generateFlowKeyframes(keyframeName, colors);
      
      // Add CSS to document
      var styleSheet = document.getElementById('dynamic-color-flow') || 
        circleView._createElement('style', { id: 'dynamic-color-flow' }, document.head);
      
      styleSheet.textContent += keyframeCSS;
      
      // Apply to glow element
      circleView.glowElement.style.background = this.generateFlowGradient(colors);
      circleView.glowElement.style.animation = keyframeName + ' 15s ease-in-out infinite';
      circleView.glowElement.style.backgroundSize = '200% 200%';
    },

    /**
     * Generate CSS keyframes for organic color flow
     * @param {string} keyframeName - Name for the keyframe animation
     * @param {Array} colors - Array of colors
     * @returns {string} CSS keyframe rules
     */
    generateFlowKeyframes: function(keyframeName, colors) {
      var steps = [
        '0% { background-position: 0% 50%; }',
        '25% { background-position: 100% 25%; }',
        '50% { background-position: 50% 100%; }',
        '75% { background-position: 25% 0%; }',
        '100% { background-position: 0% 50%; }'
      ];
      
      return '@keyframes ' + keyframeName + ' {\n' + steps.join('\n') + '\n}';
    },

    /**
     * Generate flowing gradient background
     * @param {Array} colors - Array of colors
     * @returns {string} CSS gradient
     */
    generateFlowGradient: function(colors) {
      if (colors.length === 2) {
        return 'linear-gradient(45deg, ' + colors[0] + ', ' + colors[1] + ', ' + colors[0] + ')';
      }
      
      // For more colors, create a complex gradient
      var gradientStops = [];
      var stepSize = 100 / colors.length;
      
      colors.forEach(function(color, index) {
        gradientStops.push(color + ' ' + (index * stepSize) + '%');
        if (index < colors.length - 1) {
          gradientStops.push(color + ' ' + ((index + 0.5) * stepSize) + '%');
        }
      });
      
      // Add the first color at the end for seamless loop
      gradientStops.push(colors[0] + ' 100%');
      
      return 'linear-gradient(45deg, ' + gradientStops.join(', ') + ')';
    },

    /**
     * Stop organic color flow animation
     * @param {Object} circleView - The CircleView instance
     */
    stopOrganicColorFlow: function(circleView) {
      // Stop requestAnimationFrame animation
      if (circleView._colorFlowAnimation) {
        cancelAnimationFrame(circleView._colorFlowAnimation);
        circleView._colorFlowAnimation = null;
      }
      
      // Remove gradient overlay
      if (circleView._gradientOverlay && circleView._gradientOverlay.parentNode) {
        circleView._gradientOverlay.parentNode.removeChild(circleView._gradientOverlay);
        circleView._gradientOverlay = null;
      }
      
      // Clear gradient layers reference
      circleView._gradientLayers = null;
      
      // Remove CSS animation
      if (circleView.glowElement) {
        circleView.glowElement.style.animation = '';
        circleView.glowElement.style.backgroundSize = '';
      }
    },

    /**
     * DEPRECATED: Old color cycling method - kept for backward compatibility
     */
    startColorCycling: function(circleView) {
      // Redirect to new organic flow
      this.startOrganicColorFlow(circleView);
    },

    /**
     * DEPRECATED: Old color cycling stop method
     */
    stopColorCycling: function(circleView) {
      // Redirect to new organic flow stop
      this.stopOrganicColorFlow(circleView);
    },

    // ... rest of the existing methods remain the same ...

    createParticles: function(circleView) {
      var particlesElement = circleView._createElement('div', { className: 'particles' });
      this.createParticleSet(circleView, particlesElement, 1);
      this.createParticleSet(circleView, particlesElement, 2);
      circleView.element.appendChild(particlesElement);
    },

    createParticleSet: function(circleView, parentElement, index) {
  var angleElement = circleView._createElement('div', { className: 'angle' });
  var positionElement = circleView._createElement('div', { className: 'position' });
  var pulseElement = circleView._createElement('div', { className: 'pulse' });
  
  // Generate random timing coefficient for this circle
  var timingCoeff = this.generateRandomTimingCoefficient(circleView.viewModel.id + '_' + index);
  
  // Apply random timing to animations
  if (index === 1) {
    var angleDuration = (10 * timingCoeff).toFixed(2) + 's';
    var positionDuration = (2 * timingCoeff).toFixed(2) + 's';
    angleElement.style.webkitAnimation = 'angle ' + angleDuration + ' steps(5) 0s infinite';
    positionElement.style.webkitAnimation = 'position ' + positionDuration + ' linear 0s infinite';
  } else if (index === 2) {
    var angleDuration = (4.95 * timingCoeff).toFixed(2) + 's';
    var positionDuration = (1.65 * timingCoeff).toFixed(2) + 's';
    var angleDelay = (-1.65 * timingCoeff).toFixed(2) + 's';
    angleElement.style.webkitAnimation = 'angle ' + angleDuration + ' steps(3) ' + angleDelay + ' infinite';
    positionElement.style.webkitAnimation = 'position ' + positionDuration + ' linear 0s infinite';
  }
  
  this.createParticleElement(circleView, pulseElement);
  positionElement.appendChild(pulseElement);
  angleElement.appendChild(positionElement);
  parentElement.appendChild(angleElement);
},

    createParticleElement: function(circleView, parentElement) {
      var color = circleView.viewModel.hasMultipleColors() ? 
        circleView.viewModel.colors[0] : circleView.viewModel.color;
        
      var particleElement = circleView._createElement('div', {
        className: 'particle',
        style: { backgroundColor: color }
      });
      parentElement.appendChild(particleElement);
    },

    createChakraForm: function(circleView) {
      var chakraForm = circleView.viewModel.chakraForm;
      var outerContainer = circleView._createElement('div', { className: 'outer-polygon-container' });
      
      for (var i = 0; i < chakraForm.length; i++) {
        this.createChakraFormShape(circleView, outerContainer, chakraForm[i]);
      }
      
      circleView.element.appendChild(outerContainer);
    },

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
        if (circleView.viewModel.hasMultipleColors()) {
          // Start or restart organic color flow
          this.startOrganicColorFlow(circleView);
        } else {
          // Stop flow and set single color
          this.stopOrganicColorFlow(circleView);
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
