// ConnectionComponent.js - UPDATED: Add drag state awareness for explicit connections
import { computed, watch } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject connection styles - Updated for different entity types, dashed lines, and explicit connections
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

    /* NEW: Explicit connection styles */
    .connection-line.explicit-solid {
        background-color: #FFD700; /* Gold color for explicit connections */
    }

    .connection-line.explicit-dashed {
        border-top: 2px dashed #FFD700;
        background-color: transparent;
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

    /* NEW: Explicit connection styles */
    .connection-path.explicit-connection {
        stroke: #FFD700; /* Gold color */
        stroke-width: 2.5; /* Slightly thicker */
        opacity: 0.8; /* More visible */
    }

    .connection-path.explicit-connection.dashed {
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
        },
        // NEW: Entity drag state for live position updates
        entityDragState: {
            type: Object,
            default: () => ({
                isDragging: false,
                draggedEntityIds: [],
                currentDeltas: { deltaX: 0, deltaY: 0 },
                entityType: null,
                viewerId: null
            })
        }
    },
    setup(props) {
        // Helper function to check if connection is explicit
        const isExplicitConnection = computed(() => {
            return props.connection.isExplicit === true || 
                   props.connection.entityType?.startsWith('explicit-');
        });

        // Helper function to check if a circle is inactive
        const isCircleInactive = (entity) => {
            return entity.activation === 'inactive';
        };

        // Helper function to determine if connection should be dashed
        const shouldBeDashed = computed(() => {
            const { entity1, entity2, entityType } = props.connection;
            
            // Only apply dashing logic to circle connections (not explicit connections)
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-');
            
            if (isCircleType && !isExplicitConnection.value) {
                // Check if either circle is inactive
                return (isCircleInactive(entity1) && entity1.type != 'glow') || (isCircleInactive(entity2) && entity2.type != 'glow');
            }
            
            return false;
        });

        // NEW: Helper function to get entity position with drag adjustments
        const getEntityPosition = (entity, entityType) => {
            let baseX = entity.x;
            let baseY = entity.y;

            // Apply drag deltas if this entity is being dragged and this is an explicit connection
            if (isExplicitConnection.value && 
                props.entityDragState.isDragging && 
                props.entityDragState.draggedEntityIds.includes(entity.id)) {
                
                baseX += props.entityDragState.currentDeltas.deltaX;
                baseY += props.entityDragState.currentDeltas.deltaY;
            }

            return { x: baseX, y: baseY };
        };

        // Calculate line position and rotation for both squares and circles
        const lineStyle = computed(() => {
            const { entity1, entity2, entityType } = props.connection;
            
            // Get positions with potential drag adjustments for explicit connections
            const pos1 = getEntityPosition(entity1, entityType);
            const pos2 = getEntityPosition(entity2, entityType);
            
            let x1, y1, x2, y2;
            
            // FIXED: Check if this is a circle-type entity (including viewer-specific types)
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            
            if (isCircleType) {
                // For circles: use center-relative positioning
                const centerX = props.viewerWidth ? props.viewerWidth / 2 : 200; // Fallback center
                
                x1 = centerX + pos1.x + 16; // Center of circle (32px / 2)
                y1 = pos1.y + 16;
                x2 = centerX + pos2.x + 16;
                y2 = pos2.y + 16;
                
            } else {
                // For squares: use absolute positioning
                x1 = pos1.x + 21; // Center of square (41px / 2 + border)
                y1 = pos1.y + 21;
                x2 = pos2.x + 21;
                y2 = pos2.y + 21;
            }
            
            // Calculate distance and angle
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Get appropriate styling based on connection type
            const isDashed = shouldBeDashed.value;
            const isExplicit = isExplicitConnection.value;
            
            let strokeColor, opacity, strokeWidth;
            
            if (isExplicit) {
                // Explicit connections use gold color
                strokeColor = '#FFD700';
                opacity = 0.8;
                strokeWidth = '2.5px';
            } else if (isCircleType) {
                // Regular circle connections
                strokeColor = '#4CAF50';
                opacity = 0.4;
                strokeWidth = '1.5px';
            } else {
                // Regular square connections
                strokeColor = '#ffffff';
                opacity = 0.6;
                strokeWidth = '2px';
            }
            
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
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            const isDashed = shouldBeDashed.value;
            const isExplicit = isExplicitConnection.value;
            
            const classes = ['connection-line'];
            
            if (isExplicit) {
                classes.push(isDashed ? 'explicit-dashed' : 'explicit-solid');
            } else if (isCircleType) {
                classes.push(isDashed ? 'circle-dashed' : 'circle-solid');
            } else {
                classes.push(isDashed ? 'dashed' : 'solid');
            }
            
            return classes;
        });

        // Watch for changes in entity activation status, explicit connection status, and drag state to update connection styling immediately
        watch(
            () => [
                props.connection.entity1?.activation,
                props.connection.entity2?.activation,
                props.connection.entityType,
                props.connection.isExplicit,
                // NEW: Watch drag state changes
                props.entityDragState.isDragging,
                props.entityDragState.currentDeltas.deltaX,
                props.entityDragState.currentDeltas.deltaY,
                props.entityDragState.draggedEntityIds?.join(',') || ''
            ],
            () => {
                // The computed properties will automatically recalculate when these values change
                // This watch ensures the component reactively updates when activation status, explicit status, or drag state changes
            },
            { deep: true }
        );

        return {
            lineStyle,
            lineClasses,
            isExplicitConnection
        };
    },
    template: `
        <div 
            :class="lineClasses"
            :style="lineStyle"
            :title="isExplicitConnection ? 'Explicit Connection (Ctrl+click to delete)' : 'Proximity Connection'"
        ></div>
    `
};
