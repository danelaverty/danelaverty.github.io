// useDataStore.js - Main store coordinator (updated with recent emojis persistence)
import { useEntityStore } from './entityStore.js';
import { useDocumentStore } from './documentStore.js';
import { useUIStore } from './uiStore.js';
import { getRecentEmojisStoreInstance } from './useRecentEmojis.js';

let mainStoreInstance = null;

function createMainStore() {
    const entityStore = useEntityStore();
    const documentStore = useDocumentStore();
    const uiStore = useUIStore();
    const recentEmojisStore = getRecentEmojisStoreInstance();

    const storageKey = `circleApp_${window.location.pathname}`;

    // Persistence
    const saveToStorage = () => {
        try {
            const dataToSave = {
                ...entityStore.serialize(),
                ...documentStore.serialize(),
                ...uiStore.serialize(),
                ...recentEmojisStore.serialize() // Add recent emojis to persistence
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
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const savedData = JSON.parse(saved);
                entityStore.deserialize(savedData);
                documentStore.deserialize(savedData);
                uiStore.deserialize(savedData);
                recentEmojisStore.deserialize(savedData); // Load recent emojis from persistence
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
        
        if (!loaded) {
            saveToStorage();
        }
    };

    // High-level operations that coordinate between stores
    const createCircleInViewer = (viewerId) => {
        const documentId = uiStore.getCircleDocumentForViewer(viewerId);
        if (!documentId) return null;

        const viewer = uiStore.data.circleViewers.get(viewerId);
        const circle = entityStore.createCircle(documentId, viewer.width);
        
        // Create default square document for this circle
        documentStore.ensureSquareDocumentForCircle(circle.id);
        
        saveToStorage();
        return circle;
    };

    const createSquare = () => {
        const currentDoc = documentStore.getCurrentSquareDocument();
        if (!currentDoc) return null;

        const viewerWidths = uiStore.getVisibleCircleViewers().map(v => v.width);
        const square = entityStore.createSquare(currentDoc.id, viewerWidths);
        
        saveToStorage();
        return square;
    };

    const deleteCircle = (id) => {
        const circle = entityStore.getCircle(id);
        if (!circle) return false;

        // Remove from selection first
        uiStore.removeFromSelection('circle', id);
        
        // Delete related square documents
        documentStore.deleteSquareDocumentsForCircle(id);
        
        // Delete the circle
        const deleted = entityStore.deleteCircle(id);
        
        if (deleted) {
            // If no circles selected anymore, clear square document
            if (uiStore.getSelectedCircles().length === 0) {
                documentStore.data.currentSquareDocumentId = null;
            }
            saveToStorage();
        }
        
        return deleted;
    };

    const deleteSquare = (id) => {
    console.log(`Attempting to delete square ${id}`);
    
    // Get the square's document info before deletion
    const square = entityStore.getSquare(id);
    console.log('Square found:', square);
    
    let circleId = null;
    if (square) {
        console.log('Square documentId:', square.documentId);
        const squareDoc = documentStore.getSquareDocument(square.documentId);
        console.log('Square document found:', squareDoc);
        circleId = squareDoc?.circleId;
        console.log('Circle ID:', circleId);
    }
    
    uiStore.removeFromSelection('square', id);
    const deleted = entityStore.deleteSquare(id);
    console.log('Square deleted:', deleted);
    
    if (deleted && !circleId) {
        console.log('Square deleted but no circle ID found');
        saveToStorage();
    }
    return deleted;
};

    // Enhanced selection that coordinates with documents
    const selectCircle = (id, viewerId, isCtrlClick = false) => {
        // Set the viewer as selected when selecting circles in it
        if (id && viewerId) {
            uiStore.setSelectedViewer(viewerId);
        }
        
        if (!isCtrlClick) {
            // Normal click - clear all selections
            uiStore.clearSelections();
            
            if (id) {
                uiStore.selectEntities('circle', [id], viewerId);
                
                // Auto-select square document for single selection
                const squareDocuments = documentStore.getSquareDocumentsForCircle(id);
                if (squareDocuments.length > 0) {
                    documentStore.setCurrentSquareDocument(squareDocuments[0].id);
                } else {
                    const defaultSquareDoc = documentStore.createSquareDocument(id, 'Default');
                    documentStore.setCurrentSquareDocument(defaultSquareDoc.id);
                }
            } else {
                documentStore.data.currentSquareDocumentId = null;
            }
        } else {
            // Ctrl+click - toggle selection
            if (id) {
                // If selecting from different viewer, clear all and start fresh
                if (uiStore.data.selectedCircleViewerId && uiStore.data.selectedCircleViewerId !== viewerId) {
                    uiStore.clearSelections();
                    uiStore.selectEntities('circle', [id], viewerId);
                } else {
                    // Same viewer - toggle selection
                    uiStore.toggleEntitySelection('circle', id, viewerId);
                }
                
                // Handle square document selection based on circle selection count
                const selectedCount = uiStore.getSelectedCircles().length;
                if (selectedCount !== 1) {
                    documentStore.data.currentSquareDocumentId = null;
                } else {
                    // Single circle selected - show its squares
                    const singleCircleId = uiStore.getSelectedCircles()[0];
                    const squareDocuments = documentStore.getSquareDocumentsForCircle(singleCircleId);
                    if (squareDocuments.length > 0) {
                        documentStore.setCurrentSquareDocument(squareDocuments[0].id);
                    } else {
                        const defaultSquareDoc = documentStore.createSquareDocument(singleCircleId, 'Default');
                        documentStore.setCurrentSquareDocument(defaultSquareDoc.id);
                    }
                }
            }
        }
        saveToStorage();
    };

    const selectSquare = (id, isCtrlClick = false) => {
        if (!isCtrlClick) {
            uiStore.clearSelections('square');
            if (id) {
                uiStore.selectEntities('square', [id]);
            }
        } else {
            if (id) {
                uiStore.toggleEntitySelection('square', id);
            }
        }
        saveToStorage();
    };

    // Select all operations
    const selectAllCirclesInViewer = (viewerId = null) => {
        const targetViewerId = viewerId || uiStore.data.selectedViewerId;
        if (!targetViewerId) return 0;
        
        const documentId = uiStore.getCircleDocumentForViewer(targetViewerId);
        if (!documentId) return 0;
        
        const circles = entityStore.getCirclesForDocument(documentId);
        uiStore.clearSelections();
        
        const circleIds = circles.map(c => c.id);
        uiStore.selectEntities('circle', circleIds, targetViewerId);
        
        // Handle square document selection
        if (circleIds.length === 1) {
            const singleCircleId = circleIds[0];
            const squareDocuments = documentStore.getSquareDocumentsForCircle(singleCircleId);
            if (squareDocuments.length > 0) {
                documentStore.setCurrentSquareDocument(squareDocuments[0].id);
            } else {
                const defaultSquareDoc = documentStore.createSquareDocument(singleCircleId, 'Default');
                documentStore.setCurrentSquareDocument(defaultSquareDoc.id);
            }
        } else {
            documentStore.data.currentSquareDocumentId = null;
        }
        
        saveToStorage();
        return circles.length;
    };

    const selectAllSquaresInDocument = () => {
        const currentDocId = documentStore.data.currentSquareDocumentId;
        if (!currentDocId) return 0;
        
        const squares = entityStore.getSquaresForDocument(currentDocId);
        uiStore.clearSelections('square');
        
        const squareIds = squares.map(s => s.id);
        uiStore.selectEntities('square', squareIds);
        
        saveToStorage();
        return squares.length;
    };

    // Bulk operations
    const deleteSelectedCircles = () => {
        const circleIds = uiStore.getSelectedCircles();
        let deletedCount = 0;
        
        circleIds.forEach(id => {
            if (deleteCircle(id)) {
                deletedCount++;
            }
        });
        
        return deletedCount;
    };

    const deleteSelectedSquares = () => {
        const squareIds = uiStore.getSelectedSquares();
        let deletedCount = 0;
        
        squareIds.forEach(id => {
            if (deleteSquare(id)) {
                deletedCount++;
            }
        });
        
        return deletedCount;
    };

    const moveSelectedCircles = (deltaX, deltaY) => {
        entityStore.moveEntities('circle', uiStore.getSelectedCircles(), deltaX, deltaY);
        saveToStorage();
    };

    const moveSelectedSquares = (deltaX, deltaY) => {
        entityStore.moveEntities('square', uiStore.getSelectedSquares(), deltaX, deltaY);
        saveToStorage();
    };

    // Viewer operations with persistence
    const createCircleViewer = () => {
        const viewer = uiStore.createCircleViewer();
        saveToStorage();
        return viewer;
    };

    const deleteCircleViewer = (viewerId) => {
        const deleted = uiStore.deleteCircleViewer(viewerId);
        if (deleted) {
            saveToStorage();
        }
        return deleted;
    };

    const setCircleDocumentForViewer = (viewerId, documentId) => {
        const success = uiStore.setCircleDocumentForViewer(viewerId, documentId);
        if (success) {
            saveToStorage();
        }
        return success;
    };

    const deleteCircleDocument = (id) => {
        if (documentStore.getAllCircleDocuments().length <= 1) return false;

        // Update viewers that were using this document
        const remainingDocs = documentStore.getAllCircleDocuments().filter(doc => doc.id !== id);
        const fallbackDocId = remainingDocs.length > 0 ? remainingDocs[0].id : null;
        
        for (const viewer of uiStore.getCircleViewers()) {
            if (viewer.currentCircleDocumentId === id) {
                uiStore.setCircleDocumentForViewer(viewer.id, fallbackDocId);
            }
        }

        // Remove circles for this document (and their square documents)
        const circlesToRemove = entityStore.getCirclesForDocument(id);
        circlesToRemove.forEach(circle => {
            uiStore.removeFromSelection('circle', circle.id);
            documentStore.deleteSquareDocumentsForCircle(circle.id);
            entityStore.deleteCircle(circle.id);
        });

        const deleted = documentStore.deleteCircleDocument(id);
        if (deleted) {
            saveToStorage();
        }
        return deleted;
    };

    // Initialize the app
    initializeApp();

    // Return unified API that delegates to appropriate stores
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

        // Entity operations
        createCircleInViewer,
        createSquare,
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
        deleteCircle,
        deleteSquare,
        getCirclesForDocument: entityStore.getCirclesForDocument,
        getSquaresForDocument: entityStore.getSquaresForDocument,
        getCirclesForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? entityStore.getCirclesForDocument(documentId) : [];
        },

        // Document operations
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
        getAllCircleDocuments: documentStore.getAllCircleDocuments,
        getSquareDocumentsForCircle: documentStore.getSquareDocumentsForCircle,
        getCurrentSquareDocument: documentStore.getCurrentSquareDocument,
        setCurrentSquareDocument: (id) => {
            const result = documentStore.setCurrentSquareDocument(id);
            if (result) saveToStorage();
            return result;
        },
        getCircleDocumentForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? documentStore.getCircleDocument(documentId) : null;
        },
        setCircleDocumentForViewer,
        updateCircleDocumentName: (id, name) => {
            const result = documentStore.updateCircleDocumentName(id, name);
            if (result) saveToStorage();
            return result;
        },
        updateSquareDocumentName: (id, name) => {
            const result = documentStore.updateSquareDocumentName(id, name);
            if (result) saveToStorage();
            return result;
        },
        deleteCircleDocument,
        deleteSquareDocument: (id) => {
            const result = documentStore.deleteSquareDocument(id);
            if (result) saveToStorage();
            return result;
        },

        // Viewer operations
        createCircleViewer,
        getVisibleCircleViewers: uiStore.getVisibleCircleViewers,
        updateCircleViewer: (id, updates) => {
            const result = uiStore.updateCircleViewer(id, updates);
            if (result) saveToStorage();
            return result;
        },
        deleteCircleViewer,
        reorderViewers: (fromIndex, toIndex) => {
            const result = uiStore.reorderViewers(fromIndex, toIndex);
            if (result) saveToStorage();
            return result;
        },
        getViewerTitle: (viewerId) => uiStore.getViewerTitle(viewerId, documentStore),
        setSelectedViewer: (viewerId) => {
            const result = uiStore.setSelectedViewer(viewerId);
            if (result) saveToStorage();
            return result;
        },
        isViewerSelected: uiStore.isViewerSelected,

        // Selection operations
        selectCircle,
        selectSquare,
        isCircleSelected: uiStore.isCircleSelected,
        isSquareSelected: uiStore.isSquareSelected,
        getSelectedCircles: uiStore.getSelectedCircles,
        getSelectedSquares: uiStore.getSelectedSquares,
        hasMultipleCirclesSelected: uiStore.hasMultipleCirclesSelected,
        hasMultipleSquaresSelected: uiStore.hasMultipleSquaresSelected,
        selectAllCirclesInViewer,
        selectAllSquaresInDocument,
        deleteSelectedCircles,
        deleteSelectedSquares,
        moveSelectedCircles,
        moveSelectedSquares,

        // Direct storage access
        saveToStorage
    };
}

export function useDataStore() {
    if (!mainStoreInstance) {
        mainStoreInstance = createMainStore();
    }
    return mainStoreInstance;
}
