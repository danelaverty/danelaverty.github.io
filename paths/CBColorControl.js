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
    <div class="characteristic-control"
        @click="$emit('toggle')"
        >
        <div 
            :class="['color-display', { 'picker-open': isPickerOpen }]"
            style="background-color: transparent; border: none; cursor: pointer;"
        >
            <!-- Single color display -->
            <template v-if="circleColors.length === 1">
                <div 
                    class="color-swatch-mini"
                    :style="{ backgroundColor: circleColors[0] }"
                ></div>
            </template>
            
            <!-- Multiple colors display with stacked card effect -->
            <template v-else-if="circleColors.length > 1">
                <div class="color-stack-container">
                    <div 
                        v-for="(color, index) in circleColors.slice(0, 3)"
                        :key="color"
                        class="color-swatch-mini color-swatch-stacked"
                        :style="{ 
                            backgroundColor: color,
                            top: (index * 3) + 'px',
                            left: (index * 3) + 'px',
                            zIndex: circleColors.length - index
                        }"
                    ></div>
                </div>
            </template>
            
            <!-- Multiple circles selected (when circleColors is empty) -->
            <template v-else>
                <div 
                    class="color-swatch-mini"
                    style="background-color: #ff0000;"
                ></div>
            </template>
        </div>
    </div>
  `
};
