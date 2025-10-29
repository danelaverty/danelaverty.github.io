// CRGroupCircleRenderer.js - Updated with roil mode opacity, container inheritance, and selection handle
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
        
        // NEW: Add selection handle for roil mode groups
        if (isRoilMode) {
            const selectionHandle = document.createElement('div');
            selectionHandle.className = 'group-selection-handle';
            selectionHandle.style.cssText = `
                position: absolute;
                width: 7px;
                height: 7px;
                top: 0;
                left: 0;
                border-radius: 50%;
                background-color: rgba(155, 155, 155, 0.1);
                pointer-events: none;
                z-index: 10;
                transition: background-color 0.2s ease;
            `;
            
            // Store reference to handle for potential selection state updates
            element._selectionHandle = selectionHandle;
            element.appendChild(selectionHandle);
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
