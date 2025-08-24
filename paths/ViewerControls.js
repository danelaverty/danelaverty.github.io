// ViewerControls.js - Enhanced with drag state handling, document-based properties, energy system indicator, and animation loop toggle
import { ref, computed, nextTick, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';
import { useAnimationLoopManager } from './AnimationLoopManager.js';
import { injectComponentStyles } from './styleUtils.js';

// Enhanced component styles with drag state support, editing styles, energy system indicator, and animation toggle
const componentStyles = `
    .viewer-controls {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        background-color: #2a2a2a;
        border-bottom: 1px solid #444;
        display: flex;
        align-items: center;
        z-index: 1002;
        user-select: none;
        transition: background-color 0.2s ease, height 0.2s ease;
    }

    /* NEW: Energy system active styling */
    .viewer-controls.energy-active {
        background-color: #442222;
        border-bottom-color: #555;
    }

    .viewer-controls.energy-active.selected {
        background-color: #553333;
        border-bottom-color: #666;
    }

    /* Compact layout for narrow viewers - only expand on hover */
    .viewer-controls.compact {
        height: 30px;
        flex-direction: column;
        align-items: stretch;
    }

    .viewer-controls.compact:hover {
        height: 60px;
    }

    /* Lighter background when viewer is selected */
    .viewer-controls.selected {
        background-color: #333;
        border-bottom-color: #555;
    }

    /* Enhanced styling during drag operations */
    .viewer-controls.being-dragged {
        background-color: #4CAF50;
        border-bottom-color: #66BB6A;
        color: white;
    }

    .viewer-controls.drop-target {
        background-color: rgba(76, 175, 80, 0.2);
        border-bottom-color: #4CAF50;
        animation: glow-border 1.5s infinite;
    }

    @keyframes glow-border {
        0%, 100% {
            border-bottom-color: #4CAF50;
        }
        50% {
            border-bottom-color: #66BB6A;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
        }
    }

    .controls-top-row {
        display: flex;
        align-items: center;
        height: 30px;
        flex-shrink: 0;
    }

    .controls-bottom-row {
        display: none;
        align-items: center;
        justify-content: space-between;
        height: 20px;
        padding: 0 4px;
        background-color: rgba(0, 0, 0, 0.1);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .viewer-controls.compact .controls-bottom-row {
        display: flex;
    }

    /* Show bottom row on hover in compact mode */
    .viewer-controls.compact:hover .controls-bottom-row {
        opacity: 1;
    }

    .viewer-controls.compact .viewer-buttons {
        display: none;
    }

    .viewer-controls.compact .reorder-handle {
        display: none;
    }

    .viewer-controls.compact .controls-bottom-row .viewer-buttons {
        display: flex;
    }

    .viewer-controls.compact .controls-bottom-row .reorder-handle {
        display: flex;
    }

    .reorder-handle {
        width: 20px;
        height: 100%;
        background-color: #333;
        border-right: 1px solid #444;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        font-size: 12px;
        flex-shrink: 0;
        opacity: 0;
        transition: all 0.2s ease;
    }

    /* Energy system active reorder handle */
    .viewer-controls.energy-active .reorder-handle {
        background-color: #553333;
        border-right-color: #555;
    }

    /* Show reorder handle on hover or during drag operations */
    .viewer-controls:hover .reorder-handle,
    .viewer-controls.drag-active .reorder-handle {
        opacity: 1;
    }

    /* Enhanced reorder handle during drag */
    .viewer-controls.being-dragged .reorder-handle {
        background-color: #66BB6A;
        color: white;
        cursor: grabbing;
        opacity: 1;
    }

    /* Disabled state during other drag operations */
    .viewer-controls.drag-disabled .reorder-handle {
        cursor: not-allowed;
        opacity: 0.3;
    }

    /* Compact mode reorder handle adjustments */
    .viewer-controls.compact .controls-bottom-row .reorder-handle {
        width: 18px;
        height: 18px;
        border-right: none;
        border-radius: 2px;
        font-size: 10px;
    }

    .reorder-handle:hover {
        background-color: #444;
        color: #aaa;
    }

    /* Energy system active reorder handle hover */
    .viewer-controls.energy-active .reorder-handle:hover {
        background-color: #664444;
        color: #aaa;
    }

    .reorder-handle:active {
        cursor: grabbing;
    }

    /* Lighter handle when viewer is selected */
    .viewer-controls.selected .reorder-handle {
        background-color: #3a3a3a;
        border-right-color: #555;
    }

    /* Energy system active + selected reorder handle */
    .viewer-controls.energy-active.selected .reorder-handle {
        background-color: #664444;
        border-right-color: #666;
    }

    .viewer-title {
        flex: 1;
        padding: 0 12px;
        font-size: 14px;
        color: #CCC;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }

    /* Enhanced title styling during drag */
    .viewer-controls.being-dragged .viewer-title {
        color: white;
        font-weight: 500;
    }

    /* Adjust title padding when controls are hidden */
    .viewer-controls:not(:hover) .viewer-title {
        padding: 0 4px;
    }

    /* In compact mode, title gets full width when not hovering */
    .viewer-controls.compact:not(:hover) .viewer-title {
        padding: 0 12px;
    }

    .viewer-title:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }

    /* Energy system active title hover */
    .viewer-controls.energy-active .viewer-title:hover {
        background-color: rgba(255, 255, 255, 0.08);
    }

    /* Disable title editing during drag operations */
    .viewer-controls.drag-active .viewer-title {
        pointer-events: none;
    }

    /* Title editing styles */
    .viewer-title.editing {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }

    .viewer-title-input {
        background: transparent;
        border: 1px solid #4CAF50;
        color: white;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 3px;
        width: 100%;
        outline: none;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    }

    .viewer-title-input:focus {
        border-color: #66BB6A;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
    }

    .viewer-buttons {
        display: flex;
        align-items: center;
        gap: 2px;
        padding-right: 4px;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.2s ease;
        position: absolute;
        right: 0;
    }

    /* Show buttons on hover */
    .viewer-controls:hover .viewer-buttons {
        opacity: 1;
    }

    /* Hide buttons during drag operations and editing */
    .viewer-controls.being-dragged .viewer-buttons,
    .viewer-controls.drag-disabled .viewer-buttons,
    .viewer-controls.editing .viewer-buttons {
        opacity: 0.3;
        pointer-events: none;
    }

    /* Smaller buttons in compact mode */
    .viewer-controls.compact .controls-bottom-row .viewer-buttons {
        gap: 1px;
    }

    .viewer-button {
        width: 24px;
        height: 24px;
        border: none;
        background-color: transparent;
        color: #888;
        cursor: pointer;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.2s ease;
    }

    /* Smaller buttons in compact mode */
    .viewer-controls.compact .viewer-button {
        width: 20px;
        height: 18px;
        font-size: 11px;
    }

    .viewer-button:hover {
        background-color: #444;
        color: #fff;
    }

    /* Energy system active button hover */
    .viewer-controls.energy-active .viewer-button:hover {
        background-color: #555;
        color: #fff;
    }

    .viewer-button.close:hover {
        background-color: #f44336;
    }

    .viewer-button.background-toggle.active {
        background-color: rgba(255, 255, 255, .08);
    }

    .viewer-button.background-toggle:hover {
        background-color: #666;
    }

    .viewer-button.background-toggle.active:hover {
        background-color: rgba(255, 255, 255, .15);
    }

    /* Energy system active background toggle */
    .viewer-controls.energy-active .viewer-button.background-toggle:hover {
        background-color: #777;
    }

    .viewer-controls.energy-active .viewer-button.background-toggle.active:hover {
        background-color: rgba(255, 255, 255, .2);
    }

    .viewer-button.animation-toggle.active {
        background-color: #4CAF50;
        color: white;
    }

    .viewer-button.animation-toggle:hover {
        background-color: #666;
    }

    .viewer-button.animation-toggle.active:hover {
        background-color: #66BB6A;
    }

    /* Energy system active animation toggle */
    .viewer-controls.energy-active .viewer-button.animation-toggle:hover {
        background-color: #777;
    }

    .viewer-controls.energy-active .viewer-button.animation-toggle.active:hover {
        background-color: #77CC7A;
    }
`;

injectComponentStyles('viewer-controls', componentStyles);

export const ViewerControls = {
    props: {
        viewerId: {
            type: String,
            required: true
        },
        // New prop for drag state
        dragState: {
            type: Object,
            default: () => ({
                isDragging: false,
                draggedViewerId: null,
                dropTarget: null
            })
        }
    },
    emits: ['start-reorder', 'close'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const proximitySystem = useEnergyProximitySystem(); // NEW: Get proximity system instance
        const animationManager = useAnimationLoopManager(); // NEW: Get animation manager instance
        const controlsRef = ref(null);
        const titleInputRef = ref(null);
        const isCompact = ref(false);
        const isEditing = ref(false);
        const editingName = ref('');
        
        // Width threshold for compact mode (in pixels)
        const COMPACT_THRESHOLD = 200;

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        const viewerTitle = computed(() => dataStore.getViewerTitle(props.viewerId));
        
        // NEW: Get viewer properties from document
        const viewerProperties = computed(() => {
            return dataStore.getViewerProperties(props.viewerId);
        });
        
        // Check if this viewer is selected
        const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));

        // NEW: Check if energy proximity system is active for this viewer
        const isEnergyActive = computed(() => {
            // Force reactivity by calling both methods
            const activeViewers = proximitySystem.getActiveViewers();
            const isActive = proximitySystem.isViewerActive(props.viewerId);
            
            console.log(`[ViewerControls] Energy active check for viewer ${props.viewerId}:`, isActive);
            console.log(`[ViewerControls] All active viewers from proximity system:`, activeViewers);
            console.log(`[ViewerControls] Active viewers includes this viewer:`, activeViewers.includes(props.viewerId));
            
            return isActive;
        });

        // NEW: Check if animation loop is active for this viewer
        const isAnimationActive = ref(false);

        // Watch for animation loop status changes
        const updateAnimationStatus = () => {
            isAnimationActive.value = animationManager.isLoopActive(props.viewerId);
        };

        // Listen for animation loop events
        onMounted(() => {
            updateAnimationStatus();
            window.addEventListener('animationLoopUpdate', updateAnimationStatus);
            window.addEventListener('animationLoopStopped', updateAnimationStatus);
        });

        onUnmounted(() => {
            window.removeEventListener('animationLoopUpdate', updateAnimationStatus);
            window.removeEventListener('animationLoopStopped', updateAnimationStatus);
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

        const isDragActive = computed(() => {
            return props.dragState.isDragging;
        });

        const isDragDisabled = computed(() => {
            return props.dragState.isDragging && props.dragState.draggedViewerId !== props.viewerId;
        });

        // Check viewer width and update compact mode
        const checkCompactMode = () => {
            if (viewerProperties.value) {
                isCompact.value = viewerProperties.value.width < COMPACT_THRESHOLD;
            }
        };

        // Set up a mutation observer to watch for width changes
        let resizeObserver = null;
        
        onMounted(() => {
            checkCompactMode();
            
            // Use ResizeObserver if available, otherwise fall back to periodic checks
            if (window.ResizeObserver && controlsRef.value) {
                resizeObserver = new ResizeObserver(() => {
                    checkCompactMode();
                });
                resizeObserver.observe(controlsRef.value.parentElement);
            } else {
                // Fallback: check periodically
                const interval = setInterval(checkCompactMode, 100);
                onUnmounted(() => clearInterval(interval));
            }
        });

        onUnmounted(() => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        });

        // Title editing functionality
        const handleTitleDoubleClick = async () => {
            // Prevent editing during drag operations
            if (isDragActive.value) return;
            
            // Get the current document for this viewer
            const currentDoc = dataStore.getCircleDocumentForViewer(props.viewerId);
            if (!currentDoc) return;
            
            isEditing.value = true;
            editingName.value = currentDoc.name;
            
            // Focus the input after Vue updates the DOM
            await nextTick();
            if (titleInputRef.value) {
                titleInputRef.value.focus();
                titleInputRef.value.select();
            }
        };

        const handleTitleSave = () => {
            if (!isEditing.value) return;
            
            const currentDoc = dataStore.getCircleDocumentForViewer(props.viewerId);
            if (!currentDoc) {
                cancelEditing();
                return;
            }
            
            const newName = editingName.value.trim();
            if (newName && newName !== currentDoc.name) {
                dataStore.updateCircleDocumentName(currentDoc.id, newName);
            }
            
            cancelEditing();
        };

        const cancelEditing = () => {
            isEditing.value = false;
            editingName.value = '';
        };

        const handleTitleKeydown = (e) => {
            if (e.key === 'Enter') {
                handleTitleSave();
            } else if (e.key === 'Escape') {
                cancelEditing();
            }
        };

        const handleTitleBlur = () => {
            handleTitleSave();
        };

        const handleReorderMouseDown = (e) => {
            // Prevent starting reorder if another drag is in progress or if editing
            if (isDragDisabled.value || isEditing.value) {
                e.preventDefault();
                return;
            }
            
            emit('start-reorder', e);
        };

        const handleClose = () => {
            // Prevent actions during drag operations or editing
            if (isDragActive.value || isEditing.value) return;
            emit('close');
        };

        const handleBackgroundToggle = () => {
            // Prevent actions during drag operations or editing
            if (isDragActive.value || isEditing.value) return;
            
            const currentState = viewerProperties.value.showBackground;
            
            // Update the viewer properties, which will be persisted to the document
            dataStore.updateCircleViewer(props.viewerId, { 
                showBackground: !currentState 
            });
        };

        const handleAnimationToggle = () => {
            // Prevent actions during drag operations or editing
            if (isDragActive.value || isEditing.value) return;
            
            if (isAnimationActive.value) {
                // Stop animation
                animationManager.stopLoop(props.viewerId);
            } else {
                // Start animation - get circles for this viewer
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) return;
                
                const circles = dataStore.getCirclesForDocument(documentId);
                const viewerProps = viewerProperties.value;
                
                const started = animationManager.startLoop(
                    props.viewerId, 
                    circles, 
                    viewerProps.width
                );
                
                if (!started) {
                    console.log('Cannot start animation: no valid attractor/attractee pairs found');
                }
            }
            
            // Update status
            updateAnimationStatus();
        };

        return {
            viewer,
            viewerTitle,
            viewerProperties,
            controlsRef,
            titleInputRef,
            isSelected,
            isCompact,
            isEditing,
            editingName,
            isEnergyActive, // NEW: Expose energy active state
            isAnimationActive, // NEW: Expose animation active state
            isBeingDragged,
            isDropTarget,
            isDragActive,
            isDragDisabled,
            handleTitleDoubleClick,
            handleTitleSave,
            handleTitleKeydown,
            handleTitleBlur,
            handleReorderMouseDown,
            handleClose,
            handleBackgroundToggle,
            handleAnimationToggle // NEW: Expose animation toggle handler
        };
    },
    template: `
        <div 
            ref="controlsRef"
            :class="[
                'viewer-controls', 
                { 
                    selected: isSelected,
                    compact: isCompact,
                    editing: isEditing,
                    'energy-active': isEnergyActive,
                    'being-dragged': isBeingDragged,
                    'drop-target': isDropTarget,
                    'drag-active': isDragActive,
                    'drag-disabled': isDragDisabled
                }
            ]"
        >
            <div class="controls-top-row">
                <div 
                    class="reorder-handle"
                    @mousedown="handleReorderMouseDown"
                    :title="isDragDisabled ? 'Drag operation in progress' : 'Drag to reorder viewers'"
                >⋮⋮</div>
                
                <div 
                    v-if="!isEditing"
                    class="viewer-title"
                    @dblclick="handleTitleDoubleClick"
                    :title="'Double-click to edit: ' + viewerTitle"
                >
                    {{ viewerTitle }}
                </div>
                
                <input
                    v-if="isEditing"
                    ref="titleInputRef"
                    v-model="editingName"
                    class="viewer-title-input"
                    @keydown="handleTitleKeydown"
                    @blur="handleTitleBlur"
                    @click.stop
                    placeholder="Document name"
                />
                
                <div class="viewer-buttons">
                    <button 
                        class="viewer-button animation-toggle"
                        :class="{ active: isAnimationActive }"
                        @click="handleAnimationToggle"
                        title="Toggle animation loop"
                        :disabled="isDragActive || isEditing"
                    >▶</button>
                    <button 
                        class="viewer-button background-toggle"
                        :class="{ active: viewerProperties.showBackground }"
                        @click="handleBackgroundToggle"
                        title="Toggle background image"
                        :disabled="isDragActive || isEditing"
                    >∘</button>
                    <button 
                        class="viewer-button close"
                        @click="handleClose"
                        title="Close viewer"
                        :disabled="isDragActive || isEditing"
                    >×</button>
                </div>
            </div>
            
            <div class="controls-bottom-row">
                <div 
                    class="reorder-handle"
                    @mousedown="handleReorderMouseDown"
                    :title="isDragDisabled ? 'Drag operation in progress' : 'Drag to reorder viewers'"
                >⋮⋮</div>
                
                <div class="viewer-buttons">
                    <button 
                        class="viewer-button animation-toggle"
                        :class="{ active: isAnimationActive }"
                        @click="handleAnimationToggle"
                        title="Toggle animation loop"
                        :disabled="isDragActive || isEditing"
                    >▶</button>
                    <button 
                        class="viewer-button background-toggle"
                        :class="{ active: viewerProperties.showBackground }"
                        @click="handleBackgroundToggle"
                        title="Toggle background image"
                        :disabled="isDragActive || isEditing"
                    >∘</button>
                    <button 
                        class="viewer-button close"
                        @click="handleClose"
                        title="Close viewer"
                        :disabled="isDragActive || isEditing"
                    >×</button>
                </div>
            </div>
        </div>
    `
};
