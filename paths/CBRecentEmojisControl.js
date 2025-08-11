// controls/RecentEmojisControl.js
import { EmojiRenderer } from './EmojiRenderer.js';

export const RecentEmojisControl = {
  props: {
    recentEmojis: {
      type: Array,
      required: true
    },
    getEmojiDisplayTitle: {
      type: Function,
      required: true
    }
  },
  
  emits: ['selectQuickEmoji', 'clearRecentEmojis'],
  
  components: {
    EmojiRenderer
  },
  
  template: `
    <div class="recent-emojis-container">
        <div class="recent-emojis-palette">
            <div 
                v-for="attribute in recentEmojis.slice(0, 8)"
                :key="'recent-' + attribute.key"
                class="recent-emoji-item"
                :style="{ backgroundColor: attribute.color }"
                @click="$emit('selectQuickEmoji', attribute)"
                :title="getEmojiDisplayTitle(attribute, 'recent')"
            >
                <EmojiRenderer 
                    :emoji="attribute"
                    context="recent"
                    :interactive="true"
                />
            </div>
            
            <!-- Clear recent emojis button -->
            <div 
                class="clear-recent-button"
                @click="$emit('clearRecentEmojis')"
                title="Clear recent emojis"
            >
                <div class="clear-recent-icon">×</div>
            </div>
        </div>
    </div>
  `
};
