// ExplicitConnectionService.js - Service layer for explicit connection operations
import { useExplicitConnectionStore } from './explicitConnectionStore.js';

export class ExplicitConnectionService {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.explicitConnectionStore = useExplicitConnectionStore();
        this.saveToStorage = dataStore.saveToStorage;
    }

    /**
     * Get entity reference from dataStore by type and ID
     */
    getEntityReference(entityType, entityId) {
        if (entityType === 'circle') {
            return this.dataStore.getCircle(entityId);
        } else if (entityType === 'square') {
            return this.dataStore.getSquare(entityId);
        }
        return null;
    }

    getConnectionBetweenEntities(entity1Id, entity1Type, entity2Id, entity2Type) {
        return this.explicitConnectionStore.findConnection(entity1Id, entity2Id, entity1Type, entity2Type);
    }

    /**
     * Update properties of an explicit connection
     */
    updateConnectionProperty(connectionId, property, value) {
        const connection = this.explicitConnectionStore.updateConnection(connectionId, {
            [property]: value
        });

        this.saveToStorage();
        
        return {
            action: 'update',
            connection,
            message: `Updated connection ${property} to ${value}`
        };
    }

    /**
     * Handle ctrl-click on entity - either create or delete explicit connection
     */
    handleEntityCtrlClick(clickedEntityId, clickedEntityType, selectedEntityIds, selectedEntityType, viewerId = null) {
        // If no entities selected, ctrl-click does nothing
        if (!selectedEntityIds || selectedEntityIds.length === 0) {
            return { action: 'none', message: 'No entities selected' };
        }

        // Check if clicked entity is in an explicit connection with any selected entity
        const existingConnections = this.findExistingConnections(clickedEntityId, clickedEntityType, selectedEntityIds, selectedEntityType);
        
        var result;
        if (existingConnections.length > 0) {
            // Delete existing connections
            result = this.deleteConnections(existingConnections);
        } else {
            // Create new connections
            result = this.createConnections(clickedEntityId, clickedEntityType, selectedEntityIds, selectedEntityType, viewerId);
        }
        if (result && result.action !== 'error' && result.action !== 'none') {
            this.saveToStorage();
        }
        return result;
    }

    /**
     * Find existing explicit connections between clicked entity and selected entities
     */
    findExistingConnections(clickedEntityId, clickedEntityType, selectedEntityIds, selectedEntityType) {
        const existingConnections = [];

        selectedEntityIds.forEach(selectedId => {
            const connection = this.explicitConnectionStore.findConnection(
                clickedEntityId, selectedId, clickedEntityType, selectedEntityType
            );
            if (connection) {
                existingConnections.push(connection);
            }
        });

        return existingConnections;
    }

    /**
     * Delete explicit connections
     */
    deleteConnections(connections) {
        let deletedCount = 0;
        
        connections.forEach(connection => {
            if (this.explicitConnectionStore.deleteConnection(connection.id)) {
                deletedCount++;
            }
        });

        return {
            action: 'delete',
            count: deletedCount,
            message: `Deleted ${deletedCount} explicit connection${deletedCount !== 1 ? 's' : ''}`
        };
    }

    /**
     * Create new explicit connections
     */
