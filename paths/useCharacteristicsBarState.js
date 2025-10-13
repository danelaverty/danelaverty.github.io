// useCharacteristicsBarState.js - Manages computed state for the characteristics bar
import { computed, ref, watchEffect } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { CYCLE_PROPERTY_CONFIGS, getPropertyValues, getPropertyDefault } from './CBCyclePropertyConfigs.js';

export function useCharacteristicsBarState(dataHooks, pickerHooks) {
  const dataStore = useDataStore();

  // Template refs for direct DOM access
  const typeDisplayRefTemplate = ref(null);
  const circleEmojiDisplayRefTemplate = ref(null);
  const colorDisplayRefTemplate = ref(null);
  const energyDisplayRefTemplate = ref(null);
  const emojiDisplayRefTemplate = ref(null);
  const typePickerRefTemplate = ref(null);
  const circleEmojiPickerRefTemplate = ref(null);
  const colorPickerRefTemplate = ref(null);
  const energyPickerRefTemplate = ref(null);
  const emojiPickerRefTemplate = ref(null);

  // Watch for template ref assignments and update picker hooks
  watchEffect(() => {
    if (typeDisplayRefTemplate.value) {
      pickerHooks.typeDisplayRef.value = typeDisplayRefTemplate.value.$el || typeDisplayRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (circleEmojiDisplayRefTemplate.value) {
      pickerHooks.circleEmojiDisplayRef.value = circleEmojiDisplayRefTemplate.value.$el || circleEmojiDisplayRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (colorDisplayRefTemplate.value) {
      pickerHooks.colorDisplayRef.value = colorDisplayRefTemplate.value.$el || colorDisplayRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (energyDisplayRefTemplate.value) {
      pickerHooks.energyDisplayRef.value = energyDisplayRefTemplate.value.$el || energyDisplayRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (emojiDisplayRefTemplate.value) {
      pickerHooks.emojiDisplayRef.value = emojiDisplayRefTemplate.value.$el || emojiDisplayRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (typePickerRefTemplate.value) {
      pickerHooks.typePickerRef.value = typePickerRefTemplate.value.$el || typePickerRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (circleEmojiPickerRefTemplate.value) {
      pickerHooks.circleEmojiPickerRef.value = circleEmojiPickerRefTemplate.value.$el || circleEmojiPickerRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (colorPickerRefTemplate.value) {
      pickerHooks.colorPickerRef.value = colorPickerRefTemplate.value.$el || colorPickerRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (energyPickerRefTemplate.value) {
      pickerHooks.energyPickerRef.value = energyPickerRefTemplate.value.$el || energyPickerRefTemplate.value;
    }
  });

  watchEffect(() => {
    if (emojiPickerRefTemplate.value) {
      pickerHooks.emojiPickerRef.value = emojiPickerRefTemplate.value.$el || emojiPickerRefTemplate.value;
    }
  });

  const hasMultipleCirclesSelected = computed(() => {
    return dataStore.hasMultipleCirclesSelected();
  });

  // Dynamically get all cycleable properties from config
  const cycleableProperties = computed(() => {
    const allProperties = Object.keys(CYCLE_PROPERTY_CONFIGS);
    
    // Filter properties based on context (single vs multi-selection, circle type, etc.)
    return allProperties.filter(propertyName => {
      // Add any property-specific visibility logic here
      // For now, return all properties - you can add conditions as needed
      
      // Example: only show sizeMode for group circles
      if (propertyName === 'sizeMode') {
        if (hasMultipleCirclesSelected.value) {
          // For multi-selection, check if all selected circles are groups
          const selectedIds = dataStore.getSelectedCircles();
          return selectedIds.every(id => {
            const circle = dataStore.getCircle(id);
            return circle && circle.type === 'group';
          });
        } else if (dataHooks.selectedCircle.value) {
          return dataHooks.selectedCircle.value.type === 'group';
        }
        return false;
      }
      
      // Add more property-specific visibility rules here as needed
      // if (propertyName === 'someOtherProperty') { ... }
      
      return true; // Show by default
    });
  });

  // Generic function to get property value for single or multiple selection
  const getPropertyValue = (propertyName) => {
    const defaultValue = getPropertyDefault(propertyName);
    
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, show the most common value
      const selectedIds = dataStore.getSelectedCircles();
      const values = selectedIds.map(id => {
        const circle = dataStore.getCircle(id);
        return circle?.[propertyName] ?? defaultValue;
      });

      // Count occurrences and return most common
      const counts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).reduce((a, b) => 
        counts[a[0]] > counts[b[0]] ? a : b
      )[0];
    } else if (dataHooks.selectedCircle.value) {
      return dataHooks.selectedCircle.value[propertyName] ?? defaultValue;
    }
    
    return defaultValue;
  };

  const selectedExplicitConnection = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      const selectedIds = dataStore.getSelectedCircles();
      if (selectedIds.length === 2) {
        // Check if there's an explicit connection between these two circles
        return dataStore.getExplicitConnectionBetweenEntities(
          selectedIds[0], 'circle',
          selectedIds[1], 'circle'
        );
      }
    }
    return null;
  });

  const shouldShowExplicitConnectionControls = computed(() => {
    return selectedExplicitConnection.value !== null;
  });

  const connectionDirectionality = computed(() => {
    return selectedExplicitConnection.value?.directionality || 'none';
  });

  const isVisible = computed(() => {
    const selectedCircles = dataStore.getSelectedCircles();
    return selectedCircles.length >= 1;
  });

  const getSelectedCircleObjects = computed(() => {
    const selectedIds = dataStore.getSelectedCircles();
    return selectedIds.map(id => dataStore.getCircle(id)).filter(Boolean);
  });

  // Extract specific values we need
  const { emojiAttributes } = dataHooks;

  const causeEmoji = computed(() => {
    return emojiAttributes.value.find(attr => attr.key === 'cause') || emojiAttributes.value[0];
  });

  const getCurrentCircleEmoji = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, use the first circle's emoji as reference
      if (getSelectedCircleObjects.value.length > 0) {
        return getSelectedCircleObjects.value[0].emoji || '';
      }
    } else if (dataHooks.selectedCircle.value) {
      return dataHooks.selectedCircle.value.emoji || '';
    }
    return '';
  });
  
  // Check if the selected circle is a reference circle (only applies to single selection)
  const isReferenceCircle = computed(() => {
    return dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.referenceID !== null;
  });
  
  // Check if circle emoji picker should be visible
  const isCircleEmojiPickerVisible = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, always show circle emoji control
      return true;
    }
    
    // For single selection, check type and reference status
    return dataHooks.selectedCircle.value && 
           (['emoji'].indexOf(dataHooks.selectedCircle.value.type) > -1) && 
           !isReferenceCircle.value;
  });

  const shouldShowEmojiControls = computed(() => {
    return !hasMultipleCirclesSelected.value;
  });

  const shouldShowCircleCharacteristicControls = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      return true; // Always show for multiple selection
    }
    // For single selection, hide if it's a reference circle
    return !isReferenceCircle.value;
  });

  const shouldShowJumpToReferenceControl = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, check if ANY selected circle is a reference
      const selectedIds = dataStore.getSelectedCircles();
      return selectedIds.some(id => {
        const circle = dataStore.getCircle(id);
        return circle && circle.referenceID !== null;
      });
    }
    // For single selection, show if it's a reference circle
    return isReferenceCircle.value;
  });

  const shouldShowBreakReferenceControl = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, check if ANY selected circle is a reference
      const selectedIds = dataStore.getSelectedCircles();
      return selectedIds.some(id => {
        const circle = dataStore.getCircle(id);
        return circle && circle.referenceID !== null;
      });
    }
    // For single selection, show if it's a reference circle
    return isReferenceCircle.value;
  });

  return {
    // Template refs
    typeDisplayRefTemplate,
    circleEmojiDisplayRefTemplate,
    colorDisplayRefTemplate,
    energyDisplayRefTemplate,
    emojiDisplayRefTemplate,
    typePickerRefTemplate,
    circleEmojiPickerRefTemplate,
    colorPickerRefTemplate,
    energyPickerRefTemplate,
    emojiPickerRefTemplate,
    
    // Computed state
    hasMultipleCirclesSelected,
    cycleableProperties,
    getPropertyValue,
    selectedExplicitConnection,
    shouldShowExplicitConnectionControls,
    connectionDirectionality,
    isVisible,
    getSelectedCircleObjects,
    causeEmoji,
    getCurrentCircleEmoji,
    isReferenceCircle,
    isCircleEmojiPickerVisible,
    shouldShowEmojiControls,
    shouldShowCircleCharacteristicControls,
    shouldShowJumpToReferenceControl,
    shouldShowBreakReferenceControl,
  };
}
