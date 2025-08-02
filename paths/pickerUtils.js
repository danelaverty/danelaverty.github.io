export const usePickerPositioning = () => {
  const positionPicker = (pickerEl, displayEl, pickerWidth, pickerHeight) => {
    const displayRect = displayEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = displayRect.left;
    let top = displayRect.bottom + 10;
    
    // Adjust if picker would go off screen
    if (left + pickerWidth > viewportWidth - 10) {
      left = viewportWidth - pickerWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }
    
    if (top + pickerHeight > viewportHeight - 10) {
      top = displayRect.top - pickerHeight - 10;
    }
    if (top < 10) {
      top = 10;
    }
    
    pickerEl.style.left = left + 'px';
    pickerEl.style.top = top + 'px';
  };

  return {
    positionPicker
  };
};
