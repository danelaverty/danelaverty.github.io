// src/controllers/TemplateController.js - FIXED VERSION
(function(ChakraApp) {
  /**
   * Controls template-related UI elements and interactions
   */
  ChakraApp.TemplateController = function() {
    // Call parent constructor
    ChakraApp.BaseController.call(this);
    
    // DOM elements - per circle type
    this.toggleTemplateListBtns = {};
    this.templateListContainers = {};
    
    // Template state
    this.templateListVisible = {};
    this.selectedTemplateIds = {}; // Track selected template per circle type
    
    // Event handlers
    this.templateClickHandler = null;
    
    // Event subscriptions
    this.eventSubscriptions = {};

    this.templates = {
  "modern7": {
    "id": "modern7",
    "name": "7 Chakras",
    "type": "gem",
    "description": "Modern chakra system",
    "traits": {
      "system": "Chakras",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Energy",
      "foundingCentury": "1920 CE"
    },
    "circles": [
      { x: 0, y: 410, color: '#FF0000', name: 'SURVIVAL', text: '⚔️' },
      { x: 0, y: 360, color: '#FF8800', name: 'PLEASURE', text: '🍑' },
      { x: 0, y: 300, color: '#FFFF00', name: 'POWER', text: '👑' },
      { x: 0, y: 180, color: '#00AA00', name: 'LOVE', text: '💚' },
      { x: 0, y: 130, color: '#0099FF', name: 'VOICE', text: '📢' },
      { x: 0, y: 75, color: '#550099', name: 'INSIGHT', text: '🔮' },
      { x: 0, y: 30, color: '#FF00FF', name: 'SPIRIT', text: '👑' },
    ],
    "color": "#FFE082"
  },
  
  "satCakraNirupana": {
    "id": "satCakraNirupana",
    "name": "Sat-Cakra-Nirupana",
    "type": "gem", 
    "description": "Traditional Sanskrit system",
    "traits": {
      "system": "Chakras",
      "period": "Renaissance",
      "origin": "Indian",
      "purpose": "Spiritual",
      "foundingCentury": "1500 CE"
    },
    "circles": [
      { x: 0, y: 410, color: '#FF0000', name: 'MULADHARA' },
      { x: 0, y: 360, color: '#FF8800', name: 'SVADHISTHANA' },
      { x: 0, y: 300, color: '#999999', name: 'MANIPURA' },
      { x: 0, y: 180, color: '#FF0000', name: 'ANAHATA' },
      { x: 0, y: 130, color: '#7700AA', name: 'VISHUDDHA' },
      { x: 0, y: 75, color: '#F5F5F5', name: 'AJNA' },
      { x: 0, y: 30, color: '#FFFFFF', name: 'SAHASRARA' },
    ],
    "color": "#FFCC02"
  },
  
  "enneagram": {
    "id": "enneagram",
    "name": "Enneagram",
    "type": "gem",
    "description": "Nine personality types",
    "traits": {
      "system": "Personality",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Psychology",
      "foundingCentury": "1950 CE"
    },
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
    "color": "#BA68C8"
  },
  
  "mbti": {
    "id": "mbti",
    "name": "MBTI Types",
    "type": "gem",
    "description": "Myers-Briggs personality indicators",
    "traits": {
      "system": "Personality",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Psychology",
      "foundingCentury": "1940 CE"
    },
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
    "color": "#9C27B0"
  },
  
  "sephiroth": {
    "id": "sephiroth",
    "name": "Tree of Life",
    "type": "gem",
    "description": "Kabbalistic Sephiroth",
    "traits": {
      "system": "Mystical",
      "period": "Middle Ages",
      "origin": "Jewish",
      "purpose": "Spiritual",
      "foundingCentury": "1100 CE"
    },
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
    "color": "#7986CB"
  },
  
  "zodiac": {
    "id": "zodiac",
    "name": "Zodiac Signs",
    "type": "gem",
    "description": "Astrological signs",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Babylonian",
      "purpose": "Divination",
      "foundingCentury": "500 BCE"
    },
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
    "color": "#9FA8DA"
  },

  "qeroMedicineWheel": {
    "id": "qeroMedicineWheel",
    "name": "Q'ero Medicine Wheel",
    "type": "star",
    "description": "Andean spiritual directions",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "South American",
      "purpose": "Spiritual",
      "foundingCentury": "1000 CE"
    },
    "circles": [
      { x: 0, y: 50, color: '#FFD700', name: 'INTI (SUN)', text: '☀️' },
      { x: 120, y: 180, color: '#FF4500', name: 'CHINCHAY (JAGUAR)', text: '🐆' },
      { x: 0, y: 310, color: '#228B22', name: 'AMARU (SERPENT)', text: '🐍' },
      { x: -120, y: 180, color: '#87CEEB', name: 'KUNTUR (CONDOR)', text: '🦅' },
      { x: 0, y: 180, color: '#9370DB', name: 'PACHAMAMA', text: '🌍' },
    ],
    "color": "#DEB887"
  },

  "maslowHierarchy": {
    "id": "maslowHierarchy",
    "name": "Maslow's Hierarchy",
    "type": "triangle",
    "description": "Hierarchy of human needs",
    "traits": {
      "system": "Psychology",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Psychology",
      "foundingCentury": "1940 CE"
    },
    "circles": [
      { x: 0, y: 380, color: '#8B4513', name: 'PHYSIOLOGICAL', text: '🍞' },
      { x: 0, y: 320, color: '#FF6347', name: 'SAFETY', text: '🛡️' },
      { x: 0, y: 260, color: '#FFD700', name: 'LOVE/BELONGING', text: '❤️' },
      { x: 0, y: 200, color: '#90EE90', name: 'ESTEEM', text: '🏆' },
      { x: 0, y: 140, color: '#87CEEB', name: 'SELF-ACTUALIZATION', text: '⭐' },
    ],
    "color": "#FFA07A"
  },

  "hartmanColorCode": {
    "id": "hartmanColorCode",
    "name": "Hartman Color Code",
    "type": "star",
    "description": "Personality color system",
    "traits": {
      "system": "Personality",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Psychology",
      "foundingCentury": "1990 CE"
    },
    "circles": [
      { x: 0, y: 100, color: '#FF0000', name: 'RED (POWER)', text: '🔥' },
      { x: 100, y: 200, color: '#0000FF', name: 'BLUE (INTIMACY)', text: '💙' },
      { x: 0, y: 300, color: '#FFFFFF', name: 'WHITE (PEACE)', text: '🕊️' },
      { x: -100, y: 200, color: '#FFD700', name: 'YELLOW (FUN)', text: '☀️' },
    ],
    "color": "#FFB6C1"
  },

  "harryPotterHouses": {
    "id": "harryPotterHouses",
    "name": "Harry Potter Houses",
    "type": "star",
    "description": "Hogwarts school houses",
    "traits": {
      "system": "Fiction",
      "period": "Modern",
      "origin": "British",
      "purpose": "Entertainment",
      "foundingCentury": "1990 CE"
    },
    "circles": [
      { x: 0, y: 100, color: '#740001', name: 'GRYFFINDOR', text: '🦁' },
      { x: 100, y: 200, color: '#0E1A40', name: 'RAVENCLAW', text: '🦅' },
      { x: 0, y: 300, color: '#2A623D', name: 'SLYTHERIN', text: '🐍' },
      { x: -100, y: 200, color: '#FFD800', name: 'HUFFLEPUFF', text: '🦡' },
    ],
    "color": "#8B4513"
  },

  "dndClasses": {
    "id": "dndClasses",
    "name": "D&D Classes",
    "type": "hexagon",
    "description": "Dungeons & Dragons character classes",
    "traits": {
      "system": "Gaming",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Entertainment",
      "foundingCentury": "1970 CE"
    },
    "circles": [
      { x: 0, y: 80, color: '#C0392B', name: 'FIGHTER', text: '⚔️' },
      { x: 80, y: 120, color: '#8E44AD', name: 'WIZARD', text: '🔮' },
      { x: 80, y: 200, color: '#F39C12', name: 'ROGUE', text: '🗡️' },
      { x: 0, y: 240, color: '#27AE60', name: 'RANGER', text: '🏹' },
      { x: -80, y: 200, color: '#3498DB', name: 'CLERIC', text: '✨' },
      { x: -80, y: 120, color: '#E74C3C', name: 'BARBARIAN', text: '🪓' },
      { x: -40, y: 160, color: '#9B59B6', name: 'BARD', text: '🎵' },
      { x: 40, y: 160, color: '#2ECC71', name: 'DRUID', text: '🌿' },
      { x: 0, y: 160, color: '#F1C40F', name: 'PALADIN', text: '🛡️' },
    ],
    "color": "#95A5A6"
  },

  "greekGods": {
    "id": "greekGods",
    "name": "Greek Gods",
    "type": "star",
    "description": "Olympian deities",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Greek",
      "purpose": "Spiritual",
      "foundingCentury": "800 BCE"
    },
    "circles": [
      { x: 0, y: 50, color: '#4169E1', name: 'ZEUS', text: '⚡' },
      { x: 100, y: 100, color: '#FF1493', name: 'APHRODITE', text: '💕' },
      { x: 140, y: 180, color: '#DC143C', name: 'ARES', text: '⚔️' },
      { x: 100, y: 260, color: '#228B22', name: 'DEMETER', text: '🌾' },
      { x: 0, y: 310, color: '#4682B4', name: 'POSEIDON', text: '🔱' },
      { x: -100, y: 260, color: '#8B008B', name: 'DIONYSUS', text: '🍇' },
      { x: -140, y: 180, color: '#C0C0C0', name: 'ARTEMIS', text: '🏹' },
      { x: -100, y: 100, color: '#FFD700', name: 'APOLLO', text: '☀️' },
      { x: -70, y: 140, color: '#B8860B', name: 'HEPHAESTUS', text: '🔨' },
      { x: 70, y: 140, color: '#9370DB', name: 'ATHENA', text: '🦉' },
      { x: 0, y: 140, color: '#DAA520', name: 'HERA', text: '👑' },
      { x: 0, y: 220, color: '#696969', name: 'HERMES', text: '👨‍⚕️' },
    ],
    "color": "#F5DEB3"
  },

  "archangels": {
    "id": "archangels",
    "name": "Archangels",
    "type": "star",
    "description": "Seven archangels",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Abrahamic",
      "purpose": "Spiritual",
      "foundingCentury": "200 CE"
    },
    "circles": [
      { x: 0, y: 80, color: '#FFD700', name: 'MICHAEL', text: '⚔️' },
      { x: 80, y: 140, color: '#87CEEB', name: 'GABRIEL', text: '📯' },
      { x: 80, y: 220, color: '#9370DB', name: 'RAPHAEL', text: '🌿' },
      { x: 0, y: 280, color: '#FF6347', name: 'URIEL', text: '🔥' },
      { x: -80, y: 220, color: '#32CD32', name: 'RAGUEL', text: '⚖️' },
      { x: -80, y: 140, color: '#FFB6C1', name: 'REMIEL', text: '👁️' },
      { x: 0, y: 180, color: '#FFFFFF', name: 'SARAQAEL', text: '✨' },
    ],
    "color": "#E6E6FA"
  },

  "britannianVirtues": {
    "id": "britannianVirtues",
    "name": "Britannian Virtues",
    "type": "star",
    "description": "Virtues from Ultima series",
    "traits": {
      "system": "Gaming",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Entertainment",
      "foundingCentury": "1980 CE"
    },
    "circles": [
      { x: 0, y: 50, color: '#FF0000', name: 'COURAGE', text: '🦁' },
      { x: 80, y: 90, color: '#0000FF', name: 'TRUTH', text: '📖' },
      { x: 120, y: 160, color: '#FFFF00', name: 'LOVE', text: '❤️' },
      { x: 80, y: 230, color: '#FF8C00', name: 'JUSTICE', text: '⚖️' },
      { x: 0, y: 270, color: '#8A2BE2', name: 'SACRIFICE', text: '🕊️' },
      { x: -80, y: 230, color: '#00FF00', name: 'HONOR', text: '🛡️' },
      { x: -120, y: 160, color: '#FF1493', name: 'SPIRITUALITY', text: '🙏' },
      { x: -80, y: 90, color: '#00CED1', name: 'HUMILITY', text: '🌱' },
    ],
    "color": "#DAA520"
  },

  "gargishVirtues": {
    "id": "gargishVirtues",
    "name": "Gargish Virtues",
    "type": "triangle",
    "description": "Gargoyle virtues from Ultima",
    "traits": {
      "system": "Gaming",
      "period": "Modern",
      "origin": "Western",
      "purpose": "Entertainment",
      "foundingCentury": "1990 CE"
    },
    "circles": [
      { x: 0, y: 120, color: '#4B0082', name: 'CONTROL', text: '🎭' },
      { x: 80, y: 240, color: '#8B4513', name: 'PASSION', text: '🔥' },
      { x: -80, y: 240, color: '#2F4F4F', name: 'DILIGENCE', text: '⚒️' },
    ],
    "color": "#708090"
  },

  "nobleEightfoldPath": {
    "id": "nobleEightfoldPath",
    "name": "Noble Eightfold Path",
    "type": "star",
    "description": "Buddhist path to enlightenment",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Buddhist",
      "purpose": "Spiritual",
      "foundingCentury": "500 BCE"
    },
    "circles": [
      { x: 0, y: 50, color: '#FFD700', name: 'RIGHT VIEW', text: '👁️' },
      { x: 80, y: 80, color: '#FF6347', name: 'RIGHT INTENTION', text: '💭' },
      { x: 120, y: 150, color: '#32CD32', name: 'RIGHT SPEECH', text: '💬' },
      { x: 80, y: 220, color: '#4169E1', name: 'RIGHT ACTION', text: '🤝' },
      { x: 0, y: 250, color: '#9370DB', name: 'RIGHT LIVELIHOOD', text: '⚖️' },
      { x: -80, y: 220, color: '#FF1493', name: 'RIGHT EFFORT', text: '💪' },
      { x: -120, y: 150, color: '#00CED1', name: 'RIGHT MINDFULNESS', text: '🧘' },
      { x: -80, y: 80, color: '#F0E68C', name: 'RIGHT CONCENTRATION', text: '🎯' },
    ],
    "color": "#DDA0DD"
  },

  "sevenDeadlySins": {
    "id": "sevenDeadlySins",
    "name": "7 Deadly Sins",
    "type": "star",
    "description": "Traditional Christian sins",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Christian",
      "purpose": "Spiritual",
      "foundingCentury": "400 CE"
    },
    "circles": [
      { x: 0, y: 60, color: '#8B0000', name: 'PRIDE', text: '👑' },
      { x: 90, y: 90, color: '#DC143C', name: 'WRATH', text: '⚡' },
      { x: 130, y: 160, color: '#FF8C00', name: 'GLUTTONY', text: '🍖' },
      { x: 90, y: 230, color: '#9ACD32', name: 'GREED', text: '💰' },
      { x: 0, y: 260, color: '#FF69B4', name: 'LUST', text: '💋' },
      { x: -90, y: 230, color: '#4169E1', name: 'SLOTH', text: '😴' },
      { x: -130, y: 160, color: '#32CD32', name: 'ENVY', text: '👁️' },
    ],
    "color": "#A0522D"
  },

  "kybalion": {
    "id": "kybalion",
    "name": "The Kybalion",
    "type": "star",
    "description": "Hermetic principles",
    "traits": {
      "system": "Mystical",
      "period": "Modern",
      "origin": "Hermetic",
      "purpose": "Spiritual",
      "foundingCentury": "1900 CE"
    },
    "circles": [
      { x: 0, y: 60, color: '#FFD700', name: 'MENTALISM', text: '🧠' },
      { x: 80, y: 100, color: '#C0C0C0', name: 'CORRESPONDENCE', text: '🪞' },
      { x: 110, y: 170, color: '#FF6347', name: 'VIBRATION', text: '〰️' },
      { x: 80, y: 240, color: '#4169E1', name: 'POLARITY', text: '⚖️' },
      { x: 0, y: 280, color: '#32CD32', name: 'RHYTHM', text: '🌊' },
      { x: -80, y: 240, color: '#9370DB', name: 'CAUSE & EFFECT', text: '🔄' },
      { x: -110, y: 170, color: '#FF1493', name: 'GENDER', text: '☯️' },
    ],
    "color": "#B8860B"
  },

  "tenCommandments": {
    "id": "tenCommandments",
    "name": "10 Commandments",
    "type": "hexagon",
    "description": "Biblical commandments",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Abrahamic",
      "purpose": "Spiritual",
      "foundingCentury": "1300 BCE"
    },
    "circles": [
      { x: 0, y: 50, color: '#FFD700', name: 'NO OTHER GODS', text: '1️⃣' },
      { x: 60, y: 80, color: '#FF6347', name: 'NO IDOLS', text: '2️⃣' },
      { x: 90, y: 130, color: '#32CD32', name: 'NO VAIN OATHS', text: '3️⃣' },
      { x: 90, y: 190, color: '#4169E1', name: 'SABBATH', text: '4️⃣' },
      { x: 60, y: 240, color: '#9370DB', name: 'HONOR PARENTS', text: '5️⃣' },
      { x: 0, y: 270, color: '#DC143C', name: 'NO MURDER', text: '6️⃣' },
      { x: -60, y: 240, color: '#FF1493', name: 'NO ADULTERY', text: '7️⃣' },
      { x: -90, y: 190, color: '#00CED1', name: 'NO THEFT', text: '8️⃣' },
      { x: -90, y: 130, color: '#F0E68C', name: 'NO FALSE WITNESS', text: '9️⃣' },
      { x: -60, y: 80, color: '#DDA0DD', name: 'NO COVETING', text: '🔟' },
    ],
    "color": "#F5DEB3"
  },

  "sevenAlchemicalMetals": {
    "id": "sevenAlchemicalMetals",
    "name": "7 Alchemical Metals",
    "type": "star",
    "description": "Classical metallic elements",
    "traits": {
      "system": "Alchemy",
      "period": "Ancient",
      "origin": "Hermetic",
      "purpose": "Spiritual",
      "foundingCentury": "300 CE"
    },
    "circles": [
      { x: 0, y: 60, color: '#FFD700', name: 'GOLD (SUN)', text: '☉' },
      { x: 80, y: 100, color: '#C0C0C0', name: 'SILVER (MOON)', text: '☽' },
      { x: 110, y: 170, color: '#B87333', name: 'COPPER (VENUS)', text: '♀' },
      { x: 80, y: 240, color: '#FF4500', name: 'IRON (MARS)', text: '♂' },
      { x: 0, y: 280, color: '#87CEEB', name: 'TIN (JUPITER)', text: '♃' },
      { x: -80, y: 240, color: '#2F4F4F', name: 'LEAD (SATURN)', text: '♄' },
      { x: -80, y: 100, color: '#DC143C', name: 'MERCURY (MERCURY)', text: '☿' },
    ],
    "color": "#DAA520"
  },

  "threeAlchemicalPrinciples": {
    "id": "threeAlchemicalPrinciples",
    "name": "3 Alchemical Principles",
    "type": "triangle",
    "description": "Mercury, Salt, Sulfur",
    "traits": {
      "system": "Alchemy",
      "period": "Renaissance",
      "origin": "Hermetic",
      "purpose": "Spiritual",
      "foundingCentury": "1500 CE"
    },
    "circles": [
      { x: 0, y: 120, color: '#DC143C', name: 'MERCURY', text: '☿' },
      { x: 80, y: 240, color: '#FFFF00', name: 'SULFUR', text: '🜍' },
      { x: -80, y: 240, color: '#FFFFFF', name: 'SALT', text: '🜔' },
    ],
    "color": "#CD853F"
  },

  "planets": {
    "id": "planets",
    "name": "The Planets",
    "type": "star",
    "description": "Classical planetary system",
    "traits": {
      "system": "Astronomy",
      "period": "Ancient",
      "origin": "Babylonian",
      "purpose": "Divination",
      "foundingCentury": "600 BCE"
    },
    "circles": [
      { x: 0, y: 50, color: '#FFD700', name: 'SUN', text: '☉' },
      { x: 70, y: 80, color: '#C0C0C0', name: 'MOON', text: '☽' },
      { x: 100, y: 130, color: '#DC143C', name: 'MERCURY', text: '☿' },
      { x: 100, y: 190, color: '#FF69B4', name: 'VENUS', text: '♀' },
      { x: 70, y: 240, color: '#FF4500', name: 'MARS', text: '♂' },
      { x: 0, y: 270, color: '#4169E1', name: 'JUPITER', text: '♃' },
      { x: -70, y: 240, color: '#2F4F4F', name: 'SATURN', text: '♄' },
      { x: -100, y: 190, color: '#00CED1', name: 'URANUS', text: '♅' },
      { x: -100, y: 130, color: '#4682B4', name: 'NEPTUNE', text: '♆' },
      { x: -70, y: 80, color: '#8B4513', name: 'PLUTO', text: '♇' },
    ],
    "color": "#483D8B"
  },

  "physiologus": {
    "id": "physiologus",
    "name": "Physiologus",
    "type": "star",
    "description": "Medieval bestiary creatures",
    "traits": {
      "system": "Mystical",
      "period": "Ancient",
      "origin": "Christian",
      "purpose": "Spiritual",
      "foundingCentury": "200 CE"
    },
    "circles": [
      { x: 0, y: 60, color: '#FFD700', name: 'LION', text: '🦁' },
      { x: 80, y: 90, color: '#8B4513', name: 'EAGLE', text: '🦅' },
      { x: 120, y: 150, color: '#FF1493', name: 'UNICORN', text: '🦄' },
      { x: 90, y: 220, color: '#32CD32', name: 'PELICAN', text: '🦆' },
      { x: 20, y: 280, color: '#DC143C', name: 'PHOENIX', text: '🔥' },
      { x: -60, y: 250, color: '#4169E1', name: 'WHALE', text: '🐋' },
      { x: -110, y: 180, color: '#9370DB', name: 'SERPENT', text: '🐍' },
      { x: -80, y: 110, color: '#F0E68C', name: 'DOVE', text: '🕊️' },
      { x: -20, y: 190, color: '#CD853F', name: 'STAG', text: '🦌' },
      { x: 50, y: 160, color: '#87CEEB', name: 'LAMB', text: '🐑' },
    ],
    "color": "#D2B48C"
  },

  "cardinalDirections": {
    "id": "cardinalDirections",
    "name": "Cardinal Directions",
    "type": "star",
    "description": "Four cardinal directions",
    "traits": {
      "system": "Navigation",
      "period": "Ancient",
      "origin": "Universal",
      "purpose": "Navigation",
      "foundingCentury": "3000 BCE"
    },
    "circles": [
      { x: 0, y: 80, color: '#FFFFFF', name: 'NORTH', text: '❄️' },
      { x: 120, y: 200, color: '#FFD700', name: 'EAST', text: '🌅' },
      { x: 0, y: 320, color: '#FF4500', name: 'SOUTH', text: '☀️' },
      { x: -120, y: 200, color: '#4682B4', name: 'WEST', text: '🌊' },
    ],
    "color": "#98FB98"
  },

  "fourHumors": {
    "id": "fourHumors",
    "name": "The Four Humors",
    "type": "star",
    "description": "Classical medical theory",
    "traits": {
      "system": "Medicine",
      "period": "Ancient",
      "origin": "Greek",
      "purpose": "Medicine",
      "foundingCentury": "400 BCE"
    },
    "circles": [
      { x: 0, y: 100, color: '#DC143C', name: 'BLOOD (SANGUINE)', text: '🩸' },
      { x: 100, y: 200, color: '#FFD700', name: 'YELLOW BILE (CHOLERIC)', text: '⚡' },
      { x: 0, y: 300, color: '#2F4F4F', name: 'BLACK BILE (MELANCHOLIC)', text: '🖤' },
      { x: -100, y: 200, color: '#87CEEB', name: 'PHLEGM (PHLEGMATIC)', text: '💧' },
    ],
    "color": "#DEB887"
  },

  "fourSeasons": {
    "id": "fourSeasons",
    "name": "The Four Seasons",
    "type": "star",
    "description": "Annual seasonal cycle",
    "traits": {
      "system": "Natural",
      "period": "Ancient",
      "origin": "Universal",
      "purpose": "Natural",
      "foundingCentury": "5000 BCE"
    },
    "circles": [
      { x: 0, y: 100, color: '#90EE90', name: 'SPRING', text: '🌸' },
      { x: 100, y: 200, color: '#FFD700', name: 'SUMMER', text: '☀️' },
      { x: 0, y: 300, color: '#FF8C00', name: 'AUTUMN', text: '🍂' },
      { x: -100, y: 200, color: '#87CEEB', name: 'WINTER', text: '❄️' },
    ],
    "color": "#F0E68C"
  }
};

