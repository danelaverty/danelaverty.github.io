// EmojiComponent.js - Simple emoji display with absence indicator support
import { injectComponentStyles } from './styleUtils.js';

const emojiComponentStyles = `
.emoji-component {
    display: inline-block;
}

.emoji-display-wrapper {
    position: relative;
    display: inline-block;
}

.emoji-main {
    display: inline-block;
}

.emoji-absence-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.75);
    display: inline-block;
    pointer-events: none;
}
`;

injectComponentStyles('emoji-component', emojiComponentStyles);

export const EmojiComponent = {
    props: {
        emoji: {
            type: String,
            default: null
        },
        absence: {
            type: Boolean,
            default: false
        }
    },

    template: `
        <span class="emoji-component">
            <span v-if="emoji || absence" class="emoji-display-wrapper">
                <span v-if="emoji" class="emoji-main">{{ emoji }}</span>
                <span v-if="absence" class="emoji-absence-indicator">✖️</span>
            </span>
        </span>
    `
};
