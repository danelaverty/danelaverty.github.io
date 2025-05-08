// src/config/Config.js
// Optimized configuration settings for the Chakra Visualizer using compression techniques

(function(ChakraApp) {
  // Helper function to expand compressed chakra forms
  function expandChakraForm(compressedForm) {
    return compressedForm.map(function(formSet) {
      return formSet.map(function(form) {
        // Expand the compressed format to full objects
        var expanded = {
          sides: form[0],
          starFactor: form[1] || 1,
          borderPercent: form[2] / 100 || 0.1
        };
        
        if (form.length > 3) {
          if (form[3]) expanded.rotate = form[3];
          if (form[4]) expanded.scale = form[4];
          if (form[5]) expanded.reverse = 1;
          if (form[6]) expanded.spinTime = form[6];
        }
        
        return expanded;
      });
    });
  }

  // Helper function to expand crystal categories
  function expandCrystalCategories(categories) {
    return categories.map(function(cat) {
      return {
        name: cat[0],
        bg: cat[1],
        options: cat[2].map(function(opt) {
          return { value: opt[0], display: opt[1], secondary: null };
        })
      };
    });
  }

  // Compressed data
  var CompressedConfig = {
    defaultName: '???',
    
    // Compressed crystal data - format: [category name, bg color, [[value, display], ...]]
    crystalCategories: [
      ["Warm Crystals", "#FFF5F5", [
        ["#FF0050", "Ruby"],
        ["#FF0000", "Garnet"],
        ["#FFAAAA", "Rose Quartz"],
        ["#FF5234", "Carnelian"],
        ["#FFAC00", "Amber"],
        ["#FFE700", "Citrine"],
        ["#B87333", "Tiger's Eye"],
        ["#CD7F32", "Sunstone"],
        ["#D35400", "Fire Agate"],
        ["#A52A2A", "Smoky Quartz"],
        ["#FFFFFF", "Clear Quartz"],
        ["#FFC0CB", "Rhodochrosite"]
      ]],
      ["Cool Crystals", "#F5F5FF", [
        ["#D0FF00", "Peridot"],
        ["#00FF00", "Emerald"],
        ["#00FFD0", "Aquamarine"],
        ["#99EEFF", "Turquoise"],
        ["#0000FF", "Sapphire"],
        ["#AA2BFF", "Amethyst"],
        ["#FF00FF", "Sugilite"],
        ["#800080", "Charoite"],
        ["#483D8B", "Lapis Lazuli"],
        ["#999999", "Hematite"],
        ["#000000", "Obsidian"],
        ["#40E0D0", "Amazonite"]
      ]]
    ],
    
    // Compressed chakra forms - format: [[sides, starFactor, borderPercent*100, rotate?, scale?, reverse?, spinTime?], ...]
    chakraFormsCompressed: [
      [[1, 1, 10, 0, 0.2]],
      [[21, 1, 5, 0, 0.8]],
      [[3, 1, 18, 0, 0.9]],
      [[4, 1, 12], [4, 1, 12, 45]],
      [[5, 1, 10], [5, 1, 10, 36]],
      [[11, 3, 12]],
      [[9, 2, 12, 0, 0.8], [9, 2, 8, 0, 1.2, 1, 64]],
      [[17, 2, 8], [17, 2, 4, 0, 1.2, 1, 32]],
      [[21, 8, 8], [17, 4, 4, 0, 1.2, 1, 32]],
      [[6, 1, 12], [6, 1, 8, 30, 1.1]],
      [[7, 2, 10], [7, 3, 8, 0, 1.2]],
      [[8, 1, 12], [8, 3, 8, 0, 1.15, 1, 40]],
      [[9, 2, 10], [9, 4, 8, 0, 1.2]],
      [[10, 1, 12], [10, 3, 8, 18, 1, 0, 48]],
      [[11, 1, 10], [11, 3, 8, 0, 1.2], [11, 5, 5, 0, 1.4, 1]],
      [[12, 1, 12], [12, 5, 8, 15, 1.2]],
      [[13, 1, 10], [13, 5, 8, 0, 1.2, 1, 52]],
      [[14, 1, 12], [14, 3, 8, 0, 1.25], [7, 2, 5, 0, 1.5, 0, 44]],
      [[15, 1, 10], [15, 4, 8, 0, 1.2], [15, 7, 5, 0, 1.4, 1]],
      [[16, 1, 12], [16, 3, 8, 0, 1, 0, 48], [16, 7, 5, 0, 1.3, 1, 36]],
      [[17, 1, 10], [17, 4, 8, 0, 1.15], [17, 8, 5, 0, 1.3, 0, 40]],
      [[18, 1, 12], [18, 5, 8, 0, 1.2, 0, 50], [9, 2, 5, 0, 1.4, 1]],
      [[19, 1, 10], [19, 7, 8, 0, 1.18], [19, 9, 5, 0, 1.35, 0, 42, 1]],
      [[20, 1, 12], [20, 3, 8, 0, 1.2, 0, 46], [20, 9, 5, 0, 1.38, 0, 52, 1]],
      [[21, 1, 10], [21, 5, 8, 0, 1.22], [21, 10, 5, 0, 1.42, 0, 56]],
      [[22, 1, 12], [22, 9, 8, 0, 1.25, 0, 48], [11, 3, 5, 0, 1.5, 1]],
      [[23, 1, 10], [23, 7, 8, 0, 1.2], [23, 11, 5, 0, 1.4, 0, 60, 1]],
      [[24, 1, 12], [24, 5, 8, 0, 1.25, 0, 54], [12, 5, 5, 0, 1.45, 1]],
      [[25, 1, 10], [25, 7, 8, 0, 1.22], [25, 12, 5, 0, 1.4, 0, 45, 1]],
      [[26, 1, 12], [26, 9, 8, 0, 1.28, 0, 50], [13, 5, 5, 0, 1.5, 1]],
      [[27, 1, 10], [27, 8, 8, 0, 1.2], [27, 13, 5, 0, 1.4, 0, 42, 1]],
      [[28, 1, 12], [28, 5, 8, 0, 1.22, 0, 46], [14, 3, 5, 0, 1.42, 1, 52]],
      [[29, 1, 10], [29, 11, 8, 0, 1.25], [29, 14, 5, 0, 1.45, 0, 48, 1]],
      [[30, 1, 12], [30, 7, 8, 0, 1.28, 0, 50], [30, 13, 5, 0, 1.5, 1, 40]],
      [[31, 1, 10], [31, 10, 8, 0, 1.22], [31, 15, 5, 0, 1.42, 0, 44, 1]],
      [[32, 1, 12], [32, 11, 8, 0, 1.25, 0, 48], [16, 5, 5, 0, 1.48, 1, 56]],
      [[33, 1, 10], [33, 13, 8, 0, 1.28], [33, 16, 5, 0, 1.5, 0, 52, 1]],
      [[34, 1, 12], [34, 15, 8, 0, 1.3, 0, 56], [17, 4, 5, 0, 1.52, 1, 48]],
      [[35, 1, 10], [35, 12, 8, 0, 1.25], [35, 17, 5, 0, 1.45, 0, 60, 1]],
      [[36, 1, 12], [36, 11, 8, 0, 1.28, 0, 54], [18, 5, 5, 0, 1.5, 1, 42]],
      [[37, 1, 10], [37, 14, 8, 0, 1.3], [37, 18, 5, 0, 1.52, 0, 46, 1]],
      [[38, 1, 12], [38, 17, 8, 0, 1.32, 0, 50], [19, 8, 5, 0, 1.55, 1, 44]],
      [[39, 1, 10], [39, 16, 8, 0, 1.28], [39, 19, 5, 0, 1.5, 0, 52, 1]],
      [[40, 1, 12], [40, 13, 8, 0, 1.3, 0, 48], [20, 9, 5, 0, 1.52, 1, 54]]
    ],
    
    // Predefined colors array (unchanged)
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

    circleTypes: [
  {
    id: 'standard',
    name: 'Feelings',
    description: 'Emotional states and experiences',
    shape: 'standard',
    color: '#FF0000',
    position: 1,
  },
  {
    id: 'triangle',
    name: 'Things',
    description: 'Conditions & Systems',
    shape: 'triangle', 
    color: '#88B66d',
    position: 2
  },
  {
    id: 'gem',
    name: 'Themes',
    description: 'Themes & Values',
    shape: 'gem',
    color: '#4a6fc9',
    position: 3
  }
],


    
    // Attribute info - kept as is due to text content
    attributeInfo: {
      cause: { emoji: '⚡', color: '#9999CC', displayName: 'Cause' },
      push: { emoji: '🏃', color: '#FFFFB0', displayName: 'Pushes' },
      stop: { emoji: '🛑', color: '#BD2C2C', displayName: 'Stops' },
      treasure: { emoji: '💎', color: '#66D6FF', displayName: 'Gems' },
      door: { emoji: '⛰️', color: '#8B4513', displayName: 'Mountains' },
      key: { emoji: '⛏️', color: '#555555', displayName: 'Tools' },
      demon: { emoji: '😈', color: '#663399', displayName: 'Demons' },
      sword: { emoji: '🗡️', color: '#C0C0C0', displayName: 'Swords' },
      chain: { emoji: '⛓️', color: '#2F4F4F', displayName: 'Chains' },
      ally: { emoji: '🧝🏻‍♂️', color: '#FF8C00', displayName: 'Allies' },
      me: { emoji: '🧑🏼', color: '#FFCC88', displayName: 'Me' },
      battlefield: { emoji: '⚔️', color: '#5B2503', displayName: 'Battlefield' },
      soldier: { emoji: '💂', color: '#00008B', displayName: 'Soldier' },
      enemy: { emoji: '💂', color: '#8B0000', displayName: 'Enemy' },
      strategy: { emoji: '📝', color: '#DADAC0', displayName: 'Strategy' },
      path: { emoji: '🚪', color: '#4B0082', displayName: 'Path' },
      destination: { emoji: '🏞️', color: '#115522', displayName: 'Destination' },
      tools: { emoji: '🛠️', color: '#555555', displayName: 'Tools' },
      parts: { emoji: '⚙️', color: '#AAAAAA', displayName: 'Parts' },
      machine: { emoji: '🏗️', color: '#666633', displayName: 'The Machine' },
      action: { emoji: '👍', color: '#779977', displayName: 'Action' },
      event: { emoji: '💥', color: '#EECC99', displayName: 'Event' },
      chapter: { emoji: '📃', color: '#EEEEEE', displayName: 'Chapter' },
      book: { emoji: '📕', color: '#DDDDAA', displayName: 'Book' },
      positive: { emoji: '👍', color: '#AADDAA', displayName: 'Positive' },
      negative: { emoji: '👎', color: '#DDAAAA', displayName: 'Negative' },
      problem: { emoji: '🔥', color: '#996622', displayName: 'Problem' },
      evidence: { emoji: '📃', color: '#EEEEEE', displayName: 'Evidence' },
      physicalThing: { emoji: '🧊', color: '#C99', displayName: 'Thing' },
      behavioralThing: { emoji: '🏃', color: '#9CC', displayName: 'Action' },
      conceptualThing: { emoji: '💭', color: '#C9C', displayName: 'Concept' },
      model: { emoji: '🖼️', color: '#2D7', displayName: 'Example' },
      roleModel: { emoji: '🕺', color: '#D72', displayName: 'Role Model' },
      trait: { emoji: '⚡', color: '#D27', displayName: 'Trait' },
    },
    
    // Layout configuration
    sizes: {
      small: { circle: 30, square: 30 },
      medium: { circle: 30, square: 30 }, 
      large: { circle: 30, square: 30 }   
    },
    
    // Meridian and connections settings
    meridian: { x: 200, snapThreshold: 20, lineColor: 'rgba(255, 255, 255, 0.2)' },
    connections: {
      maxLineLength: 120,
      overlapThreshold: 40,
      lineColor: 'rgba(255, 255, 255, 0.3)',
      lineColorHighlight: 'rgba(255, 255, 255, 0.7)',
      lineWidth: 1
    }
  };
  
  // Generate the expanded config by processing compressed data
  ChakraApp.Config = {
    defaultName: CompressedConfig.defaultName,
    
    // Expand crystal categories to full format for color characteristic
    characteristics: {
      color: {
        key: 'color',
        displayName: 'Crystal',
        buttonEmoji: '🎨',
        buttonTitle: 'Change Crystal Color',
        modalTitle: 'Select Crystal',
        categories: expandCrystalCategories(CompressedConfig.crystalCategories),
        visualStyle: {
          type: 'background',
          cssProperty: 'background-color'
        },
        valueDisplayStyle: {
          type: 'swatch',
          template: '<span class="color-value-swatch" style="background-color: {VALUE}"></span><span>{DISPLAY}</span>'
        }
      },
      
	    /*completion: {
  key: 'completion',
  displayName: 'Completion',
  buttonEmoji: '🏗️',
  buttonTitle: 'Set Completion Level',
  modalTitle: 'Select Completion Level',
  categories: [
    {
      name: "Completion Levels",
      options: [
        {
          value: "level0",
          display: "Idea",
          secondary: "Only an idea, doesn't exist yet",
          visualStyle: {
            emoji: "💭",
            number: "0"
          }
        },
        {
          value: "level1",
          display: "In Progress",
          secondary: "Currently being built",
          visualStyle: {
            emoji: "🚧",
            number: "1"
          }
        },
        {
          value: "level2",
          display: "Complete",
          secondary: "Fully built and complete",
          visualStyle: {
            emoji: "✅",
            number: "2"
          }
        }
      ]
    }
  ],
  valueDisplayStyle: {
    type: 'emoji',
    template: '<span>{EMOJI}</span> <span>{DISPLAY}</span>'
  }
},*/
    },
    
    // Directly copy these properties
    predefinedColors: CompressedConfig.predefinedColors,
    circleTypes: CompressedConfig.circleTypes,
    attributeInfo: CompressedConfig.attributeInfo,
    sizes: CompressedConfig.sizes,
    meridian: CompressedConfig.meridian,
    connections: CompressedConfig.connections,
    
    // Expand chakra forms from compressed format
    chakraForms: expandChakraForm(CompressedConfig.chakraFormsCompressed),

  };
  
})(window.ChakraApp = window.ChakraApp || {});
