// AppComponent.js - Updated with SquareDocumentTabs visibility control and animation loop cleanup
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { useConnectionUpdater, useConnections } from './useConnections.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';
import { useAnimationLoopManager } from './AnimationLoopManager.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { CircleViewer } from './CircleViewer.js';
import { DocumentsDock } from './DocumentsDock.js';
import { CircleCharacteristicsBar } from './CircleCharacteristicsBar.js';
import { SquareDocumentTabs } from './SquareDocumentTabs.js';
import { SharedDropdown } from './SharedDropdown.js';
import { IndicatorEmojiPicker } from './IndicatorEmojiPicker.js';
import { ConnectionComponent, ConnectionSVGComponent } from './ConnectionComponent.js';
import { createKeyboardHandler, setupKeyboardListeners } from './keyboardHandler.js';
import { createViewerManager } from './viewerManager.js';
import { createEntityHandlers } from './entityHandlers.js';
import { createSquareSelectionHandlers } from './rectangleSelectionHandlers.js';

export const App = {
    setup() {
        const dataStore = useDataStore();
        const squareViewerContentRef = ref(null);
        const proximitySystem = useEnergyProximitySystem();
        const animationManager = useAnimationLoopManager(); // NEW: Get animation manager

        // Computed properties for viewers and squares
        const visibleCircleViewers = computed(() => dataStore.getVisibleCircleViewers());
        
        const currentSquares = computed(() => {
            const docId = dataStore.data.currentSquareDocumentId;
            const squares = docId ? dataStore.getSquaresForDocument(docId) : [];
            return squares;
        });

        // Check if characteristics bar should be visible
        const hasSelectedCircle = computed(() => {
            return dataStore.getSelectedCircles().length === 1;
        });

        // NEW: Check if SquareDocumentTabs should be visible - only when exactly one circle is selected
        const shouldShowSquareDocumentTabs = computed(() => {
            return dataStore.getSelectedCircles().length === 1;
        });

        // Connection management
        const { connections } = useConnections();
        
        // Filter connections for square viewer - only show square connections
        const squareConnections = computed(() => {
            return connections.value.filter(connection => {
                return connection.entityType === 'square';
            });
        });
        
        // Calculate container dimensions for connections
        const connectionContainerDimensions = computed(() => {
            const viewerWidths = visibleCircleViewers.value.reduce((sum, viewer) => sum + viewer.width, 0);
            return {
                width: window.innerWidth - viewerWidths,
                height: window.innerHeight
            };
        });
        
        // Set up connection updates for squares only
        useConnectionUpdater(
            () => currentSquares.value,
            'square',
            { 
                watchEntities: true, 
                immediate: true,
                debounceMs: 50
            }
        );

        // Shared dropdown reference
        const sharedDropdownRef = ref(null);

        // Indicator emoji picker state
        const isIndicatorPickerVisible = ref(false);
        const currentIndicatorEmoji = ref(null);

        // Handle show dropdown requests from EntityControls
        const handleShowDropdown = (config) => {
            if (sharedDropdownRef.value) {
                sharedDropdownRef.value.show(config);
            }
        };

        // Handle indicator emoji picker
        const handleShowIndicatorPicker = (currentIndicator = null) => {
            currentIndicatorEmoji.value = currentIndicator;
            isIndicatorPickerVisible.value = true;
        };

        const handleIndicatorPickerClose = () => {
            isIndicatorPickerVisible.value = false;
            currentIndicatorEmoji.value = null;
        };

        const handleIndicatorPickerSelect = (indicatorEmoji) => {
            const selectedSquares = dataStore.getSelectedSquares();
            
            // Apply indicator emoji to all selected squares
            selectedSquares.forEach(squareId => {
                dataStore.updateSquare(squareId, { indicatorEmoji });
            });
            
            // Close the picker
            handleIndicatorPickerClose();
        };

        // Create handlers
        const viewerManager = createViewerManager(dataStore); // This now includes dragState
        const entityHandlers = createEntityHandlers(dataStore);

        // Keyboard viewer reordering handler
        const handleKeyboardReorderViewer = (viewerId, direction) => {
            // Prevent reordering during drag operations
            if (viewerManager.dragState.isDragging) {
                return;
            }

            const viewerOrder = dataStore.data.viewerOrder;
            const currentIndex = viewerOrder.indexOf(viewerId);
            
            if (currentIndex === -1) {
                return;
            }

            let targetIndex;
            if (direction === 'left') {
                targetIndex = Math.max(0, currentIndex - 1);
            } else if (direction === 'right') {
                targetIndex = Math.min(viewerOrder.length - 1, currentIndex + 1);
            } else {
                return;
            }

            // Only reorder if position would actually change
            if (targetIndex !== currentIndex) {
                // Use the existing reorderViewers method from dataStore
                const success = dataStore.reorderViewers(currentIndex, targetIndex);
            }
        };

        const keyboardHandler = createKeyboardHandler(
            dataStore, 
            handleShowIndicatorPicker,
            handleKeyboardReorderViewer
        );
        
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

        // Handle square document tab changes
        const handleSquareDocumentTabChange = (docId) => {
            // The SquareDocumentTabs component already calls dataStore.setCurrentSquareDocument
            // We just need to ensure any dependent state is updated if needed
        };

        // Set up keyboard handling and proximity system
        let keyboardCleanup;
        
        onMounted(() => {
            keyboardCleanup = setupKeyboardListeners(keyboardHandler);
            document.addEventListener('mousemove', viewerManager.handleReorderMove);
            document.addEventListener('mouseup', viewerManager.handleReorderEnd);
            
            // Start the energy proximity system
            proximitySystem.start();
        });

        onUnmounted(() => {
            if (keyboardCleanup) keyboardCleanup();
            document.removeEventListener('mousemove', viewerManager.handleReorderMove);
            document.removeEventListener('mouseup', viewerManager.handleReorderEnd);
            
            // Stop the energy proximity system
            proximitySystem.stop();
            
            // NEW: Cleanup animation loops
            animationManager.cleanup();
        });

        return {
            dataStore,
            visibleCircleViewers,
            currentSquares,
            hasSelectedCircle,
            shouldShowSquareDocumentTabs, // NEW: Expose the computed property
            squareConnections,
            squareViewerContentRef,
            sharedDropdownRef,
            isIndicatorPickerVisible,
            currentIndicatorEmoji,
            isSelectingSquares,
            squareSelectionRect,
            getSquareSelectionRectStyle,
            handleSquareViewerClick,
            handleSquareViewerContainerClick,
            handleSquareDocumentTabChange,
            handleShowDropdown,
            handleIndicatorPickerClose,
            handleIndicatorPickerSelect,
            // Expose handlers from modules
            ...entityHandlers,
            ...viewerManager // This now includes dragState and new drag handlers
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        CircleViewer,
        DocumentsDock,
        CircleCharacteristicsBar,
        SquareDocumentTabs,
        SharedDropdown,
        IndicatorEmojiPicker,
        ConnectionComponent
    },
    template: `
        <div :class="['app-container', { 'has-documents-dock': true }]">
            <DocumentsDock 
            />
            
            <div class="viewers-container">
                <!-- Circle Viewers with drag state support -->
                <CircleViewer
                    v-for="viewer in visibleCircleViewers"
                    :key="viewer.id"
                    :viewer-id="viewer.id"
                    :drag-state="dragState"
                    @start-reorder="handleStartReorder"
                    @drag-enter="handleDragEnter"
                    @drag-leave="handleDragLeave"
                    @drop="handleDrop"
                    @close-viewer="handleCloseViewer"
                    @viewer-click="handleViewerContainerClick"
                    @show-dropdown="handleShowDropdown"
                />
                
                <!-- Square Viewer -->
                <div class="square-viewer" @click="handleSquareViewerContainerClick">
                    <!-- Circle Characteristics Bar -->
                    <CircleCharacteristicsBar />
                    
                    <!-- Square Document Tabs - Only show when exactly one circle is selected -->
                    <SquareDocumentTabs 
                        v-if="shouldShowSquareDocumentTabs"
                        @document-change="handleSquareDocumentTabChange" 
                    />
                    
                    <div 
                        ref="squareViewerContentRef"
                        :class="['square-viewer-content', { 'no-characteristics-bar': !hasSelectedCircle }]"
                        @click="handleSquareViewerClick"
                    >
                        <!-- Connection Rendering - Only square connections in square viewer -->
                        <ConnectionComponent
                            v-for="connection in squareConnections"
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
                        
                        <!-- Rectangle selection visual for squares -->
                        <div 
                            v-if="squareSelectionRect.visible"
                            class="selection-rectangle"
                            :style="getSquareSelectionRectStyle()"
                        ></div>
                    </div>
                </div>
                
                <!-- Shared Dropdown - positioned at viewers-container level to avoid clipping -->
                <SharedDropdown ref="sharedDropdownRef" />
                
                <!-- Indicator Emoji Picker -->
                <IndicatorEmojiPicker
                    :is-visible="isIndicatorPickerVisible"
                    :current-indicator="currentIndicatorEmoji"
                    @close="handleIndicatorPickerClose"
                    @select="handleIndicatorPickerSelect"
                />
            </div>
        </div>
    `
};
