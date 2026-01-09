// Updated colorFamilies.js - Dynamic color generation based on hues and transformations with mood value support

export const colorHues = [
  { name: "Red", hue: 0 },
  { name: "Vermilion", hue: 15 },
  { name: "Orange", hue: 25 },
  { name: "Gold", hue: 40 },
  { name: "Yellow", hue: 55 },
  { name: "Chartreuse", hue: 75 },
  { name: "Green", hue: 110 },
  { name: "Jade", hue: 150 },
  { name: "Teal", hue: 165 },
  { name: "Cyan", hue: 180 },
  { name: "Sky", hue: 200 },
  { name: "Blue", hue: 225 },
  { name: "Indigo", hue: 265 },
  { name: "Violet", hue: 280 },
  { name: "Purple", hue: 300 },
  { name: "Magenta", hue: 320 },
  { name: "Pink", hue: 340 },
];

export const colorTransformations = [
  { s: "100%", l: "75%" }, // Light
  { s: "100%", l: "50%" }, // Solid
  { s: "100%", l: "30%" }, // Dark
  { s: "40%", l: "50%" },
];

// Special color families that don't follow the hue pattern
export const specialColorFamilies = [
    /*{
    name: "Warm Browns",
    colors: [
      'hsl(20, 70%, 75%)',
      'hsl(20, 70%, 50%)',
      'hsl(20, 70%, 30%)',
    ]
  },
  {
    name: "Cool Browns",
    colors: [
      'hsl(20, 50%, 75%)',
      'hsl(20, 50%, 50%)',
      'hsl(20, 50%, 30%)'
    ]
  },
  {
    name: "Light Grays",
    colors: [
      'hsl(0, 0%, 100%)',
      'hsl(0, 0%, 80%)',
      'hsl(0, 0%, 60%)'
    ]
  },
  {
    name: "Dark Grays",
    colors: [
      'hsl(0, 0%, 40%)',
      'hsl(0, 0%, 20%)',
      'hsl(0, 0%, 0%)'
    ]
  },*/
  {
    name: "Great",
    colors: [
      'hsl(48, 100%, 50%)',
    ]
  },
  {
    name: "Okay",
    colors: [
      'hsl(48, 100%, 80%)',
    ]
  },
  {
    name: "Concerned",
    colors: [
      'hsl(0, 100%, 80%)',
    ]
  },
  {
    name: "Bad",
    colors: [
      'hsl(0, 100%, 60%)',
    ]
  },
  {
    name: "Awful",
    colors: [
      'hsl(0, 100%, 20%)',
    ]
  },
  {
    name: "Neutral",
    colors: [
      'hsl(0, 0%, 70%)',
    ]
  },
];

// NEW: Mood value lookup table
export const MOOD_VALUES = {
  'Great': 1.0,
  'Okay': 0.8,
  'Concerned': 0.6,
  'Bad': 0.3,
  'Awful': 0.0,
  'Neutral': undefined
};

// Generate color families dynamically
export const generateColorFamilies = () => {
  const generatedFamilies = colorHues.map(hue => ({
    name: hue.name,
    colors: colorTransformations.map(transform => 
      `hsl(${hue.hue}, ${transform.s}, ${transform.l})`
    )
  }));

  //return [...generatedFamilies, ...specialColorFamilies];
  return [...specialColorFamilies];
};

// Export the generated color families
export const colorFamilies = generateColorFamilies();

// NEW: Create a reverse lookup from color value to color family name
const createColorToNameMap = () => {
  const colorToName = new Map();
  
  colorFamilies.forEach(family => {
    family.colors.forEach(color => {
      colorToName.set(color, family.name);
    });
  });
  
  return colorToName;
};

export const colorToNameMap = createColorToNameMap();

// NEW: Get mood value for a color
export const getMoodValueForColor = (colorValue) => {
  if (!colorValue) return undefined;
  
  const colorName = colorToNameMap.get(colorValue);
  if (!colorName) return undefined;
  
  return MOOD_VALUES[colorName];
};

// NEW: Get mood value for a color name
export const getMoodValueForColorName = (colorName) => {
  return MOOD_VALUES[colorName];
};

const parseHSL = (hslString) => {
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) throw new Error(`Invalid HSL format: ${hslString}`);
  
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3])
  };
};

// Helper function to interpolate between two values
const lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};

// Helper function to interpolate between two HSL colors
const interpolateHSL = (color1, color2, factor) => {
  const hsl1 = parseHSL(color1);
  const hsl2 = parseHSL(color2);
  
  // Handle hue interpolation (accounting for circular nature)
  let h1 = hsl1.h;
  let h2 = hsl2.h;
  
  // Find the shortest path around the color wheel
  const diff = h2 - h1;
  if (Math.abs(diff) > 180) {
    if (diff > 0) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }
  
  const interpolatedH = Math.round(lerp(h1, h2, factor)) % 360;
  const interpolatedS = Math.round(lerp(hsl1.s, hsl2.s, factor));
  const interpolatedL = Math.round(lerp(hsl1.l, hsl2.l, factor));
  
  return `hsl(${interpolatedH}, ${interpolatedS}%, ${interpolatedL}%)`;
};

// Main function to get interpolated mood color
export const getMoodColor = (value) => {
  // Clamp value to 0.0-1.0 range
  value = Math.max(0.0, Math.min(1.0, value));
  
  // Define mood stops in ascending order by value
  const moodStops = [
    { value: 0.0, name: 'Awful', color: 'hsl(0, 100%, 20%)' },
    { value: 0.3, name: 'Bad', color: 'hsl(0, 100%, 60%)' },
    { value: 0.6, name: 'Concerned', color: 'hsl(0, 100%, 80%)' },
    { value: 0.8, name: 'Okay', color: 'hsl(48, 100%, 80%)' },
    { value: 1.0, name: 'Great', color: 'hsl(48, 100%, 50%)' }
  ];
  
  // Find the exact match first
  const exactMatch = moodStops.find(stop => stop.value === value);
  if (exactMatch) {
    return exactMatch.color;
  }
  
  // Find the two stops to interpolate between
  let lowerStop = moodStops[0];
  let upperStop = moodStops[moodStops.length - 1];
  
  for (let i = 0; i < moodStops.length - 1; i++) {
    if (value >= moodStops[i].value && value <= moodStops[i + 1].value) {
      lowerStop = moodStops[i];
      upperStop = moodStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = upperStop.value - lowerStop.value;
  const factor = range === 0 ? 0 : (value - lowerStop.value) / range;
  
  // Return interpolated color
  return interpolateHSL(lowerStop.color, upperStop.color, factor);
};
