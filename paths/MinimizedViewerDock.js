// MinimizedViewerDock.js - Dock for minimized viewers
import { computed } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
const componentStyles = `
    .minimized-viewer-dock {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 60px;
        background-color: #1a1a1a;
        border-right: 2px solid #333;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 0;
        gap: 8px;
        z-index: 1004;
        overflow-y: auto;
    }

    .minimized-viewer-dock.hidden {
        display: none;
    }

    .minimized-viewer-icon {
        width: 50px;
        height: 40px;
        background-color: #333;
        border: 1px solid #555;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-size: 9px;
        text-align: center;
        word-break: break-word;
        line-height: 1.1;
        transition: all 0.2s ease;
        padding: 0px;
    }

    .minimized-viewer-icon:hover {
        background-color: #444;
        border-color: #777;
    }
`;

injectComponentStyles('minimized-viewer-dock', componentStyles);

export const MinimizedViewerDock = {
    emits: ['restore-viewer'],
    setup(props, { emit }) {
        const dataStore = useDataStore();

        const minimizedViewers = computed(() => {
            return Array.from(dataStore.data.minimizedViewers.values());
        });

        const hasMinimizedViewers = computed(() => {
            return minimizedViewers.value.length > 0;
        });

        const handleRestoreViewer = (viewerId) => {
            emit('restore-viewer', viewerId);
        };

        const getViewerDisplayName = (viewer) => {
            const title = dataStore.getViewerTitle(viewer.id);
            // Truncate long titles for display in dock
            return title.length > 16 ? title.substring(0, 16) + '...' : title;
        };

        return {
            dataStore,
            minimizedViewers,
            hasMinimizedViewers,
            handleRestoreViewer,
            getViewerDisplayName
        };
    },
    template: `
        <div 
            :class="['minimized-viewer-dock', { hidden: !hasMinimizedViewers }]"
        >
            <div 
                v-for="viewer in minimizedViewers"
                :key="viewer.id"
                class="minimized-viewer-icon"
                @click="handleRestoreViewer(viewer.id)"
                :title="getViewerDisplayName(viewer)"
            >
                {{ getViewerDisplayName(viewer) }}
            </div>
        </div>
    `
};
