// clipboardStore.js - Application clipboard for copying and pasting entities
import { reactive } from './vue-composition-api.js';

let clipboardStoreInstance = null;

function createClipboardStore() {
    const data = reactive({
        entityType: null, // 'circle' or 'square'
        entities: [], // Array of copied entity data
        sourceDocumentId: null // Track where entities were copied from
    });

    const copyEntities = (entityType, entities, sourceDocumentId) => {
        if (!entities || entities.length === 0) {
            return false;
        }

        // Deep copy the entity data to avoid references
        const copiedEntities = entities.map(entity => {
            const copy = { ...entity };
            
            // For circles, copy all properties including type-specific ones
            if (entityType === 'circle') {
                // Copy all circle properties
                if (entity.type) copy.type = entity.type;
                if (entity.color) copy.color = entity.color;
                if (entity.colors) copy.colors = [...entity.colors];
                if (entity.emoji) copy.emoji = entity.emoji;
                if (entity.energyTypes) copy.energyTypes = [...entity.energyTypes];
                if (entity.activation !== undefined) copy.activation = entity.activation;
            }
            
            // For squares, copy all properties including emoji and styling
            if (entityType === 'square') {
                if (entity.emoji) copy.emoji = entity.emoji;
                if (entity.bold !== undefined) copy.bold = entity.bold;
                if (entity.indicatorEmoji) copy.indicatorEmoji = entity.indicatorEmoji;
            }
            
            return copy;
        });

        data.entityType = entityType;
        data.entities = copiedEntities;
        data.sourceDocumentId = sourceDocumentId;

        return true;
    };

    const pasteEntities = (targetDocumentId) => {
        if (!data.entities || data.entities.length === 0) {
            return [];
        }

        const isSameDocument = data.sourceDocumentId === targetDocumentId;
        const positionOffset = isSameDocument ? 30 : 0;

        const pastedEntities = data.entities.map(entity => {
            const pastedEntity = { ...entity };
            
            // Remove the ID so new entities will get new IDs
            delete pastedEntity.id;
            
            // Set the target document ID
            pastedEntity.documentId = targetDocumentId;
            
            // Apply position offset if pasting to same document
            pastedEntity.x = entity.x + positionOffset;
            pastedEntity.y = entity.y + positionOffset;
            
            return pastedEntity;
        });

        return pastedEntities;
    };

    const getClipboardInfo = () => {
        return {
            entityType: data.entityType,
            count: data.entities.length,
            sourceDocumentId: data.sourceDocumentId,
            isEmpty: data.entities.length === 0
        };
    };

    const clearClipboard = () => {
        data.entityType = null;
        data.entities = [];
        data.sourceDocumentId = null;
    };

    return {
        data,
        copyEntities,
        pasteEntities,
        getClipboardInfo,
        clearClipboard
    };
}

export function useClipboardStore() {
    if (!clipboardStoreInstance) {
        clipboardStoreInstance = createClipboardStore();
    }
    return clipboardStoreInstance;
}
