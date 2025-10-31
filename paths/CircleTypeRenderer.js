// CircleTypeRenderer.js - Enhanced to pass roil member info and handle descent state cleanup
import { injectComponentStyles } from './styleUtils.js';
import { adjustBrightness, darken, lighten } from './colorUtils.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { BasicCircleRenderer } from './CRBasicCircleRenderer.js';
import { GlowCircleRenderer } from './CRGlowCircleRenderer.js';
import { TriangleCircleRenderer } from './CRTriangleCircleRenderer.js';
import { GemCircleRenderer } from './CRGemCircleRenderer.js';
import { EmojiCircleRenderer } from './CREmojiCircleRenderer.js';
import { GroupCircleRenderer } from './CRGroupCircleRenderer.js';
import { ShapeRenderer } from './CRShapeRenderer.js';
import { circleTypeStyles } from './CircleTypeStyles.js';
import { ColorFlowSystem } from './ColorFlowSystem.js';
import { useDataStore } from './dataCoordinator.js';

// Inject main component styles
injectComponentStyles('circle-type-renderer', circleTypeStyles);

export const CircleTypeRenderer = {
    /**
     * Render a circle based on its type - selection now handled by SelectionRenderer
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     * @param {boolean} isSelected - Whether the circle is selected
     * @param {number} squareCount - Number of squares for this circle
     * @param {number} belongingCount - Number of circles belonging to this group (for group circles)
     * @param {boolean} isRoilMember - Whether this circle is a member of a roil group
     */
    render(element, circle, isSelected = false, squareCount = null, belongingCount = null, isRoilMember = false) {
        if (!element) {
            return;
        }
        
        // Set CSS properties first
        this.setColorProperties(element, circle);
        
        const currentType = circle.type || 'basic';
        const previousType = element.dataset.circleType;
        
        // Check if this is just a color update for the same type
        const isColorOnlyUpdate = previousType === currentType && 
                                  element.querySelector('.circle-glow-container, .triangle-wrap, .gem-container, .emoji-circle-container, .shape-wrap, .group-circle-container');
        
        // Store the current type
        element.dataset.circleType = currentType;
        
        // Only clear and recreate if the type changed or no content exists
        if (!isColorOnlyUpdate) {
            // Clear existing content but preserve selection indicator
            this.clearCircleContent(element);
        }
        
        // Handle multi-color class for gem type
        if (currentType === 'gem' && circle.colors && circle.colors.length > 1) {
            element.classList.add('multi-color');
        } else {
            element.classList.remove('multi-color');
        }
        
        // Set the appropriate type class
        if (element && element.classList) {
            element.classList.remove('circle-type-basic', 'circle-type-glow', 'circle-type-triangle', 'circle-type-gem', 'circle-type-emoji', 'circle-type-shape', 'circle-type-group');
            element.classList.add(`circle-type-${currentType}`);
        }
        
        // Delegate rendering to specific renderer
        switch (currentType) {
            case 'glow':
                if (isColorOnlyUpdate) {
                    // Just update the colors without recreating elements
                    GlowCircleRenderer.updateColors(element, circle);
                } else {
                    // NEW: Pass isRoilMember to the glow renderer
                    GlowCircleRenderer.render(element, circle, squareCount, isRoilMember);
                }
                // FIXED: Ensure multicolor flow is properly handled for glow circles
                this.ensureMulticolorGlowFlow(element, circle, isRoilMember);
                break;
            case 'triangle':
                TriangleCircleRenderer.render(element, circle);
                break;
            case 'gem':
                GemCircleRenderer.render(element, circle);
                break;
            case 'emoji':
                EmojiCircleRenderer.render(element, circle);
                break;
            case 'shape':
                ShapeRenderer.render(element, circle);
                break;
            case 'group':
                // Use provided belonging count or fall back to direct lookup
                const actualBelongingCount = belongingCount !== null && belongingCount !== undefined ? 
                    belongingCount : 
                    useDataStore().getCirclesBelongingToGroup(circle.id).length;
                GroupCircleRenderer.render(element, circle, actualBelongingCount);
                break;
            default:
                BasicCircleRenderer.render(element, circle);
                break;
        }

        // Handle selection using SelectionRenderer
        SelectionRenderer.handleSelectionChange(element, isSelected, 'circle', circle);
    },

    /**
     * ENHANCED: Ensure multicolor glow flow is working properly with roil member awareness
     * This method verifies that multicolor glow circles have the color flow system active
     */
    ensureMulticolorGlowFlow(element, circle, isRoilMember = false) {
        // For roil members, the color flow is handled by the descent state listener
        // We don't want to interfere with that system
        if (isRoilMember) {
            return;
        }
        
        // Check if this is a multicolor glow circle (non-roil member)
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
        
        // NEW: Clean up descent state listener for glow circles before clearing
        if (element.classList.contains('circle-type-glow')) {
            GlowCircleRenderer.cleanupDescentStateListener(element);
        }
        
        // FIXED: Stop any active color flow systems before clearing
        ColorFlowSystem.stop(element);
        
        // Remove type-specific elements but NOT selection indicators
        const elementsToRemove = [
            '.circle-glow-container',
            '.circle-glow',
            '.particles',
            '.triangle-wrap',
            '.triangle-shape', 
            '.pyramid-side',
            '.triangle-outline',
            '.color-flow-overlay',
            '.outer-polygon-container',
            '.gem-container',
            '.emoji-circle-container',
            '.shape-wrap',
            '.right-triangle-wrap',
            '.diamond-wrap',
            '.oval-wrap',
            '.right-triangle-shape',
            '.diamond-shape',
            '.oval-shape',
            '.group-circle-container'
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
     * Update circle colors - ENHANCED to handle roil member state
     */
    updateColors(element, circle, isRoilMember = false) {
        this.setColorProperties(element, circle);
        
        if (circle.type === 'glow') {
            element.classList.add('circle-type-glow');
        }
        
        // Re-render to apply color changes, preserving selection state
        const isSelected = element._selectionIndicator?.classList.contains('selected') || false;
        
        // NEW: Determine if this is a roil member if not explicitly provided
        if (isRoilMember === false && circle.belongsToID) {
            // Try to determine roil member status from data store
            const dataStore = useDataStore();
            const group = dataStore.getCircle(circle.belongsToID);
            isRoilMember = group && group.roilMode === 'on';
        }
        
        this.render(element, circle, isSelected, null, null, isRoilMember);
    },

    /**
     * ENHANCED: Add cleanup method to properly stop color flow systems and descent listeners
     */
    cleanup(element) {
        if (!element) return;
        
        // NEW: Clean up descent state listener for glow circles
        if (element.classList.contains('circle-type-glow')) {
            GlowCircleRenderer.cleanupDescentStateListener(element);
        }
        
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
        
        // Stop glow color cycling if it exists
        const glowContainer = element.querySelector('.circle-glow-container');
        if (glowContainer) {
            GlowCircleRenderer.stopGlowColorCycling(glowContainer);
        }
        
        // Remove selection indicator
        SelectionRenderer.removeSelectionIndicator(element);
    }
};
