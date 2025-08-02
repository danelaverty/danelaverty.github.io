import { ref, onMounted, onUnmounted } from './vue-composition-api.js';
import { usePickerPositioning } from './pickerUtils.js';

export const useCharacteristicsBarPickers = () => {
  const { positionPicker } = usePickerPositioning();
  
  const isColorPickerOpen = ref(false);
  const isTypePickerOpen = ref(false);
  const isEmojiPickerOpen = ref(false);
  const colorPickerRef = ref(null);
  const typePickerRef = ref(null);
  const emojiPickerRef = ref(null);
  const colorDisplayRef = ref(null);
  const typeDisplayRef = ref(null);
  const emojiDisplayRef = ref(null);

  // Show/hide pickers
  const toggleColorPicker = () => {
    if (isTypePickerOpen.value) isTypePickerOpen.value = false;
    if (isEmojiPickerOpen.value) isEmojiPickerOpen.value = false;
    isColorPickerOpen.value = !isColorPickerOpen.value;
    
    if (isColorPickerOpen.value) {
      setTimeout(() => positionColorPicker(), 0);
    }
  };

  const toggleTypePicker = () => {
    if (isColorPickerOpen.value) isColorPickerOpen.value = false;
    if (isEmojiPickerOpen.value) isEmojiPickerOpen.value = false;
    isTypePickerOpen.value = !isTypePickerOpen.value;
    
    if (isTypePickerOpen.value) {
      setTimeout(() => positionTypePicker(), 0);
    }
  };

  const toggleEmojiPicker = () => {
    if (isColorPickerOpen.value) isColorPickerOpen.value = false;
    if (isTypePickerOpen.value) isTypePickerOpen.value = false;
    isEmojiPickerOpen.value = !isEmojiPickerOpen.value;
    
    if (isEmojiPickerOpen.value) {
      setTimeout(() => positionEmojiPicker(), 0);
    }
  };

  // Position pickers
  const positionColorPicker = () => {
    if (!colorPickerRef.value || !colorDisplayRef.value) return;
    positionPicker(colorPickerRef.value, colorDisplayRef.value, 600, 500);
  };

  const positionTypePicker = () => {
    if (!typePickerRef.value || !typeDisplayRef.value) return;
    positionPicker(typePickerRef.value, typeDisplayRef.value, 400, 400);
  };

  const positionEmojiPicker = () => {
    if (!emojiPickerRef.value || !emojiDisplayRef.value) return;
    positionPicker(emojiPickerRef.value, emojiDisplayRef.value, 700, 600);
  };

  // Close pickers when clicking outside
  const handleGlobalClick = (e) => {
    if (isColorPickerOpen.value && 
        !colorPickerRef.value?.contains(e.target) && 
        !colorDisplayRef.value?.contains(e.target)) {
      isColorPickerOpen.value = false;
    }
    if (isTypePickerOpen.value && 
        !typePickerRef.value?.contains(e.target) && 
        !typeDisplayRef.value?.contains(e.target)) {
      isTypePickerOpen.value = false;
    }
    if (isEmojiPickerOpen.value && 
        !emojiPickerRef.value?.contains(e.target) && 
        !emojiDisplayRef.value?.contains(e.target)) {
      isEmojiPickerOpen.value = false;
    }
  };

  // Handle escape key
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      if (isColorPickerOpen.value) {
        isColorPickerOpen.value = false;
      }
      if (isTypePickerOpen.value) {
        isTypePickerOpen.value = false;
      }
      if (isEmojiPickerOpen.value) {
        isEmojiPickerOpen.value = false;
      }
    }
  };

  const closePickerAction = (pickerType) => {
    switch (pickerType) {
      case 'color':
        isColorPickerOpen.value = false;
        break;
      case 'type':
        isTypePickerOpen.value = false;
        break;
      case 'emoji':
        isEmojiPickerOpen.value = false;
        break;
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick);
    document.removeEventListener('keydown', handleKeydown);
  });

  return {
    isColorPickerOpen,
    isTypePickerOpen,
    isEmojiPickerOpen,
    colorPickerRef,
    typePickerRef,
    emojiPickerRef,
    colorDisplayRef,
    typeDisplayRef,
    emojiDisplayRef,
    toggleColorPicker,
    toggleTypePicker,
    toggleEmojiPicker,
    closePickerAction
  };
};
