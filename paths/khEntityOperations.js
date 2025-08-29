// entityOperations.js - Entity manipulation operations for keyboard shortcuts
import { alignEntities } from './alignmentUtils.js';
import { useConnections } from './useConnections.js';

/**
 * Show confirmation dialog for circle deletion
 * @param {number} circleCount - Number of circles to be deleted
 * @returns {boolean} True if user confirms deletion
 */
export function confirmCircleDeletion(circleCount) {
    const message = circleCount === 1 
        ? 'Are you sure you want to delete this circle?' 
        : `Are you sure you want to delete these ${circleCount} circles?`;
    
    return window.confirm(message);
}

/**
 * Toggle activation state for selected circles based on the described logic
 * @param {Object} dataStore - The data store instance
 */
export function handleActivationToggle(dataStore) {
    const selectedCircles = dataStore.getSelectedCircles();
    if (selectedCircles.length === 0) {
        return; // No circles selected
    }
    
    // Get the activation states of all selected circles
    const circles = selectedCircles.map(id => dataStore.getCircle(id)).filter(Boolean);
    const activationStates = circles.map(circle => circle.activation || 'inactive');
    
    // Determine the new state based on the logic:
    // - If all are "inactive", set all to "activated"
    // - If all are "activated", set all to "inactive" 
    // - If mixed, set all to "inactive"
    const allInactive = activationStates.every(state => state === 'inactive');
    const allActivated = activationStates.every(state => state === 'activated');
    
    let newActivationState;
    if (allInactive) {
        newActivationState = 'activated';
    } else {
        // Either all activated or mixed - set to inactive
        newActivationState = 'inactive';
    }
    
    // Update all selected circles
    selectedCircles.forEach(circleId => {
        dataStore.updateCircle(circleId, {
            activation: newActivationState
        });
    });
}

/**
 * Handle keyboard viewer reordering
 * @param {Object} dataStore - The data store instance
 * @param {string} viewerId - ID of the viewer to reorder
 * @param {string} direction - 'left' or 'right'
 */
export function handleKeyboardViewerReorder(dataStore, viewerId, direction) {
    // Get all viewers in order
    const allViewers = dataStore.data.viewerOrder.map(id => ({
        id,
    }));
    
    // Find current viewer index
    const currentIndex = allViewers.findIndex(v => v.id === viewerId);
    if (currentIndex === -1) {
        return; // Viewer not found
    }
    
    let targetIndex = -1;
    
    // Calculate target index based on direction
    if (direction === 'left') {
        targetIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'right') {
        targetIndex = Math.min(allViewers.length - 1, currentIndex + 1);
    }
    
    // If we found a valid target and it's different from current, perform the reorder
    if (targetIndex !== -1 && targetIndex !== currentIndex) {
        // Use the existing reorderViewers method from dataStore
        dataStore.reorderViewers(currentIndex, targetIndex);
    }
}

/**
 * Handle delete operation for selected entities
 * @param {Object} dataStore - The data store instance
 * @returns {boolean} True if deletion was performed
 */
export function handleDeleteOperation(dataStore) {
    // Priority: Squares first, then Circles
    const selectedSquares = dataStore.getSelectedSquares();
    const selectedCircles = dataStore.getSelectedCircles();
    
    if (selectedSquares.length > 0) {
        // Squares: delete immediately without confirmation
        dataStore.deleteSelectedSquares();
        return true;
    }
    
    if (selectedCircles.length > 0) {
        // Circles: show confirmation dialog first
        if (confirmCircleDeletion(selectedCircles.length)) {
            dataStore.deleteSelectedCircles();
            return true;
        }
        // If user cancels, do nothing
        return false;
    }
    
    return false;
}

/**
 * Handle bold toggle for selected squares
 * @param {Object} dataStore - The data store instance
 * @returns {boolean} True if bold toggle was performed
 */
export function handleBoldToggle(dataStore) {
    const selectedSquares = dataStore.getSelectedSquares();
    if (selectedSquares.length === 0) {
        return false;
    }
    
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
    
    return true;
}

/**
 * Handle select all operation
 * @param {Object} dataStore - The data store instance
 * @returns {number} Number of entities selected
 */
export function handleSelectAll(dataStore) {
    // Priority: if a square document is selected, select all squares in it
    var selectedCount = dataStore.selectAllSquaresInDocument();
    if (selectedCount == 0) {
        // Otherwise, select all circles in the currently selected viewer
        selectedCount = dataStore.selectAllCirclesInViewer();
    }
    return selectedCount;
}

/**
 * Handle alignment operation
 * @param {Object} dataStore - The data store instance
 * @param {string} alignmentType - Type of alignment ('horizontal', 'vertical', 'zigzag', 'circular', 'expand', 'contract')
 * @returns {boolean} True if alignment was performed
 */
export function handleAlignment(dataStore, alignmentType) {
    const selectedSquares = dataStore.getSelectedSquares();
    const selectedCircles = dataStore.getSelectedCircles();
    
    // Priority: Squares first, then Circles
    if (selectedSquares.length > 1) {
        alignEntities('square', alignmentType);
        return true;
    } else if (selectedCircles.length > 1) {
        alignEntities('circle', alignmentType);
        return true;
    }
    
    return false;
}

/**
 * Handle indicator picker for selected squares
 * @param {Object} dataStore - The data store instance
 * @param {Function} onShowIndicatorPicker - Callback to show indicator picker
 * @returns {boolean} True if indicator picker was shown
 */
export function handleIndicatorPicker(dataStore, onShowIndicatorPicker) {
    if (!onShowIndicatorPicker) {
        return false;
    }
    
    const selectedSquares = dataStore.getSelectedSquares();
    if (selectedSquares.length === 0) {
        return false;
    }
    
    // Get the current indicator emoji from the first selected square (if any)
    const firstSquare = dataStore.getSquare(selectedSquares[0]);
    const currentIndicator = firstSquare?.indicatorEmoji || null;
    
    onShowIndicatorPicker(currentIndicator);
    return true;
}