// Categorization schemes configuration
 this.categorizationSchemes = {};
this._generateCategorizationSchemes();

this.currentCategorizationScheme = "system";
  };
  
  // Inherit from BaseController
  ChakraApp.TemplateController.prototype = Object.create(ChakraApp.BaseController.prototype);
  ChakraApp.TemplateController.prototype.constructor = ChakraApp.TemplateController;
  
  // Initialize
  ChakraApp.TemplateController.prototype.init = function() {
  ChakraApp.BaseController.prototype.init.call(this);
  
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self.templateListVisible[circleType.id] = false;
    self.selectedTemplateIds[circleType.id] = null;
  });

  this.selectedTemplateId = null;
  this.selectedTemplateCategory = null;
  this.isTemplateGridExpanded = false;
  this.currentPanelId = 0;
  this._setupInitializationStrategy();
  this._setupTemplateEventListeners();
  this._setupClickOutsideHandler();
  this._setupButtonHandlersEnhanced();
};

  ChakraApp.TemplateController.prototype.getTemplatesByTrait = function(traitName, traitValue) {
  var results = {};
  for (var templateId in this.templates) {
    var template = this.templates[templateId];
    if (template.traits && template.traits[traitName] === traitValue) {
      results[templateId] = template;
    }
  }
  return results;
};

