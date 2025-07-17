(function(ChakraApp) {
  'use strict';
  
  ChakraApp.GemRenderer = {
   initializeColorCycling: function(circleView) {
  if (circleView.viewModel.circleType !== 'gem') return;
  
  // Only start cycling if the gem has multiple colors and isn't already cycling
  if (circleView.viewModel.hasMultipleColors() && !circleView._gemColorCycleTimeout) {
    this.startGemColorCycling(circleView);
  }
}, 
_waitForDOMAttachmentAndStartCycling: function(circleView) {
  var self = this;
  var maxAttempts = 50; // Maximum attempts (5 seconds)
  var attempts = 0;

  if (circleView._waitingForAttachment || circleView._gemColorCycleTimeout) {
    return;
  }
  circleView._waitingForAttachment = true;
  
  function checkAttachment() {
    attempts++;
    
    // Check if element is attached to DOM
    var isAttached = circleView.element && 
                    circleView.element.parentNode && 
                    document.contains(circleView.element);
    
    if (isAttached) {
      self.startGemColorCycling(circleView);
    } else if (attempts < maxAttempts) {
      setTimeout(checkAttachment, 100);
    } else {
      console.warn('Failed to attach to DOM after', maxAttempts, 'attempts');
    }
  }
  
  checkAttachment();
},
    /**
     * Renders a gem shape for a given circle view
     * @param {Object} circleView - The CircleView instance
     */
render: function(circleView) {
  var self = this;
  
if (circleView._gemRendered) {
    return;
  }
  circleView._gemRendered = true;  

  // Use the shared gem creation method to ensure consistency
  this._createGemStructure(circleView);
  
  var hasMultipleColors = circleView.viewModel.hasMultipleColors();
  

  if (hasMultipleColors) {
    // FIXED: Wait for DOM attachment
    this._waitForDOMAttachmentAndStartCycling(circleView);
  }
  
  if (hasMultipleColors) {
    // FIXED: Mimic what updateColors does - use the same initialization path
    circleView._needsColorCycling = true;
    
    // CRITICAL: Force the same initialization that works in updateColors
    /*setTimeout(function() {
      self.updateColors(circleView);
    }, 100);*/
  } else {
  }
},

// NEW: Shared method to create gem structure consistently
	_createGemStructure: function(circleView) {
  circleView.createShapeWrap('gem-wrap');
  
  // Create an SVG element
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute('width', '30');
  svg.setAttribute('height', '30');
  svg.setAttribute('viewBox', '0 0 30 30');
  
  // Store reference to SVG for color cycling
  circleView.gemSvg = svg;
  
  // Calculate color variations using ColorUtils
  var darkerColor = ChakraApp.ColorUtils.createDarkerShade(circleView.viewModel.color);
  var lighterColor = ChakraApp.ColorUtils.createMoreSaturatedShade(circleView.viewModel.color);
  
  // Generate random gem configuration
  var gemConfig = this.generateRandomGemConfig();
  circleView.gemConfig = gemConfig; // Store for cycling
  
  // Create and add all gem facets based on the random configuration
  this.createGemFacets(svg, gemConfig, circleView.viewModel.color, lighterColor, circleView.viewModel.color);
  
  // Add outline for definition
  this.addGemOutline(svg, gemConfig);
  
  // Add highlights/sparkles - but reduce them if there's text content
  if (circleView.viewModel.text) {
    // Reduce sparkles when text is present to avoid visual conflict
    gemConfig.sparkles = gemConfig.sparkles.slice(0, Math.min(2, gemConfig.sparkles.length));
  }
  this.addGemHighlights(svg, gemConfig);
  
  // Add the SVG to our shape wrapper
  circleView.shapeWrap.appendChild(svg);
  
  // Add explicit click handler to the shape wrap
  circleView.shapeWrap.style.cursor = "pointer";
  circleView.shapeWrap.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!window.wasDragged) {
      circleView._handleCircleClick(e);
    }
  });
  
  // Append the shape wrapper to the main element
  circleView.appendShapeToElement();
  
  // CRITICAL FIX: Force a style recalculation to ensure gradients are properly applied
  if (circleView.viewModel.hasMultipleColors()) {
    // Force browser to recalculate styles by accessing offsetHeight
    svg.offsetHeight;
    
    // Also force gradient elements to be computed
    var gradients = svg.querySelectorAll('linearGradient, radialGradient');
    for (var i = 0; i < gradients.length; i++) {
      gradients[i].offsetHeight;
    }
  }
      this.createChakraForm(circleView);
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
     * NEW: Start color cycling animation for multi-color gem circles
     * @param {Object} circleView - The CircleView instance
     */
	startGemColorCycling: function(circleView) {
		return;

  this.stopGemColorCycling(circleView);

  if (circleView._gemColorCycleTimeout) {
    return;
  }
  
  // Clean up any existing cycling
  this.stopGemColorCycling(circleView);
  
  var colors = circleView.viewModel.getColors();
  
  if (colors.length <= 1 || !circleView.gemSvg || !circleView.gemConfig) {
    return;
  }
  
  
  var currentColorIndex = 0;
  var cycleDuration = 4000; // 4 seconds per color
  var transitionDuration = 1000; // 1 second fade transition
  var initialDelay = 1000; // CHANGED: Start first cycle after 1 second instead of 4
  
  var cycleColors = function() {
  
  if (!circleView.gemSvg || !circleView.element.parentNode) {
    return;
  }
  
  var nextIndex = (currentColorIndex + 1) % colors.length;
  var nextColor = colors[nextIndex];
  
  
  // Calculate color variations using ColorUtils
  var darkerColor = ChakraApp.ColorUtils.createDarkerShade(nextColor);
  var lighterColor = ChakraApp.ColorUtils.createMoreSaturatedShade(nextColor);
  
  
  // Get all gem facets (polygons that aren't outlines)
  var facets = circleView.gemSvg.querySelectorAll('polygon:not([stroke="rgba(255,255,255,.8)"])');
  
  // Apply smooth transitions to each facet
  facets.forEach(function(facet, index) {
    
    // Add transition for smooth color change
    facet.style.transition = 'fill ' + transitionDuration + 'ms ease-in-out';
    
    // Determine if this facet should use base color or darker color
    // We'll alternate based on index to match the original pattern
    var targetColor = index % 2 === 0 ? nextColor : darkerColor;
    
    // Update the gradient referenced by this facet
    var fillUrl = facet.getAttribute('fill');
    
    if (fillUrl && fillUrl.includes('url(#')) {
      var gradientId = fillUrl.match(/url\(#([^)]+)\)/)[1];
      var gradient = circleView.gemSvg.querySelector('#' + gradientId);
      
      
      if (gradient) {
        // Update gradient stops with smooth transitions
        var stops = gradient.querySelectorAll('stop');
        
        stops.forEach(function(stop, stopIndex) {
          var oldStopColor = stop.getAttribute('stop-color');
          stop.style.transition = 'stop-color ' + transitionDuration + 'ms ease-in-out';
          
          var offset = stop.getAttribute('offset');
          if (offset === '0%' || offset === '100%') {
            // Start and end stops use target color
            stop.setAttribute('stop-color', targetColor);
          } else if (offset === '50%') {
            // Middle stop uses lighter color for sheen effect
            stop.setAttribute('stop-color', lighterColor);
          }
        });
      } else {
      }
    } else {
      // Try direct color update as fallback
      facet.setAttribute('fill', targetColor);
    }
    
    // Also update stroke color for facet borders
    if (facet.getAttribute('stroke')) {
      facet.style.transition += ', stroke ' + transitionDuration + 'ms ease-in-out';
      facet.setAttribute('stroke', lighterColor);
    }
  });
  
  // Update the table (center) polygon if it exists (for round gems)
  var table = circleView.gemSvg.querySelector('polygon[fill*="tableGradient"]');
  if (table) {
    var tableFillUrl = table.getAttribute('fill');
    if (tableFillUrl && tableFillUrl.includes('url(#')) {
      var tableGradientId = tableFillUrl.match(/url\(#([^)]+)\)/)[1];
      var tableGradient = circleView.gemSvg.querySelector('#' + tableGradientId);
      
      if (tableGradient) {
        var tableStops = tableGradient.querySelectorAll('stop');
        
        tableStops.forEach(function(stop, stopIndex) {
          var oldTableStopColor = stop.getAttribute('stop-color');
          stop.style.transition = 'stop-color ' + transitionDuration + 'ms ease-in-out';
          
          if (stopIndex === 1) {
            // Second stop uses lighter color
            stop.setAttribute('stop-color', lighterColor);
          } else if (stopIndex === 2) {
            // Third stop uses base color
            stop.setAttribute('stop-color', nextColor);
          }
          // First stop stays white for the shine effect
        });
      }
    }
    
    // Update table stroke
    if (table.getAttribute('stroke')) {
      table.style.transition = 'stroke ' + transitionDuration + 'ms ease-in-out';
      table.setAttribute('stroke', lighterColor);
    }
  } else {
  }
  
  // Update the outline stroke
  var outline = circleView.gemSvg.querySelector('path[stroke="rgba(255,255,255,.8)"]');
  if (outline) {
    // Keep outline white but could add subtle tinting if desired
    // outline.style.transition = 'stroke ' + transitionDuration + 'ms ease-in-out';
    // outline.setAttribute('stroke', 'rgba(255,255,255,0.8)');
  }
  
  currentColorIndex = nextIndex;
  
  // Schedule next color change
  circleView._gemColorCycleTimeout = setTimeout(cycleColors, cycleDuration);
};
  
  // Start the cycling with reduced initial delay
  circleView._gemColorCycleTimeout = setTimeout(cycleColors, initialDelay);
},

    /**
     * NEW: Stop gem color cycling animation
     * @param {Object} circleView - The CircleView instance
     */
    stopGemColorCycling: function(circleView) {
      if (circleView._gemColorCycleTimeout) {
        clearTimeout(circleView._gemColorCycleTimeout);
        circleView._gemColorCycleTimeout = null;
      }
    },

    updateColors: function(circleView) {
  if (circleView.viewModel.circleType !== 'gem') return;
  
  // NEW: Handle multi-color vs single color
  if (circleView.viewModel.hasMultipleColors()) {
    // Start or restart color cycling
    this.startGemColorCycling(circleView);
  } else {
    // Stop cycling and recreate with single color
    this.stopGemColorCycling(circleView);
    
    // Check if this circle has a gem shape wrap
    if (!circleView.shapeWrap) return;
    
    // Store the current shape wrap parent and handle case where it might not be attached
    var parent = circleView.shapeWrap.parentNode;
    var nextSibling = null;
    
    if (parent) {
      nextSibling = circleView.shapeWrap.nextSibling;
      // Remove the old shape wrap completely
      parent.removeChild(circleView.shapeWrap);
    } else {
      // If shapeWrap isn't attached, use the main circle element as parent
      parent = circleView.element;
    }
    
    // Use the shared gem creation method for consistency
    this._createGemStructure(circleView);
    
    // Insert the new shape wrap back into the DOM at the correct position
    if (nextSibling && parent) {
      parent.insertBefore(circleView.shapeWrap, nextSibling);
    } else {
      // Fallback: just append to the parent (either original parent or circle element)
      parent.appendChild(circleView.shapeWrap);
    }
  }
},

    /**
     * Generate a random gem configuration
     * @returns {Object} Gem configuration object
     */
    generateRandomGemConfig: function() {
      // Select a random gem type
      var gemTypes = [
        'round',           // Circular with facets
      ];
      
      var gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
      
      // Number of facets - range depends on gem type
      var minFacets, maxFacets;
      switch (gemType) {
        case 'round': 
          minFacets = 9; maxFacets = 9; break;
        default: 
          minFacets = 4; maxFacets = 8;
      }
      
      var facetsCount = minFacets + Math.floor(Math.random() * (maxFacets - minFacets + 1));
      
      // Generate a random rotation angle for the gem
      var rotation = Math.floor(Math.random() * 45);
      
      // Generate random sparkle positions
      var sparkleCount = 3 + Math.floor(Math.random() * 4);
      var sparkles = [];
      for (var i = 0; i < sparkleCount; i++) {
        sparkles.push({
          x: 7 + Math.floor(Math.random() * 12),
          y: 7 + Math.floor(Math.random() * 12),
          size: 0.5 + Math.random() * 1.5,
          opacity: 0.5 + Math.random() * 0.5
        });
      }
      
      return {
        type: gemType,
        facetsCount: facetsCount,
        rotation: rotation,
        sparkles: sparkles,
        // Each gem type gets a unique path generating function
        path: this.getGemPath(gemType, rotation)
      };
    },

    /**
     * Get the path for a specific gem type
     * @param {string} gemType - Type of gem
     * @param {number} rotation - Rotation angle
     * @returns {Array} Array of path points
     */
    getGemPath: function(gemType, rotation) {
      var cx = 15; // center x
      var cy = 15; // center y
      
      // Create a rotation transformation
      var rotatePoint = function(x, y, angle) {
        angle = angle * Math.PI / 180; // Convert to radians
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
        var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        return { x: nx, y: ny };
      };
      
      // Apply rotation to all points
      var rotate = function(points, angle) {
        return points.map(function(point) {
          var rotated = rotatePoint(point.x, point.y, angle);
          return { x: rotated.x, y: rotated.y };
        });
      };
      
      // Define basic shapes for different gem types
      var gemPaths = {
        round: function() {
          var points = [];
          var radius = 10;
          var segments = 8 + Math.floor(Math.random() * 4); // 8-11 segments
          
          for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * 2 * Math.PI;
            var x = cx + radius * Math.cos(angle);
            var y = cy + radius * Math.sin(angle);
            points.push({ x: x, y: y });
          }
          
          return rotate(points, rotation);
        },
      };
      
      // Return the appropriate path or default to classic
      return gemPaths[gemType] ? gemPaths[gemType]() : gemPaths.classic();
    },

    /**
     * Create the facets for the gem
     * @param {SVGElement} svg - SVG element to add facets to
     * @param {Object} gemConfig - Gem configuration
     * @param {string} darkerColor - Darker shade color
     * @param {string} lighterColor - Lighter shade color
     * @param {string} baseColor - Base color
     */
    createGemFacets: function(svg, gemConfig, darkerColor, lighterColor, baseColor) {
      var svgNS = "http://www.w3.org/2000/svg";
      var points = gemConfig.path;
      var facetsCount = gemConfig.facetsCount;
      var gemType = gemConfig.type;
      
      // Create defs section for gradients if it doesn't exist
      var defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS(svgNS, "defs");
        svg.appendChild(defs);
      }
      
      // Function to create a linear gradient for the sheen effect
      var createSheenGradient = function(id, color, angle) {
        var gradient = document.createElementNS(svgNS, "linearGradient");
        gradient.setAttribute("id", id);
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "100%");
        gradient.setAttribute("y2", "100%");
        gradient.setAttribute("gradientTransform", `rotate(${angle}, 0.5, 0.5)`);
        
        // Start with the base color
        var stop1 = document.createElementNS(svgNS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", color);
        stop1.setAttribute("stop-opacity", "1");
        
        // Mid-point with lighter color for sheen
        var stop2 = document.createElementNS(svgNS, "stop");
        stop2.setAttribute("offset", "50%");
        stop2.setAttribute("stop-color", lighterColor);
        stop2.setAttribute("stop-opacity", "0.7");
        
        // End with the base color
        var stop3 = document.createElementNS(svgNS, "stop");
        stop3.setAttribute("offset", "100%");
        stop3.setAttribute("stop-color", color);
        stop3.setAttribute("stop-opacity", "1");
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        gradient.appendChild(stop3);
        
        return gradient;
      };
      
      // Add animation to the gradients if not already defined
      if (!document.getElementById('gem-sheen-animations')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'gem-sheen-animations';
        styleEl.textContent = `
          @keyframes sheenAnimation {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          
          .gem-facet {
            animation: sheenAnimation var(--duration) infinite ease-in-out;
            animation-delay: var(--delay);
          }
        `;
        document.head.appendChild(styleEl);
      }
      
      // Function to create a polygon facet with sheen
      var createFacet = function(pointsArray, color, index, total) {
        var facet = document.createElementNS(svgNS, "polygon");
        var pointsStr = pointsArray.map(function(p) { return p.x + "," + p.y; }).join(" ");
        facet.setAttribute('points', pointsStr);
        
        // Create a unique gradient ID for this facet
        var gradientId = "sheenGradient-" + index + "-" + Math.random().toString(36).substr(2, 9);
        
        // Calculate a gradient angle based on facet position
        var angle = (index / total) * 360;
        
        // Create and add the gradient
        var gradient = createSheenGradient(gradientId, color, angle);
        defs.appendChild(gradient);
        
        // Apply the gradient
        facet.setAttribute('fill', `url(#${gradientId})`);
        facet.setAttribute('stroke', lighterColor);
        facet.setAttribute('stroke-width', '0.5');
        facet.setAttribute('stroke-opacity', '1');
        
        // Add subtle animation to the facet
        facet.classList.add('gem-facet');
        facet.style.setProperty('--duration', (3 + Math.random() * 2) + 's');
        facet.style.setProperty('--delay', (Math.random() * 2) + 's');
        
        facet.style.pointerEvents = "none";
        return facet;
      };
      
      // Different facet creation strategies based on gem type
      switch (gemType) {
        case 'round':
          this.createRoundGemFacets(svg, points, baseColor, darkerColor, lighterColor, createFacet, svgNS);
          break;

        default:
          this.createDefaultGemFacets(svg, points, baseColor, darkerColor, createFacet);
      }
    },

    /**
     * Create facets for round gem type
     * @param {SVGElement} svg - SVG element
     * @param {Array} points - Gem path points
     * @param {string} baseColor - Base color
     * @param {string} darkerColor - Darker shade color
     * @param {string} lighterColor - Lighter shade color
     * @param {Function} createFacet - Function to create facets
     * @param {string} svgNS - SVG namespace
     */
    createRoundGemFacets: function(svg, points, baseColor, darkerColor, lighterColor, createFacet, svgNS) {
      // Calculate center point
      var centerX = 0, centerY = 0;
      points.forEach(function(point) {
        centerX += point.x;
        centerY += point.y;
      });
      centerX /= points.length;
      centerY /= points.length;
      
      // Calculate average radius
      var outerRadius = 0;
      points.forEach(function(point) {
        outerRadius += Math.sqrt(
          Math.pow(point.x - centerX, 2) + 
          Math.pow(point.y - centerY, 2)
        );
      });
      outerRadius /= points.length;
      
      // Create table points (inner polygon)
      var tableRadius = outerRadius * 0.5;
      var tablePoints = [];
      
      for (var i = 0; i < points.length; i++) {
        // Calculate angle based on original point position
        var angle = Math.atan2(
          points[i].y - centerY,
          points[i].x - centerX
        );
        
        // Create table point at same angle but shorter distance
        var tableX = centerX + tableRadius * Math.cos(angle);
        var tableY = centerY + tableRadius * Math.sin(angle);
        tablePoints.push({ x: tableX, y: tableY });
      }
      
      // Draw the table polygon with a special shine effect
      var tableGradientId = "tableGradient-" + Math.random().toString(36).substr(2, 9);
      var tableGradient = document.createElementNS(svgNS, "radialGradient");
      tableGradient.setAttribute("id", tableGradientId);
      tableGradient.setAttribute("cx", "25%");
      tableGradient.setAttribute("cy", "25%");
      tableGradient.setAttribute("r", "50%");
      
      var tableStop1 = document.createElementNS(svgNS, "stop");
      tableStop1.setAttribute("offset", "0%");
      tableStop1.setAttribute("stop-color", 'rgba(255, 255, 255, .9)');
      tableStop1.setAttribute("stop-opacity", "0.9");
      
      var tableStop2 = document.createElementNS(svgNS, "stop");
      tableStop2.setAttribute("offset", "70%");
      tableStop2.setAttribute("stop-color", lighterColor);
      tableStop2.setAttribute("stop-opacity", "0.8");
      
      var tableStop3 = document.createElementNS(svgNS, "stop");
      tableStop3.setAttribute("offset", "100%");
      tableStop3.setAttribute("stop-color", baseColor);
      tableStop3.setAttribute("stop-opacity", "0.7");
      
      tableGradient.appendChild(tableStop1);
      tableGradient.appendChild(tableStop2);
      tableGradient.appendChild(tableStop3);
      
      // Add gradient to defs
      var defs = svg.querySelector("defs");
      defs.appendChild(tableGradient);
      
      var table = document.createElementNS(svgNS, "polygon");
      var tablePointsStr = tablePoints.map(function(p) { return p.x + "," + p.y; }).join(" ");
      table.setAttribute('points', tablePointsStr);
      table.setAttribute('fill', `url(#${tableGradientId})`);
      table.setAttribute('stroke', lighterColor);
      table.setAttribute('stroke-width', '1');
      table.setAttribute('stroke-opacity', '1');
      svg.appendChild(table);
      
      // Draw facets connecting table to outer points
      for (var i = 0; i < points.length; i++) {
        var nextIndex = (i + 1) % points.length;
        
        // Create trapezoid facet
        var facetPoints = [
          tablePoints[i],
          tablePoints[nextIndex],
          points[nextIndex],
          points[i]
        ];
        
        // Alternate colors
        var color = i % 2 === 0 ? baseColor : darkerColor;
        
        svg.appendChild(createFacet(facetPoints, color, i, points.length));
      }
    },

    /**
     * Create default facets for other gem types
     * @param {SVGElement} svg - SVG element
     * @param {Array} points - Gem path points
     * @param {string} baseColor - Base color
     * @param {string} darkerColor - Darker shade color
     * @param {Function} createFacet - Function to create facets
     */
    createDefaultGemFacets: function(svg, points, baseColor, darkerColor, createFacet) {
      // Calculate center point
      var centerX = 0, centerY = 0;
      points.forEach(function(point) {
        centerX += point.x;
        centerY += point.y;
      });
      centerX /= points.length;
      centerY /= points.length;
      
      // Default facet creation logic for other gem types
      for (var i = 0; i < points.length; i++) {
        var nextIndex = (i + 1) % points.length;
        var facetPoints = [
          { x: centerX, y: centerY },
          { x: points[i].x, y: points[i].y },
          { x: points[nextIndex].x, y: points[nextIndex].y }
        ];
        svg.appendChild(createFacet(facetPoints, i % 2 === 0 ? baseColor : darkerColor, i, points.length));
      }
    },

    /**
     * Add outline to the gem for better definition
     * @param {SVGElement} svg - SVG element
     * @param {Object} gemConfig - Gem configuration
     */
    addGemOutline: function(svg, gemConfig) {
      var svgNS = "http://www.w3.org/2000/svg";
      var points = gemConfig.path;
      
      // Create path string from points
      var pathData = "M";
      points.forEach(function(point, index) {
        if (index === 0) {
          pathData += point.x + "," + point.y;
        } else {
          pathData += " L" + point.x + "," + point.y;
        }
      });
      pathData += " Z"; // Close the path
      
      var outline = document.createElementNS(svgNS, "path");
      outline.setAttribute('d', pathData);
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', 'rgba(255,255,255,.8)');
      outline.setAttribute('stroke-width', '0.3');
      outline.style.pointerEvents = "none";
      
      svg.appendChild(outline);
    },

    /**
     * Add highlights/sparkles to the gem
     * @param {SVGElement} svg - SVG element
     * @param {Object} gemConfig - Gem configuration
     */
    addGemHighlights: function(svg, gemConfig) {
      var svgNS = "http://www.w3.org/2000/svg";
      var sparkles = gemConfig.sparkles;
      
      // Create a style element for animations if it doesn't exist yet
      if (!document.getElementById('gem-sparkle-animations')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'gem-sparkle-animations';
        styleEl.textContent = `
          @keyframes sparkleAnimation {
            0% { opacity: 0; transform: scale(0.7); }
            20% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
            80% { opacity: 0.2; transform: scale(0.8); }
            100% { opacity: 0; transform: scale(0.7); }
          }
          
          .sparkle {
            animation: sparkleAnimation var(--duration) infinite ease-in-out;
            animation-delay: var(--delay);
            transform-origin: center;
            opacity: 0;
          }
        `;
        document.head.appendChild(styleEl);
      }
      
      // Add sparkles at random positions
      sparkles.forEach(function(sparkle, index) {
        // Create a container for the sparkle to handle movement animation
        var sparkleContainer = document.createElementNS(svgNS, "g");
        sparkleContainer.setAttribute('class', 'sparkle-container');
        sparkleContainer.setAttribute('transform', `translate(${sparkle.x}, ${sparkle.y})`);
        sparkleContainer.style.pointerEvents = "none";
        
        // Create the sparkle itself
        var sparkleElement = document.createElementNS(svgNS, "circle");
        sparkleElement.setAttribute('cx', -2 + Math.random() * 6);
        sparkleElement.setAttribute('cy', -2 + Math.random() * 6);
        sparkleElement.setAttribute('r', sparkle.size);
        sparkleElement.setAttribute('fill', 'white');
        
        // Random animation duration and delay for each sparkle
        var duration = 7 + Math.random() * 3 + 's'; // 7-10 seconds
        var delay = 5 + Math.random() * 2 + 's'; // 5-7 seconds delay
        
        sparkleElement.setAttribute('class', 'sparkle');
        sparkleElement.style.setProperty('--duration', duration);
        sparkleElement.style.setProperty('--delay', delay);
        
        // Add sparkle to container, and container to SVG
        sparkleContainer.appendChild(sparkleElement);
        svg.appendChild(sparkleContainer);
      });
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
