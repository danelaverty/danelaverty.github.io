// cbPickerStyles.js
export const pickerSpecificStyles = `
    /* Color Picker */
    .color-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
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

    .color-row:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .color-swatches {
        display: flex;
        gap: 2px;
    }

    .color-name {
        flex: 1;
        color: white;
        font-size: 12px;
        font-weight: 500;
    }

    .multi-color-instructions {
        color: #aaa;
        font-size: 11px;
        margin-bottom: 10px;
        font-style: italic;
    }

    /* Type Picker */
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
        padding: 6px;
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

    /* Energy Picker */
    .energy-picker-modal {
        max-width: 400px;
        max-height: 350px;
    }

    .energy-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .energy-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .energy-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 6px;
        background-color: rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }

    .energy-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .energy-item.selected {
        background-color: rgba(76, 175, 80, 0.2);
        border-color: rgba(76, 175, 80, 0.6);
    }

    .energy-instructions {
        color: #aaa;
        font-size: 11px;
        margin-bottom: 15px;
        font-style: italic;
        line-height: 1.4;
    }

    /* Emoji Picker */
    .emoji-picker-modal {
        position: fixed;
        background-color: #222;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
        z-index: 1002;
        max-height: 670px;
        overflow-y: auto;
        display: none;
    }

    .emoji-picker-header {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 10px 0 10px;
        position: sticky;
        top: 0;
        background-color: #222;
        z-index: 1;
    }

    .emoji-grid {
        padding: 0 10px 10px 10px;
        width: 540px;
    }

    .emoji-category-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 8px;
    }

    .emoji-category-name-left {
        width: 100px;
        padding: 4px 8px;
        font-size: 17px;
        font-weight: normal;
        color: #fff;
        text-align: left;
        cursor: pointer;
        flex-shrink: 0;
        border-radius: 4px;
        transition: all 0.2s ease;
        position: relative;
        top: 15px;
    }

    .emoji-category-name-left:hover {
        background-color: rgba(255, 255, 255, 0.15);
        transform: scale(1.02);
    }

    .emoji-category-items {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        flex: 1;
    }

    .emoji-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        height: 58px;
        width: 58px;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
    }

    .emoji-item:hover {
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    .emoji-item-name {
        color: white;
        text-shadow: 1px 1px 0px black;
        font-size: 10px;
        text-align: center;
        line-height: 1.2;
        word-wrap: break-word;
        max-width: 100%;
        position: absolute;
        bottom: 0px;
    }

    .emoji-instructions {
        color: #aaa;
        font-size: 11px;
        margin-bottom: 15px;
        font-style: italic;
        line-height: 1.4;
        padding: 0 10px;
    }

    .emoji-instructions strong {
        color: #4CAF50;
        font-weight: 600;
    }

    .emoji-category-clickable {
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 4px 0;
        border-radius: 6px;
    }

    .emoji-category-clickable:hover {
        background-color: rgba(255, 255, 255, 0.05);
        transform: scale(1.02);
    }

    .emoji-category-clickable:hover .emoji-category-name {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        color: #fff;
        text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
    }

    .emoji-category-clickable:hover .emoji-category-line {
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
    }

    .emoji-category-clickable:active {
        transform: scale(0.98);
    }

    .emoji-category-clickable:active .emoji-category-name {
        background: rgba(76, 175, 80, 0.3);
        border-color: rgba(76, 175, 80, 0.6);
        color: #4CAF50;
    }
`;
