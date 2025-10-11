// SelectionRenderer.js - Fixed selection visual management for all entity types
import { injectComponentStyles } from './styleUtils.js';

const selectionStyles = `
    /* Entity selection indicator - namespaced to avoid conflicts */
    .entity-selection-indicator {
        position: absolute !important;
        display: block !important; /* Force display to prevent hiding */
        pointer-events: none;
        transition: all 0.2s ease;
        z-index: 9 !important; /* Higher z-index to ensure visibility */
        border: 1px solid transparent;
        box-sizing: border-box !important; /* Ensure consistent sizing */
        visibility: visible !important; /* Force visibility */
    }

    /* Circle selection indicators */
    .entity-selection-indicator.circle {
        top: -6px;
        left: -6px;
        width: calc(100% + 12px);
        height: calc(100% + 12px);
        border-radius: 50%;
    }

    .entity-selection-indicator.circle.selected {
        border-color: #ffff00 !important; /* Force visibility */
        box-shadow: 0 0 10px #ffff00 !important;
        animation: entity-circle-selection-pulse 2s ease-in-out infinite;
    }

    @keyframes entity-circle-selection-pulse {
        0%, 100% { box-shadow: 0 0 10px #ffff00; }
        50% { box-shadow: 0 0 20px #ffff00; }
    }

    /* Triangle circle selection (special case) */
    .entity-selection-indicator.triangle {
        border-radius: 0;
        border-style: dashed;
        top: -8px;
        left: -8px;
        width: calc(100% + 16px);
        height: calc(100% + 16px);
    }

    .entity-selection-indicator.triangle.selected {
        border-color: #ffff00 !important;
        box-shadow: 0 0 8px #ffff00 !important;
        animation: entity-triangle-selection-dash 2s linear infinite;
    }

    @keyframes entity-triangle-selection-dash {
        0% { border-style: dashed; }
        50% { border-style: solid; }
        100% { border-style: dashed; }
    }

    /* Square selection indicators */
    .entity-selection-indicator.square {
        top: -2px;
        left: -2px;
        width: calc(100% + 4px);
        height: calc(100% + 4px);
        border: 2px solid transparent;
        border-radius: 6px;
    }

    .entity-selection-indicator.square.selected {
        border-color: #ffff00 !important;
        box-shadow: 0 0 8px #ffff00 !important;
    }

`;

injectComponentStyles('selection-renderer', selectionStyles);

