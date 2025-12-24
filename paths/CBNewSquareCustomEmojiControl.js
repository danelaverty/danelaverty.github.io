// CBNewSquareCustomEmojiControl.js - Control for creating squares with custom emoji selection
import { EmojiRenderer } from './EmojiRenderer.js';

export const NewSquareCustomEmojiControl = {
  props: {
    isPickerOpen: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['toggle'],

  components: {
    EmojiRenderer
  },
  
  template: `
    <!-- New Square Custom Emoji Control -->
    <div class="characteristic-control"
         @click="$emit('toggle')"
         :title="'Create square with custom emoji'"
         :style="{ backgroundColor: 'rgba(60, 60, 60, 0.8)' }">
        <div class="emoji-display">
            <span style="font-size: 18px; color: white;">...</span>
        </div>
    </div>
  `
};
