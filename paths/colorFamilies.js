// Updated colorFamilies.js - Dynamic color generation based on hues and transformations

export const colorHues = [
];

export const colorTransformations = [
  { s: "100%", l: "50%" }, // Solid
];

// Special color families that don't follow the hue pattern
export const specialColorFamilies = [
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
