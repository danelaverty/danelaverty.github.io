// DocumentsDockResize.js - Resize functionality for DocumentsDock
import { ref, onMounted, onUnmounted } from './vue-composition-api.js';

export function createDocumentsDockResize() {
    // Resize functionality
    const dockRef = ref(null);
    const isResizing = ref(false);
    const resizeStart = ref({ x: 0, width: 60 });
    const dockWidth = ref(60); // Default dock width
    const isDockCollapsed = ref(false); // Track dock collapsed state (renamed to avoid conflict)

    // Load saved width and collapsed state from localStorage
    const loadDockState = () => {
        try {
            const savedWidth = localStorage.getItem('documentsDock_width');
            const savedCollapsed = localStorage.getItem('documentsDock_collapsed');
            
            if (savedCollapsed === 'true') {
                isDockCollapsed.value = true;
                dockWidth.value = 4;
            } else if (savedWidth) {
                const width = parseInt(savedWidth, 10);
                if (width >= 50 && width <= 300) {
                    dockWidth.value = width;
                    isDockCollapsed.value = false;
                }
            } else {
                isDockCollapsed.value = false;
            }
        } catch (error) {
            console.error('Failed to load dock state:', error);
        }
    };

    // Save dock state to localStorage
    const saveDockState = () => {
        try {
            if (isDockCollapsed.value) {
                localStorage.setItem('documentsDock_collapsed', 'true');
                localStorage.removeItem('documentsDock_width');
            } else {
                localStorage.setItem('documentsDock_width', dockWidth.value.toString());
                localStorage.removeItem('documentsDock_collapsed');
            }
        } catch (error) {
            console.error('Failed to save dock state:', error);
        }
    };

    // Update CSS custom property for reactive styling
    const updateDockWidthCSS = () => {
        if (dockRef.value) {
            if (isDockCollapsed.value) {
                dockRef.value.style.setProperty('--dock-width', '4px');
            } else {
                dockRef.value.style.setProperty('--dock-width', `${dockWidth.value}px`);
            }
        }
    };

    const startResize = (e) => {
        isResizing.value = true;
        dockRef.value.classList.add('resizing');
        resizeStart.value = {
            x: e.clientX,
            width: isDockCollapsed.value ? 4 : dockWidth.value
        };
        e.preventDefault();
    };

    const handleResize = (e) => {
        if (!isResizing.value) return;
        
        const deltaX = e.clientX - resizeStart.value.x;
        const newWidth = resizeStart.value.width + deltaX;
        
        if (newWidth < 50) {
            // Collapse the dock
            if (!isDockCollapsed.value) {
                isDockCollapsed.value = true;
                dockWidth.value = 4;
                updateDockWidthCSS();
                
                // Emit collapse event
                window.dispatchEvent(new CustomEvent('documentsDockResizing', {
                    detail: { width: 4, isResizing: true, collapsed: true }
                }));
            }
        } else {
            // Expand the dock
            const constrainedWidth = Math.max(50, Math.min(300, newWidth));
            
            if (isDockCollapsed.value) {
                isDockCollapsed.value = false;
            }
            
            dockWidth.value = constrainedWidth;
            updateDockWidthCSS();
            
            // Emit resize event
            window.dispatchEvent(new CustomEvent('documentsDockResizing', {
                detail: { width: constrainedWidth, isResizing: true, collapsed: false }
            }));
        }
    };

    const endResize = () => {
        if (!isResizing.value) return;
        
        isResizing.value = false;
        if (dockRef.value) {
            dockRef.value.classList.remove('resizing');
        }
        saveDockState();
        
        // Emit final resize event to notify app container
        const finalWidth = isDockCollapsed.value ? 4 : dockWidth.value;
        window.dispatchEvent(new CustomEvent('documentsDockResize', {
            detail: { width: finalWidth, isResizing: false, collapsed: isDockCollapsed.value }
        }));
    };

    const setupResizeListeners = () => {
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', endResize);
    };

    const cleanupResizeListeners = () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', endResize);
    };

    // Initialize resize functionality
    const initializeResize = () => {
        loadDockState();
        updateDockWidthCSS();
        setupResizeListeners();
    };

    // Cleanup resize functionality
    const cleanupResize = () => {
        cleanupResizeListeners();
    };

    return {
        // Refs
        dockRef,
        dockWidth,
        isDockCollapsed,
        
        // Functions
        startResize,
        initializeResize,
        cleanupResize,
        updateDockWidthCSS
    };
}
