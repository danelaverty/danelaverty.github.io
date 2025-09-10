// ConnectionComponent.js - UPDATED: Add energy connection visual indicators
import { computed, watch } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject connection styles - Updated with energy connection colors
const connectionStyles = `
    .connection-line {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        transform-origin: left center;
    transition: background-color 1.5s ease;
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

    /*.connection-line.exciter-connection.solid,
    .connection-line.exciter-connection.explicit-solid {
        background-color: #00DDDD !important;
    }

    .connection-line.exciter-connection.dashed,
    .connection-line.exciter-connection.explicit-dashed {
        border-top-color: #00DDDD !important;
        background-color: transparent;
    }

    .connection-line.dampener-connection.solid,
    .connection-line.dampener-connection.explicit-solid {
        background-color: #00DDDD !important;
    }

    .connection-line.dampener-connection.dashed,
    .connection-line.dampener-connection.explicit-dashed {
        border-top-color: #00DDDD !important;
        background-color: transparent;
    }*/


/*
.connection-line:not(.exciter-connection):not(.dampener-connection) {
    transition: background-color 0.5s ease;
}

.connection-line.exciter-connection.solid,
.connection-line.exciter-connection.explicit-solid {
    border-top: 3px solid #00DDDD !important;
    background-color: transparent;
    position: relative;
}

.connection-line.exciter-connection.solid::before,
.connection-line.exciter-connection.explicit-solid::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 3px;
    width: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 40%,
        #00AAAA 40%,
        #00AAAA 60%,
        transparent 60%,
        transparent 100%
    );
    background-size: 20px 3px;
    animation: dash-flow 2s linear infinite;
}

.connection-line.dampener-connection.solid,
.connection-line.dampener-connection.explicit-solid {
    border-top: 3px solid #00DDDD !important;
    background-color: transparent;
    position: relative;
}

.connection-line.dampener-connection.solid::before,
.connection-line.dampener-connection.explicit-solid::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 3px;
    width: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 40%,
        #006666 40%,
        #006666 60%,
        transparent 60%,
        transparent 100%
    );
    background-size: 20px 3px;
    animation: dash-flow 2s linear infinite;
}
*/

/* Keyframe animations */
@keyframes barber-pole-flow {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 20px 0;
    }
}

@keyframes dash-flow {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 20px 0;
    }
}

/* Alternative: Pulsing energy effect for variety */
.connection-line.exciter-connection.pulse {
    background: #00DDDD !important;
    animation: energy-pulse 1s ease-in-out infinite alternate;
}

.connection-line.dampener-connection.pulse {
    background: #00DDDD !important;
    animation: energy-pulse 1s ease-in-out infinite alternate;
}

@keyframes energy-pulse {
    0% {
        opacity: 0.6;
        filter: brightness(0.8);
    }
    100% {
        opacity: 1;
        filter: brightness(1.2) drop-shadow(0 0 4px #00DDDD);
    }
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

        // Helper function to check if a circle has specific energy type and is activated
        const hasActiveEnergyType = (entity, energyType) => {
            return entity.energyTypes && 
                   entity.energyTypes.includes(energyType) && 
                   entity.activation === 'activated';
        };

        // NEW: Detect energy connection type
        const energyConnectionType = computed(() => {
            // Only check for energy connections on explicit connections
            if (!isExplicitConnection.value) {
                return null;
            }

            const { entity1, entity2 } = props.connection;
            
            // Check if either entity is an active exciter/igniter
            if (hasActiveEnergyType(entity1, 'exciter') || hasActiveEnergyType(entity1, 'igniter') ||
                hasActiveEnergyType(entity2, 'exciter') || hasActiveEnergyType(entity2, 'igniter')) {
                return 'exciter';
            }
            
            // Check if either entity is an active dampener
            if (hasActiveEnergyType(entity1, 'dampener') || hasActiveEnergyType(entity2, 'dampener')) {
                return 'dampener';
            }
            
            return null;
        });

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

        // Get arrow color based on connection type - UPDATED to support energy colors
        const getArrowColor = computed(() => {
            const { entityType } = props.connection;
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            
            // NEW: Energy connection colors take priority
            if (energyConnectionType.value === 'exciter') {
                return '#DD00DD';
            } else if (energyConnectionType.value === 'dampener') {
                return '#663333';
            }
            
            // Original color logic
            if (isExplicitConnection.value) {
                return 'rgba(70, 70, 70, 1)';
            } else if (isCircleType) {
                return '#4CAF50';
            } else {
                return '#ffffff';
            }
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
    const hasEnergyConnection = energyConnectionType.value !== null;
    
    let strokeColor, opacity, strokeWidth;
    
    // Set default values
    if (hasEnergyConnection) {
        // For energy connections, don't set backgroundColor - let CSS handle it
        strokeColor = null; // This will prevent backgroundColor from being set
        opacity = 0.8;
        strokeWidth = '2.5px';
    } else if (isExplicit) {
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
        const style = {
            ...baseStyle,
            backgroundColor: 'transparent',
            height: '0px'
        };
        
        // Only set border-top for non-energy connections or when strokeColor is defined
        if (!hasEnergyConnection && strokeColor) {
            style.borderTop = `${strokeWidth} dashed ${strokeColor}`;
        }
        
        return style;
    } else {
        const style = {
            ...baseStyle,
            border: 'none'
        };
        
        // Only set backgroundColor for non-energy connections
        if (!hasEnergyConnection && strokeColor) {
            style.backgroundColor = strokeColor;
        }
        
        return style;
    }
});

        // Calculate CSS classes for the connection line including arrow classes - UPDATED with energy classes
        const lineClasses = computed(() => {
            const { entityType, directionality } = props.connection;
            const isCircleType = entityType === 'circle' || entityType.startsWith('circle-') || entityType.startsWith('explicit-circle');
            const isDashed = shouldBeDashed.value;
            const isExplicit = isExplicitConnection.value;
            
            const classes = ['connection-line'];
            
            // NEW: Add energy connection classes first (highest priority)
            if (energyConnectionType.value) {
                classes.push(`${energyConnectionType.value}-connection`);
            }
            
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

        // Generate connection title with directionality and energy info
        const getConnectionTitle = () => {
            let title = isExplicitConnection.value ? 
                'Explicit Connection (Ctrl+click to delete)' : 
                'Proximity Connection';
            
            // NEW: Add energy type information
            if (energyConnectionType.value) {
                const energyLabel = energyConnectionType.value === 'exciter' ? 'Exciter/Igniter' : 'Dampener';
                title += ` - ${energyLabel} Energy Connection`;
            }
            
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

        // Watch for changes in entity activation status, explicit connection status, energy types, and drag state
        watch(
            () => [
                props.connection.entity1?.activation,
                props.connection.entity2?.activation,
                props.connection.entity1?.energyTypes?.join(',') || '',
                props.connection.entity2?.energyTypes?.join(',') || '',
                props.connection.entityType,
                props.connection.isExplicit,
                props.connection.directionality,
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
            energyConnectionType, // NEW: Expose energy type for debugging
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
