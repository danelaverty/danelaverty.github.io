// SelectionRenderer.js - Handles ONLY selection visual indicators
import { injectComponentStyles } from './styleUtils.js';

const selectionStyles = `
    /* Selection indicator overlay - sits on top of any circle type */
    .selection-indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 3px solid transparent;
        pointer-events: none;
        z-index: 10; /* Above circle content */
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .selection-indicator.selected {
        border-color: #ffff00;
        box-shadow: 0 0 10px #ffff00;
    }

    /* For triangle circles, use different styling */
    .selection-indicator.triangle {
        border-radius: 0;
        /* Triangle circles need a larger indicator to encompass the triangle shape */
        width: 120%;
        height: 120%;
        top: -10%;
        left: -10%;
        border-width: 2px;
        /* Use a dashed border to make it clear it's a selection indicator */
        border-style: dashed;
    }

    .selection-indicator.triangle.selected {
        border-color: #ffff00;
        box-shadow: 0 0 8px #ffff00;
        /* Animate the dashes for extra visibility */
        animation: dash-rotate 2s linear infinite;
    }

    @keyframes dash-rotate {
        0% { border-style: dashed; }
        50% { border-style: solid; }
        100% { border-style: dashed; }
    }
`;

injectComponentStyles('selection-renderer', selectionStyles);

export const SelectionRenderer = {
    /**
     * Add selection indicator to an entity element
     * @param {HTMLElement} element - The entity shape element
     * @param {string} entityType - 'circle' or 'square'
     * @param {Object} entity - The entity data
     */
    addSelectionIndicator(element, entityType, entity) {
        // Remove existing selection indicator
        this.removeSelectionIndicator(element);
        
        if (entityType === 'circle') {
            const indicator = document.createElement('div');
            indicator.className = 'selection-indicator';
            
            // Adjust for triangle circles
            if (entity.type === 'triangle') {
                indicator.classList.add('triangle');
            }
            
            element.appendChild(indicator);
            element._selectionIndicator = indicator;
        }
        // For squares, we can use the existing border approach since it's simpler
    },

    /**
     * Remove selection indicator from an entity element
     * @param {HTMLElement} element - The entity shape element
     */
    removeSelectionIndicator(element) {
        if (element._selectionIndicator) {
            element._selectionIndicator.remove();
            element._selectionIndicator = null;
        }
    },

    /**
     * Update selection state
     * @param {HTMLElement} element - The entity shape element
     * @param {boolean} isSelected - Whether the entity is selected
     * @param {string} entityType - 'circle' or 'square'
     */
    updateSelection(element, isSelected, entityType) {
        if (entityType === 'circle') {
            const indicator = element._selectionIndicator;
            if (indicator) {
                if (isSelected) {
                    indicator.classList.add('selected');
                } else {
                    indicator.classList.remove('selected');
                }
            }
        } else {
            // For squares, use the existing class-based approach
            if (isSelected) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        }
    }
};
