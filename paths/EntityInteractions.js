// EntityInteractions.js - Entity component interaction handlers and user input
import { useDataStore } from './dataCoordinator.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';
import { EntityDragHandler } from './EntityDragHandler.js';
import { EntityNameEditor } from './EntityNameEditor.js';

export const useEntityInteractions = (props, emit, state) => {
    const dataStore = useDataStore();
    const proximitySystem = useEnergyProximitySystem();
    const { elementRef, nameRef, isReferencedCircle, isAnimationCopy, enhancedProps } = state;

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
        // Expose methods from drag handler
        handleClick: dragHandler.handleClick,
        handleMouseDown: dragHandler.handleMouseDown,
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
