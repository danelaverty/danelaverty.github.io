// ConnectionManager.js - FIXED: Separate storage for each entity type including viewer-specific types
import { reactive, computed } from './vue-composition-api.js';

export class ConnectionManager {
    constructor() {
        this.data = reactive({
            // FIXED: Use a single Map to store connections for ALL entity types
            // Key: entityType, Value: Map of connections for that type
            connectionsByType: new Map()
        });
        
        // Connection distances for different entity types
        this.SQUARE_CONNECTION_DISTANCE = 130;
        this.SQUARE_BOLD_CONNECTION_DISTANCE = 165;
        this.CIRCLE_CONNECTION_DISTANCE = 100;
        this.CIRCLE_BOLD_CONNECTION_DISTANCE = 130;
        
        // FIXED: Use a single cache structure for all entity types
        this.caches = new Map(); // Key: entityType, Value: cache object
    }

    /**
     * Calculate distance between two entities
     */
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get connection distance based on entity type and whether either entity is bold
     */
    getConnectionDistance(entity1, entity2, entityType) {
        if (entityType === 'square' || entityType.startsWith('square-')) {
            if (entity1.bold === true || entity2.bold === true) {
                return this.SQUARE_BOLD_CONNECTION_DISTANCE;
            }
            return this.SQUARE_CONNECTION_DISTANCE;
        } else if (entityType === 'circle' || entityType.startsWith('circle-')) {
            return this.CIRCLE_CONNECTION_DISTANCE;
        }
        
        return this.SQUARE_CONNECTION_DISTANCE;
    }

    /**
     * Generate a consistent connection ID for two entities with proper type safety
     */
    getConnectionId(entity1Id, entity2Id, entityType) {
        // Ensure we're working with strings, not objects
        const id1 = String(entity1Id);
        const id2 = String(entity2Id);
        
        // Create a consistent ordering
        const baseId = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
        return `${entityType}-${baseId}`;
    }

    /**
     * FIXED: Get or create cache for specific entity type
     */
    getCache(entityType) {
        if (!this.caches.has(entityType)) {
            this.caches.set(entityType, {
                lastEntityPositions: new Map(),
                lastEntityIds: new Set(),
                lastEntityBoldStates: new Map()
            });
        }
        return this.caches.get(entityType);
    }

    /**
     * FIXED: Get or create connections map for specific entity type
     */
    getConnectionsMap(entityType) {
        if (!this.data.connectionsByType.has(entityType)) {
            this.data.connectionsByType.set(entityType, new Map());
        }
        return this.data.connectionsByType.get(entityType);
    }

    /**
     * Check if the set of entities has changed (added/removed) or positions/bold states changed
     */
    hasEntitiesChanged(entities, entityType) {
        const cache = this.getCache(entityType);
        const currentEntityIds = new Set(entities.map(e => e.id));
        
        // Check if entities were added or removed
        if (currentEntityIds.size !== cache.lastEntityIds.size) {
            return true;
        }
        
        // Check if different entities exist
        for (const id of currentEntityIds) {
            if (!cache.lastEntityIds.has(id)) {
                return true;
            }
        }
        
        for (const id of cache.lastEntityIds) {
            if (!currentEntityIds.has(id)) {
                return true;
            }
        }
        
        // Check if positions or bold states changed
        for (const entity of entities) {
            const lastPos = cache.lastEntityPositions.get(entity.id);
            const lastBold = cache.lastEntityBoldStates.get(entity.id);
            
            if (!lastPos || lastPos.x !== entity.x || lastPos.y !== entity.y) {
                return true;
            }
            
            if (lastBold !== (entity.bold === true)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Update cached positions, entity IDs, and bold states for specific entity type
     */
    updateCaches(entities, entityType) {
        const cache = this.getCache(entityType);
        
        // Update position cache
        cache.lastEntityPositions.clear();
        entities.forEach(entity => {
            cache.lastEntityPositions.set(entity.id, { x: entity.x, y: entity.y });
        });
        
        // Update entity ID cache
        cache.lastEntityIds.clear();
        entities.forEach(entity => {
            cache.lastEntityIds.add(entity.id);
        });
        
        // Update bold state cache
        cache.lastEntityBoldStates.clear();
        entities.forEach(entity => {
            cache.lastEntityBoldStates.set(entity.id, entity.bold === true);
        });
    }

    /**
     * FIXED: Update connections for specific entity type without affecting other types
     * @param {Array} entities - Current entities to check (squares or circles)
     * @param {string} entityType - Type of entities ('square', 'circle', 'circle-viewer_1', etc.)
     * @param {Set} draggedEntityIds - IDs of entities currently being dragged (optional optimization)
     */
    updateConnections(entities, entityType = 'square', draggedEntityIds = null) {
    
    // FIXED: Show counts for all entity types, not just square/circle
    const totalConnections = Array.from(this.data.connectionsByType.values())
        .reduce((sum, map) => sum + map.size, 0);
    
    const connectionsMap = this.getConnectionsMap(entityType);
    
    const entitiesChanged = this.hasEntitiesChanged(entities, entityType);
    
    if (!draggedEntityIds && !entitiesChanged) {
        return;
    }

        const newConnections = new Map();
        
        // Use optimized update if dragging specific entities and set hasn't changed
        if (draggedEntityIds && draggedEntityIds.size > 0 && !entitiesChanged) {
            this.updateConnectionsOptimized(entities, entityType, draggedEntityIds, newConnections, connectionsMap);
        } else {
            // Full update when entities are added/removed or no drag optimization
            this.updateConnectionsFull(entities, entityType, newConnections);
        }

        // FIXED: Only update connections for this specific entity type
        connectionsMap.clear();
        newConnections.forEach((connection, id) => {
            connectionsMap.set(id, connection);
        });

        // Update caches for this entity type
        this.updateCaches(entities, entityType);
    }

    /**
     * Full connection update with proper ID generation
     */
    updateConnectionsFull(entities, entityType, newConnections) {
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];
                
                // Ensure entities have valid IDs
                if (!entity1.id || !entity2.id) {
                    continue;
                }
                
                const distance = this.calculateDistance(entity1, entity2);
                const connectionDistance = this.getConnectionDistance(entity1, entity2, entityType);
                
                if (distance <= connectionDistance) {
                    const connectionId = this.getConnectionId(entity1.id, entity2.id, entityType);
                    
                    newConnections.set(connectionId, {
                        id: connectionId,
                        entity1Id: entity1.id,
                        entity2Id: entity2.id,
                        entity1: entity1,
                        entity2: entity2,
                        distance: distance,
                        connectionDistance: connectionDistance,
                        entityType: entityType
                    });
                }
            }
        }
        
    }

