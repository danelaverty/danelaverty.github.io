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
