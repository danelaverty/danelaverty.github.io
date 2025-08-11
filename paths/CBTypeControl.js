// controls/TypeControl.js - Updated
export const TypeControl = {
  props: {
    currentTypeInfo: {
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
            :class="['type-display', { 'picker-open': isPickerOpen }]"
            @click="$emit('toggle')"
            style="background-color: transparent; border: none; cursor: pointer;"
        >
            <div class="type-icon">{{ currentTypeInfo.icon }}</div>
        </div>
    </div>
  `
};
