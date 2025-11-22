export const circleTypeStyles = `
    .circle-type-basic {
        border-radius: 50%;
        background-color: var(--circle-color);
    }

    .circle-type-glow {
        background-color: transparent !important;
        border: 3px solid transparent !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    .circle-glow-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
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
        animation: glow 6s ease 0s infinite alternate;
        pointer-events: none;
        transition: background-color 0.8s ease-in-out;
    }

    @keyframes glow {
        0% { filter: blur(3px); }
        100% { filter: blur(10px); }
    }

    .circle-type-triangle {
        border-radius: 0;
        background-color: transparent;
        border: none;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .triangle-container {
        background-color: transparent;
        border: none;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

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

    .circle-type-emoji {
        background-color: transparent !important;
        border: none !important;
        border-radius: 50% !important;
        position: relative;
        overflow: visible;
    }

    .emoji-circle-container {
        position: absolute;
        top: 0;
        left: 0;
        /*width: 100%;
        height: 100%;*/
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        pointer-events: none;
        z-index: 1;
    }

    .circle-type-shape {
        background-color: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        position: relative;
        overflow: visible;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .shape-wrap,
    .right-triangle-wrap,
    .diamond-wrap,
    .oval-wrap {
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

    .right-triangle-shape,
    .diamond-shape,
    .oval-shape {
        position: absolute;
        width: 32px;
        height: 32px;
        background-color: var(--circle-color);
        transition: transform 0.3s ease;
        z-index: 5;
        pointer-events: none;
        filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
    }

    .right-triangle-shape {
        clip-path: polygon(10% 10%, 90% 50%, 10% 90%);
    }

    .diamond-shape {
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    }

    .oval-shape {
        width: 30px;
        height: 20px;
        border-radius: 50%;
        clip-path: none;
    }

    .shape-wrap:hover .right-triangle-shape,
    .shape-wrap:hover .diamond-shape,
    .shape-wrap:hover .oval-shape {
        transform: scale(1.1);
    }

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

    .circle-type-glow {
        /* Add your existing glow styles here */
    }

    .circle-type-triangle {
        /* Add your existing triangle styles here */
    }

    /* Performance optimizations */
    .circle-type-gem .gem-facet, 
    .circle-type-gem .gem-table, 
    .circle-type-gem .gem-outline, 
    .circle-type-gem .gem-sparkle,
    .circle-type-shape .right-triangle-shape,
    .circle-type-shape .diamond-shape,
    .circle-type-shape .oval-shape {
        will-change: transform, opacity, filter;
    }

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


    @media (prefers-reduced-motion: reduce) {
        .circle-type-gem .gem-svg, 
        .circle-type-gem .gem-facet, 
        .circle-type-gem .gem-table, 
        .circle-type-gem .gem-outline, 
        .circle-type-gem .gem-sparkle,
        .circle-type-shape .right-triangle-shape,
        .circle-type-shape .diamond-shape,
        .circle-type-shape .oval-shape {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
        }
    }

    @media (max-width: 768px) {
        .circle-type-gem .gem-svg {
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4));
        }
        
        .circle-type-gem.multi-color .gem-svg {
            filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
        }

        .circle-type-shape .right-triangle-shape,
        .circle-type-shape .diamond-shape,
        .circle-type-shape .oval-shape {
            filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.4));
        }
    }

.circle-shape.circle-type-gem {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-gem.multi-color {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-gem.single-color {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-emoji {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-emoji.multi-color {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-emoji.single-color {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-shape {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-shape.multi-color {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-shape.single-color {
    background: none !important;
    background-color: transparent !important;
}

.circle-shape.circle-type-shape.single-color {
    background: none !important;
    background-color: transparent !important;
}

    .circle-type-group {
        background-color: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        position: relative;
        overflow: visible;
        z-index: 1;
    }

.circle-shape.circle-type-group {
    background: none !important;
    background-color: transparent !important;
        z-index: 1;
}

.circle-shape.circle-type-group.multi-color {
    background: none !important;
    background-color: transparent !important;
        z-index: 1;
}

.circle-shape.circle-type-group.single-color {
    background: none !important;
    background-color: transparent !important;
        z-index: 1;
}

.group-circle-container {
    position: absolute;
    top: 0;
    left: 0;
        width: 100%;
        height: 100%;
    min-width: 32px;
    min-height: 32px;
    border: 2px solid var(--circle-color);
    border-radius: 5px;
    background-color: color-mix(in srgb, var(--circle-color) 15%, transparent);
    pointer-events: none;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: width 0.3s ease, height 0.3s ease;
    box-shadow: 0 0 8px color-mix(in srgb, var(--circle-color) 20%, transparent);
}

.is-roil .group-circle-container {
    opacity: 0;
}

.group-circle-container:hover {
    background-color: color-mix(in srgb, var(--circle-color) 25%, transparent);
    box-shadow: 0 0 12px color-mix(in srgb, var(--circle-color) 30%, transparent);
}

/* NEW: Collapsed group styles */
.group-circle-container.collapsed {
    width: 32px !important;
    height: 32px !important;
    border-radius: 25%;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: color-mix(in srgb, var(--circle-color) 20%, transparent);
    border-width: 2px;
}

.group-circle-container.expanded {
    cursor: pointer;
    transition: all 0.3s ease;
}

.group-circle-container.collapsed:hover {
    background-color: color-mix(in srgb, var(--circle-color) 35%, transparent);
    transform: scale(1.05);
    box-shadow: 0 0 15px color-mix(in srgb, var(--circle-color) 40%, transparent);
}

/* Member count display for collapsed groups */
.group-member-count {
    font-family: Arial, sans-serif;
    user-select: none;
    opacity: 0.9;
    transition: opacity 0.2s ease;
}

.group-circle-container.collapsed:hover .group-member-count {
    opacity: 1;
}

/* Visual indicator that collapsed groups are interactive */
.group-circle-container.collapsed {
    position: relative;
}

.group-circle-container.collapsed::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.group-circle-container.collapsed:hover::before {
    opacity: 1;
}

/* Ensure all other circle types have higher z-index than groups */
.circle-type-basic,
.circle-type-glow, 
.circle-type-triangle,
.circle-type-gem,
.circle-type-emoji,
.circle-type-shape {
    z-index: 10;
}

/* Smooth transitions for group state changes */
@keyframes groupCollapse {
    from {
        transform: scale(1);
        opacity: 1;
    }
    to {
        transform: scale(0.95);
        opacity: 0.8;
    }
}

.group-circle-container.collapsed {
    animation: groupCollapse 0.3s ease forwards;
}

/* Animation for member count appearing/disappearing */
.group-member-count {
    animation: memberCountFadeIn 0.3s ease forwards;
}

@keyframes memberCountFadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
    }
    to {
        opacity: 0.9;
        transform: translate(-50%, -50%) scale(1);
    }
}

@keyframes gradientOpacityShift {
    0%, 100% {
        opacity: 0.3;
    }
    25% {
        opacity: 0.7;
    }
    50% {
        opacity: 0.9;
    }
    75% {
        opacity: 0.5;
    }
}

@keyframes gradientScaleShift {
    0%, 100% {
        transform: scale(0.85);
    }
    30% {
        transform: scale(1.1);
    }
    60% {
        transform: scale(0.95);
    }
    80% {
        transform: scale(1.05);
    }
}

/* Updated gradient layer class to handle multiple animations */
.color-flow-gradient-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: none;
    will-change: transform, opacity;
    transform-origin: center center;
}

.color-flow-gradient-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: none;
    will-change: transform;
}

.color-flow-overlay.multi-layer-flow {
    /* Remove the animation from the container since individual layers now animate */
    animation: none;
}

.color-change-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 32px;
    height: 32px;
    border: 1px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 999;
    animation: rippleExpand 0.6s ease-out forwards;
}

@keyframes rippleExpand {
    0% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0.4;
    }
    100% {
        transform: translate(-50%, -50%) scale(2.0);
        opacity: 0;
    }
}

.circle-type-glow {
    perspective: 200px;
}

.circle-glow-container {
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Flip state class - add this to the container when secondary colors should show */
.circle-glow-container.roil-secondary-colors {
    transform: rotateY(180deg);
}

.circle-glow {
    backface-visibility: hidden;
    animation: glow 6s ease 0s infinite alternate;
    /* Allow background-color to change instantly (no transition) */
    transition: background-color 0s;
}

/* Optional: Add subtle shadow during flip for more realism */
.circle-glow-container {
    transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1),
                filter 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.circle-glow-container.roil-secondary-colors {
    filter: drop-shadow(2px 0 4px rgba(0,0,0,0.2));
}
`;
