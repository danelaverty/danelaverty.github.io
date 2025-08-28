// dataCoordinator.js - Pure data access layer that coordinates between stores (Updated with ExplicitConnection support)
import { useEntityStore } from './entityStore.js';
import { useDocumentStore } from './documentStore.js';
import { useUIStore } from './uiStore.js';
import { EntityService } from './entityService.js';
import { ExplicitConnectionService } from './ExplicitConnectionService.js';
import { getRecentEmojisStoreInstance } from './useRecentEmojis.js';
import { useClipboardStore } from './clipboardStore.js';

let dataCoordinatorInstance = null;

/**
 * Pure data coordination layer - handles persistence and store coordination
 * Does NOT contain business logic - that belongs in EntityService and ExplicitConnectionService
 */
function createDataCoordinator() {
    const entityStore = useEntityStore();
    const documentStore = useDocumentStore();
    const uiStore = useUIStore();
    const entityService = new EntityService();

    const storageKey = `circleApp_${window.location.pathname}`;
    
    // Create the data coordinator reference that services need
    const dataCoordinatorRef = {
        getCircle: (id) => entityStore.getCircle(id),
        getSquare: (id) => entityStore.getSquare(id),
        getCirclesForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? entityStore.getCirclesForDocument(documentId) : [];
        }
    };
    
    // Initialize ExplicitConnectionService with coordinator reference
    const explicitConnectionService = new ExplicitConnectionService(dataCoordinatorRef);

    // Persistence
    const saveToStorage = () => {
        try {
            const recentEmojisStore = getRecentEmojisStoreInstance();
            const dataToSave = {
                ...entityStore.serialize(),
                ...documentStore.serialize(),
                ...uiStore.serialize(),
                ...recentEmojisStore.serialize(),
                // NEW: Add explicit connections to persistence
                explicitConnections: explicitConnectionService.serialize()
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
                
                // NEW: Load explicit connections after entities are loaded
                if (savedData.explicitConnections) {
                    explicitConnectionService.deserialize(savedData.explicitConnections);
                }
                
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

    // NEW: Create wrapper for explicit connection operations
    const withPersistenceExplicit = (serviceMethod) => {
        return (...args) => {
            const result = serviceMethod.apply(explicitConnectionService, args);
            if (result && result.action !== 'error' && result.action !== 'none') {
                saveToStorage();
            }
            return result;
        };
    };

    // Enhanced delete methods that also clean up explicit connections
    const deleteCircleWithConnections = (id) => {
        // Delete explicit connections first
        const connectionResult = explicitConnectionService.deleteConnectionsForEntity(id, 'circle');
        
        // Then delete the circle using the service
        const deleteResult = entityService.deleteCircle(id);
        
        if (deleteResult) {
            saveToStorage();
        }
        
        return deleteResult;
    };

    const deleteSquareWithConnections = (id) => {
        // Delete explicit connections first
        const connectionResult = explicitConnectionService.deleteConnectionsForEntity(id, 'square');
        
        // Then delete the square using the service
        const deleteResult = entityService.deleteSquare(id);
        
        if (deleteResult) {
            saveToStorage();
        }
        
        return deleteResult;
    };

    // Enhanced bulk delete methods
    const deleteSelectedCirclesWithConnections = () => {
        const circleIds = uiStore.getSelectedCircles();
        let deletedCount = 0;
        let connectionsDeletedCount = 0;
        
        circleIds.forEach(id => {
            // Clean up connections first
            const connResult = explicitConnectionService.deleteConnectionsForEntity(id, 'circle');
            connectionsDeletedCount += connResult.count;
            
            // Delete circle
            if (entityService.deleteCircle(id)) {
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            saveToStorage();
        }
        
        return { deletedEntities: deletedCount, deletedConnections: connectionsDeletedCount };
    };

    const deleteSelectedSquaresWithConnections = () => {
        const squareIds = uiStore.getSelectedSquares();
        let deletedCount = 0;
        let connectionsDeletedCount = 0;
        
        squareIds.forEach(id => {
            // Clean up connections first
            const connResult = explicitConnectionService.deleteConnectionsForEntity(id, 'square');
            connectionsDeletedCount += connResult.count;
            
            // Delete square
            if (entityService.deleteSquare(id)) {
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            saveToStorage();
        }
        
        return { deletedEntities: deletedCount, deletedConnections: connectionsDeletedCount };
    };

    // Return unified API that combines data access with business logic
    return {
        // Raw data access (for templates that need reactive refs)
        data: {
            get circleViewers() { return uiStore.data.circleViewers; },
            get viewerOrder() { return uiStore.data.viewerOrder; },
            get selectedViewerId() { return uiStore.data.selectedViewerId; },
            get currentSquareDocumentId() { return documentStore.data.currentSquareDocumentId; },
            get selectedCircleIds() { return uiStore.data.selectedCircleIds; },
            get selectedSquareIds() { return uiStore.data.selectedSquareIds; }
        },

        // Business operations (with persistence) - UPDATED: Use enhanced delete methods
        createCircleInViewer: withPersistence(entityService.createCircleInViewer.bind(entityService)),
        createSquare: withPersistence(entityService.createSquare.bind(entityService)),
        deleteCircle: deleteCircleWithConnections, // UPDATED: Use enhanced version
        deleteSquare: deleteSquareWithConnections, // UPDATED: Use enhanced version
        selectCircle: withPersistence(entityService.selectCircle.bind(entityService)),
        selectSquare: withPersistence(entityService.selectSquare.bind(entityService)),
        deleteCircleDocument: withPersistence(entityService.deleteCircleDocument.bind(entityService)),
        selectAllCirclesInViewer: withPersistence(entityService.selectAllCirclesInViewer.bind(entityService)),
        selectAllSquaresInDocument: withPersistence(entityService.selectAllSquaresInDocument.bind(entityService)),
        deleteSelectedCircles: deleteSelectedCirclesWithConnections, // UPDATED: Use enhanced version
        deleteSelectedSquares: deleteSelectedSquaresWithConnections, // UPDATED: Use enhanced version
        moveSelectedCircles: withPersistence(entityService.moveSelectedCircles.bind(entityService)),
        moveSelectedSquares: withPersistence(entityService.moveSelectedSquares.bind(entityService)),

        // NEW: Explicit connection operations
        handleEntityCtrlClick: withPersistenceExplicit(explicitConnectionService.handleEntityCtrlClick.bind(explicitConnectionService)),
        getExplicitConnections: explicitConnectionService.getVisualConnections.bind(explicitConnectionService),
        getExplicitConnectionsForEntityType: explicitConnectionService.getVisualConnectionsForEntityType.bind(explicitConnectionService),
        deleteExplicitConnectionsForEntity: withPersistenceExplicit(explicitConnectionService.deleteConnectionsForEntity.bind(explicitConnectionService)),
        getExplicitConnectionCount: explicitConnectionService.getConnectionCount.bind(explicitConnectionService),
        hasExplicitConnections: explicitConnectionService.hasConnections.bind(explicitConnectionService),

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
        createCircleDocument: (name, parentId = null) => {
            const doc = documentStore.createCircleDocument(name, parentId);
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
        updateCircleDocumentParent: (id, parentId) => {
            const result = documentStore.updateCircleDocumentParent(id, parentId);
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
        // FIXED: Use EntityService method for square document switching to prevent connection flash
        setCurrentSquareDocument: withPersistence(entityService.setCurrentSquareDocument.bind(entityService)),
        setCircleDocumentForViewer: (viewerId, documentId) => {
            const success = uiStore.setCircleDocumentForViewer(viewerId, documentId, documentStore);
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
        getFlattenedDocumentsWithHierarchy: documentStore.getFlattenedDocumentsWithHierarchy,
        getDocumentHierarchy: documentStore.getDocumentHierarchy,
        getChildDocuments: documentStore.getChildDocuments,
        isDescendantOf: documentStore.isDescendantOf,
        getSquareDocumentsForCircle: documentStore.getSquareDocumentsForCircle,
        getCurrentSquareDocument: documentStore.getCurrentSquareDocument,
        getCircleDocumentForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? documentStore.getCircleDocument(documentId) : null;
        },

        // NEW: Viewer properties operations (with persistence)
        updateCircleDocumentViewerProperties: (id, properties) => {
            const result = documentStore.updateCircleDocumentViewerProperties(id, properties);
            if (result) saveToStorage();
            return result;
        },
        getCircleDocumentViewerProperties: documentStore.getCircleDocumentViewerProperties,

        // Viewer operations (with persistence and property coordination)
        createCircleViewer: (width, documentId) => {
            const viewer = uiStore.createCircleViewer(width, documentId);
            saveToStorage();
            return viewer;
        },
        // UPDATED: Now passes documentStore to handle property persistence
        updateCircleViewer: (id, updates) => {
            const result = uiStore.updateCircleViewer(id, updates, documentStore);
            if (result) saveToStorage();
            return result;
        },
        deleteCircleViewer: (id) => {
            const deleted = uiStore.deleteCircleViewer(id);
            if (deleted) saveToStorage();
            return deleted;
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

        // NEW: Enhanced viewer read operations that include properties from documents
        getVisibleCircleViewers: () => {
            const viewers = uiStore.getVisibleCircleViewers();
            // Enhance each viewer with properties from its document
            return viewers.map(viewer => {
                const properties = uiStore.getViewerProperties(viewer.id, documentStore);
                return {
                    ...viewer,
                    width: properties.width,
                    showBackground: properties.showBackground
                };
            });
        },
        getViewerTitle: (viewerId) => uiStore.getViewerTitle(viewerId, documentStore),
        isViewerSelected: uiStore.isViewerSelected,
        // NEW: Get viewer properties from document
        getViewerProperties: (viewerId) => uiStore.getViewerProperties(viewerId, documentStore),

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
