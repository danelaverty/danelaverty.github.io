// main.js - Main application entry point with multi-viewer support
import { createApp, ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './useDataStore.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { CircleViewer } from './CircleViewer.js';
import { MinimizedViewerDock } from './MinimizedViewerDock.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject global app styles
const globalStyles = `
    * {
        box-sizing: border-box;
    }
    
    body {
        margin: 0;
        padding: 0;
        background-color: black;
        font-family: Arial, sans-serif;
        overflow: hidden;
        height: 100vh;
    }

    .app-container {
        display: flex;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        overflow: hidden;
    }

    .viewers-container {
        display: flex;
        flex: 1;
        height: 100vh;
        overflow: hidden;
    }

    .square-viewer {
        flex: 1;
        height: 100vh;
        position: relative;
        background-color: #0a0a0a;
        overflow: hidden;
        min-width: 200px;
    }

    .square-viewer-content {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
    }

    /* Adjust app container left margin when minimized dock is visible */
    .app-container.has-minimized-dock {
        margin-left: 60px;
        width: calc(100vw - 60px);
    }
`;

injectComponentStyles('global-styles', globalStyles);

// Main App Component
const App = {
    setup() {
        const dataStore = useDataStore();
        const isReordering = ref(false);
        const reorderData = ref(null);

        // Computed properties for viewers and squares
        const visibleCircleViewers = computed(() => dataStore.getVisibleCircleViewers());
        const hasMinimizedViewers = computed(() => dataStore.data.minimizedViewers.size > 0);
        
        const currentSquares = computed(() => {
            const docId = dataStore.data.currentSquareDocumentId;
            return docId ? dataStore.getSquaresForDocument(docId) : [];
        });

        // Square event handlers
        const handleSquareSelect = (id) => {
            dataStore.selectSquare(id);
        };

        const handleSquarePositionUpdate = ({ id, x, y }) => {
            dataStore.updateSquare(id, { x, y });
        };

        const handleSquareNameUpdate = ({ id, name }) => {
            dataStore.updateSquare(id, { name });
        };

        const handleAddSquare = () => {
            const square = dataStore.createSquare();
            if (square) {
                dataStore.selectSquare(square.id);
            }
        };

        const handleSquareDocumentChange = (documentId) => {
            dataStore.data.selectedSquareId = null;
        };

        // Square viewer click handler
        const handleSquareViewerClick = (e) => {
            if (e.target.classList.contains('square-viewer-content')) {
                dataStore.selectSquare(null);
            }
        };

        // Viewer management handlers
        const handleAddViewer = () => {
            dataStore.createCircleViewer();
        };

        const handleMinimizeViewer = (viewerId) => {
            dataStore.minimizeViewer(viewerId);
        };

        const handleCloseViewer = (viewerId) => {
            const viewerTitle = dataStore.getViewerTitle(viewerId);
            if (confirm(`Are you sure you want to close "${viewerTitle}"? The document will not be deleted.`)) {
                dataStore.deleteCircleViewer(viewerId);
            }
        };

        const handleRestoreViewer = (viewerId) => {
            dataStore.restoreViewer(viewerId);
        };

        // Viewer reordering functionality
        const handleStartReorder = ({ viewerId, event }) => {
            isReordering.value = true;
            const viewerIndex = dataStore.data.viewerOrder.indexOf(viewerId);
            reorderData.value = {
                viewerId,
                originalIndex: viewerIndex,
                startX: event.clientX,
                currentIndex: viewerIndex
            };
            event.preventDefault();
        };

        const handleReorderMove = (e) => {
            if (!isReordering.value || !reorderData.value) return;

            const deltaX = e.clientX - reorderData.value.startX;
            const viewerWidth = 400; // Approximate viewer width
            const indexChange = Math.round(deltaX / viewerWidth);
            const newIndex = Math.max(0, Math.min(
                visibleCircleViewers.value.length - 1,
                reorderData.value.originalIndex + indexChange
            ));

            if (newIndex !== reorderData.value.currentIndex) {
                reorderData.value.currentIndex = newIndex;
            }
        };

        const handleReorderEnd = () => {
            if (!isReordering.value || !reorderData.value) return;

            if (reorderData.value.currentIndex !== reorderData.value.originalIndex) {
                dataStore.reorderViewers(reorderData.value.originalIndex, reorderData.value.currentIndex);
            }

            isReordering.value = false;
            reorderData.value = null;
        };

        // Keyboard handlers
        const handleKeydown = (e) => {
            if (e.key === 'Delete') {
                // Priority: Squares first, then Circles
                if (dataStore.data.selectedSquareId) {
                    dataStore.deleteSquare(dataStore.data.selectedSquareId);
                    return;
                }
                if (dataStore.data.selectedCircleId) {
                    dataStore.deleteCircle(dataStore.data.selectedCircleId);
                }
            }
        };

        onMounted(() => {
            document.addEventListener('keydown', handleKeydown);
            document.addEventListener('mousemove', handleReorderMove);
            document.addEventListener('mouseup', handleReorderEnd);
        });

        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('mousemove', handleReorderMove);
            document.removeEventListener('mouseup', handleReorderEnd);
        });

        return {
            dataStore,
            visibleCircleViewers,
            hasMinimizedViewers,
            currentSquares,
            handleSquareSelect,
            handleSquarePositionUpdate,
            handleSquareNameUpdate,
            handleAddSquare,
            handleSquareDocumentChange,
            handleSquareViewerClick,
            handleAddViewer,
            handleMinimizeViewer,
            handleCloseViewer,
            handleRestoreViewer,
            handleStartReorder
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        CircleViewer,
        MinimizedViewerDock
    },
    template: `
        <div :class="['app-container', { 'has-minimized-dock': hasMinimizedViewers }]">
            <MinimizedViewerDock 
                @restore-viewer="handleRestoreViewer"
            />
            
            <div class="viewers-container">
                <!-- Circle Viewers -->
                <CircleViewer
                    v-for="(viewer, index) in visibleCircleViewers"
                    :key="viewer.id"
                    :viewer-id="viewer.id"
                    :show-add-button="index === visibleCircleViewers.length - 1"
                    @add-viewer="handleAddViewer"
                    @start-reorder="handleStartReorder"
                    @minimize-viewer="handleMinimizeViewer"
                    @close-viewer="handleCloseViewer"
                />
                
                <!-- Square Viewer -->
                <div class="square-viewer" @click="handleSquareViewerClick">
                    <div class="square-viewer-content">
                        <EntityComponent
                            v-for="square in currentSquares"
                            :key="square.id"
                            :entity="square"
                            entity-type="square"
                            :is-selected="square.id === dataStore.data.selectedSquareId"
                            @select="handleSquareSelect"
                            @update-position="handleSquarePositionUpdate"
                            @update-name="handleSquareNameUpdate"
                        />
                        
                        <EntityControls 
                            entity-type="square"
                            @add-entity="handleAddSquare"
                            @document-change="handleSquareDocumentChange"
                        />
                    </div>
                </div>
            </div>
        </div>
    `
};

// Initialize the Vue app
createApp(App).mount('#app');
