// cbModalStyles.js
export const modalStyles = `
    .color-picker-modal,
    .type-picker-modal,
    .energy-picker-modal,
    .emoji-picker-modal,
    .circle-emoji-picker-modal,
    .secondary-name-picker-modal {
        position: fixed;
        background-color: #222;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
        z-index: 1002;
        max-width: 600px;
        max-height: 500px;
        overflow-y: auto;
        display: none;
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

    .characteristics-selection-indicator {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        color: white !important;
        font-size: 14px !important;
        font-weight: bold !important;
        text-shadow: 0 0 2px rgba(0,0,0,0.8) !important;
        display: none !important;
        z-index: 10 !important;
        pointer-events: none !important;
    }

    /* Circle Emoji Picker Specific */
    .circle-emoji-picker-modal {
        width: 600px;
        max-height: 500px;
    }

    .circle-emoji-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .circle-emoji-grid {
        max-height: 400px;
        overflow-y: auto;
    }

    .circle-emoji-category {
        margin-bottom: 20px;
    }

    .circle-emoji-category-name {
        color: white;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .circle-emoji-items {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        gap: 8px;
        padding: 5px 0;
    }

    .circle-emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        background-color: rgba(255, 255, 255, 0.05);
        border: 2px solid transparent;
    }

    .circle-emoji-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }

.secondary-name-picker-modal {
    position: fixed;
    background-color: #222;
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
    z-index: 1002;
    max-width: 300px;
    min-width: 280px;
    overflow: hidden;
    display: none;
}

.secondary-name-picker-header {
    color: white;
    font-size: 16px;
    font-weight: bold;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #222;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.secondary-name-input-container {
    padding: 16px;
}

.secondary-name-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    font-size: 14px;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    box-sizing: border-box;
}

.secondary-name-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

.secondary-name-input:focus {
    outline: none;
    border-color: rgba(76, 175, 80, 0.6);
    background-color: rgba(255, 255, 255, 0.15);
}

.secondary-name-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.secondary-name-cancel-button,
.secondary-name-submit-button {
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid;
}

.secondary-name-cancel-button {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
}

.secondary-name-cancel-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
}

.secondary-name-submit-button {
    background-color: rgba(76, 175, 80, 0.8);
    border-color: rgba(76, 175, 80, 1);
    color: white;
}

.secondary-name-submit-button:hover {
    background-color: rgba(76, 175, 80, 1);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}
`;
