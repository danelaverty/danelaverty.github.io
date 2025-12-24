import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useRectangleSelection } from './useRectangleSelection.js';
import { useConnectionUpdater, useConnections } from './useConnections.js';
import { EntityComponent } from './EntityComponent.js';
import { EntityControls } from './EntityControls.js';
import { CircleViewer } from './CircleViewer.js';
import { DocumentsDock } from './DocumentsDock.js';
import { SquareCharacteristicsBar } from './SquareCharacteristicsBar.js';
import { SquareDocumentTabs } from './SquareDocumentTabs.js';
import { SharedDropdown } from './SharedDropdown.js';
import { IndicatorEmojiPicker } from './IndicatorEmojiPicker.js';
import { ConnectionComponent } from './ConnectionComponent.js';
import { ExplicitConnectionService } from './ExplicitConnectionService.js';
import { createKeyboardHandler, setupKeyboardListeners } from './keyboardHandler.js';
import { createViewerManager } from './viewerManager.js';
import { createEntityHandlers } from './entityHandlers.js';
import { createSquareSelectionHandlers } from './rectangleSelectionHandlers.js';

// Import picker modal components
import { TypePickerModal } from './CBTypePickerModal.js';
import { CircleEmojiPickerModal } from './CBCircleEmojiPickerModal.js';
import { CBStatesPickerModal } from './CBStatesPickerModal.js';
import { ColorPickerModal } from './CBColorPickerModal.js';
import { EnergyPickerModal } from './CBEnergyPickerModal.js';
import { CBSecondaryNamePickerModal } from './CBSecondaryNamePickerModal.js';

// Import needed utilities for characteristics bridge
import { useCharacteristicsBarBridge } from './useCharacteristicsBarBridge.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject picker modal styles at app level
const pickerModalStyles = `
    /* Global picker modal positioning */
    .app-global-picker-modal {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 9999 !important;
    }

    /* Include all modal styles */
    ${modalStyles}
    ${pickerSpecificStyles}
`;

injectComponentStyles('app-picker-modals', pickerModalStyles);

