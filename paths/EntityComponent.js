// EntityComponent.js - Main entity component shell with template (UPDATED: Add group shape scaling and collapsed group member count display)
import { computed, ref, watch, onUnmounted } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EnergyIndicators } from './EnergyIndicators.js';
import { useEntityState } from './EntityState.js';
import { useEntityRendering } from './EntityRendering.js';
import { useEntityInteractions } from './EntityInteractions.js';
import { ConnectionManager } from './ConnectionManager.js';
import { GroupResizeHandles } from './GroupResizeHandles.js';
import { lighten } from './colorUtils.js';

const connectionManager = new ConnectionManager();

// Component styles - updated to support bold squares, indicator emojis, reference circles, animation copies, group shape scaling, and collapsed group member count
const componentStyles = `
    .entity-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: url(black-dot.png), auto;
        cursor: auto;
        user-select: none;
        transition: transform 0.3s ease;
        transform-origin: center center;
        transform: translate(-50%, -50%);
        z-index: 10;
    }

    .entity-container.entity-container-group {
        z-index: 9;
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

    .entity-shape.circle-shape {
        border-radius: 50%;
        transition: transform 1.0s cubic-bezier(0.2,-2,0.8,2), opacity 1.0s cubic-bezier(0.2,-2,0.8,2), filter 1.0s cubic-bezier(0.2,-2,0.8,2);
    }

    .entity-container, .circle-type-glow {
        mix-blend-mode: color-dodge;
    }

/* Partially excited animation - buzzes every 1 second */
.entity-shape.partially-excited .circle-glow-container {
    animation: buzz 3s linear infinite;
}

@keyframes buzz {
    0%, 80% {
        transform: translate(0, 0);
    }
    82% {
        transform: translate(-2px, -2px);
    }
    84% {
        transform: translate(2px, 2px);
    }
    86% {
        transform: translate(-2px, 2px);
    }
    88% {
        transform: translate(2px, -2px);
    }
    90% {
        transform: translate(-2px, 2px);
    }
    92% {
        transform: translate(2px, -2px);
    }
    94% {
        transform: translate(-2px, -2px);
    }
    96% {
        transform: translate(2px, 2px);
    }
    99%, 100% {
        transform: translate(0, 0);
    }
}

    .emoji-circle-container {
        transition: transform 1.0s cubic-bezier(0.2,-2,0.8,2), opacity 1.0s cubic-bezier(0.2,-2,0.8,2), filter 1.0s cubic-bezier(0.2,-2,0.8,2);
    }

    .the-emoji-itself {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        pointer-events: none;
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
        color: #FFF;
        font-size: 12px;
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
        transition: transform 1s ease, opacity 1s ease, filter 1s ease;
    }

    .entity-container-emoji .entity-name {
        color: #CCC;
        font-size: 11px;
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

 .connection-radius-indicator {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: -1;
        background: rgba(255, 255, 255, 0.05);
        transition: none;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .connection-radius-indicator.bold {
        background: rgba(255, 255, 100, 0.08) !important;
    }

    .connection-radius-indicator.circle-indicator {
        background: rgba(76, 175, 80, 0.06) !important;
    }

    .connection-radius-indicator.fade-in {
        animation: radiusIndicatorFadeIn 0.2s ease;
    }

    @keyframes radiusIndicatorFadeIn {
        from { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.8);
        }
        to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
        }
    }

    .entity-shape.group-drop-zone-active {
    box-shadow: 0 0 20px rgba(76, 175, 80, 1), inset 0 0 20px rgba(76, 175, 80, 1);
}

.app-demo-mode .entity-shape.circle-shape {
        box-shadow: none !important;
    }
    
    .app-demo-mode .square-shape {
        outline: none !important;
        box-shadow: none !important;
    }


.beacon-container {
position: absolute;
bottom: 0;
}

.beacon-light {
    position: absolute;
    bottom: 50%;
    left: 50%;
    width: 2px;
    height: 90px;
    /* Color and animation applied dynamically via inline styles */
    transform: translateX(-50%);
}

    @keyframes beaconDrift1 {
        0%, 100% {
            transform: translateX(-50%);
            opacity: 0.3;
        }
        25% {
            opacity: 0;
        }
        50% {
            transform: translateX(calc(-50% - 1px));
            opacity: 0.1;
        }
        75% {
            opacity: 0.4;
        }
    }

    @keyframes beaconDrift2 {
        0%, 100% {
            transform: translateX(-50%);
            opacity: 0.2;
        }
        30% {
            opacity: 0.3;
        }
        50% {
            transform: translateX(calc(-50% + 1px));
            opacity: 0.5;
        }
        80% {
            opacity: 0.3;
        }
    }

    @keyframes beaconDrift3 {
        0%, 100% {
            transform: translateX(-50%);
            opacity: 0.4;
        }
        20% {
            opacity: 0.2;
        }
        50% {
            transform: translateX(calc(-50% + 5px));
            opacity: 0;
        }
        70% {
            opacity: 0.5;
        }
    }

.beacon-glow {
    position: absolute;
    bottom: 0%;
    left: 50%;
    transform: translate(-50%, -20%);
    width: 25px;
    height: 25px;
    filter: blur(10px);
    /* Color and animation applied dynamically via inline styles */
}

    @keyframes baseGlowPulse {
        0%, 100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }

    @keyframes baseGlowExpand {
        0%, 100% {
            filter: blur(10px);
        }
        50% {
            filter: blur(15px);
        }
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
        dataStore: Object,
        shinynessEffects: {
            type: Object,
            default: () => ({ scale: 1.0, opacity: 1.0, saturation: 1.0 })
        },
        energyDistance: {
            type: Object,
            default: () => ({})
        },
        energizedConnections: {
            type: Object,
            default: () => ({})
        },
        isDragging: {
            type: Boolean,
            default: false
        },
        dragDeltas: {
            type: Object,
            default: () => ({ deltaX: 0, deltaY: 0 })
        },
        isPartiallyExcited: {
            type: Boolean,
            default: false
        },
        demoMode: {
            type: Boolean,
            default: false
        },
        isDrone: {
            type: Boolean,
            default: false
        },
    },
    components: {
        EmojiRenderer,
        EnergyIndicators,
        GroupResizeHandles,
    },
    emits: ['select', 'update-position', 'update-name', 'update-circle', 'move-multiple', 'drag-start', 'drag-move', 'drag-end'],
    setup(props, { emit }) {
        // Use state management composable
        const state = useEntityState(props);

        // Use rendering composable
        const rendering = useEntityRendering(props, state);
        
        // Use interactions composable
        const interactions = useEntityInteractions(props, emit, state);

        const shapeRef = rendering.shapeRef;

// NEW: Beacon color cycling for document reference circles
const beaconKeyframeId = ref(null);

// Generate beacon colors from shinyCircles
const beaconColors = computed(() => {
    const shinyCircles = state.documentShinyCircles.value;
    
    if (shinyCircles.length === 0) {
        return []; // No colors = hide beacons
    }
    
    const colors = shinyCircles.map(circle => circle.color);
    
    // If only one color, add a lighter version for cycling effect
    if (colors.length === 1) {
        colors.push(lighten(colors[0], 40)); // Lighten by 40%
    }
    
    return colors;
});

// Show beacons only if we have colors
const shouldShowBeacons = computed(() => {
    return props.entity.documentReferenceID && beaconColors.value.length > 0;
});

// Generate unique keyframe animations for beacon color cycling with smooth transitions
const generateBeaconKeyframes = (colors, id) => {
    if (colors.length === 0) return;
    
    const keyframeCount = colors.length;
    const stepPercent = 100 / keyframeCount;
    const transitionPercent = stepPercent * 0.3; // Use 30% of each step for transitions
    
    // Generate keyframes for beacon-light gradient with smooth transitions
    let lightKeyframes = `@keyframes beaconColorCycle-light-${id} {\n`;
    colors.forEach((color, index) => {
        const startPercent = (index * stepPercent).toFixed(2);
        const endPercent = ((index + 1) * stepPercent - transitionPercent).toFixed(2);
        const nextColor = colors[(index + 1) % colors.length];
        
        // Hold current color for most of the step
        lightKeyframes += `  ${startPercent}% { background: linear-gradient(to top, transparent 0%, ${color} 50%, transparent 100%); }\n`;
        lightKeyframes += `  ${endPercent}% { background: linear-gradient(to top, transparent 0%, ${color} 50%, transparent 100%); }\n`;
        
        // Transition to next color at the end of the step
        if (index < colors.length - 1 || colors.length > 1) {
            const transitionEndPercent = ((index + 1) * stepPercent).toFixed(2);
            lightKeyframes += `  ${transitionEndPercent}% { background: linear-gradient(to top, transparent 0%, ${nextColor} 50%, transparent 100%); }\n`;
        }
    });
    lightKeyframes += `}\n`;
    
    // Generate keyframes for beacon-glow with smooth transitions
    let glowKeyframes = `@keyframes beaconColorCycle-glow-${id} {\n`;
    colors.forEach((color, index) => {
        const startPercent = (index * stepPercent).toFixed(2);
        const endPercent = ((index + 1) * stepPercent - transitionPercent).toFixed(2);
        const nextColor = colors[(index + 1) % colors.length];
        
        // Hold current color for most of the step
        glowKeyframes += `  ${startPercent}% { background-color: ${color}; }\n`;
        glowKeyframes += `  ${endPercent}% { background-color: ${color}; }\n`;
        
        // Transition to next color at the end of the step
        if (index < colors.length - 1 || colors.length > 1) {
            const transitionEndPercent = ((index + 1) * stepPercent).toFixed(2);
            glowKeyframes += `  ${transitionEndPercent}% { background-color: ${nextColor}; }\n`;
        }
    });
    glowKeyframes += `}\n`;
    
    return lightKeyframes + glowKeyframes;
};

// Inject keyframes into document head
const injectBeaconKeyframes = (colors) => {
    // Remove old keyframes if they exist
    if (beaconKeyframeId.value) {
        const oldStyle = document.getElementById(beaconKeyframeId.value);
        if (oldStyle) {
            oldStyle.remove();
        }
    }
    
    if (colors.length === 0) {
        beaconKeyframeId.value = null;
        return;
    }
    
    // Generate unique ID for this entity's keyframes
    const id = `entity-${props.entity.id}`;
    beaconKeyframeId.value = `beacon-keyframes-${id}`;
    
    // Create and inject style element
    const styleElement = document.createElement('style');
    styleElement.id = beaconKeyframeId.value;
    styleElement.textContent = generateBeaconKeyframes(colors, id);
    document.head.appendChild(styleElement);
};

// Watch for changes in beacon colors and update keyframes
watch(beaconColors, (newColors) => {
    injectBeaconKeyframes(newColors);
}, { immediate: true });

// Cleanup keyframes on unmount
onUnmounted(() => {
    if (beaconKeyframeId.value) {
        const styleElement = document.getElementById(beaconKeyframeId.value);
        if (styleElement) {
            styleElement.remove();
        }
    }
});

// Generate random offsets for this beacon (stable per entity instance)
const beaconRandomOffsets = (() => {
    // Use entity ID as seed for consistent randomness per entity
    const seed = props.entity.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (index) => {
        // Simple seeded random function
        const x = Math.sin(seed + index) * 10000;
        return (x - Math.floor(x));
    };
    
    return {
        drift1: random(1),
        drift2: random(2),
        drift3: random(3),
        pulse: random(4),
        expand: random(5)
    };
})();

// Beacon animation styles
const beaconAnimationStyles = computed(() => {
    if (!shouldShowBeacons.value) return {};
    
    const id = `entity-${props.entity.id}`;
    
    // Apply random offsets (0.0s to 1.0s) to each animation duration
    const drift1Duration = 5 + beaconRandomOffsets.drift1;
    const drift2Duration = 7 + beaconRandomOffsets.drift2;
    const drift3Duration = 6 + beaconRandomOffsets.drift3;
    const pulseDuration = 8 + beaconRandomOffsets.pulse;
    const expandDuration = 8 + beaconRandomOffsets.expand;
    
    return {
        light1: {
            animation: `beaconDrift1 ${drift1Duration}s ease-in-out infinite, beaconColorCycle-light-${id} 7.3s linear infinite`
        },
        light2: {
            animation: `beaconDrift2 ${drift2Duration}s ease-in-out infinite, beaconColorCycle-light-${id} 9.7s linear infinite`
        },
        light3: {
            animation: `beaconDrift3 ${drift3Duration}s ease-in-out infinite, beaconColorCycle-light-${id} 11.9s linear infinite`
        },
        glow: {
            animation: `baseGlowPulse ${pulseDuration}s ease-in-out infinite, baseGlowExpand ${expandDuration}s ease-in-out infinite, beaconColorCycle-glow-${id} 12s linear infinite`
        }
    };
});

        // Computed style for shape scaling (group circles only)
        const shapeScaleStyles = computed(() => {
            if (state.groupShapeScale.value !== 1) {
                const scale = state.groupShapeScale.value;
                //const scale = 1;
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

const showRadiusIndicator = computed(() => { return props.isDragging && (props.dragDeltas.deltaX !== 0 || props.dragDeltas.deltaY !== 0); });

const radiusIndicatorStyles = computed(() => {
    let connectionDistance;
    
    if (props.entityType === 'circle') {
        connectionDistance = props.entity.bold === true 
            ? connectionManager.CIRCLE_BOLD_CONNECTION_DISTANCE 
            : connectionManager.CIRCLE_CONNECTION_DISTANCE;
    } else if (props.entityType === 'square') {
        connectionDistance = props.entity.bold === true 
            ? connectionManager.SQUARE_BOLD_CONNECTION_DISTANCE 
            : connectionManager.SQUARE_CONNECTION_DISTANCE;
    } else {
        connectionDistance = 100; // fallback
    }
    
    const diameter = connectionDistance * 2;
    
    return {
        width: `${diameter}px`,
        height: `${diameter}px`,
    };
});

const radiusIndicatorClasses = computed(() => {
    const classes = ['connection-radius-indicator', 'fade-in'];
    
    if (props.entityType === 'square' && props.entity.bold) {
        classes.push('bold');
    } else if (props.entityType === 'circle') {
        classes.push('circle-indicator');
    }
    
    return classes;
});

        // Cleanup function for external use
        const cleanup = () => {
            rendering.cleanupRendering();
        };

const handleResizeStart = (data) => {
    // Try to get the actual DOM element
    const actualShapeElement = document.querySelector(`[data-entity-id="${props.entity.id}"] .entity-shape`);
    
    // Switch to manual mode if not already
    if (props.entity.sizeMode !== 'manual') {
        const width = actualShapeElement?.offsetWidth || 32;
        const height = actualShapeElement?.offsetHeight || 32;
        
        emit('update-circle', {
            id: props.entity.id,
            sizeMode: 'manual',
            manualWidth: width,
            manualHeight: height
        });
    }
};

const handleResizeMove = (data) => {
    // Emit update immediately for reactive resize
    emit('update-circle', {
        id: props.entity.id,
        manualWidth: data.width,
        manualHeight: data.height
    });
};

const handleResizeEnd = (data) => {
    // Already updated during move, just ensure final state is saved
    emit('update-circle', {
        id: props.entity.id,
        manualWidth: data.width,
        manualHeight: data.height
    });
};

const groupCircleStyles = computed(() => {
    if (props.entityType !== 'circle' || props.entity.type !== 'group') {
        return {};
    }
    
    const baseSize = 32;
    let finalSize = baseSize;
    
    // Priority 1: Manual sizing (user has resized)
    if (props.entity.sizeMode === 'manual' && props.entity.manualWidth && props.entity.manualHeight) {
        finalSize = props.entity.manualWidth; // Assuming width === height for circles
    }
    // Priority 2: Auto-sizing based on member count when expanded
    else if (!props.entity.collapsed && state.belongingCirclesCount?.value > 0) {
        const scale = state.groupShapeScale?.value || 1;
        finalSize = baseSize * scale;
    }
    // Priority 3: Collapsed state uses normal size (finalSize stays at baseSize)
    
    const color = props.entity.colors?.[0] || props.entity.color || '#4CAF50';
    
    return {
        width: `${finalSize}px`,
        height: `${finalSize}px`,
        borderColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`
    };
});

