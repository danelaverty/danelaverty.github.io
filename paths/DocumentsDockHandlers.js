// DocumentsDockHandlers.js - Event handlers for DocumentsDock with inline editing and dock drop support (Updated with create child handler)
import { useDataStore } from './dataCoordinator.js';
import { nextTick } from './vue-composition-api.js';

export function createDocumentsDockHandlers(dockState, emit) {
    const dataStore = useDataStore();

    // Drag and Drop Handlers for Document Icons
    const handleDragStart = (e, docId) => {
        // Prevent drag if editing
        if (dockState.isEditingDocument(docId)) {
            e.preventDefault();
            return;
        }
        
        dockState.dragState.value = {
            isDragging: true,
            draggedDocId: docId,
            dropTargetId: null,
            isDockDropTarget: false,
            isDockDropInvalid: false
        };
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', docId);
        
        // Set drag image
        const draggedElement = e.target;
        draggedElement.classList.add('dragging');
    };

    const handleDragEnd = (e, docId) => {
        e.target.classList.remove('dragging');
        
        // Reset drag state
        dockState.dragState.value = {
            isDragging: false,
            draggedDocId: null,
            dropTargetId: null,
            isDockDropTarget: false,
            isDockDropInvalid: false
        };
    };

    const handleDragOver = (e, targetDocId) => {
        if (!dockState.dragState.value.isDragging || dockState.dragState.value.draggedDocId === targetDocId) {
            return;
        }
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, targetDocId) => {
        if (!dockState.dragState.value.isDragging || dockState.dragState.value.draggedDocId === targetDocId) {
            return;
        }
        
        // Check if this would create a circular reference
        const draggedDoc = dataStore.getAllCircleDocuments().find(d => d.id === dockState.dragState.value.draggedDocId);
        const targetDoc = dataStore.getAllCircleDocuments().find(d => d.id === targetDocId);
        
        if (!draggedDoc || !targetDoc) return;
        
        // Prevent dropping a parent onto its descendant
        const wouldCreateCircularRef = dataStore.isDescendantOf(targetDocId, dockState.dragState.value.draggedDocId);
        
        dockState.dragState.value.dropTargetId = targetDocId;
        
        // Add visual feedback
        const targetElement = e.target.closest('.document-icon');
        if (targetElement) {
            if (wouldCreateCircularRef) {
                targetElement.classList.add('drag-invalid');
            } else {
                targetElement.classList.add('drag-over');
            }
        }
    };

    const handleDragLeave = (e, targetDocId) => {
        // Only remove classes if we're actually leaving this element
        const targetElement = e.target.closest('.document-icon');
        if (targetElement) {
            targetElement.classList.remove('drag-over', 'drag-invalid');
        }
    };

    const handleDrop = (e, targetDocId) => {
        e.preventDefault();
        
        const draggedDocId = dockState.dragState.value.draggedDocId;
        if (!draggedDocId || draggedDocId === targetDocId) {
            return;
        }
        
        // Check if this would create a circular reference
        const wouldCreateCircularRef = dataStore.isDescendantOf(targetDocId, draggedDocId);
        if (wouldCreateCircularRef) {
            console.warn('Cannot create circular reference in document hierarchy');
            return;
        }
        
        // Update the parent relationship
        const success = dataStore.updateCircleDocumentParent(draggedDocId, targetDocId);
        
        if (success) {
            console.log(`Document ${draggedDocId} nested under ${targetDocId}`);
        }
        
        // Clean up drag classes
        const targetElement = e.target.closest('.document-icon');
        if (targetElement) {
            targetElement.classList.remove('drag-over', 'drag-invalid');
        }
    };

    // Dock Drop Handlers for Un-nesting Documents
    const handleDockDragOver = (e) => {
        if (!dockState.dragState.value.isDragging) {
            return;
        }
        
        // Only allow drop if we're dragging over the dock background, not over document icons
        const target = e.target;
        if (target.closest('.document-icon') || target.closest('.new-document-button') || 
            target.closest('.dock-resize-handle')) {
            return;
        }
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDockDragEnter = (e) => {
        if (!dockState.dragState.value.isDragging) {
            return;
        }
        
        // Only handle if we're dragging over the dock background
        const target = e.target;
        if (target.closest('.document-icon') || target.closest('.new-document-button') || 
            target.closest('.dock-resize-handle')) {
            return;
        }
        
        const draggedDocId = dockState.dragState.value.draggedDocId;
        const canDrop = dockState.canDropOnDock(draggedDocId);
        
        dockState.setDockDropTarget(true, !canDrop);
        
        // Clear any document-specific drag targets
        dockState.dragState.value.dropTargetId = null;
        
        // Remove drag classes from document icons
        document.querySelectorAll('.document-icon.drag-over, .document-icon.drag-invalid').forEach(el => {
            el.classList.remove('drag-over', 'drag-invalid');
        });
    };

    const handleDockDragLeave = (e) => {
        if (!dockState.dragState.value.isDragging) {
            return;
        }
        
        // Only reset if we're actually leaving the dock (not just moving between children)
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            dockState.setDockDropTarget(false, false);
        }
    };

    const handleDockDrop = (e) => {
        if (!dockState.dragState.value.isDragging) {
            return;
        }
        
        // Only handle if we're dropping on the dock background
        const target = e.target;
        if (target.closest('.document-icon') || target.closest('.new-document-button') || 
            target.closest('.dock-resize-handle')) {
            return;
        }
        
        e.preventDefault();
        
        const draggedDocId = dockState.dragState.value.draggedDocId;
        if (!draggedDocId) {
            return;
        }
        
        // Check if we can drop on dock (document must be nested)
        if (!dockState.canDropOnDock(draggedDocId)) {
            console.warn('Cannot un-nest document: already at root level');
            return;
        }
        
        // Un-nest the document by removing its parent
        const success = dataStore.updateCircleDocumentParent(draggedDocId, null);
        
        if (success) {
            console.log(`Document ${draggedDocId} un-nested to root level`);
        }
        
        // Reset dock drop state
        dockState.setDockDropTarget(false, false);
    };

    // Document Management Handlers
    const handleNewDocumentClick = () => {
        // Create new document
        const newDoc = dataStore.createCircleDocument();
        
        // Create new viewer for this document
        const newViewer = dataStore.createCircleViewer();
        dataStore.setCircleDocumentForViewer(newViewer.id, newDoc.id);
        dataStore.setSelectedViewer(newViewer.id);
        
        emit('create-viewer-for-document', newDoc.id);
    };

    // NEW: Handle creating child documents
    const handleCreateChildDocument = (parentDocId) => {
        // Create new document as a child of the parent
        const newDoc = dataStore.createCircleDocument(null, parentDocId);
        
        // Create new viewer for this document
        const newViewer = dataStore.createCircleViewer();
        dataStore.setCircleDocumentForViewer(newViewer.id, newDoc.id);
        dataStore.setSelectedViewer(newViewer.id);
        
        // Ensure the parent is expanded so the new child is visible
        if (dockState.collapsedDocuments.value.has(parentDocId)) {
            dockState.collapsedDocuments.value.delete(parentDocId);
            dockState.saveDockState();
        }
        
        emit('create-viewer-for-document', newDoc.id);
    };

    const handleDocumentClick = (documentId) => {
        // Don't handle clicks if editing
        if (dockState.isEditingDocument(documentId)) return;
        
        // If this document has children, toggle collapse instead of opening viewer
        if (dockState.hasChildren(documentId)) {
            if (dockState.collapsedDocuments.value.has(documentId)) {
                dockState.collapsedDocuments.value.delete(documentId);
            } else {
                dockState.collapsedDocuments.value.add(documentId);
            }
            dockState.saveDockState(); // Persist the change
            return;
        }
        
        // For documents without children, proceed with normal viewer logic
        // Check if this document already has a visible viewer
        const visibleViewers = dataStore.getVisibleCircleViewers();
        const existingViewer = visibleViewers.find(viewer => {
            const doc = dataStore.getCircleDocumentForViewer(viewer.id);
            return doc && doc.id === documentId;
        });

        if (existingViewer) {
            // If viewer exists, just select it
            dataStore.setSelectedViewer(existingViewer.id);
        } else {
            // Create new viewer for this document
            const newViewer = dataStore.createCircleViewer();
            dataStore.setCircleDocumentForViewer(newViewer.id, documentId);
            dataStore.setSelectedViewer(newViewer.id);
        }
        
        emit('create-viewer-for-document', documentId);
    };

    const handleDocumentDoubleClick = async (documentId, event) => {
        // Prevent the single click handler from firing
        event.stopPropagation();
        
        // Don't start editing if already editing another document
        if (dockState.editingDocuments.value.size > 0) return;
        
        // Start editing this document
        dockState.startEditingDocument(documentId);
        
        // Focus the input after Vue updates the DOM
        await nextTick();
        const inputRef = document.querySelector(`[data-ref="input-${documentId}"]`) || 
                        document.querySelector(`textarea[ref="input-${documentId}"]`);
        
        if (inputRef) {
            inputRef.focus();
            inputRef.select();
        }
    };

    const handleEditingKeydown = (event, documentId) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            // Save on Enter (but allow Shift+Enter for line breaks)
            event.preventDefault();
            dockState.saveEditingName(documentId);
        } else if (event.key === 'Escape') {
            // Cancel on Escape
            event.preventDefault();
            dockState.cancelEditingName(documentId);
        }
    };

    const handleEditingBlur = (documentId) => {
        // Save when input loses focus
        dockState.saveEditingName(documentId);
    };

    const handleEditingInput = (event, documentId) => {
        // Update the editing name as user types
        dockState.updateEditingName(documentId, event.target.value);
        
        // Auto-resize textarea to fit content
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 60) + 'px';
    };

    const handleDeleteDocument = (docId) => {
        if (!dockState.canDeleteDocument(docId)) return;
        
        const doc = dockState.allDocuments.value.find(d => d.id === docId);
        if (doc && confirm(`Are you sure you want to delete "${doc.name}"? All circles and their squares will be removed.`)) {
            dataStore.deleteCircleDocument(docId);
        }
    };

    // Handle close viewer requests
    const handleCloseViewer = (docId) => {
        // Find the viewer that's displaying this document
        const visibleViewers = dataStore.getVisibleCircleViewers();
        const targetViewer = visibleViewers.find(viewer => {
            const doc = dataStore.getCircleDocumentForViewer(viewer.id);
            return doc && doc.id === docId;
        });

        if (targetViewer) {
            // Close the viewer
            dataStore.deleteCircleViewer(targetViewer.id);
        }
    };

    // Toggle and Collapse Handlers
    const toggleCollapse = (docId, event) => {
        event.stopPropagation(); // Prevent document click
        
        if (dockState.collapsedDocuments.value.has(docId)) {
            dockState.collapsedDocuments.value.delete(docId);
        } else {
            dockState.collapsedDocuments.value.add(docId);
        }
        
        dockState.saveDockState(); // Persist the change
    };

    return {
        // Drag and drop handlers for document icons
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
        
        // Dock drop handlers for un-nesting
        handleDockDragOver,
        handleDockDragEnter,
        handleDockDragLeave,
        handleDockDrop,
        
        // Document management handlers
        handleNewDocumentClick,
        handleCreateChildDocument, // NEW: Export the new handler
        handleDocumentClick,
        handleDocumentDoubleClick,
        handleDeleteDocument,
        handleCloseViewer,
        
        // Editing handlers
        handleEditingKeydown,
        handleEditingBlur,
        handleEditingInput,
        
        // Toggle and collapse handlers
        toggleCollapse
    };
}
