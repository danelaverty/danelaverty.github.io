// keyboardHandler.js - Centralized keyboard event handling with circle deletion confirmation
import { alignEntities } from './alignmentUtils.js';

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
 * Show confirmation dialog for circle deletion
 * @param {number} circleCount - Number of circles to be deleted
 * @returns {boolean} True if user confirms deletion
 */
function confirmCircleDeletion(circleCount) {
    const message = circleCount === 1 
        ? 'Are you sure you want to delete this circle?' 
        : `Are you sure you want to delete these ${circleCount} circles?`;
    
    return window.confirm(message);
}

/**
 * Create a keyboard handler with data store context
 * @param {Object} dataStore - The data store instance
 * @returns {Function} The keyboard event handler
 */
export function createKeyboardHandler(dataStore) {
    return function handleKeydown(e) {
        // Handle CTRL+SHIFT+V for vertical alignment
        if (e.key === 'V' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            
            // Priority: Squares first, then Circles
            if (dataStore.getSelectedSquares().length > 1) {
                alignEntities('square', 'vertical');
            } else if (dataStore.getSelectedCircles().length > 1) {
                alignEntities('circle', 'vertical');
            }
            return;
        }
        
        // Handle CTRL+SHIFT+H for horizontal alignment
        if (e.key === 'H' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            
            // Priority: Squares first, then Circles
            if (dataStore.getSelectedSquares().length > 1) {
                alignEntities('square', 'horizontal');
            } else if (dataStore.getSelectedCircles().length > 1) {
                alignEntities('circle', 'horizontal');
            }
            return;
        }
        
        // Handle CTRL+A for selecting all entities
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+A normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+A behavior work
            }
            
            e.preventDefault(); // Prevent browser's select all only when not editing text
            
            // Priority: if a square document is selected, select all squares in it
            if (dataStore.data.currentSquareDocumentId) {
                const selectedCount = dataStore.selectAllSquaresInDocument();
                console.log(`Selected all ${selectedCount} squares in current document`);
            } else {
                // Otherwise, select all circles in the currently selected viewer
                const selectedCount = dataStore.selectAllCirclesInViewer();
                console.log(`Selected all ${selectedCount} circles in selected viewer`);
            }
            return;
        }
        
        // Handle Delete key
        if (e.key === 'Delete') {
            // Don't delete entities while editing text
            if (isTextEditingActive()) {
                return; // Let the browser's default Delete behavior work
            }
            
            // Priority: Squares first, then Circles
            const selectedSquares = dataStore.getSelectedSquares();
            const selectedCircles = dataStore.getSelectedCircles();
            
            if (selectedSquares.length > 0) {
                // Squares: delete immediately without confirmation
                dataStore.deleteSelectedSquares();
                return;
            }
            
            if (selectedCircles.length > 0) {
                // Circles: show confirmation dialog first
                if (confirmCircleDeletion(selectedCircles.length)) {
                    dataStore.deleteSelectedCircles();
                }
                // If user cancels, do nothing
            }
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
