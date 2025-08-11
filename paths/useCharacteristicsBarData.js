import { ref, computed } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { colorFamilies } from './colorFamilies.js';
import { circleTypes } from './circleTypes.js';
import { energyTypes } from './energyTypes.js';
import { attributeInfo, storyCategories } from './emojiAttributes.js';
import { useColorUtils } from './colorUtils.js';

export const useCharacteristicsBarData = () => {
  const dataStore = useDataStore();
  const { findColorInfo } = useColorUtils();

  // Get the selected circle
  const selectedCircle = computed(() => {
    const selectedIds = dataStore.getSelectedCircles();
    if (selectedIds.length === 1) {
      // Find the circle across all documents
      const allDocuments = dataStore.getAllCircleDocuments();
      for (const doc of allDocuments) {
        const circles = dataStore.getCirclesForDocument(doc.id);
        const circle = circles.find(c => c.id === selectedIds[0]);
        if (circle) return circle;
      }
    }
    return null;
  });

  // Check if bar should be visible
  const isVisible = computed(() => {
    return selectedCircle.value !== null;
  });

  // Get circle colors (support for multi-color)
  const circleColors = computed(() => {
    if (!selectedCircle.value) return [];
    
    // Check if circle has multiple colors
    if (selectedCircle.value.colors && Array.isArray(selectedCircle.value.colors)) {
      return selectedCircle.value.colors;
    }
    
    // Fallback to single color
    return selectedCircle.value.color ? [selectedCircle.value.color] : ['#4CAF50'];
  });

  // Get circle type
  const circleType = computed(() => {
    if (!selectedCircle.value) return 'basic';
    return selectedCircle.value.type || 'basic';
  });

  // Get circle energy types
  const circleEnergyTypes = computed(() => {
    if (!selectedCircle.value) return [];
    return selectedCircle.value.energyTypes || [];
  });

  // Get type info
  const currentTypeInfo = computed(() => {
    return circleTypes.find(type => type.id === circleType.value) || circleTypes[0];
  });

  // Organize emojis by story categories
  const emojisByCategory = computed(() => {
    const categorizedEmojis = [];
    
    // Add emojis from each story category
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

  // Convert attributeInfo to array for grid display (legacy fallback)
  const emojiAttributes = computed(() => {
    return Object.entries(attributeInfo).map(([key, value]) => ({
      key,
      ...value
    }));
  });

  // Check selections
  const isColorSelected = (colorValue) => {
    return circleColors.value.includes(colorValue);
  };

  const isTypeSelected = (typeId) => {
    return circleType.value === typeId;
  };

  const isEnergySelected = (energyId) => {
    return circleEnergyTypes.value.includes(energyId);
  };

  return {
    selectedCircle,
    isVisible,
    circleColors,
    circleType,
    circleEnergyTypes,
    currentTypeInfo,
    emojiAttributes,
    emojisByCategory,
    colorFamilies,
    circleTypes,
    energyTypes,
    isColorSelected,
    isTypeSelected,
    isEnergySelected,
    findColorInfo
  };
};
