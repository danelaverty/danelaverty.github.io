// keyboardHandler.js - Centralized keyboard event handling with bold square support, indicator emoji picker, viewer reordering, and copy/paste
import { alignEntities } from './alignmentUtils.js';
import { useConnections } from './useConnections.js';
import { useClipboardStore } from './clipboardStore.js';

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
 * @param {Function} onShowIndicatorPicker - Callback to show indicator picker
 * @param {Function} onReorderViewer - Callback to reorder viewers (direction: 'left' or 'right')
 * @returns {Function} The keyboard event handler
 */
export function createKeyboardHandler(dataStore, onShowIndicatorPicker = null, onReorderViewer = null) {
    const clipboardStore = useClipboardStore();
    
    return function handleKeydown(e) {
        // Handle CTRL+C for copy
        if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+C normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+C behavior work
            }
            
            e.preventDefault(); // Prevent browser's copy only when not editing text
            
            // Priority: Squares first, then Circles
            const selectedSquares = dataStore.getSelectedSquares();
            const selectedCircles = dataStore.getSelectedCircles();
            
            if (selectedSquares.length > 0) {
                // Copy selected squares
                const squareEntities = selectedSquares.map(id => dataStore.getSquare(id)).filter(Boolean);
                const currentDoc = dataStore.getCurrentSquareDocument();
                const sourceDocumentId = currentDoc ? currentDoc.id : null;
                
                clipboardStore.copyEntities('square', squareEntities, sourceDocumentId);
                
            } else if (selectedCircles.length > 0) {
                // Copy selected circles
                const circleEntities = selectedCircles.map(id => dataStore.getCircle(id)).filter(Boolean);
                const selectedViewerId = dataStore.data.selectedViewerId;
                const currentCircleDoc = selectedViewerId ? dataStore.getCircleDocumentForViewer(selectedViewerId) : null;
                const sourceDocumentId = currentCircleDoc ? currentCircleDoc.id : null;
                
                clipboardStore.copyEntities('circle', circleEntities, sourceDocumentId);
            }
            return;
        }
        
        // Handle CTRL+V for paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+V normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+V behavior work
            }
            
            e.preventDefault(); // Prevent browser's paste only when not editing text
            
            const clipboardInfo = clipboardStore.getClipboardInfo();
            if (clipboardInfo.isEmpty) {
                return;
            }
            
            if (clipboardInfo.entityType === 'square') {
                // Paste squares to current square document
                const currentDoc = dataStore.getCurrentSquareDocument();
                if (!currentDoc) {
                    return;
                }

                const pastedEntityData = clipboardStore.pasteEntities(currentDoc.id);
                
                const createdSquares = [];
                
                pastedEntityData.forEach((squareData, index) => {
                    const square = dataStore.createSquare();
                    
                    if (square) {
                        
                        // Update the created square with pasted data (except ID and documentId which are already set)
                        const updateResult = dataStore.updateSquare(square.id, {
                            x: squareData.x,
                            y: squareData.y,
                            name: squareData.name,
                            emoji: squareData.emoji,
                            bold: squareData.bold,
                            indicatorEmoji: squareData.indicatorEmoji,
                            color: squareData.color,
                            emojiKey: squareData.emojiKey,
                            emojiCss: squareData.emojiCss
                        });
                        
                        createdSquares.push(square);
                    }
                });
                
                // Select the newly pasted squares
                if (createdSquares.length > 0) {
                    dataStore.selectSquare(null, false); // Clear current selection
                    dataStore.selectSquare(createdSquares[0].id, false); // Select first
                    for (let i = 1; i < createdSquares.length; i++) {
                        dataStore.selectSquare(createdSquares[i].id, true); // Add others to selection
                    }
                }
            } else if (clipboardInfo.entityType === 'circle') {
                // Paste circles to current circle document of selected viewer
                const selectedViewerId = dataStore.data.selectedViewerId;
                if (!selectedViewerId) {
                    return;
                }
                
                const currentCircleDoc = dataStore.getCircleDocumentForViewer(selectedViewerId);
                if (!currentCircleDoc) {
                    return;
                }
                
                const pastedEntityData = clipboardStore.pasteEntities(currentCircleDoc.id);
                const createdCircles = [];
                
                pastedEntityData.forEach(circleData => {
                    const circle = dataStore.createCircleInViewer(selectedViewerId);
                    if (circle) {
                        // Update the created circle with pasted data (except ID and documentId which are already set)
                        dataStore.updateCircle(circle.id, {
                            x: circleData.x,
                            y: circleData.y,
                            name: circleData.name,
                            type: circleData.type,
                            color: circleData.color,
                            colors: circleData.colors,
                            emoji: circleData.emoji,
                            energyTypes: circleData.energyTypes,
                            activation: circleData.activation
                        });
                        createdCircles.push(circle);
                    }
                });
                
                // Select the newly pasted circles
                if (createdCircles.length > 0) {
                    dataStore.selectCircle(null, selectedViewerId, false); // Clear current selection
                    dataStore.selectCircle(createdCircles[0].id, selectedViewerId, false); // Select first
                    for (let i = 1; i < createdCircles.length; i++) {
                        dataStore.selectCircle(createdCircles[i].id, selectedViewerId, true); // Add others to selection
                    }
                }
            }
            return;
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
            if (selectedViewerId && onReorderViewer) {
                const direction = e.key === 'ArrowLeft' ? 'left' : 'right';
                onReorderViewer(selectedViewerId, direction);
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
            
            const selectedSquares = dataStore.getSelectedSquares();
            if (selectedSquares.length > 0 && onShowIndicatorPicker) {
                // Get the current indicator emoji from the first selected square (if any)
                const firstSquare = dataStore.getSquare(selectedSquares[0]);
                const currentIndicator = firstSquare?.indicatorEmoji || null;
                
                onShowIndicatorPicker(currentIndicator);
            }
            return;
        }
        
        // Handle CTRL+B for bold toggle on squares
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
            // Don't interfere with text editing - let browser handle CTRL+B normally
            if (isTextEditingActive()) {
                return; // Let the browser's default CTRL+B behavior work
            }
            
            e.preventDefault(); // Prevent browser's bold only when not editing text
            
            const selectedSquares = dataStore.getSelectedSquares();
            if (selectedSquares.length > 0) {
                // Toggle bold state for all selected squares
                selectedSquares.forEach(squareId => {
                    const square = dataStore.getSquare(squareId);
                    if (square) {
                        // Toggle the bold property
                        const newBoldState = !square.bold;
                        dataStore.updateSquare(squareId, { bold: newBoldState });
                    }
                });
                
                // Force update connections since bold state affects connection radius
                const { connectionManager } = useConnections();
                const currentDoc = dataStore.getCurrentSquareDocument();
                if (currentDoc) {
                    const squares = dataStore.getSquaresForDocument(currentDoc.id);
                    connectionManager.forceUpdate(squares);
                }
            }
            return;
        }
        
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
            } else {
                // Otherwise, select all circles in the currently selected viewer
                const selectedCount = dataStore.selectAllCirclesInViewer();
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
