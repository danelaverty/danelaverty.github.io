// useConnections.js - Composable for managing connections in components (Updated for circles)
import { ref, computed, watch, onMounted } from './vue-composition-api.js';
import { ConnectionManager } from './ConnectionManager.js';

let globalConnectionManager = null;

export function useConnections() {
    // Singleton connection manager
    if (!globalConnectionManager) {
        globalConnectionManager = new ConnectionManager();
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
 */
export function useConnectionDragUpdater(getEntities, getSelectedEntityIds, entityType = 'square') {
    const { connectionManager } = useConnections();

    const updateConnectionsForDrag = () => {
        
        const entities = getEntities();
        const selectedIds = getSelectedEntityIds();
        
        if (entities && entities.length > 0) {
            const draggedEntityIds = new Set(selectedIds);
            
            connectionManager.updateConnections(entities, entityType, draggedEntityIds);
        } else {
            console.warn(`❌ useConnectionDragUpdater: No entities found for ${entityType}`);
        }
    };

    return {
        updateConnectionsForDrag
    };
}
