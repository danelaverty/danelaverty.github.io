// IndicatorEmojiPicker.js - Modal for selecting indicator emojis
import { ref, onMounted, onUnmounted } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

const componentStyles = `
    .indicator-emoji-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .indicator-emoji-modal-content {
        background-color: #2a2a2a;
        border-radius: 8px;
        padding: 20px;
        min-width: 300px;
        border: 1px solid #555;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .indicator-emoji-modal h3 {
        color: white;
        margin: 0 0 15px 0;
        text-align: center;
        font-size: 16px;
    }

    .indicator-emoji-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 15px;
    }

    .indicator-emoji-option {
        background-color: #3a3a3a;
        border: 2px solid #555;
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        color: white;
        font-size: 12px;
    }

    .indicator-emoji-option:hover {
        background-color: #4a4a4a;
        border-color: #777;
        transform: translateY(-1px);
    }

    .indicator-emoji-option.selected {
        border-color: #ff6b6b;
        background-color: #4a3a3a;
    }

    .indicator-emoji-option .emoji {
        font-size: 24px;
        margin-bottom: 2px;
    }

    .indicator-emoji-remove {
        background-color: #444;
        border: 2px solid #666;
        border-radius: 6px;
        padding: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;
        text-align: center;
        margin-bottom: 15px;
        font-size: 14px;
    }

    .indicator-emoji-remove:hover {
        background-color: #555;
        border-color: #888;
    }

    .indicator-emoji-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .indicator-emoji-button {
        background-color: #555;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 14px;
    }

    .indicator-emoji-button:hover {
        background-color: #666;
    }
`;

injectComponentStyles('indicator-emoji-picker', componentStyles);

export const IndicatorEmojiPicker = {
    props: {
        isVisible: Boolean,
        currentIndicator: String // The currently selected indicator emoji (if any)
    },
    emits: ['close', 'select'],
    setup(props, { emit }) {
        // Available indicator emojis with their configurations
        const indicatorEmojis = [
            { emoji: '❗', name: 'Alert', color: '#ffeb3b' }, // yellow
            { emoji: '✔️', name: 'Done', color: '#4caf50' }, // green
            { emoji: '⭐', name: 'Star', color: '#4caf50' }, // green
            { emoji: '😖', name: 'Issue', color: '#f44336' }, // red
            { emoji: '▶️', name: 'Next', color: '#ffffff' }, // white
            { emoji: '🏁', name: 'Finish', color: '#ffffff' } // white
        ];

        // Handle emoji selection - apply immediately
        const selectEmoji = (emoji) => {
            emit('select', emoji);
        };

        // Handle remove indicator - apply immediately
        const removeIndicator = () => {
            emit('select', null);
        };

        // Handle cancel
        const handleCancel = () => {
            emit('close');
        };

        // Handle escape key
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };

        // Handle click outside modal
        const handleModalClick = (e) => {
            if (e.target.classList.contains('indicator-emoji-modal')) {
                handleCancel();
            }
        };

        // Set up event listeners
        onMounted(() => {
            document.addEventListener('keydown', handleKeydown);
        });

        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeydown);
        });

        return {
            indicatorEmojis,
            selectEmoji,
            removeIndicator,
            handleCancel,
            handleModalClick
        };
    },
    template: `
        <div 
            v-if="isVisible"
            class="indicator-emoji-modal"
            @click="handleModalClick"
        >
            <div class="indicator-emoji-modal-content">
                <h3>Select Indicator Emoji</h3>
                
                <!-- Remove option -->
                <div 
                    class="indicator-emoji-remove"
                    @click="removeIndicator"
                >
                    Remove Indicator
                </div>

                <!-- Emoji grid -->
                <div class="indicator-emoji-grid">
                    <div 
                        v-for="option in indicatorEmojis"
                        :key="option.emoji"
                        class="indicator-emoji-option"
                        :class="{ selected: currentIndicator === option.emoji }"
                        @click="selectEmoji(option.emoji)"
                    >
                        <div class="emoji">{{ option.emoji }}</div>
                        <div>{{ option.name }}</div>
                    </div>
                </div>

                <!-- Cancel button only -->
                <div class="indicator-emoji-buttons">
                    <button 
                        class="indicator-emoji-button"
                        @click="handleCancel"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `
};