ChakraApp.TemplateController.prototype._generateCategorizationSchemes = function() {
  // Define scheme metadata (icons and display names)
  var schemeMetadata = {
    "system": { name: "System", icon: "🔮" },
    "period": { name: "Time Period", icon: "⏰" },
    "origin": { name: "Cultural Origin", icon: "🌍" },
    "purpose": { name: "Purpose", icon: "🎯" },
    "foundingCentury": { name: "Founded", icon: "📅" }
  };
  
  // Color palette for different values
  var colorPalette = [
    "#FFF8E1", "#F3E5F5", "#E8EAF6", "#E3F2FD", "#E8F5E8", 
    "#FFF3E0", "#F1F8E9", "#FCE4EC", "#FFECB3", "#E1F5FE"
  ];
  
  // Collect all unique trait keys from templates
  var traitKeys = new Set();
  Object.values(this.templates).forEach(function(template) {
    if (template.traits) {
      Object.keys(template.traits).forEach(function(key) {
        traitKeys.add(key);
      });
    }
  });
  
  // Generate schemes for each trait
  var self = this;
  traitKeys.forEach(function(traitKey) {
    // Get all unique values for this trait
    var uniqueValues = self.getAllTraitValues(traitKey);
    
    // Create scheme object
    var scheme = {
      name: schemeMetadata[traitKey] ? schemeMetadata[traitKey].name : traitKey.charAt(0).toUpperCase() + traitKey.slice(1),
      icon: schemeMetadata[traitKey] ? schemeMetadata[traitKey].icon : "📊",
      values: {}
    };
    
    // Assign colors and create value objects
    uniqueValues.forEach(function(value, index) {
      scheme.values[value] = {
        color: colorPalette[index % colorPalette.length],
      };
    });
    
    self.categorizationSchemes[traitKey] = scheme;
  });
};

ChakraApp.TemplateController.prototype.getAllTraitValues = function(traitName) {
  var values = new Set();
  for (var templateId in this.templates) {
    var template = this.templates[templateId];
    if (template.traits && template.traits[traitName]) {
      values.add(template.traits[traitName]);
    }
  }
  return Array.from(values);
};

ChakraApp.TemplateController.prototype.getCategorizedTemplates = function(categorizationScheme) {
  var categorized = {};
  var scheme = this.categorizationSchemes[categorizationScheme];
  
  if (!scheme) {
    console.error('Unknown categorization scheme:', categorizationScheme);
    return categorized;
  }
  
  // Initialize categories
  for (var categoryValue in scheme.values) {
    categorized[categoryValue] = {
      info: scheme.values[categoryValue],
      templates: {}
    };
  }
  
  // Categorize templates
  for (var templateId in this.templates) {
    var template = this.templates[templateId];
    var traitValue = template.traits ? template.traits[categorizationScheme] : null;
    
    if (traitValue && categorized[traitValue]) {
      categorized[traitValue].templates[templateId] = template;
    }
  }
  
  return categorized;
};

ChakraApp.TemplateController.prototype._setupInitializationStrategy = function() {
  var self = this;
  
  // Check if left panels exist
  var leftPanelExists = document.getElementById('left-panel-0') || 
                       document.querySelector('.left-panel[data-panel-index="0"]') ||
                       document.querySelector('#left-container .left-panel:first-child');
  
  if (leftPanelExists) {
    // Panels already exist, initialize immediately
    this._completeInitialization();
  } else {
    // Wait for panels to be created
    this._waitForPanelsToBeCreated();
  }
};

