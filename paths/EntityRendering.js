// EntityRendering.js - Entity component rendering logic and style calculations
import { computed, watch, nextTick, onMounted, onUnmounted } from './vue-composition-api.js';
import { EntityStyleCalculator } from './EntityStyleCalculator.js';
import { CircleTypeRenderer } from './CircleTypeRenderer.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';

export const useEntityRendering = (props, state) => {
    const { shapeRef } = state;
    const proximitySystem = useEnergyProximitySystem();

    // Use separated concerns modules
    const styleCalculator = new EntityStyleCalculator(props);

    // Computed styles using the style calculator
    const circleStyles = computed(() => styleCalculator.getCircleStyles());
    const squareStyles = computed(() => styleCalculator.getSquareStyles());

    // Shape classes with dynamic styling
    const shapeClasses = computed(() => {
        const classes = styleCalculator.getShapeClasses(props.isSelected);
        
        // Add bold class for bold squares
        if (state.isBold.value) {
            classes.push('bold');
        }
        
        // Add indicator class for squares with indicator emojis
        if (state.getIndicatorClass.value) {
            classes.push(state.getIndicatorClass.value);
        }
        
        return classes;
    });

    // Computed name classes for bold styling, reference styling, and animation styling
    const nameClasses = computed(() => {
        const classes = ['entity-name', `${props.entityType}-name`];
        
        // Add bold class for bold squares
        if (state.isBold.value) {
            classes.push('bold');
        }
        
        // Add referenced class for referenced circles
        if (state.isReferencedCircle.value) {
            classes.push('referenced');
        }
        
        // Add animation copy class for animation copies
        if (state.isAnimationCopy.value) {
            classes.push('animation-copy');
        }
        
        return classes;
    });

    // Register/update circle with proximity system
    const updateProximityRegistration = () => {
        if (props.entityType === 'circle' && shapeRef.value && props.viewerWidth && state.actualViewerId.value) {
            proximitySystem.updateCircle(
                props.entity.id,
                props.entity,
                shapeRef.value,
                props.viewerWidth,
                state.actualViewerId.value
            );
        }
    };

    // Watch for changes that should trigger re-rendering
    watch(
        () => [
            props.entity.type, 
            props.entity.color, 
            props.entity.colors, 
            props.entity.emoji, // Watch for emoji changes in circles
            props.entity.energyTypes, // Watch for energy type changes
            props.entity.activation, // Watch for activation changes
            props.entity.referenceID, // Watch for referenceID changes
            state.squareCount.value,
            props.isSelected
        ],
        (newValues, oldValues) => {
            if (props.entityType === 'circle' && shapeRef.value) {
                const hasActualChanges = newValues.some((val, index) => 
                    JSON.stringify(val) !== JSON.stringify(oldValues?.[index])
                );
                
                if (hasActualChanges) {
                    nextTick(() => {
                        CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, state.squareCount.value);
                        // Update proximity system registration after re-render
                        updateProximityRegistration();
                    });
                }
            }
        },
        { deep: true }
    );

    // Watch for position changes to update proximity system
    watch(
        () => [props.entity.x, props.entity.y, props.viewerWidth],
        () => {
            if (props.entityType === 'circle') {
                nextTick(() => {
                    updateProximityRegistration();
                });
            }
        }
    );

    // Watch for selection changes - handled centrally by SelectionRenderer
    watch(
        () => props.isSelected,
        (newSelected, oldSelected) => {
            if (shapeRef.value && newSelected !== oldSelected) {
                nextTick(() => {
                    // Use centralized selection management
                    SelectionRenderer.handleSelectionChange(
                        shapeRef.value, 
                        newSelected, 
                        props.entityType, 
                        props.entity
                    );
                });
            }
        }
    );

    // Initialize rendering on mount
    const initializeEntityDisplay = () => {
        if (!shapeRef.value) return;
        
        if (props.entityType === 'circle') {
            // Render circle type first
            CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, state.squareCount.value);
            // Register with proximity system
            updateProximityRegistration();
        } else if (props.entityType === 'square') {
            // Initialize selection for squares
            SelectionRenderer.initializeSelection(
                shapeRef.value, 
                props.entityType, 
                props.entity, 
                props.isSelected
            );
        }
    };

    // Cleanup function for when component is unmounted
    const cleanupRendering = () => {
        if (shapeRef.value) {
            SelectionRenderer.removeSelectionIndicator(shapeRef.value);
        }
        
        // Unregister from proximity system
        if (props.entityType === 'circle') {
            proximitySystem.unregisterCircle(props.entity.id);
        }
    };

    // Lifecycle hooks
    onMounted(() => {
        nextTick(() => {
            initializeEntityDisplay();
        });
    });

    onUnmounted(() => {
        cleanupRendering();
    });

    return {
        circleStyles,
        squareStyles,
        shapeClasses,
        nameClasses,
        updateProximityRegistration,
        initializeEntityDisplay,
        cleanupRendering
    };
};
