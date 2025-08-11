// useCharacteristicsBarPickers.js - Fixed version
import { ref, onMounted, onUnmounted, nextTick } from './vue-composition-api.js';
import { usePickerPositioning } from './pickerUtils.js';

export const useCharacteristicsBarPickers = () => {
  const { positionPicker } = usePickerPositioning();
  
  const isColorPickerOpen = ref(false);
  const isTypePickerOpen = ref(false);
  const isEnergyPickerOpen = ref(false);
  const isEmojiPickerOpen = ref(false);
  const isCircleEmojiPickerOpen = ref(false);
  const colorPickerRef = ref(null);
  const typePickerRef = ref(null);
  const energyPickerRef = ref(null);
  const emojiPickerRef = ref(null);
  const circleEmojiPickerRef = ref(null);
  const colorDisplayRef = ref(null);
  const typeDisplayRef = ref(null);
  const energyDisplayRef = ref(null);
  const emojiDisplayRef = ref(null);
  const circleEmojiDisplayRef = ref(null);

  // Close all pickers helper
  const closeAllPickers = () => {
    isColorPickerOpen.value = false;
    isTypePickerOpen.value = false;
    isEnergyPickerOpen.value = false;
    isCircleEmojiPickerOpen.value = false;
    isEmojiPickerOpen.value = false;
  };

  // Show/hide pickers with proper async handling
  const toggleColorPicker = async () => {
    closeAllPickers();
    isColorPickerOpen.value = true;
    
    if (isColorPickerOpen.value) {
      await nextTick(); // Wait for DOM update
      positionColorPicker();
    }
  };

  const toggleTypePicker = async () => {
    closeAllPickers();
    isTypePickerOpen.value = true;
    
    if (isTypePickerOpen.value) {
      await nextTick();
      positionTypePicker();
    }
  };

  const toggleEnergyPicker = async () => {
    console.log('toggleEnergyPicker called');
    closeAllPickers();
    console.log('After closeAllPickers, isEnergyPickerOpen:', isEnergyPickerOpen.value);
    isEnergyPickerOpen.value = true;
    console.log('Set isEnergyPickerOpen to:', isEnergyPickerOpen.value);
    
    if (isEnergyPickerOpen.value) {
      await nextTick(); // Wait for Vue to create the modal DOM element
      console.log('After nextTick, positioning energy picker, refs:', energyPickerRef.value, energyDisplayRef.value);
      positionEnergyPicker();
    }
  };

  const toggleEmojiPicker = async () => {
    closeAllPickers();
    isEmojiPickerOpen.value = true;
    
    if (isEmojiPickerOpen.value) {
      await nextTick();
      positionEmojiPicker();
    }
  };

  const toggleCircleEmojiPicker = async () => {
    closeAllPickers();
    isCircleEmojiPickerOpen.value = true;
    
    if (isCircleEmojiPickerOpen.value) {
      await nextTick();
      positionCircleEmojiPicker();
    }
  };

  // Position pickers with better error handling
  const positionColorPicker = () => {
    console.log('Positioning color picker, refs:', colorPickerRef.value, colorDisplayRef.value);
    if (!colorPickerRef.value || !colorDisplayRef.value) {
      console.warn('Color picker refs not available for positioning');
      return;
    }
    positionPicker(colorPickerRef.value, colorDisplayRef.value, 600, 500);
  };

  const positionTypePicker = () => {
    console.log('Positioning type picker, refs:', typePickerRef.value, typeDisplayRef.value);
    if (!typePickerRef.value || !typeDisplayRef.value) {
      console.warn('Type picker refs not available for positioning');
      return;
    }
    positionPicker(typePickerRef.value, typeDisplayRef.value, 400, 400);
  };

  const positionEnergyPicker = () => {
    console.log('Positioning energy picker, refs:', energyPickerRef.value, energyDisplayRef.value);
    if (!energyPickerRef.value || !energyDisplayRef.value) {
      console.warn('Energy picker refs not available for positioning');
      return;
    }
    positionPicker(energyPickerRef.value, energyDisplayRef.value, 400, 350);
  };

  const positionEmojiPicker = () => {
    console.log('Positioning emoji picker, refs:', emojiPickerRef.value, emojiDisplayRef.value);
    if (!emojiPickerRef.value || !emojiDisplayRef.value) {
      console.warn('Emoji picker refs not available for positioning');
      return;
    }
    positionPicker(emojiPickerRef.value, emojiDisplayRef.value, 700, 600);
  };

  const positionCircleEmojiPicker = () => {
    console.log('Positioning circle emoji picker, refs:', circleEmojiPickerRef.value, circleEmojiDisplayRef.value);
    if (!circleEmojiPickerRef.value || !circleEmojiDisplayRef.value) {
      console.warn('Circle emoji picker refs not available for positioning');
      return;
    }
    positionPicker(circleEmojiPickerRef.value, circleEmojiDisplayRef.value, 600, 500);
  };

  // Close pickers when clicking outside
  const handleGlobalClick = (e) => {
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      console.log('Global click handler, target:', e.target.className);
      
      if (isColorPickerOpen.value && 
          colorPickerRef.value && colorDisplayRef.value &&
          !colorPickerRef.value.contains(e.target) && 
          !colorDisplayRef.value.contains(e.target)) {
        console.log('Closing color picker');
        isColorPickerOpen.value = false;
      }
      
      if (isTypePickerOpen.value && 
          typePickerRef.value && typeDisplayRef.value &&
          !typePickerRef.value.contains(e.target) && 
          !typeDisplayRef.value.contains(e.target)) {
        console.log('Closing type picker');
        isTypePickerOpen.value = false;
      }
      
      if (isEnergyPickerOpen.value && 
          energyPickerRef.value && energyDisplayRef.value &&
          !energyPickerRef.value.contains(e.target) && 
          !energyDisplayRef.value.contains(e.target)) {
        console.log('Closing energy picker');
        isEnergyPickerOpen.value = false;
      }
      
      if (isEmojiPickerOpen.value && 
          emojiPickerRef.value && emojiDisplayRef.value &&
          !emojiPickerRef.value.contains(e.target) && 
          !emojiDisplayRef.value.contains(e.target)) {
        console.log('Closing emoji picker');
        isEmojiPickerOpen.value = false;
      }
      
      if (isCircleEmojiPickerOpen.value && 
          circleEmojiPickerRef.value && circleEmojiDisplayRef.value &&
          !circleEmojiPickerRef.value.contains(e.target) && 
          !circleEmojiDisplayRef.value.contains(e.target)) {
        console.log('Closing circle emoji picker');
        isCircleEmojiPickerOpen.value = false;
      }
    });
  };

  // Handle escape key
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeAllPickers();
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
      case 'energy':
        isEnergyPickerOpen.value = false;
        break;
      case 'emoji':
        isEmojiPickerOpen.value = false;
        break;
      case 'circleEmoji':
        isCircleEmojiPickerOpen.value = false;
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
    isEnergyPickerOpen,
    isEmojiPickerOpen,
    isCircleEmojiPickerOpen,
    colorPickerRef,
    typePickerRef,
    energyPickerRef,
    emojiPickerRef,
    circleEmojiPickerRef,
    colorDisplayRef,
    typeDisplayRef,
    energyDisplayRef,
    emojiDisplayRef,
    circleEmojiDisplayRef,
    toggleColorPicker,
    toggleTypePicker,
    toggleEnergyPicker,
    toggleEmojiPicker,
    toggleCircleEmojiPicker,
    closePickerAction
  };
};
