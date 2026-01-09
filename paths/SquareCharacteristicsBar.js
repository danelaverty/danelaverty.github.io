// SquareCharacteristicsBar.js - Enhanced with custom emoji square creation
import { injectComponentStyles } from './styleUtils.js';
import { useCharacteristicsBarBridge } from './useCharacteristicsBarBridge.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { NewSquareControl } from './CBNewSquareControl.js';
import { NewSquareCustomEmojiControl } from './CBNewSquareCustomEmojiControl.js';
import { RecentEmojisControl } from './CBRecentEmojisControl.js';
import { EmojiPickerModal } from './CBEmojiPickerModal.js';
import { CBNewSquareCustomEmojiPickerModal } from './CBNewSquareCustomEmojiPickerModal.js';
import { PresentationControls } from './CBPresentationControls.js';

// Import only the styles needed for emoji controls and modals
import { baseCharacteristicsStyles, emojiStyles } from './cbBaseStyles.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';

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
    NewSquareControl,
    NewSquareCustomEmojiControl,
    RecentEmojisControl,
    EmojiPickerModal,
    CBNewSquareCustomEmojiPickerModal,
      PresentationControls,
  },
  
  template: `
    <div :class="['circle-characteristics-bar', { hidden: !isVisible }]">
        <!-- Square Creation Controls -->
        
        <!-- Default Square Control -->
        <NewSquareControl 
            :ref="assignDisplayRef('emoji')"
            :causeEmoji="causeEmoji"
            :isPickerOpen="isEmojiPickerOpen"
            :getEmojiDisplayTitle="getEmojiDisplayTitle"
            @toggle="toggleEmojiPicker"
            @selectQuickEmoji="handleQuickEmojiSelect"
        />

        <!-- Custom Emoji Square Control -->
        <NewSquareCustomEmojiControl 
            :isPickerOpen="isCustomEmojiPickerOpen"
            @toggle="toggleCustomEmojiPicker"
        />

        <!-- Recent Emojis Control -->
        <RecentEmojisControl 
            v-if="recentEmojis.length > 0"
            :recentEmojis="recentEmojis"
            :getEmojiDisplayTitle="getEmojiDisplayTitle"
            @selectQuickEmoji="handleQuickEmojiSelect"
            @clearRecentEmojis="handleClearRecentEmojis"
        />
        
        <!-- Custom Emoji Picker Modal -->
        <CBNewSquareCustomEmojiPickerModal
            v-if="isCustomEmojiPickerOpen"
            @createSquareWithEmoji="handleCreateSquareWithEmoji"
            @close="closeCustomEmojiPicker"
        />

        <!-- Presentation Controls -->
        <!--PresentationControls
            :selectedSquares="selectedSquares"
            :dataStore="dataStore"
            :currentSquares="currentSquares"
        /-->
    </div>
  `
};
