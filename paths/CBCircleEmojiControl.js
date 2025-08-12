// controls/CircleEmojiControl.js - Updated with better variant display
export const CircleEmojiControl = {
  props: {
    selectedCircle: {
      type: Object,
      required: true
    },
    isPickerOpen: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['toggle'],
  
  computed: {
    displayEmoji() {
      // Get the emoji to display, with fallback to default person emoji
      return this.selectedCircle.emoji || '🧑🏼';
    },
    
    displayTitle() {
      // Create a more descriptive title
      const emoji = this.displayEmoji;
      return `Circle Emoji: ${emoji}`;
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['emoji-display', 'circle-emoji-display-control', { 'picker-open': isPickerOpen }]"
            @click="$emit('toggle')"
            :title="displayTitle"
        >
            <div class="circle-emoji-display">{{ displayEmoji }}</div>
        </div>
    </div>
  `
};
