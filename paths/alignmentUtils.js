// alignmentUtils.js - Entity alignment utilities
import { useDataStore } from './dataCoordinator.js';

// Simple state to track zigzag alternation
let zigzagFlipped = false;

/**
 * Align entities vertically or horizontally
 * @param {string} entityType - 'circle' or 'square'
 * @param {string} direction - 'vertical', 'horizontal', 'zigzag', 'circular', 'expand', or 'contract'
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
    } else if (direction === 'circular') {
        alignCircularly(entities, entityType, dataStore);
    } else if (direction === 'expand') {
        scaleGroupDistances(entities, entityType, dataStore, 1.2);
    } else if (direction === 'contract') {
        scaleGroupDistances(entities, entityType, dataStore, 0.8);
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
 * Check if entities are already arranged in a near-perfect circle
 * @param {Array} entities - The entities to check
 * @param {number} centerX - Circle center X
 * @param {number} centerY - Circle center Y  
 * @param {number} expectedRadius - Expected radius
 * @returns {boolean} True if entities are already circular
 */
function checkIfCircular(entities, centerX, centerY, expectedRadius) {
	// Allow 5% tolerance for radius and position variations
	const radiusTolerance = expectedRadius * 0.05;
	const expectedAngleStep = (2 * Math.PI) / entities.length;
	const angleTolerance = expectedAngleStep * 0.1; // 10% tolerance for angle spacing
	
	// Check if all entities are roughly at the expected radius
	const radiiMatch = entities.every(entity => {
		const dx = entity.x - centerX;
		const dy = entity.y - centerY;
		const actualRadius = Math.sqrt(dx * dx + dy * dy);
		return Math.abs(actualRadius - expectedRadius) <= radiusTolerance;
	});
	
	if (!radiiMatch) {
		return false;
	}
	
	// Sort entities by current angle
	const entitiesWithAngles = entities.map(entity => {
		const dx = entity.x - centerX;
		const dy = entity.y - centerY;
		let angle = Math.atan2(dy, dx);
		if (angle < 0) angle += 2 * Math.PI;
		return { entity, angle };
	}).sort((a, b) => a.angle - b.angle);
	
	// Check if entities are evenly spaced angularly
	for (let i = 0; i < entitiesWithAngles.length; i++) {
		const currentAngle = entitiesWithAngles[i].angle;
		const nextAngle = entitiesWithAngles[(i + 1) % entitiesWithAngles.length].angle;
		
		let actualAngleStep = nextAngle - currentAngle;
		if (actualAngleStep <= 0) {
			actualAngleStep += 2 * Math.PI; // Handle wrap-around
		}
		
		if (Math.abs(actualAngleStep - expectedAngleStep) > angleTolerance) {
			return false;
		}
	}
	
	return true;
}

/**
 * Align entities in a circular pattern
 */
