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

/* Potential energy indicators */
.potential-energy-indicator {
    position: absolute;
    top: 0;
    height: 100%;
    pointer-events: none;
    transition: width 0.9s ease;
    width: 15px;
    transform-origin: left center;
}

.potential-energy-indicator.demo-mode:not(.expanded) {
    opacity: 0;
}

.potential-energy-indicator.left {
    left: 0;
    transform-origin: left center;
}

.potential-energy-indicator.right {
    right: 0;
    transform-origin: right center;
}

/* Solid colors as base */
.potential-energy-indicator.show-dampener {
    background: rgba(120, 80, 120, .5);
}

.potential-energy-indicator.show-exciter {
    background: rgba(0, 255, 255, .5);
}

/* Gradient fade using ::after pseudo-element */
.potential-energy-indicator.show-dampener::after,
.potential-energy-indicator.show-exciter::after {
    content: '';
    position: absolute;
    top: 0;
    height: 100%;
    width: 10px;
    pointer-events: none;
}

.potential-energy-indicator.left.show-dampener::after {
    right: -10px;
    background: linear-gradient(to right, rgba(120, 80, 120, .5), transparent);
}

.potential-energy-indicator.left.show-exciter::after {
    right: -10px;
    background: linear-gradient(to right, rgba(0, 255, 255, .5), transparent);
}

.potential-energy-indicator.right.show-dampener::after {
    left: -10px;
    background: linear-gradient(to left, rgba(120, 80, 120, .5), transparent);
}

.potential-energy-indicator.right.show-exciter::after {
    left: -10px;
    background: linear-gradient(to left, rgba(0, 255, 255, .5), transparent);
}

/* Pulse animation using scaleX for potential (not expanded) state */
.potential-energy-indicator:not(.expanded) {
    animation: potential-energy-pulse 2s ease-in-out infinite;
}

.potential-energy-indicator.expanded {
    animation-play-state: paused;
}

@keyframes potential-energy-pulse {
    0%, 100% {
        transform: scaleX(1);
    }
    50% {
        transform: scaleX(.5);
    }
}

/* Barber pole animations */
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

/* Expanded state - fills entire connection with barber pole */
.potential-energy-indicator.expanded {
    width: 100%;
    animation-play-state: paused;
}

.potential-energy-indicator.expanded.show-exciter {
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
}

.potential-energy-indicator.expanded.show-dampener {
    background: repeating-linear-gradient(
        90deg,
        #332233 0px,
        #332233 4px,
        #664466 8px,
        #664466 12px,
        #332233 16px,
        #332233 20px
    );
    animation: barber-pole 1s linear infinite;
}

