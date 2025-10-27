// CBConnectionEnergyControl.js - Control for explicit connection energy types
export const CBConnectionEnergyControl = {
  props: {
    connectionEnergyTypes: {
      type: Array,
      required: true,
      default: () => []
    },
    isPickerOpen: {
      type: Boolean,
      default: false
    },
    getEnergyTypeColor: {
      type: Function,
      required: true
    }
  },
  
  emits: ['toggle'],
  
  computed: {
    displayTitle() {
      if (this.connectionEnergyTypes.length === 0) {
        return 'Connection Energy Types: None - Click to select';
      }
      return `Connection Energy Types: ${this.connectionEnergyTypes.join(', ')}`;
    },
    
    // Get colors for the selected energy types
    energyColors() {
      return this.connectionEnergyTypes.map(type => this.getEnergyTypeColor(type));
    }
  },
  
  methods: {
    handleClick() {
      this.$emit('toggle');
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['energy-display', 'connection-energy', { 'picker-open': isPickerOpen }]"
            @click="handleClick"
            :title="displayTitle"
        >
            <!-- Energy icon -->
            <div style="color: white; font-size: 14px;">⚡</div>
        </div>
    </div>
  `
};
