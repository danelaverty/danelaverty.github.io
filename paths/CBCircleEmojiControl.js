// controls/CircleEmojiControl.js
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
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['emoji-display', { 'picker-open': isPickerOpen }]"
            @click="$emit('toggle')"
            style="background-color: transparent; border: none; cursor: pointer;"
            :title="'Circle Emoji: ' + (selectedCircle.emoji || '🧑🏼')"
        >
            <div class="circle-emoji-display">{{ selectedCircle.emoji || '🧑🏼' }}</div>
        </div>
    </div>
  `
};

