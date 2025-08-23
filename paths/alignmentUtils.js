// alignmentUtils.js - Entity alignment utilities
import { useDataStore } from './dataCoordinator.js';

// Simple state to track zigzag alternation
let zigzagFlipped = false;

/**
 * Align entities vertically or horizontally
 * @param {string} entityType - 'circle' or 'square'
 * @param {string} direction - 'vertical', 'horizontal', or 'zigzag'
 */
export function alignEntities(entityType, direction) {
    const dataStore = useDataStore();
    
    const selectedIds = entityType === 'circle' 
        ? dataStore.getSelectedCircles() 
        : dataStore.getSelectedSquares();
    
    if (selectedIds.length < 2) return; // Need at least 2 entities to align
    
    // Get entity data
    const entities = selectedIds.map(id => {
        return entityType === 'circle' 
            ? dataStore.data.circles?.get?.(id) || findCircleInAllDocuments(id, dataStore)
            : dataStore.data.squares?.get?.(id) || findSquareInCurrentDoc(id, dataStore);
    }).filter(Boolean);
    
    if (entities.length < 2) return;
    
    if (direction === 'vertical') {
        alignVertically(entities, entityType, dataStore);
    } else if (direction === 'horizontal') {
        alignHorizontally(entities, entityType, dataStore);
    } else if (direction === 'zigzag') {
        alignZigzag(entities, entityType, dataStore);
    }
    
    console.log(`Aligned ${entities.length} ${entityType}s ${direction}ly`);
}

/**
 * Align entities vertically - align on X axis, distribute on Y axis
 */
function alignVertically(entities, entityType, dataStore) {
    // Find the leftmost and rightmost X positions
    const leftmostX = Math.min(...entities.map(e => e.x));
    const rightmostX = Math.max(...entities.map(e => e.x));
    const midpointX = leftmostX + (rightmostX - leftmostX) / 2;
    
    // Find the topmost and bottommost Y positions
    const topmostY = Math.min(...entities.map(e => e.y));
    const bottommostY = Math.max(...entities.map(e => e.y));
    
    // Sort entities by their current Y position
    entities.sort((a, b) => a.y - b.y);
    
    // Calculate equal spacing
    const totalHeight = bottommostY - topmostY;
    const spacing = entities.length > 1 ? totalHeight / (entities.length - 1) : 0;
    
    // Update positions
    entities.forEach((entity, index) => {
        const newX = midpointX;
        const newY = topmostY + (spacing * index);
        
        if (entityType === 'circle') {
            dataStore.updateCircle(entity.id, { x: newX, y: newY });
        } else {
            dataStore.updateSquare(entity.id, { x: newX, y: newY });
        }
    });
}

/**
 * Align entities horizontally - align on Y axis, distribute on X axis
 */
function alignHorizontally(entities, entityType, dataStore) {
    // Find the topmost and bottommost Y positions
    const topmostY = Math.min(...entities.map(e => e.y));
    const bottommostY = Math.max(...entities.map(e => e.y));
    const midpointY = topmostY + (bottommostY - topmostY) / 2;
    
    // Find the leftmost and rightmost X positions
    const leftmostX = Math.min(...entities.map(e => e.x));
    const rightmostX = Math.max(...entities.map(e => e.x));
    
    // Sort entities by their current X position
    entities.sort((a, b) => a.x - b.x);
    
    // Calculate equal spacing
    const totalWidth = rightmostX - leftmostX;
    const spacing = entities.length > 1 ? totalWidth / (entities.length - 1) : 0;
    
    // Update positions
    entities.forEach((entity, index) => {
        const newX = leftmostX + (spacing * index);
        const newY = midpointY;
        
        if (entityType === 'circle') {
            dataStore.updateCircle(entity.id, { x: newX, y: newY });
        } else {
            dataStore.updateSquare(entity.id, { x: newX, y: newY });
        }
    });
}

/**
 * Align entities in a zigzag pattern - two columns with vertical distribution
 * Alternates column assignment on repeated calls
 */
function alignZigzag(entities, entityType, dataStore) {
    // Toggle the zigzag flip state
    zigzagFlipped = !zigzagFlipped;
    
    // Find the leftmost and rightmost X positions for the two columns
    const leftmostX = Math.min(...entities.map(e => e.x));
    const rightmostX = Math.max(...entities.map(e => e.x));
    
    // Find the topmost and bottommost Y positions for vertical distribution
    const topmostY = Math.min(...entities.map(e => e.y));
    const bottommostY = Math.max(...entities.map(e => e.y));
    
    // Sort entities by their current Y position to maintain relative order
    entities.sort((a, b) => a.y - b.y);
    
    // Calculate equal vertical spacing
    const totalHeight = bottommostY - topmostY;
    const spacing = entities.length > 1 ? totalHeight / (entities.length - 1) : 0;
    
    // Update positions in zigzag pattern
    entities.forEach((entity, index) => {
        // Determine column assignment based on flip state
        let leftColumn;
        if (zigzagFlipped) {
            // Flipped: odd indices go right, even indices go left
            leftColumn = index % 2 === 0;
        } else {
            // Normal: odd indices go left, even indices go right
            leftColumn = index % 2 === 1;
        }
        
        const newX = leftColumn ? leftmostX : rightmostX;
        const newY = topmostY + (spacing * index);
        
        if (entityType === 'circle') {
            dataStore.updateCircle(entity.id, { x: newX, y: newY });
        } else {
            dataStore.updateSquare(entity.id, { x: newX, y: newY });
        }
    });
}

/**
 * Helper function to find circles across all documents
 */
function findCircleInAllDocuments(id, dataStore) {
    const allDocuments = dataStore.getAllCircleDocuments();
    for (const doc of allDocuments) {
        const circles = dataStore.getCirclesForDocument(doc.id);
        const circle = circles.find(c => c.id === id);
        if (circle) return circle;
    }
    return null;
}

/**
 * Helper function to find squares in current document
 */
function findSquareInCurrentDoc(id, dataStore) {
    const currentDoc = dataStore.getCurrentSquareDocument();
    if (currentDoc) {
        const squares = dataStore.getSquaresForDocument(currentDoc.id);
        return squares.find(s => s.id === id);
    }
    return null;
}
