// CBCyclePropertyConfigs.js - Centralized configuration for all cycleable properties

export const CYCLE_PROPERTY_CONFIGS = {
  /*shinynessReceiveMode: {
    values: {
      'or': { icon: '➕', label: 'Or Mode', description: 'Or Mode', default: true },
      'and': { icon: '✖️', label: 'And Mode', description: 'And Mode' },
    }
  },*/
  
  /*activationTriggers: {
    values: {
      'none': { icon: '🫗', label: 'None', description: 'No activation triggers - Click to cycle to Members', default: true },
      'members': { icon: '🥛', label: 'Members', description: 'Members trigger activation - Click to cycle to None' }
    }
  },*/

  activation: {
    values: {
      'activated': { icon: '🟢', label: 'Activated', description: 'Activated - Click to cycle to Inactive', default: true },
      'inactive': { icon: '⚫', label: 'Inactive', description: 'Inactive - Click to cycle to Inert' },
      'inert': { icon: '⌀', label: 'Inert', description: 'Inert - Click to cycle to Activated' }
    }
  },

  connectible: {
    values: {
      'receives': { icon: '⚈', label: 'Receives', description: 'Receives connections - Click to cycle to Gives', default: true },
      'gives': { icon: '⚌', label: 'Gives', description: 'Gives connections - Click to cycle to Refuses' },
      'refuses': { icon: '⚉', label: 'Refuses', description: 'Refuses connections - Click to cycle to Receives' }
    }
  },

  /*sizeMode: {
    values: {
      'auto': { icon: '🔄', label: 'Auto Size', description: 'Auto size based on members - Click to cycle to Manual', default: true },
      'manual': { icon: '✋', label: 'Manual Size', description: 'Manual size - Click to cycle to Auto' }
    },
    displayIf: { type: 'group' }
  },*/

  roilMode: {
    values: {
      'off': { 
        icon: '🌀', 
        label: 'Normal', 
        description: '', 
        default: true,
        cssStyle: 'opacity: 0.4; filter: saturate(0.2);'
      },
      'on': { 
        icon: '🌀', 
        label: 'Roil', 
        description: '' 
      }
    },
    displayIf: { type: 'group' }
  },

  roilAnimation: {
    values: {
      'play': { icon: '▶️', label: 'Play', description: '', default: true },
      'pause': { icon: '⏸️', label: 'Pause', description: '' },
    },
    displayIf: { type: 'group', roilMode: 'on' }
  },

  roilSpeed: {
    values: {
      '1': { icon: '1x', label: '1x', description: '', default: true },
      '1.5': { icon: '1.5x', label: '1.5x', description: '' },
      '2': { icon: '2x', label: '2x', description: '' },
      '3': { icon: '3x', label: '3x', description: '' },
      '5': { icon: '5x', label: '5x', description: '' },
      '10': { icon: '10x', label: '10x', description: '' },
    },
    displayIf: { type: 'group', roilMode: 'on' }
  },

  roilComposure: {
    values: {
      'retracted': { icon: '✊', label: 'Retracted', description: '', default: true },
      'splayed': { icon: '🖖', label: 'Splayed', description: '' },
    },
    displayIf: { type: 'group', roilMode: 'on' }
  },

  /*roilAngle: {
    values: {
      'tilt': { icon: '▽', label: 'Tilt', description: '', default: true },
      'side': { icon: '◻', label: 'Side', description: '' },
    },
    displayIf: { type: 'group', roilMode: 'on' }
  },

  awarenessLine: {
    values: {
      'hide': { icon: '⚹', label: 'Hide', description: '', default: true },
      'show': { icon: '-', label: 'Show', description: '' },
    },
      displayIf: { type: 'group', roilMode: 'on', roilAngle: 'side' }
  },*/

  showSeismograph: {
    values: {
      'no': { icon: '📈', label: 'no', description: '', default: true, cssStyle: 'opacity: 0.4; filter: saturate(0.2);'}, 
      'yes': { icon: '📈', label: 'yes', description: '' },
    },
      displayIf: { type: 'group', roilMode: 'on', }
  },

  /*secondaryColorDescent: {
    values: {
      'stayPrimary': { icon: '1', label: 'No Shift', description: '', default: true },
      'shiftToSecondary': { icon: '2', label: 'Shift', description: '' },
    },
      displayIf: { type: 'group', roilMode: 'on', }
  },

  checkInventory: {
    values: {
      'no': { icon: '👎', label: 'no', description: '', default: true },
      'yes': { icon: '👍', label: 'yes', description: '' },
    },
      displayIf: { type: 'group', roilMode: 'on', }
  },*/

  hideNameInRoil: {
    values: {
      'no': { icon: 'N', label: 'no', description: '', default: true },
      'yes': { icon: 'Y', label: 'yes', description: '' },
    },
    displayIf: { type: 'glow' }
  },

  buoyancy: {
    values: {
      'normal': { icon: '↕', label: 'Normal', description: '', default: true },
      'buoyant': { icon: '↑', label: 'Buoyant', description: '' },
      'antibuoyant': { icon: '↓', label: 'Antibuoyant', description: '' },
    },
    displayIf: { type: 'glow' }
  },

  /*satisfactionLocked: {
    values: {
      'no': { icon: '🔓', label: 'no', description: '', default: true },
      'yes': { icon: '🔒', label: 'yes', description: '' },
    },
      displayIf: { type: 'glow' }
  },*/

  roilMemberDisplay: {
    values: {
      'normal': { icon: '∴', label: 'Normal', description: '', default: true },
      'solo': { icon: '⋅', label: 'Solo', description: '' },
    },
    displayIf: { type: 'glow' }
  },
};

