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
    },
      propertyName: {
      type: String,
      default: 'emoji'
    },
  },
  
  emits: ['toggle'],
  
  computed: {
displayEmoji() {
  let propertyValue = this.selectedCircle?.[this.propertyName];
  
  // Handle case where an object was stored instead of string
  if (typeof propertyValue === 'object' && propertyValue !== null) {
    propertyValue = propertyValue.emoji || '🧽';
  }
  
  if (this.hasMultipleCirclesSelected) {
    if (this.selectedCircles.length > 0) {
      const firstCircle = this.selectedCircles[0];
      let firstValue = firstCircle?.[this.propertyName] || '🧽';
      
      // Handle object case for multiple selection too
      if (typeof firstValue === 'object' && firstValue !== null) {
        firstValue = firstValue.emoji || '🧽';
      }
      
      return firstValue;
    }
    return '🧽';
  }
  
  return propertyValue || '🧽';
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
    <div class="characteristic-control"
        @click="$emit('toggle')"
        >
        <div 
            :class="['emoji-display', 'circle-emoji-display-control', { 'picker-open': isPickerOpen }]"
            :title="displayTitle"
        >
            <div style="color: white;" class="circle-emoji-display">{{ displayEmoji }}</div>
        </div>
    </div>
  `
};
