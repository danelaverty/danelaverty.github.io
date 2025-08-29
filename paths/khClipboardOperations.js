// clipboardOperations.js - High-level clipboard operations for keyboard shortcuts
import { useClipboardStore } from './clipboardStore.js';

/**
 * Handle copy operation for selected entities
 * @param {Object} dataStore - The data store instance
 * @returns {Promise<boolean>} True if copy was successful
 */
export async function handleCopyOperation(dataStore) {
    const clipboardStore = useClipboardStore();
    
    // Priority: Squares first, then Circles
    const selectedSquares = dataStore.getSelectedSquares();
    const selectedCircles = dataStore.getSelectedCircles();
    
    if (selectedSquares.length > 0) {
        // Copy selected squares
        const squareEntities = selectedSquares.map(id => dataStore.getSquare(id)).filter(Boolean);
        const currentDoc = dataStore.getCurrentSquareDocument();
        const sourceDocumentId = currentDoc ? currentDoc.id : null;
        
        try {
            await clipboardStore.copyEntities('square', squareEntities, sourceDocumentId);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            return false;
        }
        
    } else if (selectedCircles.length > 0) {
        // Copy selected circles
        const circleEntities = selectedCircles.map(id => dataStore.getCircle(id)).filter(Boolean);
        const selectedViewerId = dataStore.data.selectedViewerId;
        const currentCircleDoc = selectedViewerId ? dataStore.getCircleDocumentForViewer(selectedViewerId) : null;
        const sourceDocumentId = currentCircleDoc ? currentCircleDoc.id : null;
        
        try {
            await clipboardStore.copyEntities('circle', circleEntities, sourceDocumentId);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            return false;
        }
    }
    
    return false;
}

/**
 * Handle normal paste operation (Ctrl+V)
 * @param {Object} dataStore - The data store instance
 * @returns {Promise<boolean>} True if paste was successful
 */
export async function handleNormalPaste(dataStore) {
    const clipboardStore = useClipboardStore();
    
    // Get clipboard info to determine what type of data we have
    const clipboardInfo = await clipboardStore.getClipboardInfo();
    if (clipboardInfo.isEmpty) {
        return false;
    }
    
    if (clipboardInfo.entityType === 'square') {
        return await pasteSquares(dataStore, clipboardStore, false);
    } else if (clipboardInfo.entityType === 'circle') {
        return await pasteCircles(dataStore, clipboardStore, false);
    }
    
    return false;
}

/**
 * Handle reference paste operation for circles (Shift+Ctrl+V)
 * @param {Object} dataStore - The data store instance
 * @returns {Promise<boolean>} True if paste was successful
 */
export async function handleReferencePaste(dataStore) {
    const clipboardStore = useClipboardStore();
    
    // Get clipboard info to ensure we have circle data
    const clipboardInfo = await clipboardStore.getClipboardInfo();
    if (clipboardInfo.isEmpty || clipboardInfo.entityType !== 'circle') {
        return false;
    }
    
    return await pasteCircles(dataStore, clipboardStore, true);
}

/**
 * Handle Shift+Ctrl+V logic - reference paste or normal paste based on clipboard content
 * @param {Object} dataStore - The data store instance
 * @param {Array} selectedSquares - Currently selected squares
 * @param {Array} selectedCircles - Currently selected circles
 * @returns {Promise<boolean>} True if operation was successful
 */
export async function handleShiftCtrlV(dataStore, selectedSquares, selectedCircles) {
    const clipboardStore = useClipboardStore();
    
    // Get clipboard info to determine what to do
    const clipboardInfo = await clipboardStore.getClipboardInfo();
    
    // If clipboard has circles, do reference paste
    if (!clipboardInfo.isEmpty && clipboardInfo.entityType === 'circle') {
        return await handleReferencePaste(dataStore);
    }
    
    // If clipboard has squares, do normal paste
    if (!clipboardInfo.isEmpty && clipboardInfo.entityType === 'square') {
        return await handleNormalPaste(dataStore);
    }
    
    // If no clipboard content, do nothing
    return false;
}

/**
 * Paste squares to the current square document
 * @param {Object} dataStore - The data store instance
 * @param {Object} clipboardStore - The clipboard store instance
 * @param {boolean} isReferencePaste - Whether this is a reference paste (unused for squares)
 * @returns {Promise<boolean>} True if paste was successful
 */
