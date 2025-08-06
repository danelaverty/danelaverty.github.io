// CircleCharacteristicsBar.js - Updated to use centralized EmojiRenderer consistently
import { computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';
import { componentStyles } from './characteristicsBarStyles.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarActions } from './useCharacteristicsBarActions.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { useRecentEmojis } from './useRecentEmojis.js';
import { useDataStore } from './dataCoordinator.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiService } from './emojiService.js';

// Inject component styles
injectComponentStyles('circle-characteristics-bar', componentStyles);

export const CircleCharacteristicsBar = {
  setup() {
    const dataStore = useDataStore();

    const causeEmoji = computed(() => {
	    return emojiAttributes.value.find(attr => attr.key === 'cause') || emojiAttributes.value[0];
    });
    
    // Get data and computed values
    const {
      selectedCircle,
      isVisible,
      circleColors,
      circleType,
      currentTypeInfo,
      emojiAttributes,
      emojisByCategory,
      colorFamilies,
      circleTypes,
      isColorSelected,
      isTypeSelected,
      findColorInfo
    } = useCharacteristicsBarData();

    // Get action handlers
    const {
      selectColor,
      selectType,
      selectEmoji
    } = useCharacteristicsBarActions();

    // Get picker state and handlers
    const {
      isColorPickerOpen,
      isTypePickerOpen,
      isEmojiPickerOpen,
      colorPickerRef,
      typePickerRef,
      emojiPickerRef,
      colorDisplayRef,
      typeDisplayRef,
      emojiDisplayRef,
      toggleColorPicker,
      toggleTypePicker,
      toggleEmojiPicker,
      closePickerAction
    } = useCharacteristicsBarPickers();

    // Get recent emojis functionality
    const {
      recentEmojis,
      addRecentEmoji,
      clearRecentEmojis,
      loadCategoryToRecent
    } = useRecentEmojis();

    // Handle clear recent emojis with persistence
    const handleClearRecentEmojis = () => {
      clearRecentEmojis();
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
    };

    // Handle category name click to load all emojis from that category
    const handleCategorySelect = (categoryGroup) => {
      loadCategoryToRecent(categoryGroup.emojis);
      
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
      
      console.log(`Loaded ${categoryGroup.emojis.length} emojis from "${categoryGroup.category.name}" category to recent palette`);
    };

    // Wrapper functions to pass required data to actions
    const handleColorSelect = (colorValue, isCtrlClick) => {
      // Create a color info object for the new structure
      const colorInfo = { color: colorValue };
      selectColor(colorInfo, isCtrlClick, selectedCircle.value, circleColors.value);
      if (!isCtrlClick) {
        closePickerAction('color');
      }
    };

    const handleTypeSelect = (typeInfo) => {
      selectType(typeInfo, selectedCircle.value);
      closePickerAction('type');
    };

    const handleEmojiSelect = (attribute) => {
      selectEmoji(attribute);
      addRecentEmoji(attribute);
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
      closePickerAction('emoji');
    };

    // Handle quick emoji selection from recent palette
    const handleQuickEmojiSelect = (attribute) => {
  selectEmoji(attribute);
  // Only add to recent emojis if it's not the cause emoji
  if (attribute.key !== 'cause') {
    addRecentEmoji(attribute);
  }
  if (dataStore && dataStore.saveToStorage) {
    dataStore.saveToStorage();
  }
};

    const getEmojiDisplayTitle = (emojiData, context) => {
      return EmojiService.getDisplayTitle(emojiData, context);
    };

    return {
	    causeEmoji,
      isVisible,
      selectedCircle,
      circleColors,
      circleType,
      currentTypeInfo,
      emojiAttributes,
      emojisByCategory,
      recentEmojis,
      isColorPickerOpen,
      isTypePickerOpen,
      isEmojiPickerOpen,
      colorPickerRef,
      typePickerRef,
      emojiPickerRef,
      colorDisplayRef,
      typeDisplayRef,
      emojiDisplayRef,
      colorFamilies,
      circleTypes,
      toggleColorPicker,
      toggleTypePicker,
      toggleEmojiPicker,
      selectColor: handleColorSelect,
      selectType: handleTypeSelect,
      selectEmoji: handleEmojiSelect,
      selectQuickEmoji: handleQuickEmojiSelect,
      handleCategorySelect,
      isColorSelected,
      isTypeSelected,
      findColorInfo,
      closePickerAction,
      clearRecentEmojis: handleClearRecentEmojis,
      getEmojiDisplayTitle
    };
  },
  components: {
    EmojiRenderer // Use the centralized emoji renderer
  },
  template: `
    <div :class="['circle-characteristics-bar', { hidden: !isVisible }]">
        <!-- Type Control -->
        <div class="characteristic-control">
            <div 
                ref="typeDisplayRef"
                :class="['type-display', { 'picker-open': isTypePickerOpen }]"
                @click="toggleTypePicker"
		style="background-color: transparent; border: none;"
            >
                <div class="type-icon">{{ currentTypeInfo.icon }}</div>
            </div>
        </div>

        <!-- Color Control -->
        <div class="characteristic-control">
            <div 
                ref="colorDisplayRef"
                :class="['color-display', { 'picker-open': isColorPickerOpen }]"
                @click="toggleColorPicker"
		style="background-color: transparent; border: none;"
            >
                <!-- Single color display -->
                <template v-if="circleColors.length === 1">
                    <div 
                        class="color-swatch-mini"
                        :style="{ backgroundColor: circleColors[0] }"
                    ></div>
                </template>
                
                <!-- Multiple colors display -->
                <template v-else-if="circleColors.length > 1">
                    <div 
                        v-for="(color, index) in circleColors.slice(0, 3)"
                        :key="color"
                        class="color-swatch-mini"
                        :style="{ backgroundColor: color }"
                    ></div>
                </template>
            </div>
        </div>

        <!-- Cause Emoji Control -->
        <div class="characteristic-control">
            <div class="recent-emojis-separator"></div>
	    <div
                :class="['emoji-display', 'recent-emoji-item', { 'picker-open': isEmojiPickerOpen }]"
                @click="selectQuickEmoji(causeEmoji)"
                :title="getEmojiDisplayTitle(causeEmoji, 'cause')"
    :style="{ 
        backgroundColor: causeEmoji ? causeEmoji.color : 'transparent', 
        border: 'none' 
    }"
            >
                <!-- UPDATED: Use centralized EmojiRenderer for cause emoji -->
                <EmojiRenderer 
                    v-if="causeEmoji"
                    :emoji="causeEmoji"
                    context="cause"
                    :interactive="true"
                />
            </div>
            
            <!-- Emoji Picker Trigger -->
            <div 
                ref="emojiDisplayRef"
                :class="['emoji-display', { 'picker-open': isEmojiPickerOpen }]"
                @click="toggleEmojiPicker"
                style="background-color: transparent; border: none;"
            >
                <div class="emoji-icon" style="color: white;">...</div>
            </div>
        </div>

        <!-- Recent Emojis Palette -->
        <div v-if="recentEmojis.length > 0" class="recent-emojis-container">
            <div class="recent-emojis-palette">
                <div 
                    v-for="attribute in recentEmojis.slice(0, 8)"
                    :key="'recent-' + attribute.key"
                    class="recent-emoji-item"
                    :style="{ backgroundColor: attribute.color }"
                    @click="selectQuickEmoji(attribute)"
                    :title="getEmojiDisplayTitle(attribute, 'recent')"
                >
                    <!-- UPDATED: Use centralized EmojiRenderer for recent emojis -->
                    <EmojiRenderer 
                        :emoji="attribute"
                        context="recent"
                        :interactive="true"
                    />
                </div>
                <!-- Clear recent emojis button -->
                <div 
                    class="clear-recent-button"
                    @click="clearRecentEmojis"
                    title="Clear recent emojis"
                >
                    <div class="clear-recent-icon">×</div>
                </div>
            </div>
        </div>

        <!-- Type Picker Modal -->
        <div 
            v-if="isTypePickerOpen"
            ref="typePickerRef"
            class="type-picker-modal"
            style="display: block;"
        >
            <div class="type-picker-header">
                <span>Select Circle Type</span>
                <button 
                    class="picker-close"
                    @click="closePickerAction('type')"
                >×</button>
            </div>
            
            <div class="type-list">
                <div 
                    v-for="type in circleTypes"
                    :key="type.id"
                    :class="['type-item', { selected: isTypeSelected(type.id) }]"
                    @click="selectType(type)"
                >
                    <div class="type-item-icon">{{ type.icon }}</div>
                    <div class="type-item-content">
                        <div class="type-item-name">{{ type.name }}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Color Picker Modal -->
        <div 
            v-if="isColorPickerOpen"
            ref="colorPickerRef"
            class="color-picker-modal"
            style="display: block;"
        >
            <div class="color-picker-header">
                <span>Select Color</span>
                <button 
                    class="picker-close"
                    @click="closePickerAction('color')"
                >×</button>
            </div>
            
            <div class="multi-color-instructions">
                Click to select a color. Ctrl+click to add/remove multiple colors.
            </div>
            
            <div class="color-list">
                <div 
                    v-for="family in colorFamilies"
                    :key="family.name"
                    class="color-row"
                >
                    <div class="color-swatches">
                        <div 
                            v-for="(color, colorIndex) in family.colors"
                            :key="colorIndex"
                            :class="['color-swatch', { selected: isColorSelected(color) }]"
                            :style="{ backgroundColor: color }"
                            :title="family.name + ' (' + color + ')'"
                            @click="selectColor(color, $event.ctrlKey || $event.metaKey)"
                        >
                            <div 
                                v-if="isColorSelected(color)"
                                class="characteristics-selection-indicator"
                                style="display: block;"
                            >✓</div>
                        </div>
                    </div>
                    <div class="color-name">{{ family.name }}</div>
                </div>
            </div>
        </div>
        
        <!-- Emoji Picker Modal -->
        <div 
            v-if="isEmojiPickerOpen"
            ref="emojiPickerRef"
            class="emoji-picker-modal"
            style="display: block;"
        >
            <div class="emoji-grid">
                <template v-for="categoryGroup in emojisByCategory" :key="categoryGroup.category.key">
                    <!-- Category Separator -->
                    <div class="emoji-category-separator emoji-category-clickable" 
                         @click="handleCategorySelect(categoryGroup)"
                         :title="'Click to load all ' + categoryGroup.category.name + ' emojis to recent palette'">
                        <div class="emoji-category-name">{{ categoryGroup.category.name }}</div>
                        <div class="emoji-category-line"></div>
                    </div>
                    
                    <!-- Emojis in this category -->
                    <div 
                        v-for="attribute in categoryGroup.emojis"
                        :key="attribute.key"
                        class="emoji-item"
                        :style="{ backgroundColor: attribute.color }"
                        @click="selectEmoji(attribute)"
                        :title="getEmojiDisplayTitle(attribute, 'picker')"
                    >
                        <!-- UPDATED: Use centralized EmojiRenderer for picker emojis -->
                        <EmojiRenderer 
                            :emoji="attribute"
                            context="picker"
                            :interactive="true"
                        />
                        <div class="emoji-item-name">{{ attribute.displayName }}</div>
                    </div>
                </template>
            </div>
        </div>
    </div>
  `
};
