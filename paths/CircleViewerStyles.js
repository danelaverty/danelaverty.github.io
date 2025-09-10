// CircleViewerStyles.js - Component styles for CircleViewer
import { injectComponentStyles } from './styleUtils.js';

// Enhanced component styles with drop target highlighting, animation support, and background cycling
const componentStyles = `
    .circle-viewer {
        position: relative;
        height: 100vh;
        background-color: #111;
        border-right: 2px solid #333;
        flex-shrink: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        cursor: auto;
        transition: all 0.3s ease;
    }

    .circle-viewer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-repeat: no-repeat;
        background-position: center 45px;
        opacity: 0.3;
        pointer-events: none;
        z-index: 0;
        transition: opacity 0.3s ease;
    }

    /* Background image variants */
    .circle-viewer.background-silhouette::before {
        background-image: url('silhouette.svg');
        opacity: 0.3;
    }

    .circle-viewer.background-cycle::before {
        background-image: url('cycle.svg');
        opacity: 0.3;
    }

    .circle-viewer.background-none::before {
        opacity: 0;
    }

    .circle-viewer.selected {
        background-color: #131313;
        border-right-color: #444;
    }

    /* Drop target highlighting styles */
    .circle-viewer.drop-target-left {
        border-left: 4px solid #4CAF50;
        background-color: rgba(76, 175, 80, 0.05);
        transform: translateX(2px);
    }

    .circle-viewer.drop-target-right {
        border-right: 4px solid #4CAF50;
        background-color: rgba(76, 175, 80, 0.05);
        transform: translateX(-2px);
    }

    .circle-viewer.being-dragged {
        opacity: 0.7;
        transform: scale(0.98);
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    /* Drop zone indicators */
    .drop-zone-indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(
            to bottom,
            transparent 0%,
            #4CAF50 20%,
            #4CAF50 80%,
            transparent 100%
        );
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        z-index: 1001;
    }

    .drop-zone-indicator.left {
        left: -2px;
    }

    .drop-zone-indicator.right {
        right: -2px;
    }

    .circle-viewer.drop-target-left .drop-zone-indicator.left,
    .circle-viewer.drop-target-right .drop-zone-indicator.right {
        opacity: 1;
        animation: pulse-glow 1.5s infinite;
    }

    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
        }
        50% {
            box-shadow: 0 0 16px rgba(76, 175, 80, 0.9);
        }
    }

    .viewer-content {
        flex: 1;
        position: relative;
        margin-top: 40px;
        overflow: hidden;
        transition: margin-top 0.2s ease;
    }

    .circle-viewer::before {
        background-position: center 45px;
        transition: background-position 0.2s ease;
    }

    .resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        width: 4px;
        height: 100%;
        cursor: ew-resize;
        z-index: 1001;
        background-color: transparent;
        transition: background-color 0.2s ease;
    }

    .resize-handle:hover {
        background-color: #4CAF50;
    }

	.circle-viewer.resizing {
		transition: none !important;
	}

    /* Hide resize handle during drag operations */
    .circle-viewer.drop-target-left .resize-handle,
    .circle-viewer.drop-target-right .resize-handle,
    .circle-viewer.being-dragged .resize-handle {
        opacity: 0;
        pointer-events: none;
    }

    /* Rectangle selection styles */
    .selection-rectangle {
        position: absolute;
        border: 1px dashed #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
        pointer-events: none;
        z-index: 1000;
    }

    /* Animation copy styling */
    .entity-container.animation-copy {
        opacity: 0.8;
        pointer-events: none;
        z-index: 998; /* Below normal entities but above connections */
    }

    .entity-container.animation-dimmed {
        opacity: 0.2;
    }
`;

injectComponentStyles('circle-viewer', componentStyles);
