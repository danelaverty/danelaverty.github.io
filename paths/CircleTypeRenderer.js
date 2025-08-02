import { injectComponentStyles } from './styleUtils.js';
import { adjustBrightness, darken, lighten } from './colorUtils.js';

// Updated styles with unified selection approach and gem support
const circleTypeStyles = `
    /* Universal selection indicator - works for all circle types */
    .circle-selection-indicator {
        position: absolute;
        top: -6px;
        left: -6px;
        right: -6px;
        bottom: -6px;
        border: 3px solid transparent;
        border-radius: 50%;
        pointer-events: none;
        z-index: 15; /* Above all circle content */
        transition: all 0.2s ease;
    }

    .circle-selection-indicator.selected {
        border-color: #ffff00;
        box-shadow: 0 0 10px #ffff00;
        animation: selection-pulse 2s ease-in-out infinite;
    }

    @keyframes selection-pulse {
        0%, 100% { box-shadow: 0 0 10px #ffff00; }
        50% { box-shadow: 0 0 20px #ffff00; }
    }

    /* For triangle circles, adjust the selection indicator */
    .triangle-container .circle-selection-indicator {
        border-radius: 0;
        border-style: dashed;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
    }

    .triangle-container .circle-selection-indicator.selected {
        animation: triangle-selection-dash 2s linear infinite;
    }

    @keyframes triangle-selection-dash {
        0% { border-style: dashed; }
        50% { border-style: solid; }
        100% { border-style: dashed; }
    }

    /* Basic circle type (default) */
    .circle-type-basic {
        border-radius: 50%;
        background-color: var(--circle-color);
        border: 3px solid var(--circle-border-color, #45a049);
    }

    /* Glow circle type - no circle background, just effects */
    .circle-type-glow {
        background-color: transparent !important;
        border: 3px solid transparent !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    .circle-glow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: var(--circle-color);
        z-index: 1;
        animation: glow 3s linear 0s infinite alternate;
        pointer-events: none;
    }

    @keyframes glow {
        0% { filter: blur(5px); }
        100% { filter: blur(10px); }
    }

    /* Triangle circle type - NO CIRCLE BACKGROUND */
    .circle-type-triangle {
        border-radius: 0;
        background-color: transparent;
        border: none;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Triangle container */
    .triangle-container {
        background-color: transparent;
        border: none;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Triangle shape wrapper */
    .triangle-wrap {
        position: absolute;
        width: 32px;
        height: 32px;
        cursor: pointer;
        background-color: rgba(0,0,0,0.001);
        z-index: 10;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    /* Triangle completion levels */
    .triangle-wrap.completion-level0 .triangle-shape {
        background-color: transparent;
        border: 2px dashed rgba(255, 255, 255, 0.4);
        clip-path: none;
        width: 30px;
        height: 30px;
    }

    .triangle-wrap.completion-level1 .triangle-outline {
        position: absolute;
        width: 30px;
        height: 30px;
        background-color: transparent;
        border: 2px dashed rgba(255, 255, 255, 0.4);
        z-index: 6;
        pointer-events: none;
    }

    .triangle-wrap.completion-level1 .triangle-shape {
        background-color: var(--circle-color);
        clip-path: polygon(20% 70%, 0% 100%, 100% 100%, 80% 70%);
    }

    .triangle-wrap.completion-level2 .triangle-shape,
    .triangle-wrap.completion-no-completion .triangle-shape {
        background-color: var(--circle-color);
        clip-path: polygon(45% 0%, 0% 100%, 90% 100%);
        width: 32px;
        height: 32px;
    }

    .triangle-shape {
        position: absolute;
        width: 32px;
        height: 32px;
        transition: transform 0.3s ease;
        z-index: 5;
        pointer-events: none;
    }

    .pyramid-side {
        position: absolute;
        width: 32px;
        height: 32px;
        background-color: var(--circle-darker-color);
        clip-path: polygon(45% 0%, 90% 100%, 100% 70%);
        transition: transform 0.3s ease;
        z-index: 5;
        pointer-events: none;
    }

    /* Gem circle type */
    .circle-type-gem {
        background-color: transparent !important;
        border: none !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    .gem-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        cursor: pointer;
        z-index: 5;
    }

    .gem-svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
    }

    /* Sparkle animations */
    @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0.7); }
        50% { opacity: 1; transform: scale(1); }
    }

    .gem-sparkle {
        animation: sparkle var(--duration, 4s) infinite ease-in-out;
        animation-delay: var(--delay, 0s);
        transform-origin: center;
    }

    /* Facet sheen animation */
    @keyframes gem-sheen {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }

    .gem-facet {
        animation: gem-sheen var(--sheen-duration, 3s) infinite ease-in-out;
        animation-delay: var(--sheen-delay, 0s);
    }

    /* Particles for glow type */
    .particles {
        position: absolute;
        top: 100%;
        left: 100%;
        width: 100%;
        height: 100%;
        pointer-events: none;
        transform: scale(2);
    }

    .angle {
        position: absolute;
        top: 0;
        left: 0;
    }

    .position {
        position: absolute;
        top: 0;
        left: 0;
    }

    .pulse {
        position: absolute;
        top: 0;
        left: 0;
        animation: pulse 1.5s linear 0s infinite alternate;
    }

    .particle {
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        border: 1px solid white;
        background-color: var(--circle-color);
    }

    @keyframes angle {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes position {
        0% { transform: translate(0,0); opacity: 1; }
        100% { transform: translate(5px,5px); opacity: 0; }
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        100% { transform: scale(.5); }
    }

    /* Chakra Form (Polygon Shapes) for glow type */
    .outer-polygon-container {
        position: absolute;
        transform: scale(.8);
        top: 50%;
        left: 50%;
        transform-origin: center center;
    }

    .inner-polygon-container {
        position: absolute;
        transform-origin: 50% 50%;
        width: 0;
        height: 0;
    }

    .shape {
        width: 40px;
        height: 40px;
        background-color: #FFA;
        transform: translate(-50%, -50%);
    }

    /* Animation classes for chakra forms */
    .angle-animation {
        animation: angle 16s linear infinite;
    }

    .angle-reverse-animation {
        animation: anglerev 16s linear infinite;
    }

    @keyframes anglerev {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
    }

    /* Multi-color flow for glow type */
    .color-flow-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
        filter: blur(4px);
    }

    .gradient-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        mix-blend-mode: overlay;
        opacity: 0.8;
    }

    .gradient-layer:first-child {
        mix-blend-mode: normal;
    }
`;

