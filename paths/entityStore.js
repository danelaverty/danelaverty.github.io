// entityStore.js - Enhanced with state-to-base property synchronization and defaultStateID
import { reactive } from './vue-composition-api.js';
import { getPropertyDefault, cycleProperty, validatePropertyValue, CYCLE_PROPERTY_CONFIGS } from './CBCyclePropertyConfigs.js';
import { getMoodValueForColor } from './colorFamilies.js';
import { enhanceEntityStoreWithMoodSystem } from './MoodValueSystem.js';

let entityStoreInstance = null;

// Base defaults for core circle properties (non-cycleable)
const BASE_CIRCLE_DEFAULTS = {
    colors: ['#B3B3B3'],
    secondaryColors: ['#B3B3B3'],
    energyTypes: [],
    secondaryName: '',
    moodValue: undefined,        // NEW: Mood value based on color
    secondaryMoodValue: undefined, // NEW: Mood value based on secondary color
    referenceID: null,
    documentReferenceID: null, // NEW: For document reference circles
    belongsToID: null,
    collapsed: false,
    type: 'basic',
    emoji: null,
    emojiForEmojiType: 'A',
    demandEmoji: null,
    sizeMode: () => getPropertyDefault('sizeMode'),
    manualWidth: null,
    manualHeight: null,
    states: () => ({
        0: {
            stateID: 0,
            name: '???',
            color: '#B3B3B3',
            circleEmoji: null,
            demandEmoji: null,
            causeEmoji: null,
            buoyancy: 'normal'
        }
    }),
    currentStateID: 0,
    defaultStateID: 0, // NEW: Default state designation
    nextStateID: 1,
    flippedStateID: null,
};

// Generate dynamic defaults by combining base defaults with cycleable properties
const generateCircleDefaults = () => {
    const defaults = { ...BASE_CIRCLE_DEFAULTS };
    
    // Add all cycleable properties with their defaults
    Object.keys(CYCLE_PROPERTY_CONFIGS).forEach(propertyName => {
        if (!defaults.hasOwnProperty(propertyName)) {
            defaults[propertyName] = () => getPropertyDefault(propertyName);
        }
    });
    
    return defaults;
};

// Generate the complete CIRCLE_DEFAULTS
const CIRCLE_DEFAULTS = generateCircleDefaults();

