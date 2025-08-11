// pickers/ColorPickerModal.js
export const ColorPickerModal = {
  props: {
    colorFamilies: {
      type: Array,
      required: true
    },
    isColorSelected: {
      type: Function,
      required: true
    }
  },
  
  emits: ['selectColor', 'close'],
  
  template: `
    <div 
        class="color-picker-modal"
        style="display: block;"
    >
        <div class="color-picker-header">
            <span>Select Color</span>
            <button 
                class="picker-close"
                @click="$emit('close')"
            >×</button>
        </div>
        
        <div class="multi-color-instructions">
            Click to select a color. Ctrl+click to add/remove multiple colors.
        </div>
        
        <div class="color-list">
            <div 
                v-for="family in colorFamilies"
                :key="family.name"
                class="color-row"
            >
                <div class="color-swatches">
                    <div 
                        v-for="(color, colorIndex) in family.colors"
                        :key="colorIndex"
                        :class="['color-swatch', { selected: isColorSelected(color) }]"
                        :style="{ backgroundColor: color }"
                        :title="family.name + ' (' + color + ')'"
                        @click="$emit('selectColor', color, $event.ctrlKey || $event.metaKey)"
                    >
                        <div 
                            v-if="isColorSelected(color)"
                            class="characteristics-selection-indicator"
                            style="display: block;"
                        >✓</div>
                    </div>
                </div>
                <div class="color-name">{{ family.name }}</div>
            </div>
        </div>
    </div>
  `
};
