// renderers/GemCircleRenderer.js - Enhanced gem circle type renderer with per-facet color cycling
import { GemSVGGenerator } from './GemSVGGenerator.js';

export const GemCircleRenderer = {
    /**
     * Render gem circle type
     */
    render(element, circle) {
        if (!element) return;
        
        // Create gem container
        const gemContainer = document.createElement('div');
        gemContainer.className = 'gem-container';
        
        // Create SVG
        const svg = GemSVGGenerator.create(circle);
        gemContainer.appendChild(svg);
        
        element.appendChild(gemContainer);
        
        // Start individual facet color cycling for multi-color gems
        if (circle.colors && circle.colors.length > 1) {
            this.startMultiFacetColorCycling(element, circle);
        }
    },

    /**
     * Start individual color cycling for each facet with different rates
     */
    startMultiFacetColorCycling(element, circle) {
        // Clear any existing cycling
        this.stopGemColorCycling(element);
        
        const colors = circle.colors;
        if (!colors || colors.length <= 1) return;
        
        const svg = element.querySelector('.gem-svg');
        if (!svg) return;
        
        const facets = svg.querySelectorAll('.gem-facet');
        if (!facets || facets.length === 0) return;
        
        // Store cycling data for cleanup
        element._facetCyclers = [];
        
        // Create individual cycler for each facet
        facets.forEach((facet, facetIndex) => {
            const cycler = this.createFacetCycler(facet, colors, facetIndex);
            element._facetCyclers.push(cycler);
        });
        
        // Also cycle the center table at its own rate
        const table = svg.querySelector('polygon[fill*="gemTableGradient"]');
        if (table) {
            const tableCycler = this.createTableCycler(svg, colors);
            element._facetCyclers.push(tableCycler);
        }
    },

    /**
     * Create a color cycler for an individual facet
     */
    createFacetCycler(facet, colors, facetIndex) {
        // Different base cycle times for variety (2-6 seconds)
        const baseCycleTime = 2000 + (facetIndex % 4) * 1000;
        // Add some randomness to prevent synchronization
        const cycleTime = baseCycleTime + (Math.random() * 1000);
        
        // Start each facet at a different color
        let currentColorIndex = facetIndex % colors.length;
        
        const cycle = () => {
            if (!facet.parentNode) {
                return; // Stop if facet is removed
            }
            
            // Move to next color
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            const currentColor = colors[currentColorIndex];
            
            // Import color utilities and update facet
            import('./colorUtils.js').then(({ adjustBrightness }) => {
                const lighterColor = adjustBrightness(currentColor, 30);
                const darkerColor = adjustBrightness(currentColor, -20);
                
                // Create unique gradient for this facet
                const gradientId = `facetGrad_${facetIndex}_${Date.now()}`;
                const svg = facet.closest('svg');
                const defs = svg.querySelector('defs');
                
                // Create facet-specific gradient
                const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.setAttribute('id', gradientId);
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '100%');
                
                // Alternate between light and dark patterns
                const isLightFacet = facetIndex % 2 === 0;
                const colors = isLightFacet 
                    ? [currentColor, lighterColor, currentColor]
                    : [darkerColor, currentColor, darkerColor];
                
                colors.forEach((color, stopIndex) => {
                    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                    stop.setAttribute('offset', `${stopIndex * 50}%`);
                    stop.setAttribute('stop-color', color);
                    stop.style.transition = 'stop-color 1s ease-in-out';
                    gradient.appendChild(stop);
                });
                
                defs.appendChild(gradient);
                
                // Apply gradient to facet with smooth transition
                facet.style.transition = 'fill 1s ease-in-out';
                facet.setAttribute('fill', `url(#${gradientId})`);
                
                // Clean up old gradients to prevent memory leaks
                setTimeout(() => {
                    const oldGradients = defs.querySelectorAll(`[id^="facetGrad_${facetIndex}_"]`);
                    oldGradients.forEach(oldGrad => {
                        if (oldGrad.id !== gradientId && oldGrad.parentNode) {
                            oldGrad.parentNode.removeChild(oldGrad);
                        }
                    });
                }, 1100);
            });
            
            // Schedule next cycle
            return setTimeout(cycle, cycleTime);
        };
        
        // Start cycling after a staggered delay
        const initialDelay = facetIndex * 200; // 200ms between each facet start
        const timeoutId = setTimeout(cycle, initialDelay);
        
        return {
            facetIndex,
            stop: () => {
                if (timeoutId) clearTimeout(timeoutId);
            }
        };
    },

    /**
     * Create a color cycler for the center table
     */
    createTableCycler(svg, colors) {
        const tableCycleTime = 3500; // Different rate from facets
        let currentColorIndex = Math.floor(colors.length / 2); // Start in middle of color array
        
        const cycle = () => {
            if (!svg.parentNode) {
                return;
            }
            
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            const currentColor = colors[currentColorIndex];
            
            import('./colorUtils.js').then(({ adjustBrightness }) => {
                const lighterColor = adjustBrightness(currentColor, 30);
                
                // Update the existing table gradient
                const tableGradient = svg.querySelector('#gemTableGradient');
                if (tableGradient) {
                    const stops = tableGradient.querySelectorAll('stop');
                    if (stops.length >= 3) {
                        stops[1].style.transition = 'stop-color 1s ease-in-out';
                        stops[1].setAttribute('stop-color', lighterColor);
                        
                        stops[2].style.transition = 'stop-color 1s ease-in-out';
                        stops[2].setAttribute('stop-color', currentColor);
                    }
                }
            });
            
            return setTimeout(cycle, tableCycleTime);
        };
        
        // Start table cycling after 500ms
        const timeoutId = setTimeout(cycle, 500);
        
        return {
            facetIndex: 'table',
            stop: () => {
                if (timeoutId) clearTimeout(timeoutId);
            }
        };
    },

    /**
     * Stop gem color cycling (updated to handle new multi-facet system)
     */
    stopGemColorCycling(element) {
        // Stop old single-gem cycling
        if (element && element._gemCycleTimeout) {
            clearTimeout(element._gemCycleTimeout);
            element._gemCycleTimeout = null;
        }
        
        // Stop new multi-facet cycling
        if (element && element._facetCyclers) {
            element._facetCyclers.forEach(cycler => {
                if (cycler && cycler.stop) {
                    cycler.stop();
                }
            });
            element._facetCyclers = null;
        }
    }
};
