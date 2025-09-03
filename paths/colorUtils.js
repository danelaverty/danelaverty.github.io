// colorUtils.js - Unified color manipulation utilities
import { colorFamilies } from './colorFamilies.js';

/**
 * Parse a color string into RGB components
 * Supports: #RGB, #RRGGBB, rgb(r,g,b), rgba(r,g,b,a), named colors
 */
function parseColor(color) {
    if (!color || typeof color !== 'string') {
        return { r: 0, g: 0, b: 0, a: 1 };
    }

    color = color.trim().toLowerCase();

    // Handle named colors
    const namedColors = {
        'red': '#ff0000', 'green': '#008000', 'blue': '#0000ff',
        'white': '#ffffff', 'black': '#000000', 'yellow': '#ffff00',
        'cyan': '#00ffff', 'magenta': '#ff00ff', 'silver': '#c0c0c0',
        'gray': '#808080', 'maroon': '#800000', 'olive': '#808000',
        'lime': '#00ff00', 'aqua': '#00ffff', 'teal': '#008080',
        'navy': '#000080', 'fuchsia': '#ff00ff', 'purple': '#800080'
        // Add more as needed
    };

    if (namedColors[color]) {
        color = namedColors[color];
    }

    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        
        if (hex.length === 3) {
            // #RGB -> #RRGGBB
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return { r, g, b, a: 1 };
        } else if (hex.length === 6) {
            // #RRGGBB
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return { r, g, b, a: 1 };
        } else if (hex.length === 8) {
            // #RRGGBBAA
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const a = parseInt(hex.substring(6, 8), 16) / 255;
            return { r, g, b, a };
        }
    }

    // Handle rgb() and rgba()
    const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
        return { r, g, b, a };
    }

    // Handle hsl() and hsla() - basic support
    const hslMatch = color.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)/);
    if (hslMatch) {
        const h = parseInt(hslMatch[1], 10) / 360;
        const s = parseInt(hslMatch[2], 10) / 100;
        const l = parseInt(hslMatch[3], 10) / 100;
        const a = hslMatch[4] ? parseFloat(hslMatch[4]) : 1;
        
        const { r, g, b } = hslToRgb(h, s, l);
        return { r, g, b, a };
    }

    // Fallback to black
    return { r: 0, g: 0, b: 0, a: 1 };
}

function hslStringToHex(hslString) {
    if (!hslString || typeof hslString !== 'string') {
        return hslString;
    }

    const trimmed = hslString.trim().toLowerCase();
    
    // Check if it's an HSL string format
    const hslMatch = trimmed.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)/);
    
    if (!hslMatch) {
        // Not an HSL string, return as-is
        return hslString;
    }
    
    // Parse HSL values
    const h = parseInt(hslMatch[1], 10) / 360;
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;
    
    // Convert to RGB using existing function
    const { r, g, b } = hslToRgb(h, s, l);
    
    // Convert to hex using existing function
    return rgbToHex(r, g, b);
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
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

/**
 * Convert RGB components to hex string
 */
function rgbToHex(r, g, b, includeHash = true) {
    const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
    
    const rHex = clamp(r).toString(16).padStart(2, '0');
    const gHex = clamp(g).toString(16).padStart(2, '0');
    const bHex = clamp(b).toString(16).padStart(2, '0');
    
    return (includeHash ? '#' : '') + rHex + gHex + bHex;
}

/**
 * Adjust brightness of a color by a percentage
 * @param {string} color - Color in any supported format
 * @param {number} percent - Percentage to adjust (-100 to 100)
 * @returns {string} Hex color string
 */
function adjustBrightness(color, percent) {
    const { r, g, b } = parseColor(color);
    
    // Convert percentage to multiplier
    const factor = 1 + (percent / 100);
    
    // Apply factor to each component
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);
    
    return rgbToHex(newR, newG, newB);
}

/**
 * Lighten a color by a percentage
 * @param {string} color - Color in any supported format
 * @param {number} percent - Percentage to lighten (0 to 100)
 * @returns {string} Hex color string
 */
function lighten(color, percent) {
    const { r, g, b } = parseColor(color);
    
    // Lighten by moving towards white
    const amount = percent / 100;
    const newR = r + (255 - r) * amount;
    const newG = g + (255 - g) * amount;
    const newB = b + (255 - b) * amount;
    
    return rgbToHex(newR, newG, newB);
}

