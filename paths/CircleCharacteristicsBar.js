// Handle clear recent emojis with persistence
    const handleClearRecentEmojis = () => {
      clearRecentEmojis();
      // Trigger persistence after clearing recent emojis
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
    };// CircleCharacteristicsBar.js (Enhanced with Recent Emojis)
import { injectComponentStyles } from './styleUtils.js';
import { componentStyles } from './characteristicsBarStyles.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarActions } from './useCharacteristicsBarActions.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { useRecentEmojis } from './useRecentEmojis.js';
import { useDataStore } from './useDataStore.js';

// Inject component styles
injectComponentStyles('circle-characteristics-bar', componentStyles);

export const CircleCharacteristicsBar = {
  setup() {
    const dataStore = useDataStore();
    
    // Get data and computed values
    const {
      selectedCircle,
      isVisible,
      circleColors,
      circleType,
      currentTypeInfo,
      emojiAttributes,
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
      clearRecentEmojis
    } = useRecentEmojis();

    // Wrapper functions to pass required data to actions
    const handleColorSelect = (colorInfo, isCtrlClick) => {
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
      addRecentEmoji(attribute); // Add to recent emojis
      // Trigger persistence after updating recent emojis
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
      closePickerAction('emoji');
    };

    // Handle quick emoji selection from recent palette
    const handleQuickEmojiSelect = (attribute) => {
      selectEmoji(attribute);
      // Move to front of recent list since it was used again
      addRecentEmoji(attribute);
      // Trigger persistence after updating recent emojis
      if (dataStore && dataStore.saveToStorage) {
        dataStore.saveToStorage();
      }
    };

    return {
      isVisible,
      selectedCircle,
      circleColors,
      circleType,
      currentTypeInfo,
      emojiAttributes,
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
      isColorSelected,
      isTypeSelected,
      findColorInfo,
      closePickerAction,
      clearRecentEmojis: handleClearRecentEmojis
    };
  },
  template: `
    <div :class="['circle-characteristics-bar', { hidden: !isVisible }]">
        <!-- Type Control -->
        <div class="characteristic-control">
            <div 
                ref="typeDisplayRef"
                :class="['type-display', { 'picker-open': isTypePickerOpen }]"
                @click="toggleTypePicker"
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
                
                <!-- No color -->
                <template v-else>
                </template>
            </div>
        </div>

        <!-- Emoji Control -->
        <div class="characteristic-control">
            <div 
                ref="emojiDisplayRef"
                :class="['emoji-display', { 'picker-open': isEmojiPickerOpen }]"
                @click="toggleEmojiPicker"
            >
                <div class="emoji-icon">😀</div>
            </div>
        </div>

        <!-- Recent Emojis Palette -->
        <div v-if="recentEmojis.length > 0" class="recent-emojis-container">
            <div class="recent-emojis-separator"></div>
            <div class="recent-emojis-palette">
                <div 
                    v-for="attribute in recentEmojis.slice(0, 8)"
                    :key="'recent-' + attribute.key"
                    class="recent-emoji-item"
                    :style="{ backgroundColor: attribute.color }"
                    @click="selectQuickEmoji(attribute)"
                    :title="attribute.displayName + ' (Recent)'"
                >
                    <div 
                        class="recent-emoji-icon"
                        :style="attribute.emojiCss ? { filter: attribute.emojiCss } : {}"
                    >{{ attribute.emoji }}</div>
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
                        <div class="type-item-description">{{ type.description }}</div>
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
                            v-if="family.light"
                            :class="['color-swatch', { selected: isColorSelected(family.light.color) }]"
                            :style="{ backgroundColor: family.light.color }"
                            :title="family.light.crystal + ': ' + family.light.color"
                            @click="selectColor(family.light, $event.ctrlKey || $event.metaKey)"
                        >
                            <div 
                                v-if="isColorSelected(family.light.color)"
                                class="selection-indicator"
                                style="display: block;"
                            >✓</div>
                        </div>
                        <div 
                            v-if="family.solid"
                            :class="['color-swatch', { selected: isColorSelected(family.solid.color) }]"
                            :style="{ backgroundColor: family.solid.color }"
                            :title="family.solid.crystal + ': ' + family.solid.color"
                            @click="selectColor(family.solid, $event.ctrlKey || $event.metaKey)"
                        >
                            <div 
                                v-if="isColorSelected(family.solid.color)"
                                class="selection-indicator"
                                style="display: block;"
                            >✓</div>
                        </div>
                        <div 
                            v-if="family.dark"
                            :class="['color-swatch', { selected: isColorSelected(family.dark.color) }]"
                            :style="{ backgroundColor: family.dark.color }"
                            :title="family.dark.crystal + ': ' + family.dark.color"
                            @click="selectColor(family.dark, $event.ctrlKey || $event.metaKey)"
                        >
                            <div 
                                v-if="isColorSelected(family.dark.color)"
                                class="selection-indicator"
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
            <div class="emoji-picker-header">
                <span>Select Emoji for Square</span>
                <button 
                    class="picker-close"
                    @click="closePickerAction('emoji')"
                >×</button>
            </div>
            
            <div class="emoji-instructions">
                Click an emoji to create a new square or update selected squares.
            </div>
            
            <div class="emoji-grid">
                <div 
                    v-for="attribute in emojiAttributes"
                    :key="attribute.key"
                    class="emoji-item"
                    :style="{ backgroundColor: attribute.color }"
                    @click="selectEmoji(attribute)"
                    :title="attribute.displayName"
                >
                    <div 
                        class="emoji-item-icon"
                        :style="attribute.emojiCss ? { filter: attribute.emojiCss } : {}"
                    >{{ attribute.emoji }}</div>
                    <div class="emoji-item-name">{{ attribute.displayName }}</div>
                </div>
            </div>
        </div>
    </div>
  `
};
