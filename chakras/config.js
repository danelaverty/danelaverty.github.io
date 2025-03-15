// config.js - Configuration settings for the Chakra Visualizer

const Config = {
    // UI configuration
    defaultName: '???',
    
    // Colors
    predefinedColors: [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3', // Violet
        '#FF1493', // Pink
        '#00FFFF', // Cyan
        '#FFFFFF'  // White
    ],
    
    // Chakra forms configuration
    chakraForms: [
        [{ sides: 1, starFactor: 1, borderPercent: .1, scale: .2 }],
        [{ sides: 21, starFactor: 1, borderPercent: .05, scale: .8 }],
        [{ sides: 3, starFactor: 1, borderPercent: .18, scale: .9 }],
        [{ sides: 3, starFactor: 1, borderPercent: .18 }, { sides: 3, starFactor: 1, borderPercent: .18, rotate: 60 }],
        [{ sides: 4, starFactor: 1, borderPercent: .12 }, { sides: 4, starFactor: 1, borderPercent: .12, rotate: 45 }],
        [{ sides: 5, starFactor: 1, borderPercent: .10 }, { sides: 5, starFactor: 1, borderPercent: .10, rotate: 36 }],
        [{ sides: 11, starFactor: 3, borderPercent: .12 }],
        [{ sides: 9, starFactor: 2, borderPercent: .12, scale: 0.8 }, { sides: 9, starFactor: 2, borderPercent: .08, reverse: 1, scale: 1.2, spinTime: 64 }],
        [{ sides: 17, starFactor: 2, borderPercent: .08 }, { sides: 17, starFactor: 2, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
        [{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
        [{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }, { sides: 25, starFactor: 4, borderPercent: .02, scale: 1.5, spinTime: 64 }],
        [{ sides: 30, starFactor: 1, borderPercent: .18 }, { sides: 61, starFactor: 23, borderPercent: .01, reverse: 1, scale: 3.4, spinTime: 32 }],
    ],
    
    // Attribute information
    attributeInfo: {
	    treasure: { emoji: '💎', color: '#0000FF', displayName: 'Treasures', description: 'Proxy success criteria' },
        door: { emoji: '🚪', color: '#AA0000', displayName: 'Doors', description: 'Paths you could choose' },
        key: { emoji: '🔑', color: '#8B4513', displayName: 'Keys', description: 'Helps open doors' },
        demon: { emoji: '😈', color: '#663399', displayName: 'Demons', description: 'Exacerbating factors' },
        sword: { emoji: '🗡️', color: '#C0C0C0', displayName: 'Swords', description: 'Helps slay demons' },
        ally: { emoji: '🧝🏻‍♂️', color: '#FF8C00', displayName: 'Allies', description: 'Helpful people' },
    },
    
    // Size configurations
    sizes: {
        small: { circle: 30, square: 30 },
        medium: { circle: 30, square: 30 }, // Force medium to be 30 as well
        large: { circle: 30, square: 30 }   // Force large to be 30 as well
    },
    
    // Meridian configuration
    meridian: {
        x: 170,           // X position of meridian line
        snapThreshold: 20, // Distance in pixels to snap to meridian
        lineColor: 'rgba(255, 255, 255, 0.2)' // Color of meridian line
    },

    connections: {
	    maxLineLength: 160,  // Maximum length for visible connection lines (in pixels)
	    lineColor: 'rgba(255, 255, 255, 0.3)',  // Default connection line color
	    lineColorHighlight: 'rgba(255, 255, 255, 0.7)', // Color for highlighted connections
	    lineWidth: 1, // Default line width in pixels
    },
};
