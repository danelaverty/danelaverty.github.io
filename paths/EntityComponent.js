// EntityComponent.js - Main entity component shell with template (UPDATED: Add group shape scaling and collapsed group member count display)
import { computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EnergyIndicators } from './EnergyIndicators.js';
import { EnergyReceivedIndicator } from './EnergyReceivedIndicator.js';
import { useEntityState } from './EntityState.js';
import { useEntityRendering } from './EntityRendering.js';
import { useEntityInteractions } from './EntityInteractions.js';

// Component styles - updated to support bold squares, indicator emojis, reference circles, animation copies, group shape scaling, and collapsed group member count
const componentStyles = `
    .entity-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: url(black-dot.png), auto;
        user-select: none;
        transition: transform 0.3s ease;
        transform-origin: center center;
        transform: translate(-50%, -50%);
    }

    .entity-container.group-member {
        z-index: 10;
    }

    .entity-shape {
        width: 32px;
        height: 32px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, width 0.3s ease, height 0.3s ease;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
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
        top: 95%;
        background-color: rgba(0, 0, 0, .05);
        z-index: 10;
        text-shadow: 1px 1px 1px black;
    }

    .circle-type-group ~ .entity-name {
        top: -20px;
        font-size: 12px;
        color: #CCC;
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

    /* Reference circle name styling - italic and yellow, non-editable */
    .circle-name.referenced {
        font-style: italic;
        color: #ffff00;
        cursor: default;
        pointer-events: none;
    }

    /* Animation copy name styling - semi-transparent, non-editable */
    .entity-name.animation-copy {
        opacity: 0.7;
        cursor: default;
        pointer-events: none;
        color: #aaaaaa;
    }

    .entity-name[contenteditable="true"] {
        background-color: #333;
        outline: 1px solid #666;
    }

    .dragging {
        z-index: 999;
        transform: translate(-50%, -50%) scale(1.05);
        transition: left 0s, top 0s, transform 0.15s ease-out;
    }

    /* Animation copy container styling */
    .entity-container.animation-copy {
        opacity: 0.8;
        pointer-events: none;
        z-index: 998; /* Below normal entities but above connections */
    }

    /* Animation dimmed styling for original attractees */
    .entity-container.animation-dimmed {
        opacity: 0.2;
    }

    /* NEW: Collapsed group member count overlay */
    .collapsed-member-count {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 14px;
        font-weight: bold;
        color: #AAA;
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
        pointer-events: none;
        z-index: 20;
        user-select: none;
        background-color: rgba(0, 0, 0, 0.3);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .entity-container:hover .collapsed-member-count {
        background-color: rgba(0, 0, 0, 0.5);
        transform: translate(-50%, -50%) scale(1.1);
    }
`;

injectComponentStyles('entity-component', componentStyles);

export const EntityComponent = {
    props: {
        entity: Object,
        entityType: String,
        isSelected: Boolean,
        viewerWidth: Number,
        viewerId: String,
        dataStore: Object
    },
    components: {
        EmojiRenderer,
        EnergyIndicators,
        EnergyReceivedIndicator
    },
    emits: ['select', 'update-position', 'update-name', 'move-multiple', 'drag-start', 'drag-move', 'drag-end'],
    setup(props, { emit }) {
        // Use state management composable
        const state = useEntityState(props);
        
        // Use rendering composable
        const rendering = useEntityRendering(props, state);
        
        // Use interactions composable
        const interactions = useEntityInteractions(props, emit, state);

        // Computed style for shape scaling (group circles only)
        const shapeScaleStyles = computed(() => {
            if (state.groupShapeScale.value !== 1) {
                //const scale = state.groupShapeScale.value;
                const scale = 1;
                const scaledSize = Math.round(32 * scale);
                return {
                    width: `${scaledSize}px`,
                    height: `${scaledSize}px`,
                };
            }
            return {};
        });

        // NEW: Check if this is a collapsed group with members
        const shouldShowMemberCount = computed(() => {
            return props.entityType === 'circle' && 
                   props.entity.type === 'group' && 
                   props.entity.collapsed === true &&
                   state.collapsedMemberCount.value > 0;
        });

        // Cleanup function for external use
        const cleanup = () => {
            rendering.cleanupRendering();
        };

        return {
            // State
            ...state,
            // Rendering
            ...rendering,
            // Interactions
            ...interactions,
            // Shape scaling
            shapeScaleStyles,
            // NEW: Collapsed group member count
            shouldShowMemberCount,
            // Cleanup
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
            ...squareStyles,
            transform: groupMemberScale !== 1 ? 'translate(-50%, -50%) scale(' + groupMemberScale + ')' : undefined
        }"
        :class="{
            'animation-copy': isAnimationCopy,
            'animation-dimmed': isAnimationDimmed,
            'group-member': groupMemberScale !== 1
        }"
        :data-entity-id="entity.id"
        @click="handleClick"
        @mousedown="handleMouseDown"
        @drag-start="(event) => $emit('drag-start', event)"
        @drag-move="(event) => $emit('drag-move', event)"
        @drag-end="(event) => $emit('drag-end', event)"
    >
        <!-- Render shape div for squares and all circle types except triangle and emoji -->
        <div 
            v-if="entityType === 'square' || (entityType === 'circle' && entity.type !== 'triangle' && entity.type !== 'emoji')"
            ref="shapeRef"
            :class="shapeClasses"
            :style="shapeScaleStyles"
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

            <!-- NEW: Member count display for collapsed groups -->
            <div 
                v-if="shouldShowMemberCount"
                class="collapsed-member-count"
            >
                {{ collapsedMemberCount }}
            </div>
        </div>
        <!-- For triangle circles, render a special container with scaling -->
        <div 
            v-else-if="entityType === 'circle' && entity.type === 'triangle'"
            ref="shapeRef"
            class="triangle-container"
            :style="{ 
                ...shapeScaleStyles,
                position: 'relative' 
            }"
        ></div>
        <!-- For emoji circles, render a special container with scaling -->
        <div 
            v-else-if="entityType === 'circle' && entity.type === 'emoji'"
            ref="shapeRef"
            class="emoji-circle-container"
            :style="{ 
                ...shapeScaleStyles,
                position: 'relative' 
            }"
        ></div>
        
        <!-- Energy indicators for circles -->
        
        <div 
            ref="nameRef"
            :class="nameClasses"
            @click="handleNameClick"
            @blur="handleBlur"
            @keydown="handleNameKeydown"
        >
        {{ entity.name }}
        <!--EnergyIndicators 
            v-if="entityType === 'circle'"
            :energyTypes="circleEnergyTypes"
        />
<EnergyReceivedIndicator 
    v-if="entityType === 'circle'"
    :entity="entity"
    :entityType="entityType"
    :viewerId="viewerId"
    :dataStore="dataStore"
/-->
        </div>
    </div>
`
};
