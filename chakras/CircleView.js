(function(ChakraApp) {
  ChakraApp.CircleView = function(viewModel, parentElement) {
    ChakraApp.BaseView.call(this, viewModel, parentElement);
    this.panelId = this.extractPanelId();
    this.setParentPositionIfNeeded();
    this.render();
    this._setupViewModelSubscription();
    this._setupEventListeners();
  };
  
  ChakraApp.CircleView.prototype = Object.create(ChakraApp.BaseView.prototype);
  ChakraApp.CircleView.prototype.constructor = ChakraApp.CircleView;
  
  ChakraApp.CircleView.prototype.extractPanelId = function() {
    return this.parentElement ? this.parentElement.getAttribute('data-panel-id') : null;
  };
  
  ChakraApp.CircleView.prototype.setParentPositionIfNeeded = function() {
    if (this.parentElement && !this.parentElement.style.position) {
      this.parentElement.style.position = 'relative';
    }
  };
  
  ChakraApp.CircleView.prototype.render = function() {
    this.createMainElement();
    this.addPanelSpecificClass();
    this.renderShapeBasedOnConcept();
    this.addNameElement();
    this.applySelectionState();
    this.addToParent();
  };

  ChakraApp.CircleView.prototype.createMainElement = function() {
    this.element = this._createElement('div', {
      className: 'circle',
      dataset: { id: this.viewModel.id },
      style: this.getMainElementStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getMainElementStyles = function() {
    return {
      width: this.viewModel.size + 'px',
      height: this.viewModel.size + 'px',
      left: this.viewModel.x + 'px',
      top: this.viewModel.y + 'px'
    };
  };

  ChakraApp.CircleView.prototype.addPanelSpecificClass = function() {
    if (this.panelId) {
      this.element.classList.add('circle-' + this.panelId);
    }
  };

  ChakraApp.CircleView.prototype._renderGem = function() {
  var self = this;
  this.createShapeWrap('gem-wrap');
  
  // Create an SVG element
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute('width', '30');
  svg.setAttribute('height', '30');
  svg.setAttribute('viewBox', '0 0 30 30');
  
  // Set pointer-events to allow click through
  svg.style.pointerEvents = "none";
  
  // Calculate a slightly darker color for shading
  var darkerColor = this.createDarkerShade(this.viewModel.color);
  // Calculate a lighter color for highlights
  var lighterColor = this.createLighterShade(this.viewModel.color);
  
  // Generate random gem configuration
  var gemConfig = this.generateRandomGemConfig();
  
  // Create and add all gem facets based on the random configuration
  this.createGemFacets(svg, gemConfig, darkerColor, lighterColor);
  
  // Add outline for definition
  this.addGemOutline(svg, gemConfig);
  
  // Add highlights/sparkles
  this.addGemHighlights(svg, gemConfig);
  
  // Add the SVG to our shape wrapper
  this.shapeWrap.appendChild(svg);
  
  // Add explicit click handler to the shape wrap
  this.shapeWrap.style.cursor = "pointer";
  this.shapeWrap.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!window.wasDragged) {
      self.viewModel.select();
    }
  });
  
  // Append the shape wrapper to the main element
  this.appendShapeToElement();
  
  // Add the chakra form on top of the gem
  this._createChakraForm();
};

// Create a lighter shade of a color for highlights
ChakraApp.CircleView.prototype.createLighterShade = function(color) {
  // Handle different color formats
  var r, g, b;
  
  // Parse rgb/rgba format
  if (color.startsWith('rgb')) {
    var rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      r = parseInt(rgbValues[0]);
      g = parseInt(rgbValues[1]);
      b = parseInt(rgbValues[2]);
    }
  } 
  // Parse hex format
  else if (color.startsWith('#')) {
    var hex = color.substring(1);
    // Handle both 3-digit and 6-digit hex
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  
  // If parsing failed or color format is not recognized, return a default lighter color
  if (r === undefined || g === undefined || b === undefined) {
    return 'rgb(220, 220, 220)';
  }
  
  // Lighten the color by increasing each component by 30% but not exceeding 255
  r = Math.min(255, Math.floor(r * 1.3));
  g = Math.min(255, Math.floor(g * 1.3));
  b = Math.min(255, Math.floor(b * 1.3));
  
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
};

// Generate a random gem configuration
ChakraApp.CircleView.prototype.generateRandomGemConfig = function() {
  // Select a random gem type
  var gemTypes = [
    //'classic',         // Classic cut with top, sides, and bottom
    //'princess',        // Square top with pyramidal bottom
    //'emerald',         // Rectangular with angled cuts
    'round',           // Circular with facets
    //'marquise',        // Elongated with pointed ends
    //'pear',            // Teardrop shape
    //'radiant'          // Square with cut corners and many facets
  ];
  
  var gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
  
  // Number of facets - range depends on gem type
  var minFacets, maxFacets;
  switch (gemType) {
    case 'classic': 
      minFacets = 4; maxFacets = 6; break;
    case 'princess': 
      minFacets = 4; maxFacets = 8; break;
    case 'emerald': 
      minFacets = 6; maxFacets = 10; break;
    case 'round': 
      minFacets = 8; maxFacets = 12; break;
    case 'marquise': 
      minFacets = 6; maxFacets = 10; break;
    case 'pear': 
      minFacets = 5; maxFacets = 9; break;
    case 'radiant': 
      minFacets = 7; maxFacets = 12; break;
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
};

// Get the path for a specific gem type
ChakraApp.CircleView.prototype.getGemPath = function(gemType, rotation) {
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
    classic: function() {
      var points = [
        { x: 15, y: 5 },  // top point
        { x: 25, y: 12 }, // right top
        { x: 22, y: 20 }, // right bottom
        { x: 15, y: 25 }, // bottom point
        { x: 8, y: 20 },  // left bottom
        { x: 5, y: 12 }   // left top
      ];
      return rotate(points, rotation);
    },
    princess: function() {
      var points = [
        { x: 10, y: 8 },  // top left
        { x: 20, y: 8 },  // top right
        { x: 20, y: 18 }, // bottom right
        { x: 10, y: 18 }, // bottom left
        { x: 15, y: 25 }  // bottom point
      ];
      return rotate(points, rotation);
    },
    emerald: function() {
      var points = [
        { x: 10, y: 7 },  // top left
        { x: 20, y: 7 },  // top right
        { x: 23, y: 12 }, // right upper
        { x: 23, y: 18 }, // right lower
        { x: 20, y: 23 }, // bottom right
        { x: 10, y: 23 }, // bottom left
        { x: 7, y: 18 },  // left lower
        { x: 7, y: 12 }   // left upper
      ];
      return rotate(points, rotation);
    },
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
    marquise: function() {
      var points = [
        { x: 15, y: 5 },  // top point
        { x: 20, y: 8 },  // right top
        { x: 25, y: 15 }, // rightmost
        { x: 20, y: 22 }, // right bottom
        { x: 15, y: 25 }, // bottom point
        { x: 10, y: 22 }, // left bottom
        { x: 5, y: 15 },  // leftmost
        { x: 10, y: 8 }   // left top
      ];
      return rotate(points, rotation);
    },
    pear: function() {
      var points = [
        { x: 15, y: 5 },  // top point
        { x: 19, y: 8 },  // right top
        { x: 22, y: 13 }, // right upper
        { x: 22, y: 20 }, // right lower
        { x: 18, y: 24 }, // bottom right
        { x: 12, y: 24 }, // bottom left
        { x: 8, y: 20 },  // left lower
        { x: 8, y: 13 },  // left upper
        { x: 11, y: 8 }   // left top
      ];
      return rotate(points, rotation);
    },
    radiant: function() {
      var points = [
        { x: 11, y: 6 },  // top left
        { x: 19, y: 6 },  // top right
        { x: 23, y: 10 }, // right top
        { x: 23, y: 20 }, // right bottom
        { x: 19, y: 24 }, // bottom right
        { x: 11, y: 24 }, // bottom left
        { x: 7, y: 20 },  // left bottom
        { x: 7, y: 10 }   // left top
      ];
      return rotate(points, rotation);
    }
  };
  
  // Return the appropriate path or default to classic
  return gemPaths[gemType] ? gemPaths[gemType]() : gemPaths.classic();
};

// Create the facets for the gem
ChakraApp.CircleView.prototype.createGemFacets = function(svg, gemConfig, darkerColor, lighterColor) {
  var svgNS = "http://www.w3.org/2000/svg";
  var points = gemConfig.path;
  var facetsCount = gemConfig.facetsCount;
  var gemType = gemConfig.type;
  var baseColor = this.viewModel.color;
  
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
      break;

    // [Other cases would go here]
    
    default:
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
  }
};

// Add outline to the gem for better definition
ChakraApp.CircleView.prototype.addGemOutline = function(svg, gemConfig) {
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
};

// Add highlights/sparkles to the gem
ChakraApp.CircleView.prototype.addGemHighlights = function(svg, gemConfig) {
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
    var duration = 7 + Math.random() * 3 + 's'; // 2-5 seconds
    var delay = 5 + Math.random() * 2 + 's'; // 0-2 seconds delay
    
    sparkleElement.setAttribute('class', 'sparkle');
    sparkleElement.style.setProperty('--duration', duration);
    sparkleElement.style.setProperty('--delay', delay);
    
    // Add sparkle to container, and container to SVG
    sparkleContainer.appendChild(sparkleElement);
    svg.appendChild(sparkleContainer);
  });
  
};

