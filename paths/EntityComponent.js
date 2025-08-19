// EntityComponent.js - FIXED: Properly pass viewerId to EntityDragHandler
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';
import { CircleTypeRenderer } from './CircleTypeRenderer.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { EntityDragHandler } from './EntityDragHandler.js';
import { EntityNameEditor } from './EntityNameEditor.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiService } from './emojiService.js';
import { EntityStyleCalculator } from './EntityStyleCalculator.js';
import { EnergyIndicators } from './EnergyIndicators.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';

// Component styles - updated to support bold squares and indicator emojis
const componentStyles = `
    .entity-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: move;
        user-select: none;
    }

    .entity-shape {
        width: 32px;
        height: 32px;
        margin-bottom: 5px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        position: relative;
    }

    .circle-shape {
        border-radius: 50%;
        border: 3px solid #45a049;
    }

    .square-shape {
        background-color: #FF6B6B;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        position: relative;
        border-radius: 6px;
        width: 41px;
        height: 41px;
        transition: filter 0.2s ease;
        border: 2px solid transparent;
    }

    .square-shape.has-emoji {
        background-color: var(--square-color, #FF6B6B);
    }

    /* Indicator emoji border colors */
    .square-shape.indicator-alert {
        border-color: #ffeb3b !important;
    }

    .square-shape.indicator-done {
        border-color: #4caf50 !important;
	border-width: 3px;
    }

    .square-shape.indicator-star {
        border-color: #4caf50 !important;
    }

    .square-shape.indicator-issue {
        border-color: #f44336 !important;
    }

    .square-shape.indicator-next {
        border-color: #ffffff !important;
    }

    .square-shape.indicator-finish {
        border-color: #ffffff !important;
    }

    /* Indicator emoji display */
    .square-indicator-emoji {
        position: absolute;
        top: -16px;
        right: -16px;
        font-size: 22px;
        z-index: 10;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Bold square styling */
    .square-shape.bold {
        filter: brightness(1.25);
    }

    /* Legacy selection styles - kept for backward compatibility but will be phased out */
    .entity-shape.selected {
        border-color: #ffff00;
        box-shadow: 0 0 10px #ffff00;
    }

    .entity-shape.square-shape.selected {
        border: 2px solid #ffff00;
    }

    .entity-shape.highlight {
        animation: highlight 1s ease-in-out;
    }

    @keyframes highlight {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    /* Multi-color circle styles */
    .circle-shape.multi-color {
        background: conic-gradient(var(--color-gradient));
    }

    .circle-shape.single-color {
        background-color: var(--primary-color);
    }

    .entity-name {
        color: white;
        font-size: 14px;
        text-align: center;
        width: 120px;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: text;
        transition: background-color 0.2s ease;
        position: absolute;
        top: 85%;
        background-color: rgba(0, 0, 0, .1);
    }

    .square-name {
        word-wrap: break-word;
        overflow-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Bold square name styling */
    .square-name.bold {
        font-weight: bold;
    }

    .entity-name[contenteditable="true"] {
        background-color: #333;
        outline: 1px solid #666;
    }

    .dragging {
        z-index: 999;
        transform: scale(1.05);
        /* FIXED: Only disable position transitions, keep transform transitions for proximity effects */
        transition: left 0s, top 0s, transform 0.15s ease-out;
    }
`;

injectComponentStyles('entity-component', componentStyles);

