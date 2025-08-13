// entityHandlers.js - Fixed for separate entity type connection handling
import { useConnections } from './useConnections.js';

export function createEntityHandlers(dataStore) {
    const { connectionManager } = useConnections();

    // Helper to get current squares for connection updates
    const getCurrentSquares = () => {
        const currentDoc = dataStore.getCurrentSquareDocument();
        return currentDoc ? dataStore.getSquaresForDocument(currentDoc.id) : [];
    };

    // Helper to get current circles for a specific viewer
    const getCurrentCirclesForViewer = (viewerId) => {
        return dataStore.getCirclesForViewer ? dataStore.getCirclesForViewer(viewerId) : [];
    };

    // FIXED: Update connections for squares only
    const updateSquareConnections = () => {
        const squares = getCurrentSquares();
        connectionManager.updateConnections(squares, 'square');
    };

    // FIXED: Update connections for circles only (for a specific viewer)
    const updateCircleConnections = (viewerId) => {
        const circles = getCurrentCirclesForViewer(viewerId);
        connectionManager.updateConnections(circles, 'circle');
    };

    // Square event handlers
    const handleSquareSelect = (id, isCtrlClick = false) => {
        dataStore.selectSquare(id, isCtrlClick);
    };

    const handleSquarePositionUpdate = ({ id, x, y }) => {
        dataStore.updateSquare(id, { x, y });
        // FIXED: Update only square connections
        updateSquareConnections();
    };

    const handleSquareNameUpdate = ({ id, name }) => {
        dataStore.updateSquare(id, { name });
    };

    const handleSquareMoveMultiple = ({ entityType, deltaX, deltaY }) => {
        if (entityType === 'square') {
            dataStore.moveSelectedSquares(deltaX, deltaY);
            // FIXED: Update only square connections after move
            updateSquareConnections();
        }
    };

    const handleAddSquare = () => {
        const square = dataStore.createSquare();
        if (square) {
            dataStore.selectSquare(square.id);
            // FIXED: Update only square connections after add
            updateSquareConnections();
        }
    };

    const handleSquareDocumentChange = (documentId) => {
        dataStore.data.selectedSquareId = null;
        // FIXED: Update only square connections when document changes
        updateSquareConnections();
    };

    // Circle event handlers
    const handleCircleSelect = (id, viewerId, isCtrlClick = false) => {
        dataStore.selectCircle(id, viewerId, isCtrlClick);
    };

    const handleCirclePositionUpdate = ({ id, x, y }, viewerId = null) => {
        dataStore.updateCircle(id, { x, y });
        // FIXED: Update only circle connections for the specific viewer
        if (viewerId) {
            updateCircleConnections(viewerId);
        }
    };

    const handleCircleNameUpdate = ({ id, name }) => {
        dataStore.updateCircle(id, { name });
    };

    const handleCircleMoveMultiple = ({ entityType, deltaX, deltaY }, viewerId = null) => {
        if (entityType === 'circle') {
            dataStore.moveSelectedCircles(deltaX, deltaY);
            // FIXED: Update only circle connections for the specific viewer
            if (viewerId) {
                updateCircleConnections(viewerId);
            }
        }
    };

    const handleAddCircle = (viewerId) => {
        const circle = dataStore.createCircleInViewer(viewerId);
        if (circle) {
            dataStore.selectCircle(circle.id);
            // FIXED: Update only circle connections for the specific viewer
            updateCircleConnections(viewerId);
        }
    };

    const handleCircleDocumentChange = (viewerId, documentId) => {
        if (documentId) {
            dataStore.setCircleDocumentForViewer(viewerId, documentId);
        }
        dataStore.data.selectedCircleId = null;
        dataStore.data.selectedSquareId = null;
        dataStore.data.currentSquareDocumentId = null;
        // FIXED: Update only circle connections for the specific viewer
        updateCircleConnections(viewerId);
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
        handleCircleDocumentChange,

        // FIXED: Expose helper methods for manual connection updates if needed
        updateSquareConnections,
        updateCircleConnections
    };
}
