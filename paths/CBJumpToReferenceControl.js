// controls/CBJumpToReferenceControl.js - Button control for jumping to reference circle's parent
export const CBJumpToReferenceControl = {
  emits: ['jump-to-reference'],
  
  template: `
    <div class="characteristic-control">
        <div 
            class="jump-to-reference-display"
            @click="$emit('jump-to-reference')"
            style="cursor: pointer; position: relative;"
            title="Jump to referenced circle"
        >
            <div class="jump-to-reference-icon" style="position: relative; display: inline-block; width: 20px; height: 16px;">
                <span style="position: absolute; top: 0; left: 0; opacity: .5">🔗</span>
                <span style="position: absolute; color: #eee; top: 0px; left: 2px; font-size: 18px;">→</span>
            </div>
        </div>
    </div>
  `
};