// Add this new method:
ChakraApp.TemplateController.prototype._waitForPanelsToBeCreated = function() {
  var self = this;
  
  this.eventSubscriptions.leftPanelAdded = ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
    
    // Initialize when the first panel is created (any panel, not just panel 0)
    self._completeInitialization();
    
    // Unsubscribe since we only need this once
    if (self.eventSubscriptions.leftPanelAdded) {
      self.eventSubscriptions.leftPanelAdded();
      delete self.eventSubscriptions.leftPanelAdded;
    }
  });
};

// Add this new method:
ChakraApp.TemplateController.prototype._completeInitialization = function() {
  // Create visual template selector
  this._createVisualTemplateSelector();
  
  // Create UI elements for each circle type (existing functionality)
  this._createTemplateControls();
  
  // Initialize template lists for each circle type
  var self = this;
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    self._updateTemplateList(circleType.id);
  });
};
  
  /**
   * Create template controls for each circle type
   * @private
   */
  ChakraApp.TemplateController.prototype._createTemplateControls = function() {
    var self = this;
    
    // Create controls for each circle type
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      self._createTemplateControlsForCircleType(circleType.id);
    });
  };
  
  /**
   * Create template controls for a specific circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._createTemplateControlsForCircleType = function(circleTypeId) {
	  var circleType = ChakraApp.Config.circleTypes.find(function(type) {
    return type.id === circleTypeId;
  });
  
  if (!circleType) {
    console.error('Invalid circle type ID:', circleTypeId);
    return;
  }
  
  // FIXED: Look for the new left panel structure with better error handling
  var targetPanel = document.getElementById('left-panel-0') ||
                   document.querySelector('.left-panel[data-panel-index="0"]') ||
                   document.querySelector('#left-container .left-panel:first-child') ||
                   document.querySelector('.circle-panel[data-panel-id="left"]') ||
                   document.getElementById('left-panel');
  
  if (!targetPanel) {
    console.warn('Left panel not found for rendering template controls for circle type:', circleTypeId);
    return;
  }
    
    // Create Template List Container
    var listContainer = document.createElement('div');
    listContainer.id = 'template-list-container-' + circleTypeId;
    listContainer.className = 'template-list-container';
    listContainer.dataset.circleTypeId = circleTypeId;
    
    // Apply styles
    listContainer.style.display = 'none';
    listContainer.style.position = 'absolute';
    listContainer.style.left = '105px';
    listContainer.style.bottom = '30px';
    listContainer.style.width = '220px';
    listContainer.style.maxHeight = '300px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.backgroundColor = 'rgba(60, 60, 60, 0.95)';
    listContainer.style.border = '1px solid #777';
    listContainer.style.borderRadius = '5px';
    listContainer.style.zIndex = '100';
    listContainer.style.padding = '4px';
    listContainer.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
    
    // Apply custom styling based on circle type
    if (circleTypeId === 'star') {
      listContainer.style.backgroundColor = 'rgba(255, 153, 51, 0.15)';
      listContainer.style.borderColor = '#FF9933';
    } else if (circleTypeId === 'triangle') {
      listContainer.style.backgroundColor = 'rgba(56, 118, 29, 0.15)';
      listContainer.style.borderColor = '#88B66d';
    } else if (circleTypeId === 'gem') {
      listContainer.style.backgroundColor = 'rgba(74, 111, 201, 0.15)';
      listContainer.style.borderColor = '#4a6fc9';
    } else if (circleTypeId === 'hexagon') {
      listContainer.style.backgroundColor = 'rgba(153, 50, 204, 0.15)';
      listContainer.style.borderColor = '#9932CC';
    }
    
    // Add to left panel
    targetPanel.appendChild(listContainer);
    this.templateListContainers[circleTypeId] = listContainer;
  };
  
  /**
   * Set up button handlers for template toggle buttons
   * @private
   */
  ChakraApp.TemplateController.prototype._setupButtonHandlers = function() {
    var self = this;
    
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      
      // Handle template toggle buttons
      var toggleBtn = document.getElementById('toggle-template-list-btn-' + typeId);
      if (toggleBtn) {
        var newToggleBtn = toggleBtn.cloneNode(true);
        
        if (toggleBtn.parentNode) {
          toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        }
        
        // Store reference
        self.toggleTemplateListBtns[typeId] = newToggleBtn;
        
	newToggleBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  
  // FIRST: Close all document lists before toggling template list
  self._closeAllDocumentLists();
  
  self._toggleTemplateList(typeId);
  
  var arrowIcon = this.querySelector('.template-arrow-icon');
  if (arrowIcon) {
    arrowIcon.innerHTML = self.templateListVisible[typeId] ? 'T' : 'T';
  }
  
  self._updateTemplateList(typeId);
});
      }
    });
  };
  
  /**
   * Toggle template list visibility for a circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._toggleTemplateList = function(circleTypeId) {
    // Toggle current state
    this.templateListVisible[circleTypeId] = !this.templateListVisible[circleTypeId];
    
    // If opening a list, close all other open template lists
    if (this.templateListVisible[circleTypeId]) {
      var self = this;
      ChakraApp.Config.circleTypes.forEach(function(otherType) {
        var otherTypeId = otherType.id;
        // Skip the current type
        if (otherTypeId === circleTypeId) return;
        
        // Close other template lists if open
        if (self.templateListVisible[otherTypeId]) {
          self.templateListVisible[otherTypeId] = false;
          self._updateTemplateList(otherTypeId);
          
          // Update arrow icon
          var otherToggleBtn = self.toggleTemplateListBtns[otherTypeId];
          if (otherToggleBtn) {
            var arrowIcon = otherToggleBtn.querySelector('.template-arrow-icon');
            if (arrowIcon) {
              arrowIcon.innerHTML = '▼';
            }
          }
        }
      });
    }
  };
  
  /**
   * Update template list display for a circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._updateTemplateList = function(circleTypeId) {
    var listContainer = this.templateListContainers[circleTypeId];
    if (!listContainer) return;
    
    // Check visibility state
    var isVisible = this.templateListVisible[circleTypeId];
    listContainer.style.display = isVisible ? 'block' : 'none';
    
    // If not visible, no need to update content
    if (!isVisible) return;
    
    // Clear existing list
    listContainer.innerHTML = '';
    
    // Get templates for this circle type
    var templates = this._getTemplatesForCircleType(circleTypeId);
    
    var selectedId = this.selectedTemplateIds[circleTypeId];
    
    // Create list items for each template
    var self = this;
    templates.forEach(function(template) {
      var listItem = template.id === selectedId ? 
        self._createSelectedTemplateListItem(template, circleTypeId) : 
        self._createTemplateListItem(template, circleTypeId);
      
      listContainer.appendChild(listItem);
    });
    
    // If no templates, show message
    if (templates.length === 0) {
      var noTemplatesMessage = document.createElement('div');
      noTemplatesMessage.className = 'no-templates-message';
      noTemplatesMessage.textContent = 'No templates available';
      noTemplatesMessage.style.color = '#888';
      noTemplatesMessage.style.fontStyle = 'italic';
      noTemplatesMessage.style.textAlign = 'center';
      noTemplatesMessage.style.padding = '20px';
      listContainer.appendChild(noTemplatesMessage);
    }
  };
  
  /**
   * Get templates for a specific circle type
   * @private
   * @param {string} circleTypeId - Circle type ID
   * @return {Array} Array of templates
   */
  ChakraApp.TemplateController.prototype._getTemplatesForCircleType = function(circleTypeId) {
    if (!ChakraApp.Config.circleTypeTemplates) {
      return [];
    }
    
    return ChakraApp.Config.circleTypeTemplates.filter(function(template) {
      return template.type === circleTypeId;
    });
  };
  
  /**
   * Create a template list item
   * @private
   * @param {Object} template - Template object
   * @param {string} circleTypeId - Circle type ID
   * @returns {HTMLElement} Template list item
   */
  ChakraApp.TemplateController.prototype._createTemplateListItem = function(template, circleTypeId) {
    var self = this;
    
    var listItem = document.createElement('div');
    listItem.className = 'template-list-item';
    listItem.dataset.id = template.id;
    listItem.dataset.circleTypeId = circleTypeId;
    listItem.style.display = 'flex';
    listItem.style.alignItems = 'center';
    listItem.style.padding = '4px 6px';
    listItem.style.marginBottom = '0px';
    listItem.style.backgroundColor = 'rgba(80, 80, 80, 0.7)';
    listItem.style.borderRadius = '4px';
    listItem.style.cursor = 'pointer';
    listItem.style.transition = 'background-color 0.2s ease';
    
    // Template icon
    var icon = document.createElement('span');
    icon.className = 'template-icon';
    icon.innerHTML = '📋';
    icon.style.marginRight = '10px';
    icon.style.fontSize = '18px';
    listItem.appendChild(icon);
    
    // Template name
    var name = document.createElement('span');
    name.className = 'template-name';
    name.textContent = template.name;
    name.style.flex = '1';
    name.style.color = 'white';
    name.style.fontSize = '14px';
    name.style.whiteSpace = 'nowrap';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    listItem.appendChild(name);
    
    // Template circle count
    var circleCount = document.createElement('span');
    circleCount.className = 'template-circle-count';
    var count = template.circles ? template.circles.length : 0;
    circleCount.textContent = ' (' + count + ')';
    circleCount.style.color = 'rgba(255, 255, 255, 0.6)';
    circleCount.style.fontSize = '0.9em';
    circleCount.style.marginLeft = '3px';
    listItem.appendChild(circleCount);
    
    // Hover effects
    listItem.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(100, 100, 100, 0.9)';
    });
    
    listItem.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(80, 80, 80, 0.7)';
    });
    
    // Click handler to select template
    listItem.addEventListener('click', function(e) {
      e.stopPropagation();
      self._selectTemplate(template.id, circleTypeId);
    });
    
    return listItem;
  };
  
  /**
   * Create a selected template list item
   * @private
   * @param {Object} template - Template object
   * @param {string} circleTypeId - Circle type ID
   * @returns {HTMLElement} Selected template list item
   */
  ChakraApp.TemplateController.prototype._createSelectedTemplateListItem = function(template, circleTypeId) {
    var listItem = this._createTemplateListItem(template, circleTypeId);
    listItem.className += ' selected';
    listItem.style.backgroundColor = 'rgba(120, 120, 120, 0.9)';
    listItem.style.borderLeft = '3px solid #0088ff';
    
    return listItem;
  };
  
  /**
   * Select a template
   * @private
   * @param {string} templateId - Template ID
   * @param {string} circleTypeId - Circle type ID
   */
  ChakraApp.TemplateController.prototype._selectTemplate = function(templateId, circleTypeId) {
  // Deselect any selected document of the same circle type
  if (ChakraApp.appState.selectedDocumentIds[circleTypeId]) {
    ChakraApp.appState.deselectDocument(circleTypeId);
    
    // Force update the document list UI
    if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
      ChakraApp.app.controllers.document._updateDocumentList(circleTypeId);
    }
  }
  
  // Deselect current template of this type if different
  if (this.selectedTemplateIds[circleTypeId] && this.selectedTemplateIds[circleTypeId] !== templateId) {
    this._deselectTemplate(circleTypeId);
  }
  
  // If the same template is already selected, deselect it (toggle behavior)
  if (this.selectedTemplateIds[circleTypeId] === templateId) {
    this._deselectTemplate(circleTypeId);
    return;
  }
  
  // Select the new template
  this.selectedTemplateIds[circleTypeId] = templateId;
  
  // Get the template
  var template = this._getTemplateById(templateId);
  if (template) {
    // Create template circles (non-interactive)
    this._createTemplateCircles(template);
    
    // Publish template selected event
    ChakraApp.EventBus.publish('TEMPLATE_SELECTED', template);
  }
  
  // Update the UI
  this._updateTemplateList(circleTypeId);
};
  
  /**
   * Deselect a template
   * @private
   * @param {string} circleTypeId - Circle type ID
   */
