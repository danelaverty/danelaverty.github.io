// renderers/EmojiCircleRenderer.js - Emoji circle type renderer
export const EmojiCircleRenderer = {
    /**
     * Render emoji circle type
     */
    render(element, circle) {
        if (!element) return;
        
        // Set transparent background for the element
        element.style.backgroundColor = 'transparent';
        element.style.border = 'none';
        
        // Create emoji container
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji-circle-container';
        emojiContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            pointer-events: none;
        `;
        
        // Set the emoji (default to 🧑🏼 if not set)
        const emoji = circle.emoji || '🧑🏼';
        emojiContainer.textContent = emoji;
        
        element.appendChild(emojiContainer);
    }
};
