// uiStore.js - UI state management: viewers, selections, and layout (Updated with generic global properties)
import { reactive } from './vue-composition-api.js';
import { GLOBAL_PROPERTIES_CONFIG, getDefaultGlobalProperties, isValidPropertyValue, getNextPropertyValue } from './globalPropertiesConfig.js';

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
        selectedSquareViewerId: null,

        // Global properties - initialized from config
        globalProperties: { ...getDefaultGlobalProperties() }
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
        };
        
        data.circleViewers.set(id, viewer);
        data.viewerOrder.push(id);
        
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

    const updateCircleViewer = (id, updates, documentStore = null) => {
        const viewer = data.circleViewers.get(id);
        if (!viewer) return null;
        
        if (documentStore && viewer.currentCircleDocumentId) {
            const viewerPropertyUpdates = {};
            
            if (updates.width !== undefined) {
                viewerPropertyUpdates.width = updates.width;
            }
            if (updates.showBackground !== undefined) {
                viewerPropertyUpdates.showBackground = updates.showBackground;
            }
            if (updates.backgroundType !== undefined) {
                viewerPropertyUpdates.backgroundType = updates.backgroundType;
            }
            if (updates.shinynessMode !== undefined) {
                viewerPropertyUpdates.shinynessMode = updates.shinynessMode;
            }
            
            if (Object.keys(viewerPropertyUpdates).length > 0) {
                documentStore.updateCircleDocumentViewerProperties(
                    viewer.currentCircleDocumentId, 
                    viewerPropertyUpdates
                );
            }
        }
        
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

    const getViewerProperties = (viewerId, documentStore) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer || !viewer.currentCircleDocumentId || !documentStore) {
            return {
                width: 270,
                showBackground: true,
                backgroundType: BACKGROUND_TYPES.SILHOUETTE,
                shinynessMode: false
            };
        }
        
        const properties = documentStore.getCircleDocumentViewerProperties(viewer.currentCircleDocumentId);
        
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

    const setCircleDocumentForViewer = (viewerId, documentId, documentStore = null) => {
        const viewer = data.circleViewers.get(viewerId);
        if (viewer) {
            viewer.currentCircleDocumentId = documentId;
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

    // Global properties management
    const getGlobalProperty = (propertyKey) => {
        return data.globalProperties[propertyKey];
    };

    const setGlobalProperty = (propertyKey, value) => {
        if (isValidPropertyValue(propertyKey, value)) {
            data.globalProperties[propertyKey] = value;
            return true;
        }
        return false;
    };

    const toggleGlobalProperty = (propertyKey) => {
        const currentValue = data.globalProperties[propertyKey];
        const nextValue = getNextPropertyValue(propertyKey, currentValue);
        data.globalProperties[propertyKey] = nextValue;
        return nextValue;
    };

    const getAllGlobalProperties = () => {
        return { ...data.globalProperties };
    };

    // Legacy compatibility methods for demoMode
    const toggleDemoMode = () => {
        return toggleGlobalProperty('demoMode');
    };

    const isDemoMode = () => {
        return data.globalProperties.demoMode === 'Demo';
    };

    const serialize = () => ({
        circleViewers: Array.from(data.circleViewers.entries()),
        viewerOrder: data.viewerOrder,
        selectedViewerId: data.selectedViewerId,
        nextViewerId: data.nextViewerId,
        globalProperties: data.globalProperties
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
        
        // Load global properties with defaults for any missing properties
        if (savedData.globalProperties) {
            data.globalProperties = {
                ...getDefaultGlobalProperties(),
                ...savedData.globalProperties
            };
        } else if (savedData.demoMode !== undefined) {
            // Legacy support: convert old demoMode boolean to new format
            data.globalProperties.demoMode = savedData.demoMode ? 'Demo' : 'Edit';
        }
        
        clearSelections();
    };

    return {
        data,
        // Constants
        BACKGROUND_TYPES,
        GLOBAL_PROPERTIES_CONFIG,
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
        getViewerProperties,
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
        // Global properties
        getGlobalProperty,
        setGlobalProperty,
        toggleGlobalProperty,
        getAllGlobalProperties,
        // Legacy demoMode compatibility
        toggleDemoMode,
        isDemoMode,
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
