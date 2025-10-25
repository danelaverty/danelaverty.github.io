// EntityInteractions.js - Entity component interaction handlers and user input (Updated with group collapse double-click)
import { ref } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { EntityDragHandler } from './EntityDragHandler.js';
import { EntityNameEditor } from './EntityNameEditor.js';

export const useEntityInteractions = (props, emit, state) => {
    const dataStore = useDataStore();
    const { elementRef, nameRef, isReferencedCircle, isDocumentReferenceCircle, isAnimationCopy, enhancedProps } = state;

    // Track last click time for double-click detection
    const lastClickTime = ref(0);
    const doubleClickThreshold = 100; // milliseconds

    // Create drag handler with proper callbacks and enhanced props
    const dragHandler = new EntityDragHandler(
        elementRef, 
        emit, 
        dataStore, 
        enhancedProps.value,
    );

    // NEW: Handle double-click for group circle collapse/expand
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Only handle double-click for group-type circles
        if (props.entityType === 'circle' && props.entity.type === 'group') {
            // Don't allow double-click on referenced circles or animation copies
            if (isReferencedCircle.value || isAnimationCopy.value) {
                return;
            }
            
            // Toggle the collapsed state
            const result = dataStore.toggleGroupCollapsed(props.entity.id);
        }
    };

    // Enhanced click handler with double-click detection and CTRL-SHIFT-click for document reference circles
    const handleClick = (e) => {
        // NEW: Check for CTRL-SHIFT-click on document reference circles
        if (e.ctrlKey && e.shiftKey && 
            props.entityType === 'circle' && 
            isDocumentReferenceCircle.value && 
            props.entity.documentReferenceID) {
            e.stopPropagation();
            e.preventDefault();
            
            // Emit event to open viewer for the referenced document
            emit('open-document-viewer', props.entity.documentReferenceID);
            return;
        }
        
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime.value;
        
        // Check for double-click
        if (timeSinceLastClick < doubleClickThreshold) {
            // This is a double-click
            handleDoubleClick(e);
            // Reset the click time to prevent triple-clicks from being processed
            lastClickTime.value = 0;
            return;
        }
        
        // Update last click time
        lastClickTime.value = currentTime;
        
        // Delay the single-click handler to allow for potential double-click
        setTimeout(() => {
            const finalTimeSinceClick = Date.now() - lastClickTime.value;
            
            // Only process single-click if no double-click occurred
            if (finalTimeSinceClick >= doubleClickThreshold - 50) {
                // Call the original drag handler click method
                dragHandler.handleClick(e);
            }
        }, doubleClickThreshold);
    };

// Create a modified name editor that respects referenced circles and animation copies
const createNameEditor = () => {
    const baseEditor = new EntityNameEditor(nameRef, emit);
    
    // Override the handleNameClick to prevent editing for referenced circles, document reference circles, and animation copies
    const originalHandleNameClick = baseEditor.handleNameClick;
    baseEditor.handleNameClick = (e) => {
        if (isReferencedCircle.value || isDocumentReferenceCircle.value || isAnimationCopy.value) {
            e.stopPropagation();
            return; // Don't allow editing for referenced circles, document reference circles, or animation copies
        }
        originalHandleNameClick(e);
    };
    
    return baseEditor;
};

    const nameEditor = createNameEditor();

    return {
        // Expose methods from drag handler (with enhanced click handling)
        handleClick, // NEW: Enhanced with double-click detection
        handleMouseDown: dragHandler.handleMouseDown,
        // NEW: Expose double-click handler directly
        handleDoubleClick,
        // Expose methods from name editor
        handleNameClick: nameEditor.handleNameClick,
        handleNameKeydown: nameEditor.handleNameKeydown,
        finishNameEdit: nameEditor.finishNameEdit,
        handleBlur: nameEditor.handleBlur,
    };
};
