// ConnectionComponent.js - Visual component for rendering connections (Updated)
import { computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject connection styles - Updated to white lines
const connectionStyles = `
    .connection-line {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        transform-origin: left center;
    }

    .connection-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    }

    .connection-path {
        stroke: #ffffff;
        stroke-width: 2;
        opacity: 0.6;
        fill: none;
        transition: opacity 0.15s ease;
    }

    .connection-path.fade-in {
        animation: connectionFadeIn 0.2s ease;
    }

    .connection-path.fade-out {
        animation: connectionFadeOut 0.2s ease;
    }

    @keyframes connectionFadeIn {
        from { opacity: 0; }
        to { opacity: 0.6; }
    }

    @keyframes connectionFadeOut {
        from { opacity: 0.6; }
        to { opacity: 0; }
    }
`;

injectComponentStyles('connection-component', connectionStyles);

export const ConnectionComponent = {
    props: {
        connection: {
            type: Object,
            required: true
        }
    },
    setup(props) {
        // Calculate line position and rotation - Updated to use center of square-shape
        const lineStyle = computed(() => {
            const { square1, square2 } = props.connection;
            
            // Calculate center points of squares (16px offset for center of 32px squares)
            const x1 = square1.x + 21; // Center of square
            const y1 = square1.y + 21; // Center of square
            const x2 = square2.x + 21;
            const y2 = square2.y + 21;
            
            // Calculate distance and angle
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            return {
                left: x1 + 'px',
                top: y1 + 'px',
                width: length + 'px',
                height: '2px',
                backgroundColor: '#ffffff', // White color
                transform: `rotate(${angle}deg)`,
                opacity: 0.6
            };
        });

        return {
            lineStyle
        };
    },
    template: `
        <div 
            class="connection-line"
            :style="lineStyle"
        ></div>
    `
};

// SVG-based connection component for more complex styling - Updated for white lines and center positioning
export const ConnectionSVGComponent = {
    props: {
        connections: {
            type: Array,
            required: true
        },
        containerWidth: {
            type: Number,
            default: 800
        },
        containerHeight: {
            type: Number,
            default: 600
        }
    },
    setup(props) {
        const svgPaths = computed(() => {
            return props.connections.map(connection => {
                const { square1, square2 } = connection;
                
                // Calculate center points of squares (16px offset for center of 32px squares)
                const x1 = square1.x + 16;
                const y1 = square1.y + 16;
                const x2 = square2.x + 16;
                const y2 = square2.y + 16;
                
                return {
                    id: connection.id,
                    path: `M ${x1} ${y1} L ${x2} ${y2}`,
                    distance: connection.distance
                };
            });
        });

        return {
            svgPaths
        };
    },
    template: `
        <svg 
            class="connection-svg"
            :width="containerWidth"
            :height="containerHeight"
            :viewBox="\`0 0 \${containerWidth} \${containerHeight}\`"
        >
            <path
                v-for="pathData in svgPaths"
                :key="pathData.id"
                :d="pathData.path"
                class="connection-path"
            />
        </svg>
    `
};
