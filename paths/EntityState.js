// EntityState.js - Entity component state management and computed properties (Updated with collapsed group support)
import { ref, computed, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { EmojiService } from './emojiService.js';
import { useRoilState } from './EntityState-RoilExtension.js';
import { calculateGroupShapeScale } from './groupScaleCalculator.js';

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

    // NEW: Check if this is a document reference circle
    const isDocumentReferenceCircle = computed(() => {
        return props.entityType === 'circle' && props.entity.documentReferenceID !== null;
    });

    const documentShinyCircles = computed(() => {
        if (!isDocumentReferenceCircle.value) {
            return [];
        }

        const docId = props.entity.documentReferenceID;
        return dataStore.getShinyCirclesForDocument(docId);
    });

    const groupMemberScale = computed(() => {
	    //return 1;
    if (props.entityType === 'circle' && props.entity.belongsToID) {
        // Get all circles belonging to the same group
        const groupCircles = dataStore.getCirclesBelongingToGroup(props.entity.belongsToID);
        const groupSize = groupCircles.length;
        
        // Calculate scale using sqrt for diminishing returns
        const baseScale = 0.9;
        const scaleFactor = Math.sqrt(groupSize) * 0.1; // Adjust 0.1 to control how much smaller circles get
        const scale = Math.max(0.6, baseScale - scaleFactor); // Min scale of 0.6 (60%)
        
        return scale;
    }
    return 1; // No scaling for non-group members or non-circles
});

const groupShapeScale = computed(() => {
    if (props.entityType === 'circle' && props.entity.type === 'group') {
        return calculateGroupShapeScale(props.entity, dataStore);
    }
    return 1;
});

    // NEW: Updated computed property for belonging circles count - returns 0 when collapsed
    const belongingCirclesCount = computed(() => {
        if (props.entityType === 'circle' && props.entity.type === 'group') {
            // If collapsed, return 0 to trigger normal size rendering
            if (props.entity.collapsed) {
                return 0;
            }
            
            // This computed will reactively update when any circle's belongsToID changes
            return dataStore.getCirclesBelongingToGroup(props.entity.id).length;
        }
        return 0;
    });

    // NEW: Check if this circle should be hidden (member of collapsed group)
    const isHiddenGroupMember = computed(() => {
        if (props.entityType === 'circle' && props.entity.belongsToID) {
            const parentGroup = dataStore.getCircle(props.entity.belongsToID);
            return parentGroup && parentGroup.collapsed === true;
        }
        return false;
    });

    // NEW: Get member count for collapsed groups
    const collapsedMemberCount = computed(() => {
        if (props.entityType === 'circle' && props.entity.type === 'group' && props.entity.collapsed) {
            return dataStore.getCirclesBelongingToGroup(props.entity.id).length;
        }
        return 0;
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

    const isImmovable = computed(() => {
        return props.entity.immovable === 'yes';
    });

    const isHandle = computed(() => {
        return props.entity.handle === 'yes';
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
    if (roilState.isRoilMember.value) {
        return {};
    }
    if (props.entityType === 'circle' && props.viewerWidth) {
        const centerX = props.viewerWidth / 2;
        const calculatedLeft = centerX + props.entity.x;
        
        // Apply drag offset if this entity is being dragged
        const finalLeft = props.isDragging ? calculatedLeft + props.dragDeltas.deltaX : calculatedLeft;
        const finalTop = props.isDragging ? props.entity.y + props.dragDeltas.deltaY : props.entity.y;
        
        return {
            left: finalLeft + 'px',
            top: finalTop + 'px'
        };
    } else {
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

    // NEW: Add roil state
    const roilState = useRoilState(props, dataStore);

    return {
        elementRef,
        shapeRef,
        nameRef,
        isReferencedCircle,
        isDocumentReferenceCircle, // NEW
        isAnimationCopy,
        isAnimationDimmed,
        hasEmoji,
        isBold,
        isImmovable,
        isHandle,
        hasIndicatorEmoji,
        circleEnergyTypes,
        getIndicatorClass,
        positionStyles,
        squareCount,
        actualViewerId,
        enhancedProps,
        belongingCirclesCount,
        groupMemberScale,
        groupShapeScale,
        // NEW: Collapsed group properties
        isHiddenGroupMember,
        collapsedMemberCount,
        documentShinyCircles,
        // NEW: Roil properties
        ...roilState,
        dataStore, // Pass dataStore for roil motion to access
    };
};
