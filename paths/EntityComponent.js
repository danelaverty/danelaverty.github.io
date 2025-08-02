// EntityComponent.js - Refactored with separated concerns
import { ref, nextTick, onMounted, computed, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js'; // Updated import
import { injectComponentStyles } from './styleUtils.js';
import { CircleTypeRenderer } from './CircleTypeRenderer.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { EntityDragHandler } from './EntityDragHandler.js';
import { EntityNameEditor } from './EntityNameEditor.js';
import { EntityStyleCalculator } from './EntityStyleCalculator.js';

// Inject component styles (styles remain the same)
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
        //border: 3px solid #FF5252;
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
        //border-color: var(--square-border-color, #FF5252);
    }

    .square-emoji {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 30px;
        filter: var(--emoji-filter, none);
		text-shadow: 0px 0px 2px black, 0px 0px 2px black, 0px 0px 1px black;
    }

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
        viewerWidth: Number // NEW: Add viewerWidth prop
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

        // NEW: Computed position styles with center-relative positioning for circles
        const positionStyles = computed(() => {
            if (props.entityType === 'circle' && props.viewerWidth) {
                // For circles: position relative to center of viewer
                const centerX = props.viewerWidth / 2;
                const calculatedLeft = centerX + props.entity.x;
                console.log(`Circle ${props.entity.id}: viewerWidth=${props.viewerWidth}, centerX=${centerX}, entity.x=${props.entity.x}, calculatedLeft=${calculatedLeft}`);
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
                    console.log(`Circle ${props.entity.id} watcher triggered. squareCount: ${squareCount.value}`);
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

        // Watch for selection changes
        watch(
            () => props.isSelected,
            (newSelected, oldSelected) => {
                if (shapeRef.value && newSelected !== oldSelected) {
                    nextTick(() => {
                        SelectionRenderer.updateSelection(shapeRef.value, newSelected, props.entityType);
                    });
                }
            }
        );

        // Render circle type and selection on mount
        const renderCircleTypeAndSelection = () => {
            if (props.entityType === 'circle' && shapeRef.value) {
                CircleTypeRenderer.render(shapeRef.value, props.entity, props.isSelected, squareCount.value);
            }
        };

        onMounted(() => {
            renderCircleTypeAndSelection();
        });

        return {
            elementRef,
            shapeRef,
            nameRef,
            positionStyles, // NEW: Expose positionStyles
            circleStyles,
            squareStyles,
            shapeClasses,
            // Expose methods from separated modules
            handleClick: dragHandler.handleClick,
            handleMouseDown: dragHandler.handleMouseDown,
            handleNameClick: nameEditor.handleNameClick,
            handleNameKeydown: nameEditor.handleNameKeydown,
            finishNameEdit: nameEditor.finishNameEdit
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
            <!-- Display emoji for squares if present -->
            <div 
                v-if="entityType === 'square' && entity.emoji"
                class="square-emoji"
            >{{ entity.emoji }}</div>
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
            @blur="finishNameEdit"
            @keydown="handleNameKeydown"
        >{{ entity.name }}</div>
    </div>
`
};