injectComponentStyles('circle-type-renderer', circleTypeStyles);

export const CircleTypeRenderer = {
    /**
     * Render a circle based on its type with unified selection handling
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     * @param {boolean} isSelected - Whether the circle is selected
     */
    render(element, circle, isSelected = false, squareCount = null) {
	    if (!element) {
        console.warn('CircleTypeRenderer.render called with null element');
        return;
    }
        // Clear existing content but preserve selection indicator
        this.clearCircleContent(element);
        
        // Set CSS properties
        this.setColorProperties(element, circle);
        
        const currentType = circle.type || 'basic';
        
        // Set the appropriate type class
	if (element && element.classList) {
    element.classList.remove('circle-type-basic', 'circle-type-glow', 'circle-type-triangle', 'circle-type-gem');
    element.classList.add(`circle-type-${currentType}`);
}
        
        // Render based on type
        switch (currentType) {
            case 'glow':
                this.renderGlowType(element, circle, squareCount);
                break;
            case 'triangle':
                this.renderTriangleType(element, circle);
                break;
            case 'gem':
                this.renderGemType(element, circle);
                break;
            default:
                this.renderBasicType(element, circle);
                break;
        }

        // Handle selection indicator
        this.updateSelectionIndicator(element, isSelected);
    },

    /**
     * Clear existing circle content but preserve selection indicator
     */
    clearCircleContent(element) {
        // Check if element exists first
        if (!element) return;
        
        // Remove type-specific elements but keep selection indicator
        const elementsToRemove = [
            '.circle-glow',
            '.particles',
            '.triangle-wrap',
            '.triangle-shape',
            '.pyramid-side',
            '.triangle-outline',
            '.color-flow-overlay',
            '.outer-polygon-container',
            '.gem-container' // Add gem container to cleanup
        ];
        
        elementsToRemove.forEach(selector => {
            try {
                const elements = element.querySelectorAll(selector);
                if (elements) {
                    elements.forEach(el => {
                        if (el && el.parentNode) {
                            el.remove();
                        }
                    });
                }
            } catch (error) {
                console.warn(`Error removing elements with selector ${selector}:`, error);
            }
        });
    },

    /**
     * Update selection indicator - unified approach for all circle types
     */
    updateSelectionIndicator(element, isSelected) {
        if (!element) return;
        
        let indicator = element.querySelector('.circle-selection-indicator');
        
        if (!indicator) {
            // Create the selection indicator if it doesn't exist
            indicator = document.createElement('div');
            indicator.className = 'circle-selection-indicator';
            element.appendChild(indicator);
        }
        
        // Update selection state
        if (isSelected) {
            indicator.classList.add('selected');
        } else {
            indicator.classList.remove('selected');
        }
    },

    /**
     * Remove selection indicator completely
     */
    removeSelectionIndicator(element) {
        if (!element) return;
        
        const indicator = element.querySelector('.circle-selection-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    /**
     * Set CSS custom properties for colors
     */
    setColorProperties(element, circle) {
        if (!element) return;
        
        const colors = circle.colors || [circle.color] || ['#4CAF50'];
        const primaryColor = colors[0];
        
        element.style.setProperty('--circle-color', primaryColor);
        element.style.setProperty('--circle-border-color', adjustBrightness(primaryColor, -10));
        element.style.setProperty('--circle-darker-color', adjustBrightness(primaryColor, -30));
    },

    /**
     * Render basic circle type
     */
    renderBasicType(element, circle) {
        if (!element) return;
        element.style.backgroundColor = circle.colors?.[0] || circle.color || '#4CAF50';
    },

    /**
     * Render glow circle type
     */
    renderGlowType(element, circle, squareCount) {
        if (!element) return;
        
        // Create glow element
        const glowElement = document.createElement('div');
        glowElement.className = 'circle-glow';
        element.appendChild(glowElement);

        // Create particles
        this.createParticles(element, circle);

        // Create chakra form
        this.createChakraForm(element, circle, squareCount);

        // Handle multi-color flow if multiple colors
        if (circle.colors && circle.colors.length > 1) {
            this.startOrganicColorFlow(element, circle.colors);
        }
    },

    /**
     * Render triangle circle type
     */
    renderTriangleType(element, circle) {
        if (!element) return;
        
        // Get completion level
        const completionLevel = this.getCompletionLevel(circle);
        
        // Create triangle wrapper
        const triangleWrap = document.createElement('div');
        triangleWrap.className = `triangle-wrap completion-${completionLevel}`;
        
        // Create triangle shape based on completion level
        this.createTriangleShapeByCompletionLevel(triangleWrap, circle, completionLevel);
        
        element.appendChild(triangleWrap);
    },

    /**
     * Render gem circle type
     */
    renderGemType(element, circle) {
        if (!element) return;
        
        // Create gem container
        const gemContainer = document.createElement('div');
        gemContainer.className = 'gem-container';
        
        // Create SVG
        const svg = this.createGemSVG(circle);
        gemContainer.appendChild(svg);
        
        element.appendChild(gemContainer);
        
        // Start color cycling for multi-color gems
        if (circle.colors && circle.colors.length > 1) {
            this.startGemColorCycling(element, circle);
        }
    },

    /**
     * Create the gem SVG with 9 facets (simplified)
     */
    createGemSVG(circle) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'gem-svg');
        svg.setAttribute('width', '32');
        svg.setAttribute('height', '32');
        svg.setAttribute('viewBox', '0 0 32 32');
        
        // Create defs for gradients
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
        
        const colors = circle.colors || [circle.color] || ['#4CAF50'];
        const primaryColor = colors[0];
        const lighterColor = adjustBrightness(primaryColor, 30);
        const darkerColor = adjustBrightness(primaryColor, -20);
        
        // Generate 9 facet points in a circle
        const center = { x: 16, y: 16 };
        const outerRadius = 12;
        const innerRadius = 6;
        const facetCount = 9;
        
        const outerPoints = [];
        const innerPoints = [];
        
        for (let i = 0; i < facetCount; i++) {
            const angle = (i / facetCount) * 2 * Math.PI - Math.PI / 2;
            
            outerPoints.push({
                x: center.x + outerRadius * Math.cos(angle),
                y: center.y + outerRadius * Math.sin(angle)
            });
            
            innerPoints.push({
                x: center.x + innerRadius * Math.cos(angle),
                y: center.y + innerRadius * Math.sin(angle)
            });
        }
        
        // Create gradients for facets
        this.createGemGradients(defs, primaryColor, lighterColor, darkerColor);
        
        // Create facets (trapezoids from inner to outer points)
        for (let i = 0; i < facetCount; i++) {
            const nextI = (i + 1) % facetCount;
            
            const facetPoints = [
                innerPoints[i],
                innerPoints[nextI],
                outerPoints[nextI],
                outerPoints[i]
            ];
            
            const facet = this.createGemFacet(facetPoints, i, facetCount);
            svg.appendChild(facet);
        }
        
        // Create center table (inner circle with special gradient)
        const table = this.createGemTable(innerPoints, defs, primaryColor, lighterColor);
        svg.appendChild(table);
        
        // Add outline
        const outline = this.createGemOutline(outerPoints);
        svg.appendChild(outline);
        
        // Add sparkles
        this.addGemSparkles(svg);
        
        return svg;
    },

    /**
     * Create gradients for gem facets
     */
    createGemGradients(defs, primaryColor, lighterColor, darkerColor) {
        // Main facet gradient
        const mainGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        mainGradient.setAttribute('id', 'gemFacetGradient');
        mainGradient.setAttribute('x1', '0%');
        mainGradient.setAttribute('y1', '0%'); 
        mainGradient.setAttribute('x2', '100%');
        mainGradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', primaryColor);
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '50%');
        stop2.setAttribute('stop-color', lighterColor);
        
        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop3.setAttribute('offset', '100%');
        stop3.setAttribute('stop-color', primaryColor);
        
        mainGradient.appendChild(stop1);
        mainGradient.appendChild(stop2);
        mainGradient.appendChild(stop3);
        defs.appendChild(mainGradient);
        
        // Dark facet gradient
        const darkGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        darkGradient.setAttribute('id', 'gemFacetGradientDark');
        darkGradient.setAttribute('x1', '0%');
        darkGradient.setAttribute('y1', '0%');
        darkGradient.setAttribute('x2', '100%');
        darkGradient.setAttribute('y2', '100%');
        
        const darkStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        darkStop1.setAttribute('offset', '0%');
        darkStop1.setAttribute('stop-color', darkerColor);
        
        const darkStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        darkStop2.setAttribute('offset', '50%');
        darkStop2.setAttribute('stop-color', primaryColor);
        
        const darkStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        darkStop3.setAttribute('offset', '100%');
        darkStop3.setAttribute('stop-color', darkerColor);
        
        darkGradient.appendChild(darkStop1);
        darkGradient.appendChild(darkStop2);
        darkGradient.appendChild(darkStop3);
        defs.appendChild(darkGradient);
        
        // Table gradient (for center)
        const tableGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        tableGradient.setAttribute('id', 'gemTableGradient');
        tableGradient.setAttribute('cx', '30%');
        tableGradient.setAttribute('cy', '30%');
        tableGradient.setAttribute('r', '70%');
        
        const tableStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        tableStop1.setAttribute('offset', '0%');
        tableStop1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.9)');
        
        const tableStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        tableStop2.setAttribute('offset', '70%');
        tableStop2.setAttribute('stop-color', lighterColor);
        
        const tableStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        tableStop3.setAttribute('offset', '100%');
        tableStop3.setAttribute('stop-color', primaryColor);
        
        tableGradient.appendChild(tableStop1);
        tableGradient.appendChild(tableStop2);
        tableGradient.appendChild(tableStop3);
        defs.appendChild(tableGradient);
    },

    /**
     * Create a single gem facet
     */
    createGemFacet(points, index, total) {
        const facet = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        
        facet.setAttribute('points', pointsStr);
        facet.setAttribute('fill', index % 2 === 0 ? 'url(#gemFacetGradient)' : 'url(#gemFacetGradientDark)');
        facet.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        facet.setAttribute('stroke-width', '0.5');
        facet.classList.add('gem-facet');
        
        // Random animation timing
        facet.style.setProperty('--sheen-duration', (2 + Math.random() * 2) + 's');
        facet.style.setProperty('--sheen-delay', (Math.random() * 2) + 's');
        
        return facet;
    },

    /**
     * Create the gem table (center)
     */
    createGemTable(innerPoints, defs, primaryColor, lighterColor) {
        const table = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = innerPoints.map(p => `${p.x},${p.y}`).join(' ');
        
        table.setAttribute('points', pointsStr);
        table.setAttribute('fill', 'url(#gemTableGradient)');
        table.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
        table.setAttribute('stroke-width', '0.5');
        
        return table;
    },

    /**
     * Create gem outline
     */
    createGemOutline(outerPoints) {
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = outerPoints.map(p => `${p.x},${p.y}`).join(' ');
        
        outline.setAttribute('points', pointsStr);
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', 'rgba(255, 255, 255, 0.8)');
        outline.setAttribute('stroke-width', '0.3');
        
        return outline;
    },

    /**
     * Add sparkles to the gem
     */
    addGemSparkles(svg) {
        const sparkleCount = 3;
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            sparkle.setAttribute('cx', 8 + Math.random() * 16);
            sparkle.setAttribute('cy', 8 + Math.random() * 16);
            sparkle.setAttribute('r', 0.5 + Math.random());
            sparkle.setAttribute('fill', 'white');
            sparkle.classList.add('gem-sparkle');
            
            sparkle.style.setProperty('--duration', (3 + Math.random() * 2) + 's');
            sparkle.style.setProperty('--delay', (Math.random() * 3) + 's');
            
            svg.appendChild(sparkle);
        }
    },

    /**
     * Start color cycling for multi-color gems
     */
    startGemColorCycling(element, circle) {
        // Clear any existing cycling
        this.stopGemColorCycling(element);
        
        const colors = circle.colors;
        if (!colors || colors.length <= 1) return;
        
        let currentColorIndex = 0;
        const cycleDuration = 4000; // 4 seconds per color
        
        const cycleColors = () => {
            const svg = element.querySelector('.gem-svg');
            if (!svg || !element.parentNode) return;
            
            const nextIndex = (currentColorIndex + 1) % colors.length;
            const nextColor = colors[nextIndex];
            const lighterColor = adjustBrightness(nextColor, 30);
            const darkerColor = adjustBrightness(nextColor, -20);
            
            // Update gradients
            this.updateGemGradients(svg, nextColor, lighterColor, darkerColor);
            
            currentColorIndex = nextIndex;
            
            // Schedule next cycle
            element._gemCycleTimeout = setTimeout(cycleColors, cycleDuration);
        };
        
        // Start cycling after 1 second
        element._gemCycleTimeout = setTimeout(cycleColors, 1000);
    },

    /**
     * Update gem gradients with new colors
     */
    updateGemGradients(svg, primaryColor, lighterColor, darkerColor) {
        const updateGradientStops = (gradientId, colors) => {
            const gradient = svg.querySelector(`#${gradientId}`);
            if (!gradient) return;
            
            const stops = gradient.querySelectorAll('stop');
            stops.forEach((stop, index) => {
                if (colors[index]) {
                    stop.style.transition = 'stop-color 1s ease-in-out';
                    stop.setAttribute('stop-color', colors[index]);
                }
            });
        };
        
        // Update main facet gradient
        updateGradientStops('gemFacetGradient', [primaryColor, lighterColor, primaryColor]);
        
        // Update dark facet gradient  
        updateGradientStops('gemFacetGradientDark', [darkerColor, primaryColor, darkerColor]);
        
        // Update table gradient
        updateGradientStops('gemTableGradient', [
            'rgba(255, 255, 255, 0.9)', 
            lighterColor, 
            primaryColor
        ]);
    },

    /**
     * Stop gem color cycling
     */
    stopGemColorCycling(element) {
        if (element && element._gemCycleTimeout) {
            clearTimeout(element._gemCycleTimeout);
            element._gemCycleTimeout = null;
        }
    },

    /**
     * Get completion level for triangle
     */
    getCompletionLevel(circle) {
        if (!circle.characteristics || !circle.characteristics.completion) {
            return "no-completion";
        }
        return circle.characteristics.completion;
    },

    /**
     * Create triangle shape based on completion level
     */
    createTriangleShapeByCompletionLevel(triangleWrap, circle, completionLevel) {
        switch (completionLevel) {
            case 'level0':
                this.createLevel0Triangle(triangleWrap, circle);
                break;
            case 'level1':
                this.createLevel1Triangle(triangleWrap, circle);
                break;
            case 'level2':
            case 'no-completion':
            default:
                this.createLevel2Triangle(triangleWrap, circle);
                break;
        }
    },

    /**
     * Create level 0 triangle (dashed outline only)
     */
    createLevel0Triangle(triangleWrap, circle) {
        const triangleShape = document.createElement('div');
        triangleShape.className = 'triangle-shape';
        triangleWrap.appendChild(triangleShape);
    },

    /**
     * Create level 1 triangle (partial fill with outline)
     */
    createLevel1Triangle(triangleWrap, circle) {
        const triangleOutline = document.createElement('div');
        triangleOutline.className = 'triangle-outline';
        triangleWrap.appendChild(triangleOutline);
        
        const triangleShape = document.createElement('div');
        triangleShape.className = 'triangle-shape';
        triangleWrap.appendChild(triangleShape);
    },

    /**
     * Create level 2 triangle (full 3D pyramid)
     */
    createLevel2Triangle(triangleWrap, circle) {
        const triangleShape = document.createElement('div');
        triangleShape.className = 'triangle-shape';
        triangleWrap.appendChild(triangleShape);
        
        const pyramidSide = document.createElement('div');
        pyramidSide.className = 'pyramid-side';
        triangleWrap.appendChild(pyramidSide);
    },

    /**
     * Create particle system for glow type
     */
    createParticles(element, circle) {
        const particlesElement = document.createElement('div');
        particlesElement.className = 'particles';
        
        this.createParticleSet(particlesElement, circle, 1);
        this.createParticleSet(particlesElement, circle, 2);
        
        element.appendChild(particlesElement);
    },

    /**
     * Create a set of particles
     */
    createParticleSet(parentElement, circle, index) {
        const angleElement = document.createElement('div');
        angleElement.className = 'angle';
        
        const positionElement = document.createElement('div');
        positionElement.className = 'position';
        
        const pulseElement = document.createElement('div');
        pulseElement.className = 'pulse';
        
        const timingCoeff = this.generateRandomTimingCoefficient(circle.id + '_' + index);
        
        if (index === 1) {
            const angleDuration = (10 * timingCoeff).toFixed(2) + 's';
            const positionDuration = (2 * timingCoeff).toFixed(2) + 's';
            angleElement.style.animation = `angle ${angleDuration} steps(5) 0s infinite`;
            positionElement.style.animation = `position ${positionDuration} linear 0s infinite`;
        } else if (index === 2) {
            const angleDuration = (4.95 * timingCoeff).toFixed(2) + 's';
            const positionDuration = (1.65 * timingCoeff).toFixed(2) + 's';
            const angleDelay = (-1.65 * timingCoeff).toFixed(2) + 's';
            angleElement.style.animation = `angle ${angleDuration} steps(3) ${angleDelay} infinite`;
            positionElement.style.animation = `position ${positionDuration} linear 0s infinite`;
        }
        
        this.createParticleElement(pulseElement, circle);
        positionElement.appendChild(pulseElement);
        angleElement.appendChild(positionElement);
        parentElement.appendChild(angleElement);
    },

    /**
     * Create individual particle element
     */
    createParticleElement(parentElement, circle) {
        const color = circle.colors?.[0] || circle.color || '#4CAF50';
        
        const particleElement = document.createElement('div');
        particleElement.className = 'particle';
        particleElement.style.backgroundColor = color;
        
        parentElement.appendChild(particleElement);
    },

    /**
     * Generate random timing coefficient
     */
    generateRandomTimingCoefficient(circleId) {
        let seed = 0;
        for (let i = 0; i < circleId.length; i++) {
            seed += circleId.charCodeAt(i);
        }
        
        let random = Math.sin(seed) * 10000;
        random = random - Math.floor(random);
        
        return 0.7 + (random * 0.8);
    },

    /**
     * Create chakra form for glow circles
     */
    createChakraForm(element, circle, squareCount) {
        const chakraForm = this.getChakraFormForSquareCount(squareCount);
        
        if (!chakraForm || chakraForm.length === 0) return;
        
        const outerContainer = document.createElement('div');
        outerContainer.className = 'outer-polygon-container';
        
        for (let i = 0; i < chakraForm.length; i++) {
            this.createChakraFormShape(outerContainer, chakraForm[i]);
        }
        
        element.appendChild(outerContainer);
    },

    /**
     * Get chakra form configuration for square count
     */
    getChakraFormForSquareCount(squareCount) {
        const chakraForms = [
            [{ sides: 3, starFactor: 1, borderPercent: 0.18, rotate: 0, scale: 0.01 }],
            [{ sides: 3, starFactor: 1, borderPercent: 0.18, rotate: 0, scale: 0.9 }],
            [
                { sides: 4, starFactor: 1, borderPercent: 0.12 },
                { sides: 4, starFactor: 1, borderPercent: 0.12, rotate: 45 }
            ],
            [
                { sides: 5, starFactor: 1, borderPercent: 0.10 },
                { sides: 5, starFactor: 1, borderPercent: 0.10, rotate: 36 }
            ],
            [{ sides: 11, starFactor: 3, borderPercent: 0.12 }],
            [
                { sides: 7, starFactor: 2, borderPercent: 0.12, rotate: 0, scale: 0.4 },
                { sides: 9, starFactor: 2, borderPercent: 0.08, rotate: 0, scale: 1.2, reverse: true, spinTime: 64 }
            ],
        ];
        
        return chakraForms[Math.min(squareCount, chakraForms.length - 1)] || [];
    },

    /**
     * Create individual chakra form shape
     */
    createChakraFormShape(outerContainer, form) {
        const innerContainer = document.createElement('div');
        innerContainer.className = 'inner-polygon-container';
        innerContainer.style.transform = `rotate(${form.rotate || 0}deg) scale(${form.scale || 1})`;
        
        const innermostContainer = document.createElement('div');
        innermostContainer.className = 'inner-polygon-container';
        innermostContainer.style.filter = 'drop-shadow(0 0 3px #AAA)';
        innermostContainer.style.mixBlendMode = 'screen';
        
        const animationName = form.reverse ? 'anglerev' : 'angle';
        const spinTime = form.spinTime || 16;
        innermostContainer.style.animation = `${animationName} ${spinTime}s linear infinite`;
        
        const shapeElement = document.createElement('div');
        shapeElement.className = 'shape';
        shapeElement.style.clipPath = this.getPolyPoints(form.sides, form.starFactor, form.borderPercent);
        
        innermostContainer.appendChild(shapeElement);
        innerContainer.appendChild(innermostContainer);
        outerContainer.appendChild(innerContainer);
    },

    formatPolyPoint: function(val) {
      return (Math.round(10000 * ((val + 1) / 2)) / 100) + '%';
    },

    /**
     * Generate polygon clip-path for chakra forms
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
     * Start organic color flow for multi-color circles
     */
    startOrganicColorFlow(element, colors) {
        if (colors.length <= 1) return;
        
        this.stopOrganicColorFlow(element);
        
        const gradientOverlay = document.createElement('div');
        gradientOverlay.className = 'color-flow-overlay';
        
        this.createGradientLayers(element, gradientOverlay, colors);
        
        element.appendChild(gradientOverlay);
        element._gradientOverlay = gradientOverlay;
        
        this.animateColorFlow(element, colors);
    },

    /**
     * Create gradient layers for color flow
     */
    createGradientLayers(element, container, colors) {
        const layerCount = Math.min(colors.length, 4);
        element._gradientLayers = [];
        
        for (let i = 0; i < layerCount; i++) {
            const layer = document.createElement('div');
            layer.className = `gradient-layer gradient-layer-${i}`;
            layer.style.mixBlendMode = i === 0 ? 'normal' : 'overlay';
            layer.style.opacity = '0.8';
            
            container.appendChild(layer);
            element._gradientLayers.push(layer);
        }
    },

    /**
     * Animate color flow
     */
    animateColorFlow(element, colors) {
        const layers = element._gradientLayers;
        if (!layers || layers.length === 0) return;
        
        let time = 0;
        
        const animate = () => {
            if (!element.parentNode) {
                return;
            }
            
            time += 0.02;
            
            layers.forEach((layer, index) => {
                if (!layer || index >= colors.length) return;
                
                const color1 = colors[index];
                const color2 = colors[(index + 1) % colors.length];
                
                const phase1 = time + (index * Math.PI / 2);
                const phase2 = time * 0.7 + (index * Math.PI / 3);
                
                const x1 = 50 + Math.sin(phase1) * 30;
                const y1 = 50 + Math.cos(phase1) * 30;
                const x2 = 50 + Math.sin(phase2) * 40;
                const y2 = 50 + Math.cos(phase2) * 40;
                
                const gradient = `radial-gradient(ellipse ${60 + Math.sin(time * 0.5 + index) * 20}% ${60 + Math.cos(time * 0.3 + index) * 20}% at ${x1}% ${y1}%, ${color1} 0%, transparent 40%, ${color2} 70%, transparent 100%)`;
                
                layer.style.background = gradient;
                
                const rotation = (time * 10 + index * 45) % 360;
                layer.style.transform = `rotate(${rotation}deg)`;
            });
            
            element._colorFlowAnimation = requestAnimationFrame(animate);
        };
        
        animate();
    },

    /**
     * Stop organic color flow
     */
    stopOrganicColorFlow(element) {
        if (element._colorFlowAnimation) {
            cancelAnimationFrame(element._colorFlowAnimation);
            element._colorFlowAnimation = null;
        }
        
        if (element._gradientOverlay && element._gradientOverlay.parentNode) {
            element._gradientOverlay.parentNode.removeChild(element._gradientOverlay);
            element._gradientOverlay = null;
        }
        
        element._gradientLayers = null;
    },

    /**
     * Update circle colors
     */
    updateColors(element, circle) {
        this.setColorProperties(element, circle);
        
        if (circle.type === 'glow') {
            element.classList.add('circle-type-glow');
        }
        
        // Re-render to apply color changes, preserving selection state
        const isSelected = element.querySelector('.circle-selection-indicator')?.classList.contains('selected') || false;
        this.render(element, circle, isSelected);
    }
};