async function pasteSquares(dataStore, clipboardStore, isReferencePaste = false) {
    const currentDoc = dataStore.getCurrentSquareDocument();
    if (!currentDoc) {
        return false;
    }

    const pastedEntityData = await clipboardStore.pasteEntities(currentDoc.id, isReferencePaste);
    if (pastedEntityData.length === 0) {
        return false;
    }
    
    const createdSquares = [];
    
    pastedEntityData.forEach((squareData) => {
        const square = dataStore.createSquare();
        
        if (square) {
            // Update the created square with pasted data
            dataStore.updateSquare(square.id, {
                x: squareData.x,
                y: squareData.y,
                name: squareData.name,
                emoji: squareData.emoji,
                bold: squareData.bold,
                indicatorEmoji: squareData.indicatorEmoji,
                color: squareData.color,
                emojiKey: squareData.emojiKey,
                emojiCss: squareData.emojiCss
            });
            
            createdSquares.push(square);
        }
    });
    
    // Select the newly pasted squares
    selectCreatedEntities(dataStore, createdSquares, 'square');
    
    return createdSquares.length > 0;
}

/**
 * Paste circles to the current circle document of selected viewer
 * @param {Object} dataStore - The data store instance
 * @param {Object} clipboardStore - The clipboard store instance
 * @param {boolean} isReferencePaste - Whether this is a reference paste
 * @returns {Promise<boolean>} True if paste was successful
 */
async function pasteCircles(dataStore, clipboardStore, isReferencePaste = false) {
    const selectedViewerId = dataStore.data.selectedViewerId;
    if (!selectedViewerId) {
        return false;
    }
    
    const currentCircleDoc = dataStore.getCircleDocumentForViewer(selectedViewerId);
    if (!currentCircleDoc) {
        return false;
    }
    
    const pastedEntityData = await clipboardStore.pasteEntities(currentCircleDoc.id, isReferencePaste);
    if (pastedEntityData.length === 0) {
        return false;
    }
    
    const createdCircles = [];
    
    pastedEntityData.forEach(circleData => {
        const circle = dataStore.createCircleInViewer(selectedViewerId);
        if (circle) {
            const updateData = {
                x: circleData.x,
                y: circleData.y,
                name: circleData.name,
                type: circleData.type,
                color: circleData.color,
                colors: circleData.colors,
                emoji: circleData.emoji,
                energyTypes: circleData.energyTypes,
                activation: circleData.activation
            };
            
            // For reference paste, use the preserved original ID
            if (isReferencePaste && circleData.originalId) {
                updateData.referenceID = circleData.originalId;
            } else if (circleData.referenceID !== undefined) {
                // For normal paste, include referenceID if it exists in the copied data
                updateData.referenceID = circleData.referenceID;
            }
            
            dataStore.updateCircle(circle.id, updateData);
            createdCircles.push(circle);
        }
    });
    
    // Select the newly pasted circles
    selectCreatedEntities(dataStore, createdCircles, 'circle', selectedViewerId);
    
    return createdCircles.length > 0;
}

/**
 * Select newly created entities after paste operation
 * @param {Object} dataStore - The data store instance
 * @param {Array} createdEntities - Array of created entities
 * @param {string} entityType - 'square' or 'circle'
 * @param {string} viewerId - Viewer ID (required for circles)
 */
function selectCreatedEntities(dataStore, createdEntities, entityType, viewerId = null) {
    if (createdEntities.length === 0) {
        return;
    }
    
    if (entityType === 'square') {
        dataStore.selectSquare(null, false); // Clear current selection
        dataStore.selectSquare(createdEntities[0].id, false); // Select first
        for (let i = 1; i < createdEntities.length; i++) {
            dataStore.selectSquare(createdEntities[i].id, true); // Add others to selection
        }
    } else if (entityType === 'circle' && viewerId) {
        dataStore.selectCircle(null, viewerId, false); // Clear current selection
        dataStore.selectCircle(createdEntities[0].id, viewerId, false); // Select first
        for (let i = 1; i < createdEntities.length; i++) {
            dataStore.selectCircle(createdEntities[i].id, viewerId, true); // Add others to selection
        }
    }
}
