// rectangleSelectionHandlers.js - Rectangle selection handling logic
/**
 * Create rectangle selection handlers for squares
 * @param {Object} dataStore - The data store instance
 * @param {Function} getCurrentSquares - Function to get current squares
 * @returns {Object} Selection handlers and state
 */
export function createSquareSelectionHandlers(dataStore, getCurrentSquares) {
    // Store initial selection state for Ctrl+drag operations
    let initialSelectedSquareIds = new Set();
    let isRectangleSelectingSquares = false;
    
    // Helper function to check if a square intersects with a rectangle
    const isSquareIntersecting = (square, rect) => {
        const squareSize = 60; // Standard square size
        const squareLeft = square.x;
        const squareTop = square.y;
        const squareRight = square.x + squareSize;
        const squareBottom = square.y + squareSize;
        
        // Check for intersection (not just containment)
        return !(squareRight < rect.left || 
                squareLeft > rect.right || 
                squareBottom < rect.top || 
                squareTop > rect.bottom);
    };

    // Real-time selection during drag for squares
    const handleSquareSelectionUpdate = (rect, isCtrlClick) => {
        if (!rect || rect.width < 5 || rect.height < 5) return; // Ignore very small selections
        
        // Find squares that intersect with the current selection rectangle
        const intersectingIds = [];
        getCurrentSquares().forEach(square => {
            if (isSquareIntersecting(square, rect)) {
                intersectingIds.push(square.id);
            }
        });

        // Determine final selection
        let finalSelection;
        if (isCtrlClick) {
            // For Ctrl+drag: combine initial selection with intersecting squares
            finalSelection = [...new Set([...initialSelectedSquareIds, ...intersectingIds])];
        } else {
            // For normal drag: only intersecting squares
            finalSelection = intersectingIds;
        }

        // Apply selection properly using the dataStore method
        if (finalSelection.length > 0) {
            // Clear current selection first
            dataStore.selectSquare(null, false);
            
            // Select each square in sequence
            finalSelection.forEach((id, index) => {
                dataStore.selectSquare(id, index > 0);
            });
        } else if (!isCtrlClick) {
            // Clear selection if nothing intersecting and not Ctrl+drag
            dataStore.selectSquare(null, false);
        }
    };

    // Initialize selection state when drag starts for squares
    const handleSquareSelectionStart = (isCtrlClick) => {
        // Store current selection for Ctrl+drag operations
        initialSelectedSquareIds = new Set(dataStore.getSelectedSquares());
        isRectangleSelectingSquares = true;
        
        if (!isCtrlClick) {
            // For normal selection, clear everything immediately
            dataStore.selectSquare(null, false);
        }
    };

    // Rectangle selection completion for squares
    const handleSquareSelectionComplete = (rect, isCtrlClick) => {
        // Only handle completion for meaningful selections
        if (rect.width < 5 || rect.height < 5) {
            // This was a click, not a drag - handle it as a click to clear
            if (!isCtrlClick) {
                dataStore.selectSquare(null, false);
            }
        }
        
        // The selection has already been updated in real-time, just save to storage
        dataStore.saveToStorage();
        
        // Clear the rectangle selection flag after a short delay
        setTimeout(() => {
            isRectangleSelectingSquares = false;
        }, 50);
    };

    const isCurrentlyRectangleSelecting = () => isRectangleSelectingSquares;

    return {
        handleSquareSelectionUpdate,
        handleSquareSelectionStart,
        handleSquareSelectionComplete,
        isCurrentlyRectangleSelecting
    };
}

/**
 * Create rectangle selection handlers for circles
 * @param {Object} dataStore - The data store instance
 * @param {Function} getCurrentCircles - Function to get current circles
 * @param {string} viewerId - The viewer ID
 * @returns {Object} Selection handlers and state
 */
export function createCircleSelectionHandlers(dataStore, getCurrentCircles, viewerId) {
    // Store initial selection state for Ctrl+drag operations
    let initialSelectedIds = new Set();
    let hasRectangleSelected = false;
    
    // Helper function to check if a circle intersects with a rectangle
    const isCircleIntersecting = (circle, rect) => {
        const circleSize = 60; // Standard circle size
        const circleLeft = circle.x;
        const circleTop = circle.y;
        const circleRight = circle.x + circleSize;
        const circleBottom = circle.y + circleSize;
        
        // Check for intersection (not just containment)
        return !(circleRight < rect.left || 
                circleLeft > rect.right || 
                circleBottom < rect.top || 
                circleTop > rect.bottom);
    };

    // Real-time selection during drag
    const handleSelectionUpdate = (rect, isCtrlClick) => {
        if (!rect || rect.width < 5 || rect.height < 5) return; // Ignore very small selections
        
        // Find circles that intersect with the current selection rectangle
        const intersectingIds = [];
        getCurrentCircles().forEach(circle => {
            if (isCircleIntersecting(circle, rect)) {
                intersectingIds.push(circle.id);
            }
        });

        // Determine final selection
        let finalSelection;
        if (isCtrlClick) {
            // For Ctrl+drag: combine initial selection with intersecting circles
            finalSelection = [...new Set([...initialSelectedIds, ...intersectingIds])];
        } else {
            // For normal drag: only intersecting circles
            finalSelection = intersectingIds;
        }

        // Apply selection properly using the dataStore method
        if (finalSelection.length > 0) {
            // Clear current selection first
            dataStore.selectCircle(null, viewerId, false);
            
            // Select each circle in sequence
            finalSelection.forEach((id, index) => {
                dataStore.selectCircle(id, viewerId, index > 0);
            });
        } else if (!isCtrlClick) {
            // Clear selection if nothing intersecting and not Ctrl+drag
            dataStore.selectCircle(null, viewerId, false);
        }
    };

    // Initialize selection state when drag starts
    const handleSelectionStart = (isCtrlClick) => {
        // Store current selection for Ctrl+drag operations
        initialSelectedIds = new Set(dataStore.getSelectedCircles());
        hasRectangleSelected = false; // Reset the flag
        
        if (!isCtrlClick) {
            // For normal selection, clear everything immediately
            dataStore.selectCircle(null, viewerId, false);
        }
    };

    // Finalize selection when drag ends
    const handleSelectionComplete = (rect, isCtrlClick) => {
        // Check if this was a meaningful rectangle selection
        const wasRectangleSelection = rect.width >= 5 && rect.height >= 5;
        
        if (!wasRectangleSelection) {
            // This was a click, not a drag - handle it as a click to clear
            if (!isCtrlClick) {
                dataStore.selectCircle(null, viewerId, false);
            }
        } else {
            // This was a real rectangle selection
            hasRectangleSelected = true;
            
            // Clear the flag after a short delay to prevent click interference
            setTimeout(() => {
                hasRectangleSelected = false;
            }, 100);
        }
        
        // Selection was already handled in real-time, just save to storage
        dataStore.saveToStorage();
    };

    const hasJustCompletedRectangleSelection = () => hasRectangleSelected;

    return {
        handleSelectionUpdate,
        handleSelectionStart,
        handleSelectionComplete,
        hasJustCompletedRectangleSelection
    };
}
