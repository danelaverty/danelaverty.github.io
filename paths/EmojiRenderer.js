// EmojiRenderer.js - Unified emoji rendering component with multi-emoji support
import { computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

// Centralized emoji display styles - ALL emoji styling in one place
const emojiRendererStyles = `
    .emoji-renderer {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .emoji-renderer__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    }

    /* Multi-emoji container for superimposed emojis */
    .emoji-renderer__multi-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .emoji-renderer__multi-emoji {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Ensure the first emoji acts as the size reference */
    .emoji-renderer__multi-emoji:first-child {
        position: static;
        transform: none;
    }

    /* Unified emoji styling - all emojis get consistent text-shadow */
    .emoji-renderer__icon,
    .emoji-renderer__multi-emoji {
        text-shadow: 0px 0px 1px black, 0px 0px 1px black;
    }

    /* Context-specific sizing only */
    .emoji-renderer--square .emoji-renderer__icon,
    .emoji-renderer--square .emoji-renderer__multi-container {
        font-size: 30px;
        position: absolute;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .emoji-renderer--square .emoji-renderer__multi-emoji {
        font-size: 30px;
    }

    .emoji-renderer--recent .emoji-renderer__icon,
    .emoji-renderer--recent .emoji-renderer__multi-container {
        font-size: 18px;
    }

    .emoji-renderer--recent .emoji-renderer__multi-emoji {
        font-size: 18px;
    }

    .emoji-renderer--picker .emoji-renderer__icon,
    .emoji-renderer--picker .emoji-renderer__multi-container {
        font-size: 30px;
        height: 28px;
		position: relative;
			  bottom: 5px;
    }

    .emoji-renderer--picker .emoji-renderer__multi-emoji {
        font-size: 24px;
    }

    .emoji-renderer--cause .emoji-renderer__icon,
    .emoji-renderer--cause .emoji-renderer__multi-container {
        font-size: 16px;
    }

    .emoji-renderer--cause .emoji-renderer__multi-emoji {
        font-size: 16px;
    }

    .emoji-renderer--interactive:hover .emoji-renderer__icon,
    .emoji-renderer--interactive:hover .emoji-renderer__multi-container {
        transform: scale(1.1);
    }

    /* Special handling for square emojis with positioning */
    .emoji-renderer--square {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
    }

    /* Adjust square multi-container positioning */
    .emoji-renderer--square .emoji-renderer__multi-container {
        position: static;
        transform: none;
        width: 100%;
        height: 100%;
    }
`;

injectComponentStyles('emoji-renderer', emojiRendererStyles);

export const EmojiRenderer = {
    props: {
        // The emoji character or entity with emoji data
        emoji: {
            type: [String, Object],
            required: true
        },
        // Rendering context: 'recent', 'square', 'picker', 'cause'
        context: {
            type: String,
            default: 'square',
            validator: value => ['recent', 'square', 'picker', 'cause'].includes(value)
        },
        // Whether this emoji should respond to hover effects
        interactive: {
            type: Boolean,
            default: false
        },
        // Additional CSS classes
        cssClass: {
            type: String,
            default: ''
        }
    },
    setup(props) {
        // Extract emoji data whether it's a string or object
        const emojiData = computed(() => {
            if (typeof props.emoji === 'string') {
                return {
                    emoji: props.emoji,
                    emojiCss: null,
                    isMultiEmoji: false
                };
            } else if (props.emoji && typeof props.emoji === 'object') {
                const emojiValue = props.emoji.emoji || '❓';
                const isMultiEmoji = Array.isArray(emojiValue);
                
                return {
                    emoji: emojiValue,
                    emojiCss: props.emoji.emojiCss || null,
                    isMultiEmoji
                };
            }
            return {
                emoji: '❓',
                emojiCss: null,
                isMultiEmoji: false
            };
        });

        // Compute the CSS filter style for special emojis (like bulbOff)
        const emojiStyle = computed(() => {
            const style = {};
            if (emojiData.value.emojiCss) {
                style.filter = emojiData.value.emojiCss;
            }
            return style;
        });

        // Compute CSS classes
        const emojiClasses = computed(() => {
            const classes = [
                'emoji-renderer',
                `emoji-renderer--${props.context}`
            ];

            if (props.interactive) {
                classes.push('emoji-renderer--interactive');
            }

            if (props.cssClass) {
                classes.push(props.cssClass);
            }

            return classes;
        });

        return {
            emojiData,
            emojiStyle,
            emojiClasses
        };
    },
    template: `
        <div :class="emojiClasses">
            <!-- Single emoji rendering -->
            <div 
                v-if="!emojiData.isMultiEmoji"
                class="emoji-renderer__icon"
                :style="emojiStyle"
            >{{ emojiData.emoji }}</div>
            
            <!-- Multi-emoji rendering (superimposed) -->
            <div 
                v-else
                class="emoji-renderer__multi-container"
                :style="emojiStyle"
            >
                <div
                    v-for="(singleEmoji, index) in emojiData.emoji"
                    :key="index"
                    class="emoji-renderer__multi-emoji"
                >{{ singleEmoji }}</div>
            </div>
        </div>
    `
};
