// CRGroupCircleRenderer.js - Updated with collapsed group support
import { getColorWithOpacity } from './colorUtils.js';
import { useDataStore } from './dataCoordinator.js';

export const GroupCircleRenderer = {
    render(element, circle, belongingCirclesCount = null) {
        if (!element) return;
        
        const color = circle.colors?.[0] || circle.color || '#4CAF50';
        
        // Get dataStore and calculate belonging circles count if not provided
        let actualBelongingCount = belongingCirclesCount;
        if (actualBelongingCount === null) {
            const dataStore = useDataStore();
            const belongingCircles = dataStore.getCirclesBelongingToGroup(circle.id);
            actualBelongingCount = belongingCircles.length;
        }
        
        // NEW: Check if the group is collapsed
        const isCollapsed = circle.collapsed === true;
        
        // NEW: Calculate size - use normal size when collapsed, scaled when expanded
        const baseSize = 32;
        let scaledWidth = baseSize;
        let scaledHeight = baseSize;
        
        if (!isCollapsed && actualBelongingCount > 0) {
            // Only scale when expanded and has members
            //const scaleFactor = Math.sqrt(Math.max(1, actualBelongingCount + 1)) * 1.3 * 0.8;
            const scaleFactor = 1;
            scaledWidth = Math.max(baseSize, baseSize * scaleFactor);
            scaledHeight = Math.max(baseSize, baseSize * scaleFactor);
        }
        
        const groupElement = document.createElement('div');
        groupElement.className = `group-circle-container ${isCollapsed ? 'collapsed' : 'expanded'}`;
        
        // Apply dynamic sizing
        groupElement.style.width = `${scaledWidth}px`;
        groupElement.style.height = `${scaledHeight}px`;
        groupElement.style.borderColor = color;
        groupElement.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
        
        // NEW: Add member count display for collapsed groups
        if (isCollapsed && actualBelongingCount > 0) {
            const countElement = document.createElement('div');
            countElement.className = 'group-member-count';
            countElement.textContent = actualBelongingCount.toString();
            countElement.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: ${color};
                font-size: 14px;
                font-weight: bold;
                pointer-events: none;
                z-index: 2;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
            `;
            groupElement.appendChild(countElement);
        }
        
        element.appendChild(groupElement);
        
        // Store current scale and collapsed state for drag calculations
        element._groupScale = { 
            width: scaledWidth, 
            height: scaledHeight,
            isCollapsed: isCollapsed
        };
    }
};
