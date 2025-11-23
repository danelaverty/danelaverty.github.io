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
            // For circle viewers, ensure a document is selected before adding
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    // No document selected - create a new one first
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'normal' });
        };

        const handleAddRoilGroupClick = () => {
            // For circle viewers, ensure a document is selected before adding
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    // No document selected - create a new one first
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'roilGroup' });
        };

        const handleDocumentClick = (event) => {
            //const triggerElement = hasDocument.value ? documentLabelRef.value : documentButtonRef.value;
            const triggerElement = documentButtonRef.value;
            
            emit('show-dropdown', {
                entityType: props.entityType,
                viewerId: props.viewerId,
                triggerElement,
                onDocumentChange: (id) => emit('document-change', id)
            });
        };

        const shouldShowMButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length !== 1) return false;
            
            // Get the actual circle object using the ID
            const selectedCircle = dataStore.getCircle(selectedCircleIds[0]);
            if (!selectedCircle) return false;
            
            return selectedCircle.type === 'group' && selectedCircle.roilMode === 'on';
        });

        // Add this handler
        const handleAddMemberClick = () => {
            // Same document selection logic as other buttons
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'roilMember' });
        };

        // Add visibility logic for "A" button (same as "M" button)
        const shouldShowAButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length !== 1) return false;
            
            // Get the actual circle object using the ID
            const selectedCircle = dataStore.getCircle(selectedCircleIds[0]);
            if (!selectedCircle) return false;
            
            return selectedCircle.type === 'group' && selectedCircle.roilMode === 'on';
        });

        // Add handler for "A" button
        const handleAddAngryMemberClick = () => {
            // Same document selection logic as other buttons
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'angryMember' });
        };

        // NEW: Check if any selected circles are glow-type roil members
        const shouldShowArrowButtons = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length === 0) return false;
            
            // Check if any selected circle is a glow-type that belongs to a roil group
            return selectedCircleIds.some(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return false;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                return parentGroup && parentGroup.type === 'group' && parentGroup.roilMode === 'on';
            });
        });

        // NEW: Handler for making circles angry
        const handleMakeAngryClick = () => {
            const selectedCircleIds = dataStore.getSelectedCircles();
            
            selectedCircleIds.forEach(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                if (!parentGroup || parentGroup.type !== 'group' || parentGroup.roilMode !== 'on') return;
                
                // Apply angry properties
                dataStore.updateCircle(circleId, {
                    buoyancy: 'buoyant',
                    angrified: 'yes',
                    colors: ['hsl(0, 100%, 60%)'],
                    secondaryColors: ['hsl(0, 100%, 60%)']
                });
            });
        };

        // NEW: Handler for making circles normal
        const handleMakeNormalClick = () => {
            const selectedCircleIds = dataStore.getSelectedCircles();
            
            selectedCircleIds.forEach(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                if (!parentGroup || parentGroup.type !== 'group' || parentGroup.roilMode !== 'on') return;
                
                // Apply normal properties (remove buoyancy, set normal colors)
                const updates = {
                    buoyancy: 'normal',
                    angrified: 'no',
                    colors: ['hsl(0, 100%, 80%)'],
                    secondaryColors: ['hsl(48, 100%, 80%)']
                };
                
                dataStore.updateCircle(circleId, updates);
            });
        };

        return {
            shouldShowControls,
            hasDocument,
            currentDocument,
            documentButtonRef,
            documentLabelRef,
            handleAddClick,
            handleAddRoilGroupClick,
            handleDocumentClick,
            shouldShowMButton,
            handleAddMemberClick,
            shouldShowAButton,
            handleAddAngryMemberClick,
            shouldShowArrowButtons,
            handleMakeAngryClick,
            handleMakeNormalClick,
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
            <!-- Add Roil Group Button -->
            <button 
                class="entity-control-button entity-add-button"
                @click="handleAddRoilGroupClick"
            >R</button>
            <button 
                v-if="shouldShowMButton"
                class="entity-control-button entity-add-button"
                @click="handleAddMemberClick"
            >M</button>
            <button 
                v-if="shouldShowAButton"
                class="entity-control-button entity-add-button"
                @click="handleAddAngryMemberClick"
            >A</button>
            <!-- NEW: Arrow buttons for making selected roil members angry/normal -->
            <button 
                v-if="shouldShowArrowButtons"
                class="entity-control-button entity-add-button"
                @click="handleMakeAngryClick"
            >↑</button>
            <button 
                v-if="shouldShowArrowButtons"
                class="entity-control-button entity-add-button"
                @click="handleMakeNormalClick"
            >↓</button>
        </div>
    `
};