ChakraApp.TemplateController.prototype._deselectTemplate = function(circleTypeId) {
  if (!this.selectedTemplateIds[circleTypeId]) return;
  
  var templateId = this.selectedTemplateIds[circleTypeId];
  this.selectedTemplateIds[circleTypeId] = null;
  
  // Remove template circles for this specific template type only
  this._removeTemplateCirclesForType(circleTypeId);
  
  // Publish template deselected event
  ChakraApp.EventBus.publish('TEMPLATE_DESELECTED', { templateId: templateId, circleTypeId: circleTypeId });
};

ChakraApp.TemplateController.prototype._removeTemplateCirclesForType = function(circleTypeId) {
  var templateCircles = document.querySelectorAll('.template-circle[data-circle-type="' + circleTypeId + '"]');
  templateCircles.forEach(function(circle) {
    if (circle.parentNode) {
      circle.parentNode.removeChild(circle);
    }
  });
  
  // If no templates are selected at all, remove all template circles
  var hasSelectedTemplates = false;
  for (var typeId in this.selectedTemplateIds) {
    if (this.selectedTemplateIds[typeId]) {
      hasSelectedTemplates = true;
      break;
    }
  }
  
  if (!hasSelectedTemplates) {
    this._removeTemplateCircles();
  }
};

  
  /**
   * Get template by ID
   * @private
   * @param {string} templateId - Template ID
   * @return {Object|null} Template object or null
   */
  ChakraApp.TemplateController.prototype._getTemplateById = function(templateId) {
    if (!ChakraApp.Config.circleTypeTemplates) {
      return null;
    }
    
    return ChakraApp.Config.circleTypeTemplates.find(function(template) {
      return template.id === templateId;
    }) || null;
  };
  
  /**
   * Create template circles (non-interactive)
   * @private
   * @param {Object} template - Template object
   */
ChakraApp.TemplateController.prototype._createTemplateCircles = function(template) {
  // Don't remove ALL template circles, just ones for this type
  this._removeTemplateCirclesForType(template.type);
  
  if (!template.circles || !Array.isArray(template.circles)) {
    return;
  }
  
  // FIXED: Look for the new left panel structure
  var leftPanel = document.getElementById('left-panel-0') ||
                  document.querySelector('.left-panel[data-panel-index="0"]') ||
                  document.querySelector('#left-container .left-panel:first-child') ||
                  document.querySelector('.circle-panel[data-panel-id="left"]') ||
                  document.getElementById('left-panel');
  
  if (!leftPanel) return;
  
  // Create template circles
  var self = this;
  template.circles.forEach(function(circleData, index) {
    self._createTemplateCircle(circleData, leftPanel, template.type);
  });
};
  
  /**
   * Create a single template circle
   * @private
   * @param {Object} circleData - Circle data from template
   * @param {HTMLElement} container - Container element
   */
ChakraApp.TemplateController.prototype._createTemplateCircle = function(circleData, container, circleTypeId) {
  var circleElement = document.createElement('div');
  circleElement.className = 'template-circle';
  circleElement.dataset.circleType = circleTypeId; // Add this line
  circleElement.style.position = 'absolute';
  circleElement.style.width = '20px';
  circleElement.style.height = '20px';
  circleElement.style.borderRadius = '50%';
  circleElement.style.backgroundColor = circleData.color || '#C0C0C0';
  circleElement.style.left = circleData.x + 'px';
  circleElement.style.top = circleData.y + 'px';
  circleElement.style.transform = 'translate(-50%, -50%)';
  circleElement.style.opacity = '0.7';
  circleElement.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
  circleElement.style.pointerEvents = 'none'; // Non-interactive
  circleElement.style.zIndex = '5';
  
  // Add circle name
  var nameElement = document.createElement('div');
  nameElement.className = 'template-circle-name';
  nameElement.textContent = circleData.name || '???';
  nameElement.style.position = 'absolute';
  nameElement.style.top = '120%';
  nameElement.style.left = '50%';
  nameElement.style.transform = 'translateX(-50%)';
  nameElement.style.color = 'rgba(255, 255, 255, 0.7)';
  nameElement.style.fontSize = '11px';
  nameElement.style.background = 'rgba(0, 0, 0, 0.5)';
  nameElement.style.padding = '2px 4px';
  nameElement.style.borderRadius = '3px';
  nameElement.style.whiteSpace = 'nowrap';
  nameElement.style.pointerEvents = 'none';
  
  circleElement.appendChild(nameElement);
  container.appendChild(circleElement);
};
  
  /**
   * Remove all template circles
   * @private
   */
  ChakraApp.TemplateController.prototype._removeTemplateCircles = function() {
    var templateCircles = document.querySelectorAll('.template-circle');
    templateCircles.forEach(function(circle) {
      if (circle.parentNode) {
        circle.parentNode.removeChild(circle);
      }
    });
  };
  
  /**
   * Use a template to create a new document
   * @public
   * @param {string} templateId - Template ID
   */
ChakraApp.TemplateController.prototype.useTemplate = function(templateId) {
  var template = this._getTemplateById(templateId);
  if (!template) {
    console.error('Template not found:', templateId);
    return;
  }
  
  // Create a new document with the template name
  var newDoc = ChakraApp.appState.addDocument({
    name: template.name,
    circleType: template.type
  });
  
  // Create copies of all circles from the template
  var self = this;
  if (template.circles && Array.isArray(template.circles)) {
    template.circles.forEach(function(circleData) {
      var newCircleData = {
        x: circleData.x,
        y: circleData.y,
        color: circleData.color,
        name: circleData.name,
        circleType: template.type,
        documentId: newDoc.id,
        text: circleData.text || null // NEW: Include text content from template
      };
      
      ChakraApp.appState.addCircle(newCircleData);
    });
  }
  
  // Deselect the template
  var circleTypeId = template.type;
  this._deselectTemplate(circleTypeId);
  
  // Select the new document immediately
  ChakraApp.appState.selectDocument(newDoc.id, circleTypeId);
  
  // Close template list
  this.templateListVisible[circleTypeId] = false;
  this._updateTemplateList(circleTypeId);
  
  // Update template toggle button arrow
  var toggleBtn = this.toggleTemplateListBtns[circleTypeId];
  if (toggleBtn) {
    var arrowIcon = toggleBtn.querySelector('.template-arrow-icon');
    if (arrowIcon) {
      arrowIcon.innerHTML = 'T';
    }
  }
};
  
  /**
   * Set up template event listeners
   * @private
   */
ChakraApp.TemplateController.prototype._setupTemplateEventListeners = function() {
  // Listen for document selection events to deselect templates
  var self = this;
  this.eventSubscriptions.documentSelected = ChakraApp.EventBus.subscribe(
    ChakraApp.EventTypes.DOCUMENT_SELECTED,
    function(doc) {
      var circleType = doc.circleType || 'standard';
      if (self.selectedTemplateIds[circleType]) {
        self._deselectTemplate(circleType);
        self._updateTemplateList(circleType);
        
        // Update template toggle button arrow
        var templateToggleBtn = self.toggleTemplateListBtns[circleType];
        if (templateToggleBtn) {
          var arrowIcon = templateToggleBtn.querySelector('.template-arrow-icon');
          if (arrowIcon) {
            arrowIcon.innerHTML = 'T';
          }
        }
      }
    }
  );
}
  
  /**
   * Set up click outside handler for template lists
   * @private
   */
  ChakraApp.TemplateController.prototype._setupClickOutsideHandler = function() {
    var self = this;
    
    if (!this.templateClickHandler) {
      this.templateClickHandler = function(e) {
        // Check if any template lists are visible
        var listsVisible = false;
        var clickedCircleTypeId = null;
        
        ChakraApp.Config.circleTypes.forEach(function(circleType) {
          var typeId = circleType.id;
          if (self.templateListVisible[typeId]) {
            listsVisible = true;
            
            var listContainer = self.templateListContainers[typeId];
            var toggleBtn = document.getElementById('toggle-template-list-btn-' + typeId);
            
            // Check if click was inside this circle type's list or toggle button
            if (listContainer && listContainer.contains(e.target) ||
                toggleBtn && toggleBtn.contains(e.target)) {
              clickedCircleTypeId = typeId;
            }
          }
        });
        
        // If any lists are visible and click was outside all lists and buttons, hide all lists
        if (listsVisible && !clickedCircleTypeId) {
          ChakraApp.Config.circleTypes.forEach(function(circleType) {
            var typeId = circleType.id;
            if (self.templateListVisible[typeId]) {
              self.templateListVisible[typeId] = false;
              self._updateTemplateList(typeId);
              
              // Update arrow icon
              var toggleBtn = self.toggleTemplateListBtns[typeId];
              if (toggleBtn) {
                var arrowIcon = toggleBtn.querySelector('.template-arrow-icon');
                if (arrowIcon) {
                  arrowIcon.innerHTML = 'T';
                }
              }
            }
          });
        }
      };
      
      document.addEventListener('click', this.templateClickHandler);
    }
  };

