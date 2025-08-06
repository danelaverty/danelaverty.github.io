// CircleTypeRenderer.js - Fixed to properly handle multicolor glow circles
import { injectComponentStyles } from './styleUtils.js';
import { adjustBrightness, darken, lighten } from './colorUtils.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { BasicCircleRenderer } from './BasicCircleRenderer.js';
import { GlowCircleRenderer } from './GlowCircleRenderer.js';
import { TriangleCircleRenderer } from './TriangleCircleRenderer.js';
import { GemCircleRenderer } from './GemCircleRenderer.js';
import { circleTypeStyles } from './circleTypeStyles.js';
import { ColorFlowSystem } from './ColorFlowSystem.js';

// Inject main component styles
injectComponentStyles('circle-type-renderer', circleTypeStyles);

export const CircleTypeRenderer = {
    /**
     * Render a circle based on its type - selection now handled by SelectionRenderer
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     * @param {boolean} isSelected - Whether the circle is selected
     * @param {number} squareCount - Number of squares for this circle
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
        
        // Handle multi-color class for gem type
        if (currentType === 'gem' && circle.colors && circle.colors.length > 1) {
            element.classList.add('multi-color');
        } else {
            element.classList.remove('multi-color');
        }
        
        // Set the appropriate type class
        if (element && element.classList) {
            element.classList.remove('circle-type-basic', 'circle-type-glow', 'circle-type-triangle', 'circle-type-gem');
            element.classList.add(`circle-type-${currentType}`);
        }
        
        // Delegate rendering to specific renderer
        switch (currentType) {
            case 'glow':
                GlowCircleRenderer.render(element, circle, squareCount);
                // FIXED: Ensure multicolor flow is properly handled for glow circles
                this.ensureMulticolorGlowFlow(element, circle);
                break;
            case 'triangle':
                TriangleCircleRenderer.render(element, circle);
                break;
            case 'gem':
                GemCircleRenderer.render(element, circle);
                break;
            default:
                BasicCircleRenderer.render(element, circle);
                break;
        }

        // Handle selection using SelectionRenderer
        SelectionRenderer.handleSelectionChange(element, isSelected, 'circle', circle);
    },

    /**
     * FIXED: Ensure multicolor glow flow is working properly
     * This method verifies that multicolor glow circles have the color flow system active
     */
    ensureMulticolorGlowFlow(element, circle) {
        // Check if this is a multicolor glow circle
        if (circle.colors && circle.colors.length > 1) {
            // Small delay to ensure the glow elements are rendered first
            setTimeout(() => {
                // Stop any existing color flow to prevent conflicts
                ColorFlowSystem.stop(element);
                // Start the color flow system
                ColorFlowSystem.start(element, circle.colors);
            }, 50);
        } else {
            // Stop color flow for single-color circles
            ColorFlowSystem.stop(element);
        }
    },

    /**
     * Clear existing circle content but preserve selection indicator
     */
    clearCircleContent(element) {
        // Check if element exists first
        if (!element) return;
        
        // Store selection indicator before clearing (if it exists)
        const selectionIndicator = element.querySelector('.entity-selection-indicator');
        let wasSelected = false;
        
        if (selectionIndicator) {
            wasSelected = selectionIndicator.classList.contains('selected');
        }
        
        // FIXED: Stop any active color flow systems before clearing
        ColorFlowSystem.stop(element);
        
        // Remove type-specific elements but NOT selection indicators
        const elementsToRemove = [
            '.circle-glow',
            '.particles',
            '.triangle-wrap',
            '.triangle-shape', 
            '.pyramid-side',
            '.triangle-outline',
            '.color-flow-overlay',
            '.outer-polygon-container',
            '.gem-container'
        ];
        
        elementsToRemove.forEach(selector => {
            try {
                const elements = element.querySelectorAll(selector);
                if (elements && elements.length > 0) {
                    elements.forEach(el => {
                        // Make sure we're not removing the selection indicator
                        if (el && el.parentNode && !el.classList.contains('entity-selection-indicator')) {
                            el.remove();
                        }
                    });
                }
            } catch (error) {
                console.warn(`Error removing elements with selector ${selector}:`, error);
            }
        });
        
        // Ensure selection indicator reference is correct
        const remainingIndicator = element.querySelector('.entity-selection-indicator');
        if (remainingIndicator) {
            element._selectionIndicator = remainingIndicator;
        }
    },

    /**
     * Update selection state - now delegates to SelectionRenderer
     */
    updateSelection(element, isSelected, circle) {
        SelectionRenderer.handleSelectionChange(element, isSelected, 'circle', circle);
    },

    /**
     * Remove selection indicator - now delegates to SelectionRenderer
     */
    removeSelectionIndicator(element) {
        SelectionRenderer.removeSelectionIndicator(element);
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
        
        // FIXED: Set multicolor gradient if multiple colors exist
        if (colors.length > 1) {
            const colorStops = colors.map((color, index) => {
                const percentage = (index / (colors.length - 1)) * 100;
                return `${color} ${percentage}%`;
            }).join(', ');
            element.style.setProperty('--color-gradient', colorStops);
        }
    },

    /**
     * Update circle colors - FIXED to properly handle multicolor changes
     */
    updateColors(element, circle) {
        this.setColorProperties(element, circle);
        
        if (circle.type === 'glow') {
            element.classList.add('circle-type-glow');
        }
        
        // Re-render to apply color changes, preserving selection state
        const isSelected = element._selectionIndicator?.classList.contains('selected') || false;
        this.render(element, circle, isSelected);
    },

    /**
     * FIXED: Add cleanup method to properly stop color flow systems
     */
    cleanup(element) {
        if (!element) return;
        
        // Stop color flow system
        ColorFlowSystem.stop(element);
        
        // Stop gem color cycling if it exists
        if (element._gemCycleTimeout) {
            clearTimeout(element._gemCycleTimeout);
            element._gemCycleTimeout = null;
        }
        
        // Stop facet cycling if it exists
        if (element._facetCyclers) {
            element._facetCyclers.forEach(cycler => {
                if (cycler && cycler.stop) {
                    cycler.stop();
                }
            });
            element._facetCyclers = null;
        }
        
        // Remove selection indicator
        SelectionRenderer.removeSelectionIndicator(element);
    }
};