// Helper function to get the values object (handles both old and new format)
const getValuesObject = (config) => {
  // New format: has 'values' property
  if (config && config.values) {
    return config.values;
  }
  // Old format: config object itself contains the values
  return config;
};

// Utility functions that work with any property
export const getPropertyValues = (propertyName) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return [];
  
  const values = getValuesObject(config);
  return Object.keys(values);
};

export const getPropertyDefault = (propertyName) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return null;
  
  const values = getValuesObject(config);
  return Object.keys(values).find(key => values[key].default) || Object.keys(values)[0];
};

export const cycleProperty = (propertyName, currentValue) => {
  const values = getPropertyValues(propertyName);
  const currentIndex = values.indexOf(currentValue);
  return values[(currentIndex + 1) % values.length];
};

export const validatePropertyValue = (propertyName, value) => {
  return getPropertyValues(propertyName).includes(value);
};

export const getPropertyConfig = (propertyName) => {
  return CYCLE_PROPERTY_CONFIGS[propertyName] || {};
};

// Function to get the values configuration for a specific property value
export const getPropertyValueConfig = (propertyName, value) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return {};
  
  const values = getValuesObject(config);
  return values[value] || {};
};

// NEW: Function to get CSS style for a specific property value
export const getPropertyValueCssStyle = (propertyName, value) => {
  const valueConfig = getPropertyValueConfig(propertyName, value);
  return valueConfig.cssStyle || '';
};

// Function to check if a property should be visible based on circle properties
export const isPropertyVisibleForCircle = (propertyName, circle) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return false;
  
  // If no displayIf condition is defined, show for all circles
  if (!config.displayIf) {
    return true;
  }
  
  // If no circle provided, don't show
  if (!circle) {
    return false;
  }
  
  // Check each condition in displayIf
  for (const [property, expectedValue] of Object.entries(config.displayIf)) {
    const actualValue = circle[property];
    
    // If the circle doesn't have this property or it doesn't match, hide the control
    if (actualValue !== expectedValue) {
      return false;
    }
  }
  
  // All conditions passed
  return true;
};

// Function to check if a property should be visible for multiple circles
export const isPropertyVisibleForCircles = (propertyName, circles) => {
  if (!circles || circles.length === 0) {
    return false;
  }
  
  // For multiple selection, ALL circles must satisfy the displayIf conditions
  return circles.every(circle => isPropertyVisibleForCircle(propertyName, circle));
};

// Function to get all properties visible for given circles
export const getVisiblePropertiesForCircles = (circles) => {
  return Object.keys(CYCLE_PROPERTY_CONFIGS).filter(propertyName => 
    isPropertyVisibleForCircles(propertyName, circles)
  );
};

// DEPRECATED: Keep for backward compatibility but mark as deprecated
export const isPropertyVisibleForCircleTypes = (propertyName, circleTypes) => {
  console.warn(`isPropertyVisibleForCircleTypes is deprecated. Use isPropertyVisibleForCircles instead.`);
  
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return false;
  
  // If no circleTypes restriction is defined, show for all types
  if (!config.circleTypes || !Array.isArray(config.circleTypes)) {
    return true;
  }
  
  // If no circle types provided, don't show
  if (!circleTypes || circleTypes.length === 0) {
    return false;
  }
  
  // All provided circle types must be in the allowed list
  return circleTypes.every(type => config.circleTypes.includes(type));
};

// DEPRECATED: Keep for backward compatibility but mark as deprecated
export const getVisiblePropertiesForCircleTypes = (circleTypes) => {
  console.warn(`getVisiblePropertiesForCircleTypes is deprecated. Use getVisiblePropertiesForCircles instead.`);
  
  return Object.keys(CYCLE_PROPERTY_CONFIGS).filter(propertyName => 
    isPropertyVisibleForCircleTypes(propertyName, circleTypes)
  );
};
