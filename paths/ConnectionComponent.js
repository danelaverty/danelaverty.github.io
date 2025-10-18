import { computed, watch } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

const connectionStyles = `
    .connection-line {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        transform-origin: left center;
        transition: opacity 1s ease;
    }

    .connection-line.solid {
        background-color: #ffffff;
    }

    .connection-line.circle-solid {
        background-color: #505050;
    }

    /* Explicit connection styles */
    .connection-line.explicit-solid {
        background-color: rgba(70, 70, 70, 1);
    }

    /* Animated overlay for exciter/dampener - uses ::before */
    .connection-line::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.5s ease;
    }

    @keyframes barber-pole {
        0% {
            background-position: 20px 0px;
        }
        100% {
            background-position: 0px 0px;
        }
    }

    @keyframes barber-pole-rev {
        0% {
            background-position: 0px 0px;
        }
        100% {
            background-position: 20px 0px;
        }
    }

    .connection-line.exciter-connection, .connection-line.dampener-connection {
    	opacity: 1 !important;
    }

    .connection-line.exciter-connection::before {
        background: repeating-linear-gradient(
            90deg,
            #00AAAA 0px,
            #00AAAA 4px,
            #00FFFF 8px,
            #00FFFF 12px,
            #00AAAA 16px,
            #00AAAA 20px
        );
        animation: barber-pole 1s linear infinite;
        opacity: 1;
    }

    .connection-line.dampener-connection::before {
        background: repeating-linear-gradient(
            90deg,
            #AA0000 0px,
            #AA0000 4px,
            #FF0000 8px,
            #FF0000 12px,
            #AA0000 16px,
            #AA0000 20px
        );
        animation: barber-pole 1s linear infinite;
        opacity: 1;
    }

    .connection-line.exciter-connection.reverse-flow::before {
        animation: barber-pole-rev 1s linear infinite;
    }

    .connection-line.dampener-connection.reverse-flow::before {
        animation: barber-pole-rev 1s linear infinite;
    }

    /* Arrow wrapper - separate element from the line */
    .arrow-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    }

    /* Start arrow (left side) - pointing right */
    .arrow-start-indicator {
        position: absolute;
        left: 7px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-left: 12px solid transparent;
        border-right: 12px solid var(--arrow-color);
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
    }

    /* End arrow (right side) - pointing right */
    .arrow-end-indicator {
        position: absolute;
        right: 7px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-left: 12px solid var(--arrow-color);
        border-right: 12px solid transparent;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
    }

    .connection-path {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
        fill: none;
        transition: opacity 0.15s ease;
    }

    .connection-path.circle-connection {
        stroke: #505050;
        stroke-width: 1.5;
        opacity: 1;
    }

    .connection-path.square-connection {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
    }

    .connection-path.explicit-connection {
        stroke: rgba(70, 70, 70, 1);
        stroke-width: 2.5;
        opacity: 0.1;
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
        },
        viewerId: {
            type: String,
            default: null
        },
        energyDistance: {
            type: Object,
            default: () => ({})
        },
        energyEffectsController: {
            type: Object,
            default: null
        },
        energyAffectedConnections: {
            type: Set,
            default: () => new Set()
        },
        connectionEnergyClasses: {
            type: Array,
            default: () => []
        },
        circleEnergyDistances: {
                type: Map,
                default: () => new Map()
        },
        demoMode: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const isExplicitConnection = computed(() => {
            const result = props.connection.isExplicit === true || 
                props.connection.entityType?.startsWith('explicit-');
            return result;
        });

        const energyClasses = computed(() => props.connectionEnergyClasses);

        const flowDirectionClasses = computed(() => {
            const classes = [];
            const connectionEnergy = props.energyDistance;
            
            if (!connectionEnergy || Object.keys(connectionEnergy).length === 0) {
                return classes;
            }
            
            const entity1Id = props.connection.entity1Id;
            const entity2Id = props.connection.entity2Id;
            
            const entity1Energy = props.circleEnergyDistances.get(entity1Id) || {};
            const entity2Energy = props.circleEnergyDistances.get(entity2Id) || {};
            
            // Check each energy type present on this connection
            Object.keys(connectionEnergy).forEach(energyType => {
                const entity1Distance = entity1Energy[energyType];
                const entity2Distance = entity2Energy[energyType];
                
                // Only determine direction if both entities have this energy type
                if (entity1Distance !== undefined && entity2Distance !== undefined) {
                    // The default animation flows from entity2 to entity1
                    // We want energy to flow from lower distance to higher distance
                    // So add reverse-flow when entity1 has LOWER distance (to flip it to entity1→entity2)
                    if (entity1Distance < entity2Distance) {
                        classes.push('reverse-flow');
                    }
                }
            });
            
            return classes;
        });

        // Helper function to check if a circle is inactive
        const isCircleInactive = (entity) => {
            return entity.activation === 'inactive';
        };

        // Helper function to get entity position with drag adjustments
        const getEntityPosition = (entity, entityType) => {
            // Check if this entity is currently being dragged
            const isDragging = props.entityDragState.isDragging;
            const draggedIds = props.entityDragState.draggedEntityIds || [];
            const isEntityBeingDragged = isDragging && draggedIds.includes(entity.id);
            
            if (isEntityBeingDragged) {
                // Apply drag deltas to the entity's position
                return {
                    x: entity.x + props.entityDragState.currentDeltas.deltaX,
                    y: entity.y + props.entityDragState.currentDeltas.deltaY
                };
            }
            
            // Return the entity's current position without modifications
            return { x: entity.x, y: entity.y };
        };

        const getArrowColor = computed(() => {
            const { entityType } = props.connection;
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            
            // Original color logic
            if (isExplicitConnection.value) {
                return 'rgba(70, 70, 70, 1)';
            } else if (isCircleType) {
                return '#505050';
            } else {
                return '#ffffff';
            }
        });

        const showArrows = computed(() => {
            const { directionality } = props.connection;
            return isExplicitConnection.value && directionality && directionality !== 'none';
        });

        const showStartArrow = computed(() => {
            const { directionality } = props.connection;
            return showArrows.value && (directionality === 'in' || directionality === 'both');
        });

        const showEndArrow = computed(() => {
            const { directionality } = props.connection;
            return showArrows.value && (directionality === 'out' || directionality === 'both');
        });

        const lineStyle = computed(() => {
            const { entity1, entity2, entityType } = props.connection;
            
            const pos1 = getEntityPosition(entity1, entityType);
            const pos2 = getEntityPosition(entity2, entityType);
            
            let x1, y1, x2, y2;
            
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            
            if (isCircleType) {
                const centerX = props.viewerWidth ? props.viewerWidth / 2 : 200;
                
                x1 = centerX + pos1.x;
                y1 = pos1.y;
                x2 = centerX + pos2.x;
                y2 = pos2.y;
                
            } else {
                x1 = pos1.x;
                y1 = pos1.y;
                x2 = pos2.x;
                y2 = pos2.y;
            }
            
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            const isExplicit = isExplicitConnection.value;
            
            let strokeColor, opacity, strokeWidth;
            
            // Set default values
            if (isExplicit) {
                strokeColor = 'rgba(70, 70, 70, 1)';
                opacity = props.demoMode ? 0 : 0.6;
                strokeWidth = '2.5px';
            } else if (isCircleType) {
                strokeColor = '#505050';
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

            const style = {
                ...baseStyle,
                border: 'none'
            };
            
            style.backgroundColor = strokeColor;
            
            return style;
        });

        const lineClasses = computed(() => {
            const { entityType } = props.connection;
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            const isExplicit = isExplicitConnection.value;

            const classes = ['connection-line'];
            
            if (isExplicit) {
                classes.push('explicit-solid');
            } else if (isCircleType) {
                classes.push('circle-solid');
            } else {
                classes.push('solid');
            }
            
            return classes;
        });

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

        watch(
            () => [
                props.connection.entity1?.activation,
                props.connection.entity2?.activation,
                props.connection.entityType,
                props.connection.isExplicit,
                props.connection.directionality,
                props.entityDragState.isDragging,
                props.entityDragState.currentDeltas.deltaX,
                props.entityDragState.currentDeltas.deltaY,
                props.entityDragState.draggedEntityIds?.join(',') || '',
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
            getConnectionTitle,
            energyClasses,
            flowDirectionClasses,
            showStartArrow,
            showEndArrow,
        };
    },
    template: `
        <div 
            :class="[...lineClasses, ...energyClasses, ...flowDirectionClasses]"
            :style="lineStyle"
            :title="getConnectionTitle()"
        >
            <div class="arrow-container" v-if="showStartArrow || showEndArrow">
                <div v-if="showStartArrow" class="arrow-start-indicator"></div>
                <div v-if="showEndArrow" class="arrow-end-indicator"></div>
            </div>
            <!--span v-if="Object.keys(energyDistance).length > 0" style="color: #888; font-size: 12px; display: block; position: absolute; left: 25%;">
		    {{ 'E: ' + energyDistance['exciter'] }}
            </span-->
        </div>
    `
};
