import { computed, ref, watch } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { getPropertyValues } from './CBCyclePropertyConfigs.js';
import { colorFamilies } from './colorFamilies.js';
import { injectComponentStyles } from './styleUtils.js';
import { useStateCharacteristicsBarBridge } from './useStateCharacteristicsBarBridge.js';

const statesModalStyles = `
.characteristic-control.action-button.set-flipped {
    background: #9C27B0;
    border-color: #7B1FA2;
    color: white;
}

.characteristic-control.action-button.set-flipped:hover {
    background: #AD42C4;
}

.characteristic-control.action-button.set-flipped.is-flipped {
    background: #E91E63;
    border-color: #C2185B;
}
.states-modal {
    background: #2a2a2a;
    border: 1px solid #666;
    color: white;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 8999 !important; /* Lower than picker modals so they can open over this */
}

.states-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #666;
    background: #333;
}

.states-modal-title {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
}

.states-modal-content {
    flex: 1;
    overflow-y: auto;
}

.states-table {
    width: 100%;
    border-collapse: collapse;
}

.states-table th {
    background: #333;
    color: #ccc;
    padding: 2px;
    text-align: left;
    vertical-align: top;
    border: 1px solid #666;
    font-size: 9px;
}

.states-table td {
    padding: 2px;
    border: 1px solid #666;
    vertical-align: middle;
    text-align: center;
}

.states-table tr.current-state {
    background: rgba(0, 122, 204, 0.1);
}

.states-table tr.current-state td {
    border-color: #007acc;
}

.states-table tr:hover:not(.add-state-row) {
    background: rgba(255, 255, 255, 0.05);
}

.state-control {
    width: 100%;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.state-name-input {
    width: 100%;
    background: #444;
    border: 1px solid #666;
    border-radius: 4px;
    color: white;
    padding: 6px 8px;
    font-size: 9px;
}

.state-name-input:focus {
    outline: none;
    border-color: #007acc;
    background: #555;
}

/* Trigger angle dropdown styling */
.trigger-angle-select {
    width: 100%;
    background: #444;
    border: 1px solid #666;
    border-radius: 4px;
    color: white;
    padding: 4px;
    font-size: 9px;
}

.trigger-angle-select:focus {
    outline: none;
    border-color: #007acc;
    background: #555;
}

/* Action button styling */
.characteristic-control.action-button {
    width: 24px;
    height: 24px;
    font-size: 12px;
}

.characteristic-control.action-button.activate {
    background: #007acc;
    border-color: #0066aa;
    color: white;
}

.characteristic-control.action-button.activate:hover {
    background: #0088dd;
}

.characteristic-control.action-button.delete:hover {
    background: #d32f2f;
    border-color: #b71c1c;
    color: white;
}

.characteristic-control.action-button:disabled {
    background: #2a2a2a;
    border-color: #666;
    color: #666;
    cursor: not-allowed;
}

/* Add button styling */
.characteristic-control.add-state-button {
    background: #4CAF50;
    border: 1px solid #45a049;
    color: white;
    font-size: 16px;
    font-weight: bold;
}

.characteristic-control.add-state-button:hover {
    background: #45a049;
}

/* Action container styling */
.state-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
}
`;

injectComponentStyles('states-modal', statesModalStyles);

