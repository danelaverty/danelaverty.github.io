// useDraggable.js - Fixed draggable functionality to properly communicate drag state
import { onMounted, onUnmounted } from './vue-composition-api.js';

export function useDraggable(element, onDragEnd, containerGetter = null, options = {}) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let originalX = 0;
    let originalY = 0;
    let hasActuallyMoved = false;

    const { onDragMove, onDragStart } = options || {};

    const getContainerOffset = () => {
        let container;
        if (typeof containerGetter === 'function') {
            container = containerGetter();
        } else {
            container = containerGetter;
        }
        
        if (!container) return { left: 0, top: 0 };
        const containerRect = container.getBoundingClientRect();
        return { left: containerRect.left, top: containerRect.top };
    };

const handleMouseDown = (e) => {
    // Don't start dragging on contenteditable elements
    if (e.target.hasAttribute('contenteditable')) return;

    // Call onDragStart callback if provided and check if drag should be prevented
    if (onDragStart) {
        const shouldContinue = onDragStart(e);
        if (shouldContinue === false) {
            // Drag was prevented (e.g., immovable entity)
            return;
        }
    }

    isDragging = true;
    hasActuallyMoved = false;
    element.value.classList.add('dragging');

    const rect = element.value.getBoundingClientRect();
    const containerOffset = getContainerOffset();
    
    // Calculate the offset from the mouse to the element's current position
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Store original position for delta calculation
    // Use the element's current computed position, not the mouse position
    const currentLeft = parseInt(element.value.style.left) || 0;
    const currentTop = parseInt(element.value.style.top) || 0;
    
    originalX = currentLeft;
    originalY = currentTop;

    // Store start mouse position
    startX = e.clientX;
    startY = e.clientY;

    e.preventDefault();
};

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Calculate how much the mouse has moved since drag started
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Only consider it "actual movement" if we've moved more than a small threshold
        if (!hasActuallyMoved && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
            hasActuallyMoved = true;
        }

        // Calculate new position based on original position + mouse delta
        const x = originalX + deltaX;
        const y = originalY + deltaY;

        // Update this element's position
        element.value.style.left = `${x}px`;
        element.value.style.top = `${y}px`;

        // Call onDragMove callback with current deltas if provided
        if (onDragMove && hasActuallyMoved) {
            onDragMove(deltaX, deltaY);
        }
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;

        isDragging = false;
        element.value.classList.remove('dragging');

        // Only call onDragEnd if there was actual movement
        if (onDragEnd && hasActuallyMoved) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const finalX = originalX + deltaX;
            const finalY = originalY + deltaY;
            
            onDragEnd(finalX, finalY, deltaX, deltaY);
        } else if (!hasActuallyMoved) {
            // If no movement occurred, ensure the element stays at its original position
            element.value.style.left = `${originalX}px`;
            element.value.style.top = `${originalY}px`;
        }

        // Reset tracking
        hasActuallyMoved = false;
    };

    onMounted(() => {
        if (element.value) {
            element.value.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    });

    onUnmounted(() => {
        if (element.value) {
            element.value.removeEventListener('mousedown', handleMouseDown);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    return {
        isDragging: () => isDragging,
        hasActuallyMoved: () => hasActuallyMoved
    };
}
