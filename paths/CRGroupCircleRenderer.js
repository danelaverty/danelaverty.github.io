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
        
        // Calculate size based on belonging circles count
        const baseSize = 32;
        const scaleFactor = Math.sqrt(Math.max(1, actualBelongingCount + 1)) * 1.3; // +1 to include the group itself
        const scaledWidth = Math.max(baseSize, baseSize * scaleFactor * 0.8);
        const scaledHeight = Math.max(baseSize, baseSize * scaleFactor * 0.8);
        
        const groupElement = document.createElement('div');
        groupElement.className = 'group-circle-container';
        
        // Apply dynamic sizing
        groupElement.style.width = `${scaledWidth}px`;
        groupElement.style.height = `${scaledHeight}px`;
        groupElement.style.borderColor = color;
        groupElement.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
        
        // Center the group container within the 32x32 circle space
        /*const offsetX = (scaledWidth - baseSize) / 2;
        const offsetY = (scaledHeight - baseSize) / 2;
        groupElement.style.transform = `translate(-${offsetX}px, -${offsetY}px)`;*/
        
        element.appendChild(groupElement);
        
        // Store current scale for drag calculations
        element._groupScale = { width: scaledWidth, height: scaledHeight };
    }
};
