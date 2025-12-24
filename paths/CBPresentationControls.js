// PresentationControls.js - Presentation mode controls for squares
import { computed } from './vue-composition-api.js';

export const PresentationControls = {
  props: {
    selectedSquares: {
      type: Array,
      default: () => []
    },
    dataStore: {
      type: Object,
      required: true
    },
    currentSquares: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['show-dropdown'],
  
  setup(props, { emit }) {
    // Get current sequence number for selected squares
    const currentSequenceNumber = computed(() => {
      if (props.selectedSquares.length === 0) return '';
      if (props.selectedSquares.length === 1) {
        const num = props.selectedSquares[0].presentationSequenceNumber;
        return (typeof num != 'undefined' &&  num !== null) ? num.toString() : '';
      }
      // Multiple squares - show if they all have the same number
      const numbers = props.selectedSquares.map(s => s.presentationSequenceNumber);
      const unique = [...new Set(numbers)];
      if (unique.length === 1 && unique[0] !== null) {
        return unique[0].toString();
      }
      return ''; // Mixed or all null
    });

    const isPresentationMode = computed(() => props.dataStore.isPresentationMode());
    const showSequenceNumbers = computed(() => props.dataStore.getShowSequenceNumbers());
    
    // Check if there's a next step available
    const hasNextStep = computed(() => {
      if (!isPresentationMode.value) return false;
      
      const currentStep = props.dataStore.getCurrentPresentationStep();
      const sequenceNumbers = props.currentSquares
        .map(square => square.presentationSequenceNumber)
        .filter(num => num !== null && num !== undefined)
        .sort((a, b) => a - b);
      
      const uniqueNumbers = [...new Set(sequenceNumbers)];
      const maxNumber = Math.max(...uniqueNumbers);
      
      return currentStep < maxNumber;
    });

    // Handle sequence number input
    const handleSequenceNumberInput = (event) => {
      const value = event.target.value.trim();
      if (value === '') {
        // Clear sequence number
        props.selectedSquares.forEach(square => {
          props.dataStore.updateSquare(square.id, { 
            presentationSequenceNumber: null 
          });
        });
        return;
      }
      
      const number = parseInt(value, 10);
      if (!isNaN(number) && number >= 0) {
        props.selectedSquares.forEach(square => {
          props.dataStore.updateSquare(square.id, { 
            presentationSequenceNumber: number 
          });
        });
      }
    };

    // Presentation control handlers
    const handlePresentationStart = () => {
      props.dataStore.startPresentationMode();
    };

    const handlePresentationNext = () => {
      props.dataStore.nextPresentationStep(props.currentSquares);
    };

    const handlePresentationEnd = () => {
      props.dataStore.endPresentationMode();
    };

    const handleToggleSequenceNumbers = () => {
      props.dataStore.toggleSequenceNumbersVisibility();
    };

    return {
      currentSequenceNumber,
      isPresentationMode,
      showSequenceNumbers,
      hasNextStep,
      handleSequenceNumberInput,
      handlePresentationStart,
      handlePresentationNext,
      handlePresentationEnd,
      handleToggleSequenceNumbers
    };
  },
  
  template: `
    <!-- Presentation Sequence Number Input -->
    <div class="characteristic-control sequence-number-control">
      <input 
        :value="currentSequenceNumber"
        @input="handleSequenceNumberInput"
        @blur="handleSequenceNumberInput"
        placeholder="#"
        title="Presentation Sequence Number"
        min="0"
        class="sequence-number-input"
      />
    </div>

    <!-- Toggle Sequence Numbers Visibility -->
    <div 
      class="characteristic-control"
      @click="handleToggleSequenceNumbers"
      :title="showSequenceNumbers ? 'Hide sequence numbers' : 'Show sequence numbers'"
      :style="{ backgroundColor: showSequenceNumbers ? '#4CAF50' : 'rgba(40, 40, 40, 0.8)' }"
    >
      <span class="control-text">#</span>
    </div>

    <!-- Presentation Start -->
    <div 
      class="characteristic-control"
      @click="handlePresentationStart"
      :class="{ disabled: isPresentationMode }"
      title="Start Presentation Mode"
      :style="{ backgroundColor: isPresentationMode ? 'rgba(40, 40, 40, 0.5)' : 'rgba(40, 40, 40, 0.8)' }"
    >
      <span class="control-text">▶</span>
    </div>

    <!-- Presentation Next -->
    <div 
      class="characteristic-control"
      @click="handlePresentationNext"
      :class="{ disabled: !isPresentationMode || !hasNextStep }"
      title="Next Slide"
      :style="{ 
        backgroundColor: isPresentationMode && hasNextStep ? 'rgba(40, 40, 40, 0.8)' : 'rgba(40, 40, 40, 0.5)',
        cursor: isPresentationMode && hasNextStep ? 'pointer' : 'not-allowed'
      }"
    >
      <span class="control-text">⏭</span>
    </div>

    <!-- Presentation End -->
    <div 
      class="characteristic-control"
      @click="handlePresentationEnd"
      :class="{ disabled: !isPresentationMode }"
      title="End Presentation Mode"
      :style="{ 
        backgroundColor: isPresentationMode ? '#f44336' : 'rgba(40, 40, 40, 0.5)',
        cursor: isPresentationMode ? 'pointer' : 'not-allowed'
      }"
    >
      <span class="control-text">⏹</span>
    </div>
  `
};