ChakraApp.CircleView.prototype.renderShapeBasedOnType = function() {
  var circleType = this.viewModel.circleType;
  
  switch (circleType) {
    case 'triangle':
      this._renderTriangle();
      break;
    case 'gem':
      this._renderGem();
      break;
    case 'standard':
    default:
      this._renderStandardCircle();
      break;
  }
};



ChakraApp.CircleView.prototype.renderShapeBasedOnConcept = function() {
  var conceptType = this._getConceptTypeForCircle();
  
  // Get the circle's document
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  var docPanelId = doc ? doc.panelId : null;
  
  // DIRECT CHECK: If circleType is 'triangle', always render as triangle
  if (this.viewModel.circleType === 'triangle') {
    this._renderTriangle();
    return;
  }
  
  // First, check if this is explicitly a gem type circle by properties or color
  if (this.viewModel.circleType === 'gem' || this.viewModel.color === '#4a6fc9' || docPanelId === 'bottom') {
    // Render as gem if it's a gem type circle
    this._renderGem();
    return;
  }
  
  // Rest of the original logic
  if (conceptType) {
    // For triangles in things panel, check if there's a completion level
    if (conceptType.shape === 'triangle' && docPanelId === 'things') {
      // ALWAYS render as triangle regardless of completion level
      this._renderTriangle();
    } else {
      this.renderShapeByType(conceptType.shape);
    }
  } else {
    this._renderStandardCircle();
  }
};
  
  ChakraApp.CircleView.prototype.renderShapeByType = function(shapeType) {
    var shapeRenderers = {
      'triangle': this._renderTriangle,
      'star': this._renderStar,
      'hexagon': this._renderHexagon,
      'oval': this._renderOval,
      'diamond': this._renderDiamond
    };
    
    var renderMethod = shapeRenderers[shapeType] || this._renderStandardCircle;
    renderMethod.call(this);
  };

  ChakraApp.CircleView.prototype.addNameElement = function() {
    this.nameElement = this._createElement('div', {
      className: 'item-name',
      contentEditable: true,
      textContent: this.viewModel.name,
      style: {
	    color: ChakraApp.appState.getDocument(ChakraApp.appState.circles.get(this.viewModel.id).documentId).panelId == 'things' ? '#88B66d' : 'white',
      }
    });
    this.element.appendChild(this.nameElement);
  };

  ChakraApp.CircleView.prototype.applySelectionState = function() {
    if (this.viewModel.isSelected) {
      this.element.classList.add('selected');
    }
  };

  ChakraApp.CircleView.prototype.addToParent = function() {
    this.parentElement.appendChild(this.element);
  };

  ChakraApp.CircleView.prototype._getConceptTypeForCircle = function() {
    if (!this.ensureConceptTypesExist()) return null;
    var panelId = ChakraApp.appState.getDocument(this.viewModel.documentId).panelId
    var conceptType = this.getConceptTypeByPanelId(panelId);
    return conceptType;
  };
  
  ChakraApp.CircleView.prototype._getConceptTypeForPanel = function() {
    if (!this.ensureConceptTypesExist()) return null;
    
    var conceptType = this.getConceptTypeFromDataAttribute();
    if (conceptType) return conceptType;
    
    return this.getConceptTypeByPanelId();
  };
  
  ChakraApp.CircleView.prototype.ensureConceptTypesExist = function() {
    return !!ChakraApp.Config.conceptTypes;
  };
  
  ChakraApp.CircleView.prototype.getConceptTypeFromDataAttribute = function() {
    if (this.panelId && this.parentElement) {
      var panel = this.parentElement.closest('.circle-panel');
      if (panel && panel.dataset.conceptType) {
        var conceptTypeId = panel.dataset.conceptType;
        return this.findConceptTypeById(conceptTypeId);
      }
    }
    return null;
  };
  
  ChakraApp.CircleView.prototype.findConceptTypeById = function(conceptTypeId) {
    return ChakraApp.Config.conceptTypes.find(function(type) {
      return type.id === conceptTypeId;
    });
  };
  
  ChakraApp.CircleView.prototype.getConceptTypeByPanelId = function(panelId) {
	  if (!panelId) { panelId = this.panelId };
    if (panelId) {
      return ChakraApp.Config.conceptTypes.find(function(type) {
        return type.id === panelId;
      }, this);
    }
    return null;
  };

  // Shared shape rendering utilities
  ChakraApp.CircleView.prototype.createShapeWrap = function(className) {
    this.shapeWrap = this._createElement('div', {
      className: className || 'shape-wrap',
      style: { position: 'absolute' }
    });
    return this.shapeWrap;
  };
  
  ChakraApp.CircleView.prototype.createShapeElement = function(className, styles) {
    var element = this._createElement('div', {
      className: className,
      style: styles
    });
    this.shapeWrap.appendChild(element);
    return element;
  };
  
  ChakraApp.CircleView.prototype.appendShapeToElement = function() {
    this.element.appendChild(this.shapeWrap);
  };
  
  ChakraApp.CircleView.prototype.getBaseShapeStyles = function(color) {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      backgroundColor: color || this.viewModel.color,
      transition: 'transform 0.3s ease'
    };
  };

  ChakraApp.CircleView.prototype._renderTriangle = function() {
	  var completionLevel = this.getCompletionLevel();
	  this.createTriangleShapeWrap(completionLevel);
	  this.createTriangleShapeByCompletionLevel(completionLevel);
	    this._createChakraForm();
	  this.element.appendChild(this.shapeWrap);
  };
  
  ChakraApp.CircleView.prototype.getCompletionLevel = function() {
  if (!this.viewModel.characteristics || !this.viewModel.characteristics.completion) {
    return "no-completion";
  }
  return this.viewModel.characteristics.completion;
};
  
  ChakraApp.CircleView.prototype.createTriangleShapeWrap = function(completionLevel) {
    this.shapeWrap = this._createElement('div', {
      className: 'shape-wrap triangle-wrap completion-' + completionLevel,
      style: this.getTriangleWrapStyles(),
      events: { click: this.getTriangleClickHandler() }
    });
  };
  
  ChakraApp.CircleView.prototype.getTriangleWrapStyles = function() {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      cursor: 'pointer',
      backgroundColor: 'rgba(0,0,0,0.001)',
      zIndex: '10'
    };
  };
  
  ChakraApp.CircleView.prototype.getTriangleClickHandler = function() {
    return (e) => {
      e.stopPropagation();
      if (!window.wasDragged) {
        this.viewModel.select();
      }
    };
  };
  
  ChakraApp.CircleView.prototype.createTriangleShapeByCompletionLevel = function(completionLevel) {
    var levelCreators = {
      "level0": this.createLevel0Triangle,
      "level1": this.createLevel1Triangle,
      "level2": this.createLevel2Triangle
    };
    
    var createMethod = levelCreators[completionLevel] || this.createLevel2Triangle;
    createMethod.call(this);
  };

  ChakraApp.CircleView.prototype.createLevel0Triangle = function() {
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape level0',
      style: this.getLevel0TriangleStyles()
    });
    this.shapeWrap.appendChild(this.triangleShape);
  };
  
  ChakraApp.CircleView.prototype.getLevel0TriangleStyles = function() {
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
  };
  
  ChakraApp.CircleView.prototype.createLevel1Triangle = function() {
    this.createTriangleOutline();
    this.createTriangleShape();
    this.shapeWrap.appendChild(this.triangleShape);
    this.shapeWrap.appendChild(this.triangleOutline);
  };
  
  ChakraApp.CircleView.prototype.createTriangleOutline = function() {
    this.triangleOutline = this._createElement('div', {
      className: 'triangle-outline',
      style: this.getTriangleOutlineStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getTriangleOutlineStyles = function() {
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
  };
  
  ChakraApp.CircleView.prototype.createTriangleShape = function() {
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape level1',
      style: this.getLevel1TriangleStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getLevel1TriangleStyles = function() {
    return {
      position: 'absolute',
      width: '25px',
      height: '25px',
      backgroundColor: this.viewModel.color,
      clipPath: 'polygon(20% 70%, 0% 100%, 100% 100%, 80% 70%)',
      transition: 'transform 0.3s ease',
      transform: 'scale(0.90)',
      zIndex: '5',
      pointerEvents: 'none'
    };
  };
  
  ChakraApp.CircleView.prototype.createLevel2Triangle = function() {
    this.createMainTriangle();
    this.createPyramidSide();
    this.shapeWrap.appendChild(this.triangleShape);
    this.shapeWrap.appendChild(this.pyramidSide);
  };
  
  ChakraApp.CircleView.prototype.createMainTriangle = function() {
    this.triangleShape = this._createElement('div', {
      className: 'triangle-shape level2',
      style: this.getLevel2TriangleStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getLevel2TriangleStyles = function() {
    return {
      position: 'absolute',
      width: '30px',
      height: '30px',
      backgroundColor: this.viewModel.color,
      clipPath: 'polygon(45% 0%, 0% 100%, 90% 100%)',
      transition: 'transform 0.3s ease',
      transform: 'scale(0.90) translate(-3px, -3px)',
      zIndex: '5',
      pointerEvents: 'none'
    };
  };
  
  ChakraApp.CircleView.prototype.createPyramidSide = function() {
    this.pyramidSide = this._createElement('div', {
      className: 'pyramid-side level2',
      style: this.getPyramidSideStyles()
    });
  };
  
  ChakraApp.CircleView.prototype.getPyramidSideStyles = function() {
  // Create a darker shade of the triangle color
  var darkerColor = this.createDarkerShade(this.viewModel.color);
  
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
};

ChakraApp.CircleView.prototype._renderSimpleCircleGlow = function() {
  this.createGlowElement();
};

ChakraApp.CircleView.prototype.createDarkerShade = function(color) {
  // Handle different color formats
  var r, g, b;
  
  // Parse rgb/rgba format
  if (color.startsWith('rgb')) {
    var rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      r = parseInt(rgbValues[0]);
      g = parseInt(rgbValues[1]);
      b = parseInt(rgbValues[2]);
    }
  } 
  // Parse hex format
  else if (color.startsWith('#')) {
    var hex = color.substring(1);
    // Handle both 3-digit and 6-digit hex
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  
  // If parsing failed or color format is not recognized, return a default darker gray
  if (r === undefined || g === undefined || b === undefined) {
    return 'rgb(100, 100, 100)';
  }
  
  // Darken the color by reducing each component by 30%
  r = Math.max(0, Math.floor(r * 0.7));
  g = Math.max(0, Math.floor(g * 0.7));
  b = Math.max(0, Math.floor(b * 0.7));
  
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
};

  // Consolidated similar shape rendering methods
  ChakraApp.CircleView.prototype._renderBasicShape = function(shapeType, clipPath) {
    this.createShapeWrap();
    var styles = this.getBaseShapeStyles();
    styles.clipPath = clipPath;
    styles.transform = 'translate(-50%, -50%)';
    
    this[shapeType + 'Shape'] = this.createShapeElement(shapeType + '-shape', styles);
    this.appendShapeToElement();
  };
  
  ChakraApp.CircleView.prototype._renderHexagon = function() {
    this._renderBasicShape('hexagon', 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)');
  };

  ChakraApp.CircleView.prototype._renderDiamond = function() {
    this._renderBasicShape('diamond', 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)');
  };

  ChakraApp.CircleView.prototype._renderStar = function() {
    this._renderBasicShape('star', 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)');
  };

  ChakraApp.CircleView.prototype._renderOval = function() {
    this.createShapeWrap();
    var styles = this.getBaseShapeStyles();
    styles.width = '30px';
    styles.height = '20px';
    styles.borderRadius = '50%';
    styles.transform = 'translate(-50%, -50%)';
    
    this.ovalShape = this.createShapeElement('oval-shape', styles);
    this.appendShapeToElement();
  };

  ChakraApp.CircleView.prototype._renderStandardCircle = function() {
    this.createGlowElement();
    this._createParticles();
    this._createChakraForm();
  };
  
  ChakraApp.CircleView.prototype.createGlowElement = function() {
    this.glowElement = this._createElement('div', {
      className: 'circle-glow',
      style: { backgroundColor: this.viewModel.color }
    });
    this.element.appendChild(this.glowElement);
  };

  ChakraApp.CircleView.prototype._createParticles = function() {
    var particlesElement = this._createElement('div', { className: 'particles' });
    this.createParticleSet(particlesElement, 1);
    this.createParticleSet(particlesElement, 2);
    this.element.appendChild(particlesElement);
  };
  
  ChakraApp.CircleView.prototype.createParticleSet = function(parentElement, index) {
    var angleElement = this._createElement('div', { className: 'angle' });
    var positionElement = this._createElement('div', { className: 'position' });
    var pulseElement = this._createElement('div', { className: 'pulse' });
    
    this.createParticleElement(pulseElement);
    positionElement.appendChild(pulseElement);
    angleElement.appendChild(positionElement);
    parentElement.appendChild(angleElement);
  };
  
  ChakraApp.CircleView.prototype.createParticleElement = function(parentElement) {
    var particleElement = this._createElement('div', {
      className: 'particle',
      style: { backgroundColor: this.viewModel.color }
    });
    parentElement.appendChild(particleElement);
  };
  
  ChakraApp.CircleView.prototype._createChakraForm = function() {
    var chakraForm = this.viewModel.chakraForm;
    var outerContainer = this._createElement('div', { className: 'outer-polygon-container' });
    
    for (var i = 0; i < chakraForm.length; i++) {
      this.createChakraFormShape(outerContainer, chakraForm[i]);
    }
    
    this.element.appendChild(outerContainer);
  };
  
  ChakraApp.CircleView.prototype.createChakraFormShape = function(outerContainer, form) {
    var innerContainer = this._createElement('div', {
      className: 'inner-polygon-container',
      style: { 
        transform: 'rotate(' + (form.rotate || 0) + 'deg) scale(' + (form.scale || 1) + ')'
      }
    });
    
    var innermostContainer = this._createElement('div', {
      className: 'inner-polygon-container',
      style: {
        filter: 'drop-shadow(0 0 3px #AAA)',
        mixBlendMode: 'screen',
        animation: (form.reverse ? 'anglerev' : 'angle') + ' ' + 
                  (form.spinTime || 16) + 's linear infinite'
      }
    });
    
    var shapeElement = this._createElement('div', {
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
  };
  
  ChakraApp.CircleView.prototype.update = function() {
    this.updatePosition();
    this.updateTriangleCompletionIfNeeded();
    this.updateColors();
    this.updateName();
    this.updateSelectionState();
    this.updateDimmingState();
    this.updateChakraFormIfNeeded();
  };
  
  ChakraApp.CircleView.prototype.updatePosition = function() {
    this.element.style.left = this.viewModel.x + 'px';
    this.element.style.top = this.viewModel.y + 'px';
  };
  
ChakraApp.CircleView.prototype.updateTriangleCompletionIfNeeded = function() {
  var conceptType = this._getConceptTypeForCircle();
  if (conceptType && conceptType.shape === 'triangle' && this.shapeWrap) {
    var completionLevel = this.getCompletionLevel();
    
    // If this is a things panel circle with no completion level, 
    // we need to convert it to a circle-glow
    if (this.panelId === 'things' && completionLevel === "no-completion") {
      // Remove the existing triangle shape
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      
      // Render as simple circle glow instead
      this._renderSimpleCircleGlow();
      
      // Re-add the name element and closest indicator
      this.addNameElement();
      this.addClosestIndicator();
    } else {
      // Update the triangle shape as usual
      this.shapeWrap.className = 'shape-wrap triangle-wrap completion-' + completionLevel;
      
      while (this.shapeWrap.firstChild) {
        this.shapeWrap.removeChild(this.shapeWrap.firstChild);
      }
      
      this.createTriangleShapeByCompletionLevel(completionLevel);
    }
  }
};

ChakraApp.CircleView.prototype._isGemType = function() {
  // Check explicit circle type
  if (this.viewModel.circleType === 'gem') {
    return true;
  }
  
  // Check color as a fallback
  if (this.viewModel.color === '#4a6fc9') {
    return true;
  }
  
  // Check document panel for backward compatibility
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  if (doc && doc.panelId === 'bottom') {
    return true;
  }
  
  return false;
};
  
ChakraApp.CircleView.prototype.updateColors = function() {
  // Update regular circle elements
  if (this.glowElement) {
    this.glowElement.style.backgroundColor = this.viewModel.color;
    
    var particles = this.element.querySelectorAll('.particle');
    for (var i = 0; i < particles.length; i++) {
      particles[i].style.backgroundColor = this.viewModel.color;
    }
  }
  
  // Check if this is a gem-type circle by direct property or by panel type
  var isGemType = this.viewModel.circleType === 'gem' || 
                  this.viewModel.color === '#4a6fc9';
  
  // Also check document panel for backward compatibility
  var doc = ChakraApp.appState.getDocument(this.viewModel.documentId);
  var isPanelBottom = doc && doc.panelId === 'bottom';
  
  if ((isGemType || isPanelBottom || this.panelId === 'bottom') && this.shapeWrap) {
    // Find the SVG element inside the shape wrap
    var svg = this.shapeWrap.querySelector('svg');
    if (svg) {
      // Calculate new colors based on the updated viewModel color
      var baseColor = this.viewModel.color;
      var darkerColor = this.createDarkerShade(baseColor);
      var lighterColor = this.createLighterShade(baseColor);
      
      // Update all polygon facets
      var polygons = svg.querySelectorAll('polygon');
      for (var i = 0; i < polygons.length; i++) {
        // Alternate between base color and darker color for facets
        // First polygon is often the table, which might have a special color
        var color = (i === 0) ? lighterColor : 
                   (i % 2 === 1) ? baseColor : darkerColor;
        
        // Update fill color directly for simple fills
        if (!polygons[i].getAttribute('fill').startsWith('url(#')) {
          polygons[i].setAttribute('fill', color);
        }
      }
      
      // Update gradients if they exist
      var gradients = svg.querySelectorAll('linearGradient, radialGradient');
      for (var i = 0; i < gradients.length; i++) {
        var stops = gradients[i].querySelectorAll('stop');
        for (var j = 0; j < stops.length; j++) {
          // Update stop colors based on position
          if (stops[j].getAttribute('offset') === "0%" || 
              stops[j].getAttribute('offset') === "100%") {
            // Edge stops use the base or darker color
            stops[j].setAttribute('stop-color', j % 2 === 0 ? baseColor : darkerColor);
          } else {
            // Middle stops use lighter color for sheen
            stops[j].setAttribute('stop-color', lighterColor);
          }
        }
      }
    }
  }
};
  
  ChakraApp.CircleView.prototype.updateName = function() {
    this.nameElement.textContent = this.viewModel.name;
  };
  
  ChakraApp.CircleView.prototype.updateSelectionState = function() {
    this.element.classList.toggle('selected', this.viewModel.isSelected);
  };
  
  ChakraApp.CircleView.prototype.updateDimmingState = function() {
    this.element.classList.toggle('dimmed', this.viewModel.isDimmed);
  };
  
  ChakraApp.CircleView.prototype.updateChakraFormIfNeeded = function() {
    if (this.viewModel.squareCountChanged) {
      var existingContainer = this.element.querySelector('.outer-polygon-container');
      if (existingContainer) {
        this.element.removeChild(existingContainer);
      }
      
      this._createChakraForm();
    }
  };
  
  ChakraApp.CircleView.prototype._setupEventListeners = function() {
    var self = this;
    
    this.element.addEventListener('click', function(e) {
      if (e.target === self.element) {
        e.stopPropagation();
        if (!window.wasDragged) {
          self.viewModel.select();
        }
      }
    });
    
    this.nameElement.addEventListener('blur', function() {
      var oldName = self.viewModel.name;
      var newName = this.textContent;
      if (oldName !== newName) {
        self.viewModel.updateName(newName);
      }
    });
    
    this.nameElement.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
    
    this.nameElement.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    this._addDragFunctionality();
  };
  
  ChakraApp.CircleView.prototype._addDragFunctionality = function() {
    var isDragging = false;
    var self = this;
    
    this.element.addEventListener('mousedown', function(e) {
      var dragTargets = [self.element, self.glowElement, self.shapeWrap];
      var dragClasses = ['shape-wrap', 'triangle-shape', 'star-shape', 
                        'hexagon-shape', 'oval-shape', 'diamond-shape'];
      
      var isTarget = dragTargets.includes(e.target) || 
                     dragClasses.some(function(cls) { return e.target.classList.contains(cls); });
      
      if (isTarget) {
        e.preventDefault();
        isDragging = true;
        window.wasDragged = false;
        self.element.classList.add('no-transition');
        self.element.style.zIndex = 20;
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        e.preventDefault();
        window.wasDragged = true;
        
        var zoomContainer = self.parentElement;
        var containerRect = zoomContainer.getBoundingClientRect();
        
        var x = Math.max(0, Math.min(containerRect.width, e.clientX - containerRect.left));
        var y = Math.max(0, Math.min(containerRect.height, e.clientY - containerRect.top));
        
        self.element.style.left = x + 'px';
        self.element.style.top = y + 'px';
        
        var panelId = self.parentElement.getAttribute('data-panel-id');
        if (panelId === 'left') {
          var meridianX = ChakraApp.Config.meridian.x;
          var distanceToMeridian = Math.abs(x - meridianX);
          
          if (distanceToMeridian < ChakraApp.Config.meridian.snapThreshold) {
            self.element.style.left = meridianX + 'px';
            self.element.classList.add('snapping');
          } else {
            self.element.classList.remove('snapping');
          }
        }
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        
        var finalX = parseFloat(self.element.style.left);
        var finalY = parseFloat(self.element.style.top);
        self.viewModel.updatePosition(finalX, finalY);
        
        self.element.style.zIndex = self.viewModel.isSelected ? 15 : 10;
        self.element.classList.remove('no-transition');
        
        ChakraApp.appState.saveToStorageNow();
        
        setTimeout(function() {
          window.wasDragged = false;
        }, 50);
      }
    });
    
    this._addHandler(function() {
      document.removeEventListener('mousemove', self.mouseMoveHandler);
      document.removeEventListener('mouseup', self.mouseUpHandler);
    });
  };
})(window.ChakraApp = window.ChakraApp || {});
