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
        [{ sides: 3, starFactor: 1, borderPercent: .10, scale: .8 }],
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
        treasure: { emoji: '💎', color: '#0000FF' },
        ally: { emoji: '🧝🏻‍♂️', color: '#FF8C00' },
        key: { emoji: '🔑', color: '#8B4513' },
        door: { emoji: '🚪', color: '#FF0000' },
        demon: { emoji: '😈', color: '#663399' },
        sword: { emoji: '🗡️', color: '#C0C0C0' }
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
        lineColor: 'rgba(255, 255, 255, 0.3)' // Color of meridian line
    }
};
