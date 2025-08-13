// ConnectionComponent.js - FIXED: Handle viewer-specific circle entity types
import { computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject connection styles - Updated for different entity types
const connectionStyles = `
    .connection-line {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        transform-origin: left center;
    }

    .connection-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    }

    .connection-path {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
        fill: none;
        transition: opacity 0.15s ease;
    }

    /* Different styles for different entity types */
    .connection-path.circle-connection {
        stroke: #4CAF50;
        stroke-width: 1.5;
        opacity: 0.4;
    }

    .connection-path.square-connection {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
    }

    .connection-path.fade-in {
        animation: connectionFadeIn 0.2s ease;
    }

    .connection-path.fade-out {
        animation: connectionFadeOut 0.2s ease;
    }

    @keyframes connectionFadeIn {
        from { opacity: 0; }
        to { opacity: var(--target-opacity, 0.6); }
    }

    @keyframes connectionFadeOut {
        from { opacity: var(--target-opacity, 0.6); }
        to { opacity: 0; }
    }
`;

injectComponentStyles('connection-component', connectionStyles);

export const ConnectionComponent = {
    props: {
        connection: {
            type: Object,
            required: true
        },
        viewerWidth: {
            type: Number,
            default: null // Only needed for circles
        }
    },
    setup(props) {
        // Calculate line position and rotation for both squares and circles
        const lineStyle = computed(() => {
            const { entity1, entity2, entityType } = props.connection;
            
            let x1, y1, x2, y2;
            
            // FIXED: Check if this is a circle-type entity (including viewer-specific types)
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-');
            
            if (isCircleType) {
                // For circles: use center-relative positioning
                const centerX = props.viewerWidth ? props.viewerWidth / 2 : 200; // Fallback center
                
                x1 = centerX + entity1.x + 16; // Center of circle (32px / 2)
                y1 = entity1.y + 16;
                x2 = centerX + entity2.x + 16;
                y2 = entity2.y + 16;
                
            } else {
                // For squares: use absolute positioning
                x1 = entity1.x + 21; // Center of square (41px / 2 + border)
                y1 = entity1.y + 21;
                x2 = entity2.x + 21;
                y2 = entity2.y + 21;
            }
            
            // Calculate distance and angle
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Get appropriate color and opacity based on entity type - FIXED: Keep circles white
            const strokeColor = '#ffffff'; // Keep all connections white like before
            const opacity = isCircleType ? 0.6 : 0.6; // Keep same opacity for both
            const strokeWidth = isCircleType ? '1.5px' : '2px';
            
            return {
                left: x1 + 'px',
                top: y1 + 'px',
                width: length + 'px',
                height: strokeWidth,
                backgroundColor: strokeColor,
                transform: `rotate(${angle}deg)`,
                opacity: opacity
            };
        });

        return {
            lineStyle
        };
    },
    template: `
        <div 
            class="connection-line"
            :style="lineStyle"
        ></div>
    `
};

// SVG-based connection component for more complex styling - Updated for circles and squares
export const ConnectionSVGComponent = {
    props: {
        connections: {
            type: Array,
            required: true
        },
        containerWidth: {
            type: Number,
            default: 800
        },
        containerHeight: {
            type: Number,
            default: 600
        },
        viewerWidth: {
            type: Number,
            default: null // Only needed when rendering circle connections
        }
    },
    setup(props) {
        const svgPaths = computed(() => {
            return props.connections.map(connection => {
                const { entity1, entity2, entityType } = connection;
                
                let x1, y1, x2, y2;
                
                // FIXED: Check if this is a circle-type entity (including viewer-specific types)
                const isCircleType = entityType === 'circle' || entityType.startsWith('circle-');
                
                if (isCircleType) {
                    // For circles: use center-relative positioning
                    const centerX = props.viewerWidth ? props.viewerWidth / 2 : 200;
                    x1 = centerX + entity1.x + 16; // Center of circle
                    y1 = entity1.y + 16;
                    x2 = centerX + entity2.x + 16;
                    y2 = entity2.y + 16;
                } else {
                    // For squares: use absolute positioning  
                    x1 = entity1.x + 21; // Center of square
                    y1 = entity1.y + 21;
                    x2 = entity2.x + 21;
                    y2 = entity2.y + 21;
                }
                
                return {
                    id: connection.id,
                    path: `M ${x1} ${y1} L ${x2} ${y2}`,
                    distance: connection.distance,
                    entityType: entityType,
                    isCircleType: isCircleType
                };
            });
        });

        return {
            svgPaths
        };
    },
    template: `
        <svg 
            class="connection-svg"
            :width="containerWidth"
            :height="containerHeight"
            :viewBox="\`0 0 \${containerWidth} \${containerHeight}\`"
        >
            <path
                v-for="pathData in svgPaths"
                :key="pathData.id"
                :d="pathData.path"
                :class="['connection-path', pathData.isCircleType ? 'circle-connection' : 'square-connection']"
            />
        </svg>
    `
};
