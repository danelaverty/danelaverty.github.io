// CircleCharacteristicsBar.js - Updated to support multiple circle selection
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

// Import styles
import { baseCharacteristicsStyles, displayStyles, colorStyles, typeStyles, energyStyles, activationStyles, emojiStyles } from './cbBaseStyles.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';

// Import sub-components
import { TypeControl } from './CBTypeControl.js';
import { CircleEmojiControl } from './CBCircleEmojiControl.js';
import { ColorControl } from './CBColorControl.js';
import { EnergyControl } from './CBEnergyControl.js';
import { ActivationControl } from './CBActivationControl.js';
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
    const activationDisplayRefTemplate = ref(null);
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

    // NEW: Check if multiple circles are selected
    const hasMultipleCirclesSelected = computed(() => {
      return dataStore.hasMultipleCirclesSelected();
    });

    // NEW: Updated visibility logic - show for single OR multiple circle selection
    const isVisible = computed(() => {
      const selectedCircles = dataStore.getSelectedCircles();
      return selectedCircles.length >= 1; // Changed from === 1 to >= 1
    });

    // NEW: Get selected circle objects for multiple selection
    const getSelectedCircleObjects = computed(() => {
      const selectedIds = dataStore.getSelectedCircles();
      return selectedIds.map(id => dataStore.getCircle(id)).filter(Boolean);
    });

    // Extract specific values we need
    const { emojiAttributes } = dataHooks;

    const causeEmoji = computed(() => {
      return emojiAttributes.value.find(attr => attr.key === 'cause') || emojiAttributes.value[0];
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
             (['emoji', 'shape'].indexOf(dataHooks.selectedCircle.value.type) > -1) && 
             !isReferenceCircle.value;
    });

    // NEW: Should show emoji controls (only for single circle selection)
    const shouldShowEmojiControls = computed(() => {
      return !hasMultipleCirclesSelected.value;
    });

    // NEW: Should show circle characteristic controls (hidden for reference circles in single selection)
    const shouldShowCircleCharacteristicControls = computed(() => {
      if (hasMultipleCirclesSelected.value) {
        return true; // Always show for multiple selection
      }
      // For single selection, hide if it's a reference circle
      return !isReferenceCircle.value;
    });

    // Compute activation state from selected circle(s)
    const isCircleActivated = computed(() => {
      if (hasMultipleCirclesSelected.value) {
        // For multiple circles, show activated if ANY circle is activated
        const selectedIds = dataStore.getSelectedCircles();
        return selectedIds.some(id => {
          const circle = dataStore.getCircle(id);
          return circle && circle.activation === 'activated';
        });
      } else if (dataHooks.selectedCircle.value) {
        return dataHooks.selectedCircle.value.activation === 'activated';
      }
      return false;
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

    const handleActivationToggle = () => {
      if (hasMultipleCirclesSelected.value) {
        // Apply to all selected circles
        const selectedIds = dataStore.getSelectedCircles();
        selectedIds.forEach(circleId => {
          const circle = dataStore.getCircle(circleId);
          if (circle) {
            actionHooks.toggleActivation(circle);
          }
        });
      } else {
        actionHooks.toggleActivation(dataHooks.selectedCircle.value);
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
      isReferenceCircle,
      isCircleEmojiPickerVisible,
      isCircleActivated,
      isVisible, // Updated visibility logic
      hasMultipleCirclesSelected, // NEW
      shouldShowEmojiControls, // NEW
      shouldShowCircleCharacteristicControls, // NEW
      getSelectedCircleObjects, // NEW
      
      // Action handlers
      handleColorSelect,
      handleTypeSelect,
      handleEnergySelect,
      handleActivationToggle,
      handleEmojiSelect,
      handleCircleEmojiSelect,
      handleQuickEmojiSelect,
      handleCategorySelect,
      handleClearRecentEmojis,
      
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
      activationDisplayRefTemplate,
      emojiDisplayRefTemplate,
      typePickerRefTemplate,
      circleEmojiPickerRefTemplate,
      colorPickerRefTemplate,
      energyPickerRefTemplate,
      emojiPickerRefTemplate
    };
  },
  
  components: {
    EmojiRenderer,
    TypeControl,
    CircleEmojiControl,
    ColorControl,
    EnergyControl,
    ActivationControl,
    EmojiControl,
    RecentEmojisControl,
    TypePickerModal,
    CircleEmojiPickerModal,
    ColorPickerModal,
    EnergyPickerModal,
    EmojiPickerModal
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

            <!-- Activation Control -->
            <ActivationControl 
                ref="activationDisplayRefTemplate"
                :isActivated="isCircleActivated"
                @toggle="handleActivationToggle"
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
