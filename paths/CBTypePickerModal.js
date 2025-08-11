// pickers/TypePickerModal.js
export const TypePickerModal = {
  props: {
    circleTypes: {
      type: Array,
      required: true
    },
    isTypeSelected: {
      type: Function,
      required: true
    }
  },
  
  emits: ['selectType', 'close'],
  
  template: `
    <div 
        class="type-picker-modal"
        style="display: block;"
    >
        <div class="type-picker-header">
            <span>Select Circle Type</span>
            <button 
                class="picker-close"
                @click="$emit('close')"
            >×</button>
        </div>
        
        <div class="type-list">
            <div 
                v-for="type in circleTypes"
                :key="type.id"
                :class="['type-item', { selected: isTypeSelected(type.id) }]"
                @click="$emit('selectType', type)"
            >
                <div class="type-item-icon">{{ type.icon }}</div>
                <div class="type-item-content">
                    <div class="type-item-name">{{ type.name }}</div>
                </div>
            </div>
        </div>
    </div>
  `
};
