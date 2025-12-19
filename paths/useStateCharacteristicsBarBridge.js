// useStateCharacteristicsBarBridge.js - Bridge for state-level properties
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { colorFamilies } from './colorFamilies.js';

export function useStateCharacteristicsBarBridge(selectedCircle, updateStatePropertyFn) {
  // Picker state management - only for the controls we need in states modal
  const pickerStates = {
    color: ref(false),
    circleEmoji: ref(false),
    demandEmoji: ref(false),
    causeEmoji: ref(false)
  };

  // Track which state is currently being edited
  const currentEditingStateID = ref(null);
  const currentEditingProperty = ref(null);

  // Get current state object being edited
  const currentEditingState = computed(() => {
    if (!selectedCircle.value || !currentEditingStateID.value) return null;
    return selectedCircle.value.states[currentEditingStateID.value];
  });

  // Picker management
  const closeAllPickers = () => {
    Object.keys(pickerStates).forEach(name => {
      pickerStates[name].value = false;
    });
    currentEditingStateID.value = null;
    currentEditingProperty.value = null;
  };

  const openPicker = (pickerName, stateID, property) => {
    closeAllPickers();
    currentEditingStateID.value = stateID;
    currentEditingProperty.value = property;
    if (pickerStates[pickerName]) {
      pickerStates[pickerName].value = true;
    }
  };

  const closePicker = (pickerName) => {
    if (pickerStates[pickerName]) {
      pickerStates[pickerName].value = false;
    }
    currentEditingStateID.value = null;
    currentEditingProperty.value = null;
  };

  // Specific picker openers
  const openColorPicker = (stateID) => {
    openPicker('color', stateID, 'color');
  };

  const openCircleEmojiPicker = (stateID) => {
    openPicker('circleEmoji', stateID, 'circleEmoji');
  };

  const openDemandEmojiPicker = (stateID) => {
    openPicker('demandEmoji', stateID, 'demandEmoji');
  };

  const openCauseEmojiPicker = (stateID) => {
    openPicker('causeEmoji', stateID, 'causeEmoji');
  };

  // Value getters for current editing state
  const getCurrentEditingValue = (property) => {
    const state = currentEditingState.value;
    if (!state) return null;
    return state[property];
  };

  // Selection checkers for picker modals
  const isColorSelected = (color) => {
    return getCurrentEditingValue('color') === color;
  };

  const getCurrentEmoji = (property) => {
    const value = getCurrentEditingValue(property);
    return value || '';
  };

  // Handlers for picker selections
  const handleColorSelect = (color, isCtrlClick) => {
    if (currentEditingStateID.value != null && updateStatePropertyFn) {
      updateStatePropertyFn(currentEditingStateID.value, 'color', color);
    }
    if (!isCtrlClick) closePicker('color');
  };

  const handleCircleEmojiSelect = (emoji) => {
    if (currentEditingStateID.value != null && updateStatePropertyFn) {
      const emojiValue = typeof emoji === 'string' ? emoji : emoji.emoji || emoji;
      updateStatePropertyFn(currentEditingStateID.value, 'circleEmoji', emojiValue);
    }
    closePicker('circleEmoji');
  };

  const handleDemandEmojiSelect = (emoji) => {
    if (currentEditingStateID.value != null && updateStatePropertyFn) {
      const emojiValue = typeof emoji === 'string' ? emoji : emoji.emoji || emoji;
      updateStatePropertyFn(currentEditingStateID.value, 'demandEmoji', emojiValue);
    }
    closePicker('demandEmoji');
  };

  const handleCauseEmojiSelect = (emoji) => {
    if (currentEditingStateID.value != null && updateStatePropertyFn) {
      const emojiValue = typeof emoji === 'string' ? emoji : emoji.emoji || emoji;
      updateStatePropertyFn(currentEditingStateID.value, 'causeEmoji', emojiValue);
    }
    closePicker('causeEmoji');
  };

  // Close picker action (for consistency with main bridge)
  const closePickerAction = (pickerName) => {
    closePicker(pickerName);
  };

  // Handle escape key and click outside
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeAllPickers();
    }
  };

  const handleGlobalClick = (e) => {
    // Close pickers when clicking outside, similar to main bridge behavior
    requestAnimationFrame(() => {
      const clickedModal = e.target.closest('.app-global-picker-modal');
      const clickedControl = e.target.closest('.characteristic-control');
      
      if (!clickedModal && !clickedControl) {
        Object.keys(pickerStates).forEach(pickerName => {
          if (pickerStates[pickerName].value) {
            pickerStates[pickerName].value = false;
          }
        });
        currentEditingStateID.value = null;
        currentEditingProperty.value = null;
      }
    });
  };

  onMounted(() => {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick);
    document.removeEventListener('keydown', handleKeydown);
  });

  return {
    // Current editing state data
    currentEditingState,
    currentEditingStateID: computed(() => currentEditingStateID.value),
    currentEditingProperty: computed(() => currentEditingProperty.value),
    
    // Picker state accessors
    isColorPickerOpen: computed(() => pickerStates.color.value),
    isCircleEmojiPickerOpen: computed(() => pickerStates.circleEmoji.value),
    isDemandEmojiPickerOpen: computed(() => pickerStates.demandEmoji.value),
    isCauseEmojiPickerOpen: computed(() => pickerStates.causeEmoji.value),
    
    // Picker openers
    openColorPicker,
    openCircleEmojiPicker,
    openDemandEmojiPicker,
    openCauseEmojiPicker,
    
    // Generic picker controls
    closePicker,
    closeAllPickers,
    closePickerAction,
    
    // Selection handlers
    handleColorSelect,
    handleCircleEmojiSelect,
    handleDemandEmojiSelect,
    handleCauseEmojiSelect,
    
    // Value getters for modals
    getCurrentEditingValue,
    getCurrentEmoji,
    isColorSelected,
    
    // Data sources
    colorFamilies,
  };
}
