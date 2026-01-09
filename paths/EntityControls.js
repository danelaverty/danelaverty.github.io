// EntityControls.js - Updated with consolidated popup menus
import { ref, computed, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useCharacteristicsBarBridge } from './useCharacteristicsBarBridge.js';
import { injectComponentStyles } from './styleUtils.js';
import { CONTROL_REGISTRY } from './controlRegistry.js';
import { EmojiRenderer } from './EmojiRenderer.js';
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

// NEW: Import shared roil member configuration
import { roilAddMemberControlsConfig, getBuoyancyIcon } from './roilMemberConfig.js';

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

    .entity-menu-button.active {
        background-color: rgba(100, 100, 100, 0.8);
    }

    /* Popup menu styling */
    .entity-popup-menu {
        position: absolute;
        bottom: 100%;
        left: 0;
        background-color: rgba(42, 42, 42, 0.95);
        border: 1px solid #666;
        border-radius: 4px;
        padding: 6px;
        margin-bottom: 6px;
        display: flex;
        flex-direction: row;
        gap: 3px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        z-index: 1001;
        min-width: max-content;
    }

    /* Roil member state swatch styling */
    .roil-member-state-swatch {
        position: relative;
        width: 12px;
        height: 12px;
        border-radius: 2px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #444;
    }

    .roil-member-control {
        position: relative;
    }

    /* Unreel button specific styling */
    .entity-unreel-button {
        font-size: 16px;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
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
        const showUnreelButton = ref(false);

        // Menu state management
        const activeMenu = ref(null); // Track which menu is currently open
        const membersMenuRef = ref(null);
        const arrowMenuRef = ref(null);
        const characteristicsMenuRef = ref(null);
        const propertiesMenuRef = ref(null);

        // Initialize reel-in animation system
        const reelInSystem = new ReelInAnimationSystem();

        // Use characteristics bridge for circle controls
        const characteristics = props.entityType === 'circle' ? useCharacteristicsBarBridge() : null;

const shouldShowRoilComposureControl = computed(() => {
    if (props.entityType !== 'circle' || !props.viewerId) return false;
    
    const selectedIds = viewerSelectedCircles.value;
    if (selectedIds.length !== 1) return false;
    
    const selectedCircle = dataStore.getCircle(selectedIds[0]);
    if (!selectedCircle) return false;
    
    return selectedCircle.type === 'group' && selectedCircle.roilMode === 'on';
});

        // Get circles specific to this viewer
        const viewerSpecificCircles = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return [];
            return dataStore.getCirclesForViewer(props.viewerId);
        });

        // Get selected circles that belong to this viewer
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

        // Circle-specific control visibility based on viewer selection
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

        // Reel in button visibility - only when exactly one circle is selected
        const shouldShowReelInButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            return viewerSelectedCircles.value.length === 1 && !showUnreelButton.value;
        });

        // Unreel button visibility - only when unreel is available
        const shouldShowUnreelButton = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            if (viewerSelectedCircles.value.length !== 1) return false;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            return showUnreelButton.value && reelInSystem.canUnreel(selectedCircleId);
        });

        // Check if the selected circle has any explicit connections
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
                dataStore.triggerConnectionUpdateIfActive();
            },
            // onAnimationComplete
            (circleId, groupId, isUnreeling = false) => {
                if (isUnreeling) {
                    dataStore.clearCircleBelongsTo(circleId);
                    if (groupId) {
                        dataStore.setCircleBelongsTo(circleId, groupId);
                    }
                } else {
                    if (groupId) {
                        dataStore.setCircleBelongsTo(circleId, groupId);
                    }
                }
                
                if (!reelInSystem.isAnimating()) {
                    isReelInAnimating.value = false;
                }
            }
        );

        // Menu visibility computeds
        const shouldShowMembersMenu = computed(() => {
            if (props.entityType !== 'circle' || !props.viewerId) return false;
            
            const selectedIds = viewerSelectedCircles.value;
            if (selectedIds.length !== 1) return false;
            
            const selectedCircle = dataStore.getCircle(selectedIds[0]);
            if (!selectedCircle) return false;
            
            return selectedCircle.type === 'group' && selectedCircle.roilMode === 'on';
        });

        const shouldShowArrowMenu = computed(() => {
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

        const shouldShowCharacteristicsMenu = computed(() => {
            return shouldShowCircleControls.value && shouldShowCircleCharacteristicControls.value;
        });

        const shouldShowPropertiesMenu = computed(() => {
            if (!characteristics || !props.viewerId) return false;
            if (viewerSelectedCircles.value.length === 0) return false;
            return characteristics.cycleableProperties?.value?.length > 0;
        });

        // Check viewer-specific selection for R button - show when NO circles selected in this viewer
const shouldShowRButton = computed(() => {
    if (props.entityType !== 'circle' || !props.viewerId) return false;
    
    // Don't show if any circles are selected
    if (viewerSelectedCircles.value.length > 0) return false;
    
    // Don't show if any roil type circles already exist in this viewer
    const hasRoilCircles = viewerSpecificCircles.value.some(circle => 
        (circle.type === 'group' && circle.roilMode === 'on') || 
        (circle.type === 'glow')
    );
    
    return !hasRoilCircles;
});

        // Menu toggle functions
        const toggleMenu = (menuName) => {
            if (activeMenu.value === menuName) {
                activeMenu.value = null; // Close if already open
            } else {
                activeMenu.value = menuName; // Open this menu, close others
            }
        };

        // Menu item handlers that prevent menu closing
        const handleMenuItemClick = (event, handler, ...args) => {
            event.stopPropagation(); // Prevent event from bubbling up
            event.preventDefault(); // Prevent any default behavior
            handler(...args);
        };

        // Handle reel in button click
        const handleReelInClick = () => {
            if (!shouldShowReelInButton.value || isReelInAnimating.value) return;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            const targetCircle = dataStore.getCircle(selectedCircleId);
            
            if (!targetCircle) return;
            
            const connections = getConnectionsForCircle(selectedCircleId);
            
            if (connections.length === 0) return;
            
            const circlesToReel = connections
                .map(({ targetCircleId }) => dataStore.getCircle(targetCircleId))
                .filter(circle => circle !== null);
            
            if (circlesToReel.length === 0) return;
            
            isReelInAnimating.value = true;
            reelInSystem.reelInCircles(targetCircle, circlesToReel);
            
            setTimeout(() => {
                showUnreelButton.value = true;
            }, 100);
        };

        // Handle unreel button click
        const handleUnreelClick = () => {
            if (!shouldShowUnreelButton.value || isReelInAnimating.value) return;
            
            const selectedCircleId = viewerSelectedCircles.value[0];
            if (!reelInSystem.canUnreel(selectedCircleId)) return;
            
            const unreelableCircleIds = reelInSystem.getUnreelableCircles();
            const circlesToUnreel = unreelableCircleIds
                .map(id => dataStore.getCircle(id))
                .filter(circle => circle !== null);
            
            if (circlesToUnreel.length === 0) return;
            
            isReelInAnimating.value = true;
            reelInSystem.unreelCircles(circlesToUnreel);
            
            setTimeout(() => {
                showUnreelButton.value = false;
            }, 100);
        };

        // Button handlers
        const handleAddClick = () => {
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'normal' });
        };

        const handleAddRoilGroupClick = () => {
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'roilGroup' });
        };

        // Generic roil member creation handler
        const handleAddRoilMemberClick = (memberType) => {
            if (props.entityType === 'circle' && props.viewerId) {
                const documentId = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (!documentId) {
                    const newDoc = dataStore.createCircleDocument();
                    dataStore.setCircleDocumentForViewer(props.viewerId, newDoc.id);
                }
            }
            emit('add-entity', { entityType: 'roilMember', memberType: memberType });
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

        // Watch for selection changes to clear unreel data and close menus
        watch(viewerSelectedCircles, (newSelection, oldSelection) => {
            if (JSON.stringify(newSelection) !== JSON.stringify(oldSelection)) {
                reelInSystem.clearUnreelData();
                showUnreelButton.value = false;
                activeMenu.value = null; // Close any open menu when selection changes
            }
        });

        return {
            shouldShowControls,
            shouldShowRoilComposureControl,
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
            handleAddRoilMemberClick,
            handleMakeAngryClick,
            handleMakeNormalClick,
            
            // Menu state
            activeMenu,
            membersMenuRef,
            arrowMenuRef,
            characteristicsMenuRef,
            propertiesMenuRef,
            toggleMenu,
            shouldShowMembersMenu,
            shouldShowArrowMenu,
            shouldShowCharacteristicsMenu,
            shouldShowPropertiesMenu,
            
            // Reel in functionality
            shouldShowReelInButton,
            shouldShowUnreelButton,
            hasConnectedCircles,
            handleReelInClick,
            handleUnreelClick,
            showUnreelButton,
            
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
            CONTROL_REGISTRY,
            
            // Expose the new handler
            handleMenuItemClick,
            roilAddMemberControlsConfig,
            getBuoyancyIcon,
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
            <!-- Basic Entity Creation Controls (Always Visible) -->
            <div 
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

            <!-- Consolidated Menu Buttons -->
            
            <!-- Members Menu (M) -->
            <div 
                v-if="shouldShowMembersMenu"
                class="characteristic-control entity-menu-button"
                :class="{ active: activeMenu === 'members' }"
                @click="toggleMenu('members')"
                ref="membersMenuRef"
                title="Roil Member Controls"
            >
                M
                <div 
                    v-if="activeMenu === 'members'"
                    class="entity-popup-menu"
                    @click.stop
                >
                    <div 
                        v-for="(states, memberType) in roilAddMemberControlsConfig"
                        :key="memberType"
                        class="characteristic-control roil-member-control"
                        @click="(event) => handleMenuItemClick(event, handleAddRoilMemberClick, memberType)"
                        :title="'Add ' + memberType.charAt(0).toUpperCase() + memberType.slice(1) + ' Member'"
                    >
                        <div 
                            v-for="(state, index) in states"
                            :key="index"
                            class="roil-member-state-swatch"
                            :style="{ 
                                backgroundColor: state.color, 
                                top: (4 * index) + 'px', 
                                left: (-4 * index) + 'px', 
                                transform: 'translate(' + ((states.length - 1) * 2) + 'px, ' + ((states.length - 1) * -2) + 'px)' 
                            }"
                        >
                            {{ getBuoyancyIcon(state.buoyancy) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Arrow Actions Menu (A) -->
            <!--div 
                v-if="shouldShowArrowMenu"
                class="characteristic-control entity-menu-button"
                :class="{ active: activeMenu === 'arrows' }"
                @click="toggleMenu('arrows')"
                ref="arrowMenuRef"
                title="Arrow Action Controls"
            >
                A
                <div 
                    v-if="activeMenu === 'arrows'"
                    class="entity-popup-menu"
                    @click.stop
                >
                    <div 
                        class="characteristic-control entity-add-button"
                        @click="(event) => handleMenuItemClick(event, handleMakeAngryClick)"
                        title="Make Selected Angry"
                    >↑</div>
                    
                    <div 
                        class="characteristic-control entity-add-button"
                        @click="(event) => handleMenuItemClick(event, handleMakeNormalClick)"
                        title="Make Selected Normal"
                    >↓</div>
                </div>
            </div-->

            <!-- Circle Characteristics Menu (C) -->
            <div 
                v-if="shouldShowCharacteristicsMenu"
                class="characteristic-control entity-menu-button"
                :class="{ active: activeMenu === 'characteristics' }"
                @click="toggleMenu('characteristics')"
                ref="characteristicsMenuRef"
                title="Circle Characteristics"
            >
                C
                <div 
                    v-if="activeMenu === 'characteristics'"
                    class="entity-popup-menu"
                    @click.stop
                >
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
                </div>
            </div>

            <!-- Properties Menu (P) -->
            <div 
                v-if="shouldShowPropertiesMenu"
                class="characteristic-control entity-menu-button"
                :class="{ active: activeMenu === 'properties' }"
                @click="toggleMenu('properties')"
                ref="propertiesMenuRef"
                title="Cycleable Properties"
            >
                P
                <div 
                    v-if="activeMenu === 'properties'"
                    class="entity-popup-menu"
                    @click.stop
                >
                    <!-- Dynamic Cycleable Property Controls -->
                    <CBCyclePropertyControl 
                        v-for="propertyName in cycleableProperties"
                        :key="propertyName"
                        :property-name="propertyName"
                        :property-value="getPropertyValue(propertyName)"
                        @cycle="handlePropertyCycle(propertyName)"
                    />
                </div>
            </div>

            <!-- Top-Level Controls (Always Visible When Applicable) -->

            <!-- States Control -->
            <CBStatesControl 
                v-if="shouldShowStatesControl"
                :selectedCircle="selectedCircle"
                @toggle="toggleStatesPicker"
            />

            <!-- Roil Composure Control -->
            <CBCyclePropertyControl 
                v-if="shouldShowRoilComposureControl"
                property-name="roilComposure"
                :property-value="getPropertyValue('roilComposure')"
                @cycle="handlePropertyCycle('roilComposure')"
            />

            <!-- Reel & Unreel Buttons -->
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
                    🎣<span class="unreel-x">⌘</span>
                </span>
            </div>

            <!-- Reference Controls (Keep as-is) -->
            <CBJumpToReferenceControl 
                v-if="shouldShowJumpToReferenceControl"
                @jump-to-reference="handleJumpToReference"
            />

            <BreakReferenceControl 
                v-if="shouldShowBreakReferenceControl"
                @break-reference="handleBreakReference"
            />

            <!-- Explicit Connection Controls (Keep as-is) -->
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
