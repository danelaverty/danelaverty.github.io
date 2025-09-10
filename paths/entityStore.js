// entityStore.js - Unified entity management for circles and squares with bold, indicator emoji, circle emoji, energy support, activation, activationTriggers, referenceID, collapsed groups, and member activation with debounced queue
import { reactive } from './vue-composition-api.js';

let entityStoreInstance = null;

function createEntityStore() {
    const data = reactive({
        circles: new Map(),
        squares: new Map(),
        nextCircleId: 1,
        nextSquareId: 1
    });

    // NEW: Debounced activation check queue
    const activationCheckQueue = new Map(); // circleId -> true
    let activationCheckTimeout = null;

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

    // NEW: Process queued activation checks with callback
    const processQueuedActivationChecks = (updateCallback = null) => {
        const circlesToCheck = Array.from(activationCheckQueue.keys());
        activationCheckQueue.clear();
        activationCheckTimeout = null;

        // Use provided callback or fallback to internal updateCircle
        const updateFn = updateCallback || updateCircle;

        circlesToCheck.forEach(circleId => {
            const circle = getCircle(circleId);
            if (!circle || circle.activationTriggers !== 'members') return;
            
            if (circle.type === 'group') {
                const memberCount = getCirclesBelongingToGroup(circleId).length;
                const shouldBeActivated = memberCount > 0;
                
                if (shouldBeActivated && circle.activation === 'inactive') {
                    updateFn(circleId, { activation: 'activated' });
                } else if (!shouldBeActivated && circle.activation === 'activated') {
                    updateFn(circleId, { activation: 'inactive' });
                }
            } else {
                // Member activation logic (immediate, no delay)
                const isGroupMember = circle.belongsToID !== null;
                
                if (isGroupMember && circle.activation === 'inactive') {
                    updateFn(circleId, { activation: 'activated' });
                } else if (!isGroupMember && circle.activation === 'activated') {
                    // updateFn(circleId, { activation: 'inactive' });
                }
            }
        });
    };

    // NEW: Schedule activation check with debouncing
    const scheduleActivationCheck = (circleId, updateCallback = null) => {
        // Add to queue (automatically deduplicates)
        activationCheckQueue.set(circleId, true);
        
        // Reset the timeout
        if (activationCheckTimeout) {
            clearTimeout(activationCheckTimeout);
        }
        
        activationCheckTimeout = setTimeout(() => processQueuedActivationChecks(updateCallback), 500);
    };

    const checkAndUpdateMemberActivation = (circleId, updateCallback = null) => {
        const circle = getCircle(circleId);
        if (!circle || circle.activationTriggers !== 'members') return;
        
        // For non-member activation triggers, execute immediately
        if (circle.activationTriggers !== 'members') {
            // Handle other activation trigger types immediately if needed
            return;
        }
        
        // For member-based activation, use debounced queue
        scheduleActivationCheck(circleId, updateCallback);
    };

    // Activation cycling utility
    const cycleActivation = (currentActivation) => {
        const activationCycle = ['activated', 'inactive', 'inert'];
        const currentIndex = activationCycle.indexOf(currentActivation);
        return activationCycle[(currentIndex + 1) % activationCycle.length];
    };

    // ActivationTriggers cycling utility
    const cycleActivationTriggers = (currentActivationTriggers) => {
        const activationTriggersCycle = ['none', 'members'];
        const currentIndex = activationTriggersCycle.indexOf(currentActivationTriggers);
        return activationTriggersCycle[(currentIndex + 1) % activationTriggersCycle.length];
    };

    // Connectible cycling utility (for consistency)
    const cycleConnectible = (currentConnectible) => {
        const connectibleCycle = ['receives', 'gives', 'refuses'];
        const currentIndex = connectibleCycle.indexOf(currentConnectible);
        return connectibleCycle[(currentIndex + 1) % connectibleCycle.length];
    };

    // Generic entity operations
    const createEntity = (entityType, documentId, containerWidth, containerHeight, viewerWidths = [], documentStore = null) => {
        const id = `${entityType}_${entityType === 'circle' ? data.nextCircleId++ : data.nextSquareId++}`;
        
        let position;
        if (entityType === 'square') {
            const dimensions = calculateSquareContainerDimensions(viewerWidths);
            position = generateRandomPosition(dimensions.width, dimensions.height - 100, 100);
        } else {
            const actualHeight = containerHeight || (window.innerHeight - 120);
            position = generateRandomPosition(containerWidth - 40, actualHeight);
	    position.x -= containerWidth / 2;
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
            entity.color = '#CCCCCC'; 
            entity.colors = ['#4CAF50']; 
            entity.energyTypes = []; 
            entity.activation = 'activated'; // UPDATED: Default to 'activated' (first in cycle)
            entity.activationTriggers = 'none'; // NEW: Default to 'none' (first in cycle)
	    entity.connectible = 'receives'; 
            entity.referenceID = null; 
            entity.belongsToID = null; 
            entity.collapsed = false; // NEW: Default to expanded
            
            // Set circle type based on document's mostRecentlySetCircleType
            let defaultType = 'basic'; // Fallback default
            if (documentStore) {
                const recentType = documentStore.getMostRecentlySetCircleType(documentId);
                if (recentType) {
                    defaultType = recentType;
                }
            }
            entity.type = defaultType;
            
            // Add emoji property for emoji-type circles
            entity.emoji = null; // Default: no emoji, will be set when type is 'emoji'
            
            // Set default emoji for emoji-type circles
            if (entity.type === 'emoji') {
                entity.emoji = 'A'; // Default emoji for emoji circles
            }
        }

        // Add square-specific properties
        if (entityType === 'square') {
            entity.emoji = null; // Default: no emoji
            entity.emojiKey = null; // Key from attributeInfo
            entity.emojiCss = null; // CSS filter for emoji
            entity.color = '#CCCCCC'; // Default color (can be overridden by emoji)
            entity.bold = false; // Default bold state
            entity.indicatorEmoji = null; // Default indicator emoji
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

    const getCirclesBelongingToGroup = (groupId) => {
        return Array.from(data.circles.values()).filter(circle => circle.belongsToID === groupId);
    };

    // UPDATED: Enhanced with member activation logic and callback parameter
    const setCircleBelongsTo = (circleId, groupId, updateCallback = null) => {
        const circle = data.circles.get(circleId);
        if (circle) {
            circle.belongsToID = groupId;
            
            // NEW: Check member activation for the circle that joined the group
            checkAndUpdateMemberActivation(circleId, updateCallback);
            
            // NEW: Check member activation for the group that gained a member
            if (groupId) {
                checkAndUpdateMemberActivation(groupId, updateCallback);
            }
            
            return circle;
        }
        return null;
    };

    // UPDATED: Enhanced with member activation logic and callback parameter
    const clearCircleBelongsTo = (circleId, updateCallback = null) => {
        const circle = data.circles.get(circleId);
        if (circle) {
            const formerGroupId = circle.belongsToID;
            circle.belongsToID = null;
            
            // NEW: Check member activation for the circle that left the group
            checkAndUpdateMemberActivation(circleId, updateCallback);
            
            // NEW: Check member activation for the group that lost a member
            if (formerGroupId) {
                checkAndUpdateMemberActivation(formerGroupId, updateCallback);
            }
            
            return circle;
        }
        return null;
    };

    // Cycle activation for a circle
    const cycleCircleActivation = (id) => {
        const circle = data.circles.get(id);
        if (circle) {
            circle.activation = cycleActivation(circle.activation);
            
            // Cascade to referenced circles
            const referencedCircles = getReferencedCircles(id);
            referencedCircles.forEach(refCircle => {
                refCircle.activation = circle.activation;
            });
            
            return circle;
        }
        return null;
    };

    // Cycle activationTriggers for a circle
    const cycleCircleActivationTriggers = (id) => {
        const circle = data.circles.get(id);
        if (circle) {
            circle.activationTriggers = cycleActivationTriggers(circle.activationTriggers);
            
            // Cascade to referenced circles
            const referencedCircles = getReferencedCircles(id);
            referencedCircles.forEach(refCircle => {
                refCircle.activationTriggers = circle.activationTriggers;
            });
            
            return circle;
        }
        return null;
    };

    // Cycle connectible for a circle
    const cycleCircleConnectible = (id) => {
        const circle = data.circles.get(id);
        if (circle) {
            circle.connectible = cycleConnectible(circle.connectible);
            
            // Cascade to referenced circles
            const referencedCircles = getReferencedCircles(id);
            referencedCircles.forEach(refCircle => {
                refCircle.connectible = circle.connectible;
            });
            
            return circle;
        }
        return null;
    };

    const updateEntity = (entityType, id, updates) => {
        const store = entityType === 'circle' ? data.circles : data.squares;
        const entity = store.get(id);
        if (entity) {
            Object.assign(entity, updates);
            
            // For circles, ensure color consistency, emoji handling, energy types, activation, activationTriggers, referenceID, and collapsed state
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
                
		if (!entity.connectible) {
			entity.connectible = 'receives'; // Default for existing circles
		}

                // Ensure energyTypes array always exists
                if (!entity.energyTypes) {
                    entity.energyTypes = [];
                }
                
                // UPDATED: Ensure activation property always exists and is valid
                if (!entity.activation || !['activated', 'inactive', 'inert'].includes(entity.activation)) {
                    entity.activation = 'activated'; // Default to first state in cycle
                }
                
                // NEW: Ensure activationTriggers property always exists and is valid
                if (!entity.activationTriggers || !['none', 'members'].includes(entity.activationTriggers)) {
                    entity.activationTriggers = 'none'; // Default to first state in cycle
                }
                
                // Ensure referenceID property always exists
                if (entity.referenceID === undefined) {
                    entity.referenceID = null;
                }
                
                // NEW: Ensure collapsed property always exists
                if (entity.collapsed === undefined) {
                    entity.collapsed = false;
                }
                
                // Handle activation state changes
                if (updates.activation !== undefined) {
                    entity.activation = updates.activation;
                }
                
                // NEW: Handle activationTriggers state changes
                if (updates.activationTriggers !== undefined) {
                    entity.activationTriggers = updates.activationTriggers;
                }
                
                // Handle referenceID changes
                if (updates.referenceID !== undefined) {
                    entity.referenceID = updates.referenceID;
                }
                
                // NEW: Handle collapsed state changes
                if (updates.collapsed !== undefined) {
                    entity.collapsed = updates.collapsed;
                }
                
                // Handle emoji when type changes to/from 'emoji'
                if (updates.type === 'emoji' && !entity.emoji) {
                    entity.emoji = 'A'; // Set default emoji for emoji circles
                } else if (updates.type && updates.type !== 'emoji') {
                    // Don't clear emoji when changing away from emoji type - keep it for future use
                    // entity.emoji = null; // Commented out to preserve emoji
                }

		if (entityType === 'circle' && entity.referenceID === null) {
			// This is an original circle (not a reference), cascade changes to its references
			const referencedCircles = getReferencedCircles(id);

			if (referencedCircles.length > 0) {
				referencedCircles.forEach(refCircle => {
					// Cascade name changes
					if (updates.name !== undefined) {
						refCircle.name = entity.name;
					}

					// Cascade color changes - use the final computed values from the main entity
					if (updates.color !== undefined || updates.colors !== undefined) {
						refCircle.color = entity.color;
						refCircle.colors = [...entity.colors]; // Copy the array
					}

					// Cascade type changes
					if (updates.type !== undefined) {
						refCircle.type = entity.type;
						// Handle emoji for type changes
						if (entity.type === 'emoji' && !refCircle.emoji) {
							refCircle.emoji = entity.emoji || 'A';
						}
					}

					// Cascade emoji changes
					if (updates.emoji !== undefined) {
						refCircle.emoji = entity.emoji;
					}

					// Cascade energy types
					if (updates.energyTypes !== undefined) {
						refCircle.energyTypes = [...entity.energyTypes]; // Copy the array
					}

					if (updates.connectible !== undefined) {
						entity.connectible = updates.connectible;
					}

					// Cascade activation changes
					if (updates.activation !== undefined) {
						refCircle.activation = entity.activation;
					}

                    // NEW: Cascade activationTriggers changes
                    if (updates.activationTriggers !== undefined) {
                        refCircle.activationTriggers = entity.activationTriggers;
                    }

					if (updates.connectible !== undefined) {
						refCircle.connectible = entity.connectible;
					}

					// NEW: Cascade collapsed changes
					if (updates.collapsed !== undefined) {
						refCircle.collapsed = entity.collapsed;
					}

					// Ensure referenced circles have all required properties
					if (!refCircle.energyTypes) {
						refCircle.energyTypes = [];
					}
					// UPDATED: Ensure activation is valid for referenced circles
					if (!refCircle.activation || !['activated', 'inactive', 'inert'].includes(refCircle.activation)) {
						refCircle.activation = 'activated';
					}

                    // NEW: Ensure activationTriggers is valid for referenced circles
                    if (!refCircle.activationTriggers || !['none', 'members'].includes(refCircle.activationTriggers)) {
                        refCircle.activationTriggers = 'none';
                    }

					if (!refCircle.connectible) {
						refCircle.connectible = 'receives';
					}

					if (!refCircle.colors) {
						refCircle.colors = [refCircle.color || '#4CAF50'];
					}

					// NEW: Ensure referenced circles have collapsed property
					if (refCircle.collapsed === undefined) {
						refCircle.collapsed = false;
					}
				});
			}
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
    const createCircle = (documentId, containerWidth, containerHeight, documentStore = null) => {
        return createEntity('circle', documentId, containerWidth, containerHeight, [], documentStore);
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
    
    // UPDATED: Enhanced with member activation logic
    const deleteCircle = (id, updateCallback = null) => {
        const circle = getCircle(id);
        if (!circle) return false;
        
        // NEW: Track group membership before deletion for activation logic
        const formerGroupId = circle.belongsToID;
        const wasGroup = circle.type === 'group';
        let formerMembers = [];
        
        if (wasGroup) {
            formerMembers = getCirclesBelongingToGroup(id);
        }
        
        // If this is an original circle (not a reference), convert all its references to normal circles
        if (circle.referenceID === null) {
            const referencedCircles = getReferencedCircles(id);
            referencedCircles.forEach(refCircle => {
                // Convert referenced circle to normal circle by clearing its referenceID
                refCircle.referenceID = null;
            });
        }
        
        // Now delete the circle
        const deleted = data.circles.delete(id);
        
        if (deleted) {
            // NEW: Handle member activation after deletion
            
            // If deleted circle was a member of a group, check the group's activation
            if (formerGroupId) {
                checkAndUpdateMemberActivation(formerGroupId, updateCallback);
            }
            
            // If deleted circle was a group, check all former members' activation
            if (wasGroup && formerMembers.length > 0) {
                formerMembers.forEach(member => {
                    // Clear the belongsToID since the group is gone
                    member.belongsToID = null;
                    // Check member activation
                    checkAndUpdateMemberActivation(member.id, updateCallback);
                });
            }
        }
        
        return deleted;
    };
    
    const deleteSquare = (id) => deleteEntity('square', id);

    // Utility functions for referenceID
    const isReferencedCircle = (id) => {
        const circle = getCircle(id);
        return circle && circle.referenceID !== null;
    };

    const getReferencedCircles = (originalCircleId) => {
        return Array.from(data.circles.values()).filter(circle => circle.referenceID === originalCircleId);
    };

    // Utility function to toggle group collapsed state
    const toggleGroupCollapsed = (id) => {
        const circle = getCircle(id);
        if (circle && circle.type === 'group') {
            circle.collapsed = !circle.collapsed;
            return circle;
        }
        return null;
    };

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
            
            // Ensure all circles have the new color, emoji, energy, activation, activationTriggers, referenceID, and collapsed properties
            data.circles.forEach((circle, id) => {
                if (!circle.colors) {
                    circle.colors = circle.color ? [circle.color] : ['#CCCCCC'];
                }
                if (!circle.color) {
                    circle.color = '#CCCCCC'; // Default color
                }
                // Ensure emoji property exists for circles
                if (circle.emoji === undefined) {
                    circle.emoji = null;
                }

		if (circle.connectible === undefined) {
			circle.connectible = 'receives'; // Default for existing circles
		}

                // Set default emoji for existing emoji-type circles that don't have one
                if (circle.type === 'emoji' && !circle.emoji) {
                    circle.emoji = 'A';
                }
                // Ensure energyTypes property exists for circles
                if (!circle.energyTypes) {
                    circle.energyTypes = [];
                }
                // UPDATED: Ensure activation property exists and is valid for circles
                if (!circle.activation || !['activated', 'inactive', 'inert'].includes(circle.activation)) {
                    circle.activation = 'activated'; // Default for existing circles (backward compatibility)
                }
                // NEW: Ensure activationTriggers property exists and is valid for circles
                if (!circle.activationTriggers || !['none', 'members'].includes(circle.activationTriggers)) {
                    circle.activationTriggers = 'none'; // Default for existing circles (backward compatibility)
                }
                // Ensure referenceID property exists for circles
                if (circle.referenceID === undefined) {
                    circle.referenceID = null; // Default for existing circles
                }

                if (circle.belongsToID === undefined) {
                circle.belongsToID = null;
            }

                // NEW: Ensure collapsed property exists for circles
                if (circle.collapsed === undefined) {
                    circle.collapsed = false; // Default for existing circles
                }
            });
        }
        if (savedData.squares) {
            data.squares = new Map(savedData.squares);
            
            // Ensure all squares have the new emoji, bold, and indicator properties
            data.squares.forEach((square, id) => {
                if (square.emoji === undefined) {
                    square.emoji = null;
                }
                if (square.emojiKey === undefined) {
                    square.emojiKey = null;
                }
                // Ensure emojiCss property exists
                if (square.emojiCss === undefined) {
                    square.emojiCss = null;
                }
                // Ensure squares have a color property
                if (!square.color) {
                    square.color = '#CCCCCC'; // Default square color
                }
                // Ensure squares have a bold property
                if (square.bold === undefined) {
                    square.bold = false; // Default to not bold
                }
                // Ensure squares have an indicator emoji property
                if (square.indicatorEmoji === undefined) {
                    square.indicatorEmoji = null; // Default to no indicator
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
        // Reference ID utilities
        isReferencedCircle,
        getReferencedCircles,
        // Group collapsed utilities
        toggleGroupCollapsed,
        // Activation, activationTriggers, and connectible cycling utilities
        cycleCircleActivation,
        cycleCircleActivationTriggers,
        cycleCircleConnectible,
        // Utilities
        generateRandomPosition,
        // Serialization
        serialize,
        deserialize,

        getCirclesBelongingToGroup,
        setCircleBelongsTo,
        clearCircleBelongsTo,
        
        // NEW: Expose member activation function for potential external use
        checkAndUpdateMemberActivation,
    };
}

export function useEntityStore() {
    if (!entityStoreInstance) {
        entityStoreInstance = createEntityStore();
    }
    return entityStoreInstance;
}
