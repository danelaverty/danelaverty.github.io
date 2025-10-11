// useCharacteristicsBarHandlers.js - Manages event handlers and actions for the characteristics bar
import { useDataStore } from './dataCoordinator.js';
import { getPropertyValues } from './CBCyclePropertyConfigs.js';

export function useCharacteristicsBarHandlers(dataHooks, actionHooks, pickerHooks, recentEmojiHooks, stateHooks) {
  const dataStore = useDataStore();

  // Create action handlers with proper context for multiple selection
  const handleColorSelect = (colorValue, isCtrlClick) => {
    if (stateHooks.hasMultipleCirclesSelected.value) {
      // Apply to all selected circles
      const selectedIds = dataStore.getSelectedCircles();
      selectedIds.forEach(circleId => {
        const circle = dataStore.getCircle(circleId);
        if (circle) {
          const colorInfo = { color: colorValue };
          actionHooks.selectColor(colorInfo, isCtrlClick, circle, circle.colors || [circle.color]);
        }
      });
    } else {
      const colorInfo = { color: colorValue };
      actionHooks.selectColor(colorInfo, isCtrlClick, dataHooks.selectedCircle.value, dataHooks.circleColors.value);
    }
    if (!isCtrlClick) {
      pickerHooks.closePickerAction('color');
    }
  };

  const handleTypeSelect = (typeInfo) => {
    if (stateHooks.hasMultipleCirclesSelected.value) {
      // Apply to all selected circles
      const selectedIds = dataStore.getSelectedCircles();
      selectedIds.forEach(circleId => {
        const circle = dataStore.getCircle(circleId);
        if (circle) {
          actionHooks.selectType(typeInfo, circle);
        }
      });
    } else {
      actionHooks.selectType(typeInfo, dataHooks.selectedCircle.value);
    }
    pickerHooks.closePickerAction('type');
  };

  const handleEnergySelect = (energyId, isCtrlClick) => {
    if (stateHooks.hasMultipleCirclesSelected.value) {
      // Apply to all selected circles
      const selectedIds = dataStore.getSelectedCircles();
      selectedIds.forEach(circleId => {
        const circle = dataStore.getCircle(circleId);
        if (circle) {
          actionHooks.selectEnergy(energyId, isCtrlClick, circle, circle.energyTypes || []);
        }
      });
    } else {
      actionHooks.selectEnergy(energyId, isCtrlClick, dataHooks.selectedCircle.value, dataHooks.circleEnergyTypes.value);
    }
    if (!isCtrlClick) {
      pickerHooks.closePickerAction('energy');
    }
  };

  // Generic property cycle handler
  const handlePropertyCycle = (propertyName) => {
    if (stateHooks.hasMultipleCirclesSelected.value) {
      const selectedIds = dataStore.getSelectedCircles();
      const currentValues = selectedIds.map(id => {
        const circle = dataStore.getCircle(id);
        return circle ? circle[propertyName] : getPropertyValues(propertyName)[0];
      });

      // Check if all values are the same
      const uniqueValues = [...new Set(currentValues)];
      const values = getPropertyValues(propertyName);

      if (uniqueValues.length > 1) {
        // Different values - set all to first value in cycle
        const targetValue = values[0];
        selectedIds.forEach(circleId => {
          dataStore.updateCircle(circleId, { [propertyName]: targetValue });
        });
      } else {
        // All same value - cycle to next value for all
        selectedIds.forEach(circleId => {
          dataStore.cycleCircleProperty(circleId, propertyName);
        });
      }
    } else if (dataHooks.selectedCircle.value) {
      // Single selection - use store method
      dataStore.cycleCircleProperty(dataHooks.selectedCircle.value.id, propertyName);
    }

    // Force energy effects recalculation for activation changes
    if (propertyName === 'activation') {
      dataStore.triggerEnergyEffectsUpdate?.();
    }
  };

  const handleDirectionalityCycle = () => {
    if (stateHooks.selectedExplicitConnection.value) {
      // This one is different since it operates on connections, not circles
      const cycle = ['none', 'out', 'in', 'both'];
      const currentIndex = cycle.indexOf(stateHooks.selectedExplicitConnection.value.directionality);
      const nextValue = cycle[(currentIndex + 1) % cycle.length];
      
      dataStore.updateExplicitConnectionProperty(
        stateHooks.selectedExplicitConnection.value.id, 
        'directionality', 
        nextValue
      );
    }
  };

  const handleCircleEmojiSelect = (emoji) => {
    if (stateHooks.hasMultipleCirclesSelected.value) {
      // Apply to all selected circles
      const selectedIds = dataStore.getSelectedCircles();
      selectedIds.forEach(circleId => {
        const circle = dataStore.getCircle(circleId);
        if (circle) {
          actionHooks.selectCircleEmoji(emoji.emoji, circle);
        }
      });
    } else {
      actionHooks.selectCircleEmoji(emoji.emoji, dataHooks.selectedCircle.value);
    }
    pickerHooks.closePickerAction('circleEmoji');
  };

  const handleJumpToReference = () => {
    // This function implements the same logic as ctrl+click in CircleViewer.handleCircleSelect
    if (stateHooks.hasMultipleCirclesSelected.value) {
      // For multiple selection, jump to the first reference found
      const selectedIds = dataStore.getSelectedCircles();
      for (const circleId of selectedIds) {
        const circle = dataStore.getCircle(circleId);
        if (circle && circle.referenceID) {
          performJumpToReference(circle.referenceID);
          break; // Only jump to first reference found
        }
      }
    } else if (dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.referenceID) {
      performJumpToReference(dataHooks.selectedCircle.value.referenceID);
    }
  };

  const performJumpToReference = (referencedCircleId) => {
    // Find which document contains the referenced circle
    const allCircleDocuments = dataStore.getAllCircleDocuments();
    let referencedDocumentId = null;
    
    for (const doc of allCircleDocuments) {
      const circlesInDoc = dataStore.getCirclesForDocument(doc.id);
      if (circlesInDoc.some(c => c.id === referencedCircleId)) {
        referencedDocumentId = doc.id;
        break;
      }
    }
    
    if (!referencedDocumentId) {
      console.warn(`Referenced circle ${referencedCircleId} not found in any document`);
      return;
    }
    
    // Check if referenced circle is already visible in a viewer
    const allViewers = Array.from(dataStore.data.circleViewers.values());
    let targetViewer = null;
    
    for (const viewer of allViewers) {
      const viewerDoc = dataStore.getCircleDocumentForViewer(viewer.id);
      if (!viewerDoc) { break; }
      const viewerDocId = viewerDoc.id
      if (viewerDocId === referencedDocumentId) {
        targetViewer = viewer;
        break;
      }
    }
    
    if (targetViewer) {
      // Select the referenced circle
      dataStore.selectCircle(referencedCircleId, targetViewer.id, false);
      dataStore.setSelectedViewer(targetViewer.id);
    } else {
      // Create new viewer for the referenced circle
      const newViewer = dataStore.createCircleViewer();
      dataStore.setCircleDocumentForViewer(newViewer.id, referencedDocumentId);
      dataStore.selectCircle(referencedCircleId, newViewer.id, false);
      dataStore.setSelectedViewer(newViewer.id);
    }
  };

  const handleBreakReference = () => {
    if (stateHooks.hasMultipleCirclesSelected.value) {
      // Break reference for all selected circles that have one
      const selectedIds = dataStore.getSelectedCircles();
      selectedIds.forEach(circleId => {
        const circle = dataStore.getCircle(circleId);
        if (circle && circle.referenceID !== null) {
          dataStore.updateCircle(circleId, { referenceID: null });
        }
      });
    } else if (dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.referenceID !== null) {
      // Break reference for single selected circle
      dataStore.updateCircle(dataHooks.selectedCircle.value.id, { referenceID: null });
    }
  };

  // Emoji handlers (only for single selection)
  const handleEmojiSelect = (attribute) => {
    actionHooks.selectEmoji(attribute);
    recentEmojiHooks.addRecentEmoji(attribute);
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
    pickerHooks.closePickerAction('emoji');
  };

  const handleQuickEmojiSelect = (attribute) => {
    actionHooks.selectEmoji(attribute);
    if (['cause', 'me'].indexOf(attribute.key) == -1) {
      recentEmojiHooks.addRecentEmoji(attribute);
    }
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
  };

  const handleCategorySelect = (categoryGroup) => {
    recentEmojiHooks.loadCategoryToRecent(categoryGroup.emojis);
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
    pickerHooks.closePickerAction('emoji');
  };

  const handleClearRecentEmojis = () => {
    recentEmojiHooks.clearRecentEmojis();
    if (dataStore && dataStore.saveToStorage) {
      dataStore.saveToStorage();
    }
  };

  return {
    handleColorSelect,
    handleTypeSelect,
    handleEnergySelect,
    handlePropertyCycle,
    handleDirectionalityCycle,
    handleCircleEmojiSelect,
    handleJumpToReference,
    handleBreakReference,
    handleEmojiSelect,
    handleQuickEmojiSelect,
    handleCategorySelect,
    handleClearRecentEmojis,
  };
}