return {
        ...state,
        ...rendering,
        ...interactions,
        shapeScaleStyles,
        shouldShowMemberCount,
        showRadiusIndicator,
        radiusIndicatorStyles,
        radiusIndicatorClasses,
        cleanup,
        handleResizeStart,
        handleResizeMove,
        handleResizeEnd,
        groupCircleStyles,
        shouldShowBeacons,
        beaconAnimationStyles,
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
            'group-member': groupMemberScale !== 1,
            'entity-container-emoji': entity.type === 'emoji',
            'entity-container-group': entity.type === 'group',
        }"
        :data-entity-id="entity.id"
        @click="handleClick"
        @mousedown="handleMouseDown"
        @drag-start="(event) => $emit('drag-start', event)"
        @drag-move="(event) => $emit('drag-move', event)"
        @drag-end="(event) => $emit('drag-end', event)"
    >

        <div 
            v-if="showRadiusIndicator"
            :class="radiusIndicatorClasses"
            :style="radiusIndicatorStyles"
        ></div>
        <!-- Render shape div for squares and all circle types except triangle and emoji -->
        <div 
            v-if="entityType === 'square' || (entityType === 'circle' && entity.type !== 'triangle' && entity.type !== 'emoji')"
            ref="shapeRef"
            :class="shapeClasses"
