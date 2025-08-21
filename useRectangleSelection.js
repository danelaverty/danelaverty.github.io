// useRectangleSelection.js - Rectangle selection composable with real-time updates
import { ref, onMounted, onUnmounted } from './vue-composition-api.js';

// Inject selection rectangle styles
const selectionStyles = `
    .selection-rectangle {
        position: absolute;
        border: 1px dashed #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
        pointer-events: none;
        z-index: 1000;
    }
`;

// Inject styles if not already present
if (!document.getElementById('selection-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'selection-styles';
    styleElement.textContent = selectionStyles;
    document.head.appendChild(styleElement);
}

export function useRectangleSelection(containerRef, onSelectionComplete, options = {}) {
    const isSelecting = ref(false);
    const selectionRect = ref({
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        visible: false
    });

    let startPos = { x: 0, y: 0 };
    let hasMovedBeyondThreshold = false;
    let currentCtrlState = false;
    const DRAG_THRESHOLD = 5; // Minimum pixels to move before showing selection rectangle

    const { onSelectionStart, onSelectionUpdate } = options;

    const getContainerOffset = () => {
        if (!containerRef.value) return { left: 0, top: 0 };
        const rect = containerRef.value.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    };

    const handleMouseDown = (e) => {
        // Only start selection on empty areas (viewer-content or circle-viewer)
        if (!e.target.classList.contains('viewer-content') && 
            !e.target.classList.contains('circle-viewer') &&
            !e.target.classList.contains('square-viewer-content')) {
            return;
        }

        const containerOffset = getContainerOffset();
        startPos = {
            x: e.clientX - containerOffset.left,
            y: e.clientY - containerOffset.top
        };

        isSelecting.value = true;
        hasMovedBeyondThreshold = false;
        currentCtrlState = e.ctrlKey || e.metaKey;
        
        selectionRect.value = {
            startX: startPos.x,
            startY: startPos.y,
            currentX: startPos.x,
            currentY: startPos.y,
            visible: false
        };

        // Notify that selection is starting
        if (onSelectionStart) {
            onSelectionStart(currentCtrlState);
        }

        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isSelecting.value) return;

        const containerOffset = getContainerOffset();
        const currentPos = {
            x: e.clientX - containerOffset.left,
            y: e.clientY - containerOffset.top
        };

        // Check if we've moved beyond the threshold
        if (!hasMovedBeyondThreshold) {
            const deltaX = Math.abs(currentPos.x - startPos.x);
            const deltaY = Math.abs(currentPos.y - startPos.y);
            
            if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                hasMovedBeyondThreshold = true;
                selectionRect.value.visible = true;
            }
        }

        selectionRect.value.currentX = currentPos.x;
        selectionRect.value.currentY = currentPos.y;

        // Provide real-time updates if we've moved beyond threshold
        if (hasMovedBeyondThreshold && onSelectionUpdate) {
            const rect = getNormalizedRect();
            onSelectionUpdate(rect, currentCtrlState);
        }
    };

    const handleMouseUp = (e) => {
        if (!isSelecting.value) return;

        isSelecting.value = false;
        
        // Only perform selection if we actually dragged beyond threshold
        if (hasMovedBeyondThreshold && onSelectionComplete) {
            const rect = getNormalizedRect();
            onSelectionComplete(rect, currentCtrlState);
        }

        // Hide the selection rectangle
        selectionRect.value.visible = false;
        hasMovedBeyondThreshold = false;
    };

    // Get normalized rectangle (top-left to bottom-right)
    const getNormalizedRect = () => {
        const { startX, startY, currentX, currentY } = selectionRect.value;
        return {
            left: Math.min(startX, currentX),
            top: Math.min(startY, currentY),
            right: Math.max(startX, currentX),
            bottom: Math.max(startY, currentY),
            width: Math.abs(currentX - startX),
            height: Math.abs(currentY - startY)
        };
    };

    // Check if an entity (with x, y position and size) intersects with selection rectangle
    const isEntityInSelection = (entity, entitySize = 60) => {
        if (!hasMovedBeyondThreshold) return false;
        
        const rect = getNormalizedRect();
        const entityLeft = entity.x;
        const entityTop = entity.y;
        const entityRight = entity.x + entitySize;
        const entityBottom = entity.y + entitySize;
        
        // Check for intersection (not just containment)
        return !(entityRight < rect.left || 
                entityLeft > rect.right || 
                entityBottom < rect.top || 
                entityTop > rect.bottom);
    };

    // Get computed styles for the selection rectangle
    const getSelectionRectStyle = () => {
        if (!selectionRect.value.visible) return { display: 'none' };
        
        const rect = getNormalizedRect();
        return {
            position: 'absolute',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            border: '1px dashed #4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000
        };
    };

    onMounted(() => {
        if (containerRef.value) {
            containerRef.value.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    });

    onUnmounted(() => {
        if (containerRef.value) {
            containerRef.value.removeEventListener('mousedown', handleMouseDown);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    return {
        isSelecting,
        selectionRect,
        getSelectionRectStyle,
        isEntityInSelection
    };
}
