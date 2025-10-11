export const EmojiCircleRenderer = {
    /**
     * Render emoji circle type
     */
    render(element, circle) {
        if (!element) return;
        
        // Set transparent background for the element
        element.style.backgroundColor = 'transparent';
        element.style.border = 'none';
        element.style.color = 'white';
        
        // Check if emoji container already exists
        let emojiContainer = element.querySelector('.the-emoji-itself');
        
        if (!emojiContainer) {
            // Create new emoji container if it doesn't exist
            emojiContainer = document.createElement('div');
            emojiContainer.className = 'the-emoji-itself';
            element.appendChild(emojiContainer);
        }
        
        const emoji = circle.emoji || '🧑🏼';
        emojiContainer.textContent = emoji;
    }
};
