// EntityControls.js - Updated to remove picker modals (moved to AppComponent)
import { ref, computed } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useCharacteristicsBarBridge } from './useCharacteristicsBarBridge.js';
import { injectComponentStyles } from './styleUtils.js';
import { CONTROL_REGISTRY } from './controlRegistry.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiVariantService } from './EmojiVariantService.js';
import { CBConnectionDirectionalityControl } from './CBConnectionDirectionalityControl.js';
import { CBConnectionEnergyControl } from './CBConnectionEnergyControl.js';
import { getPropertyConfig } from './CBCyclePropertyConfigs.js';
import { CBSecondaryNameControl } from './CBSecondaryNameControl.js';
import { CBStatesControl } from './CBStatesControl.js';

// Import styles - migrated from CircleCharacteristicsBar
import { baseCharacteristicsStyles, colorStyles, typeStyles, energyStyles, activationStyles, emojiStyles } from './cbBaseStyles.js';

// Import control components (but not picker modals)
import { TypeControl } from './CBTypeControl.js';
import { CircleEmojiControl } from './CBCircleEmojiControl.js';
import { ColorControl } from './CBColorControl.js';
import { EnergyControl } from './CBEnergyControl.js';
import { CBCyclePropertyControl } from './CBCyclePropertyControl.js';
import { CBJumpToReferenceControl } from './CBJumpToReferenceControl.js';
import { BreakReferenceControl } from './CBBreakReferenceControl.js';

