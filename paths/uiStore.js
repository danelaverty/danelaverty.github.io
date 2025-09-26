// uiStore.js - UI state management: viewers, selections, and layout (Updated with shinynessMode support)
import { reactive } from './vue-composition-api.js';

let uiStoreInstance = null;

function createUIStore() {
    const data = reactive({
        // Viewer management
        circleViewers: new Map(),
        viewerOrder: [],
        selectedViewerId: null,
        nextViewerId: 1,
        
        // Selections
        selectedCircleIds: new Set(),
        selectedSquareIds: new Set(),
        selectedCircleViewerId: null,
        selectedSquareViewerId: null
    });

    // Background type constants (should match documentStore)
    const BACKGROUND_TYPES = {
        SILHOUETTE: 'silhouette',
        CYCLE: 'cycle',
        NONE: 'none'
    };

    // Viewer operations
    const createCircleViewer = (width = 270, documentId = null) => {
        const id = `viewer_${data.nextViewerId++}`;
        const viewer = {
            id,
            currentCircleDocumentId: documentId
            // NOTE: width, showBackground, backgroundType, and shinynessMode are now stored in the document, not here
        };
        
        data.circleViewers.set(id, viewer);
        data.viewerOrder.push(id);
        
        // If this is the first viewer or no viewer is selected, select this one
        if (!data.selectedViewerId) {
            data.selectedViewerId = id;
        }
        
        return viewer;
    };

    const getCircleViewers = () => {
        return data.viewerOrder.map(id => data.circleViewers.get(id)).filter(Boolean);
    };

    const getVisibleCircleViewers = () => {
        return getCircleViewers();
    };

    // UPDATED: Now syncs viewer properties to the associated document with shinynessMode support
    const updateCircleViewer = (id, updates, documentStore = null) => {
        const viewer = data.circleViewers.get(id);
        if (!viewer) return null;
        
        // If we have a document store and the viewer has a document, update the document properties
        if (documentStore && viewer.currentCircleDocumentId) {
            const viewerPropertyUpdates = {};
            
            // Extract viewer properties that should be persisted to the document
            if (updates.width !== undefined) {
                viewerPropertyUpdates.width = updates.width;
            }
            if (updates.showBackground !== undefined) {
                viewerPropertyUpdates.showBackground = updates.showBackground;
            }
            if (updates.backgroundType !== undefined) {
                viewerPropertyUpdates.backgroundType = updates.backgroundType;
            }
            // NEW: Handle shinynessMode updates
            if (updates.shinynessMode !== undefined) {
                viewerPropertyUpdates.shinynessMode = updates.shinynessMode;
            }
            
            // Update the document's viewer properties
            if (Object.keys(viewerPropertyUpdates).length > 0) {
                documentStore.updateCircleDocumentViewerProperties(
                    viewer.currentCircleDocumentId, 
                    viewerPropertyUpdates
                );
            }
        }
        
        // Update non-persistent viewer properties (like currentCircleDocumentId)
        const nonPersistentUpdates = {};
        if (updates.currentCircleDocumentId !== undefined) {
            nonPersistentUpdates.currentCircleDocumentId = updates.currentCircleDocumentId;
        }
        
        if (Object.keys(nonPersistentUpdates).length > 0) {
            Object.assign(viewer, nonPersistentUpdates);
        }
        
        return viewer;
    };

    const deleteCircleViewer = (id) => {
        data.circleViewers.delete(id);
        data.viewerOrder = data.viewerOrder.filter(viewerId => viewerId !== id);
        
        // If we deleted the selected viewer, select another one
        if (data.selectedViewerId === id) {
            data.selectedViewerId = null;
            ensureSelectedViewer();
        }
        
        return true;
    };

    const reorderViewers = (fromIndex, toIndex) => {
        if (fromIndex >= 0 && toIndex >= 0 && 
            fromIndex < data.viewerOrder.length && 
            toIndex < data.viewerOrder.length) {
            
            const [movedViewer] = data.viewerOrder.splice(fromIndex, 1);
            data.viewerOrder.splice(toIndex, 0, movedViewer);
            return true;
        }
        return false;
    };

    const setSelectedViewer = (viewerId) => {
        const viewer = data.circleViewers.get(viewerId);
        if (viewer) {
            data.selectedViewerId = viewerId;
            return true;
        }
        return false;
    };

    const ensureSelectedViewer = () => {
        const visibleViewers = getVisibleCircleViewers();
        
        if (!data.selectedViewerId || 
            !data.circleViewers.has(data.selectedViewerId) || 
            !visibleViewers.find(v => v.id === data.selectedViewerId)) {
            
            if (visibleViewers.length > 0) {
                data.selectedViewerId = visibleViewers[0].id;
            }
        }
    };

    const isViewerSelected = (viewerId) => data.selectedViewerId === viewerId;

    const getViewerTitle = (viewerId, documentStore) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer) return 'Unknown Viewer';
        
        if (viewer.currentCircleDocumentId && documentStore) {
            const doc = documentStore.getCircleDocument(viewer.currentCircleDocumentId);
            return doc ? doc.name : 'No Document';
        }
        
        return 'No Document';
    };

    // UPDATED: Get viewer properties from the associated document with shinynessMode support
    const getViewerProperties = (viewerId, documentStore) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer || !viewer.currentCircleDocumentId || !documentStore) {
            // Return defaults if no document or document store
            return {
                width: 270,
                showBackground: true,
                backgroundType: BACKGROUND_TYPES.SILHOUETTE,
                shinynessMode: false
            };
        }
        
        const properties = documentStore.getCircleDocumentViewerProperties(viewer.currentCircleDocumentId);
        
        // Ensure all required properties exist with proper defaults
        return {
            width: properties.width || 270,
            showBackground: properties.showBackground !== undefined ? properties.showBackground : true,
            backgroundType: properties.backgroundType || BACKGROUND_TYPES.SILHOUETTE,
            shinynessMode: properties.shinynessMode || false
        };
    };

    const getCircleDocumentForViewer = (viewerId) => {
        const viewer = data.circleViewers.get(viewerId);
        return viewer ? viewer.currentCircleDocumentId : null;
    };

    // UPDATED: When setting a new document, apply the document's viewer properties
    const setCircleDocumentForViewer = (viewerId, documentId, documentStore = null) => {
        const viewer = data.circleViewers.get(viewerId);
        if (viewer) {
            viewer.currentCircleDocumentId = documentId;
            
            // If we have access to the document store, we could trigger a property update
            // but that's handled at the coordination layer
            
            return true;
        }
        return false;
    };

    // Selection operations
    const selectEntities = (entityType, ids, viewerId = null) => {
        if (entityType === 'circle') {
            data.selectedCircleIds = new Set(ids);
            data.selectedCircleViewerId = viewerId;
        } else {
            data.selectedSquareIds = new Set(ids);
            data.selectedSquareViewerId = viewerId;
        }
    };

    const toggleEntitySelection = (entityType, id, viewerId = null) => {
        const selectedIds = entityType === 'circle' ? data.selectedCircleIds : data.selectedSquareIds;
        
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
            if (selectedIds.size === 0) {
                if (entityType === 'circle') {
                    data.selectedCircleViewerId = null;
                } else {
                    data.selectedSquareViewerId = null;
                }
            }
        } else {
            selectedIds.add(id);
            if (entityType === 'circle') {
                data.selectedCircleViewerId = viewerId;
            } else {
                data.selectedSquareViewerId = viewerId;
            }
        }
    };

    const clearSelections = (entityType = null) => {
        if (!entityType || entityType === 'circle') {
            data.selectedCircleIds.clear();
            data.selectedCircleViewerId = null;
        }
        if (!entityType || entityType === 'square') {
            data.selectedSquareIds.clear();
            data.selectedSquareViewerId = null;
        }
    };

    const removeFromSelection = (entityType, id) => {
        if (entityType === 'circle') {
            data.selectedCircleIds.delete(id);
            if (data.selectedCircleIds.size === 0) {
                data.selectedCircleViewerId = null;
            }
        } else {
            data.selectedSquareIds.delete(id);
            if (data.selectedSquareIds.size === 0) {
                data.selectedSquareViewerId = null;
            }
        }
    };

    // Selection queries
    const isEntitySelected = (entityType, id) => {
        const selectedIds = entityType === 'circle' ? data.selectedCircleIds : data.selectedSquareIds;
        return selectedIds.has(id);
    };

    const getSelectedEntities = (entityType) => {
        const selectedIds = entityType === 'circle' ? data.selectedCircleIds : data.selectedSquareIds;
        return Array.from(selectedIds);
    };

    const hasMultipleSelected = (entityType) => {
        const selectedIds = entityType === 'circle' ? data.selectedCircleIds : data.selectedSquareIds;
        return selectedIds.size > 1;
    };

    // Convenience methods for backward compatibility
    const isCircleSelected = (id) => isEntitySelected('circle', id);
    const isSquareSelected = (id) => isEntitySelected('square', id);
    const getSelectedCircles = () => getSelectedEntities('circle');
    const getSelectedSquares = () => getSelectedEntities('square');
    const hasMultipleCirclesSelected = () => hasMultipleSelected('circle');
    const hasMultipleSquaresSelected = () => hasMultipleSelected('square');

    const serialize = () => ({
        circleViewers: Array.from(data.circleViewers.entries()),
        viewerOrder: data.viewerOrder,
        selectedViewerId: data.selectedViewerId,
        nextViewerId: data.nextViewerId
        // Selections are intentionally not serialized - they should reset on page load
        // Viewer properties (including shinynessMode) are now stored in documents, not here
    });

    const deserialize = (savedData) => {
        if (savedData.circleViewers) {
            data.circleViewers = new Map(savedData.circleViewers);
        }
        if (savedData.viewerOrder) {
            data.viewerOrder = savedData.viewerOrder;
        }
        if (savedData.selectedViewerId) {
            data.selectedViewerId = savedData.selectedViewerId;
        }
        if (savedData.nextViewerId) {
            data.nextViewerId = savedData.nextViewerId;
        }
        
        // Reset all selections on load
        clearSelections();
    };

    return {
        data,
        // Constants
        BACKGROUND_TYPES,
        // Viewer management
        createCircleViewer,
        getCircleViewers,
        getVisibleCircleViewers,
        updateCircleViewer,
        deleteCircleViewer,
        reorderViewers,
        setSelectedViewer,
        ensureSelectedViewer,
        isViewerSelected,
        getViewerTitle,
        getViewerProperties, // UPDATED: Get properties from document with shinynessMode support
        getCircleDocumentForViewer,
        setCircleDocumentForViewer,
        // Selection management
        selectEntities,
        toggleEntitySelection,
        clearSelections,
        removeFromSelection,
        isEntitySelected,
        getSelectedEntities,
        hasMultipleSelected,
        // Compatibility methods
        isCircleSelected,
        isSquareSelected,
        getSelectedCircles,
        getSelectedSquares,
        hasMultipleCirclesSelected,
        hasMultipleSquaresSelected,
        // Initialization
        // Serialization
        serialize,
        deserialize
    };
}

export function useUIStore() {
    if (!uiStoreInstance) {
        uiStoreInstance = createUIStore();
    }
    return uiStoreInstance;
}
