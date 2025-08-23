// dataCoordinator.js - Pure data access layer that coordinates between stores
import { useEntityStore } from './entityStore.js';
import { useDocumentStore } from './documentStore.js';
import { useUIStore } from './uiStore.js';
import { EntityService } from './entityService.js';
import { getRecentEmojisStoreInstance } from './useRecentEmojis.js';
import { useClipboardStore } from './clipboardStore.js';

let dataCoordinatorInstance = null;

/**
 * Pure data coordination layer - handles persistence and store coordination
 * Does NOT contain business logic - that belongs in EntityService
 */
function createDataCoordinator() {
    const entityStore = useEntityStore();
    const documentStore = useDocumentStore();
    const uiStore = useUIStore();
    const entityService = new EntityService();

    const storageKey = `circleApp_${window.location.pathname}`;

    // Persistence
    const saveToStorage = () => {
    try {
        const recentEmojisStore = getRecentEmojisStoreInstance();
        const dataToSave = {
            ...entityStore.serialize(),
            ...documentStore.serialize(),
            ...uiStore.serialize(),
            ...recentEmojisStore.serialize()
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        return true;
    } catch (error) {
        console.error('Failed to save to storage:', error);
        return false;
    }
};

const loadFromStorage = () => {
    try {
        const recentEmojisStore = getRecentEmojisStoreInstance();
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const savedData = JSON.parse(saved);
            entityStore.deserialize(savedData);
            documentStore.deserialize(savedData);
            uiStore.deserialize(savedData);
            recentEmojisStore.deserialize(savedData);
            return true;
        }
    } catch (error) {
        console.error('Failed to load from storage:', error);
    }
    return false;
};

    const initializeApp = () => {
        const loaded = loadFromStorage();
        
        // Ensure defaults exist
        if (documentStore.getAllCircleDocuments().length === 0) {
            documentStore.createCircleDocument();
        }
        uiStore.ensureDefaults(documentStore);
        
        if (!loaded) {
            saveToStorage();
        }
    };

    // Initialize the app
    initializeApp();

    // Create wrapper methods that add persistence to service calls
    const withPersistence = (serviceMethod) => {
        return (...args) => {
            const result = serviceMethod.apply(entityService, args);
            if (result !== false && result !== null) {
                saveToStorage();
            }
            return result;
        };
    };

    // Return unified API that combines data access with business logic
    return {
        // Raw data access (for templates that need reactive refs)
        data: {
            get circleViewers() { return uiStore.data.circleViewers; },
            get viewerOrder() { return uiStore.data.viewerOrder; },
            get minimizedViewers() { return uiStore.data.minimizedViewers; },
            get selectedViewerId() { return uiStore.data.selectedViewerId; },
            get currentSquareDocumentId() { return documentStore.data.currentSquareDocumentId; },
            get selectedCircleIds() { return uiStore.data.selectedCircleIds; },
            get selectedSquareIds() { return uiStore.data.selectedSquareIds; }
        },

        // Business operations (with persistence)
        createCircleInViewer: withPersistence(entityService.createCircleInViewer.bind(entityService)),
        createSquare: withPersistence(entityService.createSquare.bind(entityService)),
        deleteCircle: withPersistence(entityService.deleteCircle.bind(entityService)),
        deleteSquare: withPersistence(entityService.deleteSquare.bind(entityService)),
        selectCircle: withPersistence(entityService.selectCircle.bind(entityService)),
        selectSquare: withPersistence(entityService.selectSquare.bind(entityService)),
        deleteCircleDocument: withPersistence(entityService.deleteCircleDocument.bind(entityService)),
        selectAllCirclesInViewer: withPersistence(entityService.selectAllCirclesInViewer.bind(entityService)),
        selectAllSquaresInDocument: withPersistence(entityService.selectAllSquaresInDocument.bind(entityService)),
        deleteSelectedCircles: withPersistence(entityService.deleteSelectedCircles.bind(entityService)),
        deleteSelectedSquares: withPersistence(entityService.deleteSelectedSquares.bind(entityService)),
        moveSelectedCircles: withPersistence(entityService.moveSelectedCircles.bind(entityService)),
        moveSelectedSquares: withPersistence(entityService.moveSelectedSquares.bind(entityService)),

        // Simple entity operations (direct store access with persistence)
        updateCircle: (id, updates) => {
            const result = entityStore.updateCircle(id, updates);
            if (result) saveToStorage();
            return result;
        },
        updateSquare: (id, updates) => {
            const result = entityStore.updateSquare(id, updates);
            if (result) saveToStorage();
            return result;
        },

        // Read operations (no persistence needed)
        getCircle: entityStore.getCircle,
        getSquare: entityStore.getSquare,
        getCirclesForDocument: entityStore.getCirclesForDocument,
        getSquaresForDocument: entityStore.getSquaresForDocument,
        getCirclesForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? entityStore.getCirclesForDocument(documentId) : [];
        },

        // Document operations (with persistence)
        createCircleDocument: (name) => {
            const doc = documentStore.createCircleDocument(name);
            saveToStorage();
            return doc;
        },
        createSquareDocument: (circleId, name) => {
            const doc = documentStore.createSquareDocument(circleId, name);
            saveToStorage();
            return doc;
        },
        updateCircleDocumentName: (id, name) => {
            const result = documentStore.updateCircleDocumentName(id, name);
            if (result) saveToStorage();
            return result;
        },
        updateCircleDocumentPin: (id, isPinned) => {
            const result = documentStore.updateCircleDocumentPin(id, isPinned);
            if (result) saveToStorage();
            return result;
        },
        updateSquareDocumentName: (id, name) => {
            const result = documentStore.updateSquareDocumentName(id, name);
            if (result) saveToStorage();
            return result;
        },
        deleteSquareDocument: (id) => {
            const result = documentStore.deleteSquareDocument(id);
            if (result) saveToStorage();
            return result;
        },
        setCurrentSquareDocument: (id) => {
            const result = documentStore.setCurrentSquareDocument(id);
            if (result) saveToStorage();
            return result;
        },
        setCircleDocumentForViewer: (viewerId, documentId) => {
            const success = uiStore.setCircleDocumentForViewer(viewerId, documentId);
            if (success) saveToStorage();
            return success;
        },
        
        // Circle type tracking methods
        setMostRecentlySetCircleType: (documentId, circleType) => {
            const result = documentStore.setMostRecentlySetCircleType(documentId, circleType);
            if (result) saveToStorage();
            return result;
        },
        getMostRecentlySetCircleType: documentStore.getMostRecentlySetCircleType,

        // Document read operations
        getAllCircleDocuments: documentStore.getAllCircleDocuments,
        getSquareDocumentsForCircle: documentStore.getSquareDocumentsForCircle,
        getCurrentSquareDocument: documentStore.getCurrentSquareDocument,
        getCircleDocumentForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? documentStore.getCircleDocument(documentId) : null;
        },

        // Viewer operations (with persistence)
        createCircleViewer: () => {
            const viewer = uiStore.createCircleViewer();
            saveToStorage();
            return viewer;
        },
        updateCircleViewer: (id, updates) => {
            const result = uiStore.updateCircleViewer(id, updates);
            if (result) saveToStorage();
            return result;
        },
        deleteCircleViewer: (id) => {
            const deleted = uiStore.deleteCircleViewer(id);
            if (deleted) saveToStorage();
            return deleted;
        },
        minimizeViewer: (id) => {
            const result = uiStore.minimizeViewer(id);
            if (result) saveToStorage();
            return result;
        },
        restoreViewer: (id) => {
            const result = uiStore.restoreViewer(id);
            if (result) saveToStorage();
            return result;
        },
        reorderViewers: (fromIndex, toIndex) => {
            const result = uiStore.reorderViewers(fromIndex, toIndex);
            if (result) saveToStorage();
            return result;
        },
        setSelectedViewer: (viewerId) => {
            const result = uiStore.setSelectedViewer(viewerId);
            if (result) saveToStorage();
            return result;
        },

        // Viewer read operations
        getVisibleCircleViewers: uiStore.getVisibleCircleViewers,
        getViewerTitle: (viewerId) => uiStore.getViewerTitle(viewerId, documentStore),
        isViewerSelected: uiStore.isViewerSelected,

        // Selection read operations
        isCircleSelected: uiStore.isCircleSelected,
        isSquareSelected: uiStore.isSquareSelected,
        getSelectedCircles: uiStore.getSelectedCircles,
        getSelectedSquares: uiStore.getSelectedSquares,
        hasMultipleCirclesSelected: uiStore.hasMultipleCirclesSelected,
        hasMultipleSquaresSelected: uiStore.hasMultipleSquaresSelected,

        // Direct storage access
        saveToStorage
    };
}

export function useDataStore() {
    if (!dataCoordinatorInstance) {
        dataCoordinatorInstance = createDataCoordinator();
    }
    return dataCoordinatorInstance;
}