function alignCircularly(entities, entityType, dataStore) {
	if (entities.length < 2) return;

	// Calculate the geometric center point (midpoint of bounding box)
	const centerX = Math.round(entities.reduce((sum, entity) => sum + entity.x, 0) / entities.length);
	const centerY = Math.round(entities.reduce((sum, entity) => sum + entity.y, 0) / entities.length);

	// Calculate radius based on the current spread of entities
	const maxDistance = Math.max(...entities.map(entity => {
		const dx = entity.x - centerX;
		const dy = entity.y - centerY;
		return Math.sqrt(dx * dx + dy * dy);
	}));

	// Ensure minimum radius for readability (80px for circles, 50px for squares)
	const minRadius = entityType === 'circle' ? 80 : 50;
	const radius = Math.max(maxDistance, minRadius);

	// For 2 entities, place them vertically opposite each other (top and bottom)
	if (entities.length === 2) {
		const newPositions = [
			{ x: Math.round(centerX), y: Math.round(centerY - radius) }, // Top (π/2)
			{ x: Math.round(centerX), y: Math.round(centerY + radius) }  // Bottom (3π/2)
		];

		entities.forEach((entity, index) => {
			if (entityType === 'circle') {
				dataStore.updateCircle(entity.id, newPositions[index]);
			} else {
				dataStore.updateSquare(entity.id, newPositions[index]);
			}
		});
	} else {
		// For 3+ entities, arrange in a circle starting at π/2 (top position)
		const angleStep = (2 * Math.PI) / entities.length;
		const targetStartAngle = Math.PI / 2; // Always start at π/2 (top position)

		console.log('=== CIRCULAR ALIGNMENT DEBUG ===');
		console.log('Center:', { centerX, centerY });
		console.log('Radius:', radius);
		console.log('Angle step:', angleStep);

		// Sort entities by their current angle from center to maintain relative positions
		const entitiesWithAngles = entities.map(entity => {
			const dx = entity.x - centerX;
			const dy = entity.y - centerY;
			// Use atan2 to get current angle, then normalize to [0, 2π] range
			let currentAngle = Math.atan2(dy, dx);
			if (currentAngle < 0) {
				currentAngle += 2 * Math.PI;
			}
			return { entity, angle: currentAngle };
		});

		console.log('Before sorting:');
		entitiesWithAngles.forEach((item, i) => {
			console.log(`  Entity ${item.entity.id}: pos(${item.entity.x}, ${item.entity.y}) angle=${item.angle.toFixed(3)}rad (${(item.angle * 180 / Math.PI).toFixed(1)}°)`);
		});

		// Sort by current angle to preserve relative positioning
		entitiesWithAngles.sort((a, b) => a.angle - b.angle);

		console.log('After sorting:');
		entitiesWithAngles.forEach((item, i) => {
			console.log(`  [${i}] Entity ${item.entity.id}: angle=${item.angle.toFixed(3)}rad (${(item.angle * 180 / Math.PI).toFixed(1)}°)`);
		});

		// Find which entity should be closest to π/2 (90°) to use as anchor
		let anchorIndex = 0;
		let minDistanceToTarget = Math.abs(entitiesWithAngles[0].angle - targetStartAngle);
		
		for (let i = 1; i < entitiesWithAngles.length; i++) {
			const distanceToTarget = Math.min(
				Math.abs(entitiesWithAngles[i].angle - targetStartAngle),
				Math.abs(entitiesWithAngles[i].angle - targetStartAngle + 2 * Math.PI),
				Math.abs(entitiesWithAngles[i].angle - targetStartAngle - 2 * Math.PI)
			);
			
			if (distanceToTarget < minDistanceToTarget) {
				minDistanceToTarget = distanceToTarget;
				anchorIndex = i;
			}
		}

		console.log(`Using entity ${entitiesWithAngles[anchorIndex].entity.id} as anchor (closest to π/2)`);

		// Position entities around the circle, with the anchor entity at π/2
		entitiesWithAngles.forEach((item, index) => {
			// Calculate offset from anchor - keep it simple and direct
			const offsetFromAnchor = index - anchorIndex;
			
			// Calculate target angle: anchor goes to π/2, others distributed counterclockwise
			const targetAngle = targetStartAngle - (angleStep * offsetFromAnchor);
			
			const newX = Math.round(centerX + Math.cos(targetAngle) * radius);
			const newY = Math.round(centerY + Math.sin(targetAngle) * radius); // Add sin for standard math coordinates

			console.log(`  Positioning entity ${item.entity.id} at index ${index} (offset ${offsetFromAnchor} from anchor):`);
			console.log(`    Target angle: ${targetAngle.toFixed(3)}rad (${(targetAngle * 180 / Math.PI).toFixed(1)}°)`);
			console.log(`    Old pos: (${item.entity.x}, ${item.entity.y})`);
			console.log(`    New pos: (${newX}, ${newY})`);

			if (entityType === 'circle') {
				dataStore.updateCircle(item.entity.id, { x: newX, y: newY });
			} else {
				dataStore.updateSquare(item.entity.id, { x: newX, y: newY });
			}
		});

		console.log('=== END DEBUG ===');
	}
}

/**
 * Scale group distances (expand or contract)
 */
function scaleGroupDistances(entities, entityType, dataStore, scaleFactor) {
    if (entities.length < 2) return;

    // Calculate the centroid (center of mass) of the group
    const totalX = entities.reduce((sum, entity) => sum + entity.x, 0);
    const totalY = entities.reduce((sum, entity) => sum + entity.y, 0);
    
    const centerX = totalX / entities.length;
    const centerY = totalY / entities.length;
    
    // Scale each entity's distance from the center
    entities.forEach(entity => {
        // Calculate current distance vector from center
        const dx = entity.x - centerX;
        const dy = entity.y - centerY;
        
        // Scale the distance vector
        const scaledDx = dx * scaleFactor;
        const scaledDy = dy * scaleFactor;
        
        // Calculate new position
        const newX = Math.round(centerX + scaledDx);
        const newY = Math.round(centerY + scaledDy);
        
        if (entityType === 'circle') {
            dataStore.updateCircle(entity.id, { x: newX, y: newY });
        } else {
            dataStore.updateSquare(entity.id, { x: newX, y: newY });
        }
    });
}

/**
 * Get the center point and radius of a circular arrangement
 */
function getCircularCenter(entities) {
    // Use the centroid (average position) as the center
    const totalX = entities.reduce((sum, entity) => sum + entity.x, 0);
    const totalY = entities.reduce((sum, entity) => sum + entity.y, 0);
    
    const centerX = totalX / entities.length;
    const centerY = totalY / entities.length;
    
    // Calculate average radius
    const totalDistance = entities.reduce((sum, entity) => {
        const dx = entity.x - centerX;
        const dy = entity.y - centerY;
        return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0);
    
    const radius = totalDistance / entities.length;
    
    return { x: centerX, y: centerY, radius };
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
