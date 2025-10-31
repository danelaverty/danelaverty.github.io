// useCharacteristicsBarPickers.js - Fixed version
import { ref, onMounted, onUnmounted, nextTick } from './vue-composition-api.js';
import { usePickerPositioning } from './pickerUtils.js';

export const useCharacteristicsBarPickers = () => {
  const { positionPicker } = usePickerPositioning();
  
  const isColorPickerOpen = ref(false);
  const isSecondaryColorPickerOpen = ref(false);
  const isTypePickerOpen = ref(false);
  const isEnergyPickerOpen = ref(false);
  const isEmojiPickerOpen = ref(false);
  const isCircleEmojiPickerOpen = ref(false);
  const isConnectionEnergyPickerOpen = ref(false);
  
  const colorPickerRef = ref(null);
  const secondaryColorPickerRef = ref(null);
  const typePickerRef = ref(null);
  const energyPickerRef = ref(null);
  const emojiPickerRef = ref(null);
  const circleEmojiPickerRef = ref(null);
  const connectionEnergyPickerRef = ref(null);
  
  const colorDisplayRef = ref(null);
  const secondaryColorDisplayRef = ref(null);
  const typeDisplayRef = ref(null);
  const energyDisplayRef = ref(null);
  const emojiDisplayRef = ref(null);
  const circleEmojiDisplayRef = ref(null);
  const connectionEnergyDisplayRef = ref(null);

  // Close all pickers helper
  const closeAllPickers = () => {
    isColorPickerOpen.value = false;
    isSecondaryColorPickerOpen.value = false;
    isTypePickerOpen.value = false;
    isEnergyPickerOpen.value = false;
    isCircleEmojiPickerOpen.value = false;
    isEmojiPickerOpen.value = false;
    isConnectionEnergyPickerOpen.value = false;
  };

  // Show/hide pickers with proper async handling
  const toggleColorPicker = async () => {
    closeAllPickers();
    isColorPickerOpen.value = true;
    
    if (isColorPickerOpen.value) {
      await nextTick();
      positionColorPicker();
    }
  };

const toggleSecondaryColorPicker = async () => {
  closeAllPickers();
  isSecondaryColorPickerOpen.value = true;
  
  if (isSecondaryColorPickerOpen.value) {
    await nextTick();
    positionSecondaryColorPicker();
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
    closeAllPickers();
    isEnergyPickerOpen.value = true;
    
    if (isEnergyPickerOpen.value) {
      await nextTick();
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

  const toggleConnectionEnergyPicker = async () => {
    closeAllPickers();
    isConnectionEnergyPickerOpen.value = true;
    
    if (isConnectionEnergyPickerOpen.value) {
      await nextTick();
      positionConnectionEnergyPicker();
    }
  };

  // Position pickers with better error handling
  const positionColorPicker = () => {
    if (!colorPickerRef.value || !colorDisplayRef.value) {
      console.warn('Color picker refs not available for positioning');
      return;
    }
    positionPicker(colorPickerRef.value, colorDisplayRef.value, 600, 500);
  };

const positionSecondaryColorPicker = () => {
  if (!secondaryColorPickerRef.value || !secondaryColorDisplayRef.value) {
    console.warn('Secondary color picker refs not available for positioning');
    return;
  }
  positionPicker(secondaryColorPickerRef.value, secondaryColorDisplayRef.value, 600, 500);
};

  const positionTypePicker = () => {
    if (!typePickerRef.value || !typeDisplayRef.value) {
      console.warn('Type picker refs not available for positioning');
      return;
    }
    positionPicker(typePickerRef.value, typeDisplayRef.value, 400, 400);
  };

  const positionEnergyPicker = () => {
    if (!energyPickerRef.value || !energyDisplayRef.value) {
      console.warn('Energy picker refs not available for positioning');
      return;
    }
    positionPicker(energyPickerRef.value, energyDisplayRef.value, 400, 350);
  };

  const positionEmojiPicker = () => {
    if (!emojiPickerRef.value || !emojiDisplayRef.value) {
      console.warn('Emoji picker refs not available for positioning');
      return;
    }
    positionPicker(emojiPickerRef.value, emojiDisplayRef.value, 700, 600);
  };

  const positionCircleEmojiPicker = () => {
    if (!circleEmojiPickerRef.value || !circleEmojiDisplayRef.value) {
      console.warn('Circle emoji picker refs not available for positioning');
      return;
    }
    positionPicker(circleEmojiPickerRef.value, circleEmojiDisplayRef.value, 600, 500);
  };

  const positionConnectionEnergyPicker = () => {
    if (!connectionEnergyPickerRef.value || !connectionEnergyDisplayRef.value) {
      console.warn('Connection energy picker refs not available for positioning');
      return;
    }
    positionPicker(connectionEnergyPickerRef.value, connectionEnergyDisplayRef.value, 400, 350);
  };

  // Close pickers when clicking outside
  const handleGlobalClick = (e) => {
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      
      if (isColorPickerOpen.value && 
          colorPickerRef.value && colorDisplayRef.value &&
          !colorPickerRef.value.contains(e.target) && 
          !colorDisplayRef.value.contains(e.target)) {
        isColorPickerOpen.value = false;
      }

if (isSecondaryColorPickerOpen.value && 
    secondaryColorPickerRef.value && secondaryColorDisplayRef.value &&
    !secondaryColorPickerRef.value.contains(e.target) && 
    !secondaryColorDisplayRef.value.contains(e.target)) {
  isSecondaryColorPickerOpen.value = false;
}
      
      if (isTypePickerOpen.value && 
          typePickerRef.value && typeDisplayRef.value &&
          !typePickerRef.value.contains(e.target) && 
          !typeDisplayRef.value.contains(e.target)) {
        isTypePickerOpen.value = false;
      }
      
      if (isEnergyPickerOpen.value && 
          energyPickerRef.value && energyDisplayRef.value &&
          !energyPickerRef.value.contains(e.target) && 
          !energyDisplayRef.value.contains(e.target)) {
        isEnergyPickerOpen.value = false;
      }
      
      if (isEmojiPickerOpen.value && 
          emojiPickerRef.value && emojiDisplayRef.value &&
          !emojiPickerRef.value.contains(e.target) && 
          !emojiDisplayRef.value.contains(e.target)) {
        isEmojiPickerOpen.value = false;
      }
      
      if (isCircleEmojiPickerOpen.value && 
          circleEmojiPickerRef.value && circleEmojiDisplayRef.value &&
          !circleEmojiPickerRef.value.contains(e.target) && 
          !circleEmojiDisplayRef.value.contains(e.target)) {
        isCircleEmojiPickerOpen.value = false;
      }

      if (isConnectionEnergyPickerOpen.value && 
          connectionEnergyPickerRef.value && connectionEnergyDisplayRef.value &&
          !connectionEnergyPickerRef.value.contains(e.target) && 
          !connectionEnergyDisplayRef.value.contains(e.target)) {
        isConnectionEnergyPickerOpen.value = false;
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
case 'secondaryColor':
  isSecondaryColorPickerOpen.value = false;
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
      case 'connectionEnergy':
        isConnectionEnergyPickerOpen.value = false;
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
    isConnectionEnergyPickerOpen,
    colorPickerRef,
    typePickerRef,
    energyPickerRef,
    emojiPickerRef,
    circleEmojiPickerRef,
    connectionEnergyPickerRef,
    colorDisplayRef,
    typeDisplayRef,
    energyDisplayRef,
    emojiDisplayRef,
    circleEmojiDisplayRef,
    connectionEnergyDisplayRef,
    toggleColorPicker,
    toggleTypePicker,
    toggleEnergyPicker,
    toggleEmojiPicker,
    toggleCircleEmojiPicker,
    toggleConnectionEnergyPicker,
    closePickerAction,
isSecondaryColorPickerOpen,
    secondaryColorPickerRef,
    secondaryColorDisplayRef,
    toggleSecondaryColorPicker,
  };
};
