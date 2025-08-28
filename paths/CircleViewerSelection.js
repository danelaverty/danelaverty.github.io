// CircleViewerSelection.js - Rectangle selection, entity selection, and related handlers
import { ref, computed } from './vue-composition-api.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { useConnectionUpdater } from './useConnections.js';

export function useCircleViewerSelection(props, dataStore, viewerContentRef, currentCircles, viewerWidth) {
    // Store initial selection state for Ctrl+drag operations
    let initialSelectedIds = new Set();
    let hasRectangleSelected = false;
    
    // Helper function to check if a circle intersects with a rectangle
    const isCircleIntersecting = (circle, rect) => {
        const circleSize = 60;
        const centerX = viewerWidth.value / 2;
        const absoluteX = circle.x + centerX;
        
        const circleLeft = absoluteX;
        const circleTop = circle.y;
        const circleRight = absoluteX + circleSize;
        const circleBottom = circle.y + circleSize;
        
        return !(circleRight < rect.left || 
                circleLeft > rect.right || 
                circleBottom < rect.top || 
                circleTop > rect.bottom);
    };

    // Real-time selection during drag
    const handleSelectionUpdate = (rect, isCtrlClick) => {
        if (!rect || rect.width < 5 || rect.height < 5) return;
        
        const intersectingIds = [];
        // Only check original circles for selection (not animation copies)
        currentCircles.value.forEach(circle => {
            if (isCircleIntersecting(circle, rect)) {
                intersectingIds.push(circle.id);
            }
        });

        let finalSelection;
        if (isCtrlClick) {
            finalSelection = [...new Set([...initialSelectedIds, ...intersectingIds])];
        } else {
            finalSelection = intersectingIds;
        }

        if (finalSelection.length > 0) {
            dataStore.selectCircle(null, props.viewerId, false);
            
            finalSelection.forEach((id, index) => {
                dataStore.selectCircle(id, props.viewerId, index > 0);
            });
        } else if (!isCtrlClick) {
            dataStore.selectCircle(null, props.viewerId, false);
        }
    };

    // Initialize selection state when drag starts
    const handleSelectionStart = (isCtrlClick) => {
        initialSelectedIds = new Set(dataStore.getSelectedCircles());
        hasRectangleSelected = false;
        
        if (!isCtrlClick) {
            dataStore.selectCircle(null, props.viewerId, false);
        }
    };

    // Finalize selection when drag ends
    const handleSelectionComplete = (rect, isCtrlClick) => {
        const wasRectangleSelection = rect.width >= 5 && rect.height >= 5;
        
        if (!wasRectangleSelection) {
            if (!isCtrlClick) {
                dataStore.selectCircle(null, props.viewerId, false);
            }
        } else {
            hasRectangleSelected = true;
            
            setTimeout(() => {
                hasRectangleSelected = false;
            }, 100);
        }
        
        dataStore.saveToStorage();
    };

    // Rectangle selection composable
    const {
        isSelecting,
        selectionRect,
        getSelectionRectStyle,
        isEntityInSelection
    } = useRectangleSelection(viewerContentRef, handleSelectionComplete, {
        onSelectionStart: handleSelectionStart,
        onSelectionUpdate: handleSelectionUpdate
    });

    // Set up connection updates with viewer-specific entity type
    const { updateConnections } = useConnectionUpdater(
        () => currentCircles.value,
        `circle-${props.viewerId}`, // Use viewer-specific entity type
        { 
            watchEntities: true, 
            immediate: true,
            debounceMs: 30
        }
    );

    // Helper function to check if rectangle selection just occurred
    const hasRectangleSelectedFn = () => hasRectangleSelected;

    return {
        isSelecting,
        selectionRect,
        getSelectionRectStyle,
        isEntityInSelection,
        hasRectangleSelected: hasRectangleSelectedFn
    };
}
