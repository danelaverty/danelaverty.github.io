// entityHandlers.js - Entity event handling logic (Updated to remove redundant connection updates)
/**
 * Create entity event handlers
 * @param {Object} dataStore - The data store instance
 * @returns {Object} Entity event handlers
 */
import { useConnections } from './useConnections.js';

export function createEntityHandlers(dataStore) {
    const { connectionManager } = useConnections();

    // Helper to get current squares for connection updates
    const getCurrentSquares = () => {
        const currentDoc = dataStore.getCurrentSquareDocument();
        return currentDoc ? dataStore.getSquaresForDocument(currentDoc.id) : [];
    };

    // Helper to update connections after square changes
    const updateConnectionsAfterChange = () => {
        const squares = getCurrentSquares();
        connectionManager.updateConnections(squares);
    };

    // Square event handlers
    const handleSquareSelect = (id, isCtrlClick = false) => {
        dataStore.selectSquare(id, isCtrlClick);
    };

    const handleSquarePositionUpdate = ({ id, x, y }) => {
        dataStore.updateSquare(id, { x, y });
        // Update connections after position change
        updateConnectionsAfterChange();
    };

    const handleSquareNameUpdate = ({ id, name }) => {
        dataStore.updateSquare(id, { name });
    };

    const handleSquareMoveMultiple = ({ entityType, deltaX, deltaY }) => {
        if (entityType === 'square') {
            dataStore.moveSelectedSquares(deltaX, deltaY);
            // Note: moveSelectedSquares now handles connection updates internally
        }
    };

    const handleAddSquare = () => {
        const square = dataStore.createSquare();
        if (square) {
            dataStore.selectSquare(square.id);
            // Note: createSquare now handles connection updates internally
        }
    };

    const handleSquareDocumentChange = (documentId) => {
        dataStore.data.selectedSquareId = null;
        // Update connections when document changes
        updateConnectionsAfterChange();
    };

    // Circle event handlers (for use in CircleViewer)
    const handleCircleSelect = (id, viewerId, isCtrlClick = false) => {
        dataStore.selectCircle(id, viewerId, isCtrlClick);
    };

    const handleCirclePositionUpdate = ({ id, x, y }) => {
        dataStore.updateCircle(id, { x, y });
    };

    const handleCircleNameUpdate = ({ id, name }) => {
        dataStore.updateCircle(id, { name });
    };

    const handleCircleMoveMultiple = ({ entityType, deltaX, deltaY }) => {
        if (entityType === 'circle') {
            dataStore.moveSelectedCircles(deltaX, deltaY);
        }
    };

    const handleAddCircle = (viewerId) => {
        const circle = dataStore.createCircleInViewer(viewerId);
        if (circle) {
            dataStore.selectCircle(circle.id);
        }
    };

    const handleCircleDocumentChange = (viewerId, documentId) => {
        if (documentId) {
            dataStore.setCircleDocumentForViewer(viewerId, documentId);
        }
        dataStore.data.selectedCircleId = null;
        dataStore.data.selectedSquareId = null;
        dataStore.data.currentSquareDocumentId = null;
        // Clear connections when document changes
        connectionManager.clearConnections();
    };

    return {
        // Square handlers
        handleSquareSelect,
        handleSquarePositionUpdate,
        handleSquareNameUpdate,
        handleSquareMoveMultiple,
        handleAddSquare,
        handleSquareDocumentChange,
        
        // Circle handlers
        handleCircleSelect,
        handleCirclePositionUpdate,
        handleCircleNameUpdate,
        handleCircleMoveMultiple,
        handleAddCircle,
        handleCircleDocumentChange
    };
}
