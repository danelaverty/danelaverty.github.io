// EntityControls.js - Updated with Reel In functionality
import { ref, computed, watch } from './vue-composition-api.js';
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
import { ReelInAnimationSystem } from './ReelInAnimationSystem.js';

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

    /* Unreel button specific styling */
    .entity-unreel-button {
        font-size: 16px;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .entity-unreel-button:hover {
        transform: scale(1.1);
    }

    .entity-unreel-button.animating {
        animation: reelInPulse 0.8s ease-in-out;
    }

    /* Unreel button emoji styling - fishing rod with X overlay */
    .entity-unreel-button .unreel-emoji {
        position: relative;
        display: inline-block;
    }

    .entity-unreel-button .unreel-x {
        position: absolute;
        top: -2px;
        right: -2px;
        font-size: 12px;
        color: #ff4444;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
    }

    @keyframes reelInPulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.15);
        }
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
        const reelInButtonRef = ref(null);
        const isReelInAnimating = ref(false);
        const showUnreelButton = ref(false); // NEW: Track button state

        // Initialize reel-in animation system
        const reelInSystem = new ReelInAnimationSystem();

        // Use characteristics bridge for circle controls
        const characteristics = props.entityType === 'circle' ? useCharacteristicsBarBridge() : null;

        // FIXED: Get circles specific to this viewer
        const viewerSpecificCircles = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return [];
            return dataStore.getCirclesForViewer(props.viewerId);
        });

        // FIXED: Get selected circles that belong to this viewer
        const viewerSelectedCircles = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return [];
            
            const selectedCircleIds = dataStore.getSelectedCircles();
            const viewerCircleIds = new Set(viewerSpecificCircles.value.map(c => c.id));
            
            return selectedCircleIds.filter(id => viewerCircleIds.has(id));
        });

        const shouldShowControls = computed(() => {
            return props.entityType === 'circle' || dataStore.getSelectedSquares().length > 0;
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

        // FIXED: Circle-specific control visibility based on viewer selection
        const shouldShowCircleControls = computed(() => {
            if (props.entityType !== 'circle' || !characteristics || !props.viewerId) return false;
            return viewerSelectedCircles.value.length > 0;
        });

        const shouldShowCircleCharacteristicControls = computed(() => {
            if (!characteristics || !props.viewerId) return false;
            return viewerSelectedCircles.value.length > 0;
        });

        const shouldShowEmojiControls = computed(() => {
            if (!characteristics || !props.viewerId) return false;
            return viewerSelectedCircles.value.length > 0 && 
                   characteristics.shouldShowEmojiControls?.value || false;
        });

        const shouldShowExplicitConnectionControls = computed(() => {
            if (!characteristics || !props.viewerId) return false;
            return viewerSelectedCircles.value.length > 0 && 
                   characteristics.shouldShowExplicitConnectionControls?.value || false;
        });

        // NEW: Reel in button visibility - only when exactly one circle is selected
        const shouldShowReelInButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            return viewerSelectedCircles.value.length === 1 && !showUnreelButton.value;
        });

        // NEW: Unreel button visibility - only when unreel is available
        const shouldShowUnreelButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            if (viewerSelectedCircles.value.length !== 1) return false;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            return showUnreelButton.value && reelInSystem.canUnreel(selectedCircleId);
        });

        // NEW: Check if the selected circle has any explicit connections
        const hasConnectedCircles = computed(() => {
            if (!shouldShowReelInButton.value) return false;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            const connections = dataStore.getExplicitConnectionBetweenEntities ?
                getConnectionsForCircle(selectedCircleId) : [];
            
            return connections.length > 0;
        });

        // Helper function to get all connections for a circle
        const getConnectionsForCircle = (circleId) => {
            const allConnections = [];
            
            // Check all circles in the viewer for explicit connections to the selected circle
            viewerSpecificCircles.value.forEach(circle => {
                if (circle.id !== circleId) {
                    const connection = dataStore.getExplicitConnectionBetweenEntities(
                        circleId, 'circle', circle.id, 'circle'
                    );
                    if (connection) {
                        allConnections.push({ connection, targetCircleId: circle.id });
                    }
                }
            });
            
            return allConnections;
        };

        // Set up reel-in animation callbacks
        reelInSystem.setCallbacks(
            // onPositionUpdate
            (circleId, x, y) => {
                dataStore.updateCircle(circleId, { x, y });
                // Trigger connection updates
                dataStore.triggerConnectionUpdateIfActive();
            },
            // onAnimationComplete
            (circleId, groupId, isUnreeling = false) => {
                if (isUnreeling) {
                    // Restore original group membership (or clear if originally ungrouped)
                    dataStore.clearCircleBelongsTo(circleId);
                    // Then set original group if there was one
                    if (groupId) {
                        dataStore.setCircleBelongsTo(circleId, groupId);
                    }
                } else {
                    // Join the target's group
                    if (groupId) {
                        dataStore.setCircleBelongsTo(circleId, groupId);
                    }
                }
                
                // Check if all animations are complete
                if (!reelInSystem.isAnimating()) {
                    isReelInAnimating.value = false;
                }
            }
        );

        // NEW: Handle reel in button click
        const handleReelInClick = () => {
            if (!shouldShowReelInButton.value || isReelInAnimating.value) return;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            const targetCircle = dataStore.getCircle(selectedCircleId);
            
            if (!targetCircle) return;
            
            // Get all connected circles
            const connections = getConnectionsForCircle(selectedCircleId);
            
            if (connections.length === 0) return;
            
            // Get the actual circle objects to reel in
            const circlesToReel = connections
                .map(({ targetCircleId }) => dataStore.getCircle(targetCircleId))
                .filter(circle => circle !== null);
            
            if (circlesToReel.length === 0) return;
            
            // Start animation and show unreel button
            isReelInAnimating.value = true;
            reelInSystem.reelInCircles(targetCircle, circlesToReel);
            
            // Switch to unreel button after animation starts
            setTimeout(() => {
                showUnreelButton.value = true;
            }, 100); // Small delay to ensure animation has started
        };

        // NEW: Handle unreel button click
        const handleUnreelClick = () => {
            if (!shouldShowUnreelButton.value || isReelInAnimating.value) return;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            if (!reelInSystem.canUnreel(selectedCircleId)) return;
            
            // Get circles that can be unreeled
            const unreelableCircleIds = reelInSystem.getUnreelableCircles();
            const circlesToUnreel = unreelableCircleIds
                .map(id => dataStore.getCircle(id))
                .filter(circle => circle !== null);
            
            if (circlesToUnreel.length === 0) return;
            
            // Start unreeling animation
            isReelInAnimating.value = true;
            reelInSystem.unreelCircles(circlesToUnreel);
            
            // Switch back to reel-in button after animation starts
            setTimeout(() => {
                showUnreelButton.value = false;
            }, 100);
        };

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

        // FIXED: Check viewer-specific selection for R button - show when NO circles selected in this viewer
        const shouldShowRButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            return viewerSelectedCircles.value.length === 0;
        });

        // FIXED: Check viewer-specific selection for M button
        const shouldShowMButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedIds = viewerSelectedCircles.value;
            if (selectedIds.length !== 1) return false;
            
            const selectedCircle = dataStore.getCircle(selectedIds[0]);
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

        // FIXED: Check viewer-specific selection for A button
        const shouldShowAButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedIds = viewerSelectedCircles.value;
            if (selectedIds.length !== 1) return false;
            
            const selectedCircle = dataStore.getCircle(selectedIds[0]);
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

        // FIXED: Check viewer-specific selection for arrow buttons
        const shouldShowArrowButtons = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedIds = viewerSelectedCircles.value;
            if (selectedIds.length === 0) return false;
            
            return selectedIds.some(circleId => {
                const circle = dataStore.getCircle(circleId);
                if (!circle || circle.type !== 'glow' || !circle.belongsToID) return false;
                
                const parentGroup = dataStore.getCircle(circle.belongsToID);
                return parentGroup && parentGroup.type === 'group' && parentGroup.roilMode === 'on';
            });
        });

        const handleMakeAngryClick = () => {
            const selectedCircleIds = viewerSelectedCircles.value;
            
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
            const selectedCircleIds = viewerSelectedCircles.value;
            
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

        // NEW: Watch for selection changes to clear unreel data
        watch(viewerSelectedCircles, (newSelection, oldSelection) => {
            // If selection changed, clear unreel data and reset button state
            if (JSON.stringify(newSelection) !== JSON.stringify(oldSelection)) {
                reelInSystem.clearUnreelData();
                showUnreelButton.value = false;
            }
        });

        return {
            shouldShowControls,
            hasDocument,
            currentDocument,
            documentButtonRef,
            documentLabelRef,
            reelInButtonRef,
            isReelInAnimating,
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
            
            // NEW: Reel in functionality
            shouldShowReelInButton,
            shouldShowUnreelButton,
            hasConnectedCircles,
            handleReelInClick,
            handleUnreelClick,
            showUnreelButton,
            
            // Circle control functionality - FIXED to use viewer-specific checks
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

                <div 
                    v-if="shouldShowReelInButton && hasConnectedCircles"
                    ref="reelInButtonRef"
                    class="characteristic-control entity-reel-button"
                    :class="{ animating: isReelInAnimating }"
                    @click="handleReelInClick"
                    title="Reel In Connected Circles"
                >🎣</div>

                <div 
                    v-if="shouldShowUnreelButton"
                    class="characteristic-control entity-unreel-button"
                    :class="{ animating: isReelInAnimating }"
                    @click="handleUnreelClick"
                    title="Unreel Circles to Original Positions"
                >
                    <span class="unreel-emoji">
                        🎣<span class="unreel-x">❌</span>
                    </span>
                </div>

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
