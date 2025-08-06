// EntityControls.js - Unified controls component for both circles and squares (Updated to use SharedDropdown)
import { ref, computed } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles (simplified since dropdown styles moved to SharedDropdown)
const componentStyles = `
    .entity-controls {
        position: absolute;
        bottom: 10px;
        left: 10px;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 8px;
        z-index: 1000;
    }

    .entity-control-button {
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background-color: #333;
        color: #999;
        border: 2px solid #666;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background-color 0.2s ease;
    }

    .entity-control-button:hover {
        background-color: #555;
    }

    .entity-control-button:disabled {
        background-color: #222;
        border-color: #444;
        color: #666;
        cursor: not-allowed;
    }

    .entity-add-button {
        font-size: 20px;
    }

    .entity-document-button {
        font-size: 20px;
    }

    .entity-document-label {
        background-color: rgba(42, 42, 42, 0.9);
        color: #999;
        padding: 4px;
        border-radius: 6px;
        font-size: 12px;
        border: 1px solid #666;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        transition: background-color 0.2s ease;
        align-self: flex-start;
    }

    .entity-document-label:hover {
        background-color: rgba(52, 52, 52, 0.9);
        border-color: #888;
    }
`;

injectComponentStyles('entity-controls', componentStyles);

export const EntityControls = {
    props: {
        entityType: {
            type: String,
            required: true,
            validator: value => ['circle', 'square'].includes(value)
        },
        viewerId: {
            type: String,
            default: null // Only needed for circle controls
        }
    },
    emits: ['add-entity', 'document-change', 'show-dropdown'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const documentButtonRef = ref(null);
        const documentLabelRef = ref(null);

        const shouldShowControls = computed(() => {
            return props.entityType === 'circle' || dataStore.getSelectedCircles().length === 1;
        });

        const currentDocument = computed(() => {
            if (props.entityType === 'circle' && props.viewerId) {
                return dataStore.getCircleDocumentForViewer(props.viewerId);
            } else if (props.entityType === 'square') {
                return dataStore.getCurrentSquareDocument();
            }
            return null;
        });

        const hasDocument = computed(() => {
            return currentDocument.value !== null;
        });

        // Button handlers
        const handleAddClick = () => {
            emit('add-entity');
        };

        const handleDocumentClick = (event) => {
            const triggerElement = hasDocument.value ? documentLabelRef.value : documentButtonRef.value;
            
            emit('show-dropdown', {
                entityType: props.entityType,
                viewerId: props.viewerId,
                triggerElement,
                onDocumentChange: (id) => emit('document-change', id)
            });
        };

        return {
            shouldShowControls,
            hasDocument,
            currentDocument,
            documentButtonRef,
            documentLabelRef,
            handleAddClick,
            handleDocumentClick
        };
    },
    template: `
        <div 
            v-if="shouldShowControls"
            class="entity-controls"
        >
            <!-- Add Button -->
            <button 
                class="entity-control-button entity-add-button"
                @click="handleAddClick"
            >+</button>
            
            <!-- Document Button (shown when no document selected) -->
            <button 
                v-if="!hasDocument"
                ref="documentButtonRef"
                class="entity-control-button entity-document-button"
                @click="handleDocumentClick"
            >📁</button>
            
            <!-- Document Label (shown when document selected, clickable) -->
            <div 
                v-if="hasDocument"
                ref="documentLabelRef"
                class="entity-document-label"
                @click="handleDocumentClick"
            >{{ currentDocument.name }}</div>
        </div>
    `
};
