// controls/ActivationControl.js - Toggle control for circle activation
export const ActivationControl = {
  props: {
    isActivated: {
      type: Boolean,
      required: true
    }
  },
  
  emits: ['toggle'],
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['activation-display', { 'activated': isActivated, 'inactive': !isActivated }]"
            @click="$emit('toggle')"
            style="cursor: pointer;"
            :title="isActivated ? 'Activated - Click to deactivate' : 'Inactive - Click to activate'"
        >
            <div class="activation-icon">{{ isActivated ? '🟢' : '⚫' }}</div>
            <div class="activation-label">{{ isActivated ? 'ON' : 'OFF' }}</div>
        </div>
    </div>
  `
};
