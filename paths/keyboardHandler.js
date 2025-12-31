// keyboardHandler.js - Centralized keyboard event handling with reel-in support
import { 
    handleCopyOperation, 
    handleNormalPaste, 
    handleShiftCtrlV 
} from './khClipboardOperations.js';
import { 
    handleActivationToggle,
    handleKeyboardViewerReorder,
    handleDeleteOperation,
    handleBoldToggle,
    handleSelectAll,
    handleAlignment,
    handleIndicatorPicker
} from './khEntityOperations.js';

/**
 * Check if user is currently editing text
 * @returns {boolean} True if text editing is active
 */
function isTextEditingActive() {
    // Check if any element is contentEditable and focused
    const activeElement = document.activeElement;
    if (activeElement && activeElement.contentEditable === 'true') {
        return true;
    }
    
    // Check if focus is in an input or textarea
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return true;
    }
    
    return false;
}

/**
 * Create a keyboard handler with data store context
 * @param {Object} dataStore - The data store instance
 * @param {Function} onShowIndicatorPicker - Callback to show indicator picker
 * @param {Function} onReorderViewer - Callback to reorder viewers (direction: 'left' or 'right')
 * @returns {Function} The keyboard event handler
 */
export function createKeyboardHandler(dataStore, onShowIndicatorPicker = null, onReorderViewer = null) {
    return function handleKeydown(e) {
        // Handle CTRL+/ for activation toggle
        if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing
            if (isTextEditingActive()) {
                return;
            }
            
            e.preventDefault();
            handleActivationToggle(dataStore);
            return;
        }
        
        // Handle CTRL+Y for reel-in/unreel
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing
            if (isTextEditingActive()) {
                return;
            }
            
            e.preventDefault();
            
            // Find and click the reel-in or unreel button
            const reelInButton = document.querySelector('.entity-reel-button');
            const unreelButton = document.querySelector('.entity-unreel-button');
            
            if (unreelButton && unreelButton.style.display !== 'none') {
                // Unreel button is visible, click it
                unreelButton.click();
            } else if (reelInButton && reelInButton.style.display !== 'none') {
                // Reel-in button is visible, click it
                reelInButton.click();
            }
            
            return;
        }
        
        // Handle CTRL+C for copy
        if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+C normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+C behavior work
            }
            
            e.preventDefault(); // Prevent browser's copy only when not editing text
            
            // Use async copy (fire and forget for UI responsiveness)
            handleCopyOperation(dataStore)
                .catch(error => console.error('Copy failed:', error));
            return;
        }
        
        // Handle CTRL+V for paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+V normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+V behavior work
            }
            
            e.preventDefault(); // Prevent browser's paste only when not editing text
            
            // Use async paste
            handleNormalPaste(dataStore)
                .catch(error => console.error('Paste failed:', error));
        }
        
        // Handle CTRL+SHIFT+Left/Right for viewer reordering
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            // Don't interfere with text editing
            if (isTextEditingActive()) {
                return;
            }
            
            e.preventDefault();
            
            // Get the currently selected viewer
            const selectedViewerId = dataStore.data.selectedViewerId;
            if (selectedViewerId) {
                handleKeyboardViewerReorder(dataStore, selectedViewerId, e.key === 'ArrowLeft' ? 'left' : 'right');
            }
            return;
        }
        
        // Handle CTRL+I for indicator emoji picker on squares
        if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+I normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+I behavior work
            }
            
            e.preventDefault(); // Prevent browser's italic only when not editing text
            
            handleIndicatorPicker(dataStore, onShowIndicatorPicker);
            return;
        }

        if (e.key == 'Tab') {
            const selectedCircles = dataStore.getSelectedCircles();
            if (selectedCircles.length != 1) { return; }
            const circleId = selectedCircles[0];
            const circle = dataStore.getCircle(circleId);
            const currentStateIDIndex = Object.keys(circle.states).indexOf("" + circle.currentStateID);
            let nextStateIDIndex = currentStateIDIndex + 1;
            if (nextStateIDIndex > Object.keys(circle.states).length - 1) {
                nextStateIDIndex = 0;
            }
            const nextStateID = Object.keys(circle.states)[nextStateIDIndex];
            const nextState = circle.states[nextStateID];

            // Update both currentStateID and name explicitly to ensure reactivity
            dataStore.updateCircle(circleId, {
                currentStateID: nextStateID,
                name: nextState.name  // Explicitly set the name from the new state
            });
        }

        if (e.key == ' ') {
            if (isTextEditingActive()) {
                return;
            }
            const selectedViewerId = dataStore.data.selectedViewerId;
            if (selectedViewerId) {
                const circles = dataStore.getCirclesForViewer(selectedViewerId);
                circles.forEach(circle => {
                    if (circle.roilMode == 'on') {
                        if (circle.roilAnimation == 'play') {
                            dataStore.updateCircle(circle.id, { roilAnimation: 'pause' });
                        } else {
                            dataStore.updateCircle(circle.id, { roilAnimation: 'play' });
                        }
                    }
                });
            }
        }
        
        // Handle CTRL+B for bold toggle on squares
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+B normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+B behavior work
            }
            
            e.preventDefault(); // Prevent browser's bold only when not editing text
            
            handleBoldToggle(dataStore);
            return;
        }
        
        // Handle CTRL+SHIFT+H for horizontal alignment
        if (e.key === 'H' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'horizontal');
            return;
        }

        // Handle CTRL+SHIFT+Z for zigzag alignment
        if (e.key === 'Z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'zigzag');
            return;
        }

        if (e.key === 'M' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'zigzag-horizontal');
            return;
        }

        // Handle CTRL+SHIFT+C for circular alignment
        if (e.key === 'C' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'circular');
            return;
        }

        // Handle CTRL+SHIFT+G for grid alignment
        if (e.key === 'G' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'grid');
            return;
        }

        // Handle CTRL+SHIFT+O for expanding group spacing
        if (e.key === 'O' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'expand');
            return;
        }

        // Handle CTRL+SHIFT+P for contracting group spacing
        if (e.key === 'P' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleAlignment(dataStore, 'contract');
            return;
        }

        // SHIFT+CTRL+V - Check what to do based on selection and clipboard
        if (e.key === 'V' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            
            const selectedSquares = dataStore.getSelectedSquares();
            const selectedCircles = dataStore.getSelectedCircles();
            
            // If multiple entities are selected, do vertical alignment
            if (selectedSquares.length > 1 || selectedCircles.length > 1) {
                handleAlignment(dataStore, 'vertical');
                return;
            }
            
            // Otherwise handle clipboard operations asynchronously
            handleShiftCtrlV(dataStore, selectedSquares, selectedCircles)
                .catch(error => console.error('Shift+Ctrl+V failed:', error));
            
            return;
        }
        
        // Handle CTRL+A for selecting all entities
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+A normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+A behavior work
            }
            
            e.preventDefault(); // Prevent browser's select all only when not editing text
            
            handleSelectAll(dataStore);
            return;
        }
        
        // Handle Delete key
        if (e.key === 'Delete') {
            // Don't delete entities while editing text
            if (isTextEditingActive()) {
                return; // Let the browser's default Delete behavior work
            }
            
            handleDeleteOperation(dataStore);
        }
    };
}

/**
 * Set up keyboard event listeners
 * @param {Function} handler - The keyboard event handler
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupKeyboardListeners(handler) {
    document.addEventListener('keydown', handler);
    
    // Return cleanup function
    return () => {
        document.removeEventListener('keydown', handler);
    };
}
