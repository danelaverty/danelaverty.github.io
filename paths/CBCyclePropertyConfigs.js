// CBCyclePropertyConfigs.js - Centralized configuration for all cycleable properties

export const CYCLE_PROPERTY_CONFIGS = {
  shinynessReceiveMode: {
    values: {
      'or': { icon: '➕', label: 'Or Mode', description: 'Or Mode', default: true },
      'and': { icon: '✖️', label: 'And Mode', description: 'And Mode' },
    }
  },
  
  activationTriggers: {
    values: {
      'none': { icon: '🫗', label: 'None', description: 'No activation triggers - Click to cycle to Members', default: true },
      'members': { icon: '🥛', label: 'Members', description: 'Members trigger activation - Click to cycle to None' }
    }
  },

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
      'refuses': { icon: '⚏', label: 'Refuses', description: 'Refuses connections - Click to cycle to Receives' }
    }
  },

  sizeMode: {
    values: {
      'auto': { icon: '🔄', label: 'Auto Size', description: 'Auto size based on members - Click to cycle to Manual', default: true },
      'manual': { icon: '✋', label: 'Manual Size', description: 'Manual size - Click to cycle to Auto' }
    },
    circleTypes: ['group']
  },

  roilMode: {
    values: {
      'off': { icon: '🌷', label: 'Normal', description: '', default: true },
      'on': { icon: '🌀', label: 'Roil', description: '' }
    },
    circleTypes: ['group']
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

// New function to get the values configuration for a specific property value
export const getPropertyValueConfig = (propertyName, value) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return {};
  
  const values = getValuesObject(config);
  return values[value] || {};
};

// New function to check if a property should be visible for given circle types
export const isPropertyVisibleForCircleTypes = (propertyName, circleTypes) => {
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

// New function to get all properties visible for given circle types
export const getVisiblePropertiesForCircleTypes = (circleTypes) => {
  return Object.keys(CYCLE_PROPERTY_CONFIGS).filter(propertyName => 
    isPropertyVisibleForCircleTypes(propertyName, circleTypes)
  );
};
