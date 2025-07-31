// styleUtils.js - Utility for injecting component styles
const injectedStyles = new Set();

export function injectComponentStyles(componentId, styles) {
    // Avoid duplicate style injection
    if (injectedStyles.has(componentId)) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = `${componentId}-styles`;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    injectedStyles.add(componentId);
}

export function removeComponentStyles(componentId) {
    const styleElement = document.getElementById(`${componentId}-styles`);
    if (styleElement) {
        styleElement.remove();
        injectedStyles.delete(componentId);
    }
}
