// GlobalPropertyToggle.js - Reusable toggle button for global properties
import { computed } from './vue-composition-api.js';

export const GlobalPropertyToggle = {
    props: {
        propertyKey: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        currentValue: {
            type: String,
            required: true
        }
    },
    emits: ['toggle'],
    setup(props, { emit }) {
        const handleToggle = () => {
            emit('toggle', props.propertyKey);
        };

        const tooltipText = computed(() => {
            return `${props.label}: ${props.currentValue}`;
        });

        return {
            handleToggle,
            tooltipText
        };
    },
    template: `
        <div 
            class="global-property-toggle"
            @click="handleToggle"
            :title="tooltipText"
        >
            <span class="property-value">{{ currentValue }}</span>
        </div>
    `
};