    /**
     * Optimized connection update for drag operations
     */
    updateConnectionsOptimized(entities, entityType, draggedEntityIds, newConnections, existingConnections) {
        const draggedEntities = entities.filter(e => draggedEntityIds.has(e.id));
        const staticEntities = entities.filter(e => !draggedEntityIds.has(e.id));
        
        // Preserve connections between static entities
        for (let i = 0; i < staticEntities.length; i++) {
            for (let j = i + 1; j < staticEntities.length; j++) {
                const entity1 = staticEntities[i];
                const entity2 = staticEntities[j];
                const connectionId = this.getConnectionId(entity1.id, entity2.id, entityType);
                
                if (existingConnections.has(connectionId)) {
                    const distance = this.calculateDistance(entity1, entity2);
                    const connectionDistance = this.getConnectionDistance(entity1, entity2, entityType);
                    
                    if (distance <= connectionDistance) {
                        newConnections.set(connectionId, {
                            id: connectionId,
                            entity1Id: entity1.id,
                            entity2Id: entity2.id,
                            entity1: entity1,
                            entity2: entity2,
                            distance: distance,
                            connectionDistance: connectionDistance,
                            entityType: entityType
                        });
                    }
                }
            }
        }
        
        // Check connections involving dragged entities
        for (const draggedEntity of draggedEntities) {
            for (const otherEntity of entities) {
                if (draggedEntity.id === otherEntity.id) continue;
                
                const distance = this.calculateDistance(draggedEntity, otherEntity);
                const connectionDistance = this.getConnectionDistance(draggedEntity, otherEntity, entityType);
                const connectionId = this.getConnectionId(draggedEntity.id, otherEntity.id, entityType);
                
                if (distance <= connectionDistance) {
                    newConnections.set(connectionId, {
                        id: connectionId,
                        entity1Id: draggedEntity.id,
                        entity2Id: otherEntity.id,
                        entity1: draggedEntity,
                        entity2: otherEntity,
                        distance: distance,
                        connectionDistance: connectionDistance,
                        entityType: entityType
                    });
                }
            }
        }
    }

    /**
     * FIXED: Clear connections for specific entity type or all if no type specified
     */
    clearConnections(entityType = null) {
        if (entityType) {
            // Clear only connections for specific entity type
            const connectionsMap = this.getConnectionsMap(entityType);
            const cache = this.getCache(entityType);
            connectionsMap.clear();
            cache.lastEntityPositions.clear();
            cache.lastEntityIds.clear();
            cache.lastEntityBoldStates.clear();
        } else {
            // Clear all connections and caches
            this.data.connectionsByType.clear();
            this.caches.clear();
        }
    }

    /**
     * FIXED: Get all current connections from all entity types as an array
     */
    getConnections() {
        const allConnections = [];
        
        // Add connections from all entity types
        this.data.connectionsByType.forEach((connectionsMap, entityType) => {
            connectionsMap.forEach(connection => {
                allConnections.push(connection);
            });
        });
        
        return allConnections;
    }

    /**
     * Get connections for specific entity type
     */
    getConnectionsForEntityType(entityType) {
        const connectionsMap = this.getConnectionsMap(entityType);
        return Array.from(connectionsMap.values());
    }

    /**
     * Get connections involving a specific entity
     */
    getConnectionsForEntity(entityId, entityType = null) {
        if (entityType) {
            // Search only in specific entity type connections
            const connectionsMap = this.getConnectionsMap(entityType);
            return Array.from(connectionsMap.values()).filter(conn => 
                conn.entity1Id === entityId || conn.entity2Id === entityId
            );
        } else {
            // Search in all connections
            return this.getConnections().filter(conn => 
                conn.entity1Id === entityId || conn.entity2Id === entityId
            );
        }
    }

    /**
     * Force a full recalculation of connections for specific entity type
     */
    forceUpdate(entities, entityType = 'square') {
        this.clearConnections(entityType);
        this.updateConnections(entities, entityType);
    }
}
