// src/config/Config.js
// Optimized configuration settings for the Chakra Visualizer using compression techniques
// Note: attributeInfo has been migrated to AttributeController.js

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

  function createFlattenedTemplates(templateCategories) {
  var flattened = [];
  
  Object.keys(templateCategories).forEach(function(categoryName) {
    var categoryTemplates = templateCategories[categoryName].templates;
    Object.keys(categoryTemplates).forEach(function(templateName) {
      var template = categoryTemplates[templateName];
      flattened.push({
        id: template.id,
        name: templateName,
        type: template.type,
        description: template.description,
        circles: template.circles,
        category: categoryName
      });
    });
  });
  
  return flattened;
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
      ]]
    ],
    
    // Compressed chakra forms - format: [[sides, starFactor, borderPercent*100, rotate?, scale?, reverse?, spinTime?], ...]
    chakraFormsCompressed: [
      [[3, 1, 18, 0, 0.01]],
      [[3, 1, 18, 0, 0.9]],
      [[4, 1, 12], [4, 1, 12, 45]],
      [[5, 1, 10], [5, 1, 10, 36]],
      [[11, 3, 12]],
      [[7, 2, 12, 0, 0.4], [9, 2, 8, 0, 1.2, 1, 64]],
      [[7, 2, 12, 0, 0.7], [9, 2, 8, 0, 1.2, 1, 64]],
      [[9, 2, 12, 0, 0.8], [9, 2, 8, 0, 1.2, 1, 64]],
      [[11, 2, 7, 0, 1.2], [11, 2, 6, 30, 1.0]],
      [[17, 2, 8], [17, 2, 4, 0, 1.2, 1, 32]],
      [[16, 5, 12, 0, 0.9], [22, 3, 1, 0, 1.8, 1, 32]],
      [[21, 8, 8], [17, 4, 4, 0, 1.2, 1, 32]],
      [[21, 8, 8], [17, 4, 4, 0, 1.2, 1, 32], [25, 4, 2, 0, 1.5, 0, 64]],
      [[6, 1, 12], [6, 1, 8, 30, 1.1]],
      [[7, 2, 10], [7, 3, 8, 0, 1.2]],
      [[8, 1, 12], [8, 3, 8, 0, 1.15, 1, 40]],
      [[9, 2, 10], [9, 4, 8, 0, 1.2]],
      [[10, 1, 12], [10, 3, 8, 18, 0, 0, 48]],
      [[11, 1, 10], [11, 3, 8, 0, 1.2], [11, 5, 5, 0, 1.4, 1]],
      [[14, 1, 12], [14, 3, 8, 0, 1.25], [7, 2, 5, 0, 1.5, 0, 44]],
      [[18, 1, 12], [18, 5, 8, 0, 1.2, 0, 50], [9, 2, 5, 0, 1.4, 1]],
      [[22, 1, 12], [22, 9, 8, 0, 1.25, 0, 48], [11, 3, 5, 0, 1.5, 1]],
      [[23, 1, 10], [23, 7, 8, 0, 1.2], [23, 11, 5, 0, 1.4, 0, 60, 1]],
      [[24, 1, 12], [24, 5, 8, 0, 1.25, 0, 54], [12, 5, 5, 0, 1.45, 1]],
      [[25, 1, 10], [25, 7, 8, 0, 1.22], [25, 12, 5, 0, 1.4, 0, 45, 1]],
      [[26, 1, 12], [26, 9, 8, 0, 1.28, 0, 50], [13, 5, 5, 0, 1.5, 1]],
      [[34, 1, 12], [34, 15, 8, 0, 1.3, 0, 56], [17, 4, 5, 0, 1.52, 1, 48]],
      [[42, 1, 12], [42, 19, 8, 0, 1.35, 0, 50], [21, 8, 5, 0, 1.58, 1, 42]],
      [[44, 1, 12], [44, 15, 8, 0, 1.32, 0, 48], [22, 7, 5, 0, 1.55, 1, 54]],
      [[56, 1, 10], [56, 27, 8, 0, 1.35], [56, 25, 5, 0, 1.62, 1, 50]],
      [[60, 1, 10], [60, 23, 8, 0, 1.3, 0, 48], [60, 29, 5, 0, 1.5, 1, 54], [30, 7, 3, 0, 1.8, 0, 40]],
      [[68, 1, 10], [68, 33, 8, 0, 1.38], [68, 23, 5, 0, 1.7, 1, 50]]
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

    indicatorEmojis: [
      { id: 'important', emoji: '❗', name: 'Important' },
      { id: 'done', emoji: '✔️', name: 'Done' },
      { id: 'good', emoji: '🌟', name: 'Good' },
      { id: 'bad', emoji: '😖', name: 'Bad' },  
      { id: 'start', emoji: '▶️', name: 'Start' },
      { id: 'finish', emoji: '🏁', name: 'Finish' },
    ],

    circleTypes: [
      {
        id: 'standard',
        name: 'Feelings',
        description: 'Emotional states and experiences',
        shape: 'standard',
        color: '#C0C0C0',
        position: 1,
      },
      {
        id: 'star',
        name: 'Moves',
        description: 'Actions & Strategies',
        shape: 'star',
        color: '#FF9933', // Orange color for the star
        position: 2
      },
      {
        id: 'triangle',
        name: 'Things',
        description: 'Conditions & Systems',
        shape: 'triangle', 
        color: '#88B66d',
        position: 3
      },
      {
        id: 'gem',
        name: 'Frameworks',
        description: 'Areas of Concern',
        shape: 'gem',
        color: '#4a6fc9',
        position: 4
      },
    ],

    templateCategories: {
  "Chakras": {
    "color": "#FFF8E1", // Light yellow/cream
    "templates": {
      "7 Chakras": {
        "id": "modern7",
        "type": "gem",
        "description": "Modern chakra system",
        "circles": [
		{ x: 0, y: 410, color: '#FF0000', name: 'SURVIVAL', text: '⚔️' },
          { x: 0, y: 360, color: '#FF8800', name: 'PLEASURE', text: '🍑' },
          { x: 0, y: 300, color: '#FFFF00', name: 'POWER', text: '👑' },
          { x: 0, y: 180, color: '#00AA00', name: 'LOVE', text: '💚' },
          { x: 0, y: 130, color: '#0099FF', name: 'VOICE', text: '📢' },
          { x: 0, y: 75, color: '#550099', name: 'INSIGHT', text: '🔮' },
          { x: 0, y: 30, color: '#FF00FF', name: 'SPIRIT', text: '👑' },
		],
        "color": "#FFE082" // Golden yellow
      },
      "Sat-Cakra-Nirupana": {
        "id": "satCakraNirupana",
        "type": "gem", 
        "description": "Traditional Sanskrit system",
        "circles": [
          { x: 0, y: 410, color: '#FF0000', name: 'MULADHARA' },
          { x: 0, y: 360, color: '#FF8800', name: 'SVADHISTHANA' },
          { x: 0, y: 300, color: '#999999', name: 'MANIPURA' },
          { x: 0, y: 180, color: '#FF0000', name: 'ANAHATA' },
          { x: 0, y: 130, color: '#7700AA', name: 'VISHUDDHA' },
          { x: 0, y: 75, color: '#F5F5F5', name: 'AJNA' },
          { x: 0, y: 30, color: '#FFFFFF', name: 'SAHASRARA' },
        ],
        "color": "#FFCC02" // Bright yellow
      }
    }
  },
  "Personality Types": {
    "color": "#F3E5F5", // Light purple
    "templates": {
      "Enneagram": {
        "id": "enneagram",
        "type": "gem",
        "description": "Nine personality types",
        "circles": [
          { x: 0, y: 50, color: '#FF0000', name: 'REFORMER', text: '1' },
          { x: 96, y: 85, color: '#FF6B35', name: 'HELPER', text: '2' },
          { x: 148, y: 174, color: '#FFD23F', name: 'ACHIEVER', text: '3' },
          { x: 130, y: 275, color: '#88D8B0', name: 'INDIVIDUALIST', text: '4' },
          { x: 51, y: 341, color: '#4ECDC4', name: 'INVESTIGATOR', text: '5' },
          { x: -51, y: 341, color: '#4A90E2', name: 'LOYALIST', text: '6' },
          { x: -130, y: 275, color: '#9013FE', name: 'ENTHUSIAST', text: '7' },
          { x: -148, y: 174, color: '#E91E63', name: 'CHALLENGER', text: '8' },
          { x: -96, y: 85, color: '#795548', name: 'PEACEMAKER', text: '9' },
        ],
        "color": "#BA68C8" // Medium purple
      },
      "MBTI Types": {
        "id": "mbti",
        "type": "gem",
        "description": "Myers-Briggs personality indicators",
        "circles": [
          { x: -120, y: 80, color: '#FF6B6B', name: 'ENFP' },
          { x: -40, y: 80, color: '#4ECDC4', name: 'ENTP' },
          { x: 40, y: 80, color: '#45B7D1', name: 'ENFJ' },
          { x: 120, y: 80, color: '#96CEB4', name: 'ENTJ' },
          { x: -120, y: 140, color: '#FFEAA7', name: 'ESFP' },
          { x: -40, y: 140, color: '#DDA0DD', name: 'ESTP' },
          { x: 40, y: 140, color: '#98D8C8', name: 'ESFJ' },
          { x: 120, y: 140, color: '#A29BFE', name: 'ESTJ' },
          { x: -120, y: 200, color: '#FFB3BA', name: 'INFP' },
          { x: -40, y: 200, color: '#BFEFFF', name: 'INTP' },
          { x: 40, y: 200, color: '#B5EAD7', name: 'INFJ' },
          { x: 120, y: 200, color: '#C7CEEA', name: 'INTJ' },
          { x: -120, y: 260, color: '#FFDFBA', name: 'ISFP' },
          { x: -40, y: 260, color: '#FFB347', name: 'ISTP' },
          { x: 40, y: 260, color: '#F8BBD9', name: 'ISFJ' },
          { x: 120, y: 260, color: '#E6E6FA', name: 'ISTJ' },
        ],
        "color": "#9C27B0" // Purple
      }
    }
  },
  "Mystical": {
    "color": "#E8EAF6", // Light indigo
    "templates": {
      "Tree of Life": {
        "id": "sephiroth",
        "type": "gem",
        "description": "Kabbalistic Sephiroth",
        "circles": [
          { x: 0, y: 30, color: '#FFFFFF', name: 'KETHER', text: 'כ' },
          { x: -80, y: 80, color: '#C0C0C0', name: 'CHOKMAH', text: 'ח' },
          { x: 80, y: 80, color: '#000000', name: 'BINAH', text: 'ב' },
          { x: -80, y: 140, color: '#4169E1', name: 'CHESED', text: 'ח' },
          { x: 80, y: 140, color: '#DC143C', name: 'GEBURAH', text: 'ג' },
          { x: 0, y: 180, color: '#FFD700', name: 'TIPHARETH', text: 'ת' },
          { x: -80, y: 220, color: '#32CD32', name: 'NETZACH', text: 'נ' },
          { x: 80, y: 220, color: '#FF4500', name: 'HOD', text: 'ה' },
          { x: 0, y: 260, color: '#9400D3', name: 'YESOD', text: 'י' },
          { x: 0, y: 320, color: '#8B4513', name: 'MALKUTH', text: 'מ' },
        ],
        "color": "#7986CB" // Indigo
      },
      "Zodiac Signs": {
        "id": "zodiac",
        "type": "gem",
        "description": "Astrological signs",
        "circles": [
          { x: 0, y: 30, color: '#FF0000', name: 'ARIES', text: '♈︎' },
          { x: 85, y: 52, color: '#8B4513', name: 'TAURUS', text: '♉︎' },
          { x: 143, y: 105, color: '#FFD700', name: 'GEMINI', text: '♊︎' },
          { x: 163, y: 180, color: '#C0C0C0', name: 'CANCER', text: '♋︎' },
          { x: 143, y: 255, color: '#FF8C00', name: 'LEO', text: '♌︎' },
          { x: 85, y: 308, color: '#228B22', name: 'VIRGO', text: '♍︎' },
          { x: 0, y: 330, color: '#FF69B4', name: 'LIBRA', text: '♎︎' },
          { x: -85, y: 308, color: '#8B0000', name: 'SCORPIO', text: '♏︎' },
          { x: -143, y: 255, color: '#9932CC', name: 'SAGITTARIUS', text: '♐︎' },
          { x: -163, y: 180, color: '#556B2F', name: 'CAPRICORN', text: '♑︎' },
          { x: -143, y: 105, color: '#4682B4', name: 'AQUARIUS', text: '♒︎' },
          { x: -85, y: 52, color: '#20B2AA', name: 'PISCES', text: '♓︎' },
        ],
        "color": "#9FA8DA" // Light indigo
      }
    }
  },
  "Basic Sets": {
    "color": "#E8F5E8", // Light green
    "templates": {
      "Basic Emotions": {
        "id": "basic_emotions",
        "type": "standard",
        "description": "Fundamental emotional states",
        "circles": [
          { x: -150, y: 50, color: '#FF0000', name: 'Anger', text: '😠' },
          { x: -100, y: 50, color: '#0000FF', name: 'Sadness', text: '😢' },
          { x: -50, y: 50, color: '#FFFF00', name: 'Joy', text: '😊' },
          { x: 0, y: 50, color: '#00FF00', name: 'Fear', text: '😨' },
          { x: 50, y: 50, color: '#FF00FF', name: 'Disgust', text: '🤢' },
          { x: 100, y: 50, color: '#FFA500', name: 'Surprise', text: '😲' },
        ],
        "color": "#A5D6A7" // Medium green
      },
      "Basic Actions": {
        "id": "basic_actions",
        "type": "star",
        "description": "Core action patterns",
        "circles": [
          { x: -120, y: 80, color: '#FF6B35', name: 'Plan', text: '📋' },
          { x: -40, y: 80, color: '#F7931E', name: 'Execute', text: '⚡' },
          { x: 40, y: 80, color: '#FFD23F', name: 'Review', text: '🔍' },
          { x: 120, y: 80, color: '#88D8B0', name: 'Adjust', text: '🔧' },
        ],
        "color": "#81C784" // Darker green
      },
      "Basic Systems": {
        "id": "basic_systems",
        "type": "triangle",
        "description": "System components",
        "circles": [
          { x: -100, y: 100, color: '#88B66d', name: 'Input', text: '⬇️' },
          { x: 0, y: 100, color: '#7BA05B', name: 'Process', text: '⚙️' },
          { x: 100, y: 100, color: '#6E8B3D', name: 'Output', text: '⬆️' },
          { x: 0, y: 180, color: '#5C7A29', name: 'Feedback', text: '🔄' },
        ],
        "color": "#66BB6A" // Green
      }
    }
  }
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
      boldMaxLineLength: 180,
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
      image: {
        key: 'image',
        displayName: 'Image',
        buttonTitle: 'Enter image description',
        valueDisplayStyle: {
          type: 'text',
          template: '<span>{VALUE}</span>'
        }
      }
    },
    
    // Directly copy these properties
    predefinedColors: CompressedConfig.predefinedColors,
    indicatorEmojis: CompressedConfig.indicatorEmojis,
    circleTypes: CompressedConfig.circleTypes,
    sizes: CompressedConfig.sizes,
    meridian: CompressedConfig.meridian,
    connections: CompressedConfig.connections,
    circleTypeTemplates: CompressedConfig.circleTypeTemplates,

    templateCategories: CompressedConfig.templateCategories,
  circleTypeTemplates: createFlattenedTemplates(CompressedConfig.templateCategories),
    
    // Expand chakra forms from compressed format
    chakraForms: expandChakraForm(CompressedConfig.chakraFormsCompressed),

    // Backward compatibility getter for attributeInfo
    // This will be removed once all references are updated
    get attributeInfo() {
      console.warn('ChakraApp.Config.attributeInfo is deprecated. Use ChakraApp.getAttributeInfo() instead.');
      return ChakraApp.getAttributeInfo ? ChakraApp.getAttributeInfo() : {};
    }
  };

  // Global accessor for attributeInfo - defined here for immediate availability
  ChakraApp.getAttributeInfo = function(attributeKey) {
    // Static fallback data available immediately
    var staticAttributeInfo = {
      cause: { emoji: '⚡', color: '#9999CC', displayName: 'Factor' },
      push: { emoji: '🏃', color: '#FFFFB0', displayName: 'Pushes' },
      stop: { emoji: '🛑', color: '#BD2C2C', displayName: 'Stops' },
      treasure: { emoji: '💎', color: '#66D6FF', displayName: 'Gems' },
      mountain: { emoji: '⛰️', color: '#8B4513', displayName: 'Mountain' },
      demon: { emoji: '😈', color: '#663399', displayName: 'Demons' },
      sword: { emoji: '🗡️', color: '#C0C0C0', displayName: 'Swords' },
      chain: { emoji: '⛓️', color: '#2F4F4F', displayName: 'Chains' },
      ally: { emoji: '🧝🏻‍♂️', color: '#FF8C00', displayName: 'Allies' },
      group: { emoji: '👥', color: '#DDCC99', displayName: 'Group' },
      me: { emoji: '🧑🏼', color: '#FFCC88', displayName: 'Me', defaultName: 'Me' },
      battlefield: { emoji: '⚔️', color: '#5B2503', displayName: 'Battlefield' },
      soldier: { emoji: '💂', color: '#00008B', displayName: 'Soldier' },
      enemy: { emoji: '💂', color: '#8B0000', displayName: 'Enemy' },
      strategy: { emoji: '📝', color: '#DADAC0', displayName: 'Strategy' },
      door: { emoji: '🚪', color: '#5B4072', displayName: 'Door' },
      key: { emoji: '🔑', color: '#975', displayName: 'Key' },
      lock: { emoji: '🔒', color: '#555', displayName: 'Lock' },
      destination: { emoji: '🏁', color: '#595', displayName: 'Destination' },
      tools: { emoji: '🛠️', color: '#555555', displayName: 'Tools' },
      parts: { emoji: '⚙️', color: '#AAAAAA', displayName: 'Parts' },
      machine: { emoji: '🏗️', color: '#666633', displayName: 'The Machine' },
      site: { emoji: '🏞️', color: '#24CC24', displayName: 'Site' },
      bricks: { emoji: '🧱', color: '#EE7766', displayName: 'Bricks' },
      building: { emoji: '🏛️', color: '#DDA', displayName: 'Building' },
      event: { emoji: '💥', color: '#EECC99', displayName: 'Event' },
      chapter: { emoji: '📃', color: '#EEEEEE', displayName: 'Chapter' },
      book: { emoji: '📕', color: '#DDDDAA', displayName: 'Book' },
      positive: { emoji: '👍', color: '#AADDAA', displayName: 'Positive' },
      negative: { emoji: '👎', color: '#DDAAAA', displayName: 'Negative' },
      problem: { emoji: '🔥', color: '#996622', displayName: 'Problem' },
      evidence: { emoji: '📃', color: '#EEEEEE', displayName: 'Evidence' },
      done: { emoji: '✔️', color: '#AAEEAA', displayName: 'Done' },
      physicalThing: { emoji: '🧊', color: '#C99', displayName: 'Thing' },
      behavioralThing: { emoji: '🏃', color: '#9CC', displayName: 'Action' },
      conceptualThing: { emoji: '💭', color: '#C9C', displayName: 'Concept' },
      words: { emoji: '💬', color: '#99C', displayName: 'Words' },
      model: { emoji: '🖼️', color: '#2D7', displayName: 'Example' },
      roleModel: { emoji: '🕺', color: '#D72', displayName: 'Role Model' },
      trait: { emoji: '⚡', color: '#D27', displayName: 'Trait' },
      mystery: { emoji: '🤔', color: '#858', displayName: 'Mystery' },
      hypothesis: { emoji: '💭', color: '#77A', displayName: 'Hypothesis' },
      clue: { emoji: '🔍', color: '#7AA', displayName: 'Clue' },
      milestone: { emoji: '📍', color: '#A77', displayName: 'Milestone' },
      feeling: { emoji: '⚪', color: '#222', displayName: 'Feeling' },
      action: { emoji: '▶︎', color: '#777', displayName: 'Action' },
      thing: { emoji: '🔺', color: '#222', displayName: 'Thing' },
      pattern: { emoji: '⬡', color: '#AA7', displayName: 'Pattern' },
      victory: { emoji: '🏆', color: '#DC7', displayName: 'Victory' },
      defeat: { emoji: '🤕', color: '#BBB', displayName: 'Defeat' },
      chunk: { emoji: '🥩', color: '#EBB', displayName: 'Chunk' },
      cut: { emoji: '🔪', color: '#DDD', displayName: 'Cut' },
      spit: { emoji: '💦', color: '#BDE', displayName: 'Spit' },
      bulbOn: { emoji: '💡', color: '#EEA', displayName: 'On' },
      bulbOff: { emoji: '💡', color: '#444', displayName: 'Off' },
    };

    // Try controller first if available
    if (ChakraApp.attributeController) {
      return attributeKey ? 
        ChakraApp.attributeController.getAttributeInfo(attributeKey) :
        ChakraApp.attributeController.getAllAttributeInfo();
    }
    
  };
  
})(window.ChakraApp = window.ChakraApp || {});
