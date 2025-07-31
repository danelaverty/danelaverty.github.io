// CircleViewer.js - Individual circle viewer component
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './useDataStore.js';
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
        'resize'
    ],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isResizing = ref(false);
        const resizeStart = ref({ x: 0, width: 0 });

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        const currentCircles = computed(() => dataStore.getCirclesForViewer(props.viewerId));

        // Entity event handlers
        const handleCircleSelect = (id) => {
            dataStore.selectCircle(id);
        };

        const handleCirclePositionUpdate = ({ id, x, y }) => {
            dataStore.updateCircle(id, { x, y });
        };

        const handleCircleNameUpdate = ({ id, name }) => {
            dataStore.updateCircle(id, { name });
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
            if (e.target.classList.contains('viewer-content')) {
                dataStore.selectCircle(null);
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
            const newWidth = Math.max(200, Math.min(800, resizeStart.value.width + deltaX));
            
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
            currentCircles,
            handleCircleSelect,
            handleCirclePositionUpdate,
            handleCircleNameUpdate,
            handleAddCircle,
            handleCircleDocumentChange,
            handleViewerClick,
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
            class="circle-viewer"
            :style="{ width: viewer?.width + 'px' }"
        >
            <ViewerControls 
                :viewer-id="viewerId"
                @start-reorder="handleStartReorder"
                @minimize="handleMinimizeViewer"
                @close="handleCloseViewer"
            />
            
            <div class="viewer-content" @click="handleViewerClick">
                <EntityComponent
                    v-for="circle in currentCircles"
                    :key="circle.id"
                    :entity="circle"
                    entity-type="circle"
                    :is-selected="circle.id === dataStore.data.selectedCircleId"
                    @select="handleCircleSelect"
                    @update-position="handleCirclePositionUpdate"
                    @update-name="handleCircleNameUpdate"
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
            </div>
            
            <div 
                class="resize-handle"
                @mousedown="startResize"
            ></div>
        </div>
    `
};
