// dataCoordinator.js - Enhanced with auto-creation of roil members and MoodValueSystem integration
import { useEntityStore } from './entityStore.js';
import { useDocumentStore } from './documentStore.js';
import { useUIStore } from './uiStore.js';
import { EntityService } from './entityService.js';
import { ExplicitConnectionService } from './ExplicitConnectionService.js';
import { getRecentEmojisStoreInstance } from './useRecentEmojis.js';
import { useClipboardStore } from './clipboardStore.js';
import { cycleProperty, CYCLE_PROPERTY_CONFIGS } from './CBCyclePropertyConfigs.js';

let dataCoordinatorInstance = null;

function createDataCoordinator() {
    const entityStore = useEntityStore();
    const documentStore = useDocumentStore();
    const uiStore = useUIStore();
    const storageKey = `circleApp_${window.location.pathname}`;

    // NEW: Connect entityStore and documentStore references
    documentStore.setEntityStoreRef(entityStore);

    // Automaton trigger function (set by CircleViewer)
    let automatonTrigger = null;
    
    const setAutomatonTrigger = (triggerFn) => {
        automatonTrigger = triggerFn;
    };
    
    const triggerAutomatonIfActive = () => {
        if (automatonTrigger) {
            automatonTrigger();
        }
    };

    // 1. Create a placeholder for saveToStorage that will be set later
    let saveToStorageRef = null;
    
    // 2. Create dataCoordinatorRef with a function that calls the reference
    const dataCoordinatorRef = {
        getCircle: (id) => entityStore.getCircle(id),
        getSquare: (id) => entityStore.getSquare(id),
        getCirclesForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? entityStore.getCirclesForDocument(documentId) : [];
        },
        saveToStorage: () => saveToStorageRef() // Call through reference
    };
    
    // 3. Create services
    const explicitConnectionService = new ExplicitConnectionService(dataCoordinatorRef);
    const entityService = new EntityService(explicitConnectionService);
    
    // 4. Now define the actual saveToStorage function
    const saveToStorage = () => {
        try {
            const recentEmojisStore = getRecentEmojisStoreInstance();
            const dataToSave = {
                ...entityStore.serialize(),
                ...documentStore.serialize(),
                ...uiStore.serialize(),
                ...recentEmojisStore.serialize(),
                explicitConnections: explicitConnectionService.serialize()
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    };
    
    // 5. Set the reference to point to the actual function
    saveToStorageRef = saveToStorage;
    
    const loadFromStorage = () => {
        try {
            const recentEmojisStore = getRecentEmojisStoreInstance();
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const savedData = JSON.parse(saved);
                entityStore.deserialize(savedData);
                documentStore.deserialize(savedData);
                uiStore.deserialize(savedData);
                recentEmojisStore.deserialize(savedData);
                
                // Load explicit connections after entities are loaded
                if (savedData.explicitConnections) {
                    explicitConnectionService.deserialize(savedData.explicitConnections);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
        }
        return false;
    };

    const initializeApp = () => {
        const loaded = loadFromStorage();
        const allDocs = documentStore.getAllCircleDocuments();
        const hasDaily = allDocs.some(doc => doc.name === 'Dailies');
        const hasLandscapes = allDocs.some(doc => doc.name === 'Landscapes');

        if (!hasDaily) { documentStore.createCircleDocument('Dailies'); }
        if (!hasLandscapes) { documentStore.createCircleDocument('Landscapes'); }
        
        if (!loaded) {
            saveToStorage();
        }
    };

    // Initialize the app
    initializeApp();

    // Create wrapper methods that add persistence AND automaton triggering to service calls
    const withPersistence = (serviceMethod) => {
        return (...args) => {
            const result = serviceMethod.apply(entityService, args);
            if (result !== false && result !== null) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        };
    };

  const updateCircle = (id, updates) => {
        const circle = entityStore.getCircle(id);
        if (!circle) return null;
        
        // Track activation changes for exciter logic
        const oldActivation = circle.activation;
        
        const result = entityStore.updateCircle(id, updates);
        
        if (result) {
            // NEW: Handle exciter buoyancy updates
            const newActivation = result.activation;
            const activationChanged = oldActivation !== newActivation;
            const isExciter = result.energyTypes && result.energyTypes.includes('exciter');
            
            if (activationChanged && isExciter) {
                updateBuoyancyForConnectedCircles(id, newActivation);
            }
            
            saveToStorage();
            triggerAutomatonIfActive();
        }
        return result;
    };

const updateBuoyancyForConnectedCircles = (exciterId, newActivation) => {
        // Get all connections where this exciter is the source
        const connections = explicitConnectionService.getConnectionsForEntity(exciterId);
        
        connections.forEach(connection => {
            let targetCircleId = null;
            
            // Determine if this exciter is the source based on connection directionality
            if (connection.entity1Id === exciterId) {
                // Exciter is entity1
                const directionality = connection.directionality || 'none';
                if (directionality === 'out' || directionality === 'both' || directionality === 'none') {
                    targetCircleId = connection.entity2Id;
                }
            } else if (connection.entity2Id === exciterId) {
                // Exciter is entity2  
                const directionality = connection.directionality || 'none';
                if (directionality === 'in' || directionality === 'both' || directionality === 'none') {
                    targetCircleId = connection.entity1Id;
                }
            }
            
            if (targetCircleId) {
                const targetCircle = entityStore.getCircle(targetCircleId);
                if (targetCircle) {
                    let newBuoyancy;
                    
                    if (newActivation === 'activated') {
                        newBuoyancy = 'buoyant';
                    } else if (newActivation === 'inactive' || newActivation === 'inert') {
                        newBuoyancy = 'antibuoyant';
                    } else {
                        // Handle any other activation states by defaulting to antibuoyant
                        newBuoyancy = 'antibuoyant';
                    }
                    
                    // Update the target circle's buoyancy
                    // Use entityStore.updateCircle directly to avoid infinite recursion
                    entityStore.updateCircle(targetCircleId, { buoyancy: newBuoyancy });
                }
                console.log(targetCircle.buoyancy);
            }
        });
    };

    // UPDATED: Simplified createRoilMembersIfNeeded - mood system handles everything
    const createRoilMembersIfNeeded = (groupId, newRoilMode) => {
        // Only create members when switching TO roil mode
        if (newRoilMode !== 'on') return;
        
        const group = entityStore.getCircle(groupId);
        if (!group || group.type !== 'group') return;

        // Check if group has no members
        const existingMembers = entityStore.getCirclesBelongingToGroup(groupId);
        if (existingMembers.length > 0) return;
        
        const targetDocumentId = group.documentId;
        if (!targetDocumentId) {
            console.warn('Group has no documentId:', groupId);
            return;
        }
        
        // Create 4 glow circles as members
        const groupColor = group.colors?.[0] || group.color || '#4CAF50';
        
        for (let i = 0; i < 4; i++) {
            // Generate random offset from -8 to +8
            const offsetX = (Math.random() - 0.5) * 16;
            const offsetY = (Math.random() - 0.5) * 16;
            
            // Create the circle
            const newCircle = entityStore.createCircle(targetDocumentId, 800, 600, documentStore);
            
            // Set its properties
            entityStore.updateCircle(newCircle.id, {
                name: '', // Blank name as requested
                type: 'glow',
                colors: [groupColor],
                color: groupColor, // Fallback for older code
                x: group.x + offsetX,
                y: group.y + offsetY,
                belongsToID: groupId
            });
        }
        
        // No manual mood value recalculation needed - the mood system 
        // automatically handles this through the updateCircle calls above
    };

    // Enhanced cycle function that handles roil member creation
    const cycleCircleProperty = (id, propertyName) => {
        const circle = entityStore.getCircle(id);
        if (!circle) return null;
        
        // Get the new value after cycling
        const oldValue = circle[propertyName];
        const newValue = cycleProperty(propertyName, oldValue);
        
        // Use entityStore's cycle function
        const result = entityStore.cycleCircleProperty(id, propertyName);
        
        // NEW: Handle roil mode activation
        if (result && propertyName === 'roilMode') {
            createRoilMembersIfNeeded(id, newValue);
        }
        
        if (result) {
            saveToStorage();
            triggerAutomatonIfActive();
        }
        return result;
    };

    // Dynamically generate cycle methods for all cycleable properties
    const generateCycleMethods = () => {
        const methods = {};
        
        Object.keys(CYCLE_PROPERTY_CONFIGS).forEach(propertyName => {
            // Convert camelCase to function name: sizeMode -> cycleSizeMode
            const methodName = `cycle${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
            methods[methodName] = (id) => cycleCircleProperty(id, propertyName);
        });
        
        return methods;
    };

    // Generate all cycle methods dynamically
    const cycleMethods = generateCycleMethods();

    // NEW: Mood system utilities for the API
    const recalculateMoodValues = () => {
        const result = entityStore.recalculateMoodValues();
        if (result && result.changedCircles > 0) {
            saveToStorage();
            triggerAutomatonIfActive();
        }
        return result;
    };

    // Return unified API that combines data access with business logic
    return {
        // Raw data access (for templates that need reactive refs)
        data: {
            get circleViewers() { return uiStore.data.circleViewers; },
            get viewerOrder() { return uiStore.data.viewerOrder; },
            get selectedViewerId() { return uiStore.data.selectedViewerId; },
            get currentSquareDocumentId() { return documentStore.data.currentSquareDocumentId; },
            get selectedCircleIds() { return uiStore.data.selectedCircleIds; },
            get selectedSquareIds() { return uiStore.data.selectedSquareIds; }
        },

        // Business operations (with persistence and automaton triggering)
        createCircleInViewer: withPersistence(entityService.createCircleInViewer.bind(entityService)),
        createSquare: withPersistence(entityService.createSquare.bind(entityService)),
        selectCircle: withPersistence(entityService.selectCircle.bind(entityService)),
        selectSquare: withPersistence(entityService.selectSquare.bind(entityService)),
        deleteCircleDocument: withPersistence(entityService.deleteCircleDocument.bind(entityService)),
        selectAllCirclesInViewer: withPersistence(entityService.selectAllCirclesInViewer.bind(entityService)),
        selectAllSquaresInDocument: withPersistence(entityService.selectAllSquaresInDocument.bind(entityService)),
        moveSelectedCircles: withPersistence(entityService.moveSelectedCircles.bind(entityService)),
        moveSelectedSquares: withPersistence(entityService.moveSelectedSquares.bind(entityService)),
        deleteCircle: withPersistence(entityService.deleteCircle.bind(entityService)),
        deleteSquare: withPersistence(entityService.deleteSquare.bind(entityService)),
        deleteSelectedCircles: withPersistence(entityService.deleteSelectedCircles.bind(entityService)),
        deleteSelectedSquares: withPersistence(entityService.deleteSelectedSquares.bind(entityService)),

        // Simple entity operations (direct store access with persistence and automaton triggering)
        updateCircle: updateCircle,
        updateSquare: (id, updates) => {
            const result = entityStore.updateSquare(id, updates);
            if (result) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        },

        // Group collapsed operations
        toggleGroupCollapsed: (id) => {
            const result = entityStore.toggleGroupCollapsed(id);
            if (result) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        },

        // Enhanced generic property cycling operation with roil member creation
        cycleCircleProperty: cycleCircleProperty,

        // Dynamically generated cycle methods (e.g., cycleActivation, cycleSizeMode, cycleRoilMode, etc.)
        ...cycleMethods,

        // Read operations (no persistence needed)
        getCircle: entityStore.getCircle,
        getSquare: entityStore.getSquare,
        getCirclesForDocument: entityStore.getCirclesForDocument,
        getSquaresForDocument: entityStore.getSquaresForDocument,
        getCirclesForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? entityStore.getCirclesForDocument(documentId) : [];
        },

        // Document operations (with persistence)
        createCircleDocument: (name, parentId = null) => {
            const doc = documentStore.createCircleDocument(name, parentId);
            saveToStorage();
            return doc;
        },
        createSquareDocument: (circleId, name) => {
            const doc = documentStore.createSquareDocument(circleId, name);
            saveToStorage();
            return doc;
        },
        updateCircleDocumentName: (id, name) => {
            const result = documentStore.updateCircleDocumentName(id, name);
            if (result) saveToStorage();
            return result;
        },
        updateCircleDocumentPin: (id, isPinned) => {
            const result = documentStore.updateCircleDocumentPin(id, isPinned);
            if (result) saveToStorage();
            return result;
        },
        updateCircleDocumentParent: (id, parentId) => {
            const result = documentStore.updateCircleDocumentParent(id, parentId);
            if (result) saveToStorage();
            return result;
        },
        reorderCircleDocument: (docId, targetDocId, position) => {
            const result = documentStore.reorderCircleDocument(docId, targetDocId, position);
            if (result) saveToStorage();
            return result;
        },
        updateSquareDocumentName: (id, name) => {
            const result = documentStore.updateSquareDocumentName(id, name);
            if (result) saveToStorage();
            return result;
        },
        deleteSquareDocument: (id) => {
            const result = documentStore.deleteSquareDocument(id);
            if (result) saveToStorage();
            return result;
        },
        // Use EntityService method for square document switching to prevent connection flash
        setCurrentSquareDocument: withPersistence(entityService.setCurrentSquareDocument.bind(entityService)),
        setCircleDocumentForViewer: (viewerId, documentId) => {
            const success = uiStore.setCircleDocumentForViewer(viewerId, documentId, documentStore);
            if (success) {
                saveToStorage();
            }
            return success;
        },
        
        // Circle type tracking methods
        setMostRecentlySetCircleType: (documentId, circleType) => {
            const result = documentStore.setMostRecentlySetCircleType(documentId, circleType);
            if (result) saveToStorage();
            return result;
        },
        getMostRecentlySetCircleType: documentStore.getMostRecentlySetCircleType,

        // Document read operations
        getAllCircleDocuments: documentStore.getAllCircleDocuments,
        getFlattenedDocumentsWithHierarchy: documentStore.getFlattenedDocumentsWithHierarchy,
        getDocumentHierarchy: documentStore.getDocumentHierarchy,
        getChildDocuments: documentStore.getChildDocuments,
        isDescendantOf: documentStore.isDescendantOf,
        getSquareDocumentsForCircle: documentStore.getSquareDocumentsForCircle,
        getCurrentSquareDocument: documentStore.getCurrentSquareDocument,
        getCircleDocumentForViewer: (viewerId) => {
            const documentId = uiStore.getCircleDocumentForViewer(viewerId);
            return documentId ? documentStore.getCircleDocument(documentId) : null;
        },

        // Viewer properties operations (with persistence)
        updateCircleDocumentViewerProperties: (id, properties) => {
            const result = documentStore.updateCircleDocumentViewerProperties(id, properties);
            if (result) saveToStorage();
            return result;
        },
        getCircleDocumentViewerProperties: documentStore.getCircleDocumentViewerProperties,

        updateCircleDocumentShinyCircles: (id, shinyCircles) => {
            const result = documentStore.updateCircleDocumentShinyCircles(id, shinyCircles);
            if (result) saveToStorage();
            return result;
        },
        getShinyCirclesForDocument: documentStore.getShinyCirclesForDocument,

        // Viewer operations (with persistence and property coordination)
        createCircleViewer: (width, documentId) => {
            const viewer = uiStore.createCircleViewer(width, documentId);
            saveToStorage();
            return viewer;
        },
        updateCircleViewer: (id, updates) => {
            const result = uiStore.updateCircleViewer(id, updates, documentStore);
            if (result) saveToStorage();
            return result;
        },
        deleteCircleViewer: (id) => {
            const deleted = uiStore.deleteCircleViewer(id);
            if (deleted) {
                saveToStorage();
            }
            return deleted;
        },
        reorderViewers: (fromIndex, toIndex) => {
            const result = uiStore.reorderViewers(fromIndex, toIndex);
            if (result) saveToStorage();
            return result;
        },
        setSelectedViewer: (viewerId) => {
            const result = uiStore.setSelectedViewer(viewerId);
            if (result) saveToStorage();
            return result;
        },

        // Enhanced viewer read operations that include properties from documents
        getVisibleCircleViewers: () => {
            const viewers = uiStore.getVisibleCircleViewers();
            return viewers.map(viewer => {
                const properties = uiStore.getViewerProperties(viewer.id, documentStore);
                return {
                    ...viewer,
                    width: properties.width,
                    showBackground: properties.showBackground
                };
            });
        },
        getViewerTitle: (viewerId) => uiStore.getViewerTitle(viewerId, documentStore),
        isViewerSelected: uiStore.isViewerSelected,
        getViewerProperties: (viewerId) => uiStore.getViewerProperties(viewerId, documentStore),

        // Selection read operations
        isCircleSelected: uiStore.isCircleSelected,
        isSquareSelected: uiStore.isSquareSelected,
        getSelectedCircles: uiStore.getSelectedCircles,
        getSelectedSquares: uiStore.getSelectedSquares,
        hasMultipleCirclesSelected: uiStore.hasMultipleCirclesSelected,
        hasMultipleSquaresSelected: uiStore.hasMultipleSquaresSelected,

        // Direct storage access
        saveToStorage,

        getCirclesBelongingToGroup: entityStore.getCirclesBelongingToGroup,
        setCircleBelongsTo: (circleId, groupId) => {
            const result = entityStore.setCircleBelongsTo(circleId, groupId, updateCircle);
            if (result) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        },
        clearCircleBelongsTo: (circleId) => {
            const result = entityStore.clearCircleBelongsTo(circleId, updateCircle);
            if (result) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        },

        // Explicit connection operations (with persistence and automaton triggering)
        getExplicitConnectionBetweenEntities: explicitConnectionService.getConnectionBetweenEntities.bind(explicitConnectionService),
        updateExplicitConnectionProperty: (connectionId, propertyName, value) => {
            const result = explicitConnectionService.updateConnectionProperty(connectionId, propertyName, value);
            if (result) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        },

        toggleDemoMode: () => {
            const result = uiStore.toggleDemoMode();
            saveToStorage();
            return result;
        },
        isDemoMode: uiStore.isDemoMode,

        // Automaton trigger management
        setAutomatonTrigger,

        getGlobalProperty: uiStore.getGlobalProperty,
        setGlobalProperty: (propertyKey, value) => {
            const result = uiStore.setGlobalProperty(propertyKey, value);
            if (result) saveToStorage();
            return result;
        },
        toggleGlobalProperty: (propertyKey) => {
            const result = uiStore.toggleGlobalProperty(propertyKey);
            saveToStorage();
            return result;
        },
        getAllGlobalProperties: uiStore.getAllGlobalProperties,

        // NEW: Mood system utilities
        recalculateMoodValues: recalculateMoodValues,
        getMoodSystemStatus: () => entityStore.getMoodSystemStatus(),
        validateMoodValues: () => entityStore.validateMoodValues(),

        // NEW: Advanced mood system operations for debugging/admin use
        forceMoodRecalculation: () => {
            // Force immediate synchronous recalculation
            const result = entityStore.moodSystem.recalculateNow();
            if (result && result.changedCircles > 0) {
                saveToStorage();
                triggerAutomatonIfActive();
            }
            return result;
        },

        getMoodValueForCircle: (circleId) => {
            const circle = entityStore.getCircle(circleId);
            return circle ? entityStore.moodSystem.calculateMoodValue(circle) : undefined;
        },

        getDependentCircles: (circleId) => {
            return entityStore.moodSystem.getDependentCircles(circleId);
        },

// NEW: Mood system utilities
recalculateMoodValues: recalculateMoodValues,
getMoodSystemStatus: () => entityStore.getMoodSystemStatus(),
validateMoodValues: () => entityStore.validateMoodValues(),

// NEW: Mood system listener management (for seismographs)
addMoodSystemListener: (callback) => entityStore.moodSystem?.addListener(callback),
removeMoodSystemListener: (callback) => entityStore.moodSystem?.removeListener(callback),
startMoodSystem: () => entityStore.moodSystem?.start(),
stopMoodSystem: () => entityStore.moodSystem?.stop(),
setMoodUpdateInterval: (intervalMs) => entityStore.moodSystem?.setUpdateInterval(intervalMs),

// NEW: Direct mood system reference for components that need it
get moodSystem() { return entityStore.moodSystem; },
    };
}

export function useDataStore() {
    if (!dataCoordinatorInstance) {
        dataCoordinatorInstance = createDataCoordinator();
    }
    return dataCoordinatorInstance;
}

// NEW: Enhanced debugging utilities that work with the mood system
if (typeof window !== 'undefined') {
    window.moodDebug = {
        status: () => {
            const dataStore = useDataStore();
            return dataStore.getMoodSystemStatus();
        },

        validate: () => {
            const dataStore = useDataStore();
            const issues = dataStore.validateMoodValues();
            if (issues.length > 0) {
                console.table(issues);
                console.warn(`Found ${issues.length} mood value inconsistencies`);
            } else {
                console.log('✅ All mood values are correct');
            }
            return issues;
        },

        recalculate: () => {
            const dataStore = useDataStore();
            const result = dataStore.forceMoodRecalculation();
            console.log(`Recalculated mood values for ${result.changedCircles}/${result.totalCircles} circles`);
            return result;
        },

        showGroupMoods: () => {
            const dataStore = useDataStore();
            // Get current document (you might need to adapt this based on your UI state)
            const viewers = dataStore.getVisibleCircleViewers();
            if (viewers.length === 0) {
                console.log('No viewers available');
                return [];
            }
            
            const circles = dataStore.getCirclesForViewer(viewers[0].id);
            const groups = circles.filter(c => c.type === 'group');
            
            const groupInfo = groups.map(group => {
                const members = dataStore.getCirclesBelongingToGroup(group.id);
                const memberMoods = members.map(m => ({
                    name: m.name || '(unnamed)',
                    mood: m.moodValue,
                    colors: m.colors
                }));
                
                return {
                    groupName: group.name,
                    groupMood: group.moodValue,
                    memberCount: members.length,
                    members: memberMoods,
                    calculatedMood: dataStore.getMoodValueForCircle(group.id)
                };
            });
            
            console.table(groupInfo);
            return groupInfo;
        },

        testScenario: () => {
            console.log('🧪 Testing mood value scenario...');
            
            const dataStore = useDataStore();
            const viewers = dataStore.getVisibleCircleViewers();
            if (viewers.length === 0) {
                console.error('No viewers available for testing');
                return;
            }
            
            // Create a test group
            const group = dataStore.createCircleInViewer(viewers[0].id, 400, 300);
            dataStore.updateCircle(group.id, { 
                name: 'Test Group',
                type: 'group',
                colors: ['hsl(0, 0%, 70%)'] // Neutral color
            });
            
            console.log(`Created group ${group.id} with mood: ${group.moodValue}`);
            
            // Create test members with different moods
            const member1 = dataStore.createCircleInViewer(viewers[0].id, 380, 280);
            dataStore.updateCircle(member1.id, {
                name: 'Happy Member',
                colors: ['hsl(48, 100%, 50%)'], // Great = 1.0
                belongsToID: group.id
            });
            
            const member2 = dataStore.createCircleInViewer(viewers[0].id, 420, 280);
            dataStore.updateCircle(member2.id, {
                name: 'Sad Member', 
                colors: ['hsl(0, 100%, 60%)'], // Bad = 0.3
                belongsToID: group.id
            });
            
            // Check final group mood
            const finalGroup = dataStore.getCircle(group.id);
            const expectedMood = (1.0 + 0.3) / 2; // 0.65
            
            console.log(`Group mood after adding members: ${finalGroup.moodValue}`);
            console.log(`Expected mood: ${expectedMood}`);
            console.log(`Match: ${Math.abs(finalGroup.moodValue - expectedMood) < 0.01 ? '✅' : '❌'}`);
            
            return {
                groupId: group.id,
                groupMood: finalGroup.moodValue,
                expectedMood: expectedMood,
                members: [
                    { id: member1.id, mood: member1.moodValue },
                    { id: member2.id, mood: member2.moodValue }
                ]
            };
        },

        cleanup: () => {
            // Clean up test circles (delete all circles with "Test" in the name)
            const dataStore = useDataStore();
            const viewers = dataStore.getVisibleCircleViewers();
            if (viewers.length === 0) return;
            
            const circles = dataStore.getCirclesForViewer(viewers[0].id);
            const testCircles = circles.filter(c => c.name.includes('Test'));
            
            testCircles.forEach(circle => {
                dataStore.deleteCircle(circle.id);
            });
            
            console.log(`Cleaned up ${testCircles.length} test circles`);
            return testCircles.length;
        }
    };
}
