// explicitConnectionStore.js - Store for managing user-created explicit connections
import { reactive } from './vue-composition-api.js';

let explicitConnectionStoreInstance = null;

function createExplicitConnectionStore() {
    const data = reactive({
        connections: new Map(), // Map of connection ID -> connection object
        nextConnectionId: 1
    });

    /**
     * Generate a unique connection ID for two entities
     */
    const generateConnectionId = (entity1Id, entity2Id, entityType1, entityType2) => {
        // Create consistent ordering regardless of which entity was clicked first
        const [firstId, firstType, secondId, secondType] = 
            entity1Id < entity2Id 
                ? [entity1Id, entityType1, entity2Id, entityType2]
                : [entity2Id, entityType2, entity1Id, entityType1];
        
        return `explicit_${firstType}_${firstId}_${secondType}_${secondId}`;
    };

    /**
     * Create an explicit connection between two entities
     */
const createConnection = (entity1Id, entity1Type, entity2Id, entity2Type, entity1Ref, entity2Ref) => {
    // Prevent connecting entity to itself
    if (entity1Id === entity2Id) {
        return null;
    }

    const connectionId = generateConnectionId(entity1Id, entity2Id, entity1Type, entity2Type);
    
    // Check if connection already exists
    if (data.connections.has(connectionId)) {
        return data.connections.get(connectionId);
    }

    const connection = {
        id: connectionId,
        entity1Id,
        entity1Type,
        entity2Id, 
        entity2Type,
        entity1: entity1Ref, // Store reactive reference to entity
        entity2: entity2Ref, // Store reactive reference to entity
        directionality: 'none', // Default directionality property
        energyTypes: [], // NEW: Default energy types array
        createdAt: Date.now()
    };

    data.connections.set(connectionId, connection);
    return connection;
};

const updateConnection = (connectionId, updates) => {
    const connection = data.connections.get(connectionId);
    if (connection) {
        Object.assign(connection, updates);
        return connection;
    }
    return null;
};

    /**
     * Delete an explicit connection by ID
     */
    const deleteConnection = (connectionId) => {
        return data.connections.delete(connectionId);
    };

    /**
     * Delete connections involving a specific entity
     */
    const deleteConnectionsForEntity = (entityId) => {
        const toDelete = [];
        
        data.connections.forEach((connection, id) => {
            if (connection.entity1Id === entityId || connection.entity2Id === entityId) {
                toDelete.push(id);
            }
        });

        let deletedCount = 0;
        toDelete.forEach(id => {
            if (data.connections.delete(id)) {
                deletedCount++;
            }
        });

        return deletedCount;
    };

    /**
     * Find explicit connection between two entities
     */
    const findConnection = (entity1Id, entity2Id, entityType1, entityType2) => {
        const connectionId = generateConnectionId(entity1Id, entity2Id, entityType1, entityType2);
        return data.connections.get(connectionId);
    };

    /**
     * Check if two entities have an explicit connection
     */
    const hasConnection = (entity1Id, entity2Id, entityType1, entityType2) => {
        return findConnection(entity1Id, entity2Id, entityType1, entityType2) !== undefined;
    };

    /**
     * Get all connections involving a specific entity
     */
    const getConnectionsForEntity = (entityId) => {
        const connections = [];
        
        data.connections.forEach(connection => {
            if (connection.entity1Id === entityId || connection.entity2Id === entityId) {
                connections.push(connection);
            }
        });

        return connections;
    };

    /**
     * Get all explicit connections
     */
    const getAllConnections = () => {
        return Array.from(data.connections.values());
    };

    /**
     * Get connections for specific entity type combination
     */
    const getConnectionsForEntityTypes = (entityType1, entityType2 = null) => {
        return Array.from(data.connections.values()).filter(connection => {
            if (entityType2) {
                // Check for exact type combination (in either order)
                return (connection.entity1Type === entityType1 && connection.entity2Type === entityType2) ||
                       (connection.entity1Type === entityType2 && connection.entity2Type === entityType1);
            } else {
                // Check for any connection involving the entity type
                return connection.entity1Type === entityType1 || connection.entity2Type === entityType1;
            }
        });
    };

    /**
     * Clear all connections
     */
    const clearAll = () => {
        data.connections.clear();
    };

    /**
     * Update entity references in connections (useful when entities are recreated)
     */
    const updateEntityReferences = (entityId, entityType, newEntityRef) => {
        data.connections.forEach(connection => {
            if (connection.entity1Id === entityId && connection.entity1Type === entityType) {
                connection.entity1 = newEntityRef;
            }
            if (connection.entity2Id === entityId && connection.entity2Type === entityType) {
                connection.entity2 = newEntityRef;
            }
        });
    };

    /**
     * Serialization for persistence
     */
    const serialize = () => ({
        connections: Array.from(data.connections.entries()),
        nextConnectionId: data.nextConnectionId
    });

    /**
     * Deserialization from saved data
     */
const deserialize = (savedData, getEntityRef) => {
    if (savedData.connections) {
        data.connections = new Map();
        
        // Reconstruct connections with entity references
        savedData.connections.forEach(([id, connectionData]) => {
            // Get fresh entity references
            const entity1Ref = getEntityRef(connectionData.entity1Type, connectionData.entity1Id);
            const entity2Ref = getEntityRef(connectionData.entity2Type, connectionData.entity2Id);
            
            // Only restore connection if both entities still exist
            if (entity1Ref && entity2Ref) {
                const restoredConnection = {
                    ...connectionData,
                    entity1: entity1Ref,
                    entity2: entity2Ref,
                    // Ensure directionality exists for backward compatibility
                    directionality: connectionData.directionality || 'none',
                    // NEW: Ensure energyTypes exists for backward compatibility
                    energyTypes: connectionData.energyTypes || []
                };
                data.connections.set(id, restoredConnection);
            }
        });
    }
    
    if (savedData.nextConnectionId) {
        data.nextConnectionId = savedData.nextConnectionId;
    }
};

return {
    data,
    createConnection,
    deleteConnection,
    deleteConnectionsForEntity,
    findConnection,
    hasConnection,
    getConnectionsForEntity,
    getAllConnections,
    getConnectionsForEntityTypes,
    clearAll,
    updateEntityReferences,
    updateConnection,
    serialize,
    deserialize
};
}

export function useExplicitConnectionStore() {
    if (!explicitConnectionStoreInstance) {
        explicitConnectionStoreInstance = createExplicitConnectionStore();
    }
    return explicitConnectionStoreInstance;
}
