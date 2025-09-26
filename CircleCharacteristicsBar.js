// CircleCharacteristicsBar.js - Updated to support multiple circle selection, break reference control, and dynamic cycleable properties
import { computed, ref, watchEffect } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarActions } from './useCharacteristicsBarActions.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { useRecentEmojis } from './useRecentEmojis.js';
import { useDataStore } from './dataCoordinator.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiService } from './emojiService.js';
import { EmojiVariantService } from './EmojiVariantService.js';
import { getEnergyTypeColor } from './energyTypes.js';
import { CBConnectionDirectionalityControl } from './CBConnectionDirectionalityControl.js';
import { CYCLE_PROPERTY_CONFIGS, getPropertyValues, getPropertyConfig } from './CBCyclePropertyConfigs.js';

// Import styles
import { baseCharacteristicsStyles, displayStyles, colorStyles, typeStyles, energyStyles, activationStyles, emojiStyles } from './cbBaseStyles.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';

// Import sub-components
import { TypeControl } from './CBTypeControl.js';
import { CircleEmojiControl } from './CBCircleEmojiControl.js';
import { ColorControl } from './CBColorControl.js';
import { EnergyControl } from './CBEnergyControl.js';
import { CBCyclePropertyControl } from './CBCyclePropertyControl.js';
import { CBJumpToReferenceControl } from './CBJumpToReferenceControl.js';
import { BreakReferenceControl } from './CBBreakReferenceControl.js';
import { EmojiControl } from './CBEmojiControl.js';
import { RecentEmojisControl } from './CBRecentEmojisControl.js';

// Import picker components
import { TypePickerModal } from './CBTypePickerModal.js';
import { CircleEmojiPickerModal } from './CBCircleEmojiPickerModal.js';
import { ColorPickerModal } from './CBColorPickerModal.js';
import { EnergyPickerModal } from './CBEnergyPickerModal.js';
import { EmojiPickerModal } from './CBEmojiPickerModal.js';

// Combine all styles
const componentStyles = `
    ${baseCharacteristicsStyles}
    ${displayStyles}
    ${colorStyles}
    ${typeStyles}
    ${energyStyles}
    ${activationStyles}
    ${emojiStyles}
    ${modalStyles}
    ${pickerSpecificStyles}
`;

// Inject component styles
injectComponentStyles('circle-characteristics-bar', componentStyles);

