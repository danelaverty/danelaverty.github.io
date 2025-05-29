(function(ChakraApp) {
  'use strict';
  
  ChakraApp.ColorUtils = {
    
    /**
     * Creates a darker shade of a color by reducing RGB values by 30%
     * @param {string} color - Color in hex, rgb, or rgba format
     * @returns {string} RGB color string of the darker shade
     */
    createDarkerShade: function(color) {
      var rgb = this.parseColor(color);
      
      if (!rgb) {
        return 'rgb(100, 100, 100)'; // Default darker gray
      }
      
      // Darken the color by reducing each component by 30%
      var r = Math.max(0, Math.floor(rgb.r * 0.7));
      var g = Math.max(0, Math.floor(rgb.g * 0.7));
      var b = Math.max(0, Math.floor(rgb.b * 0.7));
      
      return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    },
    
    /**
     * Creates a lighter shade of a color by increasing RGB values by 30%
     * @param {string} color - Color in hex, rgb, or rgba format
     * @returns {string} RGB color string of the lighter shade
     */
    createLighterShade: function(color) {
      var rgb = this.parseColor(color);
      
      if (!rgb) {
        return 'rgb(220, 220, 220)'; // Default lighter gray
      }
      
      // Lighten the color by increasing each component by 30% but not exceeding 255
      var r = Math.min(255, Math.floor(rgb.r * 1.3));
      var g = Math.min(255, Math.floor(rgb.g * 1.3));
      var b = Math.min(255, Math.floor(rgb.b * 1.3));
      
      return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    },
    
    /**
     * Parses a color string and returns RGB values
     * @param {string} color - Color in hex, rgb, or rgba format
     * @returns {Object|null} Object with r, g, b properties or null if parsing fails
     */
    parseColor: function(color) {
      var r, g, b;
      
      // Parse rgb/rgba format
      if (color.startsWith('rgb')) {
        var rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
          r = parseInt(rgbValues[0], 10);
          g = parseInt(rgbValues[1], 10);
          b = parseInt(rgbValues[2], 10);
        }
      } 
      // Parse hex format
      else if (color.startsWith('#')) {
        var hex = color.substring(1);
        // Handle both 3-digit and 6-digit hex
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        }
      }
      
      // Return null if parsing failed
      if (r === undefined || g === undefined || b === undefined) {
        return null;
      }
      
      return { r: r, g: g, b: b };
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
