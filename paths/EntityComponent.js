// EntityComponent.js - Main entity component shell with template (UPDATED: Add drag state events)
import { injectComponentStyles } from './styleUtils.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EnergyIndicators } from './EnergyIndicators.js';
import { useEntityState } from './EntityState.js';
import { useEntityRendering } from './EntityRendering.js';
import { useEntityInteractions } from './EntityInteractions.js';

// Component styles - updated to support bold squares, indicator emojis, reference circles, and animation copies
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
        transform: scale(1.05);
        /* Only disable position transitions, keep transform transitions for proximity effects */
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
`;

injectComponentStyles('entity-component', componentStyles);

export const EntityComponent = {
    props: {
        entity: Object,
        entityType: String,
        isSelected: Boolean,
        viewerWidth: Number,
        viewerId: String
    },
    components: {
        EmojiRenderer,
        EnergyIndicators
    },
    emits: ['select', 'update-position', 'update-name', 'move-multiple', 'drag-start', 'drag-move', 'drag-end'],
    setup(props, { emit }) {
        // Use state management composable
        const state = useEntityState(props);
        
        // Use rendering composable
        const rendering = useEntityRendering(props, state);
        
        // Use interactions composable
        const interactions = useEntityInteractions(props, emit, state);

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
            ...squareStyles
        }"
        :class="{
            'animation-copy': isAnimationCopy,
            'animation-dimmed': isAnimationDimmed
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
        <!--EnergyIndicators 
            v-if="entityType === 'circle'"
            :energyTypes="circleEnergyTypes"
        /-->
        
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
