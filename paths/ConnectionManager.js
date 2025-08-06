// ConnectionManager.js - Efficient connection management for squares (Fixed deletion handling)
import { reactive, computed } from './vue-composition-api.js';

export class ConnectionManager {
    constructor() {
        this.data = reactive({
            connections: new Map() // Map of connection IDs to connection objects
        });
        
        this.CONNECTION_DISTANCE = 120;
        this.lastSquarePositions = new Map(); // Cache for position change detection
        this.lastSquareIds = new Set(); // Cache for tracking which squares existed
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
     * Check if the set of squares has changed (added/removed) or positions changed
     */
    hasSquaresChanged(squares) {
        const currentSquareIds = new Set(squares.map(s => s.id));
        
        // Check if squares were added or removed
        if (currentSquareIds.size !== this.lastSquareIds.size) {
            return true;
        }
        
        // Check if different squares exist
        for (const id of currentSquareIds) {
            if (!this.lastSquareIds.has(id)) {
                return true;
            }
        }
        
        for (const id of this.lastSquareIds) {
            if (!currentSquareIds.has(id)) {
                return true;
            }
        }
        
        // Check if positions changed
        for (const square of squares) {
            const lastPos = this.lastSquarePositions.get(square.id);
            if (!lastPos || lastPos.x !== square.x || lastPos.y !== square.y) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Update cached positions and square IDs
     */
    updateCaches(squares) {
        // Update position cache
        this.lastSquarePositions.clear();
        squares.forEach(square => {
            this.lastSquarePositions.set(square.id, { x: square.x, y: square.y });
        });
        
        // Update square ID cache
        this.lastSquareIds.clear();
        squares.forEach(square => {
            this.lastSquareIds.add(square.id);
        });
    }

    /**
     * Efficiently update connections based on current squares
     * @param {Array} squares - Current squares to check
     * @param {Set} draggedSquareIds - IDs of squares currently being dragged (optional optimization)
     */
    updateConnections(squares, draggedSquareIds = null) {
        
        // Always update if squares were added/removed, or if no drag optimization is requested
        const squaresChanged = this.hasSquaresChanged(squares);
        
        if (!draggedSquareIds && !squaresChanged) {
            return;
        }

        const newConnections = new Map();
        
        // If we have dragged squares and the set of squares hasn't changed, we can optimize
        if (draggedSquareIds && draggedSquareIds.size > 0 && !squaresChanged) {
            this.updateConnectionsOptimized(squares, draggedSquareIds, newConnections);
        } else {
            // Full update when squares are added/removed or no drag optimization
            this.updateConnectionsFull(squares, newConnections);
        }

        // Replace connections map
        this.data.connections.clear();
        newConnections.forEach((connection, id) => {
            this.data.connections.set(id, connection);
        });

        // Update caches
        this.updateCaches(squares);
    }

    /**
     * Full connection update (used when squares are added/removed or when not dragging)
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
     * Clear all connections and caches
     */
    clearConnections() {
        this.data.connections.clear();
        this.lastSquarePositions.clear();
        this.lastSquareIds.clear();
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

    /**
     * Force a full recalculation of connections (useful for debugging)
     */
    forceUpdate(squares) {
        this.clearConnections();
        this.updateConnections(squares);
    }
}