/**
 * Darken a color by a percentage
 * @param {string} color - Color in any supported format
 * @param {number} percent - Percentage to darken (0 to 100)
 * @returns {string} Hex color string
 */
function darken(color, percent) {
    const { r, g, b } = parseColor(color);
    
    // Darken by moving towards black
    const amount = 1 - (percent / 100);
    const newR = r * amount;
    const newG = g * amount;
    const newB = b * amount;
    
    return rgbToHex(newR, newG, newB);
}

/**
 * Get the relative luminance of a color (for contrast calculations)
 */
function getLuminance(color) {
    const { r, g, b } = parseColor(color);
    
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determine if a color is considered "light" or "dark"
 */
function isLightColor(color) {
    return getLuminance(color) > 0.5;
}

/**
 * Get a contrasting color (black or white) for text on the given background
 */
function getContrastingTextColor(backgroundColor) {
    return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Saturate or desaturate a color
 * @param {string} color - Color in any supported format
 * @param {number} percent - Percentage to adjust saturation (-100 to 100)
 * @returns {string} Hex color string
 */
function adjustSaturation(color, percent) {
    const { r, g, b } = parseColor(color);
    
    // Convert RGB to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: h = (bNorm - rNorm) / d + 2; break;
            case bNorm: h = (rNorm - gNorm) / d + 4; break;
        }
        h /= 6;
    }
    
    // Adjust saturation
    s = Math.max(0, Math.min(1, s * (1 + percent / 100)));
    
    // Convert back to RGB
    const { r: newR, g: newG, b: newB } = hslToRgb(h, s, l);
    return rgbToHex(newR, newG, newB);
}

/**
 * Generate a color palette by rotating hue
 * @param {string} baseColor - Base color
 * @param {number} count - Number of colors to generate
 * @returns {string[]} Array of hex color strings
 */
function generatePalette(baseColor, count = 5) {
    const { r, g, b } = parseColor(baseColor);
    const colors = [];
    
    // Convert to HSL first
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: h = (bNorm - rNorm) / d + 2; break;
            case bNorm: h = (rNorm - gNorm) / d + 4; break;
        }
        h /= 6;
    }
    
    // Generate colors by rotating hue
    for (let i = 0; i < count; i++) {
        const newH = (h + (i / count)) % 1;
        const { r: newR, g: newG, b: newB } = hslToRgb(newH, s, l);
        colors.push(rgbToHex(newR, newG, newB));
    }
    
    return colors;
}

/**
 * Find color info from the color families data
 * This function searches through the colorFamilies array to find matching color info
 * @param {string} colorValue - Color value to search for
 * @returns {Object|null} Color info object or null if not found
 */
function findColorInfo(colorValue) {
    if (!colorValue) return null;
    
    for (const family of colorFamilies) {
        if (family.light && family.light.color.toLowerCase() === colorValue.toLowerCase()) {
            return family.light;
        }
        if (family.solid && family.solid.color.toLowerCase() === colorValue.toLowerCase()) {
            return family.solid;
        }
        if (family.dark && family.dark.color.toLowerCase() === colorValue.toLowerCase()) {
            return family.dark;
        }
    }
    return null;
}

/**
 * Vue composable for color utilities
 * Provides a convenient way to use color utilities in Vue components
 */
export const useColorUtils = () => {
    return {
        // Color family lookup
        findColorInfo,
        
        // Color parsing and conversion
        parseColor,
        rgbToHex,
        hslToRgb,
        hslStringToHex,
        
        // Color manipulation
        adjustBrightness,
        lighten,
        darken,
        adjustSaturation,
        
        // Color analysis
        getLuminance,
        getContrastRatio,
        isLightColor,
        getContrastingTextColor,
        
        // Color generation
        generatePalette
    };
};

// Export individual functions for direct use
export {
    findColorInfo,
    parseColor,
    adjustBrightness,
    lighten,
    darken,
    getLuminance,
    getContrastRatio,
    isLightColor,
    getContrastingTextColor,
    adjustSaturation,
    generatePalette,
    rgbToHex,
    hslToRgb,
    hslStringToHex
};
