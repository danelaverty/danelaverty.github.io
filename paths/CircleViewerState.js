// CircleViewerState.js - All computed properties, data store interactions, connections
import { ref, computed } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useConnections } from './useConnections.js';

export function useCircleViewerState(props) {
    const dataStore = useDataStore();
    const viewerContentRef = ref(null);
    const viewerRef = ref(null);
    
    // Background type constants
    const BACKGROUND_TYPES = {
        SILHOUETTE: 'silhouette',
        CYCLE: 'cycle',
        NONE: 'none'
    };

    // Core computed properties
    const viewer = computed(() => dataStore.data.circleViewers.get(props.viewerId));
    
    const viewerProperties = computed(() => {
        return dataStore.getViewerProperties(props.viewerId);
    });
    
    const viewerWidth = computed(() => viewerProperties.value.width);
    
    const backgroundType = computed(() => {
        return viewerProperties.value.backgroundType || BACKGROUND_TYPES.SILHOUETTE;
    });
    
    const backgroundClass = computed(() => {
        return `background-${backgroundType.value}`;
    });
    
    const currentCircles = computed(() => {
        return dataStore.getCirclesForViewer(props.viewerId);
    });
    
    const isSelected = computed(() => dataStore.isViewerSelected(props.viewerId));

    // Connection management
    const { connections } = useConnections();
    
    const viewerConnections = computed(() => {
        const viewerEntityType = `circle-${props.viewerId}`;
        const viewerCircleConnections = connections.value.filter(c => c.entityType === viewerEntityType);
        
        const currentCircleIds = new Set(currentCircles.value.map(c => c.id));
        const filtered = viewerCircleConnections.filter(connection => {
            const hasEntity1 = currentCircleIds.has(connection.entity1Id);
            const hasEntity2 = currentCircleIds.has(connection.entity2Id);
            return hasEntity1 && hasEntity2;
        });
        
        return filtered;
    });

    return {
        dataStore,
        viewerContentRef,
        viewerRef,
        viewer,
        viewerProperties,
        viewerWidth,
        backgroundType,
        backgroundClass,
        currentCircles,
        isSelected,
        viewerConnections,
        BACKGROUND_TYPES
    };
}
