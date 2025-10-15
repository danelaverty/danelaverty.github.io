// CircleViewer.js - Updated with ctrl+click multi-select, ctrl+shift+click explicit connections, collapsed group filtering, and shinynessMode
import { onMounted, onUnmounted, computed, ref, watch, nextTick } from './vue-composition-api.js';
import { useCircleViewerDragResize } from './CircleViewerDragResize.js';
import { useCircleViewerSelection } from './CircleViewerSelection.js';
import { useCircleViewerState } from './CircleViewerState.js';
import { useCircleViewerEventHandlers } from './CircleViewerEventHandlers.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { ViewerControls } from './ViewerControls.js';
import { ConnectionComponent } from './ConnectionComponent.js';
import { ExplicitConnectionService } from './ExplicitConnectionService.js';
import { ShinynessCalculator } from './ShinynessCalculator.js';
import { ShinynessEffectsTranslator } from './ShinynessEffectsTranslator.js';
import { EnergyDistanceCalculator } from './EnergyDistanceCalculator.js';
import { EnergizedConnectionsCalculator } from './EnergizedConnectionsCalculator.js';
import './CircleViewerStyles.js'; // Import styles

export const CircleViewer = {
    props: {
        viewerId: {
            type: String,
            required: true
        },
        dragState: {
            type: Object,
            default: () => ({
                isDragging: false,
                draggedViewerId: null,
                dropTarget: null
            })
        },
        hoveredDocumentId: {
            type: String,
            default: null
        }
    },
    emits: [
        'start-reorder',
        'close-viewer',
        'resize',
        'viewer-click',
        'show-dropdown',
        'drag-enter',
        'drag-leave',
        'drop'
    ],
    setup(props, { emit }) {
        const energyEffectsTrigger = ref(0);
        let energizedCirclesDebounceTimeout = null;
        // Get state and computed properties
        const state = useCircleViewerState(props);

        // Entity drag state management
        const entityDragState = ref({
            isDragging: false,
            draggedEntityIds: [],
            currentDeltas: { deltaX: 0, deltaY: 0 },
            entityType: null,
            viewerId: null
        });

        // Handle entity drag events
const handleEntityDragStart = (event) => {
    entityDragState.value = {
        isDragging: true,
        draggedEntityIds: [event.entityId],
        currentDeltas: { deltaX: 0, deltaY: 0 },
        entityType: event.entityType,
        viewerId: event.viewerId
    };
};

const handleEntityDragMove = (event) => {
    if (entityDragState.value.isDragging) {
        entityDragState.value.currentDeltas = {
            deltaX: event.deltaX,
            deltaY: event.deltaY
        };
        entityDragState.value.draggedEntityIds = event.selectedEntityIds || [event.entityId];
    }
};

const handleEntityDragEnd = (event) => {
    entityDragState.value = {
        isDragging: false,
        draggedEntityIds: [],
        currentDeltas: { deltaX: 0, deltaY: 0 },
        entityType: null,
        viewerId: null
    };
};

const handleCircleUpdate = (updates) => {
    state.dataStore.updateCircle(updates.id, updates);
};
        const explicitConnectionService = new ExplicitConnectionService({
            getCircle: state.dataStore.getCircle,
            getSquare: state.dataStore.getSquare,
            getCirclesForViewer: state.dataStore.getCirclesForViewer,
            saveToStorage: state.dataStore.saveToStorage
        });

        const shinynessCalculator = new ShinynessCalculator();
        const shinynessEffectsTranslator = new ShinynessEffectsTranslator();
        const energyDistanceCalculator = new EnergyDistanceCalculator();
        const energizedConnectionsCalculator = new EnergizedConnectionsCalculator();

        const energyAffectedCircles = ref(new Set());
        const energyAffectedConnections = ref(new Set());

        // Get event handlers
        const eventHandlers = useCircleViewerEventHandlers(props, emit, state.dataStore);

        // Use composables for different feature areas
        const dragResize = useCircleViewerDragResize(props, emit, state.viewerRef, state.viewerWidth, state.dataStore);
        const selection = useCircleViewerSelection(props, state.dataStore, state.viewerContentRef, state.currentCircles, state.viewerWidth);

        // Filter circles to hide members of collapsed groups
        const visibleCircles = computed(() => {
            return state.currentCircles.value.filter(circle => {
                // Show all circles that are not members of collapsed groups
                if (circle.belongsToID) {
                    const parentGroup = state.dataStore.getCircle(circle.belongsToID);
                    // Hide this circle if its parent group is collapsed
                    return !(parentGroup && parentGroup.collapsed === true);
                }
                // Show all non-member circles (including groups themselves)
                return true;
            });
        });

const explicitConnections = computed(() => {
    const entityType = `circle-${props.viewerId}`;
    const connections = explicitConnectionService.getVisualConnectionsForEntityType(entityType);
    return connections;
});

        const allCircles = computed(() => {
            const visible = visibleCircles.value;
            
            return [...visible];
        });

const effectiveCirclePositions = computed(() => {
    const isDragging = entityDragState.value.isDragging;
    const hasDraggedIds = entityDragState.value.draggedEntityIds.length > 0;
    
    if (!isDragging || !hasDraggedIds) {
        return null; // Use real positions from entities
    }
    
    const draggedIds = new Set(entityDragState.value.draggedEntityIds);
    const positionMap = new Map();
    
    allCircles.value.forEach(circle => {
        if (draggedIds.has(circle.id)) {
            const effectivePos = {
                x: circle.x + entityDragState.value.currentDeltas.deltaX,
                y: circle.y + entityDragState.value.currentDeltas.deltaY
            };
            positionMap.set(circle.id, effectivePos);
        }
    });
    
    return positionMap;
});

        const energyDistances = computed(function() { 
            return energyDistancesData.value.circles; 
        });
        const connectionEnergyDistances = computed(() => energyDistancesData.value.connections);

const allConnections = computed(() => {
    const regularConnections = state.viewerConnections.value;
    const explicitConns = explicitConnections.value;
    
    const combined = [...regularConnections, ...explicitConns];
    return combined;
});

const energyDistancesData = computed(() => {
    const result = energyDistanceCalculator.calculateEnergyDistanceForAllCirclesInCircleViewer(
        allCircles.value, 
        allConnections.value
    );
    
    return result;
});

const dampenedCircles = computed(() => energyDistancesData.value.dampenedCircles || new Set());
const dampenerConnections = computed(() => energyDistancesData.value.dampenerConnections || new Map());

const energizedConnectionsData = computed(() => {
    energyEffectsTrigger.value; // Keep reactivity trigger
    
    return energizedConnectionsCalculator.calculateEnergizedConnectionsForCircles(
        allCircles.value, 
        allConnections.value
    );
});


const shinynessEffects = computed(() => {
    if (!state.viewerProperties?.value?.shinynessMode) {
        return new Map();
    }
    
    energyEffectsTrigger.value; // Keep reactivity trigger
    
    const shinynessMap = new Map();
    allCircles.value.forEach(circle => {
        const shinyness = shinynessCalculator.calculateShinyness(
            circle, 
            energyDistances.value,
            dampenedCircles.value  // NEW: Pass dampened circles
        );
        shinynessMap.set(circle.id, shinyness);
    });
    
    const optionsMap = new Map();
    allCircles.value.forEach(circle => {
        const connectionMultiplier = shinynessCalculator.getAdditiveOrConnectionMultiplier(
            circle, 
            energizedConnectionsData.value
        );
        
        optionsMap.set(circle.id, {
            circleType: circle.type,
            circleShinynessReceiveMode: circle.shinynessReceiveMode,
            connectionMultiplier: connectionMultiplier
        });
    });
    
    const result = shinynessEffectsTranslator.translateMultipleShinyness(shinynessMap, optionsMap);
    return result;
});

const energizedCirclesList = computed(() => {
    if (!state.viewerProperties?.value?.shinynessMode) {
        return [];
    }
    
    const list = [];
    
    allCircles.value.forEach(circle => {
        const distances = energyDistances.value.get(circle.id);
        
        // Skip if no energy distances
        if (!distances || Object.keys(distances).length === 0) {
            return;
        }

        if (circle.type !== 'glow') {
            return;
        }
        
        // Skip activated circles (they're sources, not receivers)
        if (circle.activation === 'activated') {
            return;
        }
        
        // Skip inert circles
        if (circle.activation === 'inert') {
            return;
        }
        
        // This circle is receiving energy - collect energy types
        const receivedEnergyTypes = Object.entries(distances)
            .filter(([type, distance]) => distance !== undefined)
            .map(([type, distance]) => {
                const shortNames = {
                    exciter: 'E',
                    dampener: 'D',
                };
                return `${shortNames[type] || type[0].toUpperCase()}:${distance}`;
            })
            .join(' ');
        
        list.push({
            id: circle.id,
            name: circle.name,
            color: circle.color,
            energyTypes: receivedEnergyTypes
        });
    });
    
    // Sort by name for consistency
    return list.sort((a, b) => a.name.localeCompare(b.name));
});

watch(energizedCirclesList, (newList) => {
    // Clear existing timeout
    if (energizedCirclesDebounceTimeout) {
        clearTimeout(energizedCirclesDebounceTimeout);
    }
    
    // Debounce the update
    energizedCirclesDebounceTimeout = setTimeout(() => {
        const currentDoc = state.dataStore.getCircleDocumentForViewer(props.viewerId);
        if (currentDoc) {
            state.dataStore.updateCircleDocumentEnergizedCircles(currentDoc.id, newList);
        }
    }, 200); // 200ms debounce
}, { deep: true });

let lastValidEnergyDistancesData = { circles: new Map(), connections: new Map() };

const getConnectionEnergyClasses = (connectionId) => {
    energyEffectsTrigger.value; // Track dependency
    
    const classes = [];
    
    // Check for exciter energy
    const activeEnergyTypes = shinynessCalculator.getActiveConnectionEnergyTypes(connectionId);
    activeEnergyTypes.forEach(energyType => {
        classes.push(`${energyType}-connection`);
    });
    
    // Check for dampener energy
    const dampenerInfo = dampenerConnections.value.get(connectionId);
    if (dampenerInfo && shinynessCalculator.isDampenerConnectionActive(connectionId)) {
        classes.push('dampener-connection');
    }
    
    return classes;
};

const getShinynessEffectsForCircle = (circle) => {
    energyEffectsTrigger.value;
    
    const effects = shinynessEffects.value.get(circle.id);
    
    if (!effects) {
        return shinynessEffectsTranslator.getNormalValues();
    }
    return effects;
};

        const handleCircleSelectWithMultiSelect = (id, isCtrlClick = false, isShiftClick = false) => {
            // Check for explicit connection creation (ctrl+shift+click)
            if (isCtrlClick && isShiftClick) {

        // CLEAR DRAG STATE IMMEDIATELY when creating connections
        entityDragState.value = {
            isDragging: false,
            draggedEntityIds: [],
            currentDeltas: { deltaX: 0, deltaY: 0 },
            entityType: null,
            viewerId: null
        };

        // Handle explicit connection creation/deletion
        const selectedCircleIds = state.dataStore.getSelectedCircles();
        const selectedEntityType = 'circle';

        const result = explicitConnectionService.handleEntityCtrlClick(
            id, 'circle', selectedCircleIds, selectedEntityType, props.viewerId
        );

        // Don't change selection when ctrl+shift-clicking for connections
        return;
            } else if (isCtrlClick || isShiftClick) {
                const isCurrentlySelected = state.dataStore.isCircleSelected(id);
                
                state.dataStore.selectCircle(id, props.viewerId, true);
                
                return;
            } else {
                // Regular selection behavior (no modifier keys)
                eventHandlers.handleCircleSelect(id, false); // Force non-ctrl behavior for regular selection
            }
        };

        // Create concrete event handlers that depend on selection state
        const handleViewerClick = eventHandlers.createHandleViewerClick(selection.hasRectangleSelected);
        const handleViewerContainerClick = eventHandlers.createHandleViewerContainerClick(selection.hasRectangleSelected);


let lastEnergyDataSnapshot = null;

const createDataSnapshot = (energyData) => {
    if (!energyData) return null;
    
    // Create a serializable snapshot for comparison
    const circleSnapshot = {};
    energyData.circles.forEach((distances, circleId) => {
        circleSnapshot[circleId] = { ...distances };
    });
    
    const connectionSnapshot = {};
    energyData.connections.forEach((distances, connectionId) => {
        connectionSnapshot[connectionId] = { ...distances };
    });
    
    // NEW: Include dampened circles in snapshot
    const dampenedCirclesSnapshot = energyData.dampenedCircles ? 
        Array.from(energyData.dampenedCircles).sort() : [];
    
    // NEW: Include dampener connections in snapshot
    const dampenerConnectionsSnapshot = {};
    if (energyData.dampenerConnections) {
        energyData.dampenerConnections.forEach((info, connectionId) => {
            dampenerConnectionsSnapshot[connectionId] = { 
                dampenerId: info.dampenerId, 
                targetId: info.targetId 
            };
        });
    }
    
    return JSON.stringify({ 
        circles: circleSnapshot, 
        connections: connectionSnapshot,
        dampenedCircles: dampenedCirclesSnapshot,
        dampenerConnections: dampenerConnectionsSnapshot
    });
};

watch(energyDistancesData, (newData, oldData) => {
    const newSnapshot = createDataSnapshot(newData);
    
    // If nothing changed at all, skip entirely
    if (newSnapshot === lastEnergyDataSnapshot) {
        return;
    }
    
    // Check if this is the very first run (no previous snapshot)
    const isInitialLoad = lastEnergyDataSnapshot === null;
    
    lastEnergyDataSnapshot = newSnapshot;
    
    // Perform selective clearing and scheduling based on what changed
    const changedCircles = new Set();
    const changedConnections = new Set();
    
    // Compare circle energy distances
    if (newData.circles && oldData?.circles && !isInitialLoad) {
        // Check for changed or new circles
        newData.circles.forEach((newDistances, circleId) => {
            const oldDistances = oldData.circles.get(circleId);
            if (!oldDistances || !areEnergyDistancesEqual(oldDistances, newDistances)) {
                changedCircles.add(circleId);
            }
        });
        
        // Check for removed circles
        oldData.circles.forEach((oldDistances, circleId) => {
            if (!newData.circles.has(circleId)) {
                changedCircles.add(circleId);
            }
        });
    } else {
        // If we don't have old data or this is initial load, treat all as changed
        if (newData.circles) {
            newData.circles.forEach((_, circleId) => changedCircles.add(circleId));
        }
    }
    
    // Compare connection energy distances
    if (newData.connections && oldData?.connections && !isInitialLoad) {
        // Check for changed or new connections
        newData.connections.forEach((newDistances, connectionId) => {
            const oldDistances = oldData.connections.get(connectionId);
            if (!oldDistances || !areEnergyDistancesEqual(oldDistances, newDistances)) {
                changedConnections.add(connectionId);
            }
        });
        
        // Check for removed connections
        oldData.connections.forEach((oldDistances, connectionId) => {
            if (!newData.connections.has(connectionId)) {
                changedConnections.add(connectionId);
            }
        });
    } else {
        // If we don't have old data or this is initial load, treat all as changed
        if (newData.connections) {
            newData.connections.forEach((_, connectionId) => changedConnections.add(connectionId));
        }
    }
    
    // Check for changes in dampened circles
    if (newData.dampenedCircles && oldData?.dampenedCircles && !isInitialLoad) {
        
        // Check for newly dampened circles
        newData.dampenedCircles.forEach(circleId => {
            if (!oldData.dampenedCircles.has(circleId)) {
                changedCircles.add(circleId);
            }
        });
        
        // Check for circles that are no longer dampened
        oldData.dampenedCircles.forEach(circleId => {
            if (!newData.dampenedCircles.has(circleId)) {
                changedCircles.add(circleId);
            }
        });
    } else {
        // If we don't have old data or this is initial load, treat all dampened circles as changed
        if (newData.dampenedCircles) {
            newData.dampenedCircles.forEach(circleId => changedCircles.add(circleId));
        }
    }
    
    // Only clear delayed states for circles that actually changed
    changedCircles.forEach(circleId => {
        shinynessCalculator.clearDelayedState(circleId);
    });
    
    // Clear connection energy for changed connections
    changedConnections.forEach(connectionId => {
        shinynessCalculator.clearConnectionEnergy(connectionId);
    });
    
    // Schedule new energy effects only for changed entities
    changedCircles.forEach(circleId => {
        const distances = newData.circles.get(circleId);
        if (distances && distances.exciter !== undefined && distances.exciter > 0) {
            // Circle will schedule itself via calculateShinyness
        }
    });
    
    changedConnections.forEach(connectionId => {
        const energyDistance = newData.connections.get(connectionId);
        if (energyDistance) {
            Object.entries(energyDistance).forEach(([energyType, distance]) => {
                shinynessCalculator.scheduleConnectionEnergy(connectionId, energyType, distance);
            });
        }
    });
    
    // Handle dampener connections
    const changedDampenerConnections = new Set();
    
    if (newData.dampenerConnections && newData.dampenerConnections.size > 0) {
        if (isInitialLoad || !oldData?.dampenerConnections) {
            // On initial load or when dampenerConnections first appears, schedule ALL dampener connections
            newData.dampenerConnections.forEach((dampenerInfo, connectionId) => {
                changedDampenerConnections.add(connectionId);
            });
        } else {
            // Check for new or changed dampener connections
            newData.dampenerConnections.forEach((dampenerInfo, connectionId) => {
                const oldDampenerInfo = oldData.dampenerConnections.get(connectionId);
                
                if (!oldDampenerInfo) {
                    changedDampenerConnections.add(connectionId);
                } else if (oldDampenerInfo.dampenerId !== dampenerInfo.dampenerId ||
                           oldDampenerInfo.targetId !== dampenerInfo.targetId) {
                    changedDampenerConnections.add(connectionId);
                }
            });
        }
    }
    
    // Check for removed dampener connections
    if (oldData?.dampenerConnections && oldData.dampenerConnections.size > 0) {
        oldData.dampenerConnections.forEach((dampenerInfo, connectionId) => {
            if (!newData.dampenerConnections || !newData.dampenerConnections.has(connectionId)) {
                shinynessCalculator.clearDampenerConnection(connectionId);
            }
        });
    }
    
    // Schedule animations for changed dampener connections
    changedDampenerConnections.forEach(connectionId => {
        shinynessCalculator.scheduleDampenerConnection(connectionId);
    });
    
    energyEffectsTrigger.value++;
}, { deep: true });

// Helper function to compare energy distance objects
function areEnergyDistancesEqual(distances1, distances2) {
    const keys1 = Object.keys(distances1);
    const keys2 = Object.keys(distances2);
    
    if (keys1.length !== keys2.length) {
        return false;
    }
    
    return keys1.every(key => distances1[key] === distances2[key]);
}

onMounted(() => {
    dragResize.onMounted();
    
    // Set up reactivity trigger for delayed shinyness
    shinynessCalculator.setReactivityTrigger(() => {
        energyEffectsTrigger.value++;
    });
});

onUnmounted(() => {
    dragResize.onUnmounted();
    if (energizedCirclesDebounceTimeout) {
        clearTimeout(energizedCirclesDebounceTimeout);
    }
});

        return {
            ...state,
            entityDragState,
            ...dragResize,
            ...selection,
            visibleCircles,
            allCircles,
            energizedCirclesList,
            explicitConnections,
            allConnections,
            handleViewerClick,
            handleViewerContainerClick,
            handleCircleSelect: handleCircleSelectWithMultiSelect, // UPDATED: Use new multi-select version
            handleCirclePositionUpdate: eventHandlers.handleCirclePositionUpdate,
            handleCircleNameUpdate: eventHandlers.handleCircleNameUpdate,
            handleMoveMultiple: eventHandlers.handleMoveMultiple,
            handleAddCircle: eventHandlers.handleAddCircle,
            handleCircleDocumentChange: eventHandlers.handleCircleDocumentChange,
            handleShowDropdown: eventHandlers.handleShowDropdown,
            handleStartReorder: eventHandlers.handleStartReorder,
            handleCloseViewer: eventHandlers.handleCloseViewer,
            handleEntityDragStart,
            handleEntityDragMove,
            handleEntityDragEnd,
            handleCircleUpdate,
            shinynessEffects,
            getConnectionEnergyClasses,
            getShinynessEffectsForCircle,
            energyDistances,
            energizedConnectionsData,
            connectionEnergyDistances,
            energyEffectsTrigger,
            energyAffectedConnections,
		dampenedCircles,
		dampenerConnections,
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        ViewerControls,
        ConnectionComponent
    },
    template: `
        <div 
            ref="viewerRef"
            :class="[
                'circle-viewer',
                backgroundClass,
                { 
                    selected: isSelected,
                    shiny: viewerProperties && viewerProperties.shinynessMode,
                    'being-dragged': isBeingDragged,
                    'drop-target-left': isDropTarget && dropTargetSide === 'left',
                    'drop-target-right': isDropTarget && dropTargetSide === 'right'
                }
            ]"
            :style="{ width: viewerWidth + 'px' }"
            :data-viewer-id="viewerId"
            @click="handleViewerContainerClick"
            @dragenter="handleDragEnter"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
        >
            <!-- Drop zone indicators -->
            <div class="drop-zone-indicator left"></div>
            <div class="drop-zone-indicator right"></div>
            
            <ViewerControls 
                :viewer-id="viewerId"
                :drag-state="dragState"
                :hovered-document-id="hoveredDocumentId"
                @start-reorder="handleStartReorder"
                @close="handleCloseViewer"
            />
            
            <div 
                ref="viewerContentRef"
                class="viewer-content" 
                @click="handleViewerClick"
            >

            <div 
                v-if="energizedCirclesList.length > 0"
                class="energized-circles-list"
            >
                <div 
                    v-for="circle in energizedCirclesList"
                    :key="circle.id"
                    class="energized-list-item"
                >
                    <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%;" :style="{ backgroundColor: circle.color, }"></div>
                    <span class="energized-circle-name">{{ circle.name }}</span>
                    <!--span class="energized-circle-types">{{ circle.energyTypes }}</span-->
                </div>
            </div>
                <!-- Connection Rendering - Use combined connections (regular + explicit) with drag state -->
 <ConnectionComponent
    v-for="connection in allConnections"
    :key="connection.id"
    :connection="connection"
    :connection-energy-classes="getConnectionEnergyClasses(connection.id)"
    :viewer-width="viewerWidth"
    :entity-drag-state="entityDragState"
    :viewer-id="viewerId"
    :energy-distance="connectionEnergyDistances.get(connection.id) || {}"
    :energy-affected-connections="energyAffectedConnections"
    :circle-energy-distances="energyDistances"
/>               
                <!-- Render filtered circles -->
                <EntityComponent
                    v-for="circle in allCircles"
                    :key="circle.id"
                    :entity="circle"
                    entity-type="circle"
                    :is-selected="dataStore.isCircleSelected(circle.id)"
                    :data-store="dataStore"
                    :viewer-width="viewerWidth"
                    :viewer-id="viewerId"
                    :is-dragging="entityDragState.isDragging && entityDragState.draggedEntityIds.includes(circle.id)"
                    :drag-deltas="entityDragState.currentDeltas"
                    :shinyness-effects="getShinynessEffectsForCircle(circle)"
                    :energy-distance="energyDistances.get(circle.id) || {}"
                    :energized-connections="energizedConnectionsData.get(circle.id) || {}"
                    @select="handleCircleSelect"
                    @update-position="handleCirclePositionUpdate"
                    @update-name="handleCircleNameUpdate"
                    @move-multiple="handleMoveMultiple"
                    @drag-start="handleEntityDragStart"
                    @drag-move="handleEntityDragMove"
                    @drag-end="handleEntityDragEnd"
                    @update-circle="handleCircleUpdate"
                />
                
                <EntityControls 
                    entity-type="circle"
                    :viewer-id="viewerId"
                    @add-entity="handleAddCircle"
                    @document-change="handleCircleDocumentChange"
                    @show-dropdown="handleShowDropdown"
                />
                
                <div 
                    v-if="selectionRect.visible"
                    class="selection-rectangle"
                    :style="getSelectionRectStyle()"
                ></div>
            </div>
            
            <div 
                class="resize-handle"
                @mousedown="startResize"
            ></div>
        </div>
    `
};
