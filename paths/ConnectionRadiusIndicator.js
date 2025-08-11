// ConnectionRadiusIndicator.js - Visual component for showing connection radius during drag
import { computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject styles for the connection radius indicator
const radiusIndicatorStyles = `
    .connection-radius-indicator {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 998; /* Below dragging squares but above connections */
        background: rgba(255, 255, 255, 0.05);
        transition: none; /* No transitions during drag for smooth performance */
    }

    .connection-radius-indicator.bold {
        background: rgba(255, 255, 100, 0.08);
    }

    .connection-radius-indicator.fade-in {
        animation: radiusIndicatorFadeIn 0.2s ease;
    }

    .connection-radius-indicator.fade-out {
        animation: radiusIndicatorFadeOut 0.2s ease;
    }

    @keyframes radiusIndicatorFadeIn {
        from { 
            opacity: 0; 
            transform: scale(0.8);
        }
        to { 
            opacity: 1; 
            transform: scale(1);
        }
    }

    @keyframes radiusIndicatorFadeOut {
        from { 
            opacity: 1; 
            transform: scale(1);
        }
        to { 
            opacity: 0; 
            transform: scale(0.8);
        }
    }
`;

injectComponentStyles('connection-radius-indicator', radiusIndicatorStyles);

export const ConnectionRadiusIndicator = {
    props: {
        square: {
            type: Object,
            required: true
        },
        deltaX: {
            type: Number,
            default: 0
        },
        deltaY: {
            type: Number,
            default: 0
        },
        connectionDistance: {
            type: Number,
            required: true
        }
    },
    setup(props) {
        // Calculate the indicator position and size
        const indicatorStyle = computed(() => {
            // Calculate current position of the square (including drag offset)
            const centerX = props.square.x + props.deltaX + 21; // 21px = half of 41px square + border
            const centerY = props.square.y + props.deltaY + 21;
            
            // Position the circle so its center aligns with the square's center
            const radius = props.connectionDistance;
            const diameter = radius * 2;
            
            return {
                left: (centerX - radius) + 'px',
                top: (centerY - radius) + 'px',
                width: diameter + 'px',
                height: diameter + 'px'
            };
        });

        // Determine if this is a bold square for styling
        const isBold = computed(() => props.square.bold === true);

        // CSS classes for the indicator
        const indicatorClasses = computed(() => {
            const classes = ['connection-radius-indicator'];
            if (isBold.value) {
                classes.push('bold');
            }
            return classes;
        });

        return {
            indicatorStyle,
            indicatorClasses
        };
    },
    template: `
        <div 
            :class="indicatorClasses"
            :style="indicatorStyle"
        ></div>
    `
};