export const SelectionRenderer = {
    /**
     * Add selection indicator to an entity element
     * @param {HTMLElement} element - The entity shape element
     * @param {string} entityType - 'circle' or 'square'
     * @param {Object} entity - The entity data (used to determine special cases like triangle)
     */
    addSelectionIndicator(element, entityType, entity = null) {
        if (!element) {
            console.warn('SelectionRenderer.addSelectionIndicator called with null element');
            return;
        }

        // Remove existing selection indicator
        this.removeSelectionIndicator(element);
        
        const indicator = document.createElement('div');
        indicator.className = 'entity-selection-indicator';
        
        // Set the appropriate type class
        if (entityType === 'circle') {
            indicator.classList.add('circle');
            
            // Special handling for triangle circles
            if (entity && entity.type === 'triangle') {
                indicator.classList.add('triangle');
            }
        } else if (entityType === 'square') {
            indicator.classList.add('square');
        }
        
        // Add debug class temporarily to make it visible
        // indicator.classList.add('debug'); // Uncomment for debugging
        
        // Force display to be visible
        indicator.style.display = 'block';
        indicator.style.opacity = '0';
        indicator.style.visibility = 'visible';
        
        element.appendChild(indicator);
        element._selectionIndicator = indicator;
        
    },

    /**
     * Remove selection indicator from an entity element
     * @param {HTMLElement} element - The entity shape element
     */
    removeSelectionIndicator(element) {
        if (!element) return;
        
        if (element._selectionIndicator) {
            element._selectionIndicator.remove();
            element._selectionIndicator = null;
        }
        
        // Also remove any old selection indicators that might exist
        const existingIndicators = element.querySelectorAll('.entity-selection-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
    },

    /**
     * Update selection state
     * @param {HTMLElement} element - The entity shape element
     * @param {boolean} isSelected - Whether the entity is selected
     * @param {string} entityType - 'circle' or 'square' 
     * @param {Object} entity - The entity data (optional, for special cases)
     */
    updateSelection(element, isSelected, entityType, entity = null) {
        if (!element) {
            console.warn('SelectionRenderer.updateSelection: element is null');
            return;
        }
        
        // Ensure we have a selection indicator
        if (!element._selectionIndicator) {
            this.addSelectionIndicator(element, entityType, entity);
        }
        
        const indicator = element._selectionIndicator;
        
        if (indicator) {
            if (isSelected) {
                indicator.classList.add('selected');
                // Force display properties to ensure visibility
                indicator.style.display = 'block';
                indicator.style.opacity = '1';
                indicator.style.visibility = 'visible';
                
                // Force a style recalculation
                indicator.offsetHeight;
                
                // Debug: Check computed styles
                const computedStyle = window.getComputedStyle(indicator);
            } else {
                indicator.classList.remove('selected');
            }
        } else {
            console.error('Still no indicator after trying to add one!');
        }
        
        // For legacy compatibility, also handle class-based selection on the element itself
        // This can be removed once all components are updated to use the indicator system
        if (entityType === 'square') {
            if (isSelected) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        }
    },

    /**
     * Initialize selection indicator for an element (ensures it exists)
     * @param {HTMLElement} element - The entity shape element  
     * @param {string} entityType - 'circle' or 'square'
     * @param {Object} entity - The entity data
     * @param {boolean} isSelected - Initial selection state
     */
    initializeSelection(element, entityType, entity, isSelected = false) {
        if (!element) return;
        
        this.addSelectionIndicator(element, entityType, entity);
        this.updateSelection(element, isSelected, entityType, entity);
        
        // Verify indicator was created
        const indicator = element.querySelector('.entity-selection-indicator');
    },

    /**
     * Handle selection state changes for components
     * This is a convenience method for components to use
     * @param {HTMLElement} element - The entity shape element
     * @param {boolean} isSelected - Whether the entity is selected
     * @param {string} entityType - 'circle' or 'square'
     * @param {Object} entity - The entity data
     */
    handleSelectionChange(element, isSelected, entityType, entity) {
        // Fix: if entityType is a circle type (like 'glow', 'triangle', etc.), normalize it to 'circle'
        const normalizedEntityType = ['glow', 'triangle', 'gem', 'basic'].includes(entityType) ? 'circle' : entityType;
        
        if (!element) {
            console.warn('SelectionRenderer.handleSelectionChange: element is null');
            return;
        }
        
        // Always ensure selection indicator exists, even if it was removed
        let indicator = element._selectionIndicator;
        
        if (!indicator || !indicator.parentNode) {
            this.addSelectionIndicator(element, normalizedEntityType, entity);
            indicator = element._selectionIndicator;
        }
        
        // Update selection state
        this.updateSelection(element, isSelected, normalizedEntityType, entity);
        
        // Verify the indicator is still there and visible
        const finalIndicator = element.querySelector('.entity-selection-indicator');
        
        if (finalIndicator && isSelected) {
            // Force a repaint to ensure visibility
            finalIndicator.style.display = 'none';
            finalIndicator.offsetHeight; // Trigger reflow
            finalIndicator.style.display = '';
        }
    },

    /**
     * Clean up all selection indicators in a container
     * Useful for bulk cleanup operations
     * @param {HTMLElement} container - Container element to clean up
     */
    cleanupSelectionIndicators(container) {
        if (!container) return;
        
        const indicators = container.querySelectorAll('.entity-selection-indicator');
        indicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode._selectionIndicator = null;
                indicator.remove();
            }
        });
    }
};
