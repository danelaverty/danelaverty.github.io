// EnergyIndicators.js - Component for rendering energy indicator dots beneath circles
import { computed } from './vue-composition-api.js';
import { energyTypes, getEnergyTypeColor } from './energyTypes.js';
import { injectComponentStyles } from './styleUtils.js';

const componentStyles = `
    .energy-indicators {
        position: absolute;
        top: calc(100% + 13px);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
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

    .energy-dot.exciter {
        background-color: #FFD700;
        animation: exciterPulse 2s ease-in-out infinite;
    }

    .energy-dot.attractor {
        background-color: #FF4444;
        animation: attractorPulse 2.5s ease-in-out infinite;
    }

    .energy-dot.attractee {
        background-color: #4488FF;
        animation: attracteePulse 3s ease-in-out infinite;
    }

    @keyframes exciterPulse {
        0%, 100% { 
            transform: scale(1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 0 rgba(255, 215, 0, 0.7);
        }
        50% { 
            transform: scale(1.2);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(255, 215, 0, 0);
        }
    }

    @keyframes attractorPulse {
        0%, 100% { 
            transform: scale(1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 0 rgba(255, 68, 68, 0.7);
        }
        50% { 
            transform: scale(1.2);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(255, 68, 68, 0);
        }
    }

    @keyframes attracteePulse {
        0%, 100% { 
            transform: scale(1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 0 rgba(68, 136, 255, 0.7);
        }
        50% { 
            transform: scale(1.2);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(68, 136, 255, 0);
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .energy-dot {
            animation: none !important;
        }
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
            // Sort energy types for consistent display order
            const order = ['exciter', 'attractor', 'attractee'];
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
        <div v-if="energyTypes.length > 0" class="energy-indicators">
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
