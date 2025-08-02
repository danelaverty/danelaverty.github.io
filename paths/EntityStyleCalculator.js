// EntityStyleCalculator.js - Separated style calculation logic
export class EntityStyleCalculator {
    constructor(props) {
        this.props = props;
    }

    getCircleStyles() {
        if (this.props.entityType !== 'circle') return {};
        
        const colors = this.props.entity.colors || [this.props.entity.color] || ['#4CAF50'];
        
        if (colors.length === 1) {
            // Single color
            return {
                '--primary-color': colors[0]
            };
        } else {
            // Multiple colors - create conic gradient
            const colorStops = colors.map((color, index) => {
                const startAngle = (index / colors.length) * 360;
                const endAngle = ((index + 1) / colors.length) * 360;
                return `${color} ${startAngle}deg ${endAngle}deg`;
            }).join(', ');
            
            return {
                '--color-gradient': colorStops
            };
        }
    }

    getSquareStyles() {
        if (this.props.entityType !== 'square') return {};
        
        const styles = {};
        
        // If square has a color from emoji selection, use it
        if (this.props.entity.color) {
            styles['--square-color'] = this.props.entity.color;
            // Make border slightly darker
            const borderColor = this.adjustBrightness(this.props.entity.color, -20);
            styles['--square-border-color'] = borderColor;
        }
        
        // Handle emoji CSS filters (for special emojis like bulbOff)
        if (this.props.entity.emojiCss) {
            styles['--emoji-filter'] = this.props.entity.emojiCss;
        }
        
        return styles;
    }

    getShapeClasses(isSelected) {
        const classes = ['entity-shape', `${this.props.entityType}-shape`];
        
        if (isSelected) {
            classes.push('selected');
        }
        
        // Only add color styling for basic circle types
        if (this.props.entityType === 'circle' && (!this.props.entity.type || this.props.entity.type === 'basic')) {
            const colors = this.props.entity.colors || [this.props.entity.color] || ['#4CAF50'];
            if (colors.length > 1) {
                classes.push('multi-color');
            } else {
                classes.push('single-color');
            }
        }
        
        // For squares, add emoji class if it has an emoji
        if (this.props.entityType === 'square' && this.props.entity.emoji) {
            classes.push('has-emoji');
        }
        
        return classes;
    }

    // Helper function to adjust color brightness
    adjustBrightness(hex, percent) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse r, g, b values
        const num = parseInt(hex, 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}
