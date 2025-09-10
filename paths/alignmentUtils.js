// alignmentUtils.js - Entity alignment utilities
import { useDataStore } from './dataCoordinator.js';

// Simple state to track zigzag alternation
let zigzagFlipped = false;
let zigzagHorizontalFlipped = false;

/**
 * Align entities vertically or horizontally
 * @param {string} entityType - 'circle' or 'square'
 * @param {string} direction - 'vertical', 'horizontal', 'zigzag', 'circular', 'grid', 'expand', or 'contract'
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
    } else if (direction === 'zigzag-horizontal') {
        alignZigzagHorizontal(entities, entityType, dataStore);
    } else if (direction === 'circular') {
        alignCircularly(entities, entityType, dataStore);
    } else if (direction === 'grid') {
        alignGrid(entities, entityType, dataStore);
    } else if (direction === 'expand') {
        scaleGroupDistances(entities, entityType, dataStore, 1.2);
    } else if (direction === 'contract') {
        scaleGroupDistances(entities, entityType, dataStore, 0.8);
    }
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

function alignZigzagHorizontal(entities, entityType, dataStore) {
    // Toggle the horizontal zigzag flip state
    zigzagHorizontalFlipped = !zigzagHorizontalFlipped;
    
    // Find the topmost and bottommost Y positions for the two rows
    const topmostY = Math.min(...entities.map(e => e.y));
    const bottommostY = Math.max(...entities.map(e => e.y));
    
    // Find the leftmost and rightmost X positions for horizontal distribution
    const leftmostX = Math.min(...entities.map(e => e.x));
    const rightmostX = Math.max(...entities.map(e => e.x));
    
    // Sort entities by their current X position to maintain relative order
    entities.sort((a, b) => a.x - b.x);
    
    // Calculate equal horizontal spacing
    const totalWidth = rightmostX - leftmostX;
    const spacing = entities.length > 1 ? totalWidth / (entities.length - 1) : 0;
    
    // Update positions in horizontal zigzag pattern
    entities.forEach((entity, index) => {
        // Determine row assignment based on flip state
        let topRow;
        if (zigzagHorizontalFlipped) {
            // Flipped: odd indices go bottom, even indices go top
            topRow = index % 2 === 0;
        } else {
            // Normal: odd indices go top, even indices go bottom
            topRow = index % 2 === 1;
        }
        
        const newX = leftmostX + (spacing * index);
        const newY = topRow ? topmostY : bottommostY;
        
        if (entityType === 'circle') {
            dataStore.updateCircle(entity.id, { x: newX, y: newY });
        } else {
            dataStore.updateSquare(entity.id, { x: newX, y: newY });
        }
    });
}

/**
 * Align entities in a grid pattern based on their aspect ratio
 */
function alignGrid(entities, entityType, dataStore) {
    if (entities.length < 2) return;

    // Calculate current bounding box
    const leftmostX = Math.min(...entities.map(e => e.x));
    const rightmostX = Math.max(...entities.map(e => e.x));
    const topmostY = Math.min(...entities.map(e => e.y));
    const bottommostY = Math.max(...entities.map(e => e.y));
    
    const currentWidth = rightmostX - leftmostX;
    const currentHeight = bottommostY - topmostY;
    
    // Calculate aspect ratio (width / height)
    const aspectRatio = currentHeight > 0 ? currentWidth / currentHeight : 1;
    
    // Find the best grid configuration for this number of entities and aspect ratio
    const { cols, rows } = findBestGridConfiguration(entities.length, aspectRatio);
    
    // Generate all grid positions
    const gridPositions = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            gridPositions.push({ row, col });
        }
    }
    
    // Calculate spacing
    const horizontalSpacing = cols > 1 ? currentWidth / (cols - 1) : 0;
    const verticalSpacing = rows > 1 ? currentHeight / (rows - 1) : 0;
    
    // Convert grid positions to actual coordinates
    const targetPositions = gridPositions.slice(0, entities.length).map(pos => ({
        x: leftmostX + (pos.col * horizontalSpacing),
        y: topmostY + (pos.row * verticalSpacing),
        gridPos: pos
    }));
    
    // Assign each entity to the nearest grid position
    const assignments = assignEntitiesToGrid(entities, targetPositions);
    
    // Update entity positions
    assignments.forEach(assignment => {
        const { entity, targetPos } = assignment;
        
        if (entityType === 'circle') {
            dataStore.updateCircle(entity.id, { x: Math.round(targetPos.x), y: Math.round(targetPos.y) });
        } else {
            dataStore.updateSquare(entity.id, { x: Math.round(targetPos.x), y: Math.round(targetPos.y) });
        }
    });
}

/**
 * Find the best grid configuration (cols x rows) for a given number of entities and aspect ratio
 */
function findBestGridConfiguration(entityCount, aspectRatio) {
    if (entityCount === 1) {
        return { cols: 1, rows: 1 };
    }
    
    let bestConfig = { cols: 1, rows: entityCount };
    let bestScore = Math.abs((1 / entityCount) - aspectRatio); // Score for 1xN grid
    
    // Try all possible grid configurations
    for (let cols = 1; cols <= entityCount; cols++) {
        const rows = Math.ceil(entityCount / cols);
        
        // Calculate the aspect ratio of this grid configuration
        const gridAspectRatio = cols / rows;
        
        // Score based on how close this grid's aspect ratio matches the current layout
        const score = Math.abs(gridAspectRatio - aspectRatio);
        
        if (score < bestScore) {
            bestScore = score;
            bestConfig = { cols, rows };
        }
    }
    
    return bestConfig;
}

/**
 * Assign each entity to the nearest available grid position
 */
function assignEntitiesToGrid(entities, targetPositions) {
    const assignments = [];
    const usedPositions = new Set();
    
    // For each entity, find the nearest unused grid position
    entities.forEach(entity => {
        let bestDistance = Infinity;
        let bestPositionIndex = -1;
        
        targetPositions.forEach((targetPos, index) => {
            if (usedPositions.has(index)) return; // Position already used
            
            const distance = Math.sqrt(
                Math.pow(entity.x - targetPos.x, 2) + 
                Math.pow(entity.y - targetPos.y, 2)
            );
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPositionIndex = index;
            }
        });
        
        if (bestPositionIndex !== -1) {
            assignments.push({
                entity,
                targetPos: targetPositions[bestPositionIndex]
            });
            usedPositions.add(bestPositionIndex);
        }
    });
    
    return assignments;
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

		// Sort by current angle to preserve relative positioning
		entitiesWithAngles.sort((a, b) => a.angle - b.angle);

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

		// Position entities around the circle, with the anchor entity at π/2
		entitiesWithAngles.forEach((item, index) => {
			// Calculate offset from anchor - keep it simple and direct
			const offsetFromAnchor = index - anchorIndex;
			
			// Calculate target angle: anchor goes to π/2, others distributed counterclockwise
			const targetAngle = targetStartAngle - (angleStep * offsetFromAnchor);
			
			const newX = Math.round(centerX + Math.cos(targetAngle) * radius);
			const newY = Math.round(centerY + Math.sin(targetAngle) * radius); // Add sin for standard math coordinates

			if (entityType === 'circle') {
				dataStore.updateCircle(item.entity.id, { x: newX, y: newY });
			} else {
				dataStore.updateSquare(item.entity.id, { x: newX, y: newY });
			}
		});
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
