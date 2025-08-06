// Updated colorFamilies.js - Dynamic color generation based on hues and transformations

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
  {
    name: "Warm Browns",
    colors: [
      'hsl(20, 70%, 75%)',
      'hsl(20, 70%, 50%)',
      'hsl(20, 70%, 30%)'
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
  },
];

// Generate color families dynamically
export const generateColorFamilies = () => {
  const generatedFamilies = colorHues.map(hue => ({
    name: hue.name,
    colors: colorTransformations.map(transform => 
      `hsl(${hue.hue}, ${transform.s}, ${transform.l})`
    )
  }));

  return [...generatedFamilies, ...specialColorFamilies];
};

// Export the generated color families
export const colorFamilies = generateColorFamilies();
