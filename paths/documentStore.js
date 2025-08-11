// documentStore.js - Document management for circles and squares (Updated with mostRecentlySetCircleType)
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
        let base;
        
        if (baseName) {
            base = baseName;
        } else {
            // Default names based on entity type
            base = entityType === 'circle' ? new Date().toISOString().split('T')[0] : 'Tab';
        }
        
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
        
        // For square documents with default "Tab" name, use numbered format
        if (entityType === 'square' && !baseName) {
		if (!existingNames.has('Story')) { return 'Story'; }
            let counter = 1;
            let uniqueName;
            do {
                uniqueName = `Tab ${counter}`;
                counter++;
            } while (existingNames.has(uniqueName));
            return uniqueName;
        }
        
        // For other cases, use the original logic
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
        } else if (entityType === 'circle') {
            document.mostRecentlySetCircleType = 'glow';
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

    // NEW: Method to update the most recently set circle type for a document
    const setMostRecentlySetCircleType = (documentId, circleType) => {
        const document = data.circleDocuments.get(documentId);
        if (document) {
            document.mostRecentlySetCircleType = circleType;
            return true;
        }
        return false;
    };

    // NEW: Method to get the most recently set circle type for a document
    const getMostRecentlySetCircleType = (documentId) => {
        const document = data.circleDocuments.get(documentId);
        return document?.mostRecentlySetCircleType || null;
    };

    // Smart deletion for square documents that handles selection automatically
    const deleteSquareDocumentWithSelection = (id) => {
        const doc = data.squareDocuments.get(id);
        if (!doc) return false;
        
        const siblingDocs = getSquareDocumentsForCircle(doc.circleId);
        if (siblingDocs.length <= 1) return false; // Prevent deletion of last document
        
        const wasCurrentlySelected = data.currentSquareDocumentId === id;
        const currentIndex = siblingDocs.findIndex(d => d.id === id);
        
        // Delete the document
        const deleted = data.squareDocuments.delete(id);
        
        if (deleted && wasCurrentlySelected) {
            // Get updated sibling docs after deletion
            const updatedSiblings = getSquareDocumentsForCircle(doc.circleId);
            
            if (updatedSiblings.length > 0) {
                // Select adjacent document - prefer the one that's now at the same index (shifted left)
                // or the new last document if we deleted the last one
                let newSelectedDoc;
                if (currentIndex < updatedSiblings.length) {
                    newSelectedDoc = updatedSiblings[currentIndex];
                } else {
                    newSelectedDoc = updatedSiblings[updatedSiblings.length - 1];
                }
                
                data.currentSquareDocumentId = newSelectedDoc.id;
            } else {
                data.currentSquareDocumentId = null;
            }
        }
        
        return deleted;
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
    const deleteSquareDocument = (id) => deleteSquareDocumentWithSelection(id);

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
            const newDoc = createSquareDocument(circleId); // Will use "Tab 1" as default name
            // Automatically select the new document if no document is currently selected
            if (!data.currentSquareDocumentId) {
                data.currentSquareDocumentId = newDoc.id;
            }
            return newDoc;
        }
        
        // If there are existing documents but none is selected, select the first one
        if (!data.currentSquareDocumentId || !data.squareDocuments.has(data.currentSquareDocumentId)) {
            data.currentSquareDocumentId = existingDocs[0].id;
        }
        
        return existingDocs[0];
    };

    // Ensure a square document is selected for the given circle
    const ensureSelectedSquareDocumentForCircle = (circleId) => {
        const docsForCircle = getSquareDocumentsForCircle(circleId);
        
        if (docsForCircle.length === 0) {
            // No documents exist, create one
            const newDoc = createSquareDocument(circleId);
            data.currentSquareDocumentId = newDoc.id;
            return newDoc;
        }
        
        // Check if current selection is valid for this circle
        const currentDoc = getCurrentSquareDocument();
        const isCurrentDocForThisCircle = currentDoc && currentDoc.circleId === circleId;
        
        if (!isCurrentDocForThisCircle) {
            // Select the first document for this circle
            data.currentSquareDocumentId = docsForCircle[0].id;
            return docsForCircle[0];
        }
        
        return currentDoc;
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
            
            // NEW: Ensure all circle documents have the mostRecentlySetCircleType property
            data.circleDocuments.forEach((doc, id) => {
                if (doc.mostRecentlySetCircleType === undefined) {
                    doc.mostRecentlySetCircleType = null;
                }
            });
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
        // NEW: Circle type tracking methods
        setMostRecentlySetCircleType,
        getMostRecentlySetCircleType,
        // Square documents
        createSquareDocument,
        getSquareDocumentsForCircle,
        getCurrentSquareDocument,
        setCurrentSquareDocument,
        getSquareDocument,
        updateSquareDocumentName,
        deleteSquareDocument,
        deleteSquareDocumentWithSelection,
        // Helpers
        ensureSquareDocumentForCircle,
        ensureSelectedSquareDocumentForCircle,
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