createConnections(clickedEntityId, clickedEntityType, selectedEntityIds, selectedEntityType, viewerId = null) {
    const clickedEntityRef = this.getEntityReference(clickedEntityType, clickedEntityId);
    
    if (!clickedEntityRef) {
        return { action: 'error', message: 'Clicked entity not found' };
    }

    let createdCount = 0;
    const createdConnections = [];

    selectedEntityIds.forEach(selectedId => {
        // Don't create connection to itself
        if (selectedId === clickedEntityId) {
            return;
        }

        const selectedEntityRef = this.getEntityReference(selectedEntityType, selectedId);
        
        if (selectedEntityRef) {
            // Check if connection already exists (shouldn't, but safety check)
            if (!this.explicitConnectionStore.hasConnection(clickedEntityId, selectedId, clickedEntityType, selectedEntityType)) {
                const connection = this.explicitConnectionStore.createConnection(
                    clickedEntityId, clickedEntityType,
                    selectedId, selectedEntityType,
                    clickedEntityRef, selectedEntityRef
                );
                
                if (connection) {
                    createdConnections.push(connection);
                    createdCount++;
                }
            }
        }
    });

    const result = {
        action: 'create',
        count: createdCount,
        connections: createdConnections,
        message: `Created ${createdCount} explicit connection${createdCount !== 1 ? 's' : ''}`
    };
    
    return result;
}

    /**
     * Delete all explicit connections involving an entity (called when entity is deleted)
     */
    deleteConnectionsForEntity(entityId, entityType = null) {
        const deletedCount = this.explicitConnectionStore.deleteConnectionsForEntity(entityId);
        if (deletedCount > 0) {
            this.saveToStorage();
        }
        
        return {
            action: 'cleanup',
            count: deletedCount,
            message: `Cleaned up ${deletedCount} explicit connection${deletedCount !== 1 ? 's' : ''} for deleted entity`
        };
    }

    /**
     * Get all explicit connections that should be rendered as visual connections
     * Returns connections in the same format as regular connections for compatibility with ConnectionComponent
     */
    getVisualConnections(entityType = null) {
        let connections;
        
        if (entityType) {
            connections = this.explicitConnectionStore.getConnectionsForEntityTypes(entityType);
        } else {
            connections = this.explicitConnectionStore.getAllConnections();
        }

        // Convert to visual connection format compatible with ConnectionComponent
        return connections.map(connection => ({
            id: connection.id,
            entity1Id: connection.entity1Id,
            entity2Id: connection.entity2Id,
            entity1: connection.entity1,
            entity2: connection.entity2,
            entityType: `explicit-${connection.entity1Type}-${connection.entity2Type}`,
            isExplicit: true, // Flag to distinguish from regular connections
            directionality: connection.directionality || 'none', // ADDED: Include directionality property
            distance: this.calculateDistance(connection.entity1, connection.entity2),
            connectionDistance: Infinity, // Explicit connections always render regardless of distance
            createdAt: connection.createdAt
        }));
    }

    /**
     * Get visual connections for specific entity types (for viewer-specific rendering)
     */
    getVisualConnectionsForEntityType(entityType, viewerId = null) {
        if (entityType.startsWith('circle-')) {
            // Extract viewer ID from entity type (e.g., 'circle-viewer_1' -> 'viewer_1')
            const extractedViewerId = viewerId || entityType.split('-')[1];
            
            // Get all circle connections and filter to only those in this specific viewer
            const allCircleConnections = this.getVisualConnections('circle');
            
            // Filter connections to only include those where both entities are in the specified viewer
            const viewerConnections = allCircleConnections.filter(connection => {
                // Check if both entities exist in this viewer's document
                if (!extractedViewerId) return false;
                
                const viewerCircles = this.dataStore.getCirclesForViewer ? 
                    this.dataStore.getCirclesForViewer(extractedViewerId) : [];
                
                const entity1InViewer = viewerCircles.some(circle => circle.id === connection.entity1Id);
                const entity2InViewer = viewerCircles.some(circle => circle.id === connection.entity2Id);
                
                return entity1InViewer && entity2InViewer;
            });
            
            return viewerConnections.map(connection => ({
                ...connection,
                entityType: `explicit-${entityType}` // Preserve viewer-specific type
            }));
        } else if (entityType === 'circle') {
            return this.getVisualConnections('circle').map(connection => ({
                ...connection,
                entityType: 'explicit-circle'
            }));
        } else if (entityType === 'square') {
            return this.getVisualConnections('square').map(connection => ({
                ...connection,
                entityType: 'explicit-square'
            }));
        }
        
        return [];
    }

    /**
     * Calculate distance between two entities (for compatibility)
     */
    calculateDistance(entity1, entity2) {
        if (!entity1 || !entity2) return 0;
        
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Update entity references when entities change (useful for reactivity)
     */
    updateEntityReference(entityId, entityType) {
        const entityRef = this.getEntityReference(entityType, entityId);
        if (entityRef) {
            this.explicitConnectionStore.updateEntityReferences(entityId, entityType, entityRef);
        }
    }

    /**
     * Get connections for a specific entity (for debugging or UI display)
     */
    getConnectionsForEntity(entityId) {
        return this.explicitConnectionStore.getConnectionsForEntity(entityId);
    }

    /**
     * Check if entity has any explicit connections
     */
    hasConnections(entityId) {
        return this.getConnectionsForEntity(entityId).length > 0;
    }

    /**
     * Get count of explicit connections
     */
    getConnectionCount() {
        return this.explicitConnectionStore.getAllConnections().length;
    }

    /**
     * Serialize for persistence
     */
    serialize() {
        return this.explicitConnectionStore.serialize();
    }

    /**
     * Deserialize from saved data
     */
    deserialize(savedData) {
        this.explicitConnectionStore.deserialize(savedData, (entityType, entityId) => {
            return this.getEntityReference(entityType, entityId);
        });
    }
}
