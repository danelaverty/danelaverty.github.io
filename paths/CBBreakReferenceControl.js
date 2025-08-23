// controls/BreakReferenceControl.js - Button control for breaking circle references
export const BreakReferenceControl = {
  emits: ['break-reference'],
  
  template: `
    <div class="characteristic-control">
        <div 
            class="break-reference-display"
            @click="$emit('break-reference')"
            style="cursor: pointer;"
            title="Break reference - Make this circle independent"
        >
            <div class="break-reference-icon">⛓️‍💥</div>
        </div>
    </div>
  `
};