export const CBStatesPickerModal = {
    props: {
        selectedCircle: {
            type: Object,
            required: true
        }
    },

    emits: ['close', 'picker-state-change'],

    setup(props, { emit }) {
        const dataStore = useDataStore();

        // Create a computed ref for the selected circle to pass to the bridge
        const selectedCircleRef = computed(() => props.selectedCircle);

        // Trigger angle options
        const triggerAngleOptions = [
            { label: '-', value: null },
            { label: '12:00', value: 0 },
            { label: '3:00', value: 90 },
            { label: '6:00', value: 180 },
            { label: '9:00', value: 270 }
        ];

        // State update function to pass to the bridge
        const updateStateProperty = (stateID, property, value) => {
            const currentStates = { ...props.selectedCircle.states };
            currentStates[stateID] = {
                ...currentStates[stateID],
                [property]: value
            };

            // Update the states and trigger state synchronization
            dataStore.updateCircle(props.selectedCircle.id, { states: currentStates });
        };

        // Initialize the state-specific characteristics bridge
        const statesBridge = useStateCharacteristicsBarBridge(selectedCircleRef, updateStateProperty);

        // Emit picker state changes to parent so it can render global modals
        const emitPickerState = () => {
            emit('picker-state-change', {
                isColorPickerOpen: statesBridge.isColorPickerOpen.value,
                isDemandEmojiPickerOpen: statesBridge.isDemandEmojiPickerOpen.value,
                isCauseEmojiPickerOpen: statesBridge.isCauseEmojiPickerOpen.value,
                currentEditingStateID: statesBridge.currentEditingStateID.value,
                currentEditingProperty: statesBridge.currentEditingProperty.value,
                // Include handler functions
                handleColorSelect: statesBridge.handleColorSelect,
                handleDemandEmojiSelect: statesBridge.handleDemandEmojiSelect,
                handleCauseEmojiSelect: statesBridge.handleCauseEmojiSelect,
                closePickerAction: statesBridge.closePickerAction,
                isColorSelected: statesBridge.isColorSelected,
                getCurrentEmoji: statesBridge.getCurrentEmoji,
                colorFamilies: statesBridge.colorFamilies
            });
        };

        // Watch for picker state changes and emit them
        watch([
            statesBridge.isColorPickerOpen,
            statesBridge.isDemandEmojiPickerOpen,
            statesBridge.isCauseEmojiPickerOpen
        ], () => {
            emitPickerState();
        }, { immediate: true });

        const sortedStates = computed(() => {
            if (!props.selectedCircle || !props.selectedCircle.states) return [];
            
            return Object.values(props.selectedCircle.states)
                .sort((a, b) => a.stateID - b.stateID);
        });

        const currentStateID = computed(() => {
            return props.selectedCircle?.currentStateID ?? 0;
        });

        const canDeleteStates = computed(() => {
            return sortedStates.value.length > 1;
        });

        const buoyancyValues = computed(() => {
            return getPropertyValues('buoyancy');
        });

        const buoyancyIcons = {
            'normal': '↕',
            'buoyant': '↑',
            'antibuoyant': '↓'
        };

        const addNewState = () => {
            const circle = props.selectedCircle;
            const newStateID = circle.nextStateID;
            const newStates = { ...circle.states };
            
            newStates[newStateID] = {
                stateID: newStateID,
                name: '???',
                color: '#B3B3B3',
                demandEmoji: null,
                causeEmoji: null,
                buoyancy: 'normal',
                triggerAngle: null  // New states default to no trigger
            };

            dataStore.updateCircle(circle.id, {
                states: newStates,
                nextStateID: newStateID + 1
            });
        };

        const deleteState = (stateID) => {
            if (!canDeleteStates.value) return;

            const circle = props.selectedCircle;
            const newStates = { ...circle.states };
            delete newStates[stateID];

            const updates = { states: newStates };

            // If we're deleting the current state, switch to the lowest available state ID
            if (circle.currentStateID === stateID) {
                const remainingStateIDs = Object.keys(newStates).map(id => parseInt(id));
                updates.currentStateID = Math.min(...remainingStateIDs);
            }

            dataStore.updateCircle(circle.id, updates);
        };

        const activateState = (stateID) => {
            dataStore.updateCircle(props.selectedCircle.id, { currentStateID: stateID });
        };

        const cycleBuoyancy = (stateID) => {
            const currentState = props.selectedCircle.states[stateID];
            const currentIndex = buoyancyValues.value.indexOf(currentState.buoyancy);
            const nextIndex = (currentIndex + 1) % buoyancyValues.value.length;
            const newValue = buoyancyValues.value[nextIndex];
            
            updateStateProperty(stateID, 'buoyancy', newValue);
        };

        const updateTriggerAngle = (stateID, newValue) => {
            // Convert string to number or null
            const triggerAngle = newValue === 'null' || newValue === null ? null : parseInt(newValue);
            updateStateProperty(stateID, 'triggerAngle', triggerAngle);
        };

        const getTriggerAngleLabel = (triggerAngle) => {
            const option = triggerAngleOptions.find(opt => opt.value === triggerAngle);
            return option ? option.label : '-';
        };

        return {
            sortedStates,
            currentStateID,
            canDeleteStates,
            buoyancyValues,
            buoyancyIcons,
            colorFamilies,
            triggerAngleOptions,
            updateStateProperty,
            addNewState,
            deleteState,
            activateState,
            cycleBuoyancy,
            updateTriggerAngle,
            getTriggerAngleLabel,

            // Expose all the bridge functionality
            ...statesBridge
        };
    },

    template: `
        <div class="states-modal">
            <div class="states-modal-content">
                <table class="states-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Color</th>
                            <th>Cause</th>
                            <th>Demand</th>
                            <th>Buoyancy</th>
                            <th>Trigger</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Existing states -->
                        <tr 
                            v-for="state in sortedStates" 
                            :key="state.stateID"
                            :class="{ 'current-state': state.stateID === currentStateID }"
                        >
                            <!-- Name -->
                            <td>
                                <div class="state-control">
                                    <input 
                                        class="state-name-input"
                                        :value="state.name"
                                        @input="updateStateProperty(state.stateID, 'name', $event.target.value)"
                                        placeholder="Enter name..."
                                    />
                                </div>
                            </td>
                            
                            <!-- Color -->
                            <td>
                                <div class="state-control">
                                    <div 
                                        class="characteristic-control"
                                        @click="openColorPicker(state.stateID)"
                                        :title="'Color: ' + state.color"
                                    >
                                        <div class="color-display" style="background-color: transparent; border: none; cursor: pointer;">
                                            <div class="color-swatch-mini" :style="{ backgroundColor: state.color }"></div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Cause Emoji -->
                            <td>
                                <div class="state-control">
                                    <div 
                                        class="characteristic-control"
                                        @click="openCauseEmojiPicker(state.stateID)"
                                        :title="state.causeEmoji ? 'Cause Emoji: ' + state.causeEmoji : 'No cause emoji'"
                                    >
                                        <div :class="['emoji-display', 'circle-emoji-display-control', { 'picker-open': false }]">
                                            <div style="color: white;" class="circle-emoji-display">{{ state.causeEmoji || '-' }}</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Demand Emoji -->
                            <td>
                                <div class="state-control">
                                    <div 
                                        class="characteristic-control"
                                        @click="openDemandEmojiPicker(state.stateID)"
                                        :title="state.demandEmoji ? 'Demand Emoji: ' + state.demandEmoji : 'No demand emoji'"
                                    >
                                        <div :class="['emoji-display', 'circle-emoji-display-control', { 'picker-open': false }]">
                                            <div style="color: white;" class="circle-emoji-display">{{ state.demandEmoji || '-' }}</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Buoyancy -->
                            <td>
                                <div class="state-control">
                                    <div 
                                        class="characteristic-control"
                                        @click="cycleBuoyancy(state.stateID)"
                                        :title="'Buoyancy: ' + state.buoyancy"
                                    >
                                        <div :class="['buoyancy-display', 'buoyancy-' + state.buoyancy]">
                                            <div class="buoyancy-icon">{{ buoyancyIcons[state.buoyancy] || '?' }}</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- NEW: Trigger Angle -->
                            <td>
                                <div class="state-control">
                                    <select 
                                        class="trigger-angle-select"
                                        :value="state.triggerAngle"
                                        @change="updateTriggerAngle(state.stateID, $event.target.value)"
                                        :title="'Trigger at angle: ' + getTriggerAngleLabel(state.triggerAngle)"
                                    >
                                        <option 
                                            v-for="option in triggerAngleOptions" 
                                            :key="option.label"
                                            :value="option.value"
                                        >
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>
                            </td>
                            
                            <!-- Actions -->
                            <td>
                                <div class="state-actions">
                                    <button 
                                        v-if="state.stateID !== currentStateID"
                                        :class="['characteristic-control', 'action-button', 'activate']"
                                        @click="activateState(state.stateID)"
                                        title="Activate this state"
                                    >
                                        ●
                                    </button>
                                    <div 
                                        v-else 
                                        :class="['characteristic-control', 'action-button', 'activate']" 
                                        title="Current active state"
                                        style="cursor: default;"
                                    >●</div>
                                    
                                    <button 
                                        :class="['characteristic-control', 'action-button', 'delete']"
                                        :disabled="!canDeleteStates"
                                        @click="deleteState(state.stateID)"
                                        title="Delete this state"
                                    >
                                        ×
                                    </button>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Add new state row -->
                        <tr class="add-state-row">
                            <td colspan="8">
                                <div class="state-control">
                                    <button 
                                        class="characteristic-control add-state-button" 
                                        @click="addNewState"
                                        title="Add new state"
                                    >
                                        +
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};
