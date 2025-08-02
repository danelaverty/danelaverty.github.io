// ConnectionManager.js - Efficient connection management for squares
import { reactive, computed } from './vue-composition-api.js';

export class ConnectionManager {
    constructor() {
        this.data = reactive({
            connections: new Map() // Map of connection IDs to connection objects
        });
        
        this.CONNECTION_DISTANCE = 120;
        this.lastSquarePositions = new Map(); // Cache for position change detection
    }

    /**
     * Calculate distance between two squares
     */
    calculateDistance(square1, square2) {
        const dx = square1.x - square2.x;
        const dy = square1.y - square2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Generate a consistent connection ID for two squares
     */
    getConnectionId(square1Id, square2Id) {
        // Always use the same order for consistent IDs
        return square1Id < square2Id ? `${square1Id}-${square2Id}` : `${square2Id}-${square1Id}`;
    }

    /**
     * Check if positions have changed since last update
     */
    hasPositionChanged(squares) {
        for (const square of squares) {
            const lastPos = this.lastSquarePositions.get(square.id);
            if (!lastPos || lastPos.x !== square.x || lastPos.y !== square.y) {
                return true;
            }
        }
        return false;
    }

    /**
     * Update cached positions
     */
    updatePositionCache(squares) {
        this.lastSquarePositions.clear();
        squares.forEach(square => {
            this.lastSquarePositions.set(square.id, { x: square.x, y: square.y });
        });
    }

    /**
     * Efficiently update connections based on current squares
     * @param {Array} squares - Current squares to check
     * @param {Set} draggedSquareIds - IDs of squares currently being dragged (optional optimization)
     */
    updateConnections(squares, draggedSquareIds = null) {
        // Early exit if no position changes (optimization for non-drag updates)
        if (!draggedSquareIds && !this.hasPositionChanged(squares)) {
            return;
        }

        const newConnections = new Map();
        
        // If we have dragged squares, we can optimize by only checking connections
        // involving at least one dragged square
        if (draggedSquareIds && draggedSquareIds.size > 0) {
            this.updateConnectionsOptimized(squares, draggedSquareIds, newConnections);
        } else {
            this.updateConnectionsFull(squares, newConnections);
        }

        // Replace connections map
        this.data.connections.clear();
        newConnections.forEach((connection, id) => {
            this.data.connections.set(id, connection);
        });

        // Update position cache
        this.updatePositionCache(squares);
    }

    /**
     * Full connection update (used when not dragging or when squares change)
     */
    updateConnectionsFull(squares, newConnections) {
        for (let i = 0; i < squares.length; i++) {
            for (let j = i + 1; j < squares.length; j++) {
                const square1 = squares[i];
                const square2 = squares[j];
                const distance = this.calculateDistance(square1, square2);
                
                if (distance <= this.CONNECTION_DISTANCE) {
                    const connectionId = this.getConnectionId(square1.id, square2.id);
                    newConnections.set(connectionId, {
                        id: connectionId,
                        square1Id: square1.id,
                        square2Id: square2.id,
                        square1: square1,
                        square2: square2,
                        distance: distance
                    });
                }
            }
        }
    }

    /**
     * Optimized connection update for drag operations
     * Only checks connections involving dragged squares
     */
    updateConnectionsOptimized(squares, draggedSquareIds, newConnections) {
        const draggedSquares = squares.filter(s => draggedSquareIds.has(s.id));
        const staticSquares = squares.filter(s => !draggedSquareIds.has(s.id));
        
        // First, preserve connections between static squares (they haven't moved)
        for (let i = 0; i < staticSquares.length; i++) {
            for (let j = i + 1; j < staticSquares.length; j++) {
                const square1 = staticSquares[i];
                const square2 = staticSquares[j];
                const connectionId = this.getConnectionId(square1.id, square2.id);
                
                // If this connection existed before, keep it
                if (this.data.connections.has(connectionId)) {
                    newConnections.set(connectionId, {
                        ...this.data.connections.get(connectionId),
                        square1: square1, // Update references
                        square2: square2
                    });
                }
            }
        }
        
        // Check connections between dragged squares and all other squares
        for (const draggedSquare of draggedSquares) {
            for (const otherSquare of squares) {
                if (draggedSquare.id === otherSquare.id) continue;
                
                const distance = this.calculateDistance(draggedSquare, otherSquare);
                const connectionId = this.getConnectionId(draggedSquare.id, otherSquare.id);
                
                if (distance <= this.CONNECTION_DISTANCE) {
                    newConnections.set(connectionId, {
                        id: connectionId,
                        square1Id: draggedSquare.id,
                        square2Id: otherSquare.id,
                        square1: draggedSquare,
                        square2: otherSquare,
                        distance: distance
                    });
                }
            }
        }
    }

    /**
     * Clear all connections
     */
    clearConnections() {
        this.data.connections.clear();
        this.lastSquarePositions.clear();
    }

    /**
     * Get all current connections as an array
     */
    getConnections() {
        return Array.from(this.data.connections.values());
    }

    /**
     * Get connections involving a specific square
     */
    getConnectionsForSquare(squareId) {
        return this.getConnections().filter(conn => 
            conn.square1Id === squareId || conn.square2Id === squareId
        );
    }
}
