// entityStore.js - Unified entity management for circles and squares with bold, indicator emoji, circle emoji, energy support, activation, activationTriggers, referenceID, collapsed groups, and member activation with debounced queue
import { reactive } from './vue-composition-api.js';
import { getPropertyDefault, cycleProperty, validatePropertyValue } from './CBCyclePropertyConfigs.js';

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
            entity.activation = getPropertyDefault('activation');
            entity.activationTriggers = getPropertyDefault('activationTriggers');
            entity.shinynessReceiveMode = getPropertyDefault('shinynessReceiveMode');
            entity.connectible = getPropertyDefault('connectible');
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

    // Generic cycle function for any property
    const cycleCircleProperty = (id, propertyName) => {
        const circle = data.circles.get(id);
        if (circle) {
            circle[propertyName] = cycleProperty(propertyName, circle[propertyName]);
            
            // Cascade to referenced circles
            const referencedCircles = getReferencedCircles(id);
            referencedCircles.forEach(refCircle => {
                refCircle[propertyName] = circle[propertyName];
            });
            
            return circle;
        }
        return null;
    };

    // Specific cycle functions using the generic one
    const cycleCircleActivation = (id) => cycleCircleProperty(id, 'activation');
    const cycleCircleActivationTriggers = (id) => cycleCircleProperty(id, 'activationTriggers');
    const cycleCircleShinynessReceiveMode = (id) => cycleCircleProperty(id, 'shinynessReceiveMode');
    const cycleCircleConnectible = (id) => cycleCircleProperty(id, 'connectible');

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
                    entity.connectible = getPropertyDefault('connectible');
                }

                // Ensure energyTypes array always exists
                if (!entity.energyTypes) {
                    entity.energyTypes = [];
                }
                
                // Ensure all cycleable properties exist and are valid
                if (!validatePropertyValue('activation', entity.activation)) {
                    entity.activation = getPropertyDefault('activation');
                }
                
                if (!validatePropertyValue('activationTriggers', entity.activationTriggers)) {
                    entity.activationTriggers = getPropertyDefault('activationTriggers');
                }

                if (!validatePropertyValue('shinynessReceiveMode', entity.shinynessReceiveMode)) {
                    entity.shinynessReceiveMode = getPropertyDefault('shinynessReceiveMode');
                }

                if (!validatePropertyValue('connectible', entity.connectible)) {
                    entity.connectible = getPropertyDefault('connectible');
                }
                
                // Ensure referenceID property always exists
                if (entity.referenceID === undefined) {
                    entity.referenceID = null;
                }
                
                // NEW: Ensure collapsed property always exists
                if (entity.collapsed === undefined) {
                    entity.collapsed = false;
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
                            if (updates.name !== undefined) {
                                refCircle.name = entity.name;
                            }

                            if (updates.color !== undefined || updates.colors !== undefined) {
                                refCircle.color = entity.color;
                                refCircle.colors = [...entity.colors]; // Copy the array
                            }

                            if (updates.type !== undefined) {
                                refCircle.type = entity.type;
                                // Handle emoji for type changes
                                if (entity.type === 'emoji' && !refCircle.emoji) {
                                    refCircle.emoji = entity.emoji || 'A';
                                }
                            }

                            if (updates.emoji !== undefined) {
                                refCircle.emoji = entity.emoji;
                            }

                            if (updates.energyTypes !== undefined) {
                                refCircle.energyTypes = [...entity.energyTypes]; // Copy the array
                            }

                            // Handle all cycleable properties
                            ['activation', 'activationTriggers', 'shinynessReceiveMode', 'connectible'].forEach(prop => {
                                if (updates[prop] !== undefined) {
                                    refCircle[prop] = entity[prop];
                                }
                            });

                            if (updates.collapsed !== undefined) {
                                refCircle.collapsed = entity.collapsed;
                            }

                            // Ensure all properties exist with defaults
                            if (!refCircle.energyTypes) {
                                refCircle.energyTypes = [];
                            }
                            if (!validatePropertyValue('activation', refCircle.activation)) {
                                refCircle.activation = getPropertyDefault('activation');
                            }
                            if (!validatePropertyValue('activationTriggers', refCircle.activationTriggers)) {
                                refCircle.activationTriggers = getPropertyDefault('activationTriggers');
                            }
                            if (!validatePropertyValue('shinynessReceiveMode', refCircle.shinynessReceiveMode)) {
                                refCircle.shinynessReceiveMode = getPropertyDefault('shinynessReceiveMode');
                            }
                            if (!validatePropertyValue('connectible', refCircle.connectible)) {
                                refCircle.connectible = getPropertyDefault('connectible');
                            }
                            if (!refCircle.colors) {
                                refCircle.colors = [refCircle.color || '#4CAF50'];
                            }
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
            
            // Ensure all circles have the required properties
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

                // Ensure all cycleable properties exist with valid values
                if (!validatePropertyValue('connectible', circle.connectible)) {
                    circle.connectible = getPropertyDefault('connectible');
                }

                // Set default emoji for existing emoji-type circles that don't have one
                if (circle.type === 'emoji' && !circle.emoji) {
                    circle.emoji = 'A';
                }
                // Ensure energyTypes property exists for circles
                if (!circle.energyTypes) {
                    circle.energyTypes = [];
                }
                
                // Ensure all cycleable properties exist and are valid
                if (!validatePropertyValue('activation', circle.activation)) {
                    circle.activation = getPropertyDefault('activation');
                }
                if (!validatePropertyValue('activationTriggers', circle.activationTriggers)) {
                    circle.activationTriggers = getPropertyDefault('activationTriggers');
                }
                if (!validatePropertyValue('shinynessReceiveMode', circle.shinynessReceiveMode)) {
                    circle.shinynessReceiveMode = getPropertyDefault('shinynessReceiveMode');
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
        cycleCircleShinynessReceiveMode,
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
        cycleCircleProperty,
    };
}

export function useEntityStore() {
    if (!entityStoreInstance) {
        entityStoreInstance = createEntityStore();
    }
    return entityStoreInstance;
}
