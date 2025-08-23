// DocumentIconControlsComponent.js - Controls for document icons in the dock
import { injectComponentStyles } from './styleUtils.js';

// Component styles
// Update the styles in DocumentIconControlsComponent.js:

const componentStyles = `
    /* Document icon controls - only visible on hover */
    .document-icon-controls-container {
        position: absolute;
        top: 0;
        right: 0;
        display: block; /* Changed from 'none' to 'block' */
        opacity: 0;     /* Start hidden via opacity instead */
        transition: opacity 0.2s ease;
        z-index: 1010;
    }

    .document-icon-controls {
        display: flex;
        flex-direction: row;
        gap: 2px;
        opacity: 1; /* Controls are visible when container is visible */
        transition: none; /* Remove transition conflicts */
        pointer-events: auto;
        z-index: 1009;
        padding: 2px;
    }

    .document-icon:hover .document-icon-controls-container {
        opacity: 1; /* Show on hover via opacity */
    }

    /* Rest of the styles remain the same... */
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
        width: 12px;
        height: 12px;
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

    .close-viewer-button {
        background-color: #666;
        color: white;
        border: 1px solid #888;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
        line-height: 1;
    }

    .close-viewer-button:hover {
        background-color: #d32f2f;
        border-color: #f44336;
        transform: scale(1.1);
    }

    .close-viewer-button:active {
        transform: scale(0.9);
    }

    .delete-document-button {
        background-color: #d32f2f;
        color: white;
        border: 1px solid #f44336;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        font-size: 10px;
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
        },
        hasOpenViewer: {
            type: Boolean,
            default: false
        }
    },
    emits: ['delete-document', 'toggle-pin', 'close-viewer'],
    setup(props, { emit }) {
        const handleDeleteClick = (e) => {
            e.stopPropagation(); // Prevent triggering document click
            emit('delete-document', props.documentId);
        };

        const handlePinClick = (e) => {
            e.stopPropagation(); // Prevent triggering document click
            emit('toggle-pin', props.documentId);
        };

        const handleCloseViewerClick = (e) => {
            e.stopPropagation(); // Prevent triggering document click
            emit('close-viewer', props.documentId);
        };

        return {
            handleDeleteClick,
            handlePinClick,
            handleCloseViewerClick
        };
    },
    template: `
        <div class="document-icon-controls-container">
		<div class="document-icon-controls">
		    <button 
			:class="['pin-document-button', { pinned: isPinned }]"
			@click="handlePinClick"
			:title="isPinned ? 'Unpin document' : 'Pin document'"
		    >📌</button>
		    <button 
			v-if="hasOpenViewer"
			class="close-viewer-button"
			@click="handleCloseViewerClick"
			title="Close viewer for this document"
		    >×</button>
		    <button 
			v-if="canDelete"
			class="delete-document-button"
			@click="handleDeleteClick"
			title="Delete document"
		    >🗑️</button>
		</div>
        </div>
    `
};
