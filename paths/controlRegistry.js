// controlRegistry.js - Single source of truth for all controls
import { colorFamilies } from './colorFamilies.js';
import { circleTypes } from './circleTypes.js';
import { energyTypes } from './energyTypes.js';
import { attributeInfo, storyCategories } from './emojiAttributes.js';

export const CONTROL_REGISTRY = {
  // Color controls
  color: {
    type: 'multi-color',
    property: 'colors',
    fallbackProperty: 'color',
    defaultValue: ['#4CAF50'],
    dataSource: () => colorFamilies,
    component: 'ColorControl',
    picker: 'ColorPickerModal',
    pickerConfig: { width: 600, height: 500 },
    displayName: 'Color'
  },

  secondaryColor: {
    type: 'multi-color', 
    property: 'secondaryColors',
    fallbackProperty: 'secondaryColor',
    defaultValue: ['#B3B3B3'],
    dataSource: () => colorFamilies,
    component: 'ColorControl',
    picker: 'ColorPickerModal',
    pickerConfig: { width: 600, height: 500 },
    displayName: 'Secondary Color'
  },

  // Multi-select controls
  energy: {
    type: 'multi-select',
    property: 'energyTypes', 
    defaultValue: [],
    dataSource: () => energyTypes,
    component: 'EnergyControl',
    picker: 'EnergyPickerModal',
    pickerConfig: { width: 400, height: 350 },
    displayName: 'Energy'
  },

  // Single value controls
  type: {
    type: 'single-select',
    property: 'type',
    defaultValue: 'basic',
    dataSource: () => circleTypes,
    component: 'TypeControl',
    picker: 'TypePickerModal', 
    pickerConfig: { width: 400, height: 400 },
    displayName: 'Type'
  },

  // Text controls
  secondaryName: {
    type: 'text',
    property: 'secondaryName',
    defaultValue: '',
    component: 'CBSecondaryNameControl',
    picker: 'CBSecondaryNamePickerModal',
    pickerConfig: { width: 300, height: 200 },
    displayName: 'Secondary Name'
  },

  // Special controls
  circleEmoji: {
    type: 'emoji',
    property: 'emoji',
    defaultValue: '',
    component: 'CircleEmojiControl',
    picker: 'CircleEmojiPickerModal',
    pickerConfig: { width: 600, height: 500 },
    displayName: 'Circle Emoji',
    condition: (circles) => circles.every(c => c.type === 'emoji' && !c.referenceID)
  },

  demandEmoji: {
    type: 'emoji',
    property: 'demandEmoji', 
    defaultValue: null,
    component: 'CircleEmojiControl',
    picker: 'CircleEmojiPickerModal',
    pickerConfig: { width: 600, height: 500 },
    displayName: 'Demand Emoji'
    // No condition = shows for all circles
  },

  emoji: {
    type: 'story-emoji',
    property: 'emoji',
    defaultValue: null,
    dataSource: () => ({ attributeInfo, storyCategories }),
    component: 'EmojiControl',
    picker: 'EmojiPickerModal',
    pickerConfig: { width: 700, height: 600 },
    displayName: 'Story Emoji',
    condition: (circles) => circles.length === 1 // Only for single selection
  },

  // Connection controls
  connectionEnergy: {
    type: 'connection-energy',
    property: 'energyTypes',
    defaultValue: [],
    dataSource: () => energyTypes,
    component: 'CBConnectionEnergyControl',
    picker: 'EnergyPickerModal',
    pickerConfig: { width: 400, height: 350 },
    displayName: 'Connection Energy',
    condition: (circles, connections) => connections.length === 1,
    entityType: 'connection'
  }
};

// Helper to register new controls
export function registerControl(name, config) {
  CONTROL_REGISTRY[name] = config;
}

// Helper to get control config
export function getControlConfig(name) {
  return CONTROL_REGISTRY[name];
}

// Helper to get all control names
export function getAllControlNames() {
  return Object.keys(CONTROL_REGISTRY);
}

// Helper to get controls for current selection state
export function getAvailableControls(circles, connections = [], isReferenceCircle = false) {
  return Object.entries(CONTROL_REGISTRY).filter(([name, config]) => {
    // Skip controls for reference circles unless allowed
    if (isReferenceCircle && !config.allowForReference) {
      return false;
    }

    // Check condition if present
    if (config.condition) {
      return config.condition(circles, connections);
    }

    return true;
  }).map(([name]) => name);
}
