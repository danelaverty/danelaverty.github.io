// ViewerControls.js - Top bar controls for circle viewers
import { ref, computed, nextTick } from './vue-composition-api.js';
import { useDataStore } from './useDataStore.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
const componentStyles = `
    .viewer-controls {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        background-color: #2a2a2a;
        border-bottom: 1px solid #444;
        display: flex;
        align-items: center;
        z-index: 1002;
        user-select: none;
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
    }

    .reorder-handle:hover {
        background-color: #444;
        color: #aaa;
    }

    .reorder-handle:active {
        cursor: grabbing;
    }

    .viewer-title {
        flex: 1;
        padding: 0 12px;
        font-size: 14px;
        color: white;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color 0.2s ease;
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

        const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
        const viewerTitle = computed(() => dataStore.getViewerTitle(props.viewerId));

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

        return {
            viewer,
            viewerTitle,
            isEditingTitle,
            titleInputRef,
            startTitleEdit,
            finishTitleEdit,
            handleTitleKeydown,
            handleReorderMouseDown,
            handleMinimize,
            handleClose
        };
    },
    template: `
        <div class="viewer-controls">
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
    `
};
