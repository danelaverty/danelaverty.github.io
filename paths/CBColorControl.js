// controls/ColorControl.js
export const ColorControl = {
  props: {
    circleColors: {
      type: Array,
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
            :class="['color-display', { 'picker-open': isPickerOpen }]"
            @click="$emit('toggle')"
            style="background-color: transparent; border: none; cursor: pointer;"
        >
            <!-- Single color display -->
            <template v-if="circleColors.length === 1">
                <div 
                    class="color-swatch-mini"
                    :style="{ backgroundColor: circleColors[0] }"
                ></div>
            </template>
            
            <!-- Multiple colors display -->
            <template v-else-if="circleColors.length > 1">
                <div 
                    v-for="(color, index) in circleColors.slice(0, 3)"
                    :key="color"
                    class="color-swatch-mini"
                    :style="{ backgroundColor: color }"
                ></div>
            </template>
        </div>
    </div>
  `
};
