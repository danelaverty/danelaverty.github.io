// CircleViewer.js - Enhanced with drop target highlighting and document-based properties
import { ref, computed, onMounted, onUnmounted, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { useConnectionUpdater, useConnections } from './useConnections.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { ViewerControls } from './ViewerControls.js';
import { ConnectionComponent } from './ConnectionComponent.js';
import { injectComponentStyles } from './styleUtils.js';

// Enhanced component styles with drop target highlighting
const componentStyles = `
    .circle-viewer {
        position: relative;
        height: 100vh;
        background-color: #111;
        border-right: 2px solid #333;
        flex-shrink: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .circle-viewer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('silhouette.svg');
        background-repeat: no-repeat;
        background-position: center 45px;
        opacity: 0.3;
        pointer-events: none;
        z-index: 0;
        transition: opacity 0.3s ease;
    }

    .circle-viewer.hide-background::before {
        opacity: 0;
    }

    .circle-viewer.selected {
        background-color: #131313;
        border-right-color: #444;
    }

    /* Drop target highlighting styles */
    .circle-viewer.drop-target-left {
        border-left: 4px solid #4CAF50;
        background-color: rgba(76, 175, 80, 0.05);
        transform: translateX(2px);
    }

    .circle-viewer.drop-target-right {
        border-right: 4px solid #4CAF50;
        background-color: rgba(76, 175, 80, 0.05);
        transform: translateX(-2px);
    }

    .circle-viewer.being-dragged {
        opacity: 0.7;
        transform: scale(0.98);
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    /* Drop zone indicators */
    .drop-zone-indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(
            to bottom,
            transparent 0%,
            #4CAF50 20%,
            #4CAF50 80%,
            transparent 100%
        );
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        z-index: 1001;
    }

    .drop-zone-indicator.left {
        left: -2px;
    }

    .drop-zone-indicator.right {
        right: -2px;
    }

    .circle-viewer.drop-target-left .drop-zone-indicator.left,
    .circle-viewer.drop-target-right .drop-zone-indicator.right {
        opacity: 1;
        animation: pulse-glow 1.5s infinite;
    }

    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
        }
        50% {
            box-shadow: 0 0 16px rgba(76, 175, 80, 0.9);
        }
    }

    .viewer-content {
        flex: 1;
        position: relative;
        margin-top: 40px;
        overflow: hidden;
        transition: margin-top 0.2s ease;
    }

    .circle-viewer::before {
        background-position: center 45px;
        transition: background-position 0.2s ease;
    }

    .resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        width: 4px;
        height: 100%;
        cursor: ew-resize;
        z-index: 1001;
        background-color: transparent;
        transition: background-color 0.2s ease;
    }

    .resize-handle:hover {
        background-color: #4CAF50;
    }

	.circle-viewer.resizing {
		transition: none !important;
	}

    /* Hide resize handle during drag operations */
    .circle-viewer.drop-target-left .resize-handle,
    .circle-viewer.drop-target-right .resize-handle,
    .circle-viewer.being-dragged .resize-handle {
        opacity: 0;
        pointer-events: none;
    }

    /* Rectangle selection styles */
    .selection-rectangle {
        position: absolute;
        border: 1px dashed #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
        pointer-events: none;
        z-index: 1000;
    }
`;

injectComponentStyles('circle-viewer', componentStyles);

export const CircleViewer = {
    props: {
        viewerId: {
            type: String,
            required: true
        },
        // New props for drag and drop state
        dragState: {
            type: Object,
            default: () => ({
                isDragging: false,
                draggedViewerId: null,
                dropTarget: null // 'left', 'right', or null
            })
        }
    },
    emits: [
        'start-reorder',
        'close-viewer',
        'resize',
        'viewer-click',
        'show-dropdown',
        // New drag and drop events
        'drag-enter',
        'drag-leave',
        'drop'
    ],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isResizing = ref(false);
        const resizeStart = ref({ x: 0, width: 0 });
        const viewerContentRef = ref(null);
        const viewerRef = ref(null);
        
        // Width threshold for compact mode (should match ViewerControls)
        const COMPACT_THRESHOLD = 200;

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        
        // NEW: Get viewer properties from the document instead of the viewer object
        const viewerProperties = computed(() => {
            return dataStore.getViewerProperties(props.viewerId);
        });
        
        const viewerWidth = computed(() => viewerProperties.value.width);
        const showBackground = computed(() => viewerProperties.value.showBackground);
        
        const currentCircles = computed(() => {
            const circles = dataStore.getCirclesForViewer(props.viewerId);
            return circles;
        });
        
        const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));
        
        // Check if controls should be in compact mode
        const isCompactMode = computed(() => {
            return viewerWidth.value < COMPACT_THRESHOLD;
        });

        // Drag state computed properties
        const isBeingDragged = computed(() => {
            return props.dragState.isDragging && props.dragState.draggedViewerId === props.viewerId;
        });

        const isDropTarget = computed(() => {
            return props.dragState.isDragging && 
                   props.dragState.draggedViewerId !== props.viewerId &&
                   props.dragState.dropTarget === props.viewerId;
        });

        const dropTargetSide = computed(() => {
            if (!isDropTarget.value) return null;
            return props.dragState.dropSide || 'right';
        });

        // Connection management for circles
        const { connections, connectionManager } = useConnections();
        
        // Filter connections to show only connections for this specific viewer
        const viewerConnections = computed(() => {
            // Filter for this viewer's circle connections specifically
            const viewerEntityType = `circle-${props.viewerId}`;
            const viewerCircleConnections = connections.value.filter(c => c.entityType === viewerEntityType);
            
            // Additional filtering to ensure both entities are still in this viewer (in case of deletions)
            const currentCircleIds = new Set(currentCircles.value.map(c => c.id));
            const filtered = viewerCircleConnections.filter(connection => {
                const hasEntity1 = currentCircleIds.has(connection.entity1Id);
                const hasEntity2 = currentCircleIds.has(connection.entity2Id);
                
                return hasEntity1 && hasEntity2;
            });
            
            return filtered;
        });
        
        // Set up connection updates with viewer-specific entity type to avoid conflicts
        const { updateConnections } = useConnectionUpdater(
            () => {
                const circles = currentCircles.value;
                return circles;
            },
            `circle-${props.viewerId}`, // Use viewer-specific entity type
            { 
                watchEntities: true, 
                immediate: true,
                debounceMs: 30
            }
        );

        // Store initial selection state for Ctrl+drag operations
        let initialSelectedIds = new Set();
        let hasRectangleSelected = false;
        
        // Helper function to check if a circle intersects with a rectangle
        const isCircleIntersecting = (circle, rect) => {
            const circleSize = 60;
            const centerX = viewerWidth.value / 2;
            const absoluteX = circle.x + centerX;
            
            const circleLeft = absoluteX;
            const circleTop = circle.y;
            const circleRight = absoluteX + circleSize;
            const circleBottom = circle.y + circleSize;
            
            return !(circleRight < rect.left || 
                    circleLeft > rect.right || 
                    circleBottom < rect.top || 
                    circleTop > rect.bottom);
        };

        // Real-time selection during drag
        const handleSelectionUpdate = (rect, isCtrlClick) => {
            if (!rect || rect.width < 5 || rect.height < 5) return;
            
            const intersectingIds = [];
            currentCircles.value.forEach(circle => {
                if (isCircleIntersecting(circle, rect)) {
                    intersectingIds.push(circle.id);
                }
            });

            let finalSelection;
            if (isCtrlClick) {
                finalSelection = [...new Set([...initialSelectedIds, ...intersectingIds])];
            } else {
                finalSelection = intersectingIds;
            }

            if (finalSelection.length > 0) {
                dataStore.selectCircle(null, props.viewerId, false);
                
                finalSelection.forEach((id, index) => {
                    dataStore.selectCircle(id, props.viewerId, index > 0);
                });
            } else if (!isCtrlClick) {
                dataStore.selectCircle(null, props.viewerId, false);
            }
        };

        // Initialize selection state when drag starts
        const handleSelectionStart = (isCtrlClick) => {
            initialSelectedIds = new Set(dataStore.getSelectedCircles());
            hasRectangleSelected = false;
            
            if (!isCtrlClick) {
                dataStore.selectCircle(null, props.viewerId, false);
            }
        };

        // Finalize selection when drag ends
        const handleSelectionComplete = (rect, isCtrlClick) => {
            const wasRectangleSelection = rect.width >= 5 && rect.height >= 5;
            
            if (!wasRectangleSelection) {
                if (!isCtrlClick) {
                    dataStore.selectCircle(null, props.viewerId, false);
                }
            } else {
                hasRectangleSelected = true;
                
                setTimeout(() => {
                    hasRectangleSelected = false;
                }, 100);
            }
            
            dataStore.saveToStorage();
        };

        const {
            isSelecting,
            selectionRect,
            getSelectionRectStyle,
            isEntityInSelection
        } = useRectangleSelection(viewerContentRef, handleSelectionComplete, {
            onSelectionStart: handleSelectionStart,
            onSelectionUpdate: handleSelectionUpdate
        });

        // Drag and Drop Event Handlers
        const handleDragEnter = (e) => {
            if (!props.dragState.isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const rect = viewerRef.value.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const dropSide = mouseX < rect.width / 2 ? 'left' : 'right';
            
            emit('drag-enter', {
                targetViewerId: props.viewerId,
                dropSide: dropSide
            });
        };

        const handleDragOver = (e) => {
            if (!props.dragState.isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Update drop side based on mouse position
            const rect = viewerRef.value.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const dropSide = mouseX < rect.width / 2 ? 'left' : 'right';
            
            emit('drag-enter', {
                targetViewerId: props.viewerId,
                dropSide: dropSide
            });
        };

        const handleDragLeave = (e) => {
            if (!props.dragState.isDragging) return;
            
            // Only emit drag-leave if we're actually leaving the viewer
            // (not just moving between child elements)
            const rect = viewerRef.value.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                emit('drag-leave', {
                    targetViewerId: props.viewerId
                });
            }
        };

        const handleDrop = (e) => {
            if (!props.dragState.isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const rect = viewerRef.value.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const dropSide = mouseX < rect.width / 2 ? 'left' : 'right';
            
            emit('drop', {
                targetViewerId: props.viewerId,
                draggedViewerId: props.dragState.draggedViewerId,
                dropSide: dropSide
            });
        };

        // Entity event handlers
        const handleCircleSelect = (id, isCtrlClick = false) => {
            // Handle CTRL-click on reference circles
            if (isCtrlClick) {
                const circle = dataStore.getCircle(id);
                if (circle && circle.referenceID) {
                    const referencedCircleId = circle.referenceID;
                    
                    // Find which document contains the referenced circle
                    const allCircleDocuments = dataStore.getAllCircleDocuments();
                    let referencedDocumentId = null;
                    
                    for (const doc of allCircleDocuments) {
                        const circlesInDoc = dataStore.getCirclesForDocument(doc.id);
                        if (circlesInDoc.some(c => c.id === referencedCircleId)) {
                            referencedDocumentId = doc.id;
                            break;
                        }
                    }
                    
                    if (!referencedDocumentId) {
                        console.warn(`Referenced circle ${referencedCircleId} not found in any document`);
                        return;
                    }
                    
                    // Check if referenced circle is already visible in a viewer
                    const allViewers = Array.from(dataStore.data.circleViewers.values());
                    let targetViewer = null;
                    
                    for (const viewer of allViewers) {
                        const viewerDoc = dataStore.getCircleDocumentForViewer(viewer.id);
                        if (!viewerDoc) { break; }
                        const viewerDocId = viewerDoc.id
                        if (viewerDocId === referencedDocumentId) {
                            targetViewer = viewer;
                            break;
                        }
                    }
                    
                    if (targetViewer) {
                        // Select the referenced circle
                        dataStore.selectCircle(referencedCircleId, targetViewer.id, false);
                        dataStore.setSelectedViewer(targetViewer.id);
                    } else {
                        // Create new viewer for the referenced circle
                        const newViewer = dataStore.createCircleViewer();
                        dataStore.setCircleDocumentForViewer(newViewer.id, referencedDocumentId);
                        dataStore.selectCircle(referencedCircleId, newViewer.id, false);
                        dataStore.setSelectedViewer(newViewer.id);
                    }
                    return;
                }
            }
            
            // Normal selection (including multi-select with CTRL)
            dataStore.selectCircle(id, props.viewerId, isCtrlClick);
        };

        const handleCirclePositionUpdate = ({ id, x, y }) => {
            dataStore.updateCircle(id, { x, y });
        };

        const handleCircleNameUpdate = ({ id, name }) => {
            dataStore.updateCircle(id, { name });
        };

        const handleMoveMultiple = ({ entityType, deltaX, deltaY }) => {
            if (entityType === 'circle') {
                dataStore.moveSelectedCircles(deltaX, deltaY);
            }
        };

        // Add entity handler
        const handleAddCircle = () => {
            const circle = dataStore.createCircleInViewer(props.viewerId);
            if (circle) {
                dataStore.selectCircle(circle.id);
            }
        };

        // Document change handler
        const handleCircleDocumentChange = (documentId) => {
            if (documentId) {
                dataStore.setCircleDocumentForViewer(props.viewerId, documentId);
            }
            dataStore.data.selectedCircleId = null;
            dataStore.data.selectedSquareId = null;
            dataStore.setCurrentSquareDocument(null);
        };

        // Handle show dropdown requests from EntityControls
        const handleShowDropdown = (config) => {
            emit('show-dropdown', config);
        };

        // Container click handler
        const handleViewerClick = (e) => {
            if (hasRectangleSelected) return;
            
            if (e.target.classList.contains('viewer-content')) {
                dataStore.selectCircle(null, props.viewerId, false);
            }
        };

        // Handle clicks on the entire viewer container
        const handleViewerContainerClick = (e) => {
            const shouldClearEntities = !hasRectangleSelected;
            
            if (e.target.classList.contains('circle-viewer') || 
                e.target.classList.contains('viewer-content')) {
                
                dataStore.setSelectedViewer(props.viewerId);
                emit('viewer-click', props.viewerId);
                
                if (shouldClearEntities && e.target.classList.contains('viewer-content')) {
                    dataStore.selectCircle(null, props.viewerId, false);
                }
            }
        };

        // Viewer control handlers
        const handleStartReorder = (e) => {
            emit('start-reorder', { viewerId: props.viewerId, event: e });
        };

        const handleCloseViewer = () => {
            emit('close-viewer', props.viewerId);
        };

        // Resize functionality
        const startResize = (e) => {
            // Prevent resizing during drag operations
            if (props.dragState.isDragging) {
                e.preventDefault();
                return;
            }
            
            isResizing.value = true;
            viewerRef.value.classList.add('resizing');
            resizeStart.value = {
                x: e.clientX,
                width: viewerWidth.value
            };
            e.preventDefault();
        };

        const handleResize = (e) => {
            if (!isResizing.value || props.dragState.isDragging) return;
            
            const deltaX = e.clientX - resizeStart.value.x;
            const newWidth = Math.max(100, Math.min(3600, resizeStart.value.width + deltaX));
            
            // Update the viewer properties via the data store, which will persist to document
            dataStore.updateCircleViewer(props.viewerId, { width: newWidth });
            emit('resize', { viewerId: props.viewerId, width: newWidth });
        };

        const endResize = () => {
            isResizing.value = false;
            if (viewerRef.value) {
                viewerRef.value.classList.remove('resizing');
            }
        };

        onMounted(() => {
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', endResize);
        });

        onUnmounted(() => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', endResize);
        });

        return {
            dataStore,
            viewer,
            viewerWidth, 
            showBackground,
            currentCircles,
            isSelected,
            viewerContentRef,
            viewerRef,
            viewerConnections,
            isSelecting,
            selectionRect,
            getSelectionRectStyle,
            isBeingDragged,
            isDropTarget,
            dropTargetSide,
            handleDragEnter,
            handleDragOver,
            handleDragLeave,
            handleDrop,
            handleCircleSelect,
            handleCirclePositionUpdate,
            handleCircleNameUpdate,
            handleMoveMultiple,
            handleAddCircle,
            handleCircleDocumentChange,
            handleShowDropdown,
            handleViewerClick,
            handleViewerContainerClick,
            handleStartReorder,
            startResize,
            handleCloseViewer
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
                { 
                    selected: isSelected,
                    'hide-background': !showBackground,
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
                @start-reorder="handleStartReorder"
                @close="handleCloseViewer"
            />
            
            <div 
                ref="viewerContentRef"
                class="viewer-content" 
                @click="handleViewerClick"
            >
                <!-- Connection Rendering for Circles -->
                <ConnectionComponent
                    v-for="connection in viewerConnections"
                    :key="connection.id"
                    :connection="connection"
                    :viewer-width="viewerWidth"
                />
                
                <EntityComponent
                    v-for="circle in currentCircles"
                    :key="circle.id"
                    :entity="circle"
                    entity-type="circle"
                    :is-selected="dataStore.isCircleSelected(circle.id)"
                    :viewer-width="viewerWidth"
                    :viewer-id="viewerId"
                    @select="handleCircleSelect"
                    @update-position="handleCirclePositionUpdate"
                    @update-name="handleCircleNameUpdate"
                    @move-multiple="handleMoveMultiple"
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
