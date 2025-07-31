// useDataStore.js - Reactive data store composable with multi-viewer support
import { reactive } from './vue-composition-api.js';

// Create a single shared instance
let storeInstance = null;

function createDataStore() {
    const data = reactive({
        circleDocuments: new Map(),
        squareDocuments: new Map(),
        circles: new Map(),
        squares: new Map(),
        circleViewers: new Map(), // New: multiple circle viewers
        viewerOrder: [], // New: order of viewers
        minimizedViewers: new Map(), // New: minimized viewers
        currentSquareDocumentId: null,
        selectedCircleId: null,
        selectedSquareId: null,
        nextCircleId: 1,
        nextSquareId: 1,
        nextCircleDocumentId: 1,
        nextSquareDocumentId: 1,
        nextViewerId: 1 // New: viewer ID counter
    });

    const storageKey = `circleApp_${window.location.pathname}`;

    // Load from localStorage
    const loadFromStorage = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const savedData = JSON.parse(saved);
                data.circleDocuments = new Map(savedData.circleDocuments || []);
                data.squareDocuments = new Map(savedData.squareDocuments || []);
                data.circles = new Map(savedData.circles || []);
                data.squares = new Map(savedData.squares || []);
                data.circleViewers = new Map(savedData.circleViewers || []);
                data.viewerOrder = savedData.viewerOrder || [];
                data.minimizedViewers = new Map(savedData.minimizedViewers || []);
                // Don't restore currentSquareDocumentId - it should only be set when a circle is selected
                data.currentSquareDocumentId = null;
                // Don't restore selection states - they should reset on page refresh
                data.selectedCircleId = null;
                data.selectedSquareId = null;
                data.nextCircleId = savedData.nextCircleId || 1;
                data.nextSquareId = savedData.nextSquareId || 1;
                data.nextCircleDocumentId = savedData.nextCircleDocumentId || 1;
                data.nextSquareDocumentId = savedData.nextSquareDocumentId || 1;
                data.nextViewerId = savedData.nextViewerId || 1;
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
        }
    };

    // Save to localStorage
    const saveToStorage = () => {
        try {
            const dataToSave = {
                circleDocuments: Array.from(data.circleDocuments.entries()),
                squareDocuments: Array.from(data.squareDocuments.entries()),
                circles: Array.from(data.circles.entries()),
                squares: Array.from(data.squares.entries()),
                circleViewers: Array.from(data.circleViewers.entries()),
                viewerOrder: data.viewerOrder,
                minimizedViewers: Array.from(data.minimizedViewers.entries()),
                currentSquareDocumentId: data.currentSquareDocumentId,
                nextCircleId: data.nextCircleId,
                nextSquareId: data.nextSquareId,
                nextCircleDocumentId: data.nextCircleDocumentId,
                nextSquareDocumentId: data.nextSquareDocumentId,
                nextViewerId: data.nextViewerId
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Failed to save to storage:', error);
        }
    };

    // Ensure default circle document and viewer
    const ensureDefaults = () => {
        if (data.circleDocuments.size === 0) {
            const doc = createCircleDocument();
        }
        if (data.circleViewers.size === 0) {
            createCircleViewer();
        }
    };

    // Generate unique names
    const generateUniqueCircleDocumentName = (baseName = null) => {
        const base = baseName || new Date().toISOString().split('T')[0];
        const existingNames = new Set(Array.from(data.circleDocuments.values()).map(doc => doc.name));
        
        if (!existingNames.has(base)) return base;
        
        let counter = 1;
        let uniqueName;
        do {
            uniqueName = `${base} (${counter})`;
            counter++;
        } while (existingNames.has(uniqueName));
        
        return uniqueName;
    };

    const generateUniqueSquareDocumentName = (circleId, baseName = null) => {
        const base = baseName || 'Square Document';
        const existingNames = new Set(
            Array.from(data.squareDocuments.values())
                .filter(doc => doc.circleId === circleId)
                .map(doc => doc.name)
        );
        
        if (!existingNames.has(base)) return base;
        
        let counter = 1;
        let uniqueName;
        do {
            uniqueName = `${base} (${counter})`;
            counter++;
        } while (existingNames.has(uniqueName));
        
        return uniqueName;
    };

    // Circle Viewer methods
    const createCircleViewer = (width = 400) => {
        const id = `viewer_${data.nextViewerId++}`;
        const viewer = {
            id,
            width,
            currentCircleDocumentId: data.circleDocuments.size > 0 ? Array.from(data.circleDocuments.keys())[0] : null,
            customTitle: null, // User can override the document title
            isMinimized: false
        };
        data.circleViewers.set(id, viewer);
        data.viewerOrder.push(id);
        saveToStorage();
        return viewer;
    };

    const getCircleViewers = () => {
        return data.viewerOrder.map(id => data.circleViewers.get(id)).filter(Boolean);
    };

    const getVisibleCircleViewers = () => {
        return getCircleViewers().filter(viewer => !viewer.isMinimized);
    };

    const updateCircleViewer = (id, updates) => {
        const viewer = data.circleViewers.get(id);
        if (viewer) {
            Object.assign(viewer, updates);
            saveToStorage();
            return viewer;
        }
        return null;
    };

    const deleteCircleViewer = (id) => {
        if (data.circleViewers.size <= 1) return false; // Always keep at least one viewer
        
        data.circleViewers.delete(id);
        data.viewerOrder = data.viewerOrder.filter(viewerId => viewerId !== id);
        data.minimizedViewers.delete(id);
        saveToStorage();
        return true;
    };

    const minimizeViewer = (id) => {
        const viewer = data.circleViewers.get(id);
        if (viewer) {
            viewer.isMinimized = true;
            data.minimizedViewers.set(id, viewer);
            saveToStorage();
            return true;
        }
        return false;
    };

    const restoreViewer = (id) => {
        const viewer = data.circleViewers.get(id);
        if (viewer) {
            viewer.isMinimized = false;
            data.minimizedViewers.delete(id);
            saveToStorage();
            return true;
        }
        return false;
    };

    const reorderViewers = (fromIndex, toIndex) => {
        if (fromIndex >= 0 && toIndex >= 0 && fromIndex < data.viewerOrder.length && toIndex < data.viewerOrder.length) {
            const [movedViewer] = data.viewerOrder.splice(fromIndex, 1);
            data.viewerOrder.splice(toIndex, 0, movedViewer);
            saveToStorage();
            return true;
        }
        return false;
    };

    const getViewerTitle = (viewerId) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer) return 'Unknown Viewer';
        
        if (viewer.customTitle) {
            return viewer.customTitle;
        }
        
        if (viewer.currentCircleDocumentId) {
            const doc = data.circleDocuments.get(viewer.currentCircleDocumentId);
            return doc ? doc.name : 'No Document';
        }
        
        return 'No Document';
    };

    // Circle Document methods
    const createCircleDocument = (name = null) => {
        const id = `circleDoc_${data.nextCircleDocumentId++}`;
        const documentName = generateUniqueCircleDocumentName(name);
        const document = {
            id: id,
            name: documentName,
            createdAt: new Date().toISOString()
        };
        data.circleDocuments.set(id, document);
        saveToStorage();
        return document;
    };

    const getAllCircleDocuments = () => Array.from(data.circleDocuments.values());

    const getCircleDocumentForViewer = (viewerId) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer || !viewer.currentCircleDocumentId) return null;
        return data.circleDocuments.get(viewer.currentCircleDocumentId) || null;
    };

    const setCircleDocumentForViewer = (viewerId, documentId) => {
        const viewer = data.circleViewers.get(viewerId);
        if (viewer && data.circleDocuments.has(documentId)) {
            viewer.currentCircleDocumentId = documentId;
            saveToStorage();
            return true;
        }
        return false;
    };

    const updateCircleDocumentName = (id, name) => {
        const document = data.circleDocuments.get(id);
        if (document) {
            document.name = name;
            saveToStorage();
            return true;
        }
        return false;
    };

    const deleteCircleDocument = (id) => {
        if (data.circleDocuments.size <= 1) return false;

        data.circleDocuments.delete(id);
        
        // Remove circles for this document
        const circlesToRemove = [];
        for (const [circleId, circle] of data.circles) {
            if (circle.documentId === id) {
                circlesToRemove.push(circleId);
            }
        }
        circlesToRemove.forEach(circleId => deleteCircle(circleId));

        // Update viewers that were using this document
        const remainingDocs = getAllCircleDocuments();
        const fallbackDocId = remainingDocs.length > 0 ? remainingDocs[0].id : null;
        
        for (const viewer of data.circleViewers.values()) {
            if (viewer.currentCircleDocumentId === id) {
                viewer.currentCircleDocumentId = fallbackDocId;
            }
        }

        saveToStorage();
        return true;
    };

    // Square Document methods (unchanged but need to work with multiple viewers)
    const createSquareDocument = (circleId, name = null) => {
        const id = `squareDoc_${data.nextSquareDocumentId++}`;
        const documentName = generateUniqueSquareDocumentName(circleId, name);
        const document = {
            id: id,
            name: documentName,
            circleId: circleId,
            createdAt: new Date().toISOString()
        };
        data.squareDocuments.set(id, document);
        saveToStorage();
        return document;
    };

    const getSquareDocumentsForCircle = (circleId) => {
        return Array.from(data.squareDocuments.values()).filter(doc => doc.circleId === circleId);
    };

    const getCurrentSquareDocument = () => {
        if (data.currentSquareDocumentId && data.squareDocuments.has(data.currentSquareDocumentId)) {
            return data.squareDocuments.get(data.currentSquareDocumentId);
        }
        return null;
    };

    const setCurrentSquareDocument = (id) => {
        data.currentSquareDocumentId = id;
        saveToStorage();
        return true;
    };

    const updateSquareDocumentName = (id, name) => {
        const document = data.squareDocuments.get(id);
        if (document) {
            document.name = name;
            saveToStorage();
            return true;
        }
        return false;
    };

    const deleteSquareDocument = (id) => {
        const squareDoc = data.squareDocuments.get(id);
        if (!squareDoc) return false;

        const remainingDocs = getSquareDocumentsForCircle(squareDoc.circleId);
        if (remainingDocs.length <= 1) return false;

        data.squareDocuments.delete(id);
        
        // Remove squares for this document
        const squaresToRemove = [];
        for (const [squareId, square] of data.squares) {
            if (square.documentId === id) {
                squaresToRemove.push(squareId);
            }
        }
        squaresToRemove.forEach(squareId => data.squares.delete(squareId));

        if (data.currentSquareDocumentId === id) {
            const remaining = getSquareDocumentsForCircle(squareDoc.circleId);
            data.currentSquareDocumentId = remaining.length > 0 ? remaining[0].id : null;
        }

        saveToStorage();
        return true;
    };

    // Circle methods (updated to work with specific viewers)
    const createCircleInViewer = (viewerId) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer) return null;

        // Ensure viewer has a document
        if (!viewer.currentCircleDocumentId) {
            const doc = createCircleDocument();
            viewer.currentCircleDocumentId = doc.id;
        }

        const id = `circle_${data.nextCircleId++}`;
        // Calculate position relative to viewer content (accounting for 40px top bar)
        const containerWidth = viewer.width - 40; // Leave some padding
        const containerHeight = window.innerHeight - 120; // Account for top bar and bottom controls
        const x = Math.random() * Math.max(100, containerWidth - 200) + 50;
        const y = Math.random() * Math.max(100, containerHeight - 200) + 50;

        const circle = {
            id,
            x,
            y,
            name: '???',
            documentId: viewer.currentCircleDocumentId
        };

        data.circles.set(id, circle);
        
        // Create default square document for this circle
        const defaultSquareDoc = createSquareDocument(id, 'Default');
        
        saveToStorage();
        return circle;
    };

    const getCirclesForDocument = (documentId) => {
        return Array.from(data.circles.values()).filter(circle => circle.documentId === documentId);
    };

    const getCirclesForViewer = (viewerId) => {
        const viewer = data.circleViewers.get(viewerId);
        if (!viewer || !viewer.currentCircleDocumentId) return [];
        return getCirclesForDocument(viewer.currentCircleDocumentId);
    };

    const updateCircle = (id, updates) => {
        const circle = data.circles.get(id);
        if (circle) {
            Object.assign(circle, updates);
            saveToStorage();
            return circle;
        }
        return null;
    };

    const deleteCircle = (id) => {
        const circle = data.circles.get(id);
        if (circle) {
            // Remove square documents for this circle
            const squareDocsToRemove = getSquareDocumentsForCircle(id);
            squareDocsToRemove.forEach(doc => {
                data.squareDocuments.delete(doc.id);
                // Remove squares in those documents
                for (const [squareId, square] of data.squares) {
                    if (square.documentId === doc.id) {
                        data.squares.delete(squareId);
                    }
                }
            });

            data.circles.delete(id);
            if (data.selectedCircleId === id) {
                data.selectedCircleId = null;
                data.currentSquareDocumentId = null;
            }
            saveToStorage();
            return true;
        }
        return false;
    };

    // Square methods (unchanged)
    const createSquare = () => {
        if (!data.currentSquareDocumentId) return null;

        const id = `square_${data.nextSquareId++}`;
        const containerWidth = window.innerWidth - getVisibleCircleViewers().reduce((sum, v) => sum + v.width, 0);
        const containerHeight = window.innerHeight;
        const x = Math.random() * (containerWidth - 200) + 100;
        const y = Math.random() * (containerHeight - 200) + 100;

        const square = {
            id,
            x,
            y,
            name: '???',
            documentId: data.currentSquareDocumentId
        };

        data.squares.set(id, square);
        saveToStorage();
        return square;
    };

    const getSquaresForDocument = (documentId) => {
        return Array.from(data.squares.values()).filter(square => square.documentId === documentId);
    };

    const updateSquare = (id, updates) => {
        const square = data.squares.get(id);
        if (square) {
            Object.assign(square, updates);
            saveToStorage();
            return square;
        }
        return null;
    };

    const deleteSquare = (id) => {
        const success = data.squares.delete(id);
        if (success) {
            if (data.selectedSquareId === id) {
                data.selectedSquareId = null;
            }
            saveToStorage();
        }
        return success;
    };

    // Selection methods (updated to work across viewers)
    const selectCircle = (id) => {
        data.selectedCircleId = id;
        data.selectedSquareId = null; // Deselect square when circle is selected

        if (id) {
            // Auto-select square document for this circle
            const squareDocuments = getSquareDocumentsForCircle(id);
            if (squareDocuments.length > 0) {
                data.currentSquareDocumentId = squareDocuments[0].id;
            } else {
                const defaultSquareDoc = createSquareDocument(id, 'Default');
                data.currentSquareDocumentId = defaultSquareDoc.id;
            }
        } else {
            data.currentSquareDocumentId = null;
        }
        saveToStorage();
    };

    const selectSquare = (id) => {
        data.selectedSquareId = id;
        // Don't deselect circle when square is selected
        saveToStorage();
    };

    // Initialize
    loadFromStorage();
    ensureDefaults();

    return {
        data,
        // Circle viewers
        createCircleViewer,
        getCircleViewers,
        getVisibleCircleViewers,
        updateCircleViewer,
        deleteCircleViewer,
        minimizeViewer,
        restoreViewer,
        reorderViewers,
        getViewerTitle,
        // Circle documents
        createCircleDocument,
        getAllCircleDocuments,
        getCircleDocumentForViewer,
        setCircleDocumentForViewer,
        updateCircleDocumentName,
        deleteCircleDocument,
        // Square documents
        createSquareDocument,
        getSquareDocumentsForCircle,
        getCurrentSquareDocument,
        setCurrentSquareDocument,
        updateSquareDocumentName,
        deleteSquareDocument,
        // Circles
        createCircleInViewer,
        getCirclesForDocument,
        getCirclesForViewer,
        updateCircle,
        deleteCircle,
        // Squares
        createSquare,
        getSquaresForDocument,
        updateSquare,
        deleteSquare,
        // Selection
        selectCircle,
        selectSquare,
        saveToStorage
    };
}

export function useDataStore() {
    if (!storeInstance) {
        storeInstance = createDataStore();
    }
    return storeInstance;
}
