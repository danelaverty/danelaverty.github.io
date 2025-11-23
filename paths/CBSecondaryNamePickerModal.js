// pickers/CBSecondaryNamePickerModal.js
import { ref, nextTick, onMounted } from './vue-composition-api.js';

export const CBSecondaryNamePickerModal = {
  props: {
    currentSecondaryName: {
      type: String,
      default: ''
    }
  },
  
  emits: ['selectSecondaryName', 'close'],
  
  setup(props, { emit }) {
    const inputValue = ref(props.currentSecondaryName);
    const inputRef = ref(null);
    
    const handleSubmit = () => {
      emit('selectSecondaryName', inputValue.value.trim());
      emit('close');
    };
    
    const handleKeydown = (event) => {
      if (event.key === 'Enter') {
        handleSubmit();
      } else if (event.key === 'Escape') {
        emit('close');
      }
    };
    
    onMounted(async () => {
      await nextTick();
      if (inputRef.value) {
        inputRef.value.focus();
        inputRef.value.select();
      }
    });
    
    return {
      inputValue,
      inputRef,
      handleSubmit,
      handleKeydown
    };
  },
  
  template: `
    <div 
        class="secondary-name-picker-modal"
        style="display: block;"
    >
        <div class="secondary-name-picker-header">
            <span>Secondary Name</span>
            <button 
                class="picker-close"
                @click="$emit('close')"
            >×</button>
        </div>
        
        <div class="secondary-name-input-container">
            <input 
                ref="inputRef"
                v-model="inputValue"
                type="text"
                class="secondary-name-input"
                placeholder="Enter secondary name..."
                @keydown="handleKeydown"
            />
            
            <div class="secondary-name-actions">
                <button 
                    class="secondary-name-cancel-button"
                    @click="$emit('close')"
                >
                    Cancel
                </button>
                <button 
                    class="secondary-name-submit-button"
                    @click="handleSubmit"
                >
                    Set
                </button>
            </div>
        </div>
    </div>
  `
};
