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
