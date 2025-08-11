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
    console.log('EnergyControl mounted - using template ref approach');
    console.log('  - this.$el:', this.$el);
  },
  
  methods: {
    handleClick() {
      console.log('Energy control clicked, isPickerOpen:', this.isPickerOpen);
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
            <template v-if="circleEnergyTypes.length === 0">
                <div style="color: white; font-size: 16px;">⚡</div>
            </template>
            <template v-else>
                <div 
                    v-for="energyType in circleEnergyTypes.slice(0, 3)"
                    :key="energyType"
                    class="energy-indicator-dot"
                    :style="{ backgroundColor: getEnergyTypeColor(energyType) }"
                ></div>
                <div v-if="circleEnergyTypes.length > 3" class="energy-count">
                    +{{ circleEnergyTypes.length - 3 }}
                </div>
            </template>
        </div>
    </div>
  `
};
