// ViewerControls.js - Top bar controls for circle viewers
import { ref, computed, nextTick, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
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

    /* Compact layout for narrow viewers - only expand on hover */
    .viewer-controls.compact {
        height: 30px;
        flex-direction: column;
        align-items: stretch;
    }

    .viewer-controls.compact:hover {
        height: 60px;
    }

    /* NEW: Lighter background when viewer is selected */
    .viewer-controls.selected {
        background-color: #333;
        border-bottom-color: #555;
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

    /* Show reorder handle on hover */
    .viewer-controls:hover .reorder-handle {
        opacity: 1;
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

    /* NEW: Lighter handle when viewer is selected */
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

    .viewer-title-input {
        background: transparent;
        border: 1px solid #666;
        color: white;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 3px;
        width: 100%;
    }

    .viewer-title-input:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .viewer-buttons {
        display: flex;
        align-items: center;
        gap: 2px;
        padding-right: 4px;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    /* Show buttons on hover */
    .viewer-controls:hover .viewer-buttons {
        opacity: 1;
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

    .viewer-button.minimize:hover {
        background-color: #4CAF50;
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
`;

injectComponentStyles('viewer-controls', componentStyles);

export const ViewerControls = {
    props: {
        viewerId: {
            type: String,
            required: true
        }
    },
    emits: ['start-reorder', 'minimize', 'close'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isEditingTitle = ref(false);
        const titleInputRef = ref(null);
        const controlsRef = ref(null);
        const isCompact = ref(false);
        
        // Width threshold for compact mode (in pixels)
        const COMPACT_THRESHOLD = 200;

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        const viewerTitle = computed(() => dataStore.getViewerTitle(props.viewerId));
        
        // Check if this viewer is selected
        const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));

        // Check viewer width and update compact mode
        const checkCompactMode = () => {
            if (viewer.value) {
                isCompact.value = viewer.value.width < COMPACT_THRESHOLD;
            }
        };

        // Watch for viewer width changes
        const updateCompactMode = () => {
            checkCompactMode();
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

        const startTitleEdit = () => {
            isEditingTitle.value = true;
            nextTick(() => {
                if (titleInputRef.value) {
                    titleInputRef.value.focus();
                    titleInputRef.value.select();
                }
            });
        };

        const finishTitleEdit = (newTitle) => {
            isEditingTitle.value = false;
            
            if (newTitle.trim() === '') {
                // Reset to default title
                dataStore.updateCircleViewer(props.viewerId, { customTitle: null });
            } else if (newTitle.trim() !== viewerTitle.value) {
                dataStore.updateCircleViewer(props.viewerId, { customTitle: newTitle.trim() });
            }
        };

        const cancelTitleEdit = () => {
            isEditingTitle.value = false;
        };

        const handleTitleKeydown = (e) => {
            if (e.key === 'Enter') {
                finishTitleEdit(e.target.value);
            } else if (e.key === 'Escape') {
                cancelTitleEdit();
            }
        };

        const handleReorderMouseDown = (e) => {
            emit('start-reorder', e);
        };

        const handleMinimize = () => {
            emit('minimize');
        };

        const handleClose = () => {
            emit('close');
        };

        const handleBackgroundToggle = () => {
            const currentState = viewer.value?.showBackground !== false; // Default to true
            dataStore.updateCircleViewer(props.viewerId, { 
                showBackground: !currentState 
            });
        };

        return {
            viewer,
            viewerTitle,
            isEditingTitle,
            titleInputRef,
            controlsRef,
            isSelected,
            isCompact,
            startTitleEdit,
            finishTitleEdit,
            handleTitleKeydown,
            handleReorderMouseDown,
            handleMinimize,
            handleClose,
            handleBackgroundToggle
        };
    },
    template: `
        <div 
            ref="controlsRef"
            :class="[
                'viewer-controls', 
                { 
                    selected: isSelected,
                    compact: isCompact 
                }
            ]"
        >
            <div class="controls-top-row">
                <div 
                    class="reorder-handle"
                    @mousedown="handleReorderMouseDown"
                    title="Drag to reorder viewers"
                >⋮⋮</div>
                
                <div class="viewer-title" @click="startTitleEdit" v-if="!isEditingTitle">
                    {{ viewerTitle }}
                </div>
                
                <input
                    v-else
                    ref="titleInputRef"
                    class="viewer-title-input"
                    :value="viewerTitle"
                    @blur="finishTitleEdit($event.target.value)"
                    @keydown="handleTitleKeydown"
                />
                
                <div class="viewer-buttons">
                    <button 
                        class="viewer-button background-toggle"
                        :class="{ active: viewer?.showBackground !== false }"
                        @click="handleBackgroundToggle"
                        title="Toggle background image"
                    >∘</button>
                    <button 
                        class="viewer-button minimize"
                        @click="handleMinimize"
                        title="Minimize viewer"
                    >_</button>
                    <button 
                        class="viewer-button close"
                        @click="handleClose"
                        title="Close viewer"
                    >×</button>
                </div>
            </div>
            
            <div class="controls-bottom-row">
                <div 
                    class="reorder-handle"
                    @mousedown="handleReorderMouseDown"
                    title="Drag to reorder viewers"
                >⋮⋮</div>
                
                <div class="viewer-buttons">
                    <button 
                        class="viewer-button background-toggle"
                        :class="{ active: viewer?.showBackground !== false }"
                        @click="handleBackgroundToggle"
                        title="Toggle background image"
                    >∘</button>
                    <button 
                        class="viewer-button minimize"
                        @click="handleMinimize"
                        title="Minimize viewer"
                    >_</button>
                    <button 
                        class="viewer-button close"
                        @click="handleClose"
                        title="Close viewer"
                    >×</button>
                </div>
            </div>
        </div>
    `
};
