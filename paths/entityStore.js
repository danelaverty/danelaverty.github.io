// entityStore.js
import { reactive } from './vue-composition-api.js';
import { getPropertyDefault, cycleProperty, validatePropertyValue } from './CBCyclePropertyConfigs.js';

let entityStoreInstance = null;

// CENTRALIZED DEFAULT VALUES
const CIRCLE_DEFAULTS = {
    color: '#CCCCCC',
    colors: ['#B3B3B3'],
    energyTypes: [],
    activation: () => getPropertyDefault('activation'),
    activationTriggers: () => getPropertyDefault('activationTriggers'),
    shinynessReceiveMode: () => getPropertyDefault('shinynessReceiveMode'),
    connectible: () => getPropertyDefault('connectible'),
    sizeMode: () => getPropertyDefault('sizeMode'),
    manualWidth: null,
    manualHeight: null,
    referenceID: null,
    documentReferenceID: null, // NEW: For document reference circles
    belongsToID: null,
    collapsed: false,
    type: 'basic',
    emoji: null,
    emojiForEmojiType: 'A',
};

const SQUARE_DEFAULTS = {
    emoji: null,
    emojiKey: null,
    emojiCss: null,
    color: '#CCCCCC',
    bold: false,
    indicatorEmoji: null
};

// Helper to get circle default (handles both values and functions)
const getCircleDefault = (key) => {
    const value = CIRCLE_DEFAULTS[key];
    return typeof value === 'function' ? value() : value;
};

// Helper to get square default
const getSquareDefault = (key) => {
    return SQUARE_DEFAULTS[key];
};

// Helper to ensure circle has all required properties with defaults
const ensureCircleDefaults = (circle) => {
    // Dynamically ensure all properties from CIRCLE_DEFAULTS exist with proper values
    Object.keys(CIRCLE_DEFAULTS).forEach(key => {
        const defaultValue = CIRCLE_DEFAULTS[key];
        const resolvedDefault = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        
        // Special handling for colors array
        if (key === 'colors') {
            if (!circle.colors) {
                circle.colors = circle.color ? [circle.color] : [...resolvedDefault];
            }
            return;
        }
        
        // Special handling for color (should sync with colors[0])
        if (key === 'color') {
            if (!circle.color) {
                circle.color = circle.colors?.[0] || resolvedDefault;
            }
            return;
        }
        
        // Special handling for emoji based on type
        if (key === 'emoji') {
            if (circle.emoji === undefined) {
                circle.emoji = circle.type === 'emoji' && !circle.emoji 
                    ? getCircleDefault('emojiForEmojiType') 
                    : resolvedDefault;
            }
            return;
        }
        
        // Skip emojiForEmojiType as it's just a default constant, not a stored property
        if (key === 'emojiForEmojiType') {
            return;
        }
        
        // For cycleable properties, validate the value
        if (validatePropertyValue(key, circle[key])) {
            // Value is valid, keep it
            return;
        }
        
        // For all other properties, set if undefined or invalid
        if (circle[key] === undefined) {
            circle[key] = Array.isArray(resolvedDefault) ? [...resolvedDefault] : resolvedDefault;
        }
    });
    
    // Handle color/colors synchronization (if one was updated but not the other)
    if (circle.colors && circle.colors.length > 0 && !circle.color) {
        circle.color = circle.colors[0];
    }
    if (circle.color && (!circle.colors || circle.colors.length === 0)) {
        circle.colors = [circle.color];
    }
};

