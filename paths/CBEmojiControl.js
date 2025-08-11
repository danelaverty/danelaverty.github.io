// controls/EmojiControl.js
import { EmojiRenderer } from './EmojiRenderer.js';

export const EmojiControl = {
  props: {
    causeEmoji: {
      type: Object,
      required: true
    },
    meEmoji: {
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
    <div class="characteristic-control">
        <div class="recent-emojis-separator"></div>
        
        <!-- Cause Emoji -->
        <div
            :class="['emoji-display', 'recent-emoji-item', { 'picker-open': isPickerOpen }]"
            @click="$emit('selectQuickEmoji', causeEmoji)"
            :title="getEmojiDisplayTitle(causeEmoji, 'cause')"
            :style="{ 
                backgroundColor: causeEmoji ? causeEmoji.color : 'transparent', 
                border: 'none' 
            }"
        >
            <EmojiRenderer 
                v-if="causeEmoji"
                :emoji="causeEmoji"
                context="cause"
                :interactive="true"
            />
        </div>
        
        <!-- Me Emoji -->
        <div
            :class="['emoji-display', 'recent-emoji-item', { 'picker-open': isPickerOpen }]"
            @click="$emit('selectQuickEmoji', meEmoji)"
            :title="getEmojiDisplayTitle(meEmoji, 'me')"
            :style="{ 
                backgroundColor: meEmoji ? meEmoji.color : 'transparent', 
                border: 'none' 
            }"
        >
            <EmojiRenderer 
                v-if="meEmoji"
                :emoji="meEmoji"
                context="me"
                :interactive="true"
            />
        </div>
        
        <!-- Emoji Picker Trigger -->
        <div 
            :class="['emoji-display', { 'picker-open': isPickerOpen }]"
            @click="$emit('toggle')"
            style="background-color: transparent; border: none; cursor: pointer;"
        >
            <div class="emoji-icon" style="color: white;">...</div>
        </div>
    </div>
  `
};
