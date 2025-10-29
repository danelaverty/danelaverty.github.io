// useCharacteristicsBarState.js - Manages computed state for the characteristics bar
import { computed, ref, watchEffect } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { CYCLE_PROPERTY_CONFIGS, getPropertyValues, getPropertyDefault, getVisiblePropertiesForCircles } from './CBCyclePropertyConfigs.js';

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

  const getSelectedCircleObjects = computed(() => {
    const selectedIds = dataStore.getSelectedCircles();
    return selectedIds.map(id => dataStore.getCircle(id)).filter(Boolean);
  });

  // UPDATED: Dynamically get cycleable properties using the new displayIf system
  const cycleableProperties = computed(() => {
    const selectedCircles = getSelectedCircleObjects.value;
    
    // If no circles selected, return empty array
    if (selectedCircles.length === 0) {
      return [];
    }
    
    // Get properties visible for these circles (all selected circles must match displayIf conditions)
    return getVisiblePropertiesForCircles(selectedCircles);
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
  
  // UPDATED: Check if the selected circle is a circle reference (only applies to single selection)
  const isReferenceCircle = computed(() => {
    // Only check referenceID, not documentReferenceID
    return dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.referenceID !== null;
  });
  
  // NEW: Check if the selected circle is a document reference circle
  const isDocumentReferenceCircle = computed(() => {
    return dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.documentReferenceID !== null;
  });
  
  // Check if circle emoji picker should be visible
  const isCircleEmojiPickerVisible = computed(() => {
    const selectedCircleObjects = getSelectedCircleObjects.value;
    
    // If no circles selected, don't show
    if (selectedCircleObjects.length === 0) {
      return false;
    }
    
    // Check if ALL selected circles are emoji type and not reference circles
    return selectedCircleObjects.every(circle => {
      const isEmojiType = circle.type === 'emoji';
      const isReference = circle.referenceID !== null;
      return isEmojiType && !isReference;
    });
  });

  const shouldShowEmojiControls = computed(() => {
    return !hasMultipleCirclesSelected.value;
  });

  // UPDATED: Allow characteristics editing for document reference circles
  const shouldShowCircleCharacteristicControls = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      return true; // Always show for multiple selection
    }
    // For single selection, hide only if it's a circle reference (not document reference)
    return !isReferenceCircle.value;
  });

  // UPDATED: Only show for circle references, not document references
  const shouldShowJumpToReferenceControl = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, check if ANY selected circle is a circle reference (not document reference)
      const selectedIds = dataStore.getSelectedCircles();
      return selectedIds.some(id => {
        const circle = dataStore.getCircle(id);
        return circle && circle.referenceID !== null;
      });
    }
    // For single selection, show only if it's a circle reference
    return isReferenceCircle.value;
  });

  // UPDATED: Only show for circle references, not document references
  const shouldShowBreakReferenceControl = computed(() => {
    if (hasMultipleCirclesSelected.value) {
      // For multiple selection, check if ANY selected circle is a circle reference (not document reference)
      const selectedIds = dataStore.getSelectedCircles();
      return selectedIds.some(id => {
        const circle = dataStore.getCircle(id);
        return circle && circle.referenceID !== null;
      });
    }
    // For single selection, show only if it's a circle reference
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
    isDocumentReferenceCircle, // NEW
    isCircleEmojiPickerVisible,
    shouldShowEmojiControls,
    shouldShowCircleCharacteristicControls,
    shouldShowJumpToReferenceControl,
    shouldShowBreakReferenceControl,
  };
}
