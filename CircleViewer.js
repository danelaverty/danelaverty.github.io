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


const shinynessEffects = computed(() => {

console.log('=== shinynessEffects computed running ===');
    
    if (!state.viewerProperties?.value?.shinynessMode) {
        console.log('Shinyness mode is OFF, returning empty map');
        return new Map();
    }
    
    if (entityDragState.value.isDragging) {
        console.log('Currently dragging, returning cached value');
        return shinynessEffects.value || new Map();
    }
    
    energyEffectsTrigger.value;
    console.log('Energy effects trigger value:', energyEffectsTrigger.value);
    
    const shinynessMap = new Map();
    console.log('Processing circles for shinyness:', allCircles.value.map(c => ({ id: c.id, activation: c.activation })));
    
    allCircles.value.forEach(circle => {
        const shinyness = shinynessCalculator.calculateShinyness(
            circle, 
            energyDistances.value
        );
        console.log(`Circle ${circle.id}: activation=${circle.activation}, calculated shinyness=${shinyness}`);
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
    console.log('Final shinyness effects map:', Array.from(result.entries()));
    return result;
});
let lastValidEnergyDistancesData = { circles: new Map(), connections: new Map() };

const energyDistancesData = computed(() => {
    // Only skip recalculation for actual position dragging with entities being moved
    const isActualPositionDrag = entityDragState.value.isDragging && 
                                entityDragState.value.draggedEntityIds && 
                                entityDragState.value.draggedEntityIds.length > 0;
    
    if (isActualPositionDrag) {
        return lastValidEnergyDistancesData;
    }
    
    const result = energyDistanceCalculator.calculateEnergyDistanceForAllCirclesInCircleViewer(
        allCircles.value, 
        allConnections.value
    );
    
    lastValidEnergyDistancesData = result;
    return result;
});

const energizedConnectionsData = computed(() => {
    // Don't recalculate during drag
    if (entityDragState.value.isDragging) {
        return energizedConnectionsData.value || new Map();
    }
    
    energyEffectsTrigger.value;
    
    return energizedConnectionsCalculator.calculateEnergizedConnectionsForCircles(
        allCircles.value, 
        allConnections.value,
    );
});

        const energyDistances = computed(() => energyDistancesData.value.circles);
        const connectionEnergyDistances = computed(() => energyDistancesData.value.connections);


const getConnectionEnergyClasses = (connectionId) => {
    energyEffectsTrigger.value; // Track dependency
    
    const activeEnergyTypes = shinynessCalculator.getActiveConnectionEnergyTypes(connectionId);
    const classes = [];
    
    activeEnergyTypes.forEach(energyType => {
        classes.push(`${energyType}-connection`);
    });
    
    return classes;
};

const getShinynessEffectsForCircle = (circle) => {
    energyEffectsTrigger.value;
    
    const effects = shinynessEffects.value.get(circle.id);
    console.log(`Getting effects for circle ${circle.id}: activation=${circle.activation}`, effects);
    
    if (!effects) {
        return shinynessEffectsTranslator.getNormalValues();
    }
    return effects;
};

        const allCircles = computed(() => {
            const visible = visibleCircles.value;
            
            return [...visible];
        });

        // Combine regular connections with explicit connections
const allConnections = computed(() => {
    const regularConnections = state.viewerConnections.value;
    const explicitConns = explicitConnections.value;
    
    const combined = [...regularConnections, ...explicitConns];
    return combined;
});

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

        // Force energy recalculation by triggering nextTick
        nextTick(() => {
            console.log('🔗 Forcing energy recalculation after connection creation');
            // The energyDistancesData computed will now run with isDragging: false
        });

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
    
    return JSON.stringify({ circles: circleSnapshot, connections: connectionSnapshot });
};

watch(energyDistancesData, (newData, oldData) => {
    shinynessCalculator.clearAllDelayedStates(); // Restore this
    
    const newSnapshot = createDataSnapshot(newData);
    if (newSnapshot !== lastEnergyDataSnapshot) {
        lastEnergyDataSnapshot = newSnapshot;
        
        // Schedule connection energy effects
        if (newData.connections) {
            newData.connections.forEach((energyDistance, connectionId) => {
                Object.entries(energyDistance).forEach(([energyType, distance]) => {
                    shinynessCalculator.scheduleConnectionEnergy(connectionId, energyType, distance);
                });
            });
        }
        
        energyEffectsTrigger.value++;
    }
}, { deep: true });

onMounted(() => {
    dragResize.onMounted();
    
    // Set up reactivity trigger for delayed shinyness
    shinynessCalculator.setReactivityTrigger(() => {
        energyEffectsTrigger.value++;
    });
});

        onUnmounted(() => {
            dragResize.onUnmounted();
        });

        return {
            // State
            ...state,
            // Entity drag state
            entityDragState,
            // Composable functionality
            ...dragResize,
            ...selection,
            // Filtered circle lists
            visibleCircles,
            allCircles, // Updated to use filtered version
            // Explicit connections
            explicitConnections,
            allConnections,
            // Event handlers (both factory-created and direct)
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
            // Entity drag event handlers
            handleEntityDragStart,
            handleEntityDragMove,
            handleEntityDragEnd,
            shinynessEffects,
            getConnectionEnergyClasses,
            getShinynessEffectsForCircle,
            energyDistances,
            energizedConnectionsData,
            connectionEnergyDistances,
            energyEffectsTrigger,
            energyAffectedConnections,
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
