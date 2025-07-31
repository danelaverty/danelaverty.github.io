class StyleManager {
    static createStyleSheet(styles, id = null) {
        const styleSheet = document.createElement('style');
        if (id) {
            styleSheet.id = id;
        }
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        return styleSheet;
    }

    static applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    static addGlobalStyles(css, id) {
        // Check if styles already exist
        if (document.getElementById(id)) {
            return;
        }
        this.createStyleSheet(css, id);
    }

    static removeStyles(id) {
        const styleSheet = document.getElementById(id);
        if (styleSheet) {
            styleSheet.remove();
        }
    }
}