:style="{
                ...shapeScaleStyles,
                ...(entity.type === 'group' ? groupCircleStyles : {}),
                transform: shinynessEffects.transform || 'scale(1.0)',
                opacity: shinynessEffects.opacity || 1.0,
                filter: shinynessEffects.filter || 'saturate(1.0)'
            }"
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

<!-- Inside the shape div, after member count display -->
<GroupResizeHandles
    v-if="entityType === 'circle' && entity.type === 'group'"
    :circle="entity"
    @resize-start="handleResizeStart"
    @resize-move="handleResizeMove"
    @resize-end="handleResizeEnd"
/>
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
                transform: shinynessEffects.transform || 'scale(1.0)',
                opacity: shinynessEffects.opacity || 1.0,
                filter: shinynessEffects.filter || 'saturate(1.0)',
                position: 'relative' 
            }"
        ></div>
        
<div class="beacon-container" v-if="shouldShowBeacons">
    <div class="beacon-light" :style="beaconAnimationStyles.light1"></div>
    <div class="beacon-light" :style="beaconAnimationStyles.light2"></div>
    <div class="beacon-light" :style="beaconAnimationStyles.light3"></div>
    <div class="beacon-glow" :style="beaconAnimationStyles.glow"></div>
</div>
        <!-- Energy indicators for circles -->
        
        <div 
            ref="nameRef"
            :class="nameClasses"
            @click="handleNameClick"
            @blur="handleBlur"
            @keydown="handleNameKeydown"
:style="{
                transform: shinynessEffects.transform || 'scale(1.0)',
                opacity: shinynessEffects.opacity || 1.0,
                filter: shinynessEffects.filter || 'saturate(1.0)'
            }"
        >
        {{ entity.name }}
        <!--span v-if="Object.keys(energyDistance).length > 0" style="color: #888; font-size: 12px;">
            {{ 'E: ' + energyDistance['exciter'] }}
        </span-->
        <EnergyIndicators 
            v-if="entityType === 'circle' && !demoMode && !isDrone"
            :energyTypes="circleEnergyTypes"
        />
        </div>
    </div>
`
};