// Helper to ensure square has all required properties with defaults
const ensureSquareDefaults = (square) => {
    if (square.emoji === undefined) {
        square.emoji = getSquareDefault('emoji');
    }
    if (square.emojiKey === undefined) {
        square.emojiKey = getSquareDefault('emojiKey');
    }
    if (square.emojiCss === undefined) {
        square.emojiCss = getSquareDefault('emojiCss');
    }
    if (!square.color) {
        square.color = getSquareDefault('color');
    }
    if (square.bold === undefined) {
        square.bold = getSquareDefault('bold');
    }
    if (square.indicatorEmoji === undefined) {
        square.indicatorEmoji = getSquareDefault('indicatorEmoji');
    }
};

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
                    updateFn(circleId, { activation: 'inactive' });
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
            entity.color = getCircleDefault('color');
            entity.colors = [...getCircleDefault('colors')];
            entity.energyTypes = [...getCircleDefault('energyTypes')];
            entity.activation = getCircleDefault('activation');
            entity.activationTriggers = getCircleDefault('activationTriggers');
            entity.shinynessReceiveMode = getCircleDefault('shinynessReceiveMode');
            entity.connectible = getCircleDefault('connectible');
            entity.referenceID = getCircleDefault('referenceID');
            entity.documentReferenceID = getCircleDefault('documentReferenceID'); // NEW
            entity.belongsToID = getCircleDefault('belongsToID');
            entity.collapsed = getCircleDefault('collapsed');
            
            // Set circle type based on document's mostRecentlySetCircleType
            let defaultType = getCircleDefault('type');
            if (documentStore) {
                const recentType = documentStore.getMostRecentlySetCircleType(documentId);
                if (recentType) {
                    defaultType = recentType;
                }
            }
            entity.type = defaultType;
            
            // Add emoji property
            entity.emoji = getCircleDefault('emoji');
            
            // Set default emoji for emoji-type circles
            if (entity.type === 'emoji') {
                entity.emoji = getCircleDefault('emojiForEmojiType');
            }
        }

        // Add square-specific properties
        if (entityType === 'square') {
            entity.emoji = getSquareDefault('emoji');
            entity.emojiKey = getSquareDefault('emojiKey');
            entity.emojiCss = getSquareDefault('emojiCss');
            entity.color = getSquareDefault('color');
            entity.bold = getSquareDefault('bold');
            entity.indicatorEmoji = getSquareDefault('indicatorEmoji');
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
            
            // Cascade to referenced circles (but NOT to document reference circles)
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
            // NEW: Prevent name updates for document reference circles
            if (entityType === 'circle' && entity.documentReferenceID !== null && updates.name !== undefined) {
                // Don't allow direct name updates for document reference circles
                // Name should only be updated via document name changes
                const filteredUpdates = { ...updates };
                delete filteredUpdates.name;
                Object.assign(entity, filteredUpdates);
            } else {
                Object.assign(entity, updates);
            }
            
            // For circles, ensure all properties have defaults
            if (entityType === 'circle') {
                // If colors array is updated but color is not, update primary color
                if (updates.colors && !updates.color && updates.colors.length > 0) {
                    entity.color = updates.colors[0];
                }
                // If color is updated but colors array is not, update colors array
                if (updates.color && !updates.colors) {
                    entity.colors = [updates.color];
                }
                
                // Ensure all required properties exist with defaults
                ensureCircleDefaults(entity);
                
                // Handle emoji when type changes to/from 'emoji'
                if (updates.type === 'emoji' && !entity.emoji) {
                    entity.emoji = getCircleDefault('emojiForEmojiType');
                } else if (updates.type && updates.type !== 'emoji') {
                    // Don't clear emoji when changing away from emoji type - keep it for future use
                }

                // NEW: Only cascade to circle references (referenceID), not document references (documentReferenceID)
                if (entityType === 'circle' && entity.referenceID === null && entity.documentReferenceID === null) {
                    // This is an original circle (not a reference), cascade changes to its circle references
                    const referencedCircles = getReferencedCircles(id);

                    if (referencedCircles.length > 0) {
                        referencedCircles.forEach(refCircle => {
                            if (updates.name !== undefined) {
                                refCircle.name = entity.name;
                            }

                            if (updates.color !== undefined || updates.colors !== undefined) {
                                refCircle.color = entity.color;
                                refCircle.colors = [...entity.colors];
                            }

                            if (updates.type !== undefined) {
                                refCircle.type = entity.type;
                                // Handle emoji for type changes
                                if (entity.type === 'emoji' && !refCircle.emoji) {
                                    refCircle.emoji = entity.emoji || getCircleDefault('emojiForEmojiType');
                                }
                            }

                            if (updates.emoji !== undefined) {
                                refCircle.emoji = entity.emoji;
                            }

                            if (updates.energyTypes !== undefined) {
                                refCircle.energyTypes = [...entity.energyTypes];
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

                            // Ensure all referenced circles have required properties with defaults
                            ensureCircleDefaults(refCircle);
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

    // NEW: Utility function for documentReferenceID
    const isDocumentReferenceCircle = (id) => {
        const circle = getCircle(id);
        return circle && circle.documentReferenceID !== null;
    };

    const getReferencedCircles = (originalCircleId) => {
        return Array.from(data.circles.values()).filter(circle => circle.referenceID === originalCircleId);
    };

    // NEW: Get all circles that reference a specific document
    const getDocumentReferenceCircles = (documentId) => {
        return Array.from(data.circles.values()).filter(circle => circle.documentReferenceID === documentId);
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
            
            // Ensure all circles have the required properties with defaults
            data.circles.forEach((circle, id) => {
                ensureCircleDefaults(circle);
            });
        }
        if (savedData.squares) {
            data.squares = new Map(savedData.squares);
            
            // Ensure all squares have the required properties with defaults
            data.squares.forEach((square, id) => {
                ensureSquareDefaults(square);
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
        // NEW: Document reference utilities
        isDocumentReferenceCircle,
        getDocumentReferenceCircles,
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
