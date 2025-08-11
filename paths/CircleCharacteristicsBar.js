// CircleCharacteristicsBar.js - Main component (refactored with template refs)
import { computed, ref, watchEffect } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarActions } from './useCharacteristicsBarActions.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { useRecentEmojis } from './useRecentEmojis.js';
import { useDataStore } from './dataCoordinator.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiService } from './emojiService.js';
import { getEnergyTypeColor } from './energyTypes.js';

// Import styles
import { baseCharacteristicsStyles, displayStyles, colorStyles, typeStyles, energyStyles, emojiStyles } from './cbBaseStyles.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';

// Import sub-components
import { TypeControl } from './CBTypeControl.js';
import { CircleEmojiControl } from './CBCircleEmojiControl.js';
import { ColorControl } from './CBColorControl.js';
import { EnergyControl } from './CBEnergyControl.js';
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
        console.log('Type display template ref assigned, updating picker hook');
        pickerHooks.typeDisplayRef.value = typeDisplayRefTemplate.value.$el || typeDisplayRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (circleEmojiDisplayRefTemplate.value) {
        console.log('Circle emoji display template ref assigned, updating picker hook');
        pickerHooks.circleEmojiDisplayRef.value = circleEmojiDisplayRefTemplate.value.$el || circleEmojiDisplayRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (colorDisplayRefTemplate.value) {
        console.log('Color display template ref assigned, updating picker hook');
        pickerHooks.colorDisplayRef.value = colorDisplayRefTemplate.value.$el || colorDisplayRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (energyDisplayRefTemplate.value) {
        console.log('Energy display template ref assigned, updating picker hook');
        pickerHooks.energyDisplayRef.value = energyDisplayRefTemplate.value.$el || energyDisplayRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (emojiDisplayRefTemplate.value) {
        console.log('Emoji display template ref assigned, updating picker hook');
        pickerHooks.emojiDisplayRef.value = emojiDisplayRefTemplate.value.$el || emojiDisplayRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (typePickerRefTemplate.value) {
        console.log('Type picker template ref assigned, updating picker hook');
        pickerHooks.typePickerRef.value = typePickerRefTemplate.value.$el || typePickerRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (circleEmojiPickerRefTemplate.value) {
        console.log('Circle emoji picker template ref assigned, updating picker hook');
        pickerHooks.circleEmojiPickerRef.value = circleEmojiPickerRefTemplate.value.$el || circleEmojiPickerRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (colorPickerRefTemplate.value) {
        console.log('Color picker template ref assigned, updating picker hook');
        pickerHooks.colorPickerRef.value = colorPickerRefTemplate.value.$el || colorPickerRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (energyPickerRefTemplate.value) {
        console.log('Energy picker template ref assigned, updating picker hook');
        pickerHooks.energyPickerRef.value = energyPickerRefTemplate.value.$el || energyPickerRefTemplate.value;
      }
    });

    watchEffect(() => {
      if (emojiPickerRefTemplate.value) {
        console.log('Emoji picker template ref assigned, updating picker hook');
        pickerHooks.emojiPickerRef.value = emojiPickerRefTemplate.value.$el || emojiPickerRefTemplate.value;
      }
    });

    // Extract specific values we need
    const { emojiAttributes } = dataHooks;

    const causeEmoji = computed(() => {
      return emojiAttributes.value.find(attr => attr.key === 'cause') || emojiAttributes.value[0];
    });
    
    const meEmoji = computed(() => {
      return emojiAttributes.value.find(attr => attr.key === 'me') || emojiAttributes.value[0];
    });

    // Check if circle emoji picker should be visible
    const isCircleEmojiPickerVisible = computed(() => {
      return dataHooks.selectedCircle.value && dataHooks.selectedCircle.value.type === 'emoji';
    });

    // Create action handlers with proper context
    const handleColorSelect = (colorValue, isCtrlClick) => {
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

    const handleEmojiSelect = (attribute) => {
      actionHooks.selectEmoji(attribute);
      recentEmojiHooks.addRecentEmoji(attribute);
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
      pickerHooks.closePickerAction('emoji');
    };

    const handleCircleEmojiSelect = (emoji) => {
      actionHooks.selectCircleEmoji(emoji, dataHooks.selectedCircle.value);
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
      console.log(`Loaded ${categoryGroup.emojis.length} emojis from "${categoryGroup.category.name}" category to recent palette`);
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
      meEmoji,
      isCircleEmojiPickerVisible,
      
      // Action handlers
      handleColorSelect,
      handleTypeSelect,
      handleEnergySelect,
      handleEmojiSelect,
      handleCircleEmojiSelect,
      handleQuickEmojiSelect,
      handleCategorySelect,
      handleClearRecentEmojis,
      
      // Utilities
      getEmojiDisplayTitle,
      getEnergyTypeColor,
      
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
      emojiPickerRefTemplate
    };
  },
  
  components: {
    EmojiRenderer,
    TypeControl,
    CircleEmojiControl,
    ColorControl,
    EnergyControl,
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

        <!-- Emoji Control -->
        <EmojiControl 
            ref="emojiDisplayRefTemplate"
            :causeEmoji="causeEmoji"
            :meEmoji="meEmoji"
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
