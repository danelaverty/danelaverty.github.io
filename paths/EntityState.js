// EntityState.js - Entity component state management and computed properties
import { ref, computed, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { EmojiService } from './emojiService.js';

export const useEntityState = (props) => {
    const dataStore = useDataStore();
    
    // Refs for DOM elements
    const elementRef = ref(null);
    const shapeRef = ref(null);
    const nameRef = ref(null);

    // Check if this is a referenced circle
    const isReferencedCircle = computed(() => {
        return props.entityType === 'circle' && props.entity.referenceID !== null;
    });

    // Check if this is an animation copy
    const isAnimationCopy = computed(() => {
        return props.entity.isAnimationCopy === true;
    });

    // Check if this circle should be dimmed during animation
    const isAnimationDimmed = computed(() => {
        return props.entityType === 'circle' && 
               !isAnimationCopy.value && 
               props.entity._isAnimationDimmed === true;
    });

    // Check if entity has emoji using service (for squares)
    const hasEmoji = computed(() => {
        if (props.entityType === 'square') {
            return EmojiService.hasEmoji(props.entity);
        }
        return false;
    });

    // Check if square is bold
    const isBold = computed(() => {
        return props.entityType === 'square' && props.entity.bold === true;
    });

    // Check if square has indicator emoji
    const hasIndicatorEmoji = computed(() => {
        return props.entityType === 'square' && props.entity.indicatorEmoji;
    });

    // Get circle energy types (for circles only)
    const circleEnergyTypes = computed(() => {
        if (props.entityType === 'circle') {
            return props.entity.energyTypes || [];
        }
        return [];
    });

    // Get indicator emoji class for border styling
    const getIndicatorClass = computed(() => {
        if (props.entityType !== 'square' || !props.entity.indicatorEmoji) {
            return null;
        }

        const indicatorMap = {
            '⚠️': 'indicator-alert',
            '✅': 'indicator-done',
            '⭐': 'indicator-star',
            '🚨': 'indicator-issue',
            '▶️': 'indicator-next',
            '🏁': 'indicator-finish'
        };

        return indicatorMap[props.entity.indicatorEmoji] || null;
    });

    // Computed position styles with center-relative positioning for circles
    const positionStyles = computed(() => {
        if (props.entityType === 'circle' && props.viewerWidth) {
            // For circles: position relative to center of viewer
            const centerX = props.viewerWidth / 2;
            const calculatedLeft = centerX + props.entity.x;
            
            return {
                left: calculatedLeft + 'px',
                top: props.entity.y + 'px'
            };
        } else {
            // For squares: use position as-is
            return {
                left: props.entity.x + 'px',
                top: props.entity.y + 'px'
            };
        }
    });

    // Square count for circles (for rendering)
    const squareCount = computed(() => {
        if (props.entityType !== 'circle') return 0;
        
        const squareDocuments = dataStore.getSquareDocumentsForCircle(props.entity.id);
        let totalSquares = 0;
        squareDocuments.forEach(doc => {
            const squares = dataStore.getSquaresForDocument(doc.id);
            totalSquares += squares.length;
        });
        return Math.min(totalSquares, 6); // Cap at 6 for performance
    });

    // Determine the correct viewerId for circles
    const actualViewerId = computed(() => {
        if (props.entityType === 'circle') {
            // For circles, try multiple methods to get the correct viewer ID
            
            // Method 1: Use explicit viewerId prop (most reliable)
            if (props.viewerId) {
                return props.viewerId;
            }
            
            // Method 2: Use selected viewer from dataStore
            if (dataStore.data?.selectedViewerId) {
                return dataStore.data.selectedViewerId;
            }
            
            // Method 3: Try to find which viewer contains this circle
            if (dataStore.getCirclesForViewer) {
                // Check common viewer IDs
                const commonViewerIds = ['viewer_1', 'viewer_2', 'viewer_3', 'viewer_4'];
                
                for (const viewerId of commonViewerIds) {
                    try {
                        const circlesInViewer = dataStore.getCirclesForViewer(viewerId);
                        if (circlesInViewer.some(c => c.id === props.entity.id)) {
                            return viewerId;
                        }
                    } catch (error) {
                        // Skip this viewer if there's an error
                        continue;
                    }
                }
            }
            
            console.warn(`⚠️ EntityComponent: Could not determine viewerId for circle ${props.entity.id}, using fallback`);
            return 'viewer_1'; // Fallback
        }
        
        // For squares, viewerId is not needed
        return null;
    });

    // Create enhanced props with the correct viewerId
    const enhancedProps = computed(() => {
        const base = { ...props };
        
        if (props.entityType === 'circle') {
            base.viewerId = actualViewerId.value;
        }
        
        return base;
    });

    // Watch for animation copy position changes
    watch(() => props.entity, (newEntity, oldEntity) => {
        if (newEntity.isAnimationCopy) {
            console.log(`[EntityComponent] Animation copy ${newEntity.id} position changed:`, {
                x: newEntity.x,
                y: newEntity.y,
                oldX: oldEntity?.x,
                oldY: oldEntity?.y
            });
        }
    }, { deep: true });

    return {
        elementRef,
        shapeRef,
        nameRef,
        isReferencedCircle,
        isAnimationCopy,
        isAnimationDimmed,
        hasEmoji,
        isBold,
        hasIndicatorEmoji,
        circleEnergyTypes,
        getIndicatorClass,
        positionStyles,
        squareCount,
        actualViewerId,
        enhancedProps
    };
};
