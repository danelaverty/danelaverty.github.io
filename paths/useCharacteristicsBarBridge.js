// useCharacteristicsBarBridge.js - Fixed with direct reactive access
import { computed, ref } from './vue-composition-api.js';
import { roilMotionSystem } from './RoilMotionCore.js';
import { useDynamicCharacteristics } from './useDynamicCharacteristics.js';
import { useRecentEmojis } from './useRecentEmojis.js';
import { getEnergyTypeColor } from './energyTypes.js';
import { EmojiService } from './emojiService.js';
import { useDataStore } from './dataCoordinator.js';
import { colorFamilies } from './colorFamilies.js';
import { circleTypes } from './circleTypes.js';
import { energyTypes } from './energyTypes.js';
import { attributeInfo, storyCategories } from './emojiAttributes.js';
import { getVisiblePropertiesForCircles, getPropertyDefault } from './CBCyclePropertyConfigs.js';

export function useCharacteristicsBarBridge() {
  // Get the dynamic system
  const dynamic = useDynamicCharacteristics();
  
  // Get existing functionality
  const recentEmojiHooks = useRecentEmojis();
  const dataStore = useDataStore();

  // Helper functions
  const getEmojiDisplayTitle = (emojiData, context) => {
    return EmojiService.getDisplayTitle(emojiData, context);
  };

  // Legacy compatibility for emoji handling
  const selectEmoji = (attribute) => {
    const square = dataStore.createSquare();
    if (square) {
      dataStore.updateSquare(square.id, {
        emoji: attribute.emoji,
        emojiKey: attribute.key,
        color: attribute.color,
        name: attribute.defaultName || '???',
        emojiCss: attribute.emojiCss || null
      });
      dataStore.selectSquare(square.id);
    }
  };

  const handleQuickEmojiSelect = (attribute) => {
    selectEmoji(attribute);
    if (['cause', 'me'].indexOf(attribute.key) === -1) {
      recentEmojiHooks.addRecentEmoji(attribute);
    }
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
  };

  const handleEmojiSelect = (attribute) => {
    selectEmoji(attribute);
    recentEmojiHooks.addRecentEmoji(attribute);
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
    dynamic.closePicker('emoji');
  };

  const handleCategorySelect = (categoryGroup) => {
    recentEmojiHooks.loadCategoryToRecent(categoryGroup.emojis);
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
    dynamic.closePicker('emoji');
  };

  const handleClearRecentEmojis = () => {
    recentEmojiHooks.clearRecentEmojis();
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
  };

  // Property cycle handler
  const handlePropertyCycle = (propertyName) => {
    const selectedIds = dataStore.getSelectedCircles();
    selectedIds.forEach(circleId => {
      dataStore.cycleCircleProperty(circleId, propertyName);
    });
    if (propertyName === 'activation') {
      dataStore.triggerEnergyEffectsUpdate?.();
    }
  };

  // Property value getter
  const getPropertyValue = (propertyName) => {
    const defaultValue = getPropertyDefault(propertyName);
    const selectedCircles = dynamic.selectedCircles.value;
    
    if (selectedCircles.length > 1) {
      // For multiple selection, show the most common value
      const values = selectedCircles.map(circle => circle[propertyName] ?? defaultValue);
      const counts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).reduce((a, b) => 
        counts[a[0]] > counts[b[0]] ? a : b
      )[0];
    } else if (selectedCircles.length === 1) {
      return selectedCircles[0][propertyName] ?? defaultValue;
    }
    
    return defaultValue;
  };

  // Convert attributeInfo to array for compatibility
  const emojiAttributes = computed(() => {
    return Object.entries(attributeInfo).map(([key, value]) => ({
      key,
      ...value
    }));
  });

  // Emoji data organized by story categories
  const emojisByCategory = computed(() => {
    const categorizedEmojis = [];
    
    Object.entries(storyCategories).forEach(([categoryKey, category]) => {
      const categoryEmojis = [];
      
      category.emojis.forEach(emojiKey => {
        if (attributeInfo[emojiKey]) {
          categoryEmojis.push({
            key: emojiKey,
            ...attributeInfo[emojiKey]
          });
        }
      });
      
      if (categoryEmojis.length > 0) {
        categorizedEmojis.push({
          category: {
            key: categoryKey,
            name: category.name,
            description: category.description
          },
          emojis: categoryEmojis
        });
      }
    });
    
    return categorizedEmojis;
  });

