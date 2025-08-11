// pickers/EnergyPickerModal.js - Simplified without pickerRef prop
export const EnergyPickerModal = {
  props: {
    energyTypes: {
      type: Array,
      required: true
    },
    isEnergySelected: {
      type: Function,
      required: true
    }
  },
  
  emits: ['selectEnergy', 'close'],
  
  mounted() {
    console.log('EnergyPickerModal mounted - using template ref approach');
    console.log('  - this.$el:', this.$el);
  },
  
  template: `
    <div 
        class="energy-picker-modal"
        style="display: block;"
    >
        <div class="energy-picker-header">
            <span>Select Energy Types</span>
            <button 
                class="picker-close"
                @click="$emit('close')"
            >×</button>
        </div>
        
        <div class="energy-instructions">
            Click to select energy types. Multiple energy types can be selected.
        </div>
        
        <div class="energy-list">
            <div 
                v-for="energy in energyTypes"
                :key="energy.id"
                :class="['energy-item', { selected: isEnergySelected(energy.id) }]"
                @click="$emit('selectEnergy', energy.id, true)"
            >
                <div class="energy-item-icon">{{ energy.icon }}</div>
                <div class="energy-item-content">
                    <div class="energy-item-name">{{ energy.name }}</div>
                    <div class="energy-item-description">{{ energy.description }}</div>
                </div>
                <div 
                    class="energy-item-indicator"
                    :style="{ backgroundColor: energy.color }"
                ></div>
            </div>
        </div>
    </div>
  `
};
