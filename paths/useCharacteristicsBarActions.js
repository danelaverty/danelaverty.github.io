import { useDataStore } from './dataCoordinator.js';
import { useColorUtils } from './colorUtils.js';

export const useCharacteristicsBarActions = () => {
  const dataStore = useDataStore();
  const { findColorInfo } = useColorUtils();

  const selectColor = (colorInfo, isCtrlClick, selectedCircle, circleColors) => {
    if (!selectedCircle) return;
    
    const circleId = selectedCircle.id;
    const currentColors = circleColors;
    
    if (isCtrlClick) {
      // Multi-color selection
      let newColors;
      if (currentColors.includes(colorInfo.color)) {
        // Remove color if already selected (but keep at least one)
        if (currentColors.length > 1) {
          newColors = currentColors.filter(c => c !== colorInfo.color);
        } else {
          newColors = currentColors; // Don't remove the last color
        }
      } else {
        // Add color
        newColors = [...currentColors, colorInfo.color];
      }
      
      // Update circle with multiple colors
      dataStore.updateCircle(circleId, {
        colors: newColors,
        color: newColors[0], // Keep first color as primary
      });
    } else {
      // Single color selection
      dataStore.updateCircle(circleId, {
        color: colorInfo.color,
        colors: [colorInfo.color],
      });
    }
  };

  const selectType = (typeInfo, selectedCircle) => {
    if (!selectedCircle) return;
    
    const circleId = selectedCircle.id;
    
    // Update the circle's type
    dataStore.updateCircle(circleId, {
      type: typeInfo.id
    });
    
    // Save this type as the most recently set type for the circle's document
    const circle = dataStore.getCircle ? dataStore.getCircle(circleId) : null;
    if (circle && circle.documentId) {
      // Use the document store's method to track the most recently set type
      if (dataStore.setMostRecentlySetCircleType) {
        dataStore.setMostRecentlySetCircleType(circle.documentId, typeInfo.id);
      }
    }
  };

  const selectEnergy = (energyId, isCtrlClick, selectedCircle, currentEnergyTypes) => {
    if (!selectedCircle) return;
    
    const circleId = selectedCircle.id;
    let newEnergyTypes;
    
    if (isCtrlClick || currentEnergyTypes.length > 0) {
      // Multi-selection mode or adding to existing
      if (currentEnergyTypes.includes(energyId)) {
        // Remove energy type if already selected
        newEnergyTypes = currentEnergyTypes.filter(id => id !== energyId);
      } else {
        // Add energy type
        newEnergyTypes = [...currentEnergyTypes, energyId];
      }
    } else {
      // Single selection mode
      newEnergyTypes = [energyId];
    }
    
    // Update circle with new energy types
    dataStore.updateCircle(circleId, {
      energyTypes: newEnergyTypes
    });
  };

  // NEW: Toggle activation state
  const toggleActivation = (selectedCircle) => {
    if (!selectedCircle) return;
    
    const circleId = selectedCircle.id;
    const currentActivation = selectedCircle.activation || 'inactive';
    const newActivation = currentActivation === 'activated' ? 'inactive' : 'activated';
    
    // Update circle with new activation state
    dataStore.updateCircle(circleId, {
      activation: newActivation
    });
  };

  const selectEmoji = (attribute) => {
    const selectedSquares = dataStore.getSelectedSquares();
    
    if (true) {
      // No square selected - create a new square with this emoji
      const square = dataStore.createSquare();
      if (square) {
        // Include emojiCss property when updating square
        const updateData = {
          emoji: attribute.emoji,
          emojiKey: attribute.key,
          color: attribute.color,
          name: attribute.defaultName || '???'
        };
        
        // Add emojiCss if it exists on the attribute
        if (attribute.emojiCss) {
          updateData.emojiCss = attribute.emojiCss;
        }
        
        dataStore.updateSquare(square.id, updateData);
        dataStore.selectSquare(square.id);
      }
    } else {
      // Update selected squares with this emoji
      selectedSquares.forEach(squareId => {
        // Include emojiCss property when updating existing squares
        const updateData = {
          emoji: attribute.emoji,
          emojiKey: attribute.key,
          color: attribute.color
          // Don't change the name - it should remain independently editable
        };
        
        // Add emojiCss if it exists on the attribute
        if (attribute.emojiCss) {
          updateData.emojiCss = attribute.emojiCss;
        } else {
          // Clear emojiCss if the new emoji doesn't have it
          updateData.emojiCss = null;
        }
        
        dataStore.updateSquare(squareId, updateData);
      });
    }
  };

  // Circle emoji selection for emoji-type circles
  const selectCircleEmoji = (emoji, selectedCircle) => {
    if (!selectedCircle || selectedCircle.type !== 'emoji') return;
    
    const circleId = selectedCircle.id;
    
    // Update the circle's emoji
    dataStore.updateCircle(circleId, {
      emoji: emoji
    });
  };

  return {
    selectColor,
    selectType,
    selectEnergy,
    toggleActivation, // NEW: Export activation toggle
    selectEmoji,
    selectCircleEmoji
  };
};
