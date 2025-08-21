// viewerManager.js - Enhanced with drag state management and drop target highlighting
import { ref } from './vue-composition-api.js';

/**
 * Create viewer management functionality with drag state support
 * @param {Object} dataStore - The data store instance
 * @returns {Object} Viewer management functions and state
 */
export function createViewerManager(dataStore) {
    const isReordering = ref(false);
    const reorderData = ref(null);
    
    // Enhanced drag state for drop target highlighting
    const dragState = ref({
        isDragging: false,
        draggedViewerId: null,
        dropTarget: null,
        dropSide: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 }
    });

    // Viewer management handlers
    const handleAddViewer = () => {
        dataStore.createCircleViewer();
    };

    const handleMinimizeViewer = (viewerId) => {
        dataStore.minimizeViewer(viewerId);
    };

    const handleCloseViewer = (viewerId) => {
        const viewer = dataStore.data.circleViewers.get(viewerId);
        
	dataStore.deleteCircleViewer(viewerId);
    };

    const handleRestoreViewer = (viewerId) => {
        dataStore.restoreViewer(viewerId);
    };

    const handleViewerContainerClick = (viewerId) => {
        dataStore.setSelectedViewer(viewerId);
    };

    // Enhanced viewer reordering with visual feedback
    const handleStartReorder = ({ viewerId, event }) => {
        
        const viewerElement = event.target.closest('.circle-viewer');
        if (!viewerElement) {
            return;
        }

        // Update drag state
        dragState.value = {
            isDragging: true,
            draggedViewerId: viewerId,
            dropTarget: null,
            dropSide: null,
            startPosition: { x: event.clientX, y: event.clientY },
            currentPosition: { x: event.clientX, y: event.clientY }
        };

        // Legacy reorder data for compatibility
        const viewerIndex = dataStore.data.viewerOrder.indexOf(viewerId);
        isReordering.value = true;
        reorderData.value = {
            viewerId,
            originalIndex: viewerIndex,
            startX: event.clientX,
            currentIndex: viewerIndex
        };

        // Add global event listeners
        document.addEventListener('mousemove', handleReorderMove);
        document.addEventListener('mouseup', handleReorderEnd);
        document.body.style.cursor = 'grabbing';
        
        // Prevent text selection during drag
        event.preventDefault();
        
    };

    const handleReorderMove = (e) => {
        if (!dragState.value.isDragging) return;

        dragState.value.currentPosition = { x: event.clientX, y: event.clientY };

        // Legacy reorder logic for compatibility
        if (!isReordering.value || !reorderData.value) return;

        const visibleViewers = dataStore.getVisibleCircleViewers();
        const deltaX = e.clientX - reorderData.value.startX;
        const viewerWidth = 400; // Approximate viewer width
        const indexChange = Math.round(deltaX / viewerWidth);
        const newIndex = Math.max(0, Math.min(
            visibleViewers.length - 1,
            reorderData.value.originalIndex + indexChange
        ));

        if (newIndex !== reorderData.value.currentIndex) {
            reorderData.value.currentIndex = newIndex;
        }
    };

    const handleReorderEnd = () => {
        
        if (!dragState.value.isDragging) return;

        // Perform reorder if we have a valid drop target
        if (dragState.value.dropTarget && dragState.value.dropSide) {
            performReorder(
                dragState.value.draggedViewerId,
                dragState.value.dropTarget,
                dragState.value.dropSide
            );
        } else if (isReordering.value && reorderData.value) {
            // Fallback to legacy reorder logic
            if (reorderData.value.currentIndex !== reorderData.value.originalIndex) {
                dataStore.reorderViewers(reorderData.value.originalIndex, reorderData.value.currentIndex);
            }
        }

        // Reset all state
        dragState.value = {
            isDragging: false,
            draggedViewerId: null,
            dropTarget: null,
            dropSide: null,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 }
        };

        isReordering.value = false;
        reorderData.value = null;

        // Remove global event listeners
        document.removeEventListener('mousemove', handleReorderMove);
        document.removeEventListener('mouseup', handleReorderEnd);
        document.body.style.cursor = '';
        
    };

    // Drag and drop event handlers
    const handleDragEnter = ({ targetViewerId, dropSide }) => {
        if (!dragState.value.isDragging) return;
        
        
        dragState.value.dropTarget = targetViewerId;
        dragState.value.dropSide = dropSide;
    };

    const handleDragLeave = ({ targetViewerId }) => {
        if (!dragState.value.isDragging) return;
        
        
        // Only clear if we're leaving the current target
        if (dragState.value.dropTarget === targetViewerId) {
            dragState.value.dropTarget = null;
            dragState.value.dropSide = null;
        }
    };

    const handleDrop = ({ targetViewerId, draggedViewerId, dropSide }) => {
        if (!dragState.value.isDragging) return;
        
        
        performReorder(draggedViewerId, targetViewerId, dropSide);
    };

    const performReorder = (draggedId, targetId, dropSide) => {
        
        const draggedViewer = dataStore.data.circleViewers.get(draggedId);
        const targetViewer = dataStore.data.circleViewers.get(targetId);
        
        if (!draggedViewer || !targetViewer || draggedId === targetId) {
            return;
        }

        const viewerList = Array.from(dataStore.data.circleViewers.values())
            .filter(v => !dataStore.data.minimizedViewers.has(v.id)) // Only visible viewers
            .sort((a, b) => a.order - b.order);

        const draggedIndex = viewerList.findIndex(v => v.id === draggedId);
        const targetIndex = viewerList.findIndex(v => v.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            return;
        }

        // Remove dragged viewer from list
        const [movedViewer] = viewerList.splice(draggedIndex, 1);

        // Calculate new insertion index
        let insertIndex = targetIndex;
        if (draggedIndex < targetIndex) {
            insertIndex--; // Adjust for removal
        }
        
        if (dropSide === 'right') {
            insertIndex++;
        }

        // Insert at new position
        viewerList.splice(insertIndex, 0, movedViewer);

        // Update order values
        viewerList.forEach((viewer, index) => {
            dataStore.updateCircleViewer(viewer.id, { order: index });
        });

        // Save changes
        dataStore.saveToStorage();
        
    };

    return {
        // State
        isReordering,
        reorderData,
        dragState, // New drag state for drop target highlighting
        
        // Handlers
        handleAddViewer,
        handleMinimizeViewer,
        handleCloseViewer,
        handleRestoreViewer,
        handleViewerContainerClick,
        handleStartReorder,
        handleReorderMove,
        handleReorderEnd,
        
        // New drag and drop handlers
        handleDragEnter,
        handleDragLeave,
        handleDrop
    };
}
