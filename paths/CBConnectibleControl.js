// CBConnectibleControl.js - Control for circle connectible property
export const CBConnectibleControl = {
  props: {
    connectible: {
      type: String,
      required: true,
      validator: (value) => ['receives', 'gives', 'refuses'].includes(value)
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    connectibleIcon() {
      const icons = {
        receives: '⚍',
        gives: '⚌', 
        refuses: '⚏'
      };
      return icons[this.connectible];
    },
    
    connectibleLabel() {
      const labels = {
        receives: 'Receives',
        gives: 'Gives',
        refuses: 'Refuses'
      };
      return labels[this.connectible];
    },
    
    connectibleTitle() {
      const descriptions = {
        receives: 'Receives connections - Click to cycle to Gives',
        gives: 'Gives connections - Click to cycle to Refuses',
        refuses: 'Refuses connections - Click to cycle to Receives'
      };
      return descriptions[this.connectible];
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['connectible-display', connectible]"
            @click="$emit('cycle')"
            style="cursor: pointer;"
            :title="connectibleTitle"
        >
            <div class="connectible-icon">{{ connectibleIcon }}</div>
        </div>
    </div>
  `
};
