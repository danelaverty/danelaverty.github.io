// EntityRendering-RoilMotion.js - Roil motion integration for EntityRendering
import { watch, onMounted, onUnmounted, nextTick } from './vue-composition-api.js';
import { roilMotionSystem } from './RoilMotionSystem.js';
import { useRoilState } from './EntityState-RoilExtension.js';

export const useRoilMotion = (props, state) => {
    const { shapeRef } = state;
    
    // Get roil state
    const roilState = useRoilState(props, state.dataStore || props.dataStore);
    
    // Watch for roil membership changes
    watch(
        () => roilState.isRoilMember.value,
        (isRoilMember, wasRoilMember) => {
            if (props.entityType !== 'circle') return;
            
            nextTick(() => {
                if (isRoilMember && !wasRoilMember) {
                    // Just became a roil member - add to motion system
                    addToRoilMotion();
                } else if (!isRoilMember && wasRoilMember) {
                    // No longer a roil member - remove from motion system
                    removeFromRoilMotion();
                }
            });
        }
    );

    // Function to add circle to roil motion
    const addToRoilMotion = () => {
        if (!shapeRef.value || !roilState.isRoilMember.value) return;

        const containerStyle = getComputedStyle(state.elementRef.value);
        const currentLeft = parseFloat(containerStyle.left) || 0;
        const currentTop = parseFloat(containerStyle.top) || 0;

        // Set bounds relative to the container's starting position
        const bounds = {
            minX: currentLeft - 30,
            maxX: currentLeft + 30,
            minY: currentTop - 30,
            maxY: currentTop + 30
        };
        
        roilMotionSystem.addCircle(props.entity.id, state.elementRef.value, bounds);
    };

    // Function to remove circle from roil motion
    const removeFromRoilMotion = () => {
        roilMotionSystem.removeCircle(props.entity.id);
    };

    // Initialize roil motion on mount if needed
    const initializeRoilMotion = () => {
        if (roilState.isRoilMember.value) {
            nextTick(() => {
                addToRoilMotion();
            });
        }
    };

    // Cleanup roil motion on unmount
    const cleanupRoilMotion = () => {
        removeFromRoilMotion();
    };

    // Lifecycle hooks
    onMounted(() => {
        initializeRoilMotion();
    });

    onUnmounted(() => {
        cleanupRoilMotion();
    });

    return {
        ...roilState,
        initializeRoilMotion,
        cleanupRoilMotion,
        addToRoilMotion,
        removeFromRoilMotion
    };
};
