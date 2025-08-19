// ConnectionComponent.js - FIXED: Handle viewer-specific circle entity types + ADDED: Dashed lines for inactive circles
import { computed, watch } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject connection styles - Updated for different entity types and dashed lines
const connectionStyles = `
    .connection-line {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        transform-origin: left center;
        /* Remove backgroundColor - we'll use border instead */
    }

    .connection-line.solid {
        background-color: #ffffff;
    }

    .connection-line.dashed {
        border-top: 2px dashed #ffffff;
        background-color: transparent;
    }

    .connection-line.circle-solid {
        background-color: #4CAF50;
    }

    .connection-line.circle-dashed {
        border-top: 1.5px dashed #4CAF50;
        background-color: transparent;
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

    .connection-path.circle-connection.dashed {
        stroke-dasharray: 5,5;
    }

    .connection-path.square-connection {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
    }

    .connection-path.square-connection.dashed {
        stroke-dasharray: 8,4;
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
        // Helper function to check if a circle is inactive
        const isCircleInactive = (entity) => {
            return entity.activation === 'inactive';
        };

        // Helper function to determine if connection should be dashed
        const shouldBeDashed = computed(() => {
            const { entity1, entity2, entityType } = props.connection;
            
            // Only apply dashing logic to circle connections
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-');
            
            if (isCircleType) {
                // Check if either circle is inactive
                return isCircleInactive(entity1) || isCircleInactive(entity2);
            }
            
            return false;
        });

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
            
            // Get appropriate styling based on entity type and activation status
            const isDashed = shouldBeDashed.value;
            const strokeColor = '#ffffff'; // Keep all connections white like before
            const opacity = isCircleType ? 0.6 : 0.6; // Keep same opacity for both
            const strokeWidth = isCircleType ? '1.5px' : '2px';
            
            // Base styles
            const baseStyle = {
                left: x1 + 'px',
                top: y1 + 'px',
                width: length + 'px',
                height: strokeWidth,
                transform: `rotate(${angle}deg)`,
                opacity: opacity
            };

            // Apply appropriate styling based on whether it should be dashed
            if (isDashed) {
                // For dashed lines, use border instead of background
                return {
                    ...baseStyle,
                    borderTop: `${strokeWidth} dashed ${strokeColor}`,
                    backgroundColor: 'transparent',
                    height: '0px' // When using border-top, height should be 0
                };
            } else {
                // For solid lines, use background color
                return {
                    ...baseStyle,
                    backgroundColor: strokeColor,
                    border: 'none'
                };
            }
        });

        // Calculate CSS classes for the connection line
        const lineClasses = computed(() => {
            const { entityType } = props.connection;
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-');
            const isDashed = shouldBeDashed.value;
            
            const classes = ['connection-line'];
            
            if (isCircleType) {
                classes.push(isDashed ? 'circle-dashed' : 'circle-solid');
            } else {
                classes.push(isDashed ? 'dashed' : 'solid');
            }
            
            return classes;
        });

        // Watch for changes in entity activation status to update connection styling immediately
        watch(
            () => [
                props.connection.entity1?.activation,
                props.connection.entity2?.activation,
                props.connection.entityType
            ],
            () => {
                // The computed properties will automatically recalculate when these values change
                // This watch ensures the component reactively updates when activation status changes
            },
            { deep: true }
        );

        return {
            lineStyle,
            lineClasses
        };
    },
    template: `
        <div 
            :class="lineClasses"
            :style="lineStyle"
        ></div>
    `
};

// SVG-based connection component for more complex styling - Updated for circles and squares + dashed lines
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
        // Helper function to check if a circle is inactive
        const isCircleInactive = (entity) => {
            return entity.activation === 'inactive';
        };

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
                
                // Check if connection should be dashed (for circles only)
                const shouldBeDashed = isCircleType && (isCircleInactive(entity1) || isCircleInactive(entity2));
                
                return {
                    id: connection.id,
                    path: `M ${x1} ${y1} L ${x2} ${y2}`,
                    distance: connection.distance,
                    entityType: entityType,
                    isCircleType: isCircleType,
                    isDashed: shouldBeDashed
                };
            });
        });

        // Watch for changes in connection entities' activation status
        watch(
            () => props.connections.map(conn => [
                conn.entity1?.activation,
                conn.entity2?.activation,
                conn.entityType
            ]),
            () => {
                // The computed properties will automatically recalculate when these values change
                // This watch ensures the SVG component reactively updates when activation status changes
            },
            { deep: true }
        );

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
                :class="[
                    'connection-path', 
                    pathData.isCircleType ? 'circle-connection' : 'square-connection',
                    pathData.isDashed ? 'dashed' : ''
                ]"
            />
        </svg>
    `
};
