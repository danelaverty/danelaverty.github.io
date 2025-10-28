// CRGroupCircleRenderer.js - Updated with roil mode opacity and container inheritance
import { getColorWithOpacity } from './colorUtils.js';
import { useDataStore } from './dataCoordinator.js';

export const GroupCircleRenderer = {
    render(element, circle, belongingCirclesCount = null) {
        if (!element) return;
        
        const color = circle.colors[0] || '#4CAF50';
        
        // Get dataStore and calculate belonging circles count if not provided
        let actualBelongingCount = belongingCirclesCount;
        if (actualBelongingCount === null) {
            const dataStore = useDataStore();
            const belongingCircles = dataStore.getCirclesBelongingToGroup(circle.id);
            actualBelongingCount = belongingCircles.length;
        }
        
        const isCollapsed = circle.collapsed === true;
        const isRoilMode = circle.roilMode === 'on';
        
        const awarenessLine = document.createElement('div');
        awarenessLine.className = `awareness-line`;
        const groupElement = document.createElement('div');
        groupElement.className = `group-circle-container ${isCollapsed ? 'collapsed' : 'expanded'} ${circle.sizeMode === 'manual' ? 'manual-size' : 'auto-size'} ${isRoilMode ? 'roil-mode' : ''}`;
        
        // REMOVED: Don't set explicit width/height - inherit from parent entity-shape
        // groupElement.style.width = `${scaledWidth}px`;
        // groupElement.style.height = `${scaledHeight}px`;
        
        // Set visual styling
        groupElement.style.borderColor = color;
        groupElement.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
        
        // NEW: Apply roil mode opacity
        if (isRoilMode) {
            groupElement.style.opacity = '0';
        }
        
        // Add member count display for collapsed groups
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
        element.appendChild(awarenessLine);
        
        // Store current state for reference
        element._groupScale = { 
            isCollapsed: isCollapsed,
            isRoilMode: isRoilMode
        };
    }
};
