export const CBStatesControl = {
    props: {
        selectedCircle: {
            type: Object,
            required: true
        }
    },
    
    emits: ['toggle'],
    
    computed: {
        stateCount() {
            if (!this.selectedCircle || !this.selectedCircle.states) return 0;
            return Object.keys(this.selectedCircle.states).length;
        },
        
        displayTitle() {
            return `States (${this.stateCount} states)`;
        }
    },
    
    template: `
        <div class="characteristic-control"
            @click="$emit('toggle')"
            :title="displayTitle"
        >
            <div class="states-display">
                <span style="color: white;">▦</span>
            </div>
        </div>
    `
};
