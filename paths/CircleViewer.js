// CircleViewer.js - FIXED: Properly pass viewerId prop to EntityComponent
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { useConnectionUpdater, useConnections } from './useConnections.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { ViewerControls } from './ViewerControls.js';
import { ConnectionComponent } from './ConnectionComponent.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles (same as before)
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
        }
    },
    emits: [
        'start-reorder',
        'minimize-viewer',
        'close-viewer',
        'resize',
        'viewer-click',
        'show-dropdown'
    ],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isResizing = ref(false);
        const resizeStart = ref({ x: 0, width: 0 });
        const viewerContentRef = ref(null);
        const viewerWidth = computed(() => viewer.value?.width || 400);
        
        // Width threshold for compact mode (should match ViewerControls)
        const COMPACT_THRESHOLD = 200;

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        
        const currentCircles = computed(() => {
            const circles = dataStore.getCirclesForViewer(props.viewerId);
            return circles;
        });
        
        const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));
        
        // Check if controls should be in compact mode
        const isCompactMode = computed(() => {
            return viewer.value && viewer.value.width < COMPACT_THRESHOLD;
        });

        // Connection management for circles
        const { connections, connectionManager } = useConnections();
        
        // FIXED: Filter connections to show only connections for this specific viewer
	const viewerConnections = computed(() => {
    
    // FIXED: Filter for this viewer's circle connections specifically
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
        
        // FIXED: Set up connection updates with viewer-specific entity type to avoid conflicts
        const { updateConnections } = useConnectionUpdater(
            () => {
                const circles = currentCircles.value;
                return circles;
            },
            `circle-${props.viewerId}`, // FIXED: Use viewer-specific entity type
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

        // Entity event handlers
        const handleCircleSelect = (id, isCtrlClick = false) => {
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
            dataStore.data.currentSquareDocumentId = null;
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

        const handleMinimizeViewer = () => {
            emit('minimize-viewer', props.viewerId);
        };

        const handleCloseViewer = () => {
            emit('close-viewer', props.viewerId);
        };

        // Resize functionality
        const startResize = (e) => {
            isResizing.value = true;
            resizeStart.value = {
                x: e.clientX,
                width: viewer.value?.width || 400
            };
            e.preventDefault();
        };

        const handleResize = (e) => {
            if (!isResizing.value) return;
            
            const deltaX = e.clientX - resizeStart.value.x;
            const newWidth = Math.max(100, Math.min(3600, resizeStart.value.width + deltaX));
            
            dataStore.updateCircleViewer(props.viewerId, { width: newWidth });
            emit('resize', { viewerId: props.viewerId, width: newWidth });
        };

        const endResize = () => {
            isResizing.value = false;
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
            currentCircles,
            isSelected,
            viewerContentRef,
            viewerConnections,
            isSelecting,
            selectionRect,
            getSelectionRectStyle,
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
            handleMinimizeViewer,
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
    :class="[
        'circle-viewer', 
        { 
            selected: isSelected,
            'hide-background': viewer?.showBackground === false
        }
    ]"
    :style="{ width: viewer?.width + 'px' }"
    :data-viewer-id="viewerId"
    @click="handleViewerContainerClick"
>
        <ViewerControls 
            :viewer-id="viewerId"
            @start-reorder="handleStartReorder"
            @minimize="handleMinimizeViewer"
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
                :viewer-width="viewer?.width || 400"
            />
            
            <!-- FIXED: Pass viewerId prop to EntityComponent -->
            <EntityComponent
                v-for="circle in currentCircles"
                :key="circle.id"
                :entity="circle"
                entity-type="circle"
                :is-selected="dataStore.isCircleSelected(circle.id)"
                :viewer-width="viewer?.width || 400"
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
