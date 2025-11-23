// controls/CBSecondaryNameControl.js
export const CBSecondaryNameControl = {
  props: {
    secondaryName: {
      type: String,
      default: ''
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
            <span class="secondary-name-placeholder" style="color: #999; font-style: italic; font-size: 12px;">2nd Name</span>
    </div>
  `
};
