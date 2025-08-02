// entityStore.js - Unified entity management for circles and squares (Updated for emoji support)
import { reactive } from './vue-composition-api.js';

let entityStoreInstance = null;

function createEntityStore() {
    const data = reactive({
        circles: new Map(),
        squares: new Map(),
        nextCircleId: 1,
        nextSquareId: 1
    });

    // Position utilities
    const generateRandomPosition = (containerWidth, containerHeight, padding = 50) => {
        const safeWidth = Math.max(100, containerWidth - 200);
        const safeHeight = Math.max(100, containerHeight - 200);
        return {
            x: Math.random() * safeWidth + padding,
            y: Math.random() * safeHeight + padding
        };
    };

    const calculateSquareContainerDimensions = (viewerWidths) => {
        const totalViewerWidth = viewerWidths.reduce((sum, width) => sum + width, 0);
        return {
            width: window.innerWidth - totalViewerWidth,
            height: window.innerHeight
        };
    };

    // Generic entity operations
    const createEntity = (entityType, documentId, containerWidth, containerHeight, viewerWidths = []) => {
        const id = `${entityType}_${entityType === 'circle' ? data.nextCircleId++ : data.nextSquareId++}`;
        
        let position;
        if (entityType === 'square') {
            const dimensions = calculateSquareContainerDimensions(viewerWidths);
            position = generateRandomPosition(dimensions.width, dimensions.height, 100);
        } else {
            const actualHeight = containerHeight || (window.innerHeight - 120);
            position = generateRandomPosition(containerWidth - 40, actualHeight);
        }

        const entity = {
            id,
            x: position.x,
            y: position.y,
            name: '???',
            documentId
        };

        // Add circle-specific properties
        if (entityType === 'circle') {
            entity.color = '#4CAF50'; // Default green color
            entity.colors = ['#4CAF50']; // Support for multiple colors
            entity.crystal = 'Green'; // Default crystal name
            entity.type = 'basic'; // Default circle type
        }

        // Add square-specific properties (NEW: emoji support)
        if (entityType === 'square') {
            entity.emoji = null; // Default: no emoji
            entity.emojiKey = null; // Key from attributeInfo
            entity.color = '#FF6B6B'; // Default color (can be overridden by emoji)
        }

        const store = entityType === 'circle' ? data.circles : data.squares;
        store.set(id, entity);
        return entity;
    };

    const getEntity = (entityType, id) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        return store.get(id);
    };

    const getEntitiesForDocument = (entityType, documentId) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        return Array.from(store.values()).filter(entity => entity.documentId === documentId);
    };

    const updateEntity = (entityType, id, updates) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        const entity = store.get(id);
        if (entity) {
            Object.assign(entity, updates);
            
            // For circles, ensure color consistency
            if (entityType === 'circle') {
                // If colors array is updated but color is not, update primary color
                if (updates.colors && !updates.color && updates.colors.length > 0) {
                    entity.color = updates.colors[0];
                }
                // If color is updated but colors array is not, update colors array
                if (updates.color && !updates.colors) {
                    entity.colors = [updates.color];
                }
                // Ensure colors array always exists
                if (!entity.colors) {
                    entity.colors = entity.color ? [entity.color] : ['#4CAF50'];
                }
            }
            
            return entity;
        }
        return null;
    };

    const deleteEntity = (entityType, id) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        return store.delete(id);
    };

    // Specific entity type methods (for backward compatibility)
    const createCircle = (documentId, containerWidth, containerHeight) => {
        return createEntity('circle', documentId, containerWidth, containerHeight);
    };

    const createSquare = (documentId, viewerWidths) => {
        return createEntity('square', documentId, null, null, viewerWidths);
    };

    const getCircle = (id) => getEntity('circle', id);
    const getSquare = (id) => getEntity('square', id);
    const getCirclesForDocument = (documentId) => getEntitiesForDocument('circle', documentId);
    const getSquaresForDocument = (documentId) => getEntitiesForDocument('square', documentId);
    const updateCircle = (id, updates) => updateEntity('circle', id, updates);
    const updateSquare = (id, updates) => updateEntity('square', id, updates);
    const deleteCircle = (id) => deleteEntity('circle', id);
    const deleteSquare = (id) => deleteEntity('square', id);

    // Bulk operations
    const moveEntities = (entityType, entityIds, deltaX, deltaY) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        entityIds.forEach(id => {
            const entity = store.get(id);
            if (entity) {
                entity.x += deltaX;
                entity.y += deltaY;
            }
        });
    };

    const deleteEntities = (entityType, entityIds) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        return entityIds.map(id => store.delete(id)).filter(Boolean).length;
    };

    // Serialization
    const serialize = () => ({
        circles: Array.from(data.circles.entries()),
        squares: Array.from(data.squares.entries()),
        nextCircleId: data.nextCircleId,
        nextSquareId: data.nextSquareId
    });

    const deserialize = (savedData) => {
        if (savedData.circles) {
            data.circles = new Map(savedData.circles);
            
            // Ensure all circles have the new color properties
            data.circles.forEach((circle, id) => {
                if (!circle.colors) {
                    circle.colors = circle.color ? [circle.color] : ['#4CAF50'];
                }
                if (!circle.crystal) {
                    circle.crystal = 'Green'; // Default crystal
                }
                if (!circle.color) {
                    circle.color = '#4CAF50'; // Default color
                }
            });
        }
        if (savedData.squares) {
            data.squares = new Map(savedData.squares);
            
            // Ensure all squares have the new emoji properties (NEW: migration for existing squares)
            data.squares.forEach((square, id) => {
                if (square.emoji === undefined) {
                    square.emoji = null;
                }
                if (square.emojiKey === undefined) {
                    square.emojiKey = null;
                }
                // Ensure squares have a color property
                if (!square.color) {
                    square.color = '#FF6B6B'; // Default square color
                }
            });
        }
        if (savedData.nextCircleId) data.nextCircleId = savedData.nextCircleId;
        if (savedData.nextSquareId) data.nextSquareId = savedData.nextSquareId;
    };

    return {
        data,
        // Generic methods
        createEntity,
        getEntity,
        getEntitiesForDocument,
        updateEntity,
        deleteEntity,
        moveEntities,
        deleteEntities,
        // Specific methods (for compatibility)
        createCircle,
        createSquare,
        getCircle,
        getSquare,
        getCirclesForDocument,
        getSquaresForDocument,
        updateCircle,
        updateSquare,
        deleteCircle,
        deleteSquare,
        // Utilities
        generateRandomPosition,
        // Serialization
        serialize,
        deserialize
    };
}

export function useEntityStore() {
    if (!entityStoreInstance) {
        entityStoreInstance = createEntityStore();
    }
    return entityStoreInstance;
}
