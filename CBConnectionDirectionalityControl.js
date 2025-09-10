// CBConnectionDirectionalityControl.js - Control for explicit connection directionality
export const CBConnectionDirectionalityControl = {
  props: {
    directionality: {
      type: String,
      required: true,
      validator: (value) => ['none', 'out', 'in', 'both'].includes(value)
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    directionalityIcon() {
      const icons = {
        none: '—',
        out: '→', 
        in: '←',
        both: '↔'
      };
      return icons[this.directionality];
    },
    
    directionalityLabel() {
      const labels = {
        none: 'None',
        out: 'Outward',
        in: 'Inward', 
        both: 'Both'
      };
      return labels[this.directionality];
    },
    
    directionalityTitle() {
      const descriptions = {
        none: 'No direction - Click to cycle to Outward',
        out: 'Outward direction - Click to cycle to Inward',
        in: 'Inward direction - Click to cycle to Both',
        both: 'Both directions - Click to cycle to None'
      };
      return descriptions[this.directionality];
    }
  },
  
  template: `
    <div class="characteristic-control">
        <div 
            :class="['directionality-display', directionality]"
            @click="$emit('cycle')"
            style="cursor: pointer; border: 1px solid #666; border-radius: 3px; padding: 4px 8px; background-color: rgba(255,255,255,0.1);"
            :title="directionalityTitle"
        >
            <div class="directionality-icon" style="font-size: 16px; color: #fff;">{{ directionalityIcon }}</div>
        </div>
    </div>
  `
};
