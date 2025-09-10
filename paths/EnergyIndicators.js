// EnergyIndicators.js - Component for rendering energy indicator dots beneath circles
import { computed } from './vue-composition-api.js';
import { energyTypes, getEnergyTypeColor } from './energyTypes.js';
import { injectComponentStyles } from './styleUtils.js';

const componentStyles = `
    .energy-indicators {
        display: flex;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        gap: 4px;
        z-index: 10;
        pointer-events: none;
    }

    .energy-dot {
        width: 2px;
        height: 2px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    }

    .energy-dot.noenergy {
        background-color: #000000;
        width: 4px;
        height: 4px;
        border: 1px solid #AAA;
    }

    .energy-dot.exciter {
        background-color: #FFD700;
    }

    .energy-dot.igniter {
        background-color: #FF8C00;
    }

    .energy-dot.dampener {
        background-color: #9966FF;
    }

    .energy-dot.attractor {
        background-color: #FF4444;
    }

    .energy-dot.attractee {
        background-color: #4488FF;
    }

`;

injectComponentStyles('energy-indicators', componentStyles);

export const EnergyIndicators = {
    props: {
        energyTypes: {
            type: Array,
            default: () => []
        }
    },
    setup(props) {
        const sortedEnergyTypes = computed(() => {
            if (props.energyTypes.length == 0) {
                return ['noenergy'];
            }
            // Sort energy types for consistent display order
            const order = ['exciter', 'igniter', 'dampener', 'attractor', 'attractee'];
            return props.energyTypes.sort((a, b) => 
                order.indexOf(a) - order.indexOf(b)
            );
        });

        return {
            sortedEnergyTypes,
            getEnergyTypeColor
        };
    },
    template: `
        <div v-if="energyTypes.length >= 0" class="energy-indicators">
            <div 
                v-for="energyType in sortedEnergyTypes"
                :key="energyType"
                :class="['energy-dot', energyType]"
                :style="{ backgroundColor: getEnergyTypeColor(energyType) }"
                :title="energyType.charAt(0).toUpperCase() + energyType.slice(1)"
            ></div>
        </div>
    `
};
