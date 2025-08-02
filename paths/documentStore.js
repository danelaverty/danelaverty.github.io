// documentStore.js - Document management for circles and squares
import { reactive } from './vue-composition-api.js';

let documentStoreInstance = null;

function createDocumentStore() {
    const data = reactive({
        circleDocuments: new Map(),
        squareDocuments: new Map(),
        currentSquareDocumentId: null,
        nextCircleDocumentId: 1,
        nextSquareDocumentId: 1
    });

    // Utility for generating unique names
    const generateUniqueName = (entityType, baseName, contextId = null) => {
        const base = baseName || (entityType === 'circle' ? new Date().toISOString().split('T')[0] : 'Square Document');
        
        let existingNames;
        if (entityType === 'circle') {
            existingNames = new Set(Array.from(data.circleDocuments.values()).map(doc => doc.name));
        } else {
            existingNames = new Set(
                Array.from(data.squareDocuments.values())
                    .filter(doc => doc.circleId === contextId)
                    .map(doc => doc.name)
            );
        }
        
        if (!existingNames.has(base)) return base;
        
        let counter = 1;
        let uniqueName;
        do {
            uniqueName = `${base} (${counter})`;
            counter++;
        } while (existingNames.has(uniqueName));
        
        return uniqueName;
    };

    // Generic document operations
    const createDocument = (entityType, name = null, circleId = null) => {
        const id = `${entityType}Doc_${entityType === 'circle' ? data.nextCircleDocumentId++ : data.nextSquareDocumentId++}`;
        const documentName = generateUniqueName(entityType, name, circleId);
        
        const document = {
            id,
            name: documentName,
            createdAt: new Date().toISOString()
        };
        
        if (entityType === 'square') {
            document.circleId = circleId;
        }
        
        const store = entityType === 'circle' ? data.circleDocuments : data.squareDocuments;
        store.set(id, document);
        return document;
    };

    const getDocument = (entityType, id) => {
        const store = entityType === 'circle' ? data.circleDocuments : data.squareDocuments;
        return store.get(id);
    };

    const getAllDocuments = (entityType) => {
        const store = entityType === 'circle' ? data.circleDocuments : data.squareDocuments;
        return Array.from(store.values());
    };

    const updateDocumentName = (entityType, id, name) => {
        const store = entityType === 'circle' ? data.circleDocuments : data.squareDocuments;
        const document = store.get(id);
        if (document) {
            document.name = name;
            return true;
        }
        return false;
    };

    const deleteDocument = (entityType, id) => {
        const store = entityType === 'circle' ? data.circleDocuments : data.squareDocuments;
        
        // Prevent deletion if it's the last document of its type
        if (entityType === 'circle' && data.circleDocuments.size <= 1) return false;
        if (entityType === 'square') {
            const doc = store.get(id);
            if (doc) {
                const remainingDocs = getSquareDocumentsForCircle(doc.circleId);
                if (remainingDocs.length <= 1) return false;
            }
        }
        
        return store.delete(id);
    };

    // Specific methods (for compatibility and convenience)
    const createCircleDocument = (name) => createDocument('circle', name);
    const createSquareDocument = (circleId, name) => createDocument('square', name, circleId);
    
    const getAllCircleDocuments = () => getAllDocuments('circle');
    const getCircleDocument = (id) => getDocument('circle', id);
    const updateCircleDocumentName = (id, name) => updateDocumentName('circle', id, name);
    const deleteCircleDocument = (id) => deleteDocument('circle', id);
    
    const getSquareDocument = (id) => getDocument('square', id);
    const updateSquareDocumentName = (id, name) => updateDocumentName('square', id, name);
    const deleteSquareDocument = (id) => deleteDocument('square', id);

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
        return true;
    };

    // Document relationship helpers
    const ensureSquareDocumentForCircle = (circleId) => {
        const existingDocs = getSquareDocumentsForCircle(circleId);
        if (existingDocs.length === 0) {
            return createSquareDocument(circleId, 'Default');
        }
        return existingDocs[0];
    };

    const deleteSquareDocumentsForCircle = (circleId) => {
        const docsToDelete = getSquareDocumentsForCircle(circleId);
        docsToDelete.forEach(doc => {
            data.squareDocuments.delete(doc.id);
        });
        
        // Clear current selection if it was one of the deleted documents
        if (data.currentSquareDocumentId && 
            docsToDelete.some(doc => doc.id === data.currentSquareDocumentId)) {
            data.currentSquareDocumentId = null;
        }
        
        return docsToDelete.length;
    };

    // Serialization
    const serialize = () => ({
        circleDocuments: Array.from(data.circleDocuments.entries()),
        squareDocuments: Array.from(data.squareDocuments.entries()),
        currentSquareDocumentId: data.currentSquareDocumentId,
        nextCircleDocumentId: data.nextCircleDocumentId,
        nextSquareDocumentId: data.nextSquareDocumentId
    });

    const deserialize = (savedData) => {
        if (savedData.circleDocuments) {
            data.circleDocuments = new Map(savedData.circleDocuments);
        }
        if (savedData.squareDocuments) {
            data.squareDocuments = new Map(savedData.squareDocuments);
        }
        if (savedData.nextCircleDocumentId) {
            data.nextCircleDocumentId = savedData.nextCircleDocumentId;
        }
        if (savedData.nextSquareDocumentId) {
            data.nextSquareDocumentId = savedData.nextSquareDocumentId;
        }
        // Note: currentSquareDocumentId is intentionally not restored - should be set by selection
    };

    return {
        data,
        // Generic methods
        createDocument,
        getDocument,
        getAllDocuments,
        updateDocumentName,
        deleteDocument,
        // Circle documents
        createCircleDocument,
        getAllCircleDocuments,
        getCircleDocument,
        updateCircleDocumentName,
        deleteCircleDocument,
        // Square documents
        createSquareDocument,
        getSquareDocumentsForCircle,
        getCurrentSquareDocument,
        setCurrentSquareDocument,
        getSquareDocument,
        updateSquareDocumentName,
        deleteSquareDocument,
        // Helpers
        ensureSquareDocumentForCircle,
        deleteSquareDocumentsForCircle,
        // Serialization
        serialize,
        deserialize
    };
}

export function useDocumentStore() {
    if (!documentStoreInstance) {
        documentStoreInstance = createDocumentStore();
    }
    return documentStoreInstance;
}
