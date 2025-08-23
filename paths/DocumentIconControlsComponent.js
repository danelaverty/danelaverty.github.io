// DocumentIconControlsComponent.js - Controls for document icons in the dock
import { injectComponentStyles } from './styleUtils.js';

// Component styles
const componentStyles = `
    /* Document icon controls - only visible on hover */
    .document-icon-controls {
        position: absolute;
        top: -8px;
        right: -8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
    }

    .document-icon:hover .document-icon-controls {
        opacity: 1;
        pointer-events: auto;
    }

    .circle-count-badge {
        background-color: #666;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #888;
        transition: all 0.2s ease;
    }

    .document-icon.current .circle-count-badge {
        background-color: #2E7D32;
        border-color: #4CAF50;
    }

    .pin-document-button {
        background-color: #666;
        color: white;
        border: 1px solid #888;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
        line-height: 1;
    }

    .pin-document-button.pinned {
        background-color: #ff9800;
        border-color: #ffb74d;
        color: white;
    }

    .pin-document-button:hover {
        background-color: #777;
        border-color: #999;
        transform: scale(1.1);
    }

    .pin-document-button.pinned:hover {
        background-color: #ffb74d;
        border-color: #ffc947;
    }

    .pin-document-button:active {
        transform: scale(0.9);
    }

    .delete-document-button {
        background-color: #d32f2f;
        color: white;
        border: 1px solid #f44336;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
        line-height: 1;
    }

    .delete-document-button:hover {
        background-color: #f44336;
        border-color: #ff6b6b;
        transform: scale(1.1);
    }

    .delete-document-button:active {
        transform: scale(0.9);
    }
`;

injectComponentStyles('document-icon-controls', componentStyles);

export const DocumentIconControls = {
    props: {
        documentId: {
            type: String,
            required: true
        },
        circleCount: {
            type: Number,
            required: true
        },
        canDelete: {
            type: Boolean,
            default: false
        },
        isPinned: {
            type: Boolean,
            default: false
        }
    },
    emits: ['delete-document', 'toggle-pin'],
    setup(props, { emit }) {
        const handleDeleteClick = (e) => {
            e.stopPropagation(); // Prevent triggering document click
            emit('delete-document', props.documentId);
        };

        const handlePinClick = (e) => {
            e.stopPropagation(); // Prevent triggering document click
            emit('toggle-pin', props.documentId);
        };

        return {
            handleDeleteClick,
            handlePinClick
        };
    },
    template: `
        <div class="document-icon-controls">
            <div class="circle-count-badge">{{ circleCount }}</div>
            <button 
                :class="['pin-document-button', { pinned: isPinned }]"
                @click="handlePinClick"
                :title="isPinned ? 'Unpin document' : 'Pin document'"
            >📌</button>
            <button 
                v-if="canDelete"
                class="delete-document-button"
                @click="handleDeleteClick"
                title="Delete document"
            >×</button>
        </div>
    `
};
