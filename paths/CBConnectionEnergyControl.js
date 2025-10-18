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
            style="background-color: transparent; border: 1px solid #666; border-radius: 3px; padding: 4px 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;"
            :title="displayTitle"
        >
            <!-- Energy icon -->
            <div style="color: white; font-size: 14px;">⚡</div>
            
            <!-- Energy type indicators (colored dots) -->
            <div style="display: flex; gap: 2px; align-items: center;">
                <div 
                    v-for="(color, index) in energyColors"
                    :key="index"
                    style="width: 8px; height: 8px; border-radius: 50%;"
                    :style="{ backgroundColor: color }"
                ></div>
                <span v-if="connectionEnergyTypes.length === 0" style="color: #999; font-size: 12px; margin-left: 2px;">
                    None
                </span>
            </div>
        </div>
    </div>
  `
};
