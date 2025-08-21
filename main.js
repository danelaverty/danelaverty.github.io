// main.js - Main application entry point (updated with tabs support)
import { createApp } from './vue-composition-api.js';
import { App } from './AppComponent.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject global app styles
const globalStyles = `
    * {
        box-sizing: border-box;
    }
    
    body {
        margin: 0;
        padding: 0;
        background-color: black;
        font-family: Arial, sans-serif;
        overflow: hidden;
        height: 100vh;
    }

    .app-container {
        display: flex;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        overflow: hidden;
    }

    .viewers-container {
        display: flex;
        flex: 1;
        height: 100vh;
        overflow: hidden;
    }

    .square-viewer {
        flex: 1;
        height: 100vh;
        position: relative;
        background-color: #0a0a0a;
        overflow: hidden;
        min-width: 200px;
    }

    .square-viewer-content {
        width: 100%;
        height: calc(100% - 82px); /* Account for characteristics bar (50px) and tabs bar (32px) */
        position: relative;
        overflow: hidden;
        margin-top: 82px; /* Account for both bars */
    }

    /* Adjust square viewer content when characteristics bar is hidden */
    .square-viewer-content.no-characteristics-bar {
        margin-top: 32px; /* Only account for tabs bar */
        height: calc(100% - 32px);
    }

    /* Adjust app container left margin when minimized dock is visible */
    .app-container.has-minimized-dock {
        margin-left: 60px;
        width: calc(100vw - 60px);
    }

    /* Rectangle selection styles for square viewer */
    .selection-rectangle {
        position: absolute;
        border: 1px dashed #FF6B6B;
        background-color: rgba(255, 107, 107, 0.1);
        pointer-events: none;
        z-index: 1000;
    }

    /* Add viewer button in square viewer */
    .add-viewer-button {
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background-color: #333;
        color: #999;
        border: 2px solid #666;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        transition: background-color 0.2s ease;
    }

    .add-viewer-button:hover {
        background-color: #666;
    }
`;

// Inject global styles
injectComponentStyles('global-styles', globalStyles);

// Initialize the Vue app
createApp(App).mount('#app');
