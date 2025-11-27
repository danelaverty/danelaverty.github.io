// EntityRendering.js - Entity component rendering logic and style calculations
import { computed, watch, nextTick, onMounted, onUnmounted } from './vue-composition-api.js';
import { EntityStyleCalculator } from './EntityStyleCalculator.js';
import { CircleTypeRenderer } from './CircleTypeRenderer.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { useRoilMotion } from './EntityRendering-RoilMotion.js';

export const useEntityRendering = (props, state) => {
    const { shapeRef } = state;

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
    
    // NEW: Add referenced class for document reference circles (same styling)
    if (state.isDocumentReferenceCircle.value) {
        classes.push('referenced');
    }
    
    // Add animation copy class for animation copies
    if (state.isAnimationCopy.value) {
        classes.push('animation-copy');
    }
    
    return classes;
});

    // Watch for changes that should trigger re-rendering
    watch(
        () => [
            props.entity.type, 
            props.entity.color, 
            props.entity.colors, 
            props.entity.emoji,
            props.entity.energyTypes,
            props.entity.activation,
            props.entity.referenceID,
            state.squareCount.value,
            state.belongingCirclesCount?.value,
            //state.groupMemberScale?.value,
            props.isSelected
        ],
        (newValues, oldValues) => {
            if (props.entityType === 'circle' && shapeRef.value) {
                const hasActualChanges = newValues.some((val, index) => 
                    JSON.stringify(val) !== JSON.stringify(oldValues?.[index])
                );
                
                if (hasActualChanges) {
                    nextTick(() => {
                        CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, state.squareCount.value, state.belongingCirclesCount?.value, roilMotion.isRoilMember.value);
                    });
                }
            }
        },
        { deep: true }
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

    // NEW: Add roil motion
    const roilMotion = useRoilMotion(props, state);

    // Initialize rendering on mount
    const initializeEntityDisplay = () => {
        if (!shapeRef.value) return;
        
        if (props.entityType === 'circle') {
            // Render circle type first
            CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, state.squareCount.value, state.belongingCirclesCount?.value, roilMotion.isRoilMember.value);
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
        initializeEntityDisplay,
        cleanupRendering,
        // NEW: Add roil motion functions
        ...roilMotion,
    };
};
