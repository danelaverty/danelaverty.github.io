// styles/circleTypeStyles.js - Enhanced CSS styles for all circle types including emoji circles
export const circleTypeStyles = `
    /* Basic circle type (default) */
    .circle-type-basic {
        border-radius: 50%;
        background-color: var(--circle-color);
        border: 3px solid var(--circle-border-color, #45a049);
    }

    /* Glow circle type - no circle background, just effects */
    .circle-type-glow {
        background-color: transparent !important;
        border: 3px solid transparent !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    .circle-glow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: var(--circle-color);
        z-index: 1;
        animation: glow 3s linear 0s infinite alternate;
        pointer-events: none;
    }

    @keyframes glow {
        0% { filter: blur(5px); }
        100% { filter: blur(10px); }
    }

    /* Triangle circle type - NO CIRCLE BACKGROUND */
    .circle-type-triangle {
        border-radius: 0;
        background-color: transparent;
        border: none;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Triangle container */
    .triangle-container {
        background-color: transparent;
        border: none;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Triangle shape wrapper */
    .triangle-wrap {
        position: absolute;
        width: 32px;
        height: 32px;
        cursor: pointer;
        background-color: rgba(0,0,0,0.001);
        z-index: 10;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    /* Triangle completion levels */
    .triangle-wrap.completion-level0 .triangle-shape {
        background-color: transparent;
        border: 2px dashed rgba(255, 255, 255, 0.4);
        clip-path: none;
        width: 30px;
        height: 30px;
    }

    .triangle-wrap.completion-level1 .triangle-outline {
        position: absolute;
        width: 30px;
        height: 30px;
        background-color: transparent;
        border: 2px dashed rgba(255, 255, 255, 0.4);
        z-index: 6;
        pointer-events: none;
    }

    .triangle-wrap.completion-level1 .triangle-shape {
        background-color: var(--circle-color);
        clip-path: polygon(20% 70%, 0% 100%, 100% 100%, 80% 70%);
    }

    .triangle-wrap.completion-level2 .triangle-shape,
    .triangle-wrap.completion-no-completion .triangle-shape {
        background-color: var(--circle-color);
        clip-path: polygon(45% 0%, 0% 100%, 90% 100%);
        width: 32px;
        height: 32px;
    }

    .triangle-shape {
        position: absolute;
        width: 32px;
        height: 32px;
        transition: transform 0.3s ease;
        z-index: 5;
        pointer-events: none;
    }

    .pyramid-side {
        position: absolute;
        width: 32px;
        height: 32px;
        background-color: var(--circle-darker-color);
        clip-path: polygon(45% 0%, 90% 100%, 100% 70%);
        transition: transform 0.3s ease;
        z-index: 5;
        pointer-events: none;
    }

    /* Emoji circle type - transparent background, just the emoji */
    .circle-type-emoji {
        background-color: transparent !important;
        border: none !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    /* Emoji container styling */
    .emoji-circle-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        pointer-events: none;
        z-index: 1;
    }

    /* Enhanced Gem circle type with multi-facet animation support */
    .circle-type-gem {
        background-color: transparent !important;
        border: none !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    .circle-type-gem .gem-svg {
        width: 32px;
        height: 32px;
        filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
    }

    /* Individual facet styling with enhanced sheen effects */
    .circle-type-gem .gem-facet {
        transition: fill 1s ease-in-out;
        position: relative;
    }

    .circle-type-gem .gem-facet:nth-child(odd) {
        animation: facetSheen var(--sheen-duration, 6s) ease-in-out infinite;
        animation-delay: var(--sheen-delay, 0s);
    }

    .circle-type-gem .gem-facet:nth-child(even) {
        animation: facetSheenReverse var(--sheen-duration, 8s) ease-in-out infinite;
        animation-delay: var(--sheen-delay, 1s);
    }

    /* Sheen animations for facets */
    @keyframes facetSheen {
        0%, 100% { 
            filter: brightness(1) saturate(1);
            opacity: 0.9;
        }
        25% { 
            filter: brightness(1.3) saturate(1.2);
            opacity: 1;
        }
        50% { 
            filter: brightness(1.1) saturate(0.8);
            opacity: 0.95;
        }
        75% { 
            filter: brightness(1.2) saturate(1.1);
            opacity: 1;
        }
    }

    @keyframes facetSheenReverse {
        0%, 100% { 
            filter: brightness(0.9) saturate(1.1);
            opacity: 0.85;
        }
        25% { 
            filter: brightness(0.8) saturate(1.3);
            opacity: 0.9;
        }
        50% { 
            filter: brightness(1.2) saturate(0.9);
            opacity: 1;
        }
        75% { 
            filter: brightness(0.95) saturate(1.2);
            opacity: 0.95;
        }
    }

    /* Center table styling */
    .circle-type-gem .gem-table {
        transition: fill 1s ease-in-out;
        animation: tableShimmer 8s ease-in-out infinite;
    }

    @keyframes tableShimmer {
        0%, 100% { 
            filter: brightness(1) saturate(1);
            opacity: 0.95;
        }
        50% { 
            filter: brightness(1.4) saturate(1.3);
            opacity: 1;
        }
    }

    /* Outline styling */
    .circle-type-gem .gem-outline {
        animation: outlineGlow 12s ease-in-out infinite;
    }

    @keyframes outlineGlow {
        0%, 100% { 
            stroke-opacity: 0.8;
            filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
        }
        50% { 
            stroke-opacity: 1;
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.6));
        }
    }

    /* Enhanced sparkle animations */
    .circle-type-gem .gem-sparkle {
        animation: sparkleFloat var(--duration, 6s) ease-in-out infinite;
        animation-delay: var(--delay, 0s);
        transform-origin: center;
    }

    @keyframes sparkleFloat {
        0%, 100% {
            opacity: 0.3;
            transform: scale(0.5) rotate(0deg);
        }
        25% {
            opacity: 0.8;
            transform: scale(1.2) rotate(90deg);
        }
        50% {
            opacity: 1;
            transform: scale(0.8) rotate(180deg);
        }
        75% {
            opacity: 0.6;
            transform: scale(1.1) rotate(270deg);
        }
    }

    /* Additional sparkle variation for some sparkles */
    .circle-type-gem .gem-sparkle:nth-child(even) {
        animation-name: sparkleFloatAlt;
    }

    @keyframes sparkleFloatAlt {
        0%, 100% {
            opacity: 0.2;
            transform: scale(0.3) rotate(360deg);
        }
        30% {
            opacity: 0.9;
            transform: scale(1.4) rotate(270deg);
        }
        60% {
            opacity: 0.7;
            transform: scale(0.6) rotate(180deg);
        }
        90% {
            opacity: 0.4;
            transform: scale(1.0) rotate(90deg);
        }
    }

    /* Multi-color gem specific enhancements */
    .circle-type-gem.multi-color .gem-svg {
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4)) 
                drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
    }

    .circle-type-gem.multi-color .gem-facet {
        animation-duration: calc(var(--sheen-duration, 6s) * 0.8);
    }

    .circle-type-gem.multi-color .gem-sparkle {
        animation-duration: calc(var(--duration, 6s) * 1.2);
    }

    /* Existing glow circle styles */
    .circle-type-glow {
        /* Add your existing glow styles here */
    }

    /* Existing triangle circle styles */
    .circle-type-triangle {
        /* Add your existing triangle styles here */
    }

    /* Performance optimizations */
    .circle-type-gem .gem-facet, 
    .circle-type-gem .gem-table, 
    .circle-type-gem .gem-outline, 
    .circle-type-gem .gem-sparkle {
        will-change: transform, opacity, filter;
    }

/* Particles for glow type */
    .particles {
        position: absolute;
        top: 100%;
        left: 100%;
        width: 100%;
        height: 100%;
        pointer-events: none;
        transform: scale(2);
    }

    .angle {
        position: absolute;
        top: 0;
        left: 0;
    }

    .position {
        position: absolute;
        top: 0;
        left: 0;
    }

    .pulse {
        position: absolute;
        top: 0;
        left: 0;
        animation: pulse 1.5s linear 0s infinite alternate;
    }

    .particle {
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        border: 1px solid white;
        background-color: var(--circle-color);
    }

    @keyframes angle {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes position {
        0% { transform: translate(0,0); opacity: 1; }
        100% { transform: translate(5px,5px); opacity: 0; }
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        100% { transform: scale(.5); }
    }

    /* Chakra Form (Polygon Shapes) for glow type */
    .outer-polygon-container {
        position: absolute;
        transform: scale(.8);
        top: 50%;
        left: 50%;
        transform-origin: center center;
    }

    .inner-polygon-container {
        position: absolute;
        transform-origin: 50% 50%;
        width: 0;
        height: 0;
    }

    .shape {
        width: 40px;
        height: 40px;
        background-color: #FFA;
        transform: translate(-50%, -50%);
    }

    /* Animation classes for chakra forms */
    .angle-animation {
        animation: angle 16s linear infinite;
    }

    .angle-reverse-animation {
        animation: anglerev 16s linear infinite;
    }

    @keyframes anglerev {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
    }


    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .circle-type-gem .gem-svg, 
        .circle-type-gem .gem-facet, 
        .circle-type-gem .gem-table, 
        .circle-type-gem .gem-outline, 
        .circle-type-gem .gem-sparkle {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
        }
    }

    /* Responsive sizing adjustments */
    @media (max-width: 768px) {
        .circle-type-gem .gem-svg {
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4));
        }
        
        .circle-type-gem.multi-color .gem-svg {
            filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
        }
    }

/* FIXED: Ensure ALL gem circles never show basic background */
.circle-shape.circle-type-gem {
    background: none !important;
    background-color: transparent !important;
}

/* FIXED: Override any multi-color styling for gem circles */
.circle-shape.circle-type-gem.multi-color {
    background: none !important;
    background-color: transparent !important;
}

/* FIXED: Override single-color styling for gem circles */
.circle-shape.circle-type-gem.single-color {
    background: none !important;
    background-color: transparent !important;
}

/* FIXED: Ensure ALL emoji circles never show basic background */
.circle-shape.circle-type-emoji {
    background: none !important;
    background-color: transparent !important;
}

/* FIXED: Override any multi-color styling for emoji circles */
.circle-shape.circle-type-emoji.multi-color {
    background: none !important;
    background-color: transparent !important;
}

/* FIXED: Override single-color styling for emoji circles */
.circle-shape.circle-type-emoji.single-color {
    background: none !important;
    background-color: transparent !important;
}
`;
