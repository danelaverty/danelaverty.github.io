// globalPropertiesConfig.js - Central configuration for global properties
// This configuration drives the automatic creation of UI controls and state management

export const GLOBAL_PROPERTIES_CONFIG = {
    demoMode: {
        label: 'Demo',
        values: ['Demo', 'Edit'],
        defaultValue: 'Edit'
    },
    cascadeMode: {
        label: 'Cascade',
        values: ['Auto', 'Manual'],
        defaultValue: 'Manual'
    }
};

// Helper to get default values for all properties
export function getDefaultGlobalProperties() {
    const defaults = {};
    for (const [key, config] of Object.entries(GLOBAL_PROPERTIES_CONFIG)) {
        defaults[key] = config.defaultValue;
    }
    return defaults;
}

// Helper to validate a property value
export function isValidPropertyValue(propertyKey, value) {
    const config = GLOBAL_PROPERTIES_CONFIG[propertyKey];
    if (!config) return false;
    return config.values.includes(value);
}

// Helper to get the next value in the cycle for a property
export function getNextPropertyValue(propertyKey, currentValue) {
    const config = GLOBAL_PROPERTIES_CONFIG[propertyKey];
    if (!config) return currentValue;
    
    const currentIndex = config.values.indexOf(currentValue);
    const nextIndex = (currentIndex + 1) % config.values.length;
    return config.values[nextIndex];
}
