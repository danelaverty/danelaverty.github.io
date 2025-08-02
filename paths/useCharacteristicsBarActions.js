import { useDataStore } from './useDataStore.js';
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
        crystal: findColorInfo(newColors[0])?.crystal || 'Unknown'
      });
    } else {
      // Single color selection
      dataStore.updateCircle(circleId, {
        color: colorInfo.color,
        colors: [colorInfo.color],
        crystal: colorInfo.crystal
      });
    }
  };

  const selectType = (typeInfo, selectedCircle) => {
    if (!selectedCircle) return;
    
    const circleId = selectedCircle.id;
    dataStore.updateCircle(circleId, {
      type: typeInfo.id
    });
  };

  const selectEmoji = (attribute) => {
    const selectedSquares = dataStore.getSelectedSquares();
    
    if (selectedSquares.length === 0) {
      // No square selected - create a new square with this emoji
      const square = dataStore.createSquare();
      if (square) {
        dataStore.updateSquare(square.id, {
          emoji: attribute.emoji,
          emojiKey: attribute.key,
          color: attribute.color,
          name: attribute.defaultName || '???'
        });
        dataStore.selectSquare(square.id);
      }
    } else {
      // Update selected squares with this emoji
      selectedSquares.forEach(squareId => {
        dataStore.updateSquare(squareId, {
          emoji: attribute.emoji,
          emojiKey: attribute.key,
          color: attribute.color
          // Don't change the name - it should remain independently editable
        });
      });
    }
  };

  return {
    selectColor,
    selectType,
    selectEmoji
  };
};
