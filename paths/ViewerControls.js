// ViewerControls.js
import { ref, computed, nextTick, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';

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

.viewer-controls.shiny {
    background-color: #442222;
    border-bottom-color: #664444;
}

.viewer-controls.selected.shiny {
    background-color: #553333;
    border-bottom-color: #775555;
}

.viewer-button.shinyness-toggle {
    position: relative;
}

.viewer-button.shinyness-toggle.active {
    background-color: rgba(255, 215, 0, 0.2);
    color: #FFD700;
}

.viewer-button.shinyness-toggle.inactive {
    background-color: transparent;
    color: #666;
}

.viewer-button.shinyness-toggle:hover {
    background-color: #666;
    color: #fff;
}

.viewer-button.shinyness-toggle.active:hover {
    background-color: rgba(255, 215, 0, 0.3);
    color: #FFED4E;
}

.viewer-button.shinyness-toggle.inactive:hover {
    background-color: #555;
    color: #aaa;
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

    .reorder-handle:active {
        cursor: grabbing;
    }

    /* Lighter handle when viewer is selected */
    .viewer-controls.selected .reorder-handle {
        background-color: #3a3a3a;
        border-right-color: #555;
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

    .viewer-button.close:hover {
        background-color: #f44336;
    }

    /* Updated background toggle styles for cycling through states */
    .viewer-button.background-toggle {
        position: relative;
    }

    .viewer-button.background-toggle.silhouette {
        background-color: rgba(255, 255, 255, .08);
        color: #ccc;
    }

    .viewer-button.background-toggle.cycle {
        background-color: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
    }

    .viewer-button.background-toggle.none {
        background-color: transparent;
        color: #666;
    }

    .viewer-button.background-toggle:hover {
        background-color: #666;
        color: #fff;
    }

    .viewer-button.background-toggle.silhouette:hover {
        background-color: rgba(255, 255, 255, .15);
        color: #fff;
    }

    .viewer-button.background-toggle.cycle:hover {
        background-color: rgba(76, 175, 80, 0.3);
        color: #66BB6A;
    }

    .viewer-button.background-toggle.none:hover {
        background-color: #555;
        color: #aaa;
    }

    .viewer-controls.document-hovered {
        background-color: #6C6F50;
        color: white;
        animation: dock-hover-glow 1.5s infinite;
    }

    @keyframes dock-hover-glow {
        0%, 100% {
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
        }
        50% {
            box-shadow: 0 2px 16px rgba(76, 175, 80, 0.6);
        }
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
        },
        hoveredDocumentId: {
            type: String,
            default: null
        }
    },
    emits: ['start-reorder', 'close'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const controlsRef = ref(null);
        const titleInputRef = ref(null);
        const isCompact = ref(false);
        const isEditing = ref(false);
        const editingName = ref('');
        
        // Width threshold for compact mode (in pixels)
        const COMPACT_THRESHOLD = 200;

        // Background cycling constants
        const BACKGROUND_TYPES = {
            SILHOUETTE: 'silhouette',
            NONE: 'none'
        };

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        const viewerTitle = computed(() => dataStore.getViewerTitle(props.viewerId));

const shinynessMode = computed(() => {
    return viewerProperties.value.shinynessMode || false;
});

const shinynessIcon = computed(() => {
    return shinynessMode.value ? '✨' : '◇';
});

const shinynessTitle = computed(() => {
    return shinynessMode.value ? 
        'Shinyness: ON (click to turn off)' : 
        'Shinyness: OFF (click to turn on)';
});
        
        const viewerProperties = computed(() => {
            return dataStore.getViewerProperties(props.viewerId);
        });
        
        // Check if this viewer is selected
        const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));

        const isDocumentHovered = computed(() => {
            if (!props.hoveredDocumentId) return false;
            const currentDoc = dataStore.getCircleDocumentForViewer(props.viewerId);
            return currentDoc && currentDoc.id === props.hoveredDocumentId;
        });

        // Background state computed properties
        const backgroundType = computed(() => {
            return viewerProperties.value.backgroundType || BACKGROUND_TYPES.SILHOUETTE;
        });

        const backgroundIcon = computed(() => {
            switch (backgroundType.value) {
                case BACKGROUND_TYPES.SILHOUETTE:
                    return '◐'; // Half circle for silhouette
                case BACKGROUND_TYPES.NONE:
                default:
                    return '○'; // Empty circle for none
            }
        });

        const backgroundTitle = computed(() => {
            switch (backgroundType.value) {
                case BACKGROUND_TYPES.SILHOUETTE:
                    return 'Background: Silhouette (click to cycle)';
                case BACKGROUND_TYPES.NONE:
                default:
                    return 'Background: None (click to cycle)';
            }
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

        // Updated background cycling handler
        const handleBackgroundCycle = () => {
            // Prevent actions during drag operations or editing
            if (isDragActive.value || isEditing.value) return;
            
            const currentType = backgroundType.value;
            let nextType;
            
            // Cycle through: silhouette -> cycle -> none -> silhouette
            switch (currentType) {
                case BACKGROUND_TYPES.SILHOUETTE:
                    nextType = BACKGROUND_TYPES.NONE;
                    break;
                case BACKGROUND_TYPES.NONE:
                default:
                    nextType = BACKGROUND_TYPES.SILHOUETTE;
                    break;
            }
            
            // Update the viewer properties, which will be persisted to the document
            dataStore.updateCircleViewer(props.viewerId, { 
                backgroundType: nextType
            });
        };

const handleShinynessToggle = () => {
    // Prevent actions during drag operations or editing
    if (isDragActive.value || isEditing.value) return;
    
    const currentShinyness = shinynessMode.value;
    const newShinyness = !currentShinyness;
    
    // Update the viewer properties, which will be persisted to the document
    dataStore.updateCircleViewer(props.viewerId, { 
        shinynessMode: newShinyness
    });
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
            backgroundType,
            backgroundIcon,
            backgroundTitle,
            BACKGROUND_TYPES,
            isDocumentHovered,
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
            handleBackgroundCycle,
shinynessMode,
shinynessIcon,
shinynessTitle,
handleShinynessToggle,
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
                    shiny: shinynessMode,
                    'document-hovered': isDocumentHovered,
                    'being-dragged': isBeingDragged,
                    'drop-target': isDropTarget,
                    'drag-active': isDragActive,
                    'drag-disabled': isDragDisabled
                }
            ]"
        >
            <div class="controls-top-row">
                <!--div 
                    class="reorder-handle"
                    @mousedown="handleReorderMouseDown"
                    :title="isDragDisabled ? 'Drag operation in progress' : 'Drag to reorder viewers'"
                >⋮⋮</div-->
                
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
                        class="viewer-button background-toggle"
                        :class="backgroundType"
                        @click="handleBackgroundCycle"
                        :title="backgroundTitle"
                        :disabled="isDragActive || isEditing"
                    >{{ backgroundIcon }}</button>
                    <button 
                        class="viewer-button shinyness-toggle"
                        :class="shinynessMode ? 'active' : 'inactive'"
                        @click="handleShinynessToggle"
                        :title="shinynessTitle"
                        :disabled="isDragActive || isEditing"
                    >{{ shinynessIcon }}</button>
                    <button 
                        class="viewer-button close"
                        @click="handleClose"
                        title="Close viewer"
                        :disabled="isDragActive || isEditing"
                    >×</button>
                </div>
            </div>
            
            <div class="controls-bottom-row">
                <!--div 
                    class="reorder-handle"
                    @mousedown="handleReorderMouseDown"
                    :title="isDragDisabled ? 'Drag operation in progress' : 'Drag to reorder viewers'"
                >⋮⋮</div-->
                
                <div class="viewer-buttons">
                    <button 
                        class="viewer-button background-toggle"
                        :class="backgroundType"
                        @click="handleBackgroundCycle"
                        :title="backgroundTitle"
                        :disabled="isDragActive || isEditing"
                    >{{ backgroundIcon }}</button>
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