export const EntityComponent = {
    props: {
        entity: Object,
        entityType: String,
        isSelected: Boolean,
        viewerWidth: Number,
        viewerId: String // FIXED: Make sure viewerId prop is properly defined
    },
    components: {
        EmojiRenderer,
        EnergyIndicators
    },
    emits: ['select', 'update-position', 'update-name', 'move-multiple'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const elementRef = ref(null);
        const shapeRef = ref(null);
        const nameRef = ref(null);
        const proximitySystem = useEnergyProximitySystem();

        // Use separated concerns modules
        const styleCalculator = new EntityStyleCalculator(props);
        const nameEditor = new EntityNameEditor(nameRef, emit);

        // FIXED: Create a drag move handler for proximity system updates
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
                
                // CRITICAL FIX: Force immediate proximity system update
                proximitySystem.forceUpdate();
            }
        };

        // FIXED: Create a drag end handler for proximity system cleanup
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

        // FIXED: Determine the correct viewerId for circles
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
                
                console.warn(`❌ EntityComponent: Could not determine viewerId for circle ${props.entity.id}, using fallback`);
                return 'viewer_1'; // Fallback
            }
            
            // For squares, viewerId is not needed
            return null;
        });

        // FIXED: Create enhanced props with the correct viewerId
        const enhancedProps = computed(() => {
            const base = { ...props };
            
            if (props.entityType === 'circle') {
                base.viewerId = actualViewerId.value;
            }
            
            return base;
        });

        // FIXED: Create drag handler with proper callbacks and enhanced props
        const dragHandler = new EntityDragHandler(
            elementRef, 
            emit, 
            dataStore, 
            enhancedProps.value, // Use the enhanced props with correct viewerId
            {
                onDragMove: handleProximityDragMove,
                onDragEnd: handleProximityDragEnd
            }
        );

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
                'Ã¢Ââ€"': 'indicator-alert',
                'Ã¢Å"â€Ã¯Â¸Â': 'indicator-done',
                'Ã¢Â­Â': 'indicator-star',
                'Ã°Å¸Ëœâ€"': 'indicator-issue',
                'Ã¢â€"Â¶Ã¯Â¸Â': 'indicator-next',
                'Ã°Å¸ÂÂ': 'indicator-finish'
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

        // Computed styles using the style calculator
        const circleStyles = computed(() => styleCalculator.getCircleStyles());
        const squareStyles = computed(() => styleCalculator.getSquareStyles());
        const shapeClasses = computed(() => {
            const classes = styleCalculator.getShapeClasses(props.isSelected);
            
            // Add bold class for bold squares
            if (isBold.value) {
                classes.push('bold');
            }
            
            // Add indicator class for squares with indicator emojis
            if (getIndicatorClass.value) {
                classes.push(getIndicatorClass.value);
            }
            
            return classes;
        });

        // Computed name classes for bold styling
        const nameClasses = computed(() => {
            const classes = ['entity-name', `${props.entityType}-name`];
            
            // Add bold class for bold squares
            if (isBold.value) {
                classes.push('bold');
            }
            
            return classes;
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

        // Register/update circle with proximity system
        const updateProximityRegistration = () => {
            if (props.entityType === 'circle' && shapeRef.value && props.viewerWidth) {
                proximitySystem.updateCircle(
                    props.entity.id,
                    props.entity,
                    shapeRef.value,
                    props.viewerWidth
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
        props.entity.activation, // FIXED: Watch for activation changes!
        squareCount.value,
        props.isSelected
    ],
    (newValues, oldValues) => {
        if (props.entityType === 'circle' && shapeRef.value) {
            const hasActualChanges = newValues.some((val, index) => 
                JSON.stringify(val) !== JSON.stringify(oldValues?.[index])
            );
            
            if (hasActualChanges) {
                nextTick(() => {
                    CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, squareCount.value);
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

        // Watch for selection changes - now handled centrally by SelectionRenderer
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

        // Initialize selection and rendering on mount
        const initializeEntityDisplay = () => {
            if (!shapeRef.value) return;
            
            if (props.entityType === 'circle') {
                // Render circle type first
                CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, squareCount.value);
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

        onMounted(() => {
            nextTick(() => {
                initializeEntityDisplay();
                
                // Start proximity system if not already started
                if (props.entityType === 'circle') {
                    proximitySystem.start();
                }
            });
        });

        onUnmounted(() => {
            // Cleanup
            if (shapeRef.value) {
                SelectionRenderer.removeSelectionIndicator(shapeRef.value);
            }
            
            // Unregister from proximity system
            if (props.entityType === 'circle') {
                proximitySystem.unregisterCircle(props.entity.id);
            }
        });

        // Cleanup function for when component is unmounted
        const cleanup = () => {
            if (shapeRef.value) {
                SelectionRenderer.removeSelectionIndicator(shapeRef.value);
            }
            
            // Unregister from proximity system
            if (props.entityType === 'circle') {
                proximitySystem.unregisterCircle(props.entity.id);
            }
        };

        return {
            elementRef,
            shapeRef,
            nameRef,
            positionStyles,
            circleStyles,
            squareStyles,
            shapeClasses,
            nameClasses,
            hasEmoji,
            isBold,
            hasIndicatorEmoji,
            circleEnergyTypes,
            // Expose methods from drag handler
            handleClick: dragHandler.handleClick,
            handleMouseDown: dragHandler.handleMouseDown,
            handleNameClick: nameEditor.handleNameClick,
            handleNameKeydown: nameEditor.handleNameKeydown,
            finishNameEdit: nameEditor.finishNameEdit,
            handleBlur: nameEditor.handleBlur,
            // Expose cleanup for potential external use
            cleanup
        };
    },
    template: `
    <div 
        ref="elementRef"
        class="entity-container"
        :style="{ 
            ...positionStyles,
            ...circleStyles,
            ...squareStyles
        }"
        :data-entity-id="entity.id"
        @click="handleClick"
        @mousedown="handleMouseDown"
    >
        <!-- Render shape div for squares and all circle types except triangle and emoji -->
        <div 
            v-if="entityType === 'square' || (entityType === 'circle' && entity.type !== 'triangle' && entity.type !== 'emoji')"
            ref="shapeRef"
            :class="shapeClasses"
        >
            <!-- Use centralized EmojiRenderer for squares -->
            <EmojiRenderer
                v-if="entityType === 'square' && entity.emoji"
                :emoji="entity"
                context="square"
                :interactive="false"
            />
            
            <!-- Indicator emoji for squares -->
            <div 
                v-if="entityType === 'square' && entity.indicatorEmoji"
                class="square-indicator-emoji"
            >
                {{ entity.indicatorEmoji }}
            </div>
        </div>
        <!-- For triangle circles, render a special container -->
        <div 
            v-else-if="entityType === 'circle' && entity.type === 'triangle'"
            ref="shapeRef"
            class="triangle-container"
            :style="{ width: '32px', height: '32px', position: 'relative' }"
        ></div>
        <!-- For emoji circles, render a special container -->
        <div 
            v-else-if="entityType === 'circle' && entity.type === 'emoji'"
            ref="shapeRef"
            class="emoji-circle-container"
            :style="{ width: '32px', height: '32px', position: 'relative' }"
        ></div>
        
        <!-- Energy indicators for circles -->
        <EnergyIndicators 
            v-if="entityType === 'circle'"
            :energyTypes="circleEnergyTypes"
        />
        
        <div 
            ref="nameRef"
            :class="nameClasses"
            @click="handleNameClick"
            @blur="handleBlur"
            @keydown="handleNameKeydown"
        >{{ entity.name }}</div>
    </div>
`
};
