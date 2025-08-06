// EntityComponent.js - Updated to use centralized EmojiRenderer
import { ref, nextTick, onMounted, computed, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';
import { CircleTypeRenderer } from './CircleTypeRenderer.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { EntityDragHandler } from './EntityDragHandler.js';
import { EntityNameEditor } from './EntityNameEditor.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiService } from './emojiService.js';
import { EntityStyleCalculator } from './EntityStyleCalculator.js';

// Simplified component styles - emoji styling now handled by EmojiRenderer
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
    }

    .square-shape.has-emoji {
        background-color: var(--square-color, #FF6B6B);
    }

    /* Legacy selection styles - kept for backward compatibility but will be phased out */
    .entity-shape.selected {
        border-color: #ffff00;
        box-shadow: 0 0 10px #ffff00;
    }

    .entity-shape.square-shape.selected {
        border: 4px solid #ffff00;
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
        min-width: 60px;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: text;
        transition: background-color 0.2s ease;
        position: absolute;
        white-space: nowrap;
        top: 85%;
    }

    .square-name {
        max-width: 120px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .entity-name[contenteditable="true"] {
        background-color: #333;
        outline: 1px solid #666;
    }

    .dragging {
        z-index: 999;
        transform: scale(1.05);
        transition: none;
    }
`;

injectComponentStyles('entity-component', componentStyles);

export const EntityComponent = {
    props: {
        entity: Object,
        entityType: String,
        isSelected: Boolean,
        viewerWidth: Number
    },
    components: {
        EmojiRenderer // Use the centralized emoji renderer
    },
    emits: ['select', 'update-position', 'update-name', 'move-multiple'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const elementRef = ref(null);
        const shapeRef = ref(null);
        const nameRef = ref(null);

        // Use separated concerns modules
        const styleCalculator = new EntityStyleCalculator(props);
        const nameEditor = new EntityNameEditor(nameRef, emit);
        const dragHandler = new EntityDragHandler(elementRef, emit, dataStore, props);

        // Check if entity has emoji using service
        const hasEmoji = computed(() => EmojiService.hasEmoji(props.entity));

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
        const shapeClasses = computed(() => styleCalculator.getShapeClasses(props.isSelected));

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

        // Watch for changes that should trigger re-rendering
        watch(
            () => [
                props.entity.type, 
                props.entity.color, 
                props.entity.colors, 
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
                        });
                    }
                }
            },
            { deep: true }
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
            });
        });

        // Cleanup function for when component is unmounted
        const cleanup = () => {
            if (shapeRef.value) {
                SelectionRenderer.removeSelectionIndicator(shapeRef.value);
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
            hasEmoji,
            // Expose methods from separated modules
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
        <!-- Render shape div for squares and all circle types except triangle -->
        <div 
            v-if="entityType === 'square' || (entityType === 'circle' && entity.type !== 'triangle')"
            ref="shapeRef"
            :class="shapeClasses"
        >
            <!-- UPDATED: Use centralized EmojiRenderer for squares -->
            <EmojiRenderer
                v-if="entityType === 'square' && entity.emoji"
                :emoji="entity"
                context="square"
                :interactive="false"
            />
        </div>
        <!-- For triangle circles, render a special container -->
        <div 
            v-else-if="entityType === 'circle' && entity.type === 'triangle'"
            ref="shapeRef"
            class="triangle-container"
            :style="{ width: '32px', height: '32px', position: 'relative' }"
        ></div>
        <div 
            ref="nameRef"
            :class="['entity-name', entityType + '-name']"
            @click="handleNameClick"
            @blur="handleBlur"
            @keydown="handleNameKeydown"
        >{{ entity.name }}</div>
    </div>
`
};
