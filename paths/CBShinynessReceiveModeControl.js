// CBShinynessReceiveModeControl.js - Toggle control for circle shinynessReceiveMode (3 states)
export const CBShinynessReceiveModeControl = {
  props: {
    shinynessReceiveMode: {
      type: String,
      required: true,
      validator: (value) => ['or', 'and', 'explosiveAnd'].includes(value)
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    shinynessIcon() {
      const icons = {
        or: '➕',
        and: '✖️',
        explosiveAnd: '🎆'
      };
      return icons[this.shinynessReceiveMode];
    },
    
    shinynessLabel() {
      const labels = {
        or: 'Or Mode',
        and: 'And Mode', 
        explosiveAnd: 'Explosive And Mode'
      };
      return labels[this.shinynessReceiveMode];
    },
    
    shinynessTitle() {
      const descriptions = {
        or: 'Or Mode - Click to cycle to And Mode',
        and: 'And Mode - Click to cycle to Explosive And Mode',
        explosiveAnd: 'Explosive And Mode - Click to cycle to Or Mode'
      };
      return descriptions[this.shinynessReceiveMode];
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
