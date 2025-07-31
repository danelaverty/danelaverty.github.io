// entityConfig.js - Configuration for different entity types
export const entityConfigs = {
    circle: {
        shape: 'circle',
        containerClass: 'circle-container',
        shapeClass: 'circle-shape',
        nameClass: 'circle-name',
        color: '#4CAF50',
        borderColor: '#45a049',
        container: 'left',
        position: 'left',
        buttonIcon: '+',
        buttonShape: 'circle',
        documentIcon: '📁',
        documentLabel: 'Circle Document',
        buttonPosition: 'left: 20px',
        dropdownPosition: 'left: 80px',
        addButtonClass: 'add-button'
    },
    square: {
        shape: 'square',
        containerClass: 'square-container',
        shapeClass: 'square-shape',
        nameClass: 'square-name',
        color: '#FF6B6B',
        borderColor: '#FF5252',
        container: 'right',
        position: 'right',
        buttonIcon: '■',
        buttonShape: 'square',
        documentIcon: '📄',
        documentLabel: 'Square Document',
        buttonPosition: 'right: 20px',
        dropdownPosition: 'right: 80px',
        addButtonClass: 'add-square-button'
    }
};

export function getEntityConfig(entityType) {
    return entityConfigs[entityType];
}
