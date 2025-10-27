// CBCyclePropertyControl.js - Generic control for cycleable properties

import { getPropertyConfig, getPropertyValueConfig, validatePropertyValue } from './CBCyclePropertyConfigs.js';

export const CBCyclePropertyControl = {
  props: {
    propertyName: {
      type: String,
      required: true
    },
    propertyValue: {
      type: String,
      required: true,
      validator(value) {
        return typeof value === 'string';
      }
    }
  },
  
  emits: ['cycle'],
  
  computed: {
    config() {
      return getPropertyConfig(this.propertyName);
    },
    
    valueConfig() {
      const config = getPropertyConfig(this.propertyName);
      if (!config) return {};
      
      // Handle both old and new format
      const values = config.values || config;
      return values[this.propertyValue] || {};
    },
    
    propertyIcon() {
      return this.valueConfig.icon || '?';
    },
    
    propertyLabel() {
      return this.valueConfig.label || this.propertyValue;
    },
    
    propertyTitle() {
      return this.valueConfig.description || `Click to cycle ${this.propertyName}`;
    },
    
    cssClassPrefix() {
      // Convert camelCase to kebab-case for CSS classes
      return this.propertyName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
  },
  
  created() {
    // Validate the property value at creation time
    if (!validatePropertyValue(this.propertyName, this.propertyValue)) {
      console.warn(`Invalid property value "${this.propertyValue}" for property "${this.propertyName}"`);
    }
  },
  
  template: `
    <div class="characteristic-control" @click="$emit('cycle')" :title="propertyTitle">
        <div :class="[cssClassPrefix + '-display', propertyValue]">
            <div :class="cssClassPrefix + '-icon'">{{ propertyIcon }}</div>
        </div>
    </div>
  `
};
