// ConnectionUtils.js - Utility functions for working with connections
import { useConnections } from './useConnections.js';

export class ConnectionUtils {
    /**
     * Find all squares recursively connected to a given square
     * @param {string} startSquareId - The ID of the starting square
     * @param {Array} allSquares - All squares in the current document
     * @returns {Set} Set of square IDs that are recursively connected
     */
    static findRecursivelyConnectedSquares(startSquareId, allSquares) {
        const { connectionManager } = useConnections();
        const connections = connectionManager.getConnections();
        
        // Build adjacency map for faster lookup
        const adjacencyMap = new Map();
        
        // Initialize adjacency map with all squares
        allSquares.forEach(square => {
            adjacencyMap.set(square.id, new Set());
        });
        
        // Populate adjacency map with connections
        connections.forEach(connection => {
            const { entity1Id, entity2Id } = connection;
            
            // Only include squares that exist in the current document
            if (adjacencyMap.has(entity1Id) && adjacencyMap.has(entity2Id)) {
                adjacencyMap.get(entity1Id).add(entity2Id);
                adjacencyMap.get(entity2Id).add(entity1Id);
            }
        });
        
        // Perform depth-first search to find all connected squares
        const visited = new Set();
        const connectedSquares = new Set();
        
        const dfs = (squareId) => {
            if (visited.has(squareId)) return;
            
            visited.add(squareId);
            connectedSquares.add(squareId);
            
            const neighbors = adjacencyMap.get(squareId) || new Set();
            neighbors.forEach(neighborId => {
                if (!visited.has(neighborId)) {
                    dfs(neighborId);
                }
            });
        };
        
        // Start DFS from the given square
        if (adjacencyMap.has(startSquareId)) {
            dfs(startSquareId);
        }
        
        return connectedSquares;
    }
    
    /**
     * Get all squares directly connected to a given square
     * @param {string} squareId - The ID of the square
     * @returns {Array} Array of connected square IDs
     */
    static getDirectlyConnectedSquares(squareId) {
        const { connectionManager } = useConnections();
        const connections = connectionManager.getConnectionsForSquare(squareId);
        
        const connectedIds = [];
        connections.forEach(connection => {
            if (connection.square1Id === squareId) {
                connectedIds.push(connection.square2Id);
            } else if (connection.square2Id === squareId) {
                connectedIds.push(connection.square1Id);
            }
        });
        
        return connectedIds;
    }
}
