// DocumentsDockState.js - State management for DocumentsDock with inline editing and dock drop support (Pinning removed)
import { ref, computed, nextTick } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';

export function createDocumentsDockState() {
    const dataStore = useDataStore();
    
    // Persistence key for dock state
    const dockStateKey = `documentsDock_${window.location.pathname}`;
    
    // Load persisted state
    const loadDockState = () => {
        try {
            const saved = localStorage.getItem(dockStateKey);
            if (saved) {
                const state = JSON.parse(saved);
                return {
                    collapsedDocs: new Set(state.collapsedDocs || [])
                };
            }
        } catch (error) {
            console.error('Failed to load dock state:', error);
        }
        return {
            collapsedDocs: new Set()
        };
    };

    // Save state to localStorage
    const saveDockState = () => {
        try {
            const state = {
                collapsedDocs: Array.from(collapsedDocuments.value)
            };
            localStorage.setItem(dockStateKey, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save dock state:', error);
        }
    };

    // Initialize state from localStorage
    const initialState = loadDockState();
    const collapsedDocuments = ref(initialState.collapsedDocs);
    
    // Drag and drop state
    const dragState = ref({
        isDragging: false,
        draggedDocId: null,
        dropTargetId: null,
        isDockDropTarget: false,
        isDockDropInvalid: false
    });

    // Editing state
    const editingDocuments = ref(new Map()); // docId -> editingName
    
    // Get hierarchical documents with proper sorting, filtered by collapse state
    const allCircleDocuments = computed(() => {
        const allDocs = dataStore.getFlattenedDocumentsWithHierarchy();
        const filtered = [];
        
        for (const doc of allDocs) {
            // Always include root documents
            if (doc.level === 0) {
                filtered.push(doc);
                continue;
            }
            
            // For nested documents, check if any of their ancestors are collapsed
            let shouldInclude = true;
            let currentDoc = doc;
            
            // Walk up the parent chain to see if any ancestor is collapsed
            while (currentDoc.parentId) {
                const parent = allDocs.find(d => d.id === currentDoc.parentId);
                if (!parent) break;
                
                if (collapsedDocuments.value.has(parent.id)) {
                    shouldInclude = false;
                    break;
                }
                currentDoc = parent;
            }
            
            if (shouldInclude) {
                filtered.push(doc);
            }
        }
        
        return filtered;
    });

    // All documents to display (renamed from visibleDocuments for clarity)
    const allDocuments = computed(() => {
        return allCircleDocuments.value;
    });

    const hasDocuments = computed(() => {
        return allCircleDocuments.value.length > 0;
    });

    // Get currently visible documents (documents that have viewers)
    const currentlyVisibleDocuments = computed(() => {
        const visibleViewers = dataStore.getVisibleCircleViewers();
        const visibleDocIds = new Set();
        
        visibleViewers.forEach(viewer => {
            const doc = dataStore.getCircleDocumentForViewer(viewer.id);
            if (doc) {
                visibleDocIds.add(doc.id);
            }
        });
        
        return visibleDocIds;
    });

    // Dock drop state computed properties
    const isDockDropTarget = computed(() => {
        return dragState.value.isDockDropTarget;
    });

    const isDockDropInvalid = computed(() => {
        return dragState.value.isDockDropInvalid;
    });

    // Helper functions
    const canDeleteDocument = (docId) => {
        // Can delete if there's more than one document
        return allCircleDocuments.value.length > 1;
    };

    const getDocumentDisplayName = (doc) => {
        return doc.name;
    };

    const getCircleCountForDocument = (docId) => {
        const circles = dataStore.getCirclesForDocument(docId);
        return circles.length;
    };

    const isCurrentDocument = (docId) => {
        return currentlyVisibleDocuments.value.has(docId);
    };

    // Check if document has an open viewer
    const hasOpenViewer = (docId) => {
        return currentlyVisibleDocuments.value.has(docId);
    };

    const getDocumentNestingClass = (doc) => {
        if (doc.level === 0) return '';
        if (doc.level === 1) return 'nested nested-level-1';
        if (doc.level === 2) return 'nested nested-level-2';
        if (doc.level === 3) return 'nested nested-level-3';
        return 'nested nested-deep';
    };

    const isDragTarget = (docId) => {
        return dragState.value.dropTargetId === docId;
    };

    const isBeingDragged = (docId) => {
        return dragState.value.draggedDocId === docId;
    };

    // Collapse/expand functionality
    const hasChildren = (docId) => {
        const children = dataStore.getChildDocuments(docId);
        return children.length > 0;
    };

    const isCollapsed = (docId) => {
        return collapsedDocuments.value.has(docId);
    };

    // Editing functionality
    const isEditingDocument = (docId) => {
        return editingDocuments.value.has(docId);
    };

    const getEditingName = (docId) => {
        return editingDocuments.value.get(docId) || '';
    };

    const startEditingDocument = (docId) => {
        const doc = allCircleDocuments.value.find(d => d.id === docId);
        if (doc) {
            editingDocuments.value.set(docId, doc.name);
        }
    };

    const stopEditingDocument = (docId) => {
        editingDocuments.value.delete(docId);
    };

    const updateEditingName = (docId, name) => {
        if (editingDocuments.value.has(docId)) {
            editingDocuments.value.set(docId, name);
        }
    };

    const saveEditingName = (docId) => {
        const newName = editingDocuments.value.get(docId);
        if (newName && newName.trim() !== '') {
            const trimmedName = newName.trim();
            dataStore.updateCircleDocumentName(docId, trimmedName);
        }
        stopEditingDocument(docId);
    };

    const cancelEditingName = (docId) => {
        stopEditingDocument(docId);
    };

    // Dock drop functionality
    const setDockDropTarget = (isTarget, isInvalid = false) => {
        dragState.value.isDockDropTarget = isTarget;
        dragState.value.isDockDropInvalid = isInvalid;
    };

    const canDropOnDock = (draggedDocId) => {
        if (!draggedDocId) return false;
        
        const doc = allCircleDocuments.value.find(d => d.id === draggedDocId);
        if (!doc) return false;
        
        // Can only un-nest documents that are currently nested (have a parent)
        return !!doc.parentId;
    };

    return {
        // State
        collapsedDocuments,
        dragState,
        editingDocuments,
        
        // Computed properties
        allCircleDocuments,
        allDocuments,
        hasDocuments,
        currentlyVisibleDocuments,
        isDockDropTarget,
        isDockDropInvalid,
        
        // Helper functions
        canDeleteDocument,
        getDocumentDisplayName,
        getCircleCountForDocument,
        isCurrentDocument,
        hasOpenViewer,
        getDocumentNestingClass,
        isDragTarget,
        isBeingDragged,
        hasChildren,
        isCollapsed,
        
        // Editing functions
        isEditingDocument,
        getEditingName,
        startEditingDocument,
        stopEditingDocument,
        updateEditingName,
        saveEditingName,
        cancelEditingName,
        
        // Dock drop functions
        setDockDropTarget,
        canDropOnDock,
        
        // State management
        saveDockState
    };
}
