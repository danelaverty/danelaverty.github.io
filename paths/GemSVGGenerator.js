// systems/GemSVGGenerator.js - Enhanced SVG generation system for gem circles with individual facet support
import { adjustBrightness } from './colorUtils.js';

export const GemSVGGenerator = {
    /**
     * Create the gem SVG with 9 individually controllable facets
     */
    create(circle) {
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
        
        // Create base gradients for facets (these will be individual per facet later)
        this.createBaseGradients(defs, primaryColor, lighterColor, darkerColor);
        
        // Create facets (trapezoids from inner to outer points)
        for (let i = 0; i < facetCount; i++) {
            const nextI = (i + 1) % facetCount;
            
            const facetPoints = [
                innerPoints[i],
                innerPoints[nextI],
                outerPoints[nextI],
                outerPoints[i]
            ];
            
            const facet = this.createFacet(facetPoints, i, facetCount, colors, svg, defs);
            svg.appendChild(facet);
        }
        
        // Create center table (inner circle with special gradient)
        const table = this.createTable(innerPoints, defs, primaryColor, lighterColor);
        svg.appendChild(table);
        
        // Add outline
        const outline = this.createOutline(outerPoints);
        svg.appendChild(outline);
        
        // Add sparkles
        this.addSparkles(svg);
        
        return svg;
    },

    /**
     * Create base gradients that can be used as fallbacks
     */
    createBaseGradients(defs, primaryColor, lighterColor, darkerColor) {
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
     * Create a single gem facet with individual identification
     * FIXED: Pass svg and defs as parameters to avoid null reference
     */
    createFacet(points, index, total, colors, svg, defs) {
        const facet = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        
        facet.setAttribute('points', pointsStr);
        
        // For multi-color gems, start each facet with a different color
        if (colors.length > 1) {
            const startColorIndex = index % colors.length;
            const startColor = colors[startColorIndex];
            const lighterStartColor = adjustBrightness(startColor, 30);
            const darkerStartColor = adjustBrightness(startColor, -20);
            
            // Create initial individual gradient for this facet
            const gradientId = `facetGrad_${index}_initial`;
            
            // Create the gradient immediately since we have the defs element
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '100%');
            
            // Alternate between light and dark patterns
            const isLightFacet = index % 2 === 0;
            const gradientColors = isLightFacet 
                ? [startColor, lighterStartColor, startColor]
                : [darkerStartColor, startColor, darkerStartColor];
            
            gradientColors.forEach((color, stopIndex) => {
                const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop.setAttribute('offset', `${stopIndex * 50}%`);
                stop.setAttribute('stop-color', color);
                stop.style.transition = 'stop-color 1s ease-in-out';
                gradient.appendChild(stop);
            });
            
            defs.appendChild(gradient);
            facet.setAttribute('fill', `url(#${gradientId})`);
            
            // Store color info for future use
            facet.setAttribute('data-initial-color', startColor);
            facet.setAttribute('data-lighter-color', lighterStartColor);
            facet.setAttribute('data-darker-color', darkerStartColor);
        } else {
            // Use alternating base gradients as fallback for single color
            facet.setAttribute('fill', index % 2 === 0 ? 'url(#gemFacetGradient)' : 'url(#gemFacetGradientDark)');
        }
        
        facet.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        facet.setAttribute('stroke-width', '0.5');
        
        // Add class and data attributes for individual targeting
        facet.classList.add('gem-facet');
        facet.setAttribute('data-facet-index', index);
        
        // Random animation timing for sparkle effects
        facet.style.setProperty('--sheen-duration', (50 + Math.random() * 4) + 's');
        facet.style.setProperty('--sheen-delay', (Math.random() * 2) + 's');
        
        return facet;
    },

    /**
     * Create the gem table (center) - enhanced to support color cycling
     */
    createTable(innerPoints, defs, primaryColor, lighterColor) {
        const table = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = innerPoints.map(p => `${p.x},${p.y}`).join(' ');
        
        table.setAttribute('points', pointsStr);
        table.setAttribute('fill', 'url(#gemTableGradient)');
        table.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
        table.setAttribute('stroke-width', '0.5');
        table.classList.add('gem-table');
        
        return table;
    },

    /**
     * Create gem outline
     */
    createOutline(outerPoints) {
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = outerPoints.map(p => `${p.x},${p.y}`).join(' ');
        
        outline.setAttribute('points', pointsStr);
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', 'rgba(255, 255, 255, 0.8)');
        outline.setAttribute('stroke-width', '0.3');
        outline.classList.add('gem-outline');
        
        return outline;
    },

    /**
     * Add sparkles to the gem with enhanced timing variety
     */
    addSparkles(svg) {
        const sparkleCount = 4; // Increased for more dynamic look
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            sparkle.setAttribute('cx', 8 + Math.random() * 16);
            sparkle.setAttribute('cy', 8 + Math.random() * 16);
            sparkle.setAttribute('r', 0.3 + Math.random() * 0.7);
            sparkle.setAttribute('fill', 'white');
            sparkle.setAttribute('opacity', 0.7 + Math.random() * 0.3);
            sparkle.classList.add('gem-sparkle');
            
            // More varied timing for sparkles
            sparkle.style.setProperty('--duration', (20 + Math.random() * 4) + 's');
            sparkle.style.setProperty('--delay', (Math.random() * 4) + 's');
            
            svg.appendChild(sparkle);
        }
    },

    /**
     * Update gem gradients with new colors (legacy method, kept for compatibility)
     */
    updateGradients(svg, primaryColor, lighterColor, darkerColor) {
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
        
        // Update base gradients
        updateGradientStops('gemFacetGradient', [primaryColor, lighterColor, primaryColor]);
        updateGradientStops('gemFacetGradientDark', [darkerColor, primaryColor, darkerColor]);
        updateGradientStops('gemTableGradient', [
            'rgba(255, 255, 255, 0.9)', 
            lighterColor, 
            primaryColor
        ]);
    }
};
