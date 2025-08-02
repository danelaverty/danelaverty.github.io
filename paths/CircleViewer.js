// CircleViewer.js - Individual circle viewer component with rectangle selection
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './useDataStore.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { ViewerControls } from './ViewerControls.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
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
        cursor: pointer; /* NEW: Indicate clickable */
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

    /* NEW: Visual indication when viewer is selected */
    .circle-viewer.selected {
        background-color: #131313;
        border-right-color: #444;
    }

    .viewer-content {
        flex: 1;
        position: relative;
        margin-top: 40px; /* Account for viewer controls */
        overflow: hidden;
    }

    .resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        width: 4px;
        height: 100%;
        cursor: ew-resize;
        z-index: 1003;
        background-color: transparent;
        transition: background-color 0.2s ease;
    }

    .resize-handle:hover {
        background-color: #4CAF50;
    }

    .add-viewer-button {
        position: absolute;
        bottom: 20px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: #444;
        color: white;
        border: 1px solid #666;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        transition: background-color 0.2s ease;
    }

    .add-viewer-button:hover {
        background-color: #666;
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
        showAddButton: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        'add-viewer',
        'start-reorder',
        'minimize-viewer',
        'close-viewer',
        'resize',
        'viewer-click' // NEW: Emit when the viewer container is clicked
    ],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isResizing = ref(false);
        const resizeStart = ref({ x: 0, width: 0 });
        const viewerContentRef = ref(null); // NEW: Ref for the viewer content
	const viewerWidth = computed(() => viewer.value?.width || 400);

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        const currentCircles = computed(() => dataStore.getCirclesForViewer(props.viewerId));
        
        // NEW: Check if this viewer is selected
        const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));

        // Store initial selection state for Ctrl+drag operations
        let initialSelectedIds = new Set();
        let hasRectangleSelected = false; // NEW: Track if we just completed a rectangle selection
        
        // Helper function to check if a circle intersects with a rectangle
	const isCircleIntersecting = (circle, rect) => {
    const circleSize = 60;
    // Convert center-relative position to absolute position for intersection test
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

        // NEW: Real-time selection during drag
        const handleSelectionUpdate = (rect, isCtrlClick) => {
            if (!rect || rect.width < 5 || rect.height < 5) return; // Ignore very small selections
            
            // Find circles that intersect with the current selection rectangle
            const intersectingIds = [];
            currentCircles.value.forEach(circle => {
                if (isCircleIntersecting(circle, rect)) {
                    intersectingIds.push(circle.id);
                }
            });

            // Determine final selection
            let finalSelection;
            if (isCtrlClick) {
                // For Ctrl+drag: combine initial selection with intersecting circles
                finalSelection = [...new Set([...initialSelectedIds, ...intersectingIds])];
            } else {
                // For normal drag: only intersecting circles
                finalSelection = intersectingIds;
            }

            // Apply selection properly using the dataStore method
            if (finalSelection.length > 0) {
                // Clear current selection first
                dataStore.selectCircle(null, props.viewerId, false);
                
                // Select each circle in sequence
                finalSelection.forEach((id, index) => {
                    dataStore.selectCircle(id, props.viewerId, index > 0);
                });
            } else if (!isCtrlClick) {
                // Clear selection if nothing intersecting and not Ctrl+drag
                dataStore.selectCircle(null, props.viewerId, false);
            }
        };

        // NEW: Initialize selection state when drag starts
        const handleSelectionStart = (isCtrlClick) => {
            // Store current selection for Ctrl+drag operations
            initialSelectedIds = new Set(dataStore.getSelectedCircles());
            hasRectangleSelected = false; // Reset the flag
            
            if (!isCtrlClick) {
                // For normal selection, clear everything immediately
                dataStore.selectCircle(null, props.viewerId, false);
            }
        };

        // NEW: Finalize selection when drag ends
        const handleSelectionComplete = (rect, isCtrlClick) => {
            // Check if this was a meaningful rectangle selection
            const wasRectangleSelection = rect.width >= 5 && rect.height >= 5;
            
            if (!wasRectangleSelection) {
                // This was a click, not a drag - handle it as a click to clear
                if (!isCtrlClick) {
                    dataStore.selectCircle(null, props.viewerId, false);
                }
            } else {
                // This was a real rectangle selection
                hasRectangleSelected = true;
                
                // Clear the flag after a short delay to prevent click interference
                setTimeout(() => {
                    hasRectangleSelected = false;
                }, 100);
            }
            
            // Selection was already handled in real-time, just save to storage
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

        // Container click handler
        const handleViewerClick = (e) => {
            // NEW: Don't handle clicks if we just completed a rectangle selection
            if (hasRectangleSelected) return;
            
            // Handle clicks on the viewer-content area
            if (e.target.classList.contains('viewer-content')) {
                dataStore.selectCircle(null, props.viewerId, false);
            }
        };

        // NEW: Handle clicks on the entire viewer container
        const handleViewerContainerClick = (e) => {
            // NEW: Don't handle entity clearing if we just completed a rectangle selection,
            // but still allow viewer selection
            const shouldClearEntities = !hasRectangleSelected;
            
            // Only handle clicks on the viewer container itself or viewer-content, 
            // not on child elements like controls or entities
            if (e.target.classList.contains('circle-viewer') || 
                e.target.classList.contains('viewer-content')) {
                
                // Always set this viewer as selected
                dataStore.setSelectedViewer(props.viewerId);
                emit('viewer-click', props.viewerId);
                
                // Only clear entity selections if we didn't just do a rectangle selection
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

        const handleAddViewer = () => {
            emit('add-viewer');
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
            const newWidth = Math.max(200, Math.min(3600, resizeStart.value.width + deltaX));
            
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
            isSelected, // NEW: Expose selected state
            viewerContentRef, // NEW: Expose ref for rectangle selection
            isSelecting, // NEW: Rectangle selection state
            selectionRect, // NEW: Rectangle selection data
            getSelectionRectStyle, // NEW: Rectangle styling function
            handleCircleSelect,
            handleCirclePositionUpdate,
            handleCircleNameUpdate,
            handleMoveMultiple,
            handleAddCircle,
            handleCircleDocumentChange,
            handleViewerClick,
            handleViewerContainerClick, // NEW: Handle container clicks
            handleStartReorder,
            handleMinimizeViewer,
            handleCloseViewer,
            handleAddViewer,
            startResize
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        ViewerControls
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
            <EntityComponent
                v-for="circle in currentCircles"
                :key="circle.id"
                :entity="circle"
                entity-type="circle"
                :is-selected="dataStore.isCircleSelected(circle.id)"
                :viewer-width="viewer?.width || 400"
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
            />
            
            <button 
                v-if="showAddButton"
                class="add-viewer-button"
                @click="handleAddViewer"
                title="Add new viewer"
            >+</button>
            
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
