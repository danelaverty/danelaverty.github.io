// DocumentsDockStyles.js - Styling for DocumentsDock component
import { injectComponentStyles } from './styleUtils.js';

// Enhanced component styles with resize handle and dock drop zone
const componentStyles = `
    .documents-dock {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: var(--dock-width, 60px); /* Use CSS custom property for dynamic width */
        min-width: 50px;
        max-width: 300px;
        background-color: #1a1a1a;
        border-right: 2px solid #333;
        display: flex;
        flex-direction: column;
        align-items: left;
        padding: 10px 0;
        gap: 8px;
        z-index: 1004;
        overflow-y: auto;
        transition: width 0.1s ease;
        
        /* Custom scrollbar styling */
        scrollbar-width: thin;
        scrollbar-color: #444 transparent;
    }

    /* Dock drop zone styling during drag operations */
    .documents-dock.dock-drop-target {
        background-color: rgba(76, 175, 80, 0.1);
        border-right-color: #4CAF50;
    }

    .documents-dock.dock-drop-invalid {
        background-color: rgba(244, 67, 54, 0.1);
        border-right-color: #f44336;
    }

    /* Collapsed dock state */
    .documents-dock.collapsed {
        width: 4px !important;
        min-width: 4px;
        padding: 0;
        gap: 0;
        overflow: hidden;
        background-color: #333;
        border-right: 1px solid #555;
        cursor: ew-resize;
    }

    /* Hide all content when collapsed */
    .documents-dock.collapsed > *:not(.dock-resize-handle) {
        display: none;
    }

    /* Special styling for collapsed resize handle */
    .documents-dock.collapsed .dock-resize-handle {
        width: 4px;
        background-color: transparent;
        cursor: ew-resize;
    }

    .documents-dock.collapsed .dock-resize-handle:hover {
        background-color: rgba(76, 175, 80, 0.3);
    }

    /* Collapsed dock hover effect */
    .documents-dock.collapsed:hover {
        background-color: #444;
        border-right-color: #777;
    }

    /* Disable transition during resize */
    .documents-dock.resizing, 
    .documents-dock.resizing .document-icon,
    .documents-dock.resizing .new-document-button,
    .documents-dock.resizing .toggle-unpinned-button {
        transition: none !important;
    }

    /* Webkit scrollbar styling for Chrome/Safari */
    .documents-dock::-webkit-scrollbar {
        width: 6px;
    }

    .documents-dock::-webkit-scrollbar-track {
        background: transparent;
    }

    .documents-dock::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 3px;
        transition: background-color 0.2s ease;
    }

    .documents-dock::-webkit-scrollbar-thumb:hover {
        background-color: #555;
    }

    .documents-dock::-webkit-scrollbar-thumb:active {
        background-color: #666;
    }

    .documents-dock.hidden {
        display: none;
    }

    /* Resize handle for the dock */
    .dock-resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        width: 4px;
        height: 100%;
        cursor: ew-resize;
        z-index: 1005;
        background-color: transparent;
        transition: background-color 0.2s ease;
    }

    .dock-resize-handle:hover {
        background-color: #4CAF50;
    }

    /* Responsive document icons based on dock width */
    .document-icon {
        width: calc(var(--dock-width, 60px) - 10px);
        min-width: 40px;
        background-color: #444;
        border: 1px solid #555;
        border-radius: 4px;
        display: flex;
		 flex-direction: column;
        align-items: left;
        justify-content: left;
        cursor: pointer;
        color: white;
        font-size: calc(var(--dock-width, 60px) * 0.15);
        min-font-size: 8px;
        max-font-size: 12px;
        text-align: left;
        word-break: break-word;
        line-height: 1.1;
        transition: all 0.2s ease;
        padding: 2px;
        position: relative;
        user-select: none;
    }

    /* Ensure minimum font size */
    .document-icon {
        font-size: max(8px, min(12px, calc(var(--dock-width, 60px) * 0.15)));
    }

    /* Document icon editing styles */
    .document-icon.editing {
        background-color: rgba(76, 175, 80, 0.1);
        border-color: #4CAF50;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
        cursor: text;
    }

    .document-icon-input {
        background: transparent;
        border: none;
        color: white;
	       font-family: sans-serif;
        font-size: inherit;
        text-align: left;
        word-break: break-word;
        line-height: 1.1;
        padding: 0;
        width: 100%;
        height: 100%;
        outline: none;
        resize: none;
        overflow: hidden;
        min-height: 20px;
    }

    .document-icon-input:focus {
        outline: none;
    }

    /* Responsive indentation for nested documents */
    .document-icon.nested-level-1 {
        width: calc(var(--dock-width, 60px) - 15px);
        margin-left: 5px;
        font-size: max(7px, min(11px, calc(var(--dock-width, 60px) * 0.13)));
	background-color: #333;
    }

    .document-icon.nested-level-1 .document-icon-input {
        font-size: inherit;
    }

    .document-icon.nested-level-2 {
        width: calc(var(--dock-width, 60px) - 20px);
        margin-left: 10px;
        font-size: max(7px, min(10px, calc(var(--dock-width, 60px) * 0.12)));
	background-color: #222;
    }

    .document-icon.nested-level-2 .document-icon-input {
        font-size: inherit;
    }

    .document-icon.nested-level-3 {
        width: calc(var(--dock-width, 60px) - 25px);
        margin-left: 15px;
        font-size: max(6px, min(9px, calc(var(--dock-width, 60px) * 0.11)));
	background-color: #111;
    }

    .document-icon.nested-level-3 .document-icon-input {
        font-size: inherit;
    }

    /* Further nesting (level 4+) */
    .document-icon.nested-deep {
        width: calc(var(--dock-width, 60px) - 30px);
        margin-left: 20px;
        font-size: max(6px, min(8px, calc(var(--dock-width, 60px) * 0.1)));
	background-color: #080808;
    }

    .document-icon.nested-deep .document-icon-input {
        font-size: inherit;
    }

    /* Collapse/expand button - responsive sizing */
    .collapse-button {
        position: absolute;
        top: 0px;
        right: 0px;
        width: max(12px, min(16px, calc(var(--dock-width, 60px) * 0.25)));
        height: max(12px, min(16px, calc(var(--dock-width, 60px) * 0.25)));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: max(8px, min(12px, calc(var(--dock-width, 60px) * 0.18)));
        font-weight: bold;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 1011;
    }

    .document-icon:hover .collapse-button {
        opacity: 1;
    }

    .collapse-button:hover {
        font-weight: bold;
    }

    /* Hide collapse button during editing */
    .document-icon.editing .collapse-button {
        opacity: 0;
        pointer-events: none;
    }

    /* Drag and drop states */
    .document-icon.dragging {
        opacity: 0.7;
        transform: scale(1.05);
        z-index: 1010;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .document-icon.drag-over {
        border-color: #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
        transform: scale(1.02);
    }

    .document-icon.drag-invalid {
        border-color: #f44336;
        background-color: rgba(244, 67, 54, 0.1);
    }

    /* Disable drag and drop during editing */
    .document-icon.editing {
        pointer-events: auto;
    }

    .document-icon.editing[draggable] {
        draggable: false;
    }

    .document-icon:hover {
        background-color: #444;
        border-color: #777;
    }

    .document-icon.current {
        background-color: #6C6F50;
        border-color: #767B6A;
    }

    /* Nested document visual indicators */
    .document-icon::before {
        content: '';
        position: absolute;
        left: -3px;
        top: 50%;
        transform: translateY(-50%);
        height: 2px;
        width: 5px;
        background-color: #666;
        border-radius: 1px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .document-icon.nested-level-1::before,
    .document-icon.nested-level-2::before,
    .document-icon.nested-level-3::before,
    .document-icon.nested-deep::before {
        opacity: 1;
    }

    /* New document button - responsive sizing */
    .new-document-button {
        width: 24px;
        height: 24px;
        background-color: #333;
        border: 1px solid #444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-size: 24px;
        font-weight: bold;
        transition: all 0.2s ease;
        margin-bottom: 8px;
        user-select: none;
    }

    .new-document-button:hover {
        background-color: #388E3C;
        border-color: #66BB6A;
        transform: scale(1.05);
    }

    .new-document-button:active {
        transform: scale(0.95);
    }

    /* Toggle button - responsive sizing */
    .toggle-unpinned-button {
        width: calc(var(--dock-width, 60px) - 10px);
        min-width: 40px;
        height: 12px;
        background-color: #333;
        border: 1px solid #555;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #888;
        font-size: max(10px, min(14px, calc(var(--dock-width, 60px) * 0.2)));
        transition: all 0.2s ease;
        margin-top: 4px;
        margin-bottom: 4px;
        user-select: none;
    }

    .toggle-unpinned-button:hover {
        background-color: #444;
        border-color: #777;
        color: #aaa;
    }

    /* Hide resize handle during drag operations */
    .documents-dock.dragging .dock-resize-handle {
        opacity: 0;
        pointer-events: none;
    }

    /* Drag preview */
    .drag-preview {
        position: fixed;
        pointer-events: none;
        z-index: 1015;
        opacity: 0.8;
        transform: rotate(5deg);
    }
`;

// Initialize styles when module is imported
export function initializeDocumentsDockStyles() {
    injectComponentStyles('documents-dock', componentStyles);
}
