// EntityRendering-RoilMotion.js - Updated to pass group positioning data to RoilMotionSystem
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

watch(
    () => props.entity.buoyancy,
    (newBuoyancy) => {
        if (roilState.isRoilMember.value && roilMotionSystem.activeCircles.has(props.entity.id)) {
            roilMotionSystem.updateCircleBuoyancy(props.entity.id);
        }
    }
);

    // Function to add circle to roil motion
    const addToRoilMotion = () => {
        if (!shapeRef.value || !roilState.isRoilMember.value) return;

        // Ensure dataStore is available to RoilMotionSystem
        const dataStore = state.dataStore || props.dataStore;
        if (!dataStore) {
            console.warn('No dataStore available for roil motion positioning');
            return;
        }

        // Set dataStore reference on roilMotionSystem (safe to call multiple times)
        roilMotionSystem.setDataStore(dataStore);

        // Get group ID from the entity
        const groupId = props.entity.belongsToID;
        if (!groupId) {
            console.warn('Roil member has no group ID:', props.entity.id);
            return;
        }

        // Get viewer width for positioning calculations
        const viewerWidth = props.viewerWidth;
        if (!viewerWidth) {
            console.warn('No viewer width available for roil positioning');
            return;
        }

        // Set bounds relative to the group (these will be relative offsets from group position)
        const bounds = {
            minX: -30,
            maxX: 30,
            minY: -30,
            maxY: 30
        };
        
        // Pass group ID and viewer width to enable proper positioning
        roilMotionSystem.addCircle(
            props.entity.id, 
            state.elementRef.value, 
            bounds,
            groupId,      // NEW: Pass group ID
            viewerWidth   // NEW: Pass viewer width
        );

        roilMotionSystem.updateCircleBuoyancy(props.entity.id);
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
