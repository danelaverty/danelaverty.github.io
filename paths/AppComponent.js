// AppComponent.js - Main application component (Updated with connection rendering)
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { useConnectionUpdater, useConnections } from './useConnections.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { CircleViewer } from './CircleViewer.js';
import { MinimizedViewerDock } from './MinimizedViewerDock.js';
import { CircleCharacteristicsBar } from './CircleCharacteristicsBar.js';
import { ConnectionComponent, ConnectionSVGComponent } from './ConnectionComponent.js';
import { createKeyboardHandler, setupKeyboardListeners } from './keyboardHandler.js';
import { createViewerManager } from './viewerManager.js';
import { createEntityHandlers } from './entityHandlers.js';
import { createSquareSelectionHandlers } from './rectangleSelectionHandlers.js';

export const App = {
    setup() {
        const dataStore = useDataStore();
        const squareViewerContentRef = ref(null);

        // Computed properties for viewers and squares
        const visibleCircleViewers = computed(() => dataStore.getVisibleCircleViewers());
        const hasMinimizedViewers = computed(() => dataStore.data.minimizedViewers.size > 0);
        
        const currentSquares = computed(() => {
            const docId = dataStore.data.currentSquareDocumentId;
            return docId ? dataStore.getSquaresForDocument(docId) : [];
        });

        // Check if characteristics bar should be visible
        const hasSelectedCircle = computed(() => {
            return dataStore.getSelectedCircles().length === 1;
        });

        // Connection management - THIS IS THE KEY ADDITION
        const { connections } = useConnections();
        
        // Calculate container dimensions for connections
        const connectionContainerDimensions = computed(() => {
            const viewerWidths = visibleCircleViewers.value.reduce((sum, viewer) => sum + viewer.width, 0);
            return {
                width: window.innerWidth - viewerWidths,
                height: window.innerHeight
            };
        });
        
        // Set up connection updates when squares change (but not during drags)
        useConnectionUpdater(
            () => currentSquares.value,
            { 
                watchSquares: true, 
                immediate: true,
                debounceMs: 50 // Slightly higher debounce for non-drag updates
            }
        );

        // Create handlers
        const keyboardHandler = createKeyboardHandler(dataStore);
        const viewerManager = createViewerManager(dataStore);
        const entityHandlers = createEntityHandlers(dataStore);
        
        // Square selection handlers
        const squareSelectionHandlers = createSquareSelectionHandlers(
            dataStore, 
            () => currentSquares.value
        );

        // Rectangle selection for squares
        const {
            isSelecting: isSelectingSquares,
            selectionRect: squareSelectionRect,
            getSelectionRectStyle: getSquareSelectionRectStyle
        } = useRectangleSelection(squareViewerContentRef, squareSelectionHandlers.handleSquareSelectionComplete, {
            onSelectionStart: squareSelectionHandlers.handleSquareSelectionStart,
            onSelectionUpdate: squareSelectionHandlers.handleSquareSelectionUpdate
        });

        // Square viewer click handlers
        const handleSquareViewerClick = (e) => {
            // Don't handle clicks if we're in the middle of rectangle selection
            if (squareSelectionHandlers.isCurrentlyRectangleSelecting()) return;
            
            if (e.target.classList.contains('square-viewer-content')) {
                dataStore.selectSquare(null, false);
            }
        };

        const handleSquareViewerContainerClick = (e) => {
            // Don't handle clicks if we're in the middle of rectangle selection
            if (squareSelectionHandlers.isCurrentlyRectangleSelecting()) return;
            
            // Only handle clicks on the container itself, not its children
            if (e.target.classList.contains('square-viewer')) {
                // Since squares don't have a specific viewer ID, we don't change selectedViewerId
                // but we do clear entity selections to indicate the square area is "focused"
                dataStore.selectSquare(null, false);
            }
        };

        // Set up keyboard handling
        let keyboardCleanup;
        
        onMounted(() => {
            keyboardCleanup = setupKeyboardListeners(keyboardHandler);
            document.addEventListener('mousemove', viewerManager.handleReorderMove);
            document.addEventListener('mouseup', viewerManager.handleReorderEnd);
        });

        onUnmounted(() => {
            if (keyboardCleanup) keyboardCleanup();
            document.removeEventListener('mousemove', viewerManager.handleReorderMove);
            document.removeEventListener('mouseup', viewerManager.handleReorderEnd);
        });

        return {
            dataStore,
            visibleCircleViewers,
            hasMinimizedViewers,
            currentSquares,
            hasSelectedCircle,
            connections, // Expose connections for template
            squareViewerContentRef,
            isSelectingSquares,
            squareSelectionRect,
            getSquareSelectionRectStyle,
            handleSquareViewerClick,
            handleSquareViewerContainerClick,
            // Expose handlers from modules
            ...entityHandlers,
            ...viewerManager
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        CircleViewer,
        MinimizedViewerDock,
        CircleCharacteristicsBar,
        ConnectionComponent // Add the connection component
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
                    @viewer-click="handleViewerContainerClick"
                />
                
                <!-- Square Viewer -->
                <div class="square-viewer" @click="handleSquareViewerContainerClick">
                    <!-- Circle Characteristics Bar -->
                    <CircleCharacteristicsBar />
                    
                    <div 
                        ref="squareViewerContentRef"
                        :class="['square-viewer-content', { 'no-characteristics-bar': !hasSelectedCircle }]"
                        @click="handleSquareViewerClick"
                    >
                        <!-- Connection Rendering - THIS IS THE KEY ADDITION -->
			<ConnectionComponent
				v-for="connection in connections"
				:key="connection.id"
				:connection="connection"
			/>
                        
                        <EntityComponent
                            v-for="square in currentSquares"
                            :key="square.id"
                            :entity="square"
                            entity-type="square"
                            :is-selected="dataStore.isSquareSelected(square.id)"
                            @select="handleSquareSelect"
                            @update-position="handleSquarePositionUpdate"
                            @update-name="handleSquareNameUpdate"
                            @move-multiple="handleSquareMoveMultiple"
                        />
                        
                        <EntityControls 
                            entity-type="square"
                            @add-entity="handleAddSquare"
                            @document-change="handleSquareDocumentChange"
                        />
                        
                        <!-- Rectangle selection visual for squares -->
                        <div 
                            v-if="squareSelectionRect.visible"
                            class="selection-rectangle"
                            :style="getSquareSelectionRectStyle()"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    `
};
