export class EEDConnectionIndexManager {
    constructor(dataStore) {
        this.dataStore = dataStore;
        
        // Connection indexing and caching
        this.connectionsByCircle = new Map(); // circleId -> Connection[]
        
        // Track which viewers have been indexed
        this.indexedViewers = new Set();
        this.viewerConnectionCounts = new Map(); // viewerId -> connection count for change detection
    }

    /**
     * Build connection index for a viewer (called only when connections change)
     * @param {string} viewerId - The viewer ID to index
     */
    buildConnectionIndex(viewerId) {
        const entityType = `circle-${viewerId}`;
        const allConnections = this.dataStore.getExplicitConnectionsForEntityType(entityType);
        
        // Clear existing indexes for this viewer
        this.clearViewerIndex(viewerId);
        
        // Build new indexes
        allConnections.forEach(connection => {
            // Index by entity1
            if (!this.connectionsByCircle.has(connection.entity1Id)) {
                this.connectionsByCircle.set(connection.entity1Id, []);
            }
            this.connectionsByCircle.get(connection.entity1Id).push(connection);
            
            // Index by entity2
            if (!this.connectionsByCircle.has(connection.entity2Id)) {
                this.connectionsByCircle.set(connection.entity2Id, []);
            }
            this.connectionsByCircle.get(connection.entity2Id).push(connection);
        });
        
        this.indexedViewers.add(viewerId);
        this.viewerConnectionCounts.set(viewerId, allConnections.length);
    }

    /**
     * Clear connection index for a specific viewer
     */
    clearViewerIndex(viewerId) {
        // Get all circles for this viewer to clear their connections
        const circles = this.dataStore.getCirclesForViewer ? this.dataStore.getCirclesForViewer(viewerId) : [];
        
        circles.forEach(circle => {
            this.connectionsByCircle.delete(circle.id);
        });
        
        this.indexedViewers.delete(viewerId);
        this.viewerConnectionCounts.delete(viewerId);
    }

    /**
     * Check if viewer index needs updating
     */
    shouldUpdateViewerIndex(viewerId) {
        if (!this.indexedViewers.has(viewerId)) {
            return true;
        }
        
        // Quick change detection: compare connection count
        const entityType = `circle-${viewerId}`;
        const currentConnections = this.dataStore.getExplicitConnectionsForEntityType(entityType);
        const currentCount = currentConnections.length;
        const cachedCount = this.viewerConnectionCounts.get(viewerId) || 0;
        
        return currentCount !== cachedCount;
    }

    /**
     * Get connections for a circle using index
     */
    getConnectionsForCircle(circleId) {
        return this.connectionsByCircle.get(circleId) || [];
    }

    /**
     * Ensure index is up to date for a viewer
     */
    ensureIndexCurrent(viewerId) {
        if (this.shouldUpdateViewerIndex(viewerId)) {
            this.buildConnectionIndex(viewerId);
        }
    }

    /**
     * Get connection count for a viewer
     */
    getViewerConnectionCount(viewerId) {
        return this.viewerConnectionCounts.get(viewerId) || 0;
    }

    /**
     * Check if a viewer has any connections
     */
    hasConnections(viewerId) {
        this.ensureIndexCurrent(viewerId);
        return this.getViewerConnectionCount(viewerId) > 0;
    }

    /**
     * Check if a specific circle has any connections
     */
    hasConnectionsForCircle(circleId) {
        const connections = this.getConnectionsForCircle(circleId);
        return connections.length > 0;
    }

    /**
     * Get all connections for a viewer
     */
    getAllConnectionsForViewer(viewerId) {
        const entityType = `circle-${viewerId}`;
        return this.dataStore.getExplicitConnectionsForEntityType(entityType);
    }

    /**
     * Clear all connection indexes
     */
    clearAllIndexes() {
        this.connectionsByCircle.clear();
        this.indexedViewers.clear();
        this.viewerConnectionCounts.clear();
    }

    /**
     * Get connection index statistics
     */
    getIndexStats() {
        return {
            indexedViewers: Array.from(this.indexedViewers),
            totalConnectionMappings: this.connectionsByCircle.size,
            viewerCounts: Object.fromEntries(this.viewerConnectionCounts)
        };
    }

    /**
     * Get debug information about connections for a circle
     */
    getConnectionDebugInfo(circleId, viewerId) {
        const connections = this.getConnectionsForCircle(circleId);
        
        return {
            circleId,
            viewerId,
            totalConnections: connections.length,
            isViewerIndexed: this.indexedViewers.has(viewerId),
            viewerConnectionCount: this.getViewerConnectionCount(viewerId),
            connections: connections.map(conn => ({
                id: conn.id,
                otherCircleId: conn.entity1Id === circleId ? conn.entity2Id : conn.entity1Id,
                directionality: conn.directionality || 'none'
            }))
        };
    }
}
