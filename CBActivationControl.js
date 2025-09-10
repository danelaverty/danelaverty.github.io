// controls/ActivationControl.js - Toggle control for circle activation (now with 3 states)
export const ActivationControl = {
  props: {
    activation: {
      type: String,
      required: true,
      validator: (value) => ['activated', 'inactive', 'inert'].includes(value)
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    activationIcon() {
      const icons = {
        activated: '🟢',
        inactive: '⚫',
        inert: '❌'
      };
      return icons[this.activation];
    },
    
    activationLabel() {
      const labels = {
        activated: 'Activated',
        inactive: 'Inactive', 
        inert: 'Inert'
      };
      return labels[this.activation];
    },
    
    activationTitle() {
      const descriptions = {
        activated: 'Activated - Click to cycle to Inactive',
        inactive: 'Inactive - Click to cycle to Inert',
        inert: 'Inert - Click to cycle to Activated'
      };
      return descriptions[this.activation];
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['activation-display', activation]"
            @click="$emit('cycle')"
            style="cursor: pointer;"
            :title="activationTitle"
        >
            <div class="activation-icon">{{ activationIcon }}</div>
        </div>
    </div>
  `
};
