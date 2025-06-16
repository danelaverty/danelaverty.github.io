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
     * Creates a more saturated version of a color by increasing saturation by 30%
     * @param {string} color - Color in hex, rgb, or rgba format
     * @returns {string} RGB color string of the more saturated shade
     */
    createMoreSaturatedShade: function(color) {
      var rgb = this.parseColor(color);
      
      if (!rgb) {
        return 'rgb(180, 50, 50)'; // Default saturated red
      }
      
      // Convert RGB to HSL
      var hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      // Increase saturation by 30% but cap at 100%
      hsl.s = Math.min(1, hsl.s * 1.3);
      
      // Convert back to RGB
      var newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
      
      return 'rgb(' + newRgb.r + ', ' + newRgb.g + ', ' + newRgb.b + ')';
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
    },
    
    /**
     * Converts RGB values to HSL
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {Object} Object with h, s, l properties
     */
    rgbToHsl: function(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return { h: h, s: s, l: l };
    },
    
    /**
     * Converts HSL values to RGB
     * @param {number} h - Hue (0-1)
     * @param {number} s - Saturation (0-1)
     * @param {number} l - Lightness (0-1)
     * @returns {Object} Object with r, g, b properties
     */
    hslToRgb: function(h, s, l) {
      var r, g, b;
      
      if (s === 0) {
        r = g = b = l; // achromatic
      } else {
        var hue2rgb = function(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }
  };
  
})(window.ChakraApp = window.ChakraApp || {});
