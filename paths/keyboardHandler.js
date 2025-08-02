// keyboardHandler.js - Centralized keyboard event handling
import { alignEntities } from './alignmentUtils.js';

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
            e.preventDefault(); // Prevent browser's select all
            
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
            // Priority: Squares first, then Circles
            if (dataStore.getSelectedSquares().length > 0) {
                dataStore.deleteSelectedSquares();
                return;
            }
            if (dataStore.getSelectedCircles().length > 0) {
                dataStore.deleteSelectedCircles();
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
