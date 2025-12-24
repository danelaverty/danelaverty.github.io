// CBNewSquareCustomEmojiPickerModal.js - Modal for creating squares with custom emoji selection
import { CircleEmojiPickerModal } from './CBCircleEmojiPickerModal.js';

export const CBNewSquareCustomEmojiPickerModal = {
  emits: ['createSquareWithEmoji', 'close'],
  
  components: {
    CircleEmojiPickerModal
  },
  
  methods: {
    handleEmojiSelection(emoji) {
      // Emit the emoji selection to create a square with this emoji
      this.$emit('createSquareWithEmoji', emoji);
      // Close the modal after selection
      this.$emit('close');
    },
    
    handleClose() {
      // Just close the modal without creating anything
      this.$emit('close');
    }
  },
  
  template: `
    <CircleEmojiPickerModal
      entityType="square"
      currentEmoji=""
      @selectCircleEmoji="handleEmojiSelection"
      @close="handleClose"
    />
  `
};