export const App = {
    setup() {
        const dataStore = useDataStore();
        const squareViewerContentRef = ref(null);

        const statePickerBridge = ref(null);

        const handleStatePickerChange = (pickerState) => {
            statePickerBridge.value = pickerState;
        };

        const isDemoMode = computed(() => dataStore.isDemoMode());

        // Document hover state for viewer highlighting
        const hoveredDocumentId = ref(null);

        const explicitConnectionService = new ExplicitConnectionService({
            getCircle: dataStore.getCircle,
            getSquare: dataStore.getSquare,
            getCirclesForViewer: dataStore.getCirclesForViewer,
            saveToStorage: dataStore.saveToStorage
        });

        // Get characteristics bridge for global picker state
        const characteristics = useCharacteristicsBarBridge();

        // Square drag state management
        const squareDragState = ref({
            isDragging: false,
            draggedEntityIds: [],
            currentDeltas: { deltaX: 0, deltaY: 0 },
            entityType: null,
            viewerId: null
        });

        // Handle square drag events
        const handleSquareDragStart = (event) => {
            squareDragState.value = {
                isDragging: true,
                draggedEntityIds: [event.entityId],
                currentDeltas: { deltaX: 0, deltaY: 0 },
                entityType: event.entityType,
                viewerId: event.viewerId
            };
        };

        const handleSquareDragMove = (event) => {
            if (squareDragState.value.isDragging) {
                squareDragState.value.currentDeltas = {
                    deltaX: event.deltaX,
                    deltaY: event.deltaY
                };
                squareDragState.value.draggedEntityIds = event.selectedEntityIds || [event.entityId];
            }
        };

        const handleSquareDragEnd = (event) => {
            squareDragState.value = {
                isDragging: false,
                draggedEntityIds: [],
                currentDeltas: { deltaX: 0, deltaY: 0 },
                entityType: null,
                viewerId: null
            };
        };

        // Document hover handlers
        const handleDocumentHover = (documentId) => {
            hoveredDocumentId.value = documentId;
        };

        const handleDocumentHoverEnd = () => {
            hoveredDocumentId.value = null;
        };

        // NEW: Handle opening viewer for document reference circles (CTRL-SHIFT-click)
        const handleOpenDocumentViewer = (documentId) => {
            // Check if this document already has a visible viewer
            const visibleViewers = dataStore.getVisibleCircleViewers();
            const existingViewer = visibleViewers.find(viewer => {
                const doc = dataStore.getCircleDocumentForViewer(viewer.id);
                return doc && doc.id === documentId;
            });

            if (existingViewer) {
                // If viewer exists, just select it
                dataStore.setSelectedViewer(existingViewer.id);
            } else {
                // Create new viewer for this document
                const newViewer = dataStore.createCircleViewer();
                dataStore.setCircleDocumentForViewer(newViewer.id, documentId);
                dataStore.setSelectedViewer(newViewer.id);
            }
        };

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

        // Check if SquareDocumentTabs should be visible - only when exactly one circle is selected
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

        // Get explicit connections for squares
        const squareExplicitConnections = computed(() => {
            return explicitConnectionService.getVisualConnectionsForEntityType('square');
        });

        // Combine regular and explicit connections for squares
const allSquareConnections = computed(() => {
    const regularConnections = squareConnections.value;
    const explicitConnections = squareExplicitConnections.value;
    const allConnections = [...regularConnections, ...explicitConnections];
    
    // Filter connections based on presentation mode - both endpoints must be visible
    return allConnections.filter(connection => {
        const entity1 = dataStore.getSquare(connection.entity1Id);
        const entity2 = dataStore.getSquare(connection.entity2Id);
        
        if (!entity1 || !entity2) return false;
        
        // Both squares must be visible in presentation mode for the connection to show
        return dataStore.isSquareVisibleInPresentation(entity1) && 
               dataStore.isSquareVisibleInPresentation(entity2);
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

        // UPDATED: Enhanced square select handler with ctrl+click multi-select and ctrl+shift+click explicit connections
        const handleSquareSelectWithMultiSelect = (id, isCtrlClick = false, isShiftClick = false) => {
            // Check for explicit connection creation (ctrl+shift+click)
            if (isCtrlClick && isShiftClick) {
                // Handle explicit connection creation/deletion
                const selectedSquareIds = dataStore.getSelectedSquares();
                const selectedEntityType = 'square';
                
                const result = explicitConnectionService.handleEntityCtrlClick(
                    id, 'square', selectedSquareIds, selectedEntityType
                );
                
                // Don't change selection when ctrl+shift-clicking for connections
                return;
            }
            
            // Handle multi-select/deselect (ctrl+click only)
            if (isCtrlClick && !isShiftClick) {
                const isCurrentlySelected = dataStore.isSquareSelected(id);
                
                if (isCurrentlySelected) {
                    // Deselect this square while keeping others selected
                    dataStore.selectSquare(id, false, true); // true for deselect
                } else {
                    // Add this square to selection
                    dataStore.selectSquare(id, true); // true for additive
                }
                
                return;
            }
            
            // Regular selection behavior (no modifier keys)
            entityHandlers.handleSquareSelect(id, false); // Force non-ctrl behavior for regular selection
        };

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
        });

        onUnmounted(() => {
            if (keyboardCleanup) keyboardCleanup();
            document.removeEventListener('mousemove', viewerManager.handleReorderMove);
            document.removeEventListener('mouseup', viewerManager.handleReorderEnd);
        });

        return {
            dataStore,
            visibleCircleViewers,
            currentSquares,
            hasSelectedCircle,
            shouldShowSquareDocumentTabs,
            allSquareConnections, // Use combined connections
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
            // Expose hover state and handlers
            hoveredDocumentId,
            handleDocumentHover,
            handleDocumentHoverEnd,
            handleOpenDocumentViewer, // NEW: Handler for document reference circles
            // Square drag state
            squareDragState,
            handleSquareDragStart,
            handleSquareDragMove,
            handleSquareDragEnd,
            // Expose handlers from modules - UPDATED: Use multi-select square handler
            ...{
                ...entityHandlers,
                handleSquareSelect: handleSquareSelectWithMultiSelect // Override with multi-select version
            },
            ...viewerManager,
            isDemoMode,
            
            // Expose characteristics bridge functionality for global pickers
            ...characteristics,
            
            // Ensure shouldShowCircleCharacteristicControls is properly exposed
            shouldShowCircleCharacteristicControls: computed(() => {
                if (characteristics.selectedCircles.value.length > 1) {
                    return true; // Always show for multiple selection
                }
                const circle = characteristics.selectedCircles.value[0];
                return circle && !circle.referenceID; // Hide only if it's a reference circle
            }),
            statePickerBridge,
            handleStatePickerChange,
        };
    },
    components: {
        EntityComponent,
        EntityControls,
        CircleViewer,
        DocumentsDock,
        SquareCharacteristicsBar,
        SquareDocumentTabs,
        SharedDropdown,
        IndicatorEmojiPicker,
        ConnectionComponent,
        // Add picker modal components
        TypePickerModal,
        CircleEmojiPickerModal,
        ColorPickerModal,
        EnergyPickerModal,
        CBSecondaryNamePickerModal,
        CBStatesPickerModal,
    },
    template: `
        <div :class="['app-container', { 'has-documents-dock': true, 'app-demo-mode': isDemoMode }]">
            <DocumentsDock 
                @document-hover="handleDocumentHover"
                @document-hover-end="handleDocumentHoverEnd"
            />
            
            <div class="viewers-container">
                <!-- Circle Viewers with drag state support and hover highlighting -->
                <CircleViewer
                    v-for="viewer in visibleCircleViewers"
                    :key="viewer.id"
                    :viewer-id="viewer.id"
                    :drag-state="dragState"
                    :hovered-document-id="hoveredDocumentId"
                    @start-reorder="handleStartReorder"
                    @drag-enter="handleDragEnter"
                    @drag-leave="handleDragLeave"
                    @drop="handleDrop"
                    @close-viewer="handleCloseViewer"
                    @viewer-click="handleViewerContainerClick"
                    @show-dropdown="handleShowDropdown"
                    @open-document-viewer="handleOpenDocumentViewer"
                />
                
                <!-- Square Viewer -->
                <div class="square-viewer" @click="handleSquareViewerContainerClick">
                    <!-- Circle Characteristics Bar -->
                    <SquareCharacteristicsBar />
                    
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
                        <!-- Connection Rendering - Use combined connections (regular + explicit) with drag state -->
                        <ConnectionComponent
                                v-for="connection in allSquareConnections"
                                :key="connection.id"
                                :connection="connection"
                                :entity-drag-state="squareDragState"
                                :demo-mode="isDemoMode"
                            />
                        <EntityComponent
                                v-for="square in currentSquares"
                                :key="square.id"
                                :entity="square"
                                entity-type="square"
                                :is-selected="dataStore.isSquareSelected(square.id)"
                                :data-store="dataStore"
                                :demo-mode="isDemoMode"
                                @select="handleSquareSelect"
                                @update-position="handleSquarePositionUpdate"
                                @update-name="handleSquareNameUpdate"
                                @move-multiple="handleSquareMoveMultiple"
                                @drag-start="handleSquareDragStart"
                                @drag-move="handleSquareDragMove"
                                @drag-end="handleSquareDragEnd"
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

<!-- States Picker Modal -->
<CBStatesPickerModal 
    v-if="isStatesPickerOpen && selectedCircle"
    :selectedCircle="selectedCircle"
    class="app-global-picker-modal"
    style="z-index: 8999 !important;"
    @close="closePickerAction('states')"
    @picker-state-change="handleStatePickerChange"
/>

<!-- State-Specific Global Picker Modals -->
<template v-if="statePickerBridge">
    <ColorPickerModal 
        v-if="statePickerBridge.isColorPickerOpen"
        :colorFamilies="statePickerBridge.colorFamilies"
        :isColorSelected="statePickerBridge.isColorSelected"
        class="app-global-picker-modal"
        @selectColor="statePickerBridge.handleColorSelect"
        @close="() => statePickerBridge.closePickerAction('color')"
    />

    <CircleEmojiPickerModal 
        v-if="statePickerBridge.isCircleEmojiPickerOpen"
        :currentEmoji="statePickerBridge.getCurrentEmoji('circleEmoji')"
        class="app-global-picker-modal"
        @selectCircleEmoji="statePickerBridge.handleCircleEmojiSelect"
        @close="() => statePickerBridge.closePickerAction('circleEmoji')"
    />

    <CircleEmojiPickerModal 
        v-if="statePickerBridge.isDemandEmojiPickerOpen"
        :currentEmoji="statePickerBridge.getCurrentEmoji('demandEmoji')"
        class="app-global-picker-modal"
        @selectCircleEmoji="statePickerBridge.handleDemandEmojiSelect"
        @close="() => statePickerBridge.closePickerAction('demandEmoji')"
    />

    <CircleEmojiPickerModal 
        v-if="statePickerBridge.isCauseEmojiPickerOpen"
        :currentEmoji="statePickerBridge.getCurrentEmoji('causeEmoji')"
        class="app-global-picker-modal"
        @selectCircleEmoji="statePickerBridge.handleCauseEmojiSelect"
        @close="() => statePickerBridge.closePickerAction('causeEmoji')"
    />

    <CircleEmojiPickerModal 
        v-if="statePickerBridge.isTriggerEmojiPickerOpen"
        :currentEmoji="statePickerBridge.getCurrentTriggerEmoji(statePickerBridge.currentEditingStateID)"
        class="app-global-picker-modal"
        @selectCircleEmoji="statePickerBridge.handleTriggerEmojiSelect"
        @close="statePickerBridge.closeTriggerEmojiPicker"
    />
</template>

            <!-- Global Picker Modals - Positioned at app level to avoid clipping -->
            <template v-if="shouldShowCircleCharacteristicControls">
                <!-- Type Picker Modal -->
                <TypePickerModal 
                    v-if="isTypePickerOpen"
                    :circleTypes="circleTypes"
                    :isTypeSelected="isTypeSelected"
                    class="app-global-picker-modal"
                    @selectType="handleTypeSelect"
                    @close="closePickerAction('type')"
                />

                <!-- Secondary Name Picker Modal -->
                <CBSecondaryNamePickerModal 
                    v-if="isSecondaryNamePickerOpen"
                    :currentSecondaryName="secondaryName"
                    class="app-global-picker-modal"
                    @selectSecondaryName="handleSecondaryNameSelect"
                    @close="closePickerAction('secondaryName')"
                />

                <!-- Circle Emoji Picker Modals -->
                <CircleEmojiPickerModal 
                    v-if="isCircleEmojiPickerOpen"
                    :currentEmoji="getCurrentCircleEmoji"
                    class="app-global-picker-modal"
                    @selectCircleEmoji="handleCircleEmojiSelect"
                    @close="closePickerAction('circleEmoji')"
                />

                <CircleEmojiPickerModal 
                    v-if="isCauseEmojiPickerOpen"
                    :currentEmoji="getEmojiValue('causeEmoji')"
                    class="app-global-picker-modal"
                    @selectCircleEmoji="handleCauseEmojiSelect"
                    @close="closePickerAction('causeEmoji')"
                />
                
                <CircleEmojiPickerModal 
                    v-if="isDemandEmojiPickerOpen"
                    :currentEmoji="getEmojiValue('demandEmoji')"
                    class="app-global-picker-modal"
                    @selectCircleEmoji="handleDemandEmojiSelect"
                    @close="closePickerAction('demandEmoji')"
                />
                
                <!-- Color Picker Modals -->
                <ColorPickerModal 
                    v-if="isColorPickerOpen"
                    :colorFamilies="colorFamilies"
                    :isColorSelected="isColorSelected"
                    class="app-global-picker-modal"
                    @selectColor="handleColorSelect"
                    @close="closePickerAction('color')"
                />

                <ColorPickerModal 
                    v-if="isSecondaryColorPickerOpen"
                    :colorFamilies="colorFamilies"
                    :isColorSelected="isSecondaryColorSelected"
                    class="app-global-picker-modal"
                    @selectColor="handleSecondaryColorSelect"
                    @close="closePickerAction('secondaryColor')"
                />

                <!-- Energy Picker Modal -->
                <EnergyPickerModal 
                    v-if="isEnergyPickerOpen"
                    :energyTypes="energyTypes"
                    :isEnergySelected="isEnergySelected"
                    class="app-global-picker-modal"
                    @selectEnergy="handleEnergySelect"
                    @close="closePickerAction('energy')"
                />
                
                <!-- Connection Energy Picker Modal -->
                <EnergyPickerModal 
                    v-if="isConnectionEnergyPickerOpen"
                    :energyTypes="energyTypes"
                    :isEnergySelected="isConnectionEnergySelected"
                    class="app-global-picker-modal"
                    @selectEnergy="handleConnectionEnergySelect"
                    @close="closePickerAction('connectionEnergy')"
                />
            </template>
        </div>
    `
};
