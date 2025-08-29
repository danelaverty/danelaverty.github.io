// CircleViewer.js - Pure Vue component shell and template (Updated with drag state management and ExplicitConnection support)
import { onMounted, onUnmounted, computed, ref } from './vue-composition-api.js';
import { useCircleViewerDragResize } from './CircleViewerDragResize.js';
import { useCircleViewerSelection } from './CircleViewerSelection.js';
import { useCircleViewerAnimations } from './CircleViewerAnimations.js';
import { useCircleViewerState } from './CircleViewerState.js';
import { useCircleViewerEventHandlers } from './CircleViewerEventHandlers.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { ViewerControls } from './ViewerControls.js';
import { ConnectionComponent } from './ConnectionComponent.js';
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
        // Get state and computed properties
        const state = useCircleViewerState(props);
        
        // NEW: Entity drag state management
        const entityDragState = ref({
            isDragging: false,
            draggedEntityIds: [],
            currentDeltas: { deltaX: 0, deltaY: 0 },
            entityType: null,
            viewerId: null
        });

        // NEW: Handle entity drag events
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

        // Get event handlers
        const eventHandlers = useCircleViewerEventHandlers(props, emit, state.dataStore);

        // Use composables for different feature areas
        const dragResize = useCircleViewerDragResize(props, emit, state.viewerRef, state.viewerWidth, state.dataStore);
        const selection = useCircleViewerSelection(props, state.dataStore, state.viewerContentRef, state.currentCircles, state.viewerWidth);
        const animations = useCircleViewerAnimations(props.viewerId, state.dataStore);

        // NEW: Get explicit connections for this viewer
        const explicitConnections = computed(() => {
            // Get explicit connections for circles in this viewer
            const entityType = `circle-${props.viewerId}`;
            return state.dataStore.getExplicitConnectionsForEntityType(entityType);
        });

        // NEW: Combine regular connections with explicit connections
        const allConnections = computed(() => {
            // Get regular proximity-based connections
            const regularConnections = state.viewerConnections.value;
            
            // Get explicit connections
            const explicitConns = explicitConnections.value;
            
            // Combine both types
            return [...regularConnections, ...explicitConns];
        });

        // NEW: Enhanced circle select handler that supports ctrl-click for explicit connections
        const handleCircleSelectWithExplicitConnections = (id, isCtrlClick = false) => {
            if (isCtrlClick) {
                // Handle explicit connection creation/deletion
                const selectedCircleIds = state.dataStore.getSelectedCircles();
                const selectedEntityType = 'circle';
                
                const result = state.dataStore.handleEntityCtrlClick(
                    id, 'circle', selectedCircleIds, selectedEntityType, props.viewerId
                );
                
                console.log('Explicit connection result:', result);
                
                // Don't change selection when ctrl-clicking for connections
                return;
            }
            
            // Regular selection behavior (non-ctrl click)
            eventHandlers.handleCircleSelect(id, false); // Force non-ctrl behavior
        };

        // Create concrete event handlers that depend on selection state
        const handleViewerClick = eventHandlers.createHandleViewerClick(selection.hasRectangleSelected);
        const handleViewerContainerClick = eventHandlers.createHandleViewerContainerClick(selection.hasRectangleSelected);

        onMounted(() => {
            dragResize.onMounted();
            animations.onMounted();
        });

        onUnmounted(() => {
            dragResize.onUnmounted();
            animations.onUnmounted();
        });

        return {
            // State
            ...state,
            // NEW: Entity drag state
            entityDragState,
            // Composable functionality
            ...dragResize,
            ...selection,
            ...animations,
            // NEW: Explicit connections
            explicitConnections,
            allConnections,
            // Event handlers (both factory-created and direct)
            handleViewerClick,
            handleViewerContainerClick,
            handleCircleSelect: handleCircleSelectWithExplicitConnections, // UPDATED: Use explicit connection version
            handleCirclePositionUpdate: eventHandlers.handleCirclePositionUpdate,
            handleCircleNameUpdate: eventHandlers.handleCircleNameUpdate,
            handleMoveMultiple: eventHandlers.handleMoveMultiple,
            handleAddCircle: eventHandlers.handleAddCircle,
            handleCircleDocumentChange: eventHandlers.handleCircleDocumentChange,
            handleShowDropdown: eventHandlers.handleShowDropdown,
            handleStartReorder: eventHandlers.handleStartReorder,
            handleCloseViewer: eventHandlers.handleCloseViewer,
            // NEW: Entity drag event handlers
            handleEntityDragStart,
            handleEntityDragMove,
            handleEntityDragEnd
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
                <!-- Connection Rendering - UPDATED: Use combined connections (regular + explicit) with drag state -->
                <ConnectionComponent
                    v-for="connection in allConnections"
                    :key="connection.id"
                    :connection="connection"
                    :viewer-width="viewerWidth"
                    :entity-drag-state="entityDragState"
                />
                
                <!-- Render all circles (original + animation copies) -->
                <EntityComponent
                    v-for="circle in allCircles"
                    :key="circle.id"
                    :entity="circle"
                    entity-type="circle"
                    :is-selected="dataStore.isCircleSelected(circle.id)"
                    :viewer-width="viewerWidth"
                    :viewer-id="viewerId"
                    :class="{
                        'animation-copy': isAnimationCopy(circle),
                        'animation-dimmed': isCircleDimmed(circle)
                    }"
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
