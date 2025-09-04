// EntityInteractions.js - Entity component interaction handlers and user input (Updated with group collapse double-click)
import { ref } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';
import { EntityDragHandler } from './EntityDragHandler.js';
import { EntityNameEditor } from './EntityNameEditor.js';

export const useEntityInteractions = (props, emit, state) => {
    const dataStore = useDataStore();
    const proximitySystem = useEnergyProximitySystem();
    const { elementRef, nameRef, isReferencedCircle, isAnimationCopy, enhancedProps } = state;

    // Track last click time for double-click detection
    const lastClickTime = ref(0);
    const doubleClickThreshold = 300; // milliseconds

    // Create a drag move handler for proximity system updates
    const handleProximityDragMove = (deltaX, deltaY) => {
        // Update proximity system with temporary positions during drag
        if (props.entityType === 'circle') {
            // Set temporary position for this circle
            const centerX = props.viewerWidth / 2;
            const tempX = centerX + props.entity.x + deltaX + 16; // +16 for circle center
            const tempY = props.entity.y + deltaY + 16; // +16 for circle center
            proximitySystem.setTempPosition(props.entity.id, tempX, tempY);
            
            // If multiple circles are selected and moving together, update all their temp positions
            const isMultiSelected = dataStore.hasMultipleCirclesSelected() && 
                                   dataStore.isCircleSelected(props.entity.id);
            
            if (isMultiSelected) {
                const selectedIds = dataStore.getSelectedCircles();
                selectedIds.forEach(id => {
                    if (id !== props.entity.id) {
                        const circle = dataStore.getCircle(id);
                        if (circle) {
                            const circleTempX = centerX + circle.x + deltaX + 16;
                            const circleTempY = circle.y + deltaY + 16;
                            proximitySystem.setTempPosition(id, circleTempX, circleTempY);
                        }
                    }
                });
            }
            
            // Force immediate proximity system update
            proximitySystem.forceUpdate();
        }
    };

    // Create a drag end handler for proximity system cleanup
    const handleProximityDragEnd = () => {
        // Clear temporary positions for circles
        if (props.entityType === 'circle') {
            proximitySystem.clearTempPosition(props.entity.id);
            
            // Clear temp positions for all selected circles if multi-selecting
            const isMultiSelected = dataStore.hasMultipleCirclesSelected() && 
                                   dataStore.isCircleSelected(props.entity.id);
            
            if (isMultiSelected) {
                const selectedIds = dataStore.getSelectedCircles();
                selectedIds.forEach(id => {
                    proximitySystem.clearTempPosition(id);
                });
            }
            
            // Force final update to reset any lingering effects
            proximitySystem.forceUpdate();
        }
    };

    // Create drag handler with proper callbacks and enhanced props
    const dragHandler = new EntityDragHandler(
        elementRef, 
        emit, 
        dataStore, 
        enhancedProps.value,
        {
            onDragMove: handleProximityDragMove,
            onDragEnd: handleProximityDragEnd
        }
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

    // Enhanced click handler with double-click detection
    const handleClick = (e) => {
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
        
        // Override the handleNameClick to prevent editing for referenced circles and animation copies
        const originalHandleNameClick = baseEditor.handleNameClick;
        baseEditor.handleNameClick = (e) => {
            if (isReferencedCircle.value || isAnimationCopy.value) {
                e.stopPropagation();
                return; // Don't allow editing for referenced circles or animation copies
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
        // Internal handlers for proximity system
        handleProximityDragMove,
        handleProximityDragEnd
    };
};
