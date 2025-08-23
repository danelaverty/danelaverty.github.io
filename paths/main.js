// main.js - Updated with dynamic dock width support
import { createApp } from './vue-composition-api.js';
import { App } from './AppComponent.js';
import { injectComponentStyles } from './styleUtils.js';

// Global dock width management
let currentDockWidth = 60; // Default dock width
let isDockCollapsed = false; // Track collapsed state

// Function to update app container margin based on dock width
const updateAppContainerMargin = (width, collapsed = false) => {
    const appContainer = document.querySelector('.app-container.has-documents-dock');
    if (appContainer) {
        const effectiveWidth = collapsed ? 4 : width;
        appContainer.style.marginLeft = `${effectiveWidth}px`;
        appContainer.style.width = `calc(100vw - ${effectiveWidth}px)`;
    }
    currentDockWidth = width;
    isDockCollapsed = collapsed;
};

// Listen for dock resize events
const setupDockResizeListener = () => {
    // Handle real-time resizing during drag
    window.addEventListener('documentsDockResizing', (e) => {
        const newWidth = e.detail.width;
        const isResizing = e.detail.isResizing;
        const collapsed = e.detail.collapsed || false;
        
        // Add resizing class to disable transitions during drag
        const appContainer = document.querySelector('.app-container.has-documents-dock');
        if (appContainer && isResizing) {
            appContainer.classList.add('dock-resizing');
        }
        
        updateAppContainerMargin(newWidth, collapsed);
    });
    
    // Handle resize completion
    window.addEventListener('documentsDockResize', (e) => {
        const newWidth = e.detail.width;
        const isResizing = e.detail.isResizing;
        const collapsed = e.detail.collapsed || false;
        
        // Remove resizing class to re-enable transitions
        const appContainer = document.querySelector('.app-container.has-documents-dock');
        if (appContainer && !isResizing) {
            appContainer.classList.remove('dock-resizing');
        }
        
        updateAppContainerMargin(newWidth, collapsed);
    });
    
    // Also handle window resize to maintain proper layout
    window.addEventListener('resize', () => {
        updateAppContainerMargin(currentDockWidth, isDockCollapsed);
    });
};

// Load saved dock width on startup
const loadInitialDockState = () => {
    try {
        const savedWidth = localStorage.getItem('documentsDock_width');
        const savedCollapsed = localStorage.getItem('documentsDock_collapsed');
        
        if (savedCollapsed === 'true') {
            currentDockWidth = 4;
            isDockCollapsed = true;
            // Set initial margin for collapsed state
            setTimeout(() => updateAppContainerMargin(4, true), 0);
        } else if (savedWidth) {
            const width = parseInt(savedWidth, 10);
            if (width >= 50 && width <= 300) {
                currentDockWidth = width;
                isDockCollapsed = false;
                // Set initial margin before app mounts
                setTimeout(() => updateAppContainerMargin(width, false), 0);
            }
        }
    } catch (error) {
        console.error('Failed to load initial dock state:', error);
    }
};

// Inject global app styles with responsive dock support
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
        transition: margin-left 0.1s ease, width 0.1s ease;
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

    /* Dynamic app container left margin - will be set via JavaScript */
    .app-container.has-documents-dock {
        margin-left: 60px; /* Default, will be updated dynamically */
        width: calc(100vw - 60px); /* Default, will be updated dynamically */
    }

    /* Disable transitions during dock resize */
    .app-container.dock-resizing {
        transition: none !important;
    }

    /* Rectangle selection styles for square viewer */
    .selection-rectangle {
        position: absolute;
        border: 1px dashed #FF6B6B;
        background-color: rgba(255, 107, 107, 0.1);
        pointer-events: none;
        z-index: 1000;
    }

    /* Responsive design for smaller dock widths */
    @media (max-width: 1200px) {
        .app-container.has-documents-dock {
            /* Ensure minimum viewer space on smaller screens */
            min-width: 800px;
        }
    }

    /* Hide scrollbars in viewers but keep functionality */
    .circle-viewer::-webkit-scrollbar,
    .square-viewer::-webkit-scrollbar {
        width: 0px;
        background: transparent;
    }

    .circle-viewer,
    .square-viewer {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
`;

// Inject global styles
injectComponentStyles('global-styles', globalStyles);

// Setup dock resize functionality
setupDockResizeListener();

// Load initial dock state
loadInitialDockState();

// Initialize the Vue app
createApp(App).mount('#app');

// Export utility function for other components that might need dock width
export const getCurrentDockWidth = () => currentDockWidth;