ChakraApp.TemplateController.prototype._closeAllDocumentLists = function() {
  // Close all document lists when a template list is opened
  if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.document) {
    ChakraApp.Config.circleTypes.forEach(function(circleType) {
      var typeId = circleType.id;
      if (ChakraApp.appState.documentListVisible[typeId]) {
        ChakraApp.appState.documentListVisible[typeId] = false;
        
        // Update document list UI
        ChakraApp.app.controllers.document._updateDocumentList(typeId);
        
        // Update document toggle button arrow
        var documentToggleBtn = ChakraApp.app.controllers.document.toggleDocumentListBtns[typeId];
        if (documentToggleBtn) {
          var arrowIcon = documentToggleBtn.querySelector('.arrow-icon');
          if (arrowIcon) {
            arrowIcon.innerHTML = 'T';
          }
        }
      }
    });
  }
};

ChakraApp.TemplateController.prototype._createVisualTemplateSelector = function() {
  // Check if selector already exists to prevent duplicates
  var existingSelector = document.querySelector('.template-selector-container');
  if (existingSelector) {
    this.templateSelectorContainer = existingSelector;
    this.templateSelector = existingSelector.querySelector('.template-selector');
    this.templateToggleButton = existingSelector.querySelector('.template-toggle-button');
    return;
  }
  
  // Create selector container
  var selectorContainer = document.createElement('div');
  selectorContainer.className = 'template-selector-container';
  selectorContainer.style.cssText = `
    position: fixed;
    top: 50px;
    left: 10px;
    width: 600px;
    max-width: 600px;
    background-color: #AAA;
    border-radius: 8px;
    z-index: 1000;
    display: none;
  `;
  
  this.templateSelectorContainer = selectorContainer;
  
  // Create toggle button (if needed)
  this.templateToggleButton = document.createElement('div');
  this.templateToggleButton.className = 'template-toggle-button';
  this.templateToggleButton.style.cssText = `
    padding: 8px;
    background-color: #444;
    color: #BBB;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s ease;
  `;
  
  // Add toggle button content
  this._updateTemplateToggleButtonText();
  
  // Create the main selector element
  this.templateSelector = document.createElement('div');
  this.templateSelector.className = 'template-selector';
  this.templateSelector.style.cssText = `
    max-height: 700px;
    overflow-y: auto;
    display: none;
    background-color: #888;
    border: 2px solid #666;
    border-radius: 6px;
    padding: 10px;
  `;
  
  // Track state
  this.isTemplateGridExpanded = false;
  this.selectedTemplateCategory = null;
  this.currentPanelId = null;
  
  // Add click handler to toggle button
  var self = this;
  this.templateToggleButton.addEventListener('click', function(e) {
    e.stopPropagation();
    self._toggleTemplateGrid();
  });
  
  // Build the grid structure
  this._buildTemplateSelectorGrid();
  
  // Only append the selector (not the toggle button since we're not using it)
  selectorContainer.appendChild(this.templateSelector);
  
  // FIXED: Append to a higher-level container instead of left panel
  // Try multiple fallback options for the parent container
  var parentContainer = document.getElementById('main-container') ||
                       document.getElementById('left-container') ||
                       document.body;
  
  if (parentContainer) {
    parentContainer.appendChild(selectorContainer);
  } else {
    console.error('No suitable parent container found for template selector');
  }
  
  // Set up click-outside listener
  this._setupTemplateClickOutsideListener();
};

