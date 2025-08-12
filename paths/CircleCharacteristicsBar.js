// CircleCharacteristicsBar.js - Updated with activation control
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
import { ActivationControl } from './CBActivationControl.js'; // NEW: Import activation control
import { EmojiControl } from './CBEmojiControl.js';
import { RecentEmojisControl } from './CBRecentEmojisControl.js';

// Import picker components
import { TypePickerModal } from './CBTypePickerModal.js';
import { CircleEmojiPickerModal } from './CBCircleEmojiPickerModal.js';
import { ColorPickerModal } from './CBColorPickerModal.js';
import { EnergyPickerModal } from './CBEnergyPickerModal.js';
import { EmojiPickerModal } from './CBEmojiPickerModal.js';

// Combine all styles (including new activation styles)
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
    const activationDisplayRefTemplate = ref(null); // NEW: Activation display ref
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

    // Extract specific values we need
    const { emojiAttributes } = dataHooks;

    const causeEmoji = computed(() => {
      return emojiAttributes.value.find(attr => attr.key === 'cause') || emojiAttributes.value[0];
    });
    
    // Check if circle emoji picker should be visible
    const isCircleEmojiPickerVisible = computed(() => {
      return dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.type === 'emoji';
    });

    // NEW: Compute activation state from selected circle
    const isCircleActivated = computed(() => {
      if (!dataHooks.selectedCircle.value) return false;
      return dataHooks.selectedCircle.value.activation === 'activated';
    });

    // Create action handlers with proper context
    const handleColorSelect = (colorValue, isCtrlClick) => {
      console.log('handleColorSelect: ' + colorValue);
      const colorInfo = { color: colorValue };
      actionHooks.selectColor(colorInfo, isCtrlClick, dataHooks.selectedCircle.value, dataHooks.circleColors.value);
      if (!isCtrlClick) {
        pickerHooks.closePickerAction('color');
      }
    };

    const handleTypeSelect = (typeInfo) => {
      actionHooks.selectType(typeInfo, dataHooks.selectedCircle.value);
      pickerHooks.closePickerAction('type');
    };

    const handleEnergySelect = (energyId, isCtrlClick) => {
      actionHooks.selectEnergy(energyId, isCtrlClick, dataHooks.selectedCircle.value, dataHooks.circleEnergyTypes.value);
      if (!isCtrlClick) {
        pickerHooks.closePickerAction('energy');
      }
    };

    // NEW: Handle activation toggle
    const handleActivationToggle = () => {
      actionHooks.toggleActivation(dataHooks.selectedCircle.value);
    };

    const handleEmojiSelect = (attribute) => {
      console.log('handleEmojiSelect: ' + attribute);
      actionHooks.selectEmoji(attribute);
      recentEmojiHooks.addRecentEmoji(attribute);
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
      pickerHooks.closePickerAction('emoji');
    };

    const handleCircleEmojiSelect = (emoji) => {
      actionHooks.selectCircleEmoji(emoji.emoji, dataHooks.selectedCircle.value);
      pickerHooks.closePickerAction('circleEmoji');
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
      isCircleEmojiPickerVisible,
      isCircleActivated, // NEW: Expose activation state
      
      // Action handlers
      handleColorSelect,
      handleTypeSelect,
      handleEnergySelect,
      handleActivationToggle, // NEW: Expose activation toggle handler
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
      activationDisplayRefTemplate, // NEW: Expose activation display ref
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
    ActivationControl, // NEW: Include activation control
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

        <!-- NEW: Activation Control -->
        <ActivationControl 
            ref="activationDisplayRefTemplate"
            :isActivated="isCircleActivated"
            @toggle="handleActivationToggle"
        />

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
        
        <!-- Emoji Picker Modal -->
        <EmojiPickerModal 
            v-if="isEmojiPickerOpen"
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
