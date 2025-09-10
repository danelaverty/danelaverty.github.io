// controls/CBActivationTriggersControl.js - Toggle control for circle activation triggers
export const CBActivationTriggersControl = {
  props: {
    activationTriggers: {
      type: String,
      required: true,
      validator: (value) => ['none', 'members'].includes(value)
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    activationTriggersIcon() {
      const icons = {
        none: '🫗',
        members: '🥛'
      };
      return icons[this.activationTriggers];
    },
    
    activationTriggersLabel() {
      const labels = {
        none: 'None',
        members: 'Members'
      };
      return labels[this.activationTriggers];
    },
    
    activationTriggersTitle() {
      const descriptions = {
        none: 'No activation triggers - Click to cycle to Members',
        members: 'Members trigger activation - Click to cycle to None'
      };
      return descriptions[this.activationTriggers];
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['activation-triggers-display', activationTriggers]"
            @click="$emit('cycle')"
            style="cursor: pointer;"
            :title="activationTriggersTitle"
        >
            <div class="activation-triggers-icon">{{ activationTriggersIcon }}</div>
        </div>
    </div>
  `
};
