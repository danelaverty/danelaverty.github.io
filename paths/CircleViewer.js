// CircleViewer.js - Updated with roil connection handlers
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
import { CellularAutomatonEngine } from './CellularAutomatonEngine.js';
import { ShinynessEffectsTranslator } from './ShinynessEffectsTranslator.js';
import { CAStepControl } from './CAStepControl.js';
import { calculateGroupShapeScale } from './groupScaleCalculator.js';
import { roilMotionSystem } from './RoilMotionSystem.js';
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
        'drop',
        'open-document-viewer' // NEW: For document reference circles
    ],
    setup(props, { emit }) {
        let shinyCirclesDebounceTimeout = null;
        
        // Get state and computed properties
        const state = useCircleViewerState(props);
        const dataStore = state.dataStore;
        const isDemoMode = computed(() => state.dataStore.isDemoMode());

        const previousRoilAngles = ref(new Map());

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

const getCircleShinyness = (circleId) => {
    // Force reactivity by depending on automatonState
    automatonState.value;
    
    const state = cellularAutomaton.getCircleState(circleId);
    return state.shinyness;
};

const roilGroupSoloStates = computed(() => {
    const soloStates = new Map();
    
    allCircles.value.forEach(circle => {
        if (circle.belongsToID && circle.roilMemberDisplay === 'solo') {
            console.log(`Found solo circle: ${circle.id} (${circle.name}) in group ${circle.belongsToID}`);
            soloStates.set(circle.belongsToID, circle.id);
        }
    });
    
    console.log('Solo states map:', soloStates);
    return soloStates;
});

// Helper function to check if a circle should be hidden due to solo mode
const shouldHideForSoloMode = (circle) => {
    if (!circle.belongsToID) return false;
    
    const soloCircleId = roilGroupSoloStates.value.get(circle.belongsToID);
    const shouldHide = soloCircleId && soloCircleId !== circle.id;
    
    // Debug logging
    if (soloCircleId) {
        console.log(`Circle ${circle.id} (${circle.name}) in group ${circle.belongsToID}:`, {
            soloCircleId,
            shouldHide,
            isTheSoloCircle: soloCircleId === circle.id
        });
    }
    
    return shouldHide;
};

        const explicitConnectionService = new ExplicitConnectionService({
            getCircle: state.dataStore.getCircle,
            getSquare: state.dataStore.getSquare,
            getCirclesForViewer: state.dataStore.getCirclesForViewer,
            saveToStorage: state.dataStore.saveToStorage
        });

        // Initialize cellular automaton engine and effects translator
        const cellularAutomaton = new CellularAutomatonEngine();
        const shinynessEffectsTranslator = new ShinynessEffectsTranslator();

        // State for automaton reactivity
        const automatonState = ref({
            circleStates: new Map(),
            connectionStates: new Map(),
            phase: 'circle'
        });

        // CA step control state
        const batchedChangeCount = ref(0);
        const canStepCA = ref(false);

// Replace the batchedChanges computed property with:
const batchedChanges = computed(() => {
    // Force reactivity by depending on batchedChangeCount
    batchedChangeCount.value;
    return cellularAutomaton.getBatchedChanges();
});

const droneCircles = computed(() => {
    const drones = [];
    
    // Find all roil groups in the current viewer
    const roilGroups = allCircles.value.filter(circle => 
        circle.type === 'group' && 
        circle.roilMode === 'on' &&
        !circle.collapsed // Only generate drones for expanded roil groups
    );
    
    roilGroups.forEach(group => {
        // Calculate the actual rendered size of the group using shared utility
        const baseSize = 32;
        const groupScale = calculateGroupShapeScale(group, dataStore);
        const actualSize = baseSize * groupScale;
        
        // Position drones within the group's rendered bounds
        const spread = actualSize * 0.7; // 70% of the group's size
        
        // Generate exactly 5 drone circles per roil group
        for (let i = 0; i < 10; i++) {
            const drone = {
                id: `drone_${group.id}_${i}`,
                type: 'glow', // Use glow type like feelings
                name: '', // Unnamed
                color: '#333', // Gray color for unnamed state
                x: group.x + (Math.random() - 0.5) * spread,
                y: group.y + (Math.random() - 0.5) * spread,
                belongsToID: group.id, // Belong to the roil group
                isDrone: true, // Flag to identify as drone
                // Make drones smaller and varied
                _droneScale: 0.6 + Math.random() * 0.2, // 0.6 to 0.8 scale
                // Prevent all interaction
                _nonInteractive: true
            };
            
            drones.push(drone);
        }
    });
    
    return drones;
});

        // Get cascade mode from global properties
        const cascadeMode = computed(() => dataStore.getGlobalProperty('cascadeMode'));

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

        const allConnections = computed(() => {
            const regularConnections = state.viewerConnections.value;
            const explicitConns = explicitConnections.value;
            
            const combined = [...regularConnections, ...explicitConns];
            return combined;
        });

        // Shinyness effects computed property using cellular automaton
        const shinynessEffects = computed(() => {
            if (!state.viewerProperties?.value?.shinynessMode) {
                return new Map();
            }
            
            // Force reactivity on automaton state
            automatonState.value;
            
            // Get numeric shinyness values from automaton
            const shinynessMap = cellularAutomaton.getAllCircleShininessNumeric();
            
            // Build options map
            const optionsMap = new Map();
            allCircles.value.forEach(circle => {
                optionsMap.set(circle.id, {
                    circleType: circle.type,
                    circleShinynessReceiveMode: circle.shinynessReceiveMode,
                });
            });
            
            // Translate to visual effects
            return shinynessEffectsTranslator.translateMultipleShinyness(shinynessMap, optionsMap);
        });

// Add this new computed property alongside shinynessEffects
const partiallyExcitedCircles = computed(() => {
    const partiallyExcitedSet = new Set();
    
    // Force reactivity on automaton state
    automatonState.value;
    
    allCircles.value.forEach(circle => {
        const circleState = cellularAutomaton.getCircleState(circle.id);
        if (circleState.partiallyExcited) {
            partiallyExcitedSet.add(circle.id);
        }
    });
    
    return partiallyExcitedSet;
});

const isCirclePartiallyExcited = (circleId) => {
    return partiallyExcitedCircles.value.has(circleId);
};

        // Shiny circles list for display
        const shinyCirclesList = computed(() => {
            if (!state.viewerProperties?.value?.shinynessMode) {
                return [];
            }
            
            // Force reactivity
            automatonState.value;
            
            const list = [];
            
            allCircles.value.forEach(circle => {
                const circleState = cellularAutomaton.getCircleState(circle.id);
                
                // Skip if not shiny
                if (circleState.shinyness !== 'shiny') {
                    return;
                }

                // Only include glow circles
                if (circle.type !== 'glow') {
                    return;
                }
                
                list.push({
                    id: circle.id,
                    name: circle.name,
                    color: circle.color
                });
            });
            
            // Sort by name for consistency
            return list.sort((a, b) => a.name.localeCompare(b.name));
        });

        watch(shinyCirclesList, (newList) => {
            // Clear existing timeout
            if (shinyCirclesDebounceTimeout) {
                clearTimeout(shinyCirclesDebounceTimeout);
            }
            
            // Debounce the update
            shinyCirclesDebounceTimeout = setTimeout(() => {
                const currentDoc = state.dataStore.getCircleDocumentForViewer(props.viewerId);
                if (currentDoc) {
                    state.dataStore.updateCircleDocumentShinyCircles(currentDoc.id, newList);
                }
            }, 200); // 200ms debounce
        }, { deep: true });

watch(
    () => allCircles.value.filter(circle => circle.type === 'group' && circle.roilMode === 'on'),
    (currentGroups, previousGroups) => {
        currentGroups.forEach(group => {
            const currentAngle = group.roilAngle;
            const previousAngle = previousRoilAngles.value.get(group.id);
            
            // If roilAngle changed, trigger smooth transition
            if (previousAngle && previousAngle !== currentAngle) {
                console.log(`Detected roilAngle change for group ${group.id}: ${previousAngle} → ${currentAngle}`);
                
                // Import the roilMotionSystem and trigger transition
                roilMotionSystem.transitionRoilAngle(group.id, previousAngle, currentAngle, 800);
            }
            
            // Update tracking
            previousRoilAngles.value.set(group.id, currentAngle);
        });
    },
    { deep: true, immediate: true }
);

        // Get connection energy classes
        const getConnectionEnergyClasses = (connectionId) => {
            // Force reactivity on automaton state
            automatonState.value;
            
            return cellularAutomaton.getConnectionEnergyClasses(connectionId);
        };

        // Get shinyness effects for a circle
        const getShinynessEffectsForCircle = (circle) => {
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

        // CA step control handler
const handleCAStep = () => {
    cellularAutomaton.stepManual();
    updateCAControlState();
};

// CA step specific handler - NEW
const handleCAStepSpecific = (index) => {
    cellularAutomaton.applyBatchedChangeByIndex(index);
    updateCAControlState();
};

        // Helper to update CA control state
        const updateCAControlState = () => {
            batchedChangeCount.value = cellularAutomaton.getBatchedChangeCount();
            canStepCA.value = cellularAutomaton.canStep();
        };

        // Automaton state change callback that also updates control state
        const onAutomatonStateChange = (newState) => {
            automatonState.value = newState;
            updateCAControlState();
        };

        // Watch for shinyness mode changes to start/stop automaton
        watch(() => state.viewerProperties?.value?.shinynessMode, (shinynessMode) => {
            if (shinynessMode) {
                // Set cascade mode before starting
                cellularAutomaton.setCascadeMode(cascadeMode.value);
                
                // Start the automaton
                cellularAutomaton.start(
                    allCircles.value,
                    allConnections.value,
                    onAutomatonStateChange
                );
                dataStore.setAutomatonTrigger(() => {
                    cellularAutomaton.triggerImmediateIteration();
                });
                
                // Update control state after starting
                updateCAControlState();
            } else {
                // Stop the automaton
                cellularAutomaton.stop();
                dataStore.setAutomatonTrigger(null);
                updateCAControlState();
            }
        }, { immediate: true });

        // Watch for cascade mode changes
        watch(cascadeMode, (newMode) => {
            if (cellularAutomaton.isActive()) {
                cellularAutomaton.setCascadeMode(newMode);
                updateCAControlState();
            }
        }, { immediate: true });

        // Watch for data changes to update automaton
        watch([allCircles, allConnections], () => {
            if (cellularAutomaton.isActive()) {
                cellularAutomaton.updateData(
                    allCircles.value,
                    allConnections.value
                );
            }
        }, { deep: true });

watch(
    () => allCircles.value.filter(circle => circle.type === 'group' && circle.roilMode === 'on'),
    (currentGroups) => {
        currentGroups.forEach(group => {
            const isAnimationPaused = group.roilAnimation === 'pause';
            
            if (isAnimationPaused) {
                roilMotionSystem.pauseGroup(group.id);
            } else {
                roilMotionSystem.resumeGroup(group.id);
            }
        });
    },
    { deep: true, immediate: true }
);

        onMounted(() => {
            dragResize.onMounted();
            
            // Start automaton if shinyness mode is enabled
            if (state.viewerProperties?.value?.shinynessMode) {
                cellularAutomaton.start(
                    allCircles.value,
                    allConnections.value,
                    onAutomatonStateChange
                );
                dataStore.setAutomatonTrigger(() => {
                    cellularAutomaton.triggerImmediateIteration();
                });
            }
        });

        onUnmounted(() => {
            dragResize.onUnmounted();
            cellularAutomaton.stop();
            dataStore.setAutomatonTrigger(null);
            
            if (shinyCirclesDebounceTimeout) {
                clearTimeout(shinyCirclesDebounceTimeout);
            }
        });

        // NEW: Handler to pass through open-document-viewer event from document reference circles
        const handleOpenDocumentViewer = (documentId) => {
            emit('open-document-viewer', documentId);
        };

        // NEW: Handlers for roil connection creation and deletion
        const handleCreateRoilConnection = (event) => {
            const { clickedEntityId, selectedEntityIds, viewerId } = event;
            
            // Use the explicit connection service to create connections
            selectedEntityIds.forEach(selectedId => {
                const result = explicitConnectionService.handleEntityCtrlClick(
                    clickedEntityId, 'circle', [selectedId], 'circle', viewerId
                );
                
                if (result && result.action === 'create') {
                    console.log('Created roil connection:', result);
                }
            });
        };

        const handleDeleteGroupConnection = (event) => {
            const { connectionId, circleId, groupId } = event;
            
            // Delete the explicit connection
            const connections = explicitConnectionService.getConnectionsForEntity(circleId);
            const connectionToDelete = connections.find(conn => conn.id === connectionId);
            
            if (connectionToDelete) {
                const result = explicitConnectionService.deleteConnections([connectionToDelete]);
                console.log('Deleted group connection:', result);
            }
        };

        return {
            ...state,
            entityDragState,
            ...dragResize,
            ...selection,
            visibleCircles,
            allCircles,
            shinyCirclesList,
            explicitConnections,
            allConnections,
            handleViewerClick,
            handleViewerContainerClick,
            handleCircleSelect: handleCircleSelectWithMultiSelect,
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
            getCircleShinyness,
            shinynessEffects,
            getConnectionEnergyClasses,
            getShinynessEffectsForCircle,
            automatonState,
            cellularAutomaton,
            isDemoMode,
            batchedChangeCount,
            batchedChanges,
            canStepCA,
            handleCAStep,
            handleCAStepSpecific,
            partiallyExcitedCircles,
            isCirclePartiallyExcited,
            handleOpenDocumentViewer, // NEW: Pass through document viewer opening
            droneCircles,
            handleCreateRoilConnection, // NEW: Handle roil connection creation
            handleDeleteGroupConnection, // NEW: Handle group connection deletion
            shouldHideForSoloMode,
            roilGroupSoloStates,
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        ViewerControls,
        ConnectionComponent,
        CAStepControl
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
                    v-if="shinyCirclesList.length > 0"
                    class="shiny-circles-list"
                >
                    <div 
                        v-for="circle in shinyCirclesList"
                        :key="circle.id"
                        class="shiny-list-item"
                    >
                        <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%;" :style="{ backgroundColor: circle.color, }"></div>
                        <span class="shiny-circle-name">{{ circle.name }}</span>
                    </div>
                </div>
                
                <!-- Connection Rendering -->
<ConnectionComponent
    v-for="connection in allConnections"
    :key="connection.id"
    :connection="connection"
    :connection-energy-classes="getConnectionEnergyClasses(connection.id)"
    :viewer-width="viewerWidth"
    :entity-drag-state="entityDragState"
    :viewer-id="viewerId"
    :demo-mode="isDemoMode"
    :get-circle-shinyness="getCircleShinyness"
/>
                
                <!-- Entity Rendering -->
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
    :is-partially-excited="isCirclePartiallyExcited(circle.id)"
    :demo-mode="isDemoMode"
    :is-hidden-for-solo="shouldHideForSoloMode(circle)"
    @select="handleCircleSelect"
    @update-position="handleCirclePositionUpdate"
    @update-name="handleCircleNameUpdate"
    @move-multiple="handleMoveMultiple"
    @drag-start="handleEntityDragStart"
    @drag-move="handleEntityDragMove"
    @drag-end="handleEntityDragEnd"
    @update-circle="handleCircleUpdate"
    @open-document-viewer="handleOpenDocumentViewer"
    @create-roil-connection="handleCreateRoilConnection"
    @delete-group-connection="handleDeleteGroupConnection"
/>
                
                <EntityComponent
                    v-for="droneCircle in droneCircles"
                    :key="droneCircle.id"
                    :entity="droneCircle"
                    :entity-type="'circle'"
                    :is-drone="true"
                    :viewer-width="viewerWidth"
                    :viewer-id="viewerId"
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
            
<CAStepControl
    :batched-change-count="batchedChangeCount"
    :batched-changes="batchedChanges"
    :can-step="canStepCA"
    :circles="allCircles"
    :connections="allConnections"
    @step="handleCAStep"
    @step-specific="handleCAStepSpecific"
/>
        </div>
    `
};
