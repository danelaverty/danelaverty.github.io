// viewerManager.js - Viewer management and reordering logic
import { ref } from './vue-composition-api.js';

/**
 * Create viewer management functionality
 * @param {Object} dataStore - The data store instance
 * @returns {Object} Viewer management functions and state
 */
export function createViewerManager(dataStore) {
    const isReordering = ref(false);
    const reorderData = ref(null);

    // Viewer management handlers
    const handleAddViewer = () => {
        dataStore.createCircleViewer();
    };

    const handleMinimizeViewer = (viewerId) => {
        dataStore.minimizeViewer(viewerId);
    };

    const handleCloseViewer = (viewerId) => {
        const viewerTitle = dataStore.getViewerTitle(viewerId);
        if (confirm(`Are you sure you want to close "${viewerTitle}"? The document will not be deleted.`)) {
            dataStore.deleteCircleViewer(viewerId);
        }
    };

    const handleRestoreViewer = (viewerId) => {
        dataStore.restoreViewer(viewerId);
    };

    const handleViewerContainerClick = (viewerId) => {
        dataStore.setSelectedViewer(viewerId);
    };

    // Viewer reordering functionality
    const handleStartReorder = ({ viewerId, event }) => {
        isReordering.value = true;
        const viewerIndex = dataStore.data.viewerOrder.indexOf(viewerId);
        reorderData.value = {
            viewerId,
            originalIndex: viewerIndex,
            startX: event.clientX,
            currentIndex: viewerIndex
        };
        event.preventDefault();
    };

    const handleReorderMove = (e) => {
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
        if (!isReordering.value || !reorderData.value) return;

        if (reorderData.value.currentIndex !== reorderData.value.originalIndex) {
            dataStore.reorderViewers(reorderData.value.originalIndex, reorderData.value.currentIndex);
        }

        isReordering.value = false;
        reorderData.value = null;
    };

    return {
        // State
        isReordering,
        reorderData,
        
        // Handlers
        handleAddViewer,
        handleMinimizeViewer,
        handleCloseViewer,
        handleRestoreViewer,
        handleViewerContainerClick,
        handleStartReorder,
        handleReorderMove,
        handleReorderEnd
    };
}
