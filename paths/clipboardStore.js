// clipboardStore.js - Application clipboard with optimized system clipboard support
import { reactive } from './vue-composition-api.js';

let clipboardStoreInstance = null;

// Custom MIME type for our application data
const CUSTOM_MIME_TYPE = 'application/x-entity-data';

// Track clipboard permission state with localStorage persistence
const PERMISSION_KEY = 'clipboard_permission_granted';
let clipboardPermissionGranted = localStorage.getItem(PERMISSION_KEY) === 'true';
let lastClipboardWriteTime = 0;

// Helper to update permission state and persist it
function updatePermissionState(granted) {
    clipboardPermissionGranted = granted;
    localStorage.setItem(PERMISSION_KEY, granted.toString());
}

function createClipboardStore() {
    const data = reactive({
        entityType: null, // 'circle' or 'square'
        entities: [], // Array of copied entity data
        sourceDocumentId: null, // Track where entities were copied from
        lastUpdateTime: 0 // Track when internal clipboard was last updated
    });

    // Add flag to prevent multiple simultaneous clipboard access attempts
    let isCheckingClipboard = false;

    const copyEntities = async (entityType, entities, sourceDocumentId) => {
        if (!entities || entities.length === 0) {
            return false;
        }

        // Deep copy the entity data to avoid references
        const copiedEntities = entities.map(entity => {
            const copy = { ...entity };
            
            // For circles, copy all properties including type-specific ones and referenceID
            if (entityType === 'circle') {
                // Copy all circle properties
                if (entity.type) copy.type = entity.type;
                if (entity.color) copy.color = entity.color;
                if (entity.colors) copy.colors = [...entity.colors];
                if (entity.emoji) copy.emoji = entity.emoji;
                if (entity.energyTypes) copy.energyTypes = [...entity.energyTypes];
                if (entity.activation !== undefined) copy.activation = entity.activation;
                // Include referenceID in the copy
                if (entity.referenceID !== undefined) copy.referenceID = entity.referenceID;
            }
            
            // For squares, copy all properties including emoji and styling
            if (entityType === 'square') {
                if (entity.emoji) copy.emoji = entity.emoji;
                if (entity.bold !== undefined) copy.bold = entity.bold;
                if (entity.indicatorEmoji) copy.indicatorEmoji = entity.indicatorEmoji;
            }
            
            return copy;
        });

        // Update internal store
        data.entityType = entityType;
        data.entities = copiedEntities;
        data.sourceDocumentId = sourceDocumentId;
        data.lastUpdateTime = Date.now();

        // Try to write to system clipboard (non-blocking)
        writeToSystemClipboard({
            entityType,
            entities: copiedEntities,
            sourceDocumentId,
            timestamp: data.lastUpdateTime
        }).then(success => {
            if (success) {
                updatePermissionState(true);
                lastClipboardWriteTime = data.lastUpdateTime;
            }
        }).catch(error => {
            console.log('System clipboard write failed:', error);
        });

        return true;
    };

    const pasteEntities = async (targetDocumentId, isReferencePaste = false) => {
        // First ensure we have the latest clipboard data
        await ensureLatestClipboardData();
        
        if (!data.entities || data.entities.length === 0) {
            return [];
        }

        const isSameDocument = data.sourceDocumentId === targetDocumentId;
        const positionOffset = isSameDocument ? 30 : 0;

        const pastedEntities = data.entities.map(entity => {
            const pastedEntity = { ...entity };
            
            // For reference paste, preserve the original ID as originalId before removing id
            if (isReferencePaste) {
                pastedEntity.originalId = entity.id;
            }
            
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

    const getClipboardInfo = async () => {
        // Ensure we have the latest clipboard data
        await ensureLatestClipboardData();
        
        return {
            entityType: data.entityType,
            count: data.entities.length,
            sourceDocumentId: data.sourceDocumentId,
            isEmpty: data.entities.length === 0
        };
    };

    const clearClipboard = async () => {
        data.entityType = null;
        data.entities = [];
        data.sourceDocumentId = null;
        data.lastUpdateTime = Date.now();
        
        // Also clear system clipboard if possible and we have permission
        if (clipboardPermissionGranted) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText('');
                }
            } catch (error) {
                console.log('Could not clear system clipboard:', error);
            }
        }
    };

    // Centralized function to ensure we have the latest clipboard data
    const ensureLatestClipboardData = async () => {
        // Prevent multiple simultaneous clipboard checks
        if (isCheckingClipboard) {
            return;
        }

        // Only try system clipboard if we have no internal data AND we know we had permission before
        // This prevents multiple prompts when opening new tabs
        const shouldCheckSystemClipboard = 
            data.entities.length === 0 && // No internal data
            clipboardPermissionGranted && // We had permission in this domain
            data.lastUpdateTime === 0; // Haven't tried in this tab yet
        
        if (shouldCheckSystemClipboard) {
            isCheckingClipboard = true;
            try {
                const systemClipboardData = await readFromSystemClipboard();
                
                // Use system clipboard data if available
                if (systemClipboardData && systemClipboardData.entities) {
                    // Update internal store with system clipboard data
                    data.entityType = systemClipboardData.entityType;
                    data.entities = systemClipboardData.entities;
                    data.sourceDocumentId = systemClipboardData.sourceDocumentId;
                    data.lastUpdateTime = systemClipboardData.timestamp;
                    
                    console.log('Successfully loaded clipboard data from system clipboard');
                } else {
                    // Mark that we tried to prevent repeated attempts
                    data.lastUpdateTime = Date.now();
                }
            } catch (error) {
                // If system clipboard fails, just use internal clipboard
                console.log('System clipboard read failed, using internal clipboard:', error);
                
                // Mark that we tried to prevent repeated attempts
                data.lastUpdateTime = Date.now();
            } finally {
                isCheckingClipboard = false;
            }
        }
    };

    return {
        data,
        copyEntities,
        pasteEntities,
        getClipboardInfo,
        clearClipboard
    };
}