// Add these reactive properties to the existing setup:
const isCustomEmojiPickerOpen = ref(false);

// Add these methods to the existing methods object:
const toggleCustomEmojiPicker = () => {
  isCustomEmojiPickerOpen.value = !isCustomEmojiPickerOpen.value;
};

const closeCustomEmojiPicker = () => {
  isCustomEmojiPickerOpen.value = false;
};

const handleCreateSquareWithEmoji = (selectedEmoji) => {
  // First check if any squares are selected
  const selectedSquareIds = dataStore.getSelectedSquares();
  
  if (selectedSquareIds.length > 0) {
    // Update all selected squares with the chosen emoji
    selectedSquareIds.forEach(squareId => {
      dataStore.updateSquare(squareId, {
        emoji: selectedEmoji,
          color: '#CCCCCC',
      });
    });
    
    // Convert emoji string to attribute object format for recent emojis
    const emojiAttribute = {
      key: `custom_${selectedEmoji}`, // Generate a unique key
      emoji: selectedEmoji,
      defaultName: selectedEmoji, // Use the emoji as the default name
      color: '#CCCCCC' // Default color for custom emojis
    };
    
    // Add the emoji to recent emojis
    recentEmojiHooks.addRecentEmoji(emojiAttribute);
  } else {
    // No squares selected, create a new square (original behavior)
    const currentDoc = dataStore.getCurrentSquareDocument();
    if (!currentDoc) {
      console.warn('No current square document found');
      return;
    }

    // Create a square with the selected emoji
    const newSquare = dataStore.createSquare(currentDoc.id, [325]);
    
    if (newSquare && selectedEmoji) {
      // Update the square with the selected emoji
      dataStore.updateSquare(newSquare.id, {
        emoji: selectedEmoji
      });
      
      // Convert emoji string to attribute object format for recent emojis
      const emojiAttribute = {
        key: `custom_${selectedEmoji}`, // Generate a unique key
        emoji: selectedEmoji,
        defaultName: selectedEmoji, // Use the emoji as the default name
        color: '#CCCCCC' // Default color for custom emojis
      };
      
      // Add the emoji to recent emojis
      recentEmojiHooks.addRecentEmoji(emojiAttribute);
    }
  }
  
  // Close the picker
  closeCustomEmojiPicker();
};


  // Merge everything together
  return {
    // Core dynamic functionality
    ...dynamic,
    
    // Recent emoji functionality
    ...recentEmojiHooks,
    
    // Helper functions
    getEmojiDisplayTitle,
    getEnergyTypeColor,
    
    // Enhanced handlers that include recent emoji logic
    handleEmojiSelect,
    handleQuickEmojiSelect,
    handleCategorySelect,
    handleClearRecentEmojis,
    handlePropertyCycle,
    getPropertyValue,

    // Helper to get control props dynamically
    getControlProps: (controlName) => {
      const config = CONTROL_REGISTRY[controlName];
      if (!config || !config.getControlProps) {
        return {};
      }
      
      const circles = dynamic.selectedCircles.value;
      const hasMultiple = circles.length > 1;
      return config.getControlProps(circles, hasMultiple);
    },

    // Legacy compatibility methods that your existing template expects
    isVisible: computed(() => dynamic.selectedCircles.value.length > 0),
    hasMultipleCirclesSelected: computed(() => dynamic.selectedCircles.value.length > 1),
    getSelectedCircleObjects: computed(() => dynamic.selectedCircles.value),
    selectedCircle: computed(() => dynamic.selectedCircles.value[0] || null),

shouldShowStatesControl: computed(() => {
    const circles = dynamic.selectedCircles.value;
    return circles.length === 1 && !circles[0]?.referenceID;
}),

isStatesPickerOpen: computed(() => dynamic.getPickerState('states')?.value || false),

toggleStatesPicker: () => dynamic.togglePicker('states'),
    
    // Missing computed properties for template compatibility
    shouldShowCircleCharacteristicControls: computed(() => {
      if (dynamic.selectedCircles.value.length > 1) {
        return true; // Always show for multiple selection
      }
      const circle = dynamic.selectedCircles.value[0];
      return circle && !circle.referenceID; // Hide only if it's a reference circle
    }),
    
    isCircleEmojiPickerVisible: computed(() => {
      const circles = dynamic.selectedCircles.value;
      if (circles.length === 0) return false;
      
      return circles.every(circle => {
        const isEmojiType = circle.type === 'emoji';
        const isReference = circle.referenceID !== null;
        return isEmojiType && !isReference;
      });
    }),
    
    getCurrentCircleEmoji: computed(() => {
      const circles = dynamic.selectedCircles.value;
      if (circles.length > 1) {
        return circles[0]?.emoji || '';
      } else if (circles.length === 1) {
        return circles[0].emoji || '';
      }
      return '';
    }),
    
    getCurrentCauseEmoji: computed(() => {
      const circles = dynamic.selectedCircles.value;
      if (circles.length > 1) {
        return circles[0]?.causeEmoji || '';
      } else if (circles.length === 1) {
        return circles[0].causeEmoji || '';
      }
      return '';
    }),

    getCurrentDemandEmoji: computed(() => {
      const circles = dynamic.selectedCircles.value;
      if (circles.length > 1) {
        return circles[0]?.demandEmoji || '';
      } else if (circles.length === 1) {
        return circles[0].demandEmoji || '';
      }
      return '';
    }),

    // Helper to get emoji value for any property
    getEmojiValue: (propertyName) => {
      const circles = dynamic.selectedCircles.value;
      let rawValue = '';
      
      if (circles.length > 1) {
        rawValue = circles[0]?.[propertyName] || '';
      } else if (circles.length === 1) {
        rawValue = circles[0][propertyName] || '';
      }
      
      // If the stored value is an object (from picker), extract just the emoji
      if (typeof rawValue === 'object' && rawValue !== null) {
        return rawValue.emoji || '';
      }
      
      // If it's already a string, return as-is
      return rawValue;
    },
    
    // Cycleable properties using your existing logic
    cycleableProperties: computed(() => {
      const selectedCircles = dynamic.selectedCircles.value;
      if (selectedCircles.length === 0) return [];
      return getVisiblePropertiesForCircles(selectedCircles);
    }),
    
    // Emoji attributes for emoji controls
    emojiAttributes,
    emojisByCategory,
    
    causeEmoji: computed(() => {
      return emojiAttributes.value.find(attr => attr.key === 'cause') || emojiAttributes.value[0];
    }),
    
    // Static data sources
    colorFamilies,
    circleTypes, 
    energyTypes,
    
    // Legacy data accessors for existing template compatibility
    circleColors: computed(() => dynamic.getControlValue('color')),
    secondaryCircleColors: computed(() => dynamic.getControlValue('secondaryColor')),
    circleEnergyTypes: computed(() => dynamic.getControlValue('energy')),
    connectionEnergyTypes: computed(() => dynamic.getControlValue('connectionEnergy')),
    currentTypeInfo: computed(() => dynamic.getControlDisplayValue('type')),
    secondaryName: computed(() => dynamic.getControlValue('secondaryName')),
    
    // Legacy selection checkers
    isColorSelected: (value) => dynamic.isControlValueSelected('color', value),
    isSecondaryColorSelected: (value) => dynamic.isControlValueSelected('secondaryColor', value),
    isTypeSelected: (value) => dynamic.isControlValueSelected('type', value),
    isEnergySelected: (value) => dynamic.isControlValueSelected('energy', value),
    isConnectionEnergySelected: (value) => dynamic.isControlValueSelected('connectionEnergy', value),
    
    // FIXED: Use direct access to reactive state refs
isColorPickerOpen: computed(() => {
  const state = dynamic.getPickerState('color');
  const value = state?.value || false;
  return value;
}),
    isSecondaryColorPickerOpen: computed(() => dynamic.getPickerState('secondaryColor')?.value || false),
    isTypePickerOpen: computed(() => dynamic.getPickerState('type')?.value || false),
    isEnergyPickerOpen: computed(() => dynamic.getPickerState('energy')?.value || false),
    isEmojiPickerOpen: computed(() => dynamic.getPickerState('emoji')?.value || false),
    isCircleEmojiPickerOpen: computed(() => dynamic.getPickerState('circleEmoji')?.value || false),
    isCauseEmojiPickerOpen: computed(() => dynamic.getPickerState('causeEmoji')?.value || false),
    isDemandEmojiPickerOpen: computed(() => dynamic.getPickerState('demandEmoji')?.value || false),
    isConnectionEnergyPickerOpen: computed(() => dynamic.getPickerState('connectionEnergy')?.value || false),
    isSecondaryNamePickerOpen: computed(() => dynamic.getPickerState('secondaryName')?.value || false),
    
    // Legacy picker toggles
    toggleColorPicker: () => dynamic.togglePicker('color'),
    toggleSecondaryColorPicker: () => dynamic.togglePicker('secondaryColor'),
    toggleTypePicker: () => dynamic.togglePicker('type'),
    toggleEnergyPicker: () => dynamic.togglePicker('energy'),
    toggleEmojiPicker: () => dynamic.togglePicker('emoji'),
    toggleCircleEmojiPicker: () => dynamic.togglePicker('circleEmoji'),
    toggleCauseEmojiPicker: () => dynamic.togglePicker('causeEmoji'),
    toggleDemandEmojiPicker: () => dynamic.togglePicker('demandEmoji'),
    toggleConnectionEnergyPicker: () => dynamic.togglePicker('connectionEnergy'),
    toggleSecondaryNamePicker: () => dynamic.togglePicker('secondaryName'),
    
    // Legacy close action
    closePickerAction: (pickerName) => dynamic.closePicker(pickerName),
    
    // Legacy handlers that wrap the dynamic system
    handleColorSelect: (value, isCtrlClick) => {
      dynamic.updateControlValue('color', value, isCtrlClick);
      if (!isCtrlClick) dynamic.closePicker('color');
    },
    
    handleSecondaryColorSelect: (value, isCtrlClick) => {
      dynamic.updateControlValue('secondaryColor', value, isCtrlClick);
      if (!isCtrlClick) dynamic.closePicker('secondaryColor');
    },
    
    handleTypeSelect: (typeInfo) => {
      dynamic.updateControlValue('type', typeInfo.id || typeInfo);
      dynamic.closePicker('type');
    },
    
    handleEnergySelect: (energyId, isCtrlClick) => {
      dynamic.updateControlValue('energy', energyId, isCtrlClick);
      if (!isCtrlClick) dynamic.closePicker('energy');
    },
    
    handleCircleEmojiSelect: (emoji) => {
      // Extract just the emoji string from the object
      const emojiValue = typeof emoji === 'string' ? emoji : emoji.emoji || emoji;
      dynamic.updateControlValue('circleEmoji', emojiValue);
      dynamic.closePicker('circleEmoji');
    },
    
handleCauseEmojiSelect: (emoji) => {
  const emojiValue = typeof emoji === 'string' ? emoji : emoji.emoji || emoji;
  
  // Update each selected circle directly
  const selectedIds = dataStore.getSelectedCircles();
  selectedIds.forEach(circleId => {
    dataStore.updateCircle(circleId, { causeEmoji: emojiValue });
    
    // NEW: Refresh roil event points if this is a roil member
    const circle = dataStore.getCircle(circleId);
    if (circle?.belongsToID) {
      const group = dataStore.getCircle(circle.belongsToID);
      if (group?.roilMode === 'on') {
        // Import roilMotionSystem and refresh event points
        if (typeof roilMotionSystem !== 'undefined') {
          roilMotionSystem.refreshEventPointsForCircle(circleId);
        }
      }
    }
  });
  
  dynamic.closePicker('causeEmoji');
},

handleDemandEmojiSelect: (emoji) => {
  const emojiValue = typeof emoji === 'string' ? emoji : emoji.emoji || emoji;
  
  // Update each selected circle directly
  const selectedIds = dataStore.getSelectedCircles();
  selectedIds.forEach(circleId => {
    dataStore.updateCircle(circleId, { demandEmoji: emojiValue });
    
    // NEW: Refresh roil event points if this is a roil member
    const circle = dataStore.getCircle(circleId);
    if (circle?.belongsToID) {
      const group = dataStore.getCircle(circle.belongsToID);
      if (group?.roilMode === 'on') {
        // Import roilMotionSystem and refresh event points
        if (typeof roilMotionSystem !== 'undefined') {
          roilMotionSystem.refreshEventPointsForCircle(circleId);
        }
      }
    }
  });
  
  dynamic.closePicker('demandEmoji');
},

    handleConnectionEnergySelect: (energyId, isCtrlClick) => {
      dynamic.updateControlValue('connectionEnergy', energyId, isCtrlClick);
      if (!isCtrlClick) dynamic.closePicker('connectionEnergy');
    },
    
    handleSecondaryNameSelect: (value) => {
      dynamic.updateControlValue('secondaryName', value);
      dynamic.closePicker('secondaryName');
    },

    // Template refs for legacy compatibility - these need to be reactive refs that can be assigned
    typeDisplayRefTemplate: dynamic.getDisplayRef('type'),
    circleEmojiDisplayRefTemplate: dynamic.getDisplayRef('circleEmoji'),
    causeEmojiDisplayRefTemplate: dynamic.getDisplayRef('causeEmoji'),
    demandEmojiDisplayRefTemplate: dynamic.getDisplayRef('demandEmoji'),
    colorDisplayRefTemplate: dynamic.getDisplayRef('color'),
    energyDisplayRefTemplate: dynamic.getDisplayRef('energy'),
    emojiDisplayRefTemplate: dynamic.getDisplayRef('emoji'),
    secondaryColorDisplayRefTemplate: dynamic.getDisplayRef('secondaryColor'),
    secondaryNameDisplayRefTemplate: dynamic.getDisplayRef('secondaryName'),
    
    typePickerRefTemplate: dynamic.getControlRef('type'),
    circleEmojiPickerRefTemplate: dynamic.getControlRef('circleEmoji'),
    causeEmojiPickerRefTemplate: dynamic.getControlRef('causeEmoji'),
    demandEmojiPickerRefTemplate: dynamic.getControlRef('demandEmoji'),
    colorPickerRefTemplate: dynamic.getControlRef('color'),
    energyPickerRefTemplate: dynamic.getControlRef('energy'),
    emojiPickerRefTemplate: dynamic.getControlRef('emoji'),
    secondaryColorPickerRefTemplate: dynamic.getControlRef('secondaryColor'),
    secondaryNamePickerRefTemplate: dynamic.getControlRef('secondaryName'),

    isCustomEmojiPickerOpen,
    toggleCustomEmojiPicker,
    closeCustomEmojiPicker,
    handleCreateSquareWithEmoji,

selectedSquares: computed(() => {
    const squareIds = dataStore.getSelectedSquares();
    return squareIds.map(id => dataStore.getSquare(id)).filter(Boolean);
}),

currentSquares: computed(() => {
    const docId = dataStore.data.currentSquareDocumentId;
    return docId ? dataStore.getSquaresForDocument(docId) : [];
}),

dataStore: dataStore,
  };
}
