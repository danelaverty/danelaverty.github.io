// controls/EmojiControl.js
import { EmojiRenderer } from './EmojiRenderer.js';

export const EmojiControl = {
  props: {
    causeEmoji: {
      type: Object,
      required: true
    },
    isPickerOpen: {
      type: Boolean,
      default: false
    },
    getEmojiDisplayTitle: {
      type: Function,
      required: true
    }
  },
  
  emits: ['toggle', 'selectQuickEmoji'],
  
  components: {
    EmojiRenderer
  },
  
  template: `
    <!-- Emoji Separator (as a spacer, not a control) -->
    <div style="width: 2px; height: 32px; background-color: rgba(255, 255, 255, 0.2); border-radius: 1px; margin: 0 4px; flex-shrink: 0;"></div>
    
    <!-- Cause Emoji Control -->
    <div class="characteristic-control"
         @click="$emit('selectQuickEmoji', causeEmoji)"
         :title="getEmojiDisplayTitle(causeEmoji, 'cause')"
         :style="{ backgroundColor: causeEmoji ? causeEmoji.color : 'rgba(40, 40, 40, 0.8)' }">
        <div class="emoji-display">
            <EmojiRenderer 
                v-if="causeEmoji"
                :emoji="causeEmoji"
                context="cause"
                :interactive="true"
            />
        </div>
    </div>
    
    <!-- Emoji Picker Trigger Control -->
    <div class="characteristic-control" 
         @click="$emit('toggle')"
         :class="{ 'picker-open': isPickerOpen }">
        <div class="emoji-display">
            <div class="emoji-icon">...</div>
        </div>
    </div>
  `
};
