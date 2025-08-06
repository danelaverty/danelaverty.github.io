// emojiService.js - Centralized emoji business logic with multi-emoji support
import { attributeInfo, storyCategories } from './emojiAttributes.js';

export class EmojiService {
    /**
     * Get emoji attribute by key
     */
    static getEmojiAttribute(key) {
        return attributeInfo[key] ? {
            key,
            ...attributeInfo[key]
        } : null;
    }

    /**
     * Get all emoji attributes as array
     */
    static getAllEmojiAttributes() {
        return Object.entries(attributeInfo).map(([key, value]) => ({
            key,
            ...value
        }));
    }

    /**
     * Organize emojis by story categories
     */
    static getEmojisByCategory() {
        const categorizedEmojis = [];
        
        Object.entries(storyCategories).forEach(([categoryKey, category]) => {
            const categoryEmojis = [];
            
            category.emojis.forEach(emojiKey => {
                if (attributeInfo[emojiKey]) {
                    categoryEmojis.push({
                        key: emojiKey,
                        ...attributeInfo[emojiKey]
                    });
                }
            });
            
            if (categoryEmojis.length > 0) {
                categorizedEmojis.push({
                    category: {
                        key: categoryKey,
                        name: category.name,
                        description: category.description
                    },
                    emojis: categoryEmojis
                });
            }
        });
        
        return categorizedEmojis;
    }

    /**
     * Extract emoji data from entity (works for both squares and attribute objects)
     * Now handles multi-emoji attributes
     */
    static extractEmojiData(entity) {
        if (!entity) return null;

        // If it's an attribute object (from characteristics bar)
        if (entity.emoji && entity.key) {
            return {
                emoji: entity.emoji, // Could be string or array
                emojiCss: entity.emojiCss || null,
                color: entity.color,
                displayName: entity.displayName,
                key: entity.key
            };
        }

        // If it's a square entity
        if (entity.emoji) {
            return {
                emoji: entity.emoji, // Could be string or array
                emojiCss: entity.emojiCss || null,
                color: entity.color,
                key: entity.emojiKey,
                displayName: entity.name
            };
        }

        return null;
    }

    /**
     * Create entity update data from emoji attribute
     * Now handles multi-emoji attributes
     */
    static createEntityUpdateFromAttribute(attribute) {
        const updateData = {
            emoji: attribute.emoji, // Could be string or array
            emojiKey: attribute.key,
            color: attribute.color
        };

        // Add emojiCss if it exists
        if (attribute.emojiCss) {
            updateData.emojiCss = attribute.emojiCss;
        } else {
            updateData.emojiCss = null;
        }

        return updateData;
    }

    /**
     * Check if an entity has emoji data
     * Now handles multi-emoji attributes
     */
    static hasEmoji(entity) {
        if (!entity || !entity.emoji) return false;
        
        // Handle array of emojis
        if (Array.isArray(entity.emoji)) {
            return entity.emoji.length > 0 && entity.emoji[0].trim() !== '';
        }
        
        // Handle single emoji
        return entity.emoji.trim() !== '';
    }

    /**
     * Get emoji display title for tooltips
     */
    static getDisplayTitle(emojiData, context = 'default') {
        if (!emojiData) return '';

        const baseName = emojiData.displayName || emojiData.name || 'Unknown';
        
        switch (context) {
            case 'recent':
                return `${baseName} (Recent)`;
            case 'picker':
                return baseName;
            default:
                return baseName;
        }
    }

    /**
     * Validate emoji attribute structure
     * Now handles multi-emoji attributes
     */
    static isValidEmojiAttribute(attribute) {
        if (!attribute || typeof attribute !== 'object') return false;
        
        // Check required fields
        if (!attribute.key || !attribute.color || !attribute.displayName) return false;
        
        // Check emoji field - can be string or array
        if (!attribute.emoji) return false;
        
        if (Array.isArray(attribute.emoji)) {
            // For arrays, ensure all elements are non-empty strings
            return attribute.emoji.length > 0 && 
                   attribute.emoji.every(emoji => typeof emoji === 'string' && emoji.trim() !== '');
        } else {
            // For single emoji, ensure it's a non-empty string
            return typeof attribute.emoji === 'string' && attribute.emoji.trim() !== '';
        }
    }

    /**
     * Get the primary emoji from an emoji attribute (first emoji if array)
     * Useful for fallback displays or simple representations
     */
    static getPrimaryEmoji(attribute) {
        if (!attribute || !attribute.emoji) return '❓';
        
        if (Array.isArray(attribute.emoji)) {
            return attribute.emoji[0] || '❓';
        }
        
        return attribute.emoji;
    }

    /**
     * Check if an emoji attribute has multiple emojis
     */
    static isMultiEmoji(attribute) {
        return attribute && Array.isArray(attribute.emoji) && attribute.emoji.length > 1;
    }
}