const componentStyles = `
    .entity-controls {
        position: absolute;
        bottom: 10px;
        left: 10px;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 3px;
        z-index: 1000;
        flex-wrap: nowrap; /* Prevent wrapping for now */
    }

    /* Add button specific styling */
    .entity-add-button {
        font-size: 20px;
        font-weight: bold;
    }

    /* Document label styling */
    .entity-document-label {
        background-color: rgba(42, 42, 42, 0.9);
        color: #999;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid #666;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        transition: background-color 0.2s ease;
        align-self: flex-start;
        height: 32px;
        display: flex;
        align-items: center;
    }

    .entity-document-label:hover {
        background-color: rgba(52, 52, 52, 0.9);
        border-color: #888;
    }

    /* Include all characteristic bar styles */
    ${baseCharacteristicsStyles}
    ${colorStyles}
    ${typeStyles}
    ${energyStyles}
    ${activationStyles}
    ${emojiStyles}
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

        // Use characteristics bridge for circle controls
        const characteristics = props.entityType === 'circle' ? useCharacteristicsBarBridge() : null;

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

        // Circle-specific control visibility
        const shouldShowCircleControls = computed(() => {
            if (props.entityType !== 'circle' || !characteristics) return false;
            return characteristics.isVisible.value;
        });

        const shouldShowCircleCharacteristicControls = computed(() => {
            if (!characteristics) return false;
            return characteristics.shouldShowCircleCharacteristicControls.value;
        });

        const shouldShowEmojiControls = computed(() => {
            if (!characteristics) return false;
            return characteristics.shouldShowEmojiControls?.value || false;
        });

        const shouldShowExplicitConnectionControls = computed(() => {
            if (!characteristics) return false;
            return characteristics.shouldShowExplicitConnectionControls?.value || false;
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
            const triggerElement = documentButtonRef.value;
            
            emit('show-dropdown', {
                entityType: props.entityType,
                viewerId: props.viewerId,
                triggerElement,
                onDocumentChange: (id) => emit('document-change', id)
            });
        };

        const shouldShowRButton = computed(() => {
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length !== 0) return false;
            return true;
        });

        const shouldShowMButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length !== 1) return false;
            
            const selectedCircle = dataStore.getCircle(selectedCircleIds[0]);
            if (!selectedCircle) return false;
            
            return selectedCircle.type === 'group' && selectedCircle.roilMode === 'on';
        });

        const handleAddMemberClick = () => {
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'roilMember' });
        };

        const shouldShowAButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length !== 1) return false;
            
            const selectedCircle = dataStore.getCircle(selectedCircleIds[0]);
            if (!selectedCircle) return false;
            
            return selectedCircle.type === 'group' && selectedCircle.roilMode === 'on';
        });

        const handleAddAngryMemberClick = () => {
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'angryMember' });
        };

        const shouldShowArrowButtons = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            if (selectedCircleIds.length === 0) return false;
            
            return selectedCircleIds.some(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return false;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                return parentGroup && parentGroup.type === 'group' && parentGroup.roilMode === 'on';
            });
        });

        const handleMakeAngryClick = () => {
            const selectedCircleIds = dataStore.getSelectedCircles();
            
            selectedCircleIds.forEach(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                if (!parentGroup || parentGroup.type !== 'group' || parentGroup.roilMode !== 'on') return;
                
                dataStore.updateCircle(circleId, {
                    buoyancy: 'buoyant',
                    colors: ['hsl(0, 100%, 60%)'],
                    secondaryColors: ['hsl(0, 100%, 60%)']
                });
            });
        };

        const handleMakeNormalClick = () => {
            const selectedCircleIds = dataStore.getSelectedCircles();
            
            selectedCircleIds.forEach(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                if (!parentGroup || parentGroup.type !== 'group' || parentGroup.roilMode !== 'on') return;
                
                const updates = {
                    buoyancy: 'normal',
                    colors: ['hsl(0, 100%, 80%)'],
                    secondaryColors: ['hsl(48, 100%, 80%)']
                };
                
                dataStore.updateCircle(circleId, updates);
            });
        };

        // Helper function to assign refs properly
        const assignDisplayRef = (controlName) => (el) => {
            if (el && characteristics) {
                characteristics.getDisplayRef(controlName).value = el.$el || el;
            }
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
            shouldShowRButton,
            shouldShowMButton,
            handleAddMemberClick,
            shouldShowAButton,
            handleAddAngryMemberClick,
            shouldShowArrowButtons,
            handleMakeAngryClick,
            handleMakeNormalClick,
            
            // Circle control functionality
            shouldShowCircleControls,
            shouldShowCircleCharacteristicControls,
            shouldShowEmojiControls,
            shouldShowExplicitConnectionControls,
            assignDisplayRef,
            
            // Expose all characteristics functionality when available
            ...(characteristics || {}),
            
            // Utilities
            getPropertyConfig,
            EmojiVariantService,
            CONTROL_REGISTRY,
        };
    },
    
    components: {
        EmojiRenderer,
        TypeControl,
        CircleEmojiControl,
        ColorControl,
        EnergyControl,
        CBCyclePropertyControl,
        CBJumpToReferenceControl,
        BreakReferenceControl,
        CBConnectionDirectionalityControl,
        CBConnectionEnergyControl,
        CBSecondaryNameControl,
        CBStatesControl,
    },
    
    template: `
        <div 
            v-if="shouldShowControls"
            class="entity-controls"
        >
            <!-- Basic Entity Creation Controls -->
            <div 
                v-if="shouldShowRButton"
                class="characteristic-control entity-add-button"
                @click="handleAddClick"
                title="Add Circle"
            >+</div>
            
            <div 
                v-if="shouldShowRButton"
                class="characteristic-control entity-add-button"
                @click="handleAddRoilGroupClick"
                title="Add Roil Group"
            >R</div>
            
            <div 
                v-if="shouldShowMButton"
                class="characteristic-control entity-add-button"
                @click="handleAddMemberClick"
                title="Add Member"
            >M</div>
            
            <div 
                v-if="shouldShowAButton"
                class="characteristic-control entity-add-button"
                @click="handleAddAngryMemberClick"
                title="Add Angry Member"
            >A</div>
            
            <div 
                v-if="shouldShowArrowButtons"
                class="characteristic-control entity-add-button"
                @click="handleMakeAngryClick"
                title="Make Selected Angry"
            >&#x2191;</div>
            
            <div 
                v-if="shouldShowArrowButtons"
                class="characteristic-control entity-add-button"
                @click="handleMakeNormalClick"
                title="Make Selected Normal"
            >&#x2193;</div>

            <!-- Circle Characteristic Controls -->
            <template v-if="shouldShowCircleControls && shouldShowCircleCharacteristicControls">
                <!-- Type Control -->
                <TypeControl 
                    :ref="assignDisplayRef('type')"
                    :currentTypeInfo="currentTypeInfo"
                    :isPickerOpen="isTypePickerOpen"
                    @toggle="toggleTypePicker"
                />

                <!-- Circle Emoji Control -->
                <CircleEmojiControl 
                    v-if="isCircleEmojiPickerVisible"
                    :ref="assignDisplayRef('circleEmoji')"
                    :selectedCircle="selectedCircle"
                    :hasMultipleCirclesSelected="hasMultipleCirclesSelected"
                    :selectedCircles="getSelectedCircleObjects"
                    :isPickerOpen="isCircleEmojiPickerOpen"
                    :propertyName="'emoji'"
                    @toggle="toggleCircleEmojiPicker"
                />

                <!-- Cause Emoji Control -->
                <CircleEmojiControl 
                    :ref="assignDisplayRef('causeEmoji')"
                    :selectedCircle="selectedCircle"
                    :hasMultipleCirclesSelected="hasMultipleCirclesSelected"
                    :selectedCircles="getSelectedCircleObjects"
                    :isPickerOpen="isCauseEmojiPickerOpen"
                    :propertyName="'causeEmoji'"
                    @toggle="toggleCauseEmojiPicker"
                />

                <!-- Demand Emoji Control -->
                <CircleEmojiControl 
                    :ref="assignDisplayRef('demandEmoji')"
                    :selectedCircle="selectedCircle"
                    :hasMultipleCirclesSelected="hasMultipleCirclesSelected"
                    :selectedCircles="getSelectedCircleObjects"
                    :isPickerOpen="isDemandEmojiPickerOpen"
                    :propertyName="'demandEmoji'"
                    @toggle="toggleDemandEmojiPicker"
                />

                <!-- Color Control -->
                <ColorControl 
                    :ref="assignDisplayRef('color')"
                    :circleColors="circleColors"
                    :isPickerOpen="isColorPickerOpen"
                    @toggle="toggleColorPicker"
                />

                <!-- Energy Control -->
                <EnergyControl 
                    :ref="assignDisplayRef('energy')"
                    :circleEnergyTypes="circleEnergyTypes"
                    :isPickerOpen="isEnergyPickerOpen"
                    :getEnergyTypeColor="getEnergyTypeColor"
                    @toggle="toggleEnergyPicker"
                />

                <CBStatesControl 
                    v-if="shouldShowStatesControl"
                    :selectedCircle="selectedCircle"
                    @toggle="toggleStatesPicker"
                />

                <!-- Dynamic Cycleable Property Controls -->
                <CBCyclePropertyControl 
                    v-for="propertyName in cycleableProperties"
                    :key="propertyName"
                    :property-name="propertyName"
                    :property-value="getPropertyValue(propertyName)"
                    @cycle="handlePropertyCycle(propertyName)"
                />
            </template>

            <!-- Reference Controls -->
            <CBJumpToReferenceControl 
                v-if="shouldShowJumpToReferenceControl"
                @jump-to-reference="handleJumpToReference"
            />

            <BreakReferenceControl 
                v-if="shouldShowBreakReferenceControl"
                @break-reference="handleBreakReference"
            />

            <!-- Explicit Connection Controls -->
            <template v-if="shouldShowExplicitConnectionControls">
                <!-- Visual separator -->
                <div style="border-left: 1px solid #666; margin: 0 4px; height: 32px;"></div>
                
                <!-- Connection Directionality Control -->
                <CBConnectionDirectionalityControl 
                    :directionality="connectionDirectionality"
                    @cycle="handleDirectionalityCycle"
                />
                
                <!-- Connection Energy Control -->
                <CBConnectionEnergyControl 
                    :connectionEnergyTypes="connectionEnergyTypes"
                    :isPickerOpen="isConnectionEnergyPickerOpen"
                    :getEnergyTypeColor="getEnergyTypeColor"
                    @toggle="toggleConnectionEnergyPicker"
                />
            </template>
        </div>
    `
};