/**
 * Write data to system clipboard
 * @param {Object} clipboardData - Data to write to clipboard
 */
async function writeToSystemClipboard(clipboardData) {
    try {
        // Check if Clipboard API is available
        if (!navigator.clipboard) {
            console.log('Clipboard API not available');
            return false;
        }

        // Create clipboard data with both custom format and text fallback
        const jsonString = JSON.stringify(clipboardData);
        
        // For browsers that support ClipboardItem with custom MIME types
        if (window.ClipboardItem) {
            try {
                const clipboardItem = new ClipboardItem({
                    [CUSTOM_MIME_TYPE]: new Blob([jsonString], { type: CUSTOM_MIME_TYPE }),
                    'text/plain': new Blob([createTextFallback(clipboardData)], { type: 'text/plain' })
                });
                
                await navigator.clipboard.write([clipboardItem]);
                console.log('Data written to system clipboard with custom MIME type');
                return true;
            } catch (mimeError) {
                console.log('Custom MIME type not supported, falling back to text');
            }
        }
        
        // Fallback: use text with a special prefix to identify our data
        const prefixedData = `ENTITY_CLIPBOARD_DATA:${jsonString}`;
        await navigator.clipboard.writeText(prefixedData);
        console.log('Data written to system clipboard as text');
        return true;
        
    } catch (error) {
        console.error('Failed to write to system clipboard:', error);
        return false;
    }
}

/**
 * Read data from system clipboard
 * @returns {Object|null} Clipboard data or null if not available
 */
async function readFromSystemClipboard() {
    try {
        // Check if Clipboard API is available
        if (!navigator.clipboard) {
            return null;
        }

        // Try to read with ClipboardItem first (for custom MIME types)
        if (navigator.clipboard.read) {
            try {
                const clipboardItems = await navigator.clipboard.read();
                
                for (const clipboardItem of clipboardItems) {
                    // Check if our custom MIME type is available
                    if (clipboardItem.types.includes(CUSTOM_MIME_TYPE)) {
                        const blob = await clipboardItem.getType(CUSTOM_MIME_TYPE);
                        const text = await blob.text();
                        return JSON.parse(text);
                    }
                }
            } catch (readError) {
                console.log('Could not read with clipboard.read(), trying readText');
            }
        }

        // Fallback: try to read as text
        const text = await navigator.clipboard.readText();
        
        // Check if it's our prefixed data
        if (text.startsWith('ENTITY_CLIPBOARD_DATA:')) {
            const jsonString = text.substring('ENTITY_CLIPBOARD_DATA:'.length);
            return JSON.parse(jsonString);
        }
        
        return null;
        
    } catch (error) {
        console.log('Could not read from system clipboard:', error);
        return null;
    }
}

/**
 * Create a human-readable text fallback for clipboard data
 * @param {Object} clipboardData - The clipboard data
 * @returns {string} Human-readable text
 */
function createTextFallback(clipboardData) {
    const { entityType, entities } = clipboardData;
    const count = entities.length;
    
    let text = `Copied ${count} ${entityType}${count !== 1 ? 's' : ''}:\n\n`;
    
    entities.forEach((entity, index) => {
        text += `${index + 1}. ${entity.name || 'Unnamed'} `;
        if (entity.emoji) {
            text += `${entity.emoji} `;
        }
        if (entityType === 'circle' && entity.type) {
            text += `(${entity.type}) `;
        }
        text += `at (${entity.x}, ${entity.y})\n`;
    });
    
    text += `\n(This data can be pasted back into the application)`;
    
    return text;
}

export function useClipboardStore() {
    if (!clipboardStoreInstance) {
        clipboardStoreInstance = createClipboardStore();
    }
    return clipboardStoreInstance;
}