ChakraApp.TemplateController.prototype._buildTemplateSelectorGrid = function() {
  var self = this;
  this.templateSelector.innerHTML = '';
  
  // Add CSS for template selector layout
  this._addTemplateSelectorStyles();
  
  // Create categorization scheme selector
  var schemeSelector = this._createCategorizationSchemeSelector();
  this.templateSelector.appendChild(schemeSelector);
  
  // Get templates categorized by current scheme
  var categorizedTemplates = this.getCategorizedTemplates(this.currentCategorizationScheme);
  
  // Create one continuous grid container
  var continuousGrid = document.createElement('div');
  continuousGrid.className = 'continuous-templates-grid';
  continuousGrid.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: flex-start;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 8px;
    gap: 4px;
    position: relative;
    width: 100%;
  `;
  
  // Create array of all items (category headers + templates) in order
  var gridItems = [];
  
  Object.keys(categorizedTemplates).forEach(function(categoryValue) {
    var categoryData = categorizedTemplates[categoryValue];
    
    // Skip empty categories
    if (Object.keys(categoryData.templates).length === 0) {
      return;
    }
    
    // Add category header as grid item
    gridItems.push({
      type: 'category-header',
      categoryValue: categoryValue,
      categoryData: categoryData
    });
    
    // Add all templates in this category as grid items
    Object.keys(categoryData.templates).forEach(function(templateId) {
      var template = categoryData.templates[templateId];
      gridItems.push({
        type: 'template',
        template: template,
        categoryValue: categoryValue
      });
    });
  });
  
  // Create DOM elements for all grid items
  gridItems.forEach(function(item) {
    if (item.type === 'category-header') {
      var categoryDivider = self._createCategoryDivider(item.categoryValue, item.categoryData);
      continuousGrid.appendChild(categoryDivider);
    } else if (item.type === 'template') {
      var templateBox = self._createTemplateBox(item.template.name, item.template, item.categoryValue);
      continuousGrid.appendChild(templateBox);
    }
  });
  
  this.templateSelector.appendChild(continuousGrid);
};

ChakraApp.TemplateController.prototype._createCategoryDivider = function(categoryValue, categoryData) {
  var self = this;
  var categoryDivider = document.createElement('div');
  categoryDivider.className = 'category-divider';
  categoryDivider.dataset.category = categoryValue;
  
  var isSelectedCategory = categoryValue === this.selectedTemplateCategory;
  var isCategorySelected = categoryValue === this.selectedTemplateCategory;
  
  // Set size class based on category selection (same as template boxes)
  var sizeClass = isCategorySelected ? 'full-size' : 'small-size';
  categoryDivider.classList.add(sizeClass);
  
  categoryDivider.style.cssText = `
    background-color: ${categoryData.info.color};
    border: 2px solid ${isSelectedCategory ? '#007ACC' : 'rgba(0,0,0,0.1)'};
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 12px;
    font-weight: bold;
    color: #333;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px;
    padding: 8px;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  `;
  
  // Add scheme icon if available
  var scheme = this.categorizationSchemes[this.currentCategorizationScheme];
  var icon = scheme ? scheme.icon : '';
  
  categoryDivider.innerHTML = `${icon}<br>${categoryValue.toUpperCase()}`;
  
  // Add click handler for category selection
  categoryDivider.addEventListener('click', function(e) {
    e.stopPropagation();
    self._selectTemplateCategory(categoryValue);
  });
  
  // Add hover effect
  categoryDivider.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.05)';
    this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  });
  
  categoryDivider.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = 'none';
  });
  
  return categoryDivider;
};

ChakraApp.TemplateController.prototype._createCategorizationSchemeSelector = function() {
  var self = this;
  
  var container = document.createElement('div');
  container.className = 'categorization-scheme-selector';
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  // Add title
  var title = document.createElement('div');
  title.textContent = 'Categorize by:';
  title.style.cssText = `
    font-size: 11px;
    font-weight: bold;
    color: #333;
    margin-right: 8px;
    align-self: center;
    min-width: fit-content;
  `;
  container.appendChild(title);
  
  // Create buttons for each categorization scheme
  Object.keys(this.categorizationSchemes).forEach(function(schemeKey) {
    var scheme = self.categorizationSchemes[schemeKey];
    var isActive = schemeKey === self.currentCategorizationScheme;
    
    var button = document.createElement('button');
    button.className = 'categorization-scheme-button';
    button.dataset.scheme = schemeKey;
    button.innerHTML = `${scheme.icon} ${scheme.name}`;
    
    button.style.cssText = `
      padding: 4px 8px;
      font-size: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: ${isActive ? '#007ACC' : 'rgba(255, 255, 255, 0.2)'};
      color: ${isActive ? 'white' : '#333'};
      font-weight: ${isActive ? 'bold' : 'normal'};
      white-space: nowrap;
    `;
    
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      self._changeCategorizationScheme(schemeKey);
    });
    
    button.addEventListener('mouseenter', function() {
      if (!isActive) {
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      }
    });
    
    button.addEventListener('mouseleave', function() {
      if (!isActive) {
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      }
    });
    
    container.appendChild(button);
  });
  
  return container;
};

ChakraApp.TemplateController.prototype._changeCategorizationScheme = function(newScheme) {
  if (this.currentCategorizationScheme === newScheme) {
    return; // No change needed
  }
  
  this.currentCategorizationScheme = newScheme;
  this.selectedTemplateCategory = null; // Reset category selection
  
  // Rebuild the entire grid with new categorization
  this._buildTemplateSelectorGrid();
};

ChakraApp.TemplateController.prototype._addTemplateSelectorStyles = function() {
  var style = document.createElement('style');
  style.id = 'template-selector-styles';
  style.textContent = `
    /* Template selector container positioning */
    .template-selector-container {
      position: absolute !important;
      z-index: 1000 !important;
    }
    
    /* Main template selector container */
    .template-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
      background-color: #888;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 2px solid #666;
    }
    
    /* Override inline display styles */
    .template-selector[style*="display: none"] {
      display: none !important;
    }
    
    .template-selector[style*="display: block"] {
      display: flex !important;
    }
    
    /* Continuous grid container */
    .continuous-templates-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: flex-start;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px;
      gap: 4px;
      position: relative;
      width: 100%;
    }
    
    /* Category dividers within the grid */
    .category-divider {
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 12px;
      font-weight: bold;
      color: #333;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2px;
      padding: 8px;
      box-sizing: border-box;
      position: relative;
      z-index: 1;
      flex-direction: column;
      line-height: 1.2;
    }
    
    /* Full size category dividers */
    .category-divider.full-size {
      width: 120px;
      height: 120px;
      font-size: 14px;
    }
    
    /* Small size category dividers */
    .category-divider.small-size {
      width: 60px;
      height: 60px;
      font-size: 8px;
      font-weight: bold;
    }
    
    .category-divider:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    
    .template-box {
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      min-height: 80px;
      margin: 2px;
      box-sizing: border-box;
    }
    
    /* Full size template boxes */
    .template-box.full-size {
      width: 120px;
      height: 120px;
      font-size: 10px;
    }
    
    .template-box.full-size .template-name {
      font-size: 14px;
      line-height: 1.1;
      margin-bottom: 4px;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    
    .template-box.full-size .template-description {
      font-size: 9px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    
    /* Small size template boxes */
    .template-box.small-size {
      width: 60px;
      height: 60px;
      font-size: 7px;
      padding: 4px;
      box-shadow: 1px 1px 2px rgba(0,0,0,1);
    }
    
    .template-box.small-size.selected {
      z-index: 5;
      box-shadow: 3px 3px 8px rgba(0,122,204,0.4);
    }
    
    .template-box.small-size .template-name {
      font-size: 8px;
      line-height: 1;
      margin-bottom: 2px;
      font-weight: bold;
    }
    
    .template-box.small-size .template-description {
      display: none;
    }
    
    /* Circles preview containers */
    .circles-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
    }
    
    /* Accurate layout preview */
    .circles-preview.accurate-layout {
      position: relative;
      display: block;
      overflow: hidden;
    }
    
    /* Standard mini circle previews (fallback) */
    .mini-circle-preview {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      font-size: 6px;
      color: white;
      text-shadow: 0 0 2px rgba(0,0,0,0.5);
      width: 8px;
      height: 8px;
    }
    
    /* Positioned mini circles */
    .mini-circle-preview.positioned {
      position: absolute;
      z-index: 1;
    }
    
    /* Full size positioned circles */
    .template-box.full-size .mini-circle-preview.positioned {
      width: 8px;
      height: 8px;
    }
    
    /* Small size positioned circles */
    .template-box.small-size .mini-circle-preview.positioned {
      width: 4px;
      height: 4px;
      font-size: 0; /* Hide text in small circles */
    }
    
    /* More circles indicator */
    .more-circles-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 5;
    }
    
    /* Template box hover effects */
    .template-box:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    
    /* Hover effects for positioned circles */
    .template-box.full-size .mini-circle-preview.positioned:hover {
      transform: translate(-50%, -50%) scale(1.5) !important;
      z-index: 10 !important;
    }
    
    /* Responsive grid adjustments */
    @media (max-width: 700px) {
      .template-box.full-size {
        width: 100px;
        height: 100px;
      }
      
      .template-box.small-size {
        width: 50px;
        height: 50px;
      }
    }
  `;
  
  // Remove existing styles if they exist
  var existingStyle = document.getElementById('template-selector-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  document.head.appendChild(style);
};

ChakraApp.TemplateController.prototype._createTemplateBox = function(templateName, templateData, categoryName) {
  var self = this;
  var templateBox = document.createElement('div');
  templateBox.className = 'template-box';
  templateBox.dataset.template = templateData.id;
  templateBox.dataset.category = categoryName;
  
  var isSelected = templateData.id === this.selectedTemplateId;
  var isCategorySelected = categoryName === this.selectedTemplateCategory;
  
  // Set size class based on category selection
  var sizeClass = isCategorySelected ? 'full-size' : 'small-size';
  templateBox.classList.add(sizeClass);
  
  templateBox.style.cssText = `
    background-color: ${templateData.color};
    border: 2px solid ${isSelected ? '#007ACC' : 'transparent'};
    font-weight: ${isSelected ? 'bold' : '500'};
  `;
  
  // Create template name
  var templateNameDiv = document.createElement('div');
  templateNameDiv.className = 'template-name';
  templateNameDiv.textContent = templateName;
  
  // Create description (only shown in full size)
  var descriptionDiv = document.createElement('div');
  descriptionDiv.className = 'template-description';
  descriptionDiv.textContent = templateData.description || '';
  
  // Create circles preview container with accurate positioning
  var circlesContainer = this._createAccurateCirclesPreview(templateData, isCategorySelected);
  
  // Append sections to template box
  templateBox.appendChild(templateNameDiv);
  templateBox.appendChild(descriptionDiv);
  templateBox.appendChild(circlesContainer);
  
  // Add click handler
  templateBox.addEventListener('click', function(e) {
    e.stopPropagation();
    self._selectTemplateForUse(templateData.id, templateName, templateData);
  });
  
  return templateBox;
};

ChakraApp.TemplateController.prototype._createAccurateCirclesPreview = function(templateData, isFullSize) {
  var circlesContainer = document.createElement('div');
  circlesContainer.className = 'circles-preview accurate-layout';
  
  // Set container to relative positioning for absolute positioning of circles
  circlesContainer.style.position = 'relative';
  circlesContainer.style.flex = '1';
  circlesContainer.style.minHeight = isFullSize ? '60px' : '30px';
  circlesContainer.style.width = '100%';
  
  if (!templateData.circles || templateData.circles.length === 0) {
    return circlesContainer;
  }
  
  // Calculate bounds to determine max extents
  var bounds = this._calculateCircleBounds(templateData.circles);
  
  // Define maximum expected coordinate values for normalization
  var maxExpectedX = 180; // Based on your analysis of Zodiac Signs
  var maxExpectedY = 450; // Based on looking at the y coordinates in chakras (up to 410)
  
  // Calculate transformation coefficients for percentage positioning
  var transformCoeffX = 50 / maxExpectedX; // 50% range / max coordinate
  var transformCoeffY = 100 / maxExpectedY; // 50% range / max coordinate
  
  // Determine how many circles to show
  var maxCircles = 100;
  var circlesToShow = templateData.circles.slice(0, maxCircles);
  
  // Create mini circle previews with percentage-based positioning
  circlesToShow.forEach(function(circle, index) {
    var miniCircle = document.createElement('div');
    miniCircle.className = 'mini-circle-preview positioned';
    
    // Calculate percentage-based positions
    // x=0 should be at 50% (center), x=180 should be at 100%, x=-180 should be at 0%
    var leftPercent = 50 + (circle.x * transformCoeffX);
    // y=0 should be at 50% (center), positive y moves down, negative y moves up
    var topPercent = (circle.y * transformCoeffY);
    
    // Clamp percentages to reasonable bounds (with some overflow for variety)
    leftPercent = Math.max(5, Math.min(95, leftPercent));
    topPercent = Math.max(5, Math.min(95, topPercent));
    
    // Set circle size based on preview size
    var circleSize = isFullSize ? 8 : 4;
    
    miniCircle.style.cssText = `
      position: absolute;
      left: ${leftPercent}%;
      top: ${topPercent}%;
      width: ${circleSize}px;
      height: ${circleSize}px;
      background-color: ${circle.color};
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.3);
      transform: translate(-50%, -50%);
      transition: all 0.3s ease;
      font-size: ${circleSize - 2}px;
      color: white;
      text-shadow: 0 0 2px rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    `;
    
    // Add first letter of name for larger circles
    if (isFullSize && circle.name && circleSize >= 8) {
      miniCircle.textContent = circle.name.charAt(0);
    }
    
    // Add hover effect for larger previews
    if (isFullSize) {
      miniCircle.title = circle.name || 'Circle ' + (index + 1);
      
      miniCircle.addEventListener('mouseenter', function() {
        this.style.transform = 'translate(-50%, -50%) scale(1.5)';
        this.style.zIndex = '10';
      });
      
      miniCircle.addEventListener('mouseleave', function() {
        this.style.transform = 'translate(-50%, -50%) scale(1)';
        this.style.zIndex = '1';
      });
    }
    
    circlesContainer.appendChild(miniCircle);
  });
  
  // Show count if there are more circles
  if (templateData.circles.length > maxCircles) {
    var moreIndicator = document.createElement('div');
    moreIndicator.className = 'more-circles-indicator';
    moreIndicator.textContent = '+' + (templateData.circles.length - maxCircles);
    moreIndicator.style.cssText = `
      position: absolute;
      bottom: 2px;
      right: 2px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      font-size: ${isFullSize ? '10px' : '8px'};
      padding: 1px 4px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 5;
    `;
    circlesContainer.appendChild(moreIndicator);
  }
  
  return circlesContainer;
};

// NEW METHOD: Calculate bounds of all circles
ChakraApp.TemplateController.prototype._calculateCircleBounds = function(circles) {
  if (!circles || circles.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  var minX = Math.min.apply(Math, circles.map(function(c) { return c.x; }));
  var maxX = Math.max.apply(Math, circles.map(function(c) { return c.x; }));
  var minY = Math.min.apply(Math, circles.map(function(c) { return c.y; }));
  var maxY = Math.max.apply(Math, circles.map(function(c) { return c.y; }));
  
  return {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

ChakraApp.TemplateController.prototype._selectTemplateCategory = function(categoryName) {
  // Toggle category selection
  if (this.selectedTemplateCategory === categoryName) {
    this.selectedTemplateCategory = null;
  } else {
    this.selectedTemplateCategory = categoryName;
  }
  
  // Rebuild template selector grid with new sizing
  this._buildTemplateSelectorGrid();
};

ChakraApp.TemplateController.prototype._selectTemplateForUse = function(templateId, templateName, templateData) {
  // Close the template selector
  this.isTemplateGridExpanded = false;
  this.templateSelector.style.display = 'none';
  this._updateTemplateToggleButtonText();
  
  // Use the template immediately
  this._useTemplateInPanel(templateName, templateData, this.currentPanelId || 0);
};

ChakraApp.TemplateController.prototype._useTemplateInPanel = function(templateName, templateData, panelId) {
  if (!templateData || !templateData.circles) {
    console.error('Invalid template data:', templateData);
    return;
  }
  
  // Create a new document with the template name for the specific circle type
  var newDoc = ChakraApp.appState.addDocument({
    name: templateName || 'Template Document',
    circleType: templateData.type,
    listType: 'list1' // Default to list1
  });
  
  // Create copies of all circles from the template
  var self = this;
  templateData.circles.forEach(function(circleData) {
    var newCircleData = {
      x: circleData.x,
      y: circleData.y,
      color: circleData.color,
      name: circleData.name,
      circleType: templateData.type,
      documentId: newDoc.id,
      text: circleData.text || null // NEW: Include text content from template
    };
    
    ChakraApp.appState.addCircle(newCircleData);
  });
  
  // Select the new document for the specific panel
  ChakraApp.appState.selectDocumentForPanel(newDoc.id, templateData.type, 'list1', panelId);
  
  // Update the UI for this panel
  if (ChakraApp.app && ChakraApp.app.viewManager) {
    ChakraApp.app.viewManager.renderCirclesForPanel('left-' + panelId);
  }
  
  // Close any open template lists for this circle type
  if (this.templateListVisible[templateData.type]) {
    this.templateListVisible[templateData.type] = false;
    this._updateTemplateList(templateData.type);
  }
};

ChakraApp.TemplateController.prototype._setupButtonHandlersEnhanced = function() {
  var self = this;
  
  ChakraApp.Config.circleTypes.forEach(function(circleType) {
    var typeId = circleType.id;
    
    // Handle template toggle buttons for all panels
    var allToggleBtns = document.querySelectorAll('[id*="toggle-template-list-btn-' + typeId + '"]');
    
    allToggleBtns.forEach(function(toggleBtn) {
      // Clone the button to remove existing event listeners
      var newToggleBtn = toggleBtn.cloneNode(true);
      
      if (toggleBtn.parentNode) {
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
      }
      
      // Extract panel ID from button ID or dataset
      var panelId = 0; // Default to panel 0
      if (newToggleBtn.dataset.panelId !== undefined) {
        panelId = parseInt(newToggleBtn.dataset.panelId);
      } else {
        // Try to extract from ID pattern like "toggle-template-list-btn-gem-panel-1"
        var idMatch = newToggleBtn.id.match(/panel-(\d+)$/);
        if (idMatch) {
          panelId = parseInt(idMatch[1]);
        }
      }
      
      // Add the click event listener
      newToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Set the current panel ID for template selection
        self.currentPanelId = panelId;
        
        // Close all document lists before opening template selector
        self._closeAllDocumentLists();
        
        // Show the visual template selector
        self._showVisualTemplateSelector(typeId);
      });
      
      // Store reference (use the first one found for the main reference)
      if (!self.toggleTemplateListBtns[typeId]) {
        self.toggleTemplateListBtns[typeId] = newToggleBtn;
      }
    });
  });
};


ChakraApp.TemplateController.prototype._showVisualTemplateSelector = function(circleTypeId) {
  
  // Create visual selector if it doesn't exist
  if (!this.templateSelectorContainer) {
    this._createVisualTemplateSelector();
  } else {
  }
  
  // Calculate positioning relative to the current left panel
  var leftPanel = document.getElementById('left-panel-' + (this.currentPanelId || 0)) || 
                  document.querySelector('.left-panel') ||
                  document.getElementById('left-panel');
  
  if (leftPanel && this.templateSelectorContainer) {
    var leftPanelRect = leftPanel.getBoundingClientRect();
    
    // Position the template selector near the left panel but not constrained by it
    this.templateSelectorContainer.style.position = 'fixed';
    this.templateSelectorContainer.style.top = Math.max(50, leftPanelRect.top + 50) + 'px';
    this.templateSelectorContainer.style.left = 100 + 'px';
    this.templateSelectorContainer.style.width = '800px';
    this.templateSelectorContainer.style.maxWidth = '800px';
    
  }
  
  // Show the template selector
  this.templateSelectorContainer.style.display = 'block';
  this.isTemplateGridExpanded = true;
  this.templateSelector.style.display = 'block';
  
  // Log current styles
  
  // Check dimensions
  var rect = this.templateSelectorContainer.getBoundingClientRect();
  
  this._updateTemplateToggleButtonText();
  
  // Filter templates to show only those matching the circle type
  this._filterTemplatesByType(circleTypeId);
  
  // Final check
  setTimeout(function() {
    var finalRect = this.templateSelectorContainer.getBoundingClientRect();
  }.bind(this), 100);
  
};

/**
 * Filter templates by circle type
 * @private
 */
ChakraApp.TemplateController.prototype._filterTemplatesByType = function(circleTypeId) {
  
  if (!this.templateSelector) {
    console.error('No template selector to filter');
    return;
  }
  
  var templateBoxes = this.templateSelector.querySelectorAll('.template-box');
  
  var visibleCount = 0;
  templateBoxes.forEach(function(box) {
    var templateId = box.dataset.template;
    var template = this._findTemplateById(templateId);
    
    
    if (template && template.type === circleTypeId) {
      box.style.display = 'flex';
      visibleCount++;
    } else {
      box.style.display = 'none';
    }
  }.bind(this));
  
  
  // Hide categories that have no visible templates
  var categorySections = this.templateSelector.querySelectorAll('.template-category-section');
  
  categorySections.forEach(function(section) {
    var visibleTemplates = section.querySelectorAll('.template-box[style*="display: flex"]');
    
    if (visibleTemplates.length > 0) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
  
};

/**
 * Find template by ID across all categories
 * @private
 */
ChakraApp.TemplateController.prototype._findTemplateById = function(templateId) {
  return this.templates[templateId] || null;
};

/**
 * Toggle template grid
 * @private
 */
ChakraApp.TemplateController.prototype._toggleTemplateGrid = function() {
  if (!this.templateSelector) return;
  
  this.isTemplateGridExpanded = !this.isTemplateGridExpanded;
  
  if (this.isTemplateGridExpanded) {
    this.templateSelector.style.display = 'block';
  } else {
    this.templateSelector.style.display = 'none';
  }
  
  this._updateTemplateToggleButtonText();
};

/**
 * Update toggle button text
 * @private
 */
ChakraApp.TemplateController.prototype._updateTemplateToggleButtonText = function() {
  if (!this.templateToggleButton) return;
  
  var arrow = this.isTemplateGridExpanded ? '▼' : 'T';
  var text = 'Templates';
  
  this.templateToggleButton.innerHTML = `
    <span>${text}</span>
    <span style="margin-left: 10px;">${arrow}</span>
  `;
};

/**
 * Set up click-outside listener for template selector
 * @private
 */
ChakraApp.TemplateController.prototype._setupTemplateClickOutsideListener = function() {
  var self = this;
  
  this.templateClickOutsideListener = function(event) {
    if (!self.isTemplateGridExpanded) return;
    
    if (self.templateSelectorContainer && !self.templateSelectorContainer.contains(event.target)) {
      self._closeTemplateGrid();
    }
  };
  
  document.addEventListener('click', this.templateClickOutsideListener);
};

/**
 * Close template grid
 * @private
 */
ChakraApp.TemplateController.prototype._closeTemplateGrid = function() {
  if (!this.isTemplateGridExpanded) return;
  
  this.isTemplateGridExpanded = false;
  this.templateSelector.style.display = 'none';
  this._updateTemplateToggleButtonText();
};
  
  /**
   * Clean up resources
   */
ChakraApp.TemplateController.prototype.destroy = function() {
  // Call parent destroy
  ChakraApp.BaseController.prototype.destroy.call(this);
  
  // Remove template click handler
  if (this.templateClickHandler) {
    document.removeEventListener('click', this.templateClickHandler);
    this.templateClickHandler = null;
  }
  
  // Clean up visual template selector click-outside listener
  if (this.templateClickOutsideListener) {
    document.removeEventListener('click', this.templateClickOutsideListener);
    this.templateClickOutsideListener = null;
  }
  
  // Clean up event subscriptions
  Object.keys(this.eventSubscriptions).forEach(function(key) {
    var unsubscribe = this.eventSubscriptions[key];
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  }, this);
  
  // Clear subscriptions object
  this.eventSubscriptions = {};
  
  // Remove template circles
  this._removeTemplateCircles();
  
  // Remove visual template selector from DOM
  if (this.templateSelectorContainer && this.templateSelectorContainer.parentNode) {
    this.templateSelectorContainer.parentNode.removeChild(this.templateSelectorContainer);
  }
  
  // Remove other DOM elements
  Object.values(this.toggleTemplateListBtns).forEach(function(btn) {
    if (btn && btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
  });
  
  Object.values(this.templateListContainers).forEach(function(container) {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  
  // Clear DOM element references
  this.toggleTemplateListBtns = {};
  this.templateListContainers = {};
};
  
})(window.ChakraApp = window.ChakraApp || {});
