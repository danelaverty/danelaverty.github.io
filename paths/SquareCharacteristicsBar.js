// SquareCharacteristicsBar.js - Renamed and simplified to handle only square-related controls
import { injectComponentStyles } from './styleUtils.js';
import { useCharacteristicsBarBridge } from './useCharacteristicsBarBridge.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiControl } from './CBEmojiControl.js';
import { RecentEmojisControl } from './CBRecentEmojisControl.js';
import { EmojiPickerModal } from './CBEmojiPickerModal.js';

// Import only the styles needed for emoji controls and modals
import { baseCharacteristicsStyles, emojiStyles } from './cbBaseStyles.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';

// Simplified styles for square controls only
const componentStyles = `
    ${baseCharacteristicsStyles}
    ${emojiStyles}
    ${modalStyles}
    ${pickerSpecificStyles}

    /* Picker modal positioning - centered on screen */
    .picker-modal {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 9999 !important;
    }
`;

// Inject component styles
injectComponentStyles('square-characteristics-bar', componentStyles);

export const SquareCharacteristicsBar = {
  setup() {
    // Use the bridge for emoji functionality
    const characteristics = useCharacteristicsBarBridge();

    // Helper function to assign refs properly
    const assignDisplayRef = (controlName) => (el) => {
      if (el) {
        characteristics.getDisplayRef(controlName).value = el.$el || el;
      }
    };
    
    const assignPickerRef = (controlName) => (el) => {
      if (el) {
        characteristics.getControlRef(controlName).value = el.$el || el;
      }
    };

    return {
      // Everything from the bridge for emoji functionality
      ...characteristics,
      
      // Helper functions
      assignDisplayRef,
      assignPickerRef,
    };
  },
  
  components: {
    EmojiRenderer,
    EmojiControl,
    RecentEmojisControl,
    EmojiPickerModal,
  },
  
  template: `
    <div :class="['circle-characteristics-bar', { hidden: !isVisible }]">
        <!-- Emoji Controls (Only Visible for Single Circle Selection) -->
        <template v-if="shouldShowEmojiControls">
            <!-- Emoji Control -->
            <EmojiControl 
                :ref="assignDisplayRef('emoji')"
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
        
        <!-- Emoji Picker Modal (Only available for single selection) -->
        <EmojiPickerModal 
            v-if="isEmojiPickerOpen && shouldShowEmojiControls"
            :ref="assignPickerRef('emoji')"
            :emojisByCategory="emojisByCategory"
            :getEmojiDisplayTitle="getEmojiDisplayTitle"
            class="picker-modal"
            @selectEmoji="handleEmojiSelect"
            @selectCategory="handleCategorySelect"
            @close="closePickerAction('emoji')"
        />
    </div>
  `
};
