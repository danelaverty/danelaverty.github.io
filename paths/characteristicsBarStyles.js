// characteristicsBarStyles.js (Enhanced with Recent Emojis styles)
export const componentStyles = `
    .circle-characteristics-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50px;
        background-color: #1a1a1a;
        border-bottom: 2px solid #333;
        display: flex;
        align-items: center;
        padding: 0 20px;
        gap: 15px;
        z-index: 1001;
        transition: transform 0.3s ease;
    }

    .circle-characteristics-bar.hidden {
        transform: translateY(-100%);
    }

    .characteristic-control {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .characteristic-label {
        color: white;
        font-size: 14px;
        font-weight: 500;
        min-width: 40px;
    }

    .color-display {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background-color: rgba(60, 60, 60, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 32px;
    }

    .color-display:hover {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .color-display.picker-open {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.4);
    }

    /* Type display styles */
    .type-display {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background-color: rgba(60, 60, 60, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 32px;
    }

    .type-display:hover {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .type-display.picker-open {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.4);
    }

    /* Emoji display styles */
    .emoji-display {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background-color: rgba(60, 60, 60, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 32px;
    }

    .emoji-display:hover {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .emoji-display.picker-open {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.4);
    }

    .emoji-icon {
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
    }

    .emoji-name {
        color: white;
        font-size: 12px;
        font-weight: 500;
    }

    /* Recent Emojis Palette Styles */
    .recent-emojis-container {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .recent-emojis-separator {
        width: 2px;
        height: 32px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 1px;
    }

    .recent-emojis-palette {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
        background-color: rgba(40, 40, 40, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        max-width: 320px;
        overflow-x: auto;
    }

    .recent-emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
    }

    .recent-emoji-item:hover {
        transform: scale(1.1);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .recent-emoji-icon {
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 0px 0px 1px black;
    }

    .clear-recent-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        flex-shrink: 0;
        margin-left: 4px;
    }

    .clear-recent-button:hover {
        background-color: rgba(255, 100, 100, 0.3);
        border-color: rgba(255, 100, 100, 0.5);
        transform: scale(1.05);
    }

    .clear-recent-icon {
        color: rgba(255, 255, 255, 0.7);
        font-size: 16px;
        font-weight: bold;
        line-height: 1;
    }

    .clear-recent-button:hover .clear-recent-icon {
        color: white;
    }

    .type-icon {
        font-size: 16px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
    }

    .type-name {
        color: white;
        font-size: 12px;
        font-weight: 500;
    }

    .color-swatch-mini {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        flex-shrink: 0;
    }

    .color-count {
        color: white;
        font-size: 12px;
    }

    .color-picker-modal, .type-picker-modal, .emoji-picker-modal {
        position: fixed;
        background-color: #222;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
        z-index: 1002;
        max-width: 600px;
        max-height: 500px;
        overflow-y: auto;
        display: none;
    }

    /* Emoji picker specific styles */
    .emoji-picker-modal {
        max-width: 700px;
        max-height: 600px;
    }

    .emoji-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .emoji-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
        max-height: 400px;
        overflow-y: auto;
    }

    .emoji-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        min-height: 60px;
        justify-content: center;
    }

    .emoji-item:hover {
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    .emoji-item-icon {
        font-size: 24px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 28px;
    }

    .emoji-item-name {
        color: white;
        font-size: 10px;
        text-align: center;
        line-height: 1.2;
        word-wrap: break-word;
        max-width: 100%;
    }

    .emoji-instructions {
        color: #aaa;
        font-size: 11px;
        margin-bottom: 15px;
        font-style: italic;
    }

    /* Type picker modal styles */
    .type-picker-modal {
        max-width: 400px;
        max-height: 400px;
    }

    .type-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .type-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .type-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 6px;
        background-color: rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }

    .type-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .type-item.selected {
        background-color: rgba(76, 175, 80, 0.2);
        border-color: rgba(76, 175, 80, 0.6);
    }

    .type-item-icon {
        font-size: 24px;
        color: white;
        margin-right: 12px;
        min-width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .type-item-content {
        flex: 1;
    }

    .type-item-name {
        color: white;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 2px;
    }

    .type-item-description {
        color: #aaa;
        font-size: 12px;
        line-height: 1.3;
    }

    .color-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .picker-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .picker-close:hover {
        color: #ff6b6b;
    }

    .color-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .color-row {
        display: flex;
        align-items: center;
        padding: 4px;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.05);
        gap: 8px;
    }

    .color-row:last-child {
        border-bottom: none;
    }

    .color-row:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .color-swatches {
        display: flex;
        gap: 2px;
    }

    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 3px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }

    .color-swatch:hover {
        border-color: rgba(255, 255, 255, 0.6);
        transform: scale(1.1);
    }

    .color-swatch.selected {
        border-color: rgba(255, 255, 255, 0.8);
        transform: scale(1.1);
    }

    .color-name {
        flex: 1;
        color: white;
        font-size: 12px;
        font-weight: 500;
    }

    .selection-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 14px;
        font-weight: bold;
        text-shadow: 0 0 2px rgba(0,0,0,0.8);
        display: none;
    }

    .multi-color-instructions {
        color: #aaa;
        font-size: 11px;
        margin-bottom: 10px;
        font-style: italic;
    }
`;