/* Reverse flow animation */
.potential-energy-indicator.expanded.reverse-flow.show-exciter,
.potential-energy-indicator.expanded.reverse-flow.show-dampener {
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

    .demo-mode .arrow-container {
    opacity: 0;
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
        border-left: 9px solid transparent;
        border-right: 9px solid var(--arrow-color);
        border-top: 3px solid transparent;
        border-bottom: 3px solid transparent;
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
        border-left: 9px solid var(--arrow-color);
        border-right: 9px solid transparent;
        border-top: 3px solid transparent;
        border-bottom: 3px solid transparent;
    }

    .connection-path {
        stroke: #ffffff;
        stroke-width: 2;
        fill: none;
        transition: opacity 0.15s ease;
    }

    .connection-path.circle-connection {
        stroke: #505050;
        stroke-width: 1.5;
    }

    .connection-path.square-connection {
        stroke: #ffffff;
        stroke-width: 2;
    }

    .connection-path.explicit-connection {
        stroke: rgba(70, 70, 70, 1);
        stroke-width: 2.5;
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
        cellularAutomaton: {
            type: Object,
            default: null
        },
        viewerWidth: {
            type: Number,
            default: null
        },
        getCircleShinyness: {
            type: Function,
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
        },
        animationTimestamp: {
            type: Number,
            default: 0
        },
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

const potentialEnergyClasses = computed(() => {
    if (!isExplicitConnection.value || !props.getCircleShinyness) {
        return { left: [], right: [] };
    }

    const entity1 = props.connection.entity1;
    const entity2 = props.connection.entity2;
    const directionality = props.connection.directionality || 'none';
    const connectionEnergyTypes = props.connection.connectionEnergyTypes || [];
    
    const entity1Shinyness = props.getCircleShinyness(entity1.id);
    const entity2Shinyness = props.getCircleShinyness(entity2.id);
    
    const leftClasses = [];
    const rightClasses = [];

    if (props.demoMode) {
        leftClasses.push('demo-mode');
        rightClasses.push('demo-mode');
    }
    
    // Determine which circles are inbound based on directionality
    const entity1IsInbound = directionality === 'none' || directionality === 'both' || directionality === 'out';
    const entity2IsInbound = directionality === 'none' || directionality === 'both' || directionality === 'in';
    
    // Helper to determine which energy type to show based on:
    // 1. Intersection of circle's energy types and connection's allowed types
    // 2. Dampener takes priority if both are present
    const determineEnergyClass = (circleEnergyTypes) => {
        if (!circleEnergyTypes || circleEnergyTypes.length === 0) {
            return null;
        }
        
        // If connection has no energy type restrictions, it can carry all types
        const allowedTypes = connectionEnergyTypes.length > 0 ? connectionEnergyTypes : ['exciter', 'dampener'];
        
        // Find intersection of circle's types and connection's allowed types
        const validTypes = circleEnergyTypes.filter(type => allowedTypes.includes(type));
        
        // Dampener takes priority
        if (validTypes.includes('dampener')) {
            return 'show-dampener';
        } else if (validTypes.includes('exciter')) {
            return 'show-exciter';
        }
        
        return null;
    };
    
    // Check if connection is currently energized
    const isConnectionEnergized = props.connectionEnergyClasses && props.connectionEnergyClasses.length > 0;
    const connectionHasExciter = props.connectionEnergyClasses && props.connectionEnergyClasses.includes('exciter-connection');
    const connectionHasDampener = props.connectionEnergyClasses && props.connectionEnergyClasses.includes('dampener-connection');
    
    // Determine flow direction for barber pole animation
    const entity1Id = props.connection.entity1Id;
    const entity2Id = props.connection.entity2Id;
    const entity1Energy = props.circleEnergyDistances.get(entity1Id) || {};
    const entity2Energy = props.circleEnergyDistances.get(entity2Id) || {};
    
    let shouldReverseFlow = false;
    const connectionEnergy = props.energyDistance;
    if (connectionEnergy && Object.keys(connectionEnergy).length > 0) {
        Object.keys(connectionEnergy).forEach(energyType => {
            const entity1Distance = entity1Energy[energyType];
            const entity2Distance = entity2Energy[energyType];
            if (entity1Distance !== undefined && entity2Distance !== undefined) {
                if (entity1Distance < entity2Distance) {
                    shouldReverseFlow = true;
                }
            }
        });
    }
    
    // Check entity1 (left)
    if (entity1IsInbound && entity1.energyTypes) {
        const energyClass = determineEnergyClass(entity1.energyTypes);
        if (energyClass) {
            leftClasses.push(energyClass);
            
            // Check if this endpoint is the source of the current energy
            // It's the source if: it's shiny AND the connection has the matching energy type
            if (entity1Shinyness === 'shiny') {
                const hasMatchingEnergy = 
                    (energyClass === 'show-exciter' && connectionHasExciter) ||
                    (energyClass === 'show-dampener' && connectionHasDampener);
                
                if (hasMatchingEnergy) {
                    leftClasses.push('expanded');
                    if (shouldReverseFlow) {
                        leftClasses.push('reverse-flow');
                    }
                }
            }
        }
    }
    
    // Check entity2 (right)
    if (entity2IsInbound && entity2.energyTypes) {
        const energyClass = determineEnergyClass(entity2.energyTypes);
        if (energyClass) {
            rightClasses.push(energyClass);
            
            // Check if this endpoint is the source of the current energy
            // It's the source if: it's shiny AND the connection has the matching energy type
            if (entity2Shinyness === 'shiny') {
                const hasMatchingEnergy = 
                    (energyClass === 'show-exciter' && connectionHasExciter) ||
                    (energyClass === 'show-dampener' && connectionHasDampener);
                
                if (hasMatchingEnergy) {
                    rightClasses.push('expanded');
                    if (shouldReverseFlow) {
                        rightClasses.push('reverse-flow');
                    }
                }
            }
        }
    }
    
    return { left: leftClasses, right: rightClasses };
});

const potentialEnergyDebugInfo = computed(() => {
    if (!isExplicitConnection.value || !props.getCircleShinyness) {
        return { left: '', right: '' };
    }

    const entity1 = props.connection.entity1;
    const entity2 = props.connection.entity2;
    
    // Call the function which will internally depend on automatonState
    const leftShinyness = props.getCircleShinyness(entity1.id);
    const rightShinyness = props.getCircleShinyness(entity2.id);
    
    return {
        left: leftShinyness,
        right: rightShinyness
    };
});

        // Helper function to check if a circle is inactive
        const isCircleInactive = (entity) => {
            return entity.activation === 'inactive';
        };

const getEntityPosition = (entity, entityType) => {
    // Create reactive dependency on drag state to ensure connections update during drag
    const isBeingDragged = props.entityDragState.draggedEntityIds?.includes(entity.id);
    
    const entityElement = document.querySelector(`[data-entity-id="${entity.id}"]`);
    if (entityElement && entityElement.style.left && entityElement.style.top) {
        const domLeft = parseFloat(entityElement.style.left) || 0;
        const domTop = parseFloat(entityElement.style.top) || 0;
        
        const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
        if (isCircleType && props.viewerWidth) {
            const centerX = props.viewerWidth / 2;
            return {
                x: domLeft - centerX,
                y: domTop
            };
        }
        return { x: domLeft, y: domTop };
    }
    
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
            const _ = props.animationTimestamp;
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
                //strokeColor = props.demoMode ? 'rgba(70, 70, 70, 0)' : 'rgba(70, 70, 70, .3)';
                strokeColor = 'rgba(70, 70, 70, .3)';
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

            if (props.demoMode) {
                classes.push('demo-mode');
            }
            
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
            potentialEnergyClasses,
            potentialEnergyDebugInfo
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

<!-- Potential energy indicators -->
<div v-if="isExplicitConnection" :class="['potential-energy-indicator', 'left', ...potentialEnergyClasses.left]">
</div>
<div v-if="isExplicitConnection" :class="['potential-energy-indicator', 'right', ...potentialEnergyClasses.right]">
</div>
        </div>
    `
};
