// useConnections.js - Composable for managing connections in components
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
 * @param {Function} getSquares - Function that returns current squares
 * @param {Object} options - Configuration options
 */
export function useConnectionUpdater(getSquares, options = {}) {
    const { connectionManager } = useConnections();
    const { 
        watchSquares = true, 
        immediate = true,
        debounceMs = 0
    } = options;

    let updateTimeout = null;

    const updateConnections = (draggedSquareIds = null) => {
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }

        const doUpdate = () => {
            const squares = getSquares();
            if (squares && squares.length > 0) {
                connectionManager.updateConnections(squares, draggedSquareIds);
            } else {
                connectionManager.clearConnections();
            }
        };

        if (debounceMs > 0) {
            updateTimeout = setTimeout(doUpdate, debounceMs);
        } else {
            doUpdate();
        }
    };

    // Watch squares for changes if enabled
    if (watchSquares) {
        watch(
            () => {
                const squares = getSquares();
                // Create a dependency on square positions and count
                return squares?.map(s => `${s.id}-${s.x}-${s.y}`).join(',') || '';
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
 * @param {Function} getSquares - Function that returns current squares
 * @param {Function} getSelectedSquareIds - Function that returns selected square IDs
 */
export function useConnectionDragUpdater(getSquares, getSelectedSquareIds) {
    const { connectionManager } = useConnections();

    const updateConnectionsForDrag = () => {
        const squares = getSquares();
        const selectedIds = getSelectedSquareIds();
        
        if (squares && squares.length > 0) {
            const draggedSquareIds = new Set(selectedIds);
            connectionManager.updateConnections(squares, draggedSquareIds);
        }
    };

    return {
        updateConnectionsForDrag
    };
}
