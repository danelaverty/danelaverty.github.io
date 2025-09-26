// CBShinynessReceiveModeControl.js - Toggle control for circle shinynessReceiveMode (3 states)

export const SHINYNESS_RECEIVE_MODE_CONFIG = {
  'or': { icon: '➕', label: 'Or Mode', description: 'Or Mode - Click to cycle to Explosive Or Mode' },
  'explosiveOr': { icon: '🎆', label: 'Explosive Or Mode', description: 'Explosive Or Mode - Click to cycle to And Mode' },
  'and': { icon: '✖️', label: 'And Mode', description: 'And Mode - Click to cycle to Explosive And Mode' },
  'explosiveAnd': { icon: '🎇', label: 'Explosive And Mode', description: 'Explosive And Mode - Click to cycle to Or Mode', default: true }
};

// Utility functions
export const getShinynessReceiveModeValues = () => Object.keys(SHINYNESS_RECEIVE_MODE_CONFIG);

export const getShinynessReceiveModeDefault = () => {
  return Object.keys(SHINYNESS_RECEIVE_MODE_CONFIG).find(key => 
    SHINYNESS_RECEIVE_MODE_CONFIG[key].default
  ) || Object.keys(SHINYNESS_RECEIVE_MODE_CONFIG)[0];
};

export const cycleShinynessReceiveMode = (currentValue) => {
  const values = getShinynessReceiveModeValues();
  const currentIndex = values.indexOf(currentValue);
  return values[(currentIndex + 1) % values.length];
};

export const CBShinynessReceiveModeControl = {
    props: {
        shinynessReceiveMode: {
            type: String,
            required: true,
            validator: (value) => getShinynessReceiveModeValues().includes(value)
        }
    },

    emits: ['cycle'],

    computed: {
        shinynessIcon() {
            return SHINYNESS_RECEIVE_MODE_CONFIG[this.shinynessReceiveMode].icon;
        },
        shinynessLabel() {
            return SHINYNESS_RECEIVE_MODE_CONFIG[this.shinynessReceiveMode].label;
        },
        shinynessTitle() {
            return SHINYNESS_RECEIVE_MODE_CONFIG[this.shinynessReceiveMode].description;
        }
    },

    template: `
    <div class="characteristic-control">
        <div 
            :class="['shinyness-receive-mode-display', shinynessReceiveMode]"
            @click="$emit('cycle')"
            style="cursor: pointer;"
            :title="shinynessTitle"
        >
            <div class="shinyness-receive-mode-icon">{{ shinynessIcon }}</div>
        </div>
    </div>
  `
};
