// documentStore.js - Document management for circles and squares (Updated with viewer properties persistence and background cycling)
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

    // Background type constants
    const BACKGROUND_TYPES = {
        SILHOUETTE: 'silhouette',
        CYCLE: 'cycle',
        NONE: 'none'
    };

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
    const createDocument = (entityType, name = null, circleId = null, parentId = null) => {
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
            document.isPinned = false;
            document.parentId = parentId || null;
            // UPDATED: Add viewer properties with new backgroundType
            document.viewerProperties = {
                width: 270,
                showBackground: true, // Keep for backward compatibility
                backgroundType: BACKGROUND_TYPES.SILHOUETTE // NEW: Default background type
            };
            document.energizedCircles = [];
            
            // NEW: Initialize order property - new documents are always first
            // Increment order of all siblings with the same parent
            const siblings = Array.from(data.circleDocuments.values())
                .filter(doc => doc.parentId === parentId);
            siblings.forEach(sibling => {
                sibling.order = (sibling.order || 0) + 1;
            });
            document.order = 0;
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

    // Update document parent relationship
    const updateCircleDocumentParent = (id, parentId) => {
        const document = data.circleDocuments.get(id);
        if (document) {
            // Prevent circular references
            if (parentId && isDescendantOf(parentId, id)) {
                return false;
            }
            
            const oldParentId = document.parentId;
            document.parentId = parentId;
            
            // NEW: Reset order when moving to a new parent - place at top (order 0)
            if (oldParentId !== parentId) {
                // Increment order of all siblings in the new parent
                const newSiblings = Array.from(data.circleDocuments.values())
                    .filter(doc => doc.parentId === parentId && doc.id !== id);
                newSiblings.forEach(sibling => {
                    sibling.order = (sibling.order || 0) + 1;
                });
                document.order = 0;
            }
            
            return true;
        }
        return false;
    };

    // Check if a document is a descendant of another document
    const isDescendantOf = (potentialDescendant, ancestorId) => {
        let currentId = potentialDescendant;
        const visited = new Set();
        
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const doc = data.circleDocuments.get(currentId);
            if (!doc) break;
            
            if (doc.parentId === ancestorId) {
                return true;
            }
            currentId = doc.parentId;
        }
        
        return false;
    };

    // Update document pin status
    const updateCircleDocumentPin = (id, isPinned) => {
        const document = data.circleDocuments.get(id);
        if (document) {
            document.isPinned = isPinned;
            return true;
        }
        return false;
    };

    // UPDATED: Update viewer properties for a circle document with background type support
    const updateCircleDocumentViewerProperties = (id, properties) => {
        const document = data.circleDocuments.get(id);
        if (document) {
            // Ensure viewerProperties exists
            if (!document.viewerProperties) {
                document.viewerProperties = {
                    width: 270,
                    showBackground: true,
                    backgroundType: BACKGROUND_TYPES.SILHOUETTE
                };
            }
            
            // Update only provided properties
            Object.assign(document.viewerProperties, properties);
            
            // Handle backward compatibility: if showBackground is set, update backgroundType accordingly
            if (properties.showBackground !== undefined && properties.backgroundType === undefined) {
                document.viewerProperties.backgroundType = properties.showBackground ? 
                    BACKGROUND_TYPES.SILHOUETTE : BACKGROUND_TYPES.NONE;
            }
            
            return true;
        }
        return false;
    };

    // UPDATED: Get viewer properties for a circle document with background type migration
    const getCircleDocumentViewerProperties = (id) => {
        const document = data.circleDocuments.get(id);
        if (document) {
            // Ensure properties exist with defaults
            if (!document.viewerProperties) {
                document.viewerProperties = {
                    width: 270,
                    showBackground: true,
                    backgroundType: BACKGROUND_TYPES.SILHOUETTE
                };
            }
            
            const properties = document.viewerProperties;
            
            // Migrate old showBackground to backgroundType if needed
            if (properties.backgroundType === undefined) {
                properties.backgroundType = properties.showBackground === false ? 
                    BACKGROUND_TYPES.NONE : BACKGROUND_TYPES.SILHOUETTE;
            }
            
            // Ensure showBackground is consistent with backgroundType for backward compatibility
            properties.showBackground = properties.backgroundType !== BACKGROUND_TYPES.NONE;
            
            return properties;
        }
        
        // Return default properties if document not found
        return {
            width: 270,
            showBackground: true,
            backgroundType: BACKGROUND_TYPES.SILHOUETTE
        };
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
        
        // Handle deletion of circle documents with children
        if (entityType === 'circle') {
            const childDocuments = getChildDocuments(id);
            
            // Move children up to the parent of the deleted document
            const parentDocument = data.circleDocuments.get(id);
            const grandparentId = parentDocument?.parentId || null;
            
            childDocuments.forEach(child => {
                child.parentId = grandparentId;
            });
        }
        
        return store.delete(id);
    };

    // Get child documents
    const getChildDocuments = (parentId) => {
        return Array.from(data.circleDocuments.values()).filter(doc => doc.parentId === parentId);
    };

    // Get root documents (documents without parents)
    const getRootDocuments = () => {
        return Array.from(data.circleDocuments.values()).filter(doc => !doc.parentId);
    };

    // Get hierarchical document structure
    const getDocumentHierarchy = () => {
        const allDocs = Array.from(data.circleDocuments.values());
        const hierarchy = [];
        
        // Get all root documents
        const rootDocs = allDocs.filter(doc => !doc.parentId);
        
        // Recursive function to build hierarchy
        const buildHierarchy = (parentId = null, level = 0) => {
            const children = allDocs.filter(doc => doc.parentId === parentId);
            
            return children.map(doc => ({
                ...doc,
                level,
                children: buildHierarchy(doc.id, level + 1)
            }));
        };
        
        // Build complete hierarchy starting from roots
        return rootDocs.map(doc => ({
            ...doc,
            level: 0,
            children: buildHierarchy(doc.id, 1)
        }));
    };

    // Get flattened document list with hierarchy info
    const getFlattenedDocumentsWithHierarchy = () => {
        const allDocs = Array.from(data.circleDocuments.values());
        const flattened = [];
        
        // Get root documents first, sorted by pin status then by order
        const rootDocs = allDocs.filter(doc => !doc.parentId)
            .sort((a, b) => {
                const aPinned = a.isPinned || false;
                const bPinned = b.isPinned || false;
                
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                // UPDATED: Sort by order instead of alphabetically
                return (a.order || 0) - (b.order || 0);
            });
        
        // Recursive function to add a document and all its children
        const addDocumentAndChildren = (doc, level = 0) => {
            // Add current document with level info
            flattened.push({
                ...doc,
                level,
                children: [] // We'll use this for the tree structure, but flatten here
            });
            
            // Get children of this document, sorted by pin status then by order
            const children = allDocs.filter(child => child.parentId === doc.id)
                .sort((a, b) => {
                    const aPinned = a.isPinned || false;
                    const bPinned = b.isPinned || false;
                    
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    // UPDATED: Sort by order instead of alphabetically
                    return (a.order || 0) - (b.order || 0);
                });
            
            // Recursively add each child and their descendants
            children.forEach(child => {
                addDocumentAndChildren(child, level + 1);
            });
        };
        
        // Process each root document and its descendants
        rootDocs.forEach(doc => {
            addDocumentAndChildren(doc, 0);
        });
        
        return flattened;
    };

    // Method to update the most recently set circle type for a document
    const setMostRecentlySetCircleType = (documentId, circleType) => {
        const document = data.circleDocuments.get(documentId);
        if (document) {
            document.mostRecentlySetCircleType = circleType;
            return true;
        }
        return false;
    };

    // Method to get the most recently set circle type for a document
    const getMostRecentlySetCircleType = (documentId) => {
        const document = data.circleDocuments.get(documentId);
        return document?.mostRecentlySetCircleType || null;
    };

    // NEW: Reorder a document within its current parent
    const reorderCircleDocument = (docId, targetDocId, position) => {
        const doc = data.circleDocuments.get(docId);
        const targetDoc = data.circleDocuments.get(targetDocId);
        
        if (!doc || !targetDoc) {
            return false;
        }
        
        // Must have same parent to reorder
        if (doc.parentId !== targetDoc.parentId) {
            return false;
        }
        
        // Get all siblings (including the doc being moved) sorted by order
        const siblings = Array.from(data.circleDocuments.values())
            .filter(d => d.parentId === doc.parentId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Remove the dragged doc from the list
        const draggedIndex = siblings.findIndex(d => d.id === docId);
        if (draggedIndex === -1) return false;
        
        const [draggedDoc] = siblings.splice(draggedIndex, 1);
        
        // Find target index (after removal of dragged doc)
        const targetIndex = siblings.findIndex(d => d.id === targetDocId);
        if (targetIndex === -1) return false;
        
        // Insert before or after target
        if (position === 'before') {
            siblings.splice(targetIndex, 0, draggedDoc);
        } else {
            siblings.splice(targetIndex + 1, 0, draggedDoc);
        }
        
        // Reassign order values
        siblings.forEach((d, index) => {
            d.order = index;
        });
        
        return true;
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
    const createCircleDocument = (name, parentId = null) => createDocument('circle', name, null, parentId);
    const createSquareDocument = (circleId, name) => createDocument('square', name, circleId);
    
    const getAllCircleDocuments = () => getAllDocuments('circle');
    const getCircleDocument = (id) => getDocument('circle', id);
    const updateCircleDocumentName = (id, name) => updateDocumentName('circle', id, name);
    const deleteCircleDocument = (id) => deleteDocument('circle', id);
    
    const getSquareDocument = (id) => getDocument('square', id);
    const updateSquareDocumentName = (id, name) => updateDocumentName('square', id, name);
    const deleteSquareDocument = (id) => deleteSquareDocumentWithSelection(id);

const updateCircleDocumentEnergizedCircles = (id, energizedCircles) => {
    const document = data.circleDocuments.get(id);
    if (document) {
        document.energizedCircles = energizedCircles;
        return true;
    }
    return false;
};

const getEnergizedCirclesForDocument = (id) => {
    const document = data.circleDocuments.get(id);
    return document?.energizedCircles || [];
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

    // UPDATED: Serialization with background type migration
    const serialize = () => ({
        circleDocuments: Array.from(data.circleDocuments.entries()),
        squareDocuments: Array.from(data.squareDocuments.entries()),
        currentSquareDocumentId: data.currentSquareDocumentId,
        nextCircleDocumentId: data.nextCircleDocumentId,
        nextSquareDocumentId: data.nextSquareDocumentId
    });

    // UPDATED: Deserialization with background type migration
    const deserialize = (savedData) => {
        if (savedData.circleDocuments) {
            data.circleDocuments = new Map(savedData.circleDocuments);
            
            // Ensure all circle documents have the required properties
            data.circleDocuments.forEach((doc, id) => {
                if (doc.mostRecentlySetCircleType === undefined) {
                    doc.mostRecentlySetCircleType = null;
                }
                if (doc.isPinned === undefined) {
                    doc.isPinned = false;
                }
                if (doc.parentId === undefined) {
                    doc.parentId = null;
                }
                // UPDATED: Ensure viewer properties exist with migration support
                if (doc.viewerProperties === undefined) {
                    doc.viewerProperties = {
                        width: 270,
                        showBackground: true,
                        backgroundType: BACKGROUND_TYPES.SILHOUETTE
                    };
                } else {
                    // Migrate existing properties if needed
                    if (doc.viewerProperties.backgroundType === undefined) {
                        // Use showBackground to determine initial backgroundType
                        doc.viewerProperties.backgroundType = doc.viewerProperties.showBackground === false ? 
                            BACKGROUND_TYPES.NONE : BACKGROUND_TYPES.SILHOUETTE;
                    }
                    // Ensure showBackground is present for backward compatibility
                    if (doc.viewerProperties.showBackground === undefined) {
                        doc.viewerProperties.showBackground = doc.viewerProperties.backgroundType !== BACKGROUND_TYPES.NONE;
                    }
                }

                if (doc.energizedCircles === undefined) {
                    doc.energizedCircles = [];
                }
                // NEW: Ensure order property exists
                if (doc.order === undefined) {
                    doc.order = 0;
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
    };

    return {
        data,
        // Constants
        BACKGROUND_TYPES, // NEW: Expose background type constants
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
        updateCircleDocumentPin,
        updateCircleDocumentParent,
        deleteCircleDocument,
        updateCircleDocumentEnergizedCircles,
        getEnergizedCirclesForDocument,
        // UPDATED: Viewer properties methods with background type support
        updateCircleDocumentViewerProperties,
        getCircleDocumentViewerProperties,
        // Hierarchy methods
        getChildDocuments,
        getRootDocuments,
        getDocumentHierarchy,
        getFlattenedDocumentsWithHierarchy,
        isDescendantOf,
        // Circle type tracking methods
        setMostRecentlySetCircleType,
        getMostRecentlySetCircleType,
        // NEW: Reordering method
        reorderCircleDocument,
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
