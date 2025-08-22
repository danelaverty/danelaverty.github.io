// controls/CircleEmojiControl.js - Updated to handle multiple circle selection
export const CircleEmojiControl = {
  props: {
    selectedCircle: {
      type: Object,
      default: null // Allow null for multiple selection
    },
    isPickerOpen: {
      type: Boolean,
      default: false
    },
    hasMultipleCirclesSelected: {
      type: Boolean,
      default: false
    },
    selectedCircles: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['toggle'],
  
  computed: {
    displayEmoji() {
      if (this.hasMultipleCirclesSelected) {
        // For multiple selection, show a generic emoji or the first circle's emoji
        if (this.selectedCircles.length > 0) {
          const firstCircle = this.selectedCircles[0];
          return firstCircle?.emoji || '🧑🏼';
        }
        return '🧑🏼'; // Default fallback
      }
      
      // Single selection - use the selected circle's emoji
      return this.selectedCircle?.emoji || '🧑🏼';
    },
    
    displayTitle() {
      if (this.hasMultipleCirclesSelected) {
        return `Circle Emoji (${this.selectedCircles.length} circles): ${this.displayEmoji}`;
      }
      
      // Single selection title
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