const SQUARE_DEFAULTS = {
    emoji: null,
    emojiKey: null,
    emojiCss: null,
    color: '#CCCCCC',
    bold: false,
    indicatorEmoji: null,
    presentationSequenceNumber: null,
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

// NEW: State-to-base property synchronization
const syncCurrentStateToBaseProperties = (circle) => {
    if (!circle.states || !circle.states[circle.currentStateID]) {
        return;
    }
    
    const currentState = circle.states[circle.currentStateID];
    
    // Sync state properties to base properties
    circle.name = currentState.name;
    circle.color = currentState.color;
    circle.circleEmoji = currentState.circleEmoji;
    circle.demandEmoji = currentState.demandEmoji;
    circle.demandEmojiAbsence = currentState.demandEmojiAbsence;
    circle.causeEmoji = currentState.causeEmoji;
    circle.causeEmojiAbsence = currentState.causeEmojiAbsence;
    circle.buoyancy = currentState.buoyancy;
    
    // Also update colors array to maintain compatibility with color system
    if (currentState.color) {
        circle.colors = [currentState.color];
    }
};

// NEW: Base-to-state property synchronization (inverse direction)
const syncBasePropertiesToCurrentState = (circle, updatedProperties) => {
    if (!circle.states || !circle.states[circle.currentStateID]) {
        return false;
    }
    
    const currentState = circle.states[circle.currentStateID];
    
    let stateUpdated = false;
    const newStateProperties = {};
    
    // Define the bidirectional property mappings
    const propertyMappings = {
        'name': 'name',
        'color': 'color',
        'colors': 'color', // colors[0] maps to state color
        'circleEmoji': 'circleEmoji',
        'demandEmoji': 'demandEmoji',
        'demandEmojiAbsence': 'demandEmojiAbsence',
        'causeEmoji': 'causeEmoji',
        'causeEmojiAbsence': 'causeEmojiAbsence',
        'buoyancy': 'buoyancy',
        'triggerAngle': 'triggerAngle',
    };
    
    Object.keys(propertyMappings).forEach(baseProperty => {
        const stateProperty = propertyMappings[baseProperty];
        
        if (updatedProperties.hasOwnProperty(baseProperty)) {
            let newValue = updatedProperties[baseProperty];
            
            // Special handling for colors array - use first color
            if (baseProperty === 'colors' && Array.isArray(newValue) && newValue.length > 0) {
                newValue = newValue[0];
            }
            
            // Only update if the value actually changed
            if (currentState[stateProperty] !== newValue) {
                newStateProperties[stateProperty] = newValue;
                stateUpdated = true;
            }
        }
    });
    
    // If any state properties need updating, create a new state object to trigger reactivity
    if (stateUpdated) {
        const oldStates = circle.states;
        circle.states = {
            ...circle.states,
            [circle.currentStateID]: {
                ...currentState,
                ...newStateProperties
            }
        };
    }
    
    return stateUpdated;
};

// Helper to ensure circle has all required properties with defaults
const ensureCircleDefaults = (circle, skipStateSync = false) => {
    if (!circle.states || typeof circle.states !== 'object') {
        circle.states = {
            0: {
                stateID: 0,
                name: '???',
                color: '#B3B3B3',
                circleEmoji: null,
                demandEmoji: null,
                causeEmoji: null,
                buoyancy: 'normal',
                triggerAngle: null,
            }
        };
    }

    // Ensure currentStateID exists and is valid
    if (circle.currentStateID === undefined || !circle.states[circle.currentStateID]) {
        const availableStateIDs = Object.keys(circle.states).map(id => parseInt(id));
        circle.currentStateID = availableStateIDs.length > 0 ? Math.min(...availableStateIDs) : 0;
    }

    // NEW: Ensure defaultStateID exists and is valid
    if (circle.defaultStateID === undefined || !circle.states[circle.defaultStateID]) {
        const availableStateIDs = Object.keys(circle.states).map(id => parseInt(id));
        circle.defaultStateID = availableStateIDs.length > 0 ? Math.min(...availableStateIDs) : 0;
    }

    // Ensure nextStateID exists
    if (circle.nextStateID === undefined) {
        const stateIDs = Object.keys(circle.states).map(id => parseInt(id));
        circle.nextStateID = stateIDs.length > 0 ? Math.max(...stateIDs) + 1 : 1;
    }

    Object.keys(CIRCLE_DEFAULTS).forEach(key => {
        const defaultValue = CIRCLE_DEFAULTS[key];
        const resolvedDefault = typeof defaultValue === 'function' ? defaultValue() : defaultValue;

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

        // Skip mood values - they're calculated by the mood system
        if (key === 'moodValue' || key === 'secondaryMoodValue') {
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
    
    // NEW: Only sync state to base if we're not in the middle of a base property update
    if (!skipStateSync) {
        syncCurrentStateToBaseProperties(circle);
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

    let moodSystem = null;

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

const processQueuedActivationChecks = (updateCallback = null) => {
    const circlesToCheck = Array.from(activationCheckQueue.keys());
    activationCheckQueue.clear();
    activationCheckTimeout = null;

    // Use provided callback or fallback to internal updateCircle
    const updateFn = updateCallback || updateCircle;

    circlesToCheck.forEach(circleId => {
        const circle = getCircle(circleId);
        if (!circle || circle.activationTriggers !== 'members' || circle.type !== 'group') return;
        
        // Only handle group activation logic here
        const memberCount = getCirclesBelongingToGroup(circleId).length;
        const shouldBeActivated = memberCount > 0;
        
        if (shouldBeActivated && circle.activation === 'inactive') {
            updateFn(circleId, { activation: 'activated' });
        } else if (!shouldBeActivated && circle.activation === 'activated') {
            updateFn(circleId, { activation: 'inactive' });
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
    if (!circle) return;
    
    // Handle member activation logic (immediate, regardless of activationTriggers)
    const isGroupMember = circle.belongsToID !== null;
    
    if (isGroupMember && circle.activation === 'inactive') {
        const updateFn = updateCallback || updateCircle;
        updateFn(circleId, { activation: 'activated' });
    } else if (!isGroupMember && circle.activation === 'activated') {
        const updateFn = updateCallback || updateCircle;
        updateFn(circleId, { activation: 'inactive' });
    }
    
    // Handle group activation logic (only if activationTriggers is 'members')
    if (circle.activationTriggers === 'members' && circle.type === 'group') {
        scheduleActivationCheck(circleId, updateCallback);
    }
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
            // Use the dynamic defaults system
            Object.keys(CIRCLE_DEFAULTS).forEach(key => {
                if (key === 'emojiForEmojiType') {
                    // Skip this as it's just a reference value, not a stored property
                    return;
                }
                
                entity[key] = getCircleDefault(key);
            });
            
            // Set circle type based on document's mostRecentlySetCircleType
            let defaultType = getCircleDefault('type');
            if (documentStore) {
                const recentType = documentStore.getMostRecentlySetCircleType(documentId);
                if (recentType) {
                    defaultType = recentType;
                }
            }
            entity.type = defaultType;
            
            // Set default emoji for emoji-type circles
            if (entity.type === 'emoji') {
                entity.emoji = getCircleDefault('emojiForEmojiType');
            }
            
            // Mood values will be calculated by the mood system after creation
            
            // NEW: Ensure state synchronization for new circles
            ensureCircleDefaults(entity);
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
        
        // Notify mood system of new circle creation
        if (entityType === 'circle' && moodSystem) {
            moodSystem.onCircleCreated(id);
        }
        
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

const setCircleBelongsTo = (circleId, groupId, updateCallback = null) => {
        const circle = data.circles.get(circleId);
        if (circle) {
            const oldGroupId = circle.belongsToID;
            circle.belongsToID = groupId;
            
            // Check member activation
            checkAndUpdateMemberActivation(circleId, updateCallback);
            if (groupId) {
                checkAndUpdateMemberActivation(groupId, updateCallback);
            }
            
            // Notify mood system
            if (moodSystem) {
                moodSystem.onCircleGroupMembershipChanged(circleId, oldGroupId, groupId);
            }
            
            return circle;
        }
        return null;
    };

const clearCircleBelongsTo = (circleId, updateCallback = null) => {
        const circle = data.circles.get(circleId);
        if (circle) {
            const formerGroupId = circle.belongsToID;
            circle.belongsToID = null;
            
            // Check member activation
            checkAndUpdateMemberActivation(circleId, updateCallback);
            if (formerGroupId) {
                checkAndUpdateMemberActivation(formerGroupId, updateCallback);
            }
            
            // Notify mood system
            if (moodSystem) {
                moodSystem.onCircleGroupMembershipChanged(circleId, formerGroupId, null);
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
        if (!entity) return null;

        if (entityType !== 'circle') {
            Object.assign(entity, updates);
            return entity;
        }

        // For circles, track what changed for mood system notification
        const oldColors = entity.colors ? [...entity.colors] : undefined;
        const oldSecondaryColors = entity.secondaryColors ? [...entity.secondaryColors] : undefined;
        const oldType = entity.type;
        const oldBelongsToID = entity.belongsToID;
        const oldCurrentStateID = entity.currentStateID;

        // NEW: Determine sync strategy before applying updates
        const stateIDChanged = updates.currentStateID !== undefined && updates.currentStateID !== oldCurrentStateID;
        const statesUpdated = updates.states !== undefined;
        const isBasePropertyUpdate = !stateIDChanged && !statesUpdated;

        // Handle document reference circle name protection
        if (entity.documentReferenceID !== null && updates.name !== undefined) {
            const filteredUpdates = { ...updates };
            delete filteredUpdates.name;
            Object.assign(entity, filteredUpdates);
        } else {
            Object.assign(entity, updates);
        }

        // NEW: Skip state sync in ensureCircleDefaults if this is a base property update
        ensureCircleDefaults(entity, isBasePropertyUpdate);

        // Handle emoji when type changes to/from 'emoji'
        if (updates.type === 'emoji' && !entity.emoji) {
            entity.emoji = getCircleDefault('emojiForEmojiType');
        }

        // NEW: Handle bidirectional state synchronization
        
        // If currentStateID changed or states were directly updated, sync state to base
        if (stateIDChanged || statesUpdated) {
            syncCurrentStateToBaseProperties(entity);
        } 
        // If base properties were updated (and it wasn't a state sync operation), sync base to state
        else {
            const basePropertiesUpdated = syncBasePropertiesToCurrentState(entity, updates);
        }

        // Cascade to circle references (not document references)
        if (entity.referenceID === null && entity.documentReferenceID === null) {
            const referencedCircles = getReferencedCircles(id);

            if (referencedCircles.length > 0) {
                referencedCircles.forEach(refCircle => {
                    if (updates.name !== undefined) {
                        refCircle.name = entity.name;
                    }

                    if (updates.colors !== undefined) {
                        refCircle.colors = [...entity.colors];
                    }

                    if (updates.secondaryColors !== undefined) {
                        refCircle.secondaryColors = [...entity.secondaryColors];
                    }

                    if (updates.type !== undefined) {
                        refCircle.type = entity.type;
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
                    Object.keys(CYCLE_PROPERTY_CONFIGS).forEach(prop => {
                        if (updates[prop] !== undefined) {
                            refCircle[prop] = entity[prop];
                        }
                    });

                    if (updates.collapsed !== undefined) {
                        refCircle.collapsed = entity.collapsed;
                    }
                    
                    // NEW: Also sync state changes to referenced circles
                    if (updates.currentStateID !== undefined) {
                        refCircle.currentStateID = entity.currentStateID;
                        syncCurrentStateToBaseProperties(refCircle);
                    }
                    
                    // NEW: Sync defaultStateID to referenced circles
                    if (updates.defaultStateID !== undefined) {
                        refCircle.defaultStateID = entity.defaultStateID;
                    }
                    
                    if (updates.states !== undefined) {
                        refCircle.states = JSON.parse(JSON.stringify(entity.states)); // Deep copy
                        syncCurrentStateToBaseProperties(refCircle);
                    }
                    
                    // NEW: If base properties were updated, sync those to referenced circle states too
                    if (!stateIDChanged && !statesUpdated) {
                        syncBasePropertiesToCurrentState(refCircle, updates);
                    }

                    // NEW: Use skipStateSync for referenced circles too during base property updates
                    ensureCircleDefaults(refCircle, isBasePropertyUpdate);
                });

                // Notify mood system about referenced circle updates
                if (moodSystem) {
                    referencedCircles.forEach(refCircle => {
                        if (updates.colors !== undefined || stateIDChanged || statesUpdated) {
                            moodSystem.onCircleColorsChanged(refCircle.id);
                        }
                        if (updates.type !== undefined) {
                            moodSystem.onCircleTypeChanged(refCircle.id);
                        }
                    });
                }
            }
        }

        // Notify mood system of relevant changes
        if (moodSystem) {
            const colorsChanged = updates.colors !== undefined && 
                JSON.stringify(updates.colors) !== JSON.stringify(oldColors);
            const secondaryColorsChanged = updates.secondaryColors !== undefined && 
                JSON.stringify(updates.secondaryColors) !== JSON.stringify(oldSecondaryColors);
            const typeChanged = updates.type !== undefined && updates.type !== oldType;
            const membershipChanged = updates.belongsToID !== undefined && updates.belongsToID !== oldBelongsToID;
            
            // NEW: Also trigger mood updates when state changes affect color
            const stateColorChanged = (stateIDChanged || statesUpdated) && 
                entity.states && entity.states[entity.currentStateID];

            if (colorsChanged || secondaryColorsChanged || stateColorChanged) {
                moodSystem.onCircleColorsChanged(id);
            }
            if (typeChanged) {
                moodSystem.onCircleTypeChanged(id);
            }
            if (membershipChanged) {
                moodSystem.onCircleGroupMembershipChanged(id, oldBelongsToID, updates.belongsToID);
            }
        }

        return entity;
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
    
const deleteCircle = (id, updateCallback = null) => {
        const circle = getCircle(id);
        if (!circle) return false;
        
        // Track info for mood system and activation logic
        const formerGroupId = circle.belongsToID;
        const wasGroup = circle.type === 'group';
        let formerMembers = [];
        
        if (wasGroup) {
            formerMembers = getCirclesBelongingToGroup(id);
        }
        
        // Convert references to normal circles
        if (circle.referenceID === null) {
            const referencedCircles = getReferencedCircles(id);
            referencedCircles.forEach(refCircle => {
                refCircle.referenceID = null;
            });
        }
        
        // Delete the circle
        const deleted = data.circles.delete(id);
        
        if (deleted) {
            // Handle member activation after deletion
            if (formerGroupId) {
                checkAndUpdateMemberActivation(formerGroupId, updateCallback);
            }
            
            if (wasGroup && formerMembers.length > 0) {
                formerMembers.forEach(member => {
                    member.belongsToID = null;
                    checkAndUpdateMemberActivation(member.id, updateCallback);
                });
            }
            
            // Notify mood system
            if (moodSystem) {
                moodSystem.onCircleDeleted(id, !!formerGroupId, wasGroup);
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

    // Enhanced serialization that includes all dynamic properties
    const serialize = () => ({
        circles: Array.from(data.circles.entries()),
        squares: Array.from(data.squares.entries()),
        nextCircleId: data.nextCircleId,
        nextSquareId: data.nextSquareId
    });

const deserialize = (savedData) => {
        if (savedData.circles) {
            data.circles = new Map(savedData.circles);
            
            // Ensure all circles have required properties with defaults
            data.circles.forEach((circle, id) => {
                ensureCircleDefaults(circle);
            });
        }
        if (savedData.squares) {
            data.squares = new Map(savedData.squares);
            
            // Ensure all squares have required properties with defaults
            data.squares.forEach((square, id) => {
                ensureSquareDefaults(square);
            });
        }
        if (savedData.nextCircleId) data.nextCircleId = savedData.nextCircleId;
        if (savedData.nextSquareId) data.nextSquareId = savedData.nextSquareId;

        // After deserializing, recalculate all mood values
        if (moodSystem) {
            moodSystem.recalculateNow();
        }
    };

const entityStore = {
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
        // Document reference utilities
        isDocumentReferenceCircle,
        getDocumentReferenceCircles,
        // Group utilities
        toggleGroupCollapsed,
        getCirclesBelongingToGroup,
        setCircleBelongsTo,
        clearCircleBelongsTo,
        // Activation utilities
        cycleCircleActivation,
        cycleCircleActivationTriggers,
        cycleCircleShinynessReceiveMode,
        cycleCircleConnectible,
        checkAndUpdateMemberActivation,
        cycleCircleProperty,
        // Utilities
        generateRandomPosition,
        // Serialization
        serialize,
        deserialize,
        // NEW: State synchronization utilities (for debugging/admin use)
        syncCurrentStateToBaseProperties,
        syncBasePropertiesToCurrentState
    };

    // Initialize and enhance entity store with mood system
    moodSystem = enhanceEntityStoreWithMoodSystem(entityStore);

    // Start the mood system
    moodSystem.start();

    return entityStore;
}

export function useEntityStore() {
    if (!entityStoreInstance) {
        entityStoreInstance = createEntityStore();
    }
    return entityStoreInstance;
}
