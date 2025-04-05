// src/config/Config.js
// Configuration settings for the Chakra Visualizer

(function(ChakraApp) {
  // Configuration settings
  ChakraApp.Config = {
    // UI configuration
    defaultName: '???',

characteristics: {
	color: {
		key: 'color',
displayName: 'Crystal',
buttonEmoji: '🎨',
buttonTitle: 'Change Crystal Color',
modalTitle: 'Select Crystal',
categories: [
{
	name: "Warm Crystals", 
bg: '#FFF5F5',
options: [
{ value: '#FF0050', display: 'Ruby', secondary: null },
{ value: '#FF0000', display: 'Garnet', secondary: null },
{ value: '#FFAAAA', display: 'Rose Quartz', secondary: null },
{ value: '#FF5234', display: 'Carnelian', secondary: null },
{ value: '#FFAC00', display: 'Amber', secondary: null },
{ value: '#FFE700', display: 'Citrine', secondary: null },
{ value: '#B87333', display: 'Tiger\'s Eye', secondary: null },
{ value: '#CD7F32', display: 'Sunstone', secondary: null },
{ value: '#D35400', display: 'Fire Agate', secondary: null },
{ value: '#A52A2A', display: 'Smoky Quartz', secondary: null },
{ value: '#FFFFFF', display: 'Clear Quartz', secondary: null },
{ value: '#FFC0CB', display: 'Rhodochrosite', secondary: null }
]
},
{
	name: "Cool Crystals", 
	bg: '#F5F5FF',
	options: [
	{ value: '#D0FF00', display: 'Peridot', secondary: null },
	{ value: '#00FF00', display: 'Emerald', secondary: null },
	{ value: '#00FFD0', display: 'Aquamarine', secondary: null },
	{ value: '#99EEFF', display: 'Turquoise', secondary: null },
	{ value: '#0000FF', display: 'Sapphire', secondary: null },
	{ value: '#AA2BFF', display: 'Amethyst', secondary: null },
	{ value: '#FF00FF', display: 'Sugilite', secondary: null },
	{ value: '#800080', display: 'Charoite', secondary: null },
	{ value: '#483D8B', display: 'Lapis Lazuli', secondary: null },
	{ value: '#999999', display: 'Hematite', secondary: null },
	{ value: '#000000', display: 'Obsidian', secondary: null },
	{ value: '#40E0D0', display: 'Amazonite', secondary: null }
	]
}
],
	visualStyle: {
		type: 'background',
		cssProperty: 'background-color'
	},
	valueDisplayStyle: {
		type: 'swatch',
		template: '<span class="color-value-swatch" style="background-color: {VALUE}"></span><span>{DISPLAY}</span>'
	}
},
	/*element: {
		key: 'element',
		displayName: 'Element',
		buttonEmoji: '🌍',
		buttonTitle: 'Change Element',
		modalTitle: 'Select Element',
		categories: [
		{
			name: null,
			bg: null,
			options: [
			{ value: 'fire', display: 'Fire', secondary: 'Transformation, energy', visualStyle: { emoji: '🔥', color: '#FF5500' } },
			{ value: 'earth', display: 'Earth', secondary: 'Stability, grounding', visualStyle: { emoji: '🌱', color: '#8B4513' } },
			{ value: 'air', display: 'Air', secondary: 'Movement, freedom', visualStyle: { emoji: '💨', color: '#E0FFFF' } },
			{ value: 'water', display: 'Water', secondary: 'Flow, emotion', visualStyle: { emoji: '💧', color: '#1E90FF' } },
			{ value: 'space', display: 'Space', secondary: 'Expansion, potential', visualStyle: { emoji: '✨', color: '#191970' } },
			{ value: 'sound', display: 'Sound', secondary: 'Vibration, expression', visualStyle: { emoji: '🔊', color: '#9370DB' } },
			{ value: 'light', display: 'Light', secondary: 'Clarity, illumination', visualStyle: { emoji: '☀️', color: '#FFD700' } },
			{ value: 'thought', display: 'Thought', secondary: 'Consciousness, awareness', visualStyle: { emoji: '💭', color: '#E6E6FA' } }
			]
		}
		],
			visualStyle: {
				type: 'symbol',
				cssClass: 'circle-element-symbol'
			},
			valueDisplayStyle: {
				type: 'emoji',
				template: '{EMOJI} {DISPLAY}'
			}
	},*/
	/*identity: {
		key: 'identity',
		displayName: 'Enneagram',
		buttonEmoji: 'N',
		buttonTitle: 'Change Enneagram Type',
		modalTitle: 'Select Enneagram Type',
		categories: [
		{
			name: null,
			bg: null,
			options: [
			{ value: 'type1', display: 'The Reformer', secondary: 'Principled, purposeful, self-controlled', visualStyle: { number: 1, emoji: '⚖️', color: '#E84855' } },
			{ value: 'type2', display: 'The Helper', secondary: 'Caring, generous, people-pleasing', visualStyle: { number: 2, emoji: '❤️', color: '#F9DC5C' } },
			{ value: 'type3', display: 'The Achiever', secondary: 'Ambitious, adaptable, image-conscious', visualStyle: { number: 3, emoji: '⭐', color: '#3185FC' } },
			{ value: 'type4', display: 'The Individualist', secondary: 'Expressive, dramatic, self-absorbed', visualStyle: { number: 4, emoji: '🎭', color: '#5C4742' } },
			{ value: 'type5', display: 'The Investigator', secondary: 'Perceptive, innovative, isolated', visualStyle: { number: 5, emoji: '🔍', color: '#8DA9C4' } },
			{ value: 'type6', display: 'The Loyalist', secondary: 'Engaging, responsible, anxious', visualStyle: { number: 6, emoji: '🛡️', color: '#564D65' } },
			{ value: 'type7', display: 'The Enthusiast', secondary: 'Spontaneous, versatile, scattered', visualStyle: { number: 7, emoji: '🎉', color: '#F7B801' } },
			{ value: 'type8', display: 'The Challenger', secondary: 'Self-confident, decisive, confrontational', visualStyle: { number: 8, emoji: '🔥', color: '#BC412B' } },
			{ value: 'type9', display: 'The Peacemaker', secondary: 'Receptive, reassuring, complacent', visualStyle: { number: 9, emoji: '☮️', color: '#497E76' } }
			]
		}
		],
			visualStyle: {
				type: 'number',
				cssClass: 'circle-identity-display'
			},
			valueDisplayStyle: {
				type: 'number',
				template: '{NUMBER} {DISPLAY}'
			}
	}*/
},
    
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
    // Level 0: Simplest form - single point/circle
    [{ sides: 1, starFactor: 1, borderPercent: .1, scale: .2 }],
    
    // Level 1: Simple circular form
    [{ sides: 21, starFactor: 1, borderPercent: .05, scale: .8 }],
    
    // Level 2: Triangle
    [{ sides: 3, starFactor: 1, borderPercent: .18, scale: .9 }],
    
    // Level 3: Square with overlay
    [{ sides: 4, starFactor: 1, borderPercent: .12 }, { sides: 4, starFactor: 1, borderPercent: .12, rotate: 45 }],
    
    // Level 4: Pentagon with overlay
    [{ sides: 5, starFactor: 1, borderPercent: .10 }, { sides: 5, starFactor: 1, borderPercent: .10, rotate: 36 }],
    
    // Level 5: Star form
    [{ sides: 11, starFactor: 3, borderPercent: .12 }],
    
    // Level 6: Double rotating nonagon
    [{ sides: 9, starFactor: 2, borderPercent: .12, scale: 0.8 }, { sides: 9, starFactor: 2, borderPercent: .08, reverse: 1, scale: 1.2, spinTime: 64 }],
    
    // Level 7: Double rotating 17-sided form
    [{ sides: 17, starFactor: 2, borderPercent: .08 }, { sides: 17, starFactor: 2, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
    
    // Level 8: Complex star patterns
    [{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
    
    // Level 9: Triple layer complex pattern
    //[{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }, { sides: 25, starFactor: 4, borderPercent: .02, scale: 1.5, spinTime: 64 }],
    
    // Level 10: Very complex pattern
    //[{ sides: 30, starFactor: 1, borderPercent: .18 }, { sides: 61, starFactor: 23, borderPercent: .01, reverse: 1, scale: 3.4, spinTime: 32 }],
    
    // Level 11: Hexagon with overlays
    [{ sides: 6, starFactor: 1, borderPercent: .12 }, { sides: 6, starFactor: 1, borderPercent: .08, rotate: 30, scale: 1.1 }],
    
    // Level 12: Heptagon with star factor
    [{ sides: 7, starFactor: 2, borderPercent: .10 }, { sides: 7, starFactor: 3, borderPercent: .08, scale: 1.2 }],
    
    // Level 13: Octagon with rotating overlay
    [{ sides: 8, starFactor: 1, borderPercent: .12 }, { sides: 8, starFactor: 3, borderPercent: .08, reverse: 1, scale: 1.15, spinTime: 40 }],
    
    // Level 14: Nonagon with multiple star factors
    [{ sides: 9, starFactor: 2, borderPercent: .10 }, { sides: 9, starFactor: 4, borderPercent: .08, scale: 1.2 }],
    
    // Level 15: Decagon with star overlay
    [{ sides: 10, starFactor: 1, borderPercent: .12 }, { sides: 10, starFactor: 3, borderPercent: .08, rotate: 18, spinTime: 48 }],
    
    // Level 16: 11-sided with double overlay
    [{ sides: 11, starFactor: 1, borderPercent: .10 }, { sides: 11, starFactor: 3, borderPercent: .08, scale: 1.2 }, { sides: 11, starFactor: 5, borderPercent: .05, scale: 1.4, reverse: 1 }],
    
    // Level 17: Dodecagon with star pattern
    [{ sides: 12, starFactor: 1, borderPercent: .12 }, { sides: 12, starFactor: 5, borderPercent: .08, rotate: 15, scale: 1.2 }],
    
    // Level 18: 13-sided with rotating overlay
    [{ sides: 13, starFactor: 1, borderPercent: .10 }, { sides: 13, starFactor: 5, borderPercent: .08, reverse: 1, scale: 1.2, spinTime: 52 }],
    
    // Level 19: 14-sided with complex overlay
    [{ sides: 14, starFactor: 1, borderPercent: .12 }, { sides: 14, starFactor: 3, borderPercent: .08, scale: 1.25 }, { sides: 7, starFactor: 2, borderPercent: .05, scale: 1.5, spinTime: 44 }],
    
    // Level 20: 15-sided with dual star factors
    [{ sides: 15, starFactor: 1, borderPercent: .10 }, { sides: 15, starFactor: 4, borderPercent: .08, scale: 1.2 }, { sides: 15, starFactor: 7, borderPercent: .05, scale: 1.4, reverse: 1 }],
    
    // Level 21: 16-sided with rotating patterns
    [{ sides: 16, starFactor: 1, borderPercent: .12 }, { sides: 16, starFactor: 3, borderPercent: .08, spinTime: 48 }, { sides: 16, starFactor: 7, borderPercent: .05, scale: 1.3, reverse: 1, spinTime: 36 }],
    
    // Level 22: Enhanced 17-sided form
    [{ sides: 17, starFactor: 1, borderPercent: .10 }, { sides: 17, starFactor: 4, borderPercent: .08, scale: 1.15 }, { sides: 17, starFactor: 8, borderPercent: .05, scale: 1.3, spinTime: 40 }],
    
    // Level 23: 18-sided rotating form
    [{ sides: 18, starFactor: 1, borderPercent: .12 }, { sides: 18, starFactor: 5, borderPercent: .08, scale: 1.2, spinTime: 50 }, { sides: 9, starFactor: 2, borderPercent: .05, scale: 1.4, reverse: 1 }],
    
    // Level 24: 19-sided complex pattern
    [{ sides: 19, starFactor: 1, borderPercent: .10 }, { sides: 19, starFactor: 7, borderPercent: .08, scale: 1.18 }, { sides: 19, starFactor: 9, borderPercent: .05, scale: 1.35, spinTime: 42, reverse: 1 }],
    
    // Level 25: 20-sided with alternating rotation
    [{ sides: 20, starFactor: 1, borderPercent: .12 }, { sides: 20, starFactor: 3, borderPercent: .08, scale: 1.2, spinTime: 46 }, { sides: 20, starFactor: 9, borderPercent: .05, scale: 1.38, spinTime: 52, reverse: 1 }],
    
    // Level 26: Enhanced 21-sided pattern
    [{ sides: 21, starFactor: 1, borderPercent: .10 }, { sides: 21, starFactor: 5, borderPercent: .08, scale: 1.22 }, { sides: 21, starFactor: 10, borderPercent: .05, scale: 1.42, spinTime: 56 }],
    
    // Level 27: 22-sided rotating form
    [{ sides: 22, starFactor: 1, borderPercent: .12 }, { sides: 22, starFactor: 9, borderPercent: .08, scale: 1.25, spinTime: 48 }, { sides: 11, starFactor: 3, borderPercent: .05, scale: 1.5, reverse: 1 }],
    
    // Level 28: 23-sided with multiple overlays
    [{ sides: 23, starFactor: 1, borderPercent: .10 }, { sides: 23, starFactor: 7, borderPercent: .08, scale: 1.2 }, { sides: 23, starFactor: 11, borderPercent: .05, scale: 1.4, spinTime: 60, reverse: 1 }],
    
    // Level 29: 24-sided symmetrical form
    [{ sides: 24, starFactor: 1, borderPercent: .12 }, { sides: 24, starFactor: 5, borderPercent: .08, scale: 1.25, spinTime: 54 }, { sides: 12, starFactor: 5, borderPercent: .05, scale: 1.45, reverse: 1 }],
    
    // Level 30: Enhanced 25-sided complex form
    [{ sides: 25, starFactor: 1, borderPercent: .10 }, { sides: 25, starFactor: 7, borderPercent: .08, scale: 1.22 }, { sides: 25, starFactor: 12, borderPercent: .05, scale: 1.4, spinTime: 45, reverse: 1 }],
    
    // Level 31: 26-sided with rotating overlays
    [{ sides: 26, starFactor: 1, borderPercent: .12 }, { sides: 26, starFactor: 9, borderPercent: .08, scale: 1.28, spinTime: 50 }, { sides: 13, starFactor: 5, borderPercent: .05, scale: 1.5, reverse: 1 }],
    
    // Level 32: 27-sided triple layer
    [{ sides: 27, starFactor: 1, borderPercent: .10 }, { sides: 27, starFactor: 8, borderPercent: .08, scale: 1.2 }, { sides: 27, starFactor: 13, borderPercent: .05, scale: 1.4, spinTime: 42, reverse: 1 }],
    
    // Level 33: 28-sided with alternating rotations
    [{ sides: 28, starFactor: 1, borderPercent: .12 }, { sides: 28, starFactor: 5, borderPercent: .08, scale: 1.22, spinTime: 46 }, { sides: 14, starFactor: 3, borderPercent: .05, scale: 1.42, reverse: 1, spinTime: 52 }],
    
    // Level 34: 29-sided complex pattern
    [{ sides: 29, starFactor: 1, borderPercent: .10 }, { sides: 29, starFactor: 11, borderPercent: .08, scale: 1.25 }, { sides: 29, starFactor: 14, borderPercent: .05, scale: 1.45, spinTime: 48, reverse: 1 }],
    
    // Level 35: Enhanced 30-sided form
    [{ sides: 30, starFactor: 1, borderPercent: .12 }, { sides: 30, starFactor: 7, borderPercent: .08, scale: 1.28, spinTime: 50 }, { sides: 30, starFactor: 13, borderPercent: .05, scale: 1.5, reverse: 1, spinTime: 40 }],
    
    // Level 36: 31-sided with triple overlays
    [{ sides: 31, starFactor: 1, borderPercent: .10 }, { sides: 31, starFactor: 10, borderPercent: .08, scale: 1.22 }, { sides: 31, starFactor: 15, borderPercent: .05, scale: 1.42, spinTime: 44, reverse: 1 }],
    
    // Level 37: 32-sided with alternating patterns
    [{ sides: 32, starFactor: 1, borderPercent: .12 }, { sides: 32, starFactor: 11, borderPercent: .08, scale: 1.25, spinTime: 48 }, { sides: 16, starFactor: 5, borderPercent: .05, scale: 1.48, reverse: 1, spinTime: 56 }],
    
    // Level 38: 33-sided complex form
    [{ sides: 33, starFactor: 1, borderPercent: .10 }, { sides: 33, starFactor: 13, borderPercent: .08, scale: 1.28 }, { sides: 33, starFactor: 16, borderPercent: .05, scale: 1.5, spinTime: 52, reverse: 1 }],
    
    // Level 39: 34-sided rotating pattern
    [{ sides: 34, starFactor: 1, borderPercent: .12 }, { sides: 34, starFactor: 15, borderPercent: .08, scale: 1.3, spinTime: 56 }, { sides: 17, starFactor: 4, borderPercent: .05, scale: 1.52, reverse: 1, spinTime: 48 }],
    
    // Level 40: 35-sided with triple layers
    [{ sides: 35, starFactor: 1, borderPercent: .10 }, { sides: 35, starFactor: 12, borderPercent: .08, scale: 1.25 }, { sides: 35, starFactor: 17, borderPercent: .05, scale: 1.45, spinTime: 60, reverse: 1 }],
    
    // Level 41: 36-sided symmetrical form
    [{ sides: 36, starFactor: 1, borderPercent: .12 }, { sides: 36, starFactor: 11, borderPercent: .08, scale: 1.28, spinTime: 54 }, { sides: 18, starFactor: 5, borderPercent: .05, scale: 1.5, reverse: 1, spinTime: 42 }],
    
    // Level 42: 37-sided complex pattern
    [{ sides: 37, starFactor: 1, borderPercent: .10 }, { sides: 37, starFactor: 14, borderPercent: .08, scale: 1.3 }, { sides: 37, starFactor: 18, borderPercent: .05, scale: 1.52, spinTime: 46, reverse: 1 }],
    
    // Level 43: 38-sided with alternating rotations
    [{ sides: 38, starFactor: 1, borderPercent: .12 }, { sides: 38, starFactor: 17, borderPercent: .08, scale: 1.32, spinTime: 50 }, { sides: 19, starFactor: 8, borderPercent: .05, scale: 1.55, reverse: 1, spinTime: 44 }],
    
    // Level 44: 39-sided triple layer
    [{ sides: 39, starFactor: 1, borderPercent: .10 }, { sides: 39, starFactor: 16, borderPercent: .08, scale: 1.28 }, { sides: 39, starFactor: 19, borderPercent: .05, scale: 1.5, spinTime: 52, reverse: 1 }],
    
    // Level 45: 40-sided with complex overlays
    [{ sides: 40, starFactor: 1, borderPercent: .12 }, { sides: 40, starFactor: 13, borderPercent: .08, scale: 1.3, spinTime: 48 }, { sides: 20, starFactor: 9, borderPercent: .05, scale: 1.52, reverse: 1, spinTime: 54 }],
    
    // Level 46: 41-sided intricate pattern
    [{ sides: 41, starFactor: 1, borderPercent: .10 }, { sides: 41, starFactor: 16, borderPercent: .08, scale: 1.32 }, { sides: 41, starFactor: 20, borderPercent: .05, scale: 1.55, spinTime: 46, reverse: 1 }],
    
    // Level 47: 42-sided with rotating overlays
    [{ sides: 42, starFactor: 1, borderPercent: .12 }, { sides: 42, starFactor: 19, borderPercent: .08, scale: 1.35, spinTime: 50 }, { sides: 21, starFactor: 8, borderPercent: .05, scale: 1.58, reverse: 1, spinTime: 42 }],
    
    // Level 48: 43-sided complex form
    [{ sides: 43, starFactor: 1, borderPercent: .10 }, { sides: 43, starFactor: 21, borderPercent: .08, scale: 1.3 }, { sides: 43, starFactor: 20, borderPercent: .05, scale: 1.5, spinTime: 56, reverse: 1 }],
    
    // Level 49: 44-sided with alternating patterns
    [{ sides: 44, starFactor: 1, borderPercent: .12 }, { sides: 44, starFactor: 15, borderPercent: .08, scale: 1.32, spinTime: 48 }, { sides: 22, starFactor: 7, borderPercent: .05, scale: 1.55, reverse: 1, spinTime: 54 }],
    
    // Level 50: 45-sided complex rotating form
    [{ sides: 45, starFactor: 1, borderPercent: .10 }, { sides: 45, starFactor: 19, borderPercent: .08, scale: 1.35 }, { sides: 45, starFactor: 22, borderPercent: .04, scale: 1.6, spinTime: 42, reverse: 1 }],
    
    // Levels 51-100: Increasingly complex forms with higher side counts, more layers, and intricate patterns
    
    // Level 51: 46-sided with triple rotating layers
    [{ sides: 46, starFactor: 1, borderPercent: .12 }, { sides: 46, starFactor: 17, borderPercent: .08, scale: 1.3, spinTime: 46 }, { sides: 46, starFactor: 21, borderPercent: .04, scale: 1.55, spinTime: 52, reverse: 1 }],
    
    // Level 52: 47-sided with alternating patterns
    [{ sides: 47, starFactor: 1, borderPercent: .10 }, { sides: 47, starFactor: 20, borderPercent: .08, scale: 1.32 }, { sides: 47, starFactor: 23, borderPercent: .04, scale: 1.58, spinTime: 48, reverse: 1 }],
    
    // Level 53: 48-sided quad-layer form
    [{ sides: 48, starFactor: 1, borderPercent: .12 }, { sides: 48, starFactor: 19, borderPercent: .08, scale: 1.28, spinTime: 44 }, 
     { sides: 48, starFactor: 23, borderPercent: .05, scale: 1.5, spinTime: 50, reverse: 1 }, { sides: 24, starFactor: 11, borderPercent: .03, scale: 1.75, spinTime: 42 }],
    
    // Level 54: 49-sided complex pattern
    [{ sides: 49, starFactor: 1, borderPercent: .10 }, { sides: 49, starFactor: 22, borderPercent: .08, scale: 1.3 }, { sides: 49, starFactor: 24, borderPercent: .05, scale: 1.6, spinTime: 48, reverse: 1 }],
    
    // Level 55: 50-sided form with multiple star factors
    [{ sides: 50, starFactor: 1, borderPercent: .12 }, { sides: 50, starFactor: 21, borderPercent: .08, scale: 1.35, spinTime: 54 }, { sides: 50, starFactor: 24, borderPercent: .04, scale: 1.65, spinTime: 46, reverse: 1 }],
    
    // Level 56: 52-sided intricate pattern
    [{ sides: 52, starFactor: 1, borderPercent: .10 }, { sides: 52, starFactor: 25, borderPercent: .08, scale: 1.32 }, { sides: 52, starFactor: 23, borderPercent: .05, scale: 1.55, spinTime: 52, reverse: 1 }],
    
    // Level 57: 54-sided rotating form
    [{ sides: 54, starFactor: 1, borderPercent: .12 }, { sides: 54, starFactor: 25, borderPercent: .08, scale: 1.3, spinTime: 48 }, { sides: 54, starFactor: 26, borderPercent: .04, scale: 1.6, spinTime: 44, reverse: 1 }],
    
    // Level 58: 56-sided complex pattern
    [{ sides: 56, starFactor: 1, borderPercent: .10 }, { sides: 56, starFactor: 27, borderPercent: .08, scale: 1.35 }, { sides: 56, starFactor: 25, borderPercent: .05, scale: 1.62, spinTime: 50, reverse: 1 }],
    
    // Level 59: 58-sided form
    [{ sides: 58, starFactor: 1, borderPercent: .12 }, { sides: 58, starFactor: 27, borderPercent: .08, scale: 1.38, spinTime: 46 }, { sides: 58, starFactor: 28, borderPercent: .04, scale: 1.65, spinTime: 52, reverse: 1 }],
    
    // Level 60: 60-sided intricate pattern with quad layers
    [{ sides: 60, starFactor: 1, borderPercent: .10 }, { sides: 60, starFactor: 23, borderPercent: .08, scale: 1.3, spinTime: 48 }, 
     { sides: 60, starFactor: 29, borderPercent: .05, scale: 1.5, spinTime: 54, reverse: 1 }, { sides: 30, starFactor: 7, borderPercent: .03, scale: 1.8, spinTime: 40 }],
    
    // Level 61: 62-sided complex form
    [{ sides: 62, starFactor: 1, borderPercent: .12 }, { sides: 62, starFactor: 29, borderPercent: .08, scale: 1.35 }, { sides: 62, starFactor: 30, borderPercent: .04, scale: 1.64, spinTime: 46, reverse: 1 }],
    
    // Level 62: 64-sided pattern
    [{ sides: 64, starFactor: 1, borderPercent: .10 }, { sides: 64, starFactor: 31, borderPercent: .08, scale: 1.32, spinTime: 50 }, { sides: 64, starFactor: 21, borderPercent: .05, scale: 1.58, spinTime: 44, reverse: 1 }],
    
    // Level 63: 66-sided complex rotating form
    [{ sides: 66, starFactor: 1, borderPercent: .12 }, { sides: 66, starFactor: 31, borderPercent: .08, scale: 1.34, spinTime: 52 }, { sides: 66, starFactor: 32, borderPercent: .04, scale: 1.66, spinTime: 48, reverse: 1 }],
    
    // Level 64: 68-sided pattern
    [{ sides: 68, starFactor: 1, borderPercent: .10 }, { sides: 68, starFactor: 33, borderPercent: .08, scale: 1.38 }, { sides: 68, starFactor: 23, borderPercent: .05, scale: 1.7, spinTime: 50, reverse: 1 }],
    
    // Level 65: 70-sided intricate form
    [{ sides: 70, starFactor: 1, borderPercent: .12 }, { sides: 70, starFactor: 33, borderPercent: .08, scale: 1.35, spinTime: 46 }, { sides: 70, starFactor: 34, borderPercent: .04, scale: 1.68, spinTime: 52, reverse: 1 }],
    
    // Level 66: 72-sided quad-layer pattern
    [{ sides: 72, starFactor: 1, borderPercent: .10 }, { sides: 72, starFactor: 35, borderPercent: .08, scale: 1.32, spinTime: 48 }, 
     { sides: 72, starFactor: 31, borderPercent: .05, scale: 1.55, spinTime: 54, reverse: 1 }, { sides: 36, starFactor: 5, borderPercent: .03, scale: 1.85, spinTime: 42 }],
    
    // Level 67: 74-sided complex form
    [{ sides: 74, starFactor: 1, borderPercent: .12 }, { sides: 74, starFactor: 35, borderPercent: .08, scale: 1.36 }, { sides: 74, starFactor: 36, borderPercent: .04, scale: 1.7, spinTime: 50, reverse: 1 }],
    
    // Level 68: 76-sided pattern
    [{ sides: 76, starFactor: 1, borderPercent: .10 }, { sides: 76, starFactor: 37, borderPercent: .08, scale: 1.35, spinTime: 52 }, { sides: 76, starFactor: 27, borderPercent: .05, scale: 1.65, spinTime: 46, reverse: 1 }],
    
    // Level 69: 78-sided rotating form
    [{ sides: 78, starFactor: 1, borderPercent: .12 }, { sides: 78, starFactor: 37, borderPercent: .08, scale: 1.38, spinTime: 48 }, { sides: 78, starFactor: 38, borderPercent: .04, scale: 1.72, spinTime: 54, reverse: 1 }],
    
    // Level 70: 80-sided intricate pattern with quad layers
    [{ sides: 80, starFactor: 1, borderPercent: .10 }, { sides: 80, starFactor: 39, borderPercent: .08, scale: 1.34, spinTime: 50 }, 
     { sides: 80, starFactor: 33, borderPercent: .05, scale: 1.6, spinTime: 46, reverse: 1 }, { sides: 40, starFactor: 9, borderPercent: .03, scale: 1.9, spinTime: 42 }],
    
    // Level 71: 82-sided form
    [{ sides: 82, starFactor: 1, borderPercent: .10 }, { sides: 82, starFactor: 39, borderPercent: .08, scale: 1.35 }, { sides: 82, starFactor: 40, borderPercent: .04, scale: 1.7, spinTime: 52, reverse: 1 }],
    
    // Level 72: 84-sided pattern
    [{ sides: 84, starFactor: 1, borderPercent: .12 }, { sides: 84, starFactor: 41, borderPercent: .08, scale: 1.38, spinTime: 48 }, { sides: 84, starFactor: 29, borderPercent: .05, scale: 1.68, spinTime: 54, reverse: 1 }],
    
    // Level 73: 86-sided complex form
    [{ sides: 86, starFactor: 1, borderPercent: .10 }, { sides: 86, starFactor: 41, borderPercent: .08, scale: 1.36 }, { sides: 86, starFactor: 42, borderPercent: .04, scale: 1.74, spinTime: 46, reverse: 1 }],
    
    // Level 74: 88-sided rotating pattern
    [{ sides: 88, starFactor: 1, borderPercent: .12 }, { sides: 88, starFactor: 43, borderPercent: .08, scale: 1.35, spinTime: 50 }, { sides: 88, starFactor: 31, borderPercent: .05, scale: 1.7, spinTime: 42, reverse: 1 }],
    
    // Level 75: 90-sided intricate form
    [{ sides: 90, starFactor: 1, borderPercent: .10 }, { sides: 90, starFactor: 43, borderPercent: .08, scale: 1.38 }, { sides: 90, starFactor: 44, borderPercent: .04, scale: 1.76, spinTime: 48, reverse: 1 }],
    ],

    /*elements: {
	    fire: { emoji: '🜂', color: '#FF5500', displayName: 'Fire', description: 'Transformation, energy' },
	    earth: { emoji: '🜃', color: '#8B4513', displayName: 'Earth', description: 'Stability, grounding' },
	    air: { emoji: '🜁', color: '#E0FFFF', displayName: 'Air', description: 'Movement, freedom' },
	    water: { emoji: '🜄', color: '#1E90FF', displayName: 'Water', description: 'Flow, emotion' },
	    space: { emoji: '✧', color: '#191970', displayName: 'Space', description: 'Expansion, potential' },
	    sound: { emoji: '♫', color: '#9370DB', displayName: 'Sound', description: 'Vibration, expression' },
	    light: { emoji: '☀', color: '#FFD700', displayName: 'Light', description: 'Clarity, illumination' },
	    thought: { emoji: '☯', color: '#E6E6FA', displayName: 'Thought', description: 'Consciousness, awareness' }
    },*/

    elements: {
        fire: { emoji: '🔥', color: '#FF5500', displayName: 'Fire', description: 'Transformation, energy' },
        earth: { emoji: '🌱', color: '#8B4513', displayName: 'Earth', description: 'Stability, grounding' },
        air: { emoji: '💨', color: '#E0FFFF', displayName: 'Air', description: 'Movement, freedom' },
        water: { emoji: '💧', color: '#1E90FF', displayName: 'Water', description: 'Flow, emotion' },
        space: { emoji: '✨', color: '#191970', displayName: 'Space', description: 'Expansion, potential' },
        sound: { emoji: '🔊', color: '#9370DB', displayName: 'Sound', description: 'Vibration, expression' },
        light: { emoji: '☀️', color: '#FFD700', displayName: 'Light', description: 'Clarity, illumination' },
        thought: { emoji: '💭', color: '#E6E6FA', displayName: 'Thought', description: 'Consciousness, awareness' }
    },
    
    // Attribute information
    attributeInfo: {
	    cause: { emoji: '⚡', color: '#9999CC', displayName: 'Cause', description: 'Caused by' },
	    push: { emoji: '🎈', color: '#FFFFB0', displayName: 'Pushes', description: 'Compels' },
	    stop: { emoji: '⚓', color: '#BD2C2C', displayName: 'Stops', description: 'Inhibits' },
        treasure: { emoji: '💎', color: '#66D6FF', displayName: 'Gems', description: 'Proxy success criteria' },
        door: { emoji: '⛰️', color: '#8B4513', displayName: 'Mountains', description: 'Activity areas' },
        key: { emoji: '⛏️', color: '#555555', displayName: 'Tools', description: 'Skills & resources' },
        demon: { emoji: '😈', color: '#663399', displayName: 'Demons', description: 'Challenges' },
        sword: { emoji: '🗡️', color: '#C0C0C0', displayName: 'Swords', description: 'Slays demons' },
	chain: { emoji: '⛓️', color: '#2F4F4F', displayName: 'Chains', description: 'Confines demons' },
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
        maxLineLength: 120,  // Maximum length for visible connection lines (in pixels)
	overlapThreshold: 40,
        lineColor: 'rgba(255, 255, 255, 0.3)',  // Default connection line color
        lineColorHighlight: 'rgba(255, 255, 255, 0.7)', // Color for highlighted connections
        lineWidth: 1, // Default line width in pixels
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
