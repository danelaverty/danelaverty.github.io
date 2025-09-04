// CircleViewer.js - Updated with ctrl+click multi-select, ctrl+shift+click explicit connections, and collapsed group filtering
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

        // Get event handlers
        const eventHandlers = useCircleViewerEventHandlers(props, emit, state.dataStore);

        // Use composables for different feature areas
        const dragResize = useCircleViewerDragResize(props, emit, state.viewerRef, state.viewerWidth, state.dataStore);
        const selection = useCircleViewerSelection(props, state.dataStore, state.viewerContentRef, state.currentCircles, state.viewerWidth);
        const animations = useCircleViewerAnimations(props.viewerId, state.dataStore);

        // NEW: Filter circles to hide members of collapsed groups
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

        // NEW: Enhanced allCircles that includes animation copies but filters collapsed group members
        const allCircles = computed(() => {
            const visible = visibleCircles.value;
            
            // Safety check for animation copies
            if (!state.animationCopies || !state.animationCopies.value) {
                return visible;
            }
            
            const animationCopies = state.animationCopies.value;
            
            // Filter animation copies to also respect collapsed groups
            const visibleAnimationCopies = animationCopies.filter(copy => {
                if (copy.belongsToID) {
                    const parentGroup = state.dataStore.getCircle(copy.belongsToID);
                    return !(parentGroup && parentGroup.collapsed === true);
                }
                return true;
            });
            
            return [...visible, ...visibleAnimationCopies];
        });

        // Get explicit connections for this viewer
        const explicitConnections = computed(() => {
            // Get explicit connections for circles in this viewer
            const entityType = `circle-${props.viewerId}`;
            return state.dataStore.getExplicitConnectionsForEntityType(entityType);
        });

        // Combine regular connections with explicit connections
        const allConnections = computed(() => {
            // Get regular proximity-based connections
            const regularConnections = state.viewerConnections.value;
            
            // Get explicit connections
            const explicitConns = explicitConnections.value;
            
            // Combine both types
            return [...regularConnections, ...explicitConns];
        });

        // UPDATED: Enhanced circle select handler with ctrl+click multi-select and ctrl+shift+click explicit connections
        const handleCircleSelectWithMultiSelect = (id, isCtrlClick = false, isShiftClick = false) => {
            // Check for explicit connection creation (ctrl+shift+click)
            if (isCtrlClick && isShiftClick) {
                // Handle explicit connection creation/deletion
                const selectedCircleIds = state.dataStore.getSelectedCircles();
                const selectedEntityType = 'circle';
                
                const result = state.dataStore.handleEntityCtrlClick(
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
            // Entity drag state
            entityDragState,
            // Composable functionality
            ...dragResize,
            ...selection,
            ...animations,
            // NEW: Filtered circle lists
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
                <!-- Connection Rendering - Use combined connections (regular + explicit) with drag state -->
                <ConnectionComponent
                    v-for="connection in allConnections"
                    :key="connection.id"
                    :connection="connection"
                    :viewer-width="viewerWidth"
                    :entity-drag-state="entityDragState"
                />
                
                <!-- Render filtered circles (original + animation copies, excluding hidden group members) -->
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