export const CircleCharacteristicsBar = {
  setup() {
    const dataStore = useDataStore();

    // Get all hooks
    const dataHooks = useCharacteristicsBarData();
    const actionHooks = useCharacteristicsBarActions();
    const pickerHooks = useCharacteristicsBarPickers();
    const recentEmojiHooks = useRecentEmojis();

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

    // Define which properties should show cycleable controls
    const cycleableProperties = Object.keys(CYCLE_PROPERTY_CONFIGS);

    // Create computed properties for each cycleable property
    const getPropertyValue = (propertyName) => {
      if (hasMultipleCirclesSelected.value) {
        // For multiple selection, show the most common value
        const selectedIds = dataStore.getSelectedCircles();
        const values = selectedIds.map(id => {
          const circle = dataStore.getCircle(id);
          return circle ? circle[propertyName] : getPropertyValues(propertyName)[0];
        });

        // Count occurrences and return most common
        const counts = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
      } else if (dataHooks.selectedCircle.value) {
        return dataHooks.selectedCircle.value[propertyName] || getPropertyValues(propertyName)[0];
      }
      return getPropertyValues(propertyName)[0];
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

    // Create action handlers with proper context for multiple selection
    const handleColorSelect = (colorValue, isCtrlClick) => {
      if (hasMultipleCirclesSelected.value) {
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
      if (hasMultipleCirclesSelected.value) {
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
      if (hasMultipleCirclesSelected.value) {
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
          if (hasMultipleCirclesSelected.value) {
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

          // ADD THIS: Force energy effects recalculation for activation changes
          if (propertyName === 'activation') {
              dataStore.triggerEnergyEffectsUpdate?.();
          }
      };

    const handleDirectionalityCycle = () => {
      if (selectedExplicitConnection.value) {
        // This one is different since it operates on connections, not circles
        const cycle = ['none', 'out', 'in', 'both'];
        const currentIndex = cycle.indexOf(selectedExplicitConnection.value.directionality);
        const nextValue = cycle[(currentIndex + 1) % cycle.length];
        
        dataStore.updateExplicitConnectionProperty(
          selectedExplicitConnection.value.id, 
          'directionality', 
          nextValue
        );
      }
    };

    const handleCircleEmojiSelect = (emoji) => {
      if (hasMultipleCirclesSelected.value) {
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
      if (hasMultipleCirclesSelected.value) {
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
      if (hasMultipleCirclesSelected.value) {
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

    const getEmojiDisplayTitle = (emojiData, context) => {
      return EmojiService.getDisplayTitle(emojiData, context);
    };

    return {
      // Data from hooks
      ...dataHooks,
      ...recentEmojiHooks,
      
      // Computed values
      causeEmoji,
      getCurrentCircleEmoji,
      isReferenceCircle,
      isCircleEmojiPickerVisible,
      isVisible,
      hasMultipleCirclesSelected,
      shouldShowEmojiControls,
      shouldShowCircleCharacteristicControls,
      shouldShowJumpToReferenceControl,
      shouldShowBreakReferenceControl,
      getSelectedCircleObjects,
      selectedExplicitConnection,
      shouldShowExplicitConnectionControls,
      connectionDirectionality,
      
      // Cycleable properties
      cycleableProperties,
      getPropertyValue,
      getPropertyConfig,
      
      // Action handlers
      handleColorSelect,
      handleTypeSelect,
      handleEnergySelect,
      handlePropertyCycle,
      handleEmojiSelect,
      handleCircleEmojiSelect,
      handleQuickEmojiSelect,
      handleCategorySelect,
      handleClearRecentEmojis,
      handleJumpToReference,
      handleBreakReference,
      handleDirectionalityCycle,
      
      // Utilities
      getEmojiDisplayTitle,
      getEnergyTypeColor,
      EmojiVariantService,
      
      // Picker hooks
      isColorPickerOpen: pickerHooks.isColorPickerOpen,
      isTypePickerOpen: pickerHooks.isTypePickerOpen,
      isEnergyPickerOpen: pickerHooks.isEnergyPickerOpen,
      isEmojiPickerOpen: pickerHooks.isEmojiPickerOpen,
      isCircleEmojiPickerOpen: pickerHooks.isCircleEmojiPickerOpen,
      toggleColorPicker: pickerHooks.toggleColorPicker,
      toggleTypePicker: pickerHooks.toggleTypePicker,
      toggleEnergyPicker: pickerHooks.toggleEnergyPicker,
      toggleEmojiPicker: pickerHooks.toggleEmojiPicker,
      toggleCircleEmojiPicker: pickerHooks.toggleCircleEmojiPicker,
      closePickerAction: pickerHooks.closePickerAction,
      
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
    };
  },
  
  components: {
    EmojiRenderer,
    TypeControl,
    CircleEmojiControl,
    ColorControl,
    EnergyControl,
    CBCyclePropertyControl,
    CBJumpToReferenceControl,
    BreakReferenceControl,
    EmojiControl,
    RecentEmojisControl,
    TypePickerModal,
    CircleEmojiPickerModal,
    ColorPickerModal,
    EnergyPickerModal,
    EmojiPickerModal,
    CBConnectionDirectionalityControl,
  },
  
    template: `
    <div :class="['circle-characteristics-bar', { hidden: !isVisible }]">
        <!-- Circle Characteristic Controls (Hidden for Reference Circles in Single Selection) -->
        <template v-if="shouldShowCircleCharacteristicControls">
            <!-- Type Control -->
            <TypeControl 
                ref="typeDisplayRefTemplate"
                :currentTypeInfo="currentTypeInfo"
                :isPickerOpen="isTypePickerOpen"
                @toggle="toggleTypePicker"
            />

            <!-- Circle Emoji Control -->
            <CircleEmojiControl 
                v-if="isCircleEmojiPickerVisible"
                ref="circleEmojiDisplayRefTemplate"
                :selectedCircle="selectedCircle"
                :hasMultipleCirclesSelected="hasMultipleCirclesSelected"
                :selectedCircles="getSelectedCircleObjects"
                :isPickerOpen="isCircleEmojiPickerOpen"
                @toggle="toggleCircleEmojiPicker"
            />

            <!-- Color Control -->
            <ColorControl 
                ref="colorDisplayRefTemplate"
                :circleColors="circleColors"
                :isPickerOpen="isColorPickerOpen"
                @toggle="toggleColorPicker"
            />

            <!-- Energy Control -->
            <EnergyControl 
                ref="energyDisplayRefTemplate"
                :circleEnergyTypes="circleEnergyTypes"
                :isPickerOpen="isEnergyPickerOpen"
                :getEnergyTypeColor="getEnergyTypeColor"
                @toggle="toggleEnergyPicker"
            />

            <!-- Dynamic Cycleable Property Controls -->
            <CBCyclePropertyControl 
                v-for="propertyName in cycleableProperties"
                :key="propertyName"
                :property-name="propertyName"
                :property-value="getPropertyValue(propertyName)"
                @cycle="handlePropertyCycle(propertyName)"
            />
        </template>

        <!-- Reference Controls (Only shown for reference circles or multi-selection with references) -->
        <!-- Jump to Reference Control -->
        <CBJumpToReferenceControl 
            v-if="shouldShowJumpToReferenceControl"
            @jump-to-reference="handleJumpToReference"
        />

        <!-- Break Reference Control -->
        <BreakReferenceControl 
            v-if="shouldShowBreakReferenceControl"
            @break-reference="handleBreakReference"
        />

        <!-- Explicit Connection Controls (Only shown when exactly 2 circles selected with connection) -->
        <template v-if="shouldShowExplicitConnectionControls">
            <!-- Visual separator -->
            <div style="border-left: 1px solid #666; margin: 0 8px; height: 32px;"></div>
            
            <!-- Connection Directionality Control -->
            <CBConnectionDirectionalityControl 
                :directionality="connectionDirectionality"
                @cycle="handleDirectionalityCycle"
            />
        </template>

        <!-- Emoji Controls (Only Visible for Single Circle Selection) -->
        <template v-if="shouldShowEmojiControls">
            <!-- Emoji Control -->
            <EmojiControl 
                ref="emojiDisplayRefTemplate"
                :causeEmoji="causeEmoji"
                :isPickerOpen="isEmojiPickerOpen"
                :getEmojiDisplayTitle="getEmojiDisplayTitle"
                @toggle="toggleEmojiPicker"
                @selectQuickEmoji="handleQuickEmojiSelect"
            />

            <!-- Recent Emojis Control -->
            <RecentEmojisControl 
                v-if="recentEmojis.length > 0"
                :recentEmojis="recentEmojis"
                :getEmojiDisplayTitle="getEmojiDisplayTitle"
                @selectQuickEmoji="handleQuickEmojiSelect"
                @clearRecentEmojis="handleClearRecentEmojis"
            />
        </template>

        <!-- Picker Modals (Only show for non-reference circles) -->
        <template v-if="shouldShowCircleCharacteristicControls">
            <!-- Type Picker Modal -->
            <TypePickerModal 
                v-if="isTypePickerOpen"
                ref="typePickerRefTemplate"
                :circleTypes="circleTypes"
                :isTypeSelected="isTypeSelected"
                @selectType="handleTypeSelect"
                @close="closePickerAction('type')"
            />

            <!-- Circle Emoji Picker Modal -->
            <CircleEmojiPickerModal 
                v-if="isCircleEmojiPickerOpen"
                ref="circleEmojiPickerRefTemplate"
                :currentEmoji="getCurrentCircleEmoji"
                @selectCircleEmoji="handleCircleEmojiSelect"
                @close="closePickerAction('circleEmoji')"
            />
            
            <!-- Color Picker Modal -->
            <ColorPickerModal 
                v-if="isColorPickerOpen"
                ref="colorPickerRefTemplate"
                :colorFamilies="colorFamilies"
                :isColorSelected="isColorSelected"
                @selectColor="handleColorSelect"
                @close="closePickerAction('color')"
            />

            <!-- Energy Picker Modal -->
            <EnergyPickerModal 
                v-if="isEnergyPickerOpen"
                ref="energyPickerRefTemplate"
                :energyTypes="energyTypes"
                :isEnergySelected="isEnergySelected"
                @selectEnergy="handleEnergySelect"
                @close="closePickerAction('energy')"
            />
        </template>
        
        <!-- Emoji Picker Modal (Only available for single selection) -->
        <EmojiPickerModal 
            v-if="isEmojiPickerOpen && shouldShowEmojiControls"
            ref="emojiPickerRefTemplate"
            :emojisByCategory="emojisByCategory"
            :getEmojiDisplayTitle="getEmojiDisplayTitle"
            @selectEmoji="handleEmojiSelect"
            @selectCategory="handleCategorySelect"
            @close="closePickerAction('emoji')"
        />
    </div>
  `
};
