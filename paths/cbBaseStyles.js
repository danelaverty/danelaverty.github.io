export const baseCharacteristicsStyles = `
    .circle-characteristics-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        gap: 2px;
        z-index: 1002;
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
`;

export const displayStyles = `
    .color-display,
    .type-display,
    .energy-display,
    .emoji-display {
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

    .color-display:hover,
    .type-display:hover,
    .energy-display:hover,
    .emoji-display:hover {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .color-display.picker-open,
    .type-display.picker-open,
    .energy-display.picker-open,
    .emoji-display.picker-open {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: rgba(255, 255, 255, 0.4);
    }

    .energy-display {
        min-width: 24px;
    }

    .type-display {
        gap: 6px;
    }

    .emoji-display {
        gap: 6px;
    }
`;

export const colorStyles = `
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

    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 3px;
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
`;

export const typeStyles = `
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
`;

export const energyStyles = `
    .energy-indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.6);
        flex-shrink: 0;
    }

    .energy-count {
        color: white;
        font-size: 12px;
        font-weight: 500;
        margin-left: 2px;
    }

    .energy-item-icon {
        font-size: 20px;
        margin-right: 12px;
        min-width: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .energy-item-content {
        flex: 1;
    }

    .energy-item-name {
        color: white;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 2px;
    }

    .energy-item-description {
        color: #aaa;
        font-size: 12px;
        line-height: 1.3;
    }

    .energy-item-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-left: 8px;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
`;

export const emojiStyles = `
    .circle-emoji-display {
        font-size: 20px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
    }

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
`;
