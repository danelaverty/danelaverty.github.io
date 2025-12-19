// useDynamicCharacteristics.js - Fixed to work with global modals
import { ref, computed, onMounted, onUnmounted, nextTick } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { CONTROL_REGISTRY, getAvailableControls } from './controlRegistry.js';
import { usePickerPositioning } from './pickerUtils.js';

let singletonInstance = null;

export function useDynamicCharacteristics() {
// Return existing instance if it exists
  if (singletonInstance) {
    return singletonInstance;
  }

  const dataStore = useDataStore();

  // Create reactive state for all controls dynamically
  const controlStates = {};
  const controlRefs = {};
  const displayRefs = {};

  // Initialize state for all registered controls
  Object.keys(CONTROL_REGISTRY).forEach(controlName => {
    const config = CONTROL_REGISTRY[controlName];
    
    // Picker state
    controlStates[controlName] = ref(false);
    
    // Component refs
    controlRefs[controlName] = ref(null);
    displayRefs[controlName] = ref(null);
  });

  // Get current selection
  const selectedCircles = computed(() => {
    const selectedIds = dataStore.getSelectedCircles();
    const allDocuments = dataStore.getAllCircleDocuments();
    
    return selectedIds.map(id => {
      for (const doc of allDocuments) {
        const circle = dataStore.getCirclesForDocument(doc.id).find(c => c.id === id);
        if (circle) return circle;
      }
      return null;
    }).filter(Boolean);
  });

  // Get connection if applicable
  const selectedConnection = computed(() => {
    if (selectedCircles.value.length !== 2) return null;
    
    return dataStore.getExplicitConnectionBetweenEntities(
      selectedCircles.value[0].id, 'circle',
      selectedCircles.value[1].id, 'circle'
    );
  });

  // Determine which controls should be shown
  const availableControls = computed(() => {
    const circles = selectedCircles.value;
    const connections = selectedConnection.value ? [selectedConnection.value] : [];
    const isReference = circles.length === 1 && circles[0].referenceID !== null;
    
    return getAvailableControls(circles, connections, isReference);
  });

  // Generic value getter
  const getControlValue = (controlName) => {
    const config = CONTROL_REGISTRY[controlName];
    if (!config) return null;

    const entity = config.entityType === 'connection' ? selectedConnection.value : selectedCircles.value[0];
    if (!entity) return config.defaultValue;

    // Handle multi-color controls specially
    if (config.type === 'multi-color') {
      return entity[config.property] || 
             (entity[config.fallbackProperty] ? [entity[config.fallbackProperty]] : config.defaultValue);
    }

    return entity[config.property] ?? config.defaultValue;
  };

  // Generic display value getter (for formatted display)
  const getControlDisplayValue = (controlName) => {
    const config = CONTROL_REGISTRY[controlName];
    const rawValue = getControlValue(controlName);

    // Special formatting for certain control types
    if (config.type === 'single-select' && config.dataSource) {
      const options = config.dataSource();
      return options.find(opt => opt.id === rawValue) || options[0];
    }

    return rawValue;
  };

  // Generic data source getter
  const getControlDataSource = (controlName) => {
    const config = CONTROL_REGISTRY[controlName];
    return config.dataSource ? config.dataSource() : null;
  };

  // Generic selection checker
  const isControlValueSelected = (controlName, value) => {
    const currentValue = getControlValue(controlName);
    const config = CONTROL_REGISTRY[controlName];

    if (config.type === 'multi-color' || config.type === 'multi-select') {
      const values = Array.isArray(currentValue) ? currentValue : [currentValue];
      return values.includes(value);
    }

    return currentValue === value;
  };

  // Generic control update handler
  const updateControlValue = (controlName, value, isCtrlClick = false) => {
    const config = CONTROL_REGISTRY[controlName];
    if (!config) return;

    // Handle connection controls
    if (config.entityType === 'connection') {
      const connection = selectedConnection.value;
      if (!connection) return;

      if (config.type === 'multi-select') {
        const current = connection[config.property] || [];
        const newValue = isCtrlClick 
          ? (current.includes(value) ? current.filter(v => v !== value) : [...current, value])
          : [value];
        
        dataStore.updateExplicitConnectionProperty(connection.id, config.property, newValue);
      } else {
        dataStore.updateExplicitConnectionProperty(connection.id, config.property, value);
      }
      return;
    }

    // Handle circle controls
    selectedCircles.value.forEach(circle => {
      let updates = {};

      if (config.type === 'multi-color') {
        const current = circle[config.property] || (circle[config.fallbackProperty] ? [circle[config.fallbackProperty]] : config.defaultValue);
        
        if (isCtrlClick) {
          const newColors = current.includes(value) && current.length > 1 
            ? current.filter(c => c !== value) 
            : current.includes(value) ? current : [...current, value];
          updates[config.property] = newColors;
          updates[config.fallbackProperty] = newColors[0];
        } else {
          updates[config.property] = [value];
          updates[config.fallbackProperty] = value;
        }
      } else if (config.type === 'multi-select') {
        const current = circle[config.property] || [];
        updates[config.property] = isCtrlClick
          ? (current.includes(value) ? current.filter(v => v !== value) : [...current, value])
          : [value];
      } else {
        updates[config.property] = value;
        
        // Special handling for type changes
        if (controlName === 'type' && circle.documentId) {
          dataStore.setMostRecentlySetCircleType?.(circle.documentId, value);
        }
      }

      dataStore.updateCircle(circle.id, updates);
    });
  };

  // Picker management - simplified for global modals
  const closeAllPickers = () => {
    Object.keys(controlStates).forEach(name => {
      controlStates[name].value = false;
    });
  };

  // Simplified toggle that doesn't do positioning since modals are now global
const togglePicker = async (controlName) => {
  const config = CONTROL_REGISTRY[controlName];
  if (!config) {
    console.error(`No config found for control: ${controlName}`);
    return;
  }

  closeAllPickers();
  controlStates[controlName].value = true;
};

  const closePicker = (controlName) => {
    if (controlStates[controlName]) {
      controlStates[controlName].value = false;
    }
  };

  // Generic click-outside handler - simplified since we don't need positioning checks
  const handleGlobalClick = (e) => {
    // For global modals, we can still close on outside clicks
    // but we don't need to check positioning
    requestAnimationFrame(() => {
      Object.keys(CONTROL_REGISTRY).forEach(controlName => {
        if (controlStates[controlName].value) {
          // Check if click was on a modal with the app-global-picker-modal class
          const clickedModal = e.target.closest('.app-global-picker-modal');
          const clickedControl = e.target.closest('.characteristic-control');
          
          if (!clickedModal && !clickedControl) {
            controlStates[controlName].value = false;
          }
        }
      });
    });
  };

  // Handle escape key
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeAllPickers();
    }
  };

  // Set up event listeners
  onMounted(() => {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick);
    document.removeEventListener('keydown', handleKeydown);
  });

  // Create the dynamic API
  const api = {
    // Core data
    selectedCircles,
    selectedConnection,
    availableControls,

    // Generic functions
    getControlValue,
    getControlDisplayValue,
    getControlDataSource,
    isControlValueSelected,
    updateControlValue,
    togglePicker,
    closePicker,

    // Refs
    getControlRef: (name) => controlRefs[name],
    getDisplayRef: (name) => displayRefs[name],
    
    // FIXED: State - expose the actual reactive refs
    isPickerOpen: (name) => controlStates[name]?.value || false,
    getPickerState: (name) => controlStates[name], // NEW: Direct access to reactive ref

    // Legacy special handlers that the template still expects
    shouldShowJumpToReferenceControl: computed(() => {
      if (selectedCircles.value.length === 0) return false;
      if (selectedCircles.value.length > 1) {
        return selectedCircles.value.some(circle => circle.referenceID !== null);
      }
      return selectedCircles.value[0]?.referenceID !== null;
    }),

    shouldShowBreakReferenceControl: computed(() => {
      if (selectedCircles.value.length === 0) return false;
      if (selectedCircles.value.length > 1) {
        return selectedCircles.value.some(circle => circle.referenceID !== null);
      }
      return selectedCircles.value[0]?.referenceID !== null;
    }),

    shouldShowExplicitConnectionControls: computed(() => {
      return selectedConnection.value !== null;
    }),

    shouldShowEmojiControls: computed(() => {
      return selectedCircles.value.length === 1;
    }),

    connectionDirectionality: computed(() => {
      return selectedConnection.value?.directionality || 'none';
    }),

    handleJumpToReference: () => {
      selectedCircles.value.forEach(circle => {
        if (circle?.referenceID) {
          // Jump logic (keeping original implementation)
          const allDocs = dataStore.getAllCircleDocuments();
          let refDocId = null;
          for (const doc of allDocs) {
            if (dataStore.getCirclesForDocument(doc.id).some(c => c.id === circle.referenceID)) {
              refDocId = doc.id;
              break;
            }
          }
          if (refDocId) {
            const viewers = Array.from(dataStore.data.circleViewers.values());
            const targetViewer = viewers.find(v => dataStore.getCircleDocumentForViewer(v.id)?.id === refDocId);
            if (targetViewer) {
              dataStore.selectCircle(circle.referenceID, targetViewer.id, false);
              dataStore.setSelectedViewer(targetViewer.id);
            } else {
              const newViewer = dataStore.createCircleViewer();
              dataStore.setCircleDocumentForViewer(newViewer.id, refDocId);
              dataStore.selectCircle(circle.referenceID, newViewer.id, false);
              dataStore.setSelectedViewer(newViewer.id);
            }
          }
        }
      });
    },

    handleBreakReference: () => {
      selectedCircles.value.forEach(circle => {
        if (circle?.referenceID) {
          dataStore.updateCircle(circle.id, { referenceID: null });
        }
      });
    },

    handleDirectionalityCycle: () => {
      const connection = selectedConnection.value;
      if (!connection) return;
      
      const cycle = ['none', 'out', 'in', 'both'];
      const currentIndex = cycle.indexOf(connection.directionality || 'none');
      const nextValue = cycle[(currentIndex + 1) % cycle.length];
      dataStore.updateExplicitConnectionProperty(connection.id, 'directionality', nextValue);
    },

    // Placeholder methods for recent emojis (you'll need to integrate your existing logic)
    recentEmojis: computed(() => []), // Replace with actual recent emojis logic
    handleQuickEmojiSelect: () => {}, // Replace with actual handler
    handleClearRecentEmojis: () => {}, // Replace with actual handler
    getEmojiDisplayTitle: () => '', // Replace with actual function
    getEnergyTypeColor: () => '#4CAF50' // Replace with actual function
  };

  // Create legacy compatibility layer
  Object.keys(CONTROL_REGISTRY).forEach(controlName => {
    const config = CONTROL_REGISTRY[controlName];
    const camelName = controlName.charAt(0).toUpperCase() + controlName.slice(1);

    // Legacy computed properties
    api[`${controlName}Value`] = computed(() => getControlValue(controlName));
    api[`${controlName}DisplayValue`] = computed(() => getControlDisplayValue(controlName));
    api[`is${camelName}PickerOpen`] = controlStates[controlName];
    api[`${controlName}DisplayRef`] = displayRefs[controlName];
    api[`${controlName}PickerRef`] = controlRefs[controlName];

    // Legacy functions
    api[`toggle${camelName}Picker`] = () => togglePicker(controlName);
    api[`handle${camelName}Select`] = (value, isCtrlClick) => {
      updateControlValue(controlName, value, isCtrlClick);
      if (!isCtrlClick) closePicker(controlName);
    };
    api[`is${camelName}Selected`] = (value) => isControlValueSelected(controlName, value);
  });

singletonInstance = api;
  return api;
}
