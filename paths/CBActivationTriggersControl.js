// CBActivationTriggersControl.js - Toggle control for circle activation triggers

export const ACTIVATION_TRIGGERS_CONFIG = {
  'none': { icon: '🫗', label: 'None', description: 'No activation triggers - Click to cycle to Members', default: true },
  'members': { icon: '🥛', label: 'Members', description: 'Members trigger activation - Click to cycle to None' }
};

// Utility functions
export const getActivationTriggersValues = () => Object.keys(ACTIVATION_TRIGGERS_CONFIG);

export const getActivationTriggersDefault = () => {
  return Object.keys(ACTIVATION_TRIGGERS_CONFIG).find(key => 
    ACTIVATION_TRIGGERS_CONFIG[key].default
  ) || Object.keys(ACTIVATION_TRIGGERS_CONFIG)[0];
};

export const cycleActivationTriggers = (currentValue) => {
  const values = getActivationTriggersValues();
  const currentIndex = values.indexOf(currentValue);
  return values[(currentIndex + 1) % values.length];
};

export const CBActivationTriggersControl = {
  props: {
    activationTriggers: {
      type: String,
      required: true,
      validator: (value) => getActivationTriggersValues().includes(value)
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    activationTriggersIcon() {
      return ACTIVATION_TRIGGERS_CONFIG[this.activationTriggers].icon;
    },
    
    activationTriggersLabel() {
      return ACTIVATION_TRIGGERS_CONFIG[this.activationTriggers].label;
    },
    
    activationTriggersTitle() {
      return ACTIVATION_TRIGGERS_CONFIG[this.activationTriggers].description;
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
