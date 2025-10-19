// CircleViewer.js - Updated with cellular automaton system and manual cascade mode
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
        let energizedCirclesDebounceTimeout = null;
        
        // Get state and computed properties
        const state = useCircleViewerState(props);
        const dataStore = state.dataStore;
        const isDemoMode = computed(() => state.dataStore.isDemoMode());

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
                    connectionMultiplier: 1 // No longer using energized connections multiplier
                });
            });
            
            // Translate to visual effects
            return shinynessEffectsTranslator.translateMultipleShinyness(shinynessMap, optionsMap);
        });

        // Energized circles list for display
        const energizedCirclesList = computed(() => {
            if (!state.viewerProperties?.value?.shinynessMode) {
                return [];
            }
            
            // Force reactivity
            automatonState.value;
            
            const list = [];
            
            allCircles.value.forEach(circle => {
                const circleState = cellularAutomaton.getCircleState(circle.id);
                
                // Skip if not energized
                if (circleState.energized === 'unenergized') {
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
                
                list.push({
                    id: circle.id,
                    name: circle.name,
                    color: circle.color,
                    energyTypes: circleState.energized // 'excited' or 'dampened'
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
                    :demo-mode="isDemoMode"
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
