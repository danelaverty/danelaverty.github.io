// CBCyclePropertyConfigs.js - Centralized configuration for all cycleable properties

export const CYCLE_PROPERTY_CONFIGS = {
  shinynessReceiveMode: {
    'or': { icon: '➕', label: 'Or Mode', description: 'Or Mode - Click to cycle to Explosive Or Mode', default: true },
    'additiveOr': { icon: '🎆', label: 'Additive Or Mode', description: 'Additive Or Mode - Click to cycle to And Mode' },
    'and': { icon: '✖️', label: 'And Mode', description: 'And Mode - Click to cycle to Explosive And Mode' },
    'explosiveAnd': { icon: '🎇', label: 'Explosive And Mode', description: 'Explosive And Mode - Click to cycle to Or Mode' }
  },
  
  activationTriggers: {
    'none': { icon: '🫗', label: 'None', description: 'No activation triggers - Click to cycle to Members', default: true },
    'members': { icon: '🥛', label: 'Members', description: 'Members trigger activation - Click to cycle to None' }
  },

  activation: {
    'activated': { icon: '🟢', label: 'Activated', description: 'Activated - Click to cycle to Inactive', default: true },
    'inactive': { icon: '⚫', label: 'Inactive', description: 'Inactive - Click to cycle to Inert' },
    'inert': { icon: '⌀', label: 'Inert', description: 'Inert - Click to cycle to Activated' }
  },

  connectible: {
    'receives': { icon: '⚈', label: 'Receives', description: 'Receives connections - Click to cycle to Gives', default: true },
    'gives': { icon: '⚌', label: 'Gives', description: 'Gives connections - Click to cycle to Refuses' },
    'refuses': { icon: '⚏', label: 'Refuses', description: 'Refuses connections - Click to cycle to Receives' }
  },

  directionality: {
    'none': { icon: '—', label: 'None', description: 'No direction - Click to cycle to Outward', default: true },
    'out': { icon: '→', label: 'Outward', description: 'Outward direction - Click to cycle to Inward' },
    'in': { icon: '←', label: 'Inward', description: 'Inward direction - Click to cycle to Both' },
    'both': { icon: '↔', label: 'Both', description: 'Both directions - Click to cycle to None' }
  }
};

// Utility functions that work with any property
export const getPropertyValues = (propertyName) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  return config ? Object.keys(config) : [];
};

export const getPropertyDefault = (propertyName) => {
  const config = CYCLE_PROPERTY_CONFIGS[propertyName];
  if (!config) return null;
  
  return Object.keys(config).find(key => config[key].default) || Object.keys(config)[0];
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
