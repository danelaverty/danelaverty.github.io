// ConnectionComponent.js - UPDATED: CSS-based directional arrows instead of SVG
import { computed, watch } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject connection styles - Updated for CSS-based arrows
const connectionStyles = `
    .connection-line {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        transform-origin: left center;
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

    /* Explicit connection styles */
    .connection-line.explicit-solid {
        background-color: rgba(70, 70, 70, 1);
    }

    .connection-line.explicit-dashed {
        border-top: 2px dashed rgba(70, 70, 70, 1);
        background-color: transparent;
    }

    /* CSS-based arrow styles */
    .connection-line::before,
    .connection-line::after {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
    }

    /* Start arrow (left side) - pointing right */
    .connection-line.arrow-start::before {
        left: 7px;
        top: 50%;
        transform: translateY(-50%);
        border-left: 12px solid transparent;
        border-right: 12px solid var(--arrow-color);
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
    }

    /* End arrow (right side) - pointing right */
    .connection-line.arrow-end::after {
        right: 7px;
        top: 50%;
        transform: translateY(-50%);
        border-left: 12px solid var(--arrow-color);
        border-right: 12px solid transparent;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
    }

    /* Dashed line arrows need special handling */
    .connection-line.dashed.arrow-start::before {
        left: -8px;
        border-right-color: var(--arrow-color);
    }

    .connection-line.dashed.arrow-end::after {
        right: -8px;
        border-left-color: var(--arrow-color);
    }

    .connection-path {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
        fill: none;
        transition: opacity 0.15s ease;
    }

    .connection-path.circle-connection {
        stroke: #4CAF50;
        stroke-width: 1.5;
        opacity: 1;
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

    .connection-path.explicit-connection {
        stroke: rgba(70, 70, 70, 1);
        stroke-width: 2.5;
        opacity: 0.8;
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
            default: null
        },
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
            
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-');
            
            if (isCircleType && !isExplicitConnection.value) {
                return (isCircleInactive(entity1) && entity1.type != 'glow') || (isCircleInactive(entity2) && entity2.type != 'glow');
            }
            
            return false;
        });

        // Helper function to get entity position with drag adjustments
        const getEntityPosition = (entity, entityType) => {
            let baseX = entity.x;
            let baseY = entity.y;

            if (isExplicitConnection.value && 
                props.entityDragState.isDragging && 
                props.entityDragState.draggedEntityIds.includes(entity.id)) {
                
                baseX += props.entityDragState.currentDeltas.deltaX;
                baseY += props.entityDragState.currentDeltas.deltaY;
            }

            return { x: baseX, y: baseY };
        };

        // Get arrow color based on connection type
        const getArrowColor = computed(() => {
            const { entityType } = props.connection;
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            
            if (isExplicitConnection.value) {
                return 'rgba(70, 70, 70, 1)';
            } else if (isCircleType) {
                return '#4CAF50';
            } else {
                return '#ffffff';
            }
        });

        // Calculate line position and rotation with CSS arrows
        const lineStyle = computed(() => {
            const { entity1, entity2, entityType } = props.connection;
            
            const pos1 = getEntityPosition(entity1, entityType);
            const pos2 = getEntityPosition(entity2, entityType);
            
            let x1, y1, x2, y2;
            
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            
            if (isCircleType) {
                const centerX = props.viewerWidth ? props.viewerWidth / 2 : 200;
                
                x1 = centerX + pos1.x + 16;
                y1 = pos1.y + 16;
                x2 = centerX + pos2.x + 16;
                y2 = pos2.y + 16;
                
            } else {
                x1 = pos1.x + 21;
                y1 = pos1.y + 21;
                x2 = pos2.x + 21;
                y2 = pos2.y + 21;
            }
            
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            const isDashed = shouldBeDashed.value;
            const isExplicit = isExplicitConnection.value;
            
            let strokeColor, opacity, strokeWidth;
            
            if (isExplicit) {
                strokeColor = 'rgba(70, 70, 70, 1)';
                opacity = 0.8;
                strokeWidth = '2.5px';
            } else if (isCircleType) {
                strokeColor = '#4CAF50';
                opacity = 1;
                strokeWidth = '1.5px';
            } else {
                strokeColor = '#ffffff';
                opacity = 0.6;
                strokeWidth = '2px';
            }
            
            const baseStyle = {
                left: x1 + 'px',
                top: y1 + 'px',
                width: length + 'px',
                height: strokeWidth,
                transform: `rotate(${angle}deg)`,
                opacity: opacity,
                '--arrow-color': getArrowColor.value
            };

            if (isDashed) {
                return {
                    ...baseStyle,
                    borderTop: `${strokeWidth} dashed ${strokeColor}`,
                    backgroundColor: 'transparent',
                    height: '0px'
                };
            } else {
                return {
                    ...baseStyle,
                    backgroundColor: strokeColor,
                    border: 'none'
                };
            }
        });

        // Calculate CSS classes for the connection line including arrow classes
        const lineClasses = computed(() => {
            const { entityType, directionality } = props.connection;
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

            // Add arrow classes based on directionality
            if (isExplicit && directionality && directionality !== 'none') {
                if (directionality === 'in' || directionality === 'both') {
                    classes.push('arrow-start');
                }
                if (directionality === 'out' || directionality === 'both') {
                    classes.push('arrow-end');
                }
            }
            
            return classes;
        });

        // Generate connection title with directionality info
        const getConnectionTitle = () => {
            let title = isExplicitConnection.value ? 
                'Explicit Connection (Ctrl+click to delete)' : 
                'Proximity Connection';
            
            if (isExplicitConnection.value && props.connection.directionality && props.connection.directionality !== 'none') {
                const dirLabels = {
                    out: 'Outward direction',
                    in: 'Inward direction', 
                    both: 'Bidirectional'
                };
                title += ` - ${dirLabels[props.connection.directionality]}`;
            }
            
            return title;
        };

        // Watch for changes in entity activation status, explicit connection status, and drag state
        watch(
            () => [
                props.connection.entity1?.activation,
                props.connection.entity2?.activation,
                props.connection.entityType,
                props.connection.isExplicit,
                props.connection.directionality, // NEW: Watch directionality changes
                props.entityDragState.isDragging,
                props.entityDragState.currentDeltas.deltaX,
                props.entityDragState.currentDeltas.deltaY,
                props.entityDragState.draggedEntityIds?.join(',') || ''
            ],
            () => {
                // Computed properties will automatically recalculate
            },
            { deep: true }
        );

        return {
            lineStyle,
            lineClasses,
            isExplicitConnection,
            getConnectionTitle
        };
    },
    template: `
        <div 
            :class="lineClasses"
            :style="lineStyle"
            :title="getConnectionTitle()"
        ></div>
    `
};
