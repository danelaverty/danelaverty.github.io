// controls/EnergyControl.js - Simplified without displayRef prop
export const EnergyControl = {
  props: {
    circleEnergyTypes: {
      type: Array,
      required: true
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
  
  mounted() {
  },
  
  methods: {
    handleClick() {
      this.$emit('toggle');
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['energy-display', { 'picker-open': isPickerOpen }]"
            @click="handleClick"
            style="background-color: transparent; border: none; cursor: pointer;"
            :title="'Energy Types: ' + (circleEnergyTypes.length > 0 ? circleEnergyTypes.join(', ') : 'None')"
        >
            <!-- Display energy indicator dots -->
	    <div style="color: white; font-size: 16px;">⚡</div>
        </div>
    </div>
  `
};
