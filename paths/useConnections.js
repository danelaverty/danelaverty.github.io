// useConnections.js - Composable for managing connections in components (Updated for circles + REACTIVITY FIX)
import { ref, computed, watch, onMounted } from './vue-composition-api.js';
import { ConnectionManager } from './ConnectionManager.js';

let globalConnectionManager = null;

export function useConnections() {
    // Singleton connection manager
    if (!globalConnectionManager) {
        globalConnectionManager = new ConnectionManager();
        // Expose for debugging
        window.connectionManager = globalConnectionManager;
    }

    return {
        connectionManager: globalConnectionManager,
        connections: computed(() => globalConnectionManager.getConnections())
    };
}

/**
 * Hook for components that need to trigger connection updates
 * @param {Function} getEntities - Function that returns current entities (squares or circles)
 * @param {string} entityType - Type of entities ('square' or 'circle')
 * @param {Object} options - Configuration options
 */
export function useConnectionUpdater(getEntities, entityType = 'square', options = {}) {
    const { connectionManager } = useConnections();
    const { 
        watchEntities = true, 
        immediate = true,
        debounceMs = 0
    } = options;

    let updateTimeout = null;

    const updateConnections = (draggedEntityIds = null) => {
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }

	const doUpdate = () => {
		const entities = getEntities();
		if (entities && entities.length > 0) {
			connectionManager.updateConnections(entities, entityType, draggedEntityIds);
		} else {
			// FIXED: Only clear connections for the specific entity type, not all connections
			connectionManager.clearConnections(entityType);
		}
	};

        if (debounceMs > 0) {
            updateTimeout = setTimeout(doUpdate, debounceMs);
        } else {
            doUpdate();
        }
    };

    // Watch entities for changes if enabled
    if (watchEntities) {
        watch(
            () => {
                const entities = getEntities();
                // Create a dependency on entity positions and count
                return entities?.map(e => `${e.id}-${e.x}-${e.y}`).join(',') || '';
            },
            () => updateConnections(),
            { immediate }
        );
    }

    return {
        updateConnections,
        clearConnections: () => connectionManager.clearConnections()
    };
}

/**
 * Hook specifically for drag operations
 * @param {Function} getEntities - Function that returns current entities
 * @param {Function} getSelectedEntityIds - Function that returns selected entity IDs
 * @param {string} entityType - Type of entities ('square' or 'circle')
 * @param {Function} getReactiveEntity - Optional function to get reactive entity by ID
 */
export function useConnectionDragUpdater(getEntities, getSelectedEntityIds, entityType = 'square', getReactiveEntity = null) {
    const { connectionManager } = useConnections();

    const updateConnectionsForDrag = () => {
        const entities = getEntities();
        const selectedIds = getSelectedEntityIds();
        
        if (entities && entities.length > 0) {
            const draggedEntityIds = new Set(selectedIds);
            
            // EXPERIMENTAL FIX: Try to get fresh reactive entities if possible
            let workingEntities = entities;
            if (getReactiveEntity && entityType.startsWith('circle')) {
                workingEntities = entities.map(entity => {
                    if (!entity.__v_isReactive && !entity.__v_isProxy) {
                        const freshEntity = getReactiveEntity(entity.id);
                        if (freshEntity && (freshEntity.__v_isReactive || freshEntity.__v_isProxy)) {
                            return freshEntity;
                        }
                    }
                    return entity;
                });
            }
            
            connectionManager.updateConnections(workingEntities, entityType, draggedEntityIds);
        } else {
            console.warn(`❌ useConnectionDragUpdater: No entities found for ${entityType}`);
        }
    };

    return {
        updateConnectionsForDrag
    };
}

/**
 * EXPERIMENTAL: Hook with automatic reactivity repair
 * @param {Function} getEntities - Function that returns current entities
 * @param {Function} getSelectedEntityIds - Function that returns selected entity IDs 
 * @param {string} entityType - Type of entities
 * @param {Function} getOriginalEntity - Function to get original reactive entity by ID
 */
export function useConnectionDragUpdaterWithReactivityFix(getEntities, getSelectedEntityIds, entityType, getOriginalEntity) {
    const { connectionManager } = useConnections();

    const updateConnectionsForDrag = () => {
        const entities = getEntities();
        const selectedIds = getSelectedEntityIds();
        
        if (entities && entities.length > 0) {
            // Map entities to their reactive versions
            const reactiveEntities = entities.map(entity => {
                const isReactive = entity.__v_isReactive || entity.__v_isProxy;
                
                if (!isReactive && getOriginalEntity) {
                    const originalEntity = getOriginalEntity(entity.id);
                    
                    if (originalEntity && (originalEntity.__v_isReactive || originalEntity.__v_isProxy)) {
                        // Copy current position to reactive entity
                        originalEntity.x = entity.x;
                        originalEntity.y = entity.y;
                        return originalEntity;
                    } else {
                        console.warn(`❌ Could not get reactive version of ${entity.id}`);
                    }
                }
                
                return entity;
            });
            
            const draggedEntityIds = new Set(selectedIds);
            connectionManager.updateConnections(reactiveEntities, entityType, draggedEntityIds);
        } else {
            console.warn(`❌ useConnectionDragUpdater: No entities found for ${entityType}`);
        }
    };

    return {
        updateConnectionsForDrag
    };
}
