// CircleViewerEventHandlers.js - Updated with config-driven roil member creation
import { roilAddMemberControlsConfig, isValidMemberType, getMemberTypeStates } from './roilMemberConfig.js';

export function useCircleViewerEventHandlers(props, emit, dataStore) {

    // Entity event handlers
    const handleCircleSelect = (id, isCtrlClick = false) => {
        // Handle CTRL-click on reference circles
        if (isCtrlClick) {
            const circle = dataStore.getCircle(id);
            if (circle && circle.referenceID) {
                const referencedCircleId = circle.referenceID;
                
                // Find which document contains the referenced circle
                const allCircleDocuments = dataStore.getAllCircleDocuments();
                let referencedDocumentId = null;
                
                for (const doc of allCircleDocuments) {
                    const circlesInDoc = dataStore.getCirclesForDocument(doc.id);
                    if (circlesInDoc.some(c => c.id === referencedCircleId)) {
                        referencedDocumentId = doc.id;
                        break;
                    }
                }
                
                if (!referencedDocumentId) {
                    console.warn(`Referenced circle ${referencedCircleId} not found in any document`);
                    return;
                }
                
                // Check if referenced circle is already visible in a viewer
                const allViewers = Array.from(dataStore.data.circleViewers.values());
                let targetViewer = null;
                
                for (const viewer of allViewers) {
                    const viewerDoc = dataStore.getCircleDocumentForViewer(viewer.id);
                    if (!viewerDoc) { break; }
                    const viewerDocId = viewerDoc.id
                    if (viewerDocId === referencedDocumentId) {
                        targetViewer = viewer;
                        break;
                    }
                }
                
                if (targetViewer) {
                    dataStore.selectCircle(referencedCircleId, targetViewer.id, false);
                    dataStore.setSelectedViewer(targetViewer.id);
                } else {
                    const newViewer = dataStore.createCircleViewer();
                    dataStore.setCircleDocumentForViewer(newViewer.id, referencedDocumentId);
                    dataStore.selectCircle(referencedCircleId, newViewer.id, false);
                    dataStore.setSelectedViewer(newViewer.id);
                }
                return;
            }
        }
        
        // Normal selection
        dataStore.selectCircle(id, props.viewerId, isCtrlClick);
    };

    const handleCirclePositionUpdate = ({ id, x, y }) => {
        dataStore.updateCircle(id, { x, y });
    };

    const handleCircleNameUpdate = ({ id, name }) => {
        dataStore.updateCircle(id, { name });
    };

    const handleMoveMultiple = ({ entityType, deltaX, deltaY }) => {
        if (entityType === 'circle') {
            dataStore.moveSelectedCircles(deltaX, deltaY);
        }
    };

    // NEW: Helper function to create roil member with config-driven states
    const createRoilMemberWithStates = (memberType, selectedGroup) => {
        const statesConfig = getMemberTypeStates(memberType);
        if (!statesConfig) {
            console.warn(`No configuration found for member type: ${memberType}`);
            return null;
        }

        const circle = dataStore.createCircleInViewer(props.viewerId);
        if (!circle) return null;

        // Generate random offset
        const offsetX = Math.floor(Math.random() * 31) - 15; // -15 to +15
        const offsetY = Math.floor(Math.random() * 31) - 15; // -15 to +15

        // Create states object based on config
        const states = {};
        statesConfig.forEach((stateConfig, index) => {
            states[index] = {
                stateID: index,
                name: '',
                color: stateConfig.color,
                circleEmoji: null,
                demandEmoji: null,
                causeEmoji: null,
                buoyancy: stateConfig.buoyancy,
                triggerAngle: stateConfig.triggerAngle || null,
            };
        });

        // First update with basic properties using the first state's config
        const firstState = statesConfig[0];
        dataStore.updateCircle(circle.id, {
            name: '',
            type: 'glow',
            x: selectedGroup.x + offsetX,
            y: selectedGroup.y + offsetY,
            colors: [firstState.color],
            color: firstState.color, // Fallback for older code
            buoyancy: firstState.buoyancy,
            belongsToID: selectedGroup.id,
            triggerAngle: firstState.triggerAngle || null,
            
            // Set up the states system
            states: states,
            currentStateID: 0,
            defaultStateID: 0,
            nextStateID: statesConfig.length,
            flippedStateID: statesConfig.length > 1 ? 1 : null // Only if there's a second state
        });

        return circle;
    };

    const handleAddCircle = (eventData) => {
        const isRoilGroup = eventData?.entityType === 'roilGroup';
        const isRoilMember = eventData?.entityType === 'roilMember';
        const memberType = eventData?.memberType;
        
        if (isRoilGroup) {
            // Create a roil group
            const circle = dataStore.createCircleInViewer(props.viewerId);
            if (circle) {
                dataStore.selectCircle(circle.id);
                // Convert to group with roilMode on
                dataStore.updateCircle(circle.id, {
                    type: 'group',
                    roilMode: 'on',
                    roilAngle: 'side',
                    roilSpeed: '3',
                    name: '',
                    secondaryColorDescent: 'shiftToSecondary', // This might be removable in future
                });
            }
            return circle;
        } else if (isRoilMember && memberType) {
            // NEW: Create a roil member using config
            const selectedCircles = dataStore.getSelectedCircles();
            
            if (selectedCircles.length !== 1) {
                return null;
            }
            
            const selectedGroup = dataStore.getCircle(selectedCircles[0]);
            
            if (selectedGroup.type !== 'group' || selectedGroup.roilMode !== 'on') {
                return null;
            }

            return createRoilMemberWithStates(memberType, selectedGroup);
            
        } else if (isRoilMember) {
            // LEGACY: Handle old-style roilMember calls (for backward compatibility)
            // This maintains the existing "normal" member behavior
            const selectedCircles = dataStore.getSelectedCircles();
            
            if (selectedCircles.length !== 1) {
                return null;
            }
            
            const selectedGroup = dataStore.getCircle(selectedCircles[0]);
            
            if (selectedGroup.type !== 'group' || selectedGroup.roilMode !== 'on') {
                return null;
            }

            return createRoilMemberWithStates('normal', selectedGroup);
        } else {
            // Regular circle creation (existing logic)
            const circle = dataStore.createCircleInViewer(props.viewerId);
            if (circle) {
                dataStore.selectCircle(circle.id);
            }
            return circle;
        }
    };

    const handleCircleDocumentChange = (documentId) => {
        if (documentId) {
            dataStore.setCircleDocumentForViewer(props.viewerId, documentId);
        }
        dataStore.data.selectedCircleId = null;
        dataStore.data.selectedSquareId = null;
        dataStore.setCurrentSquareDocument(null);
    };

    const handleShowDropdown = (config) => {
        emit('show-dropdown', config);
    };

    // Factory functions that accept selection dependencies
const createHandleViewerClick = (hasRectangleSelected) => (e) => {
    if (hasRectangleSelected()) return;
    
    if (e.target.classList.contains('viewer-content')) {
        dataStore.selectCircle(null, props.viewerId, false);
        
        // NEW: Auto-select single roil circle if it exists (with small delay)
        setTimeout(() => {
            if (dataStore.getSelectedCircles().length === 0) {
                const doc = dataStore.getCircleDocumentForViewer(props.viewerId);
                if (doc) {
                    const documentId = doc.id;
                    const circles = dataStore.getCirclesForDocument(documentId);
                    const roilCircles = circles.filter(circle => 
                        circle.type === 'group' && circle.roilMode === 'on'
                    );
                    
                    if (roilCircles.length === 1) {
                        dataStore.selectCircle(roilCircles[0].id, props.viewerId, false);
                    }
                }
            }
        }, 0);
    }
};

    const createHandleViewerContainerClick = (hasRectangleSelected) => (e) => {
        const shouldClearEntities = !hasRectangleSelected();
        
        if (e.target.classList.contains('circle-viewer') || 
            e.target.classList.contains('viewer-content')) {
            
            dataStore.setSelectedViewer(props.viewerId);
            emit('viewer-click', props.viewerId);
            
            if (shouldClearEntities && e.target.classList.contains('viewer-content')) {
                dataStore.selectCircle(null, props.viewerId, false);
            }
        }
    };

    const handleStartReorder = (e) => {
        emit('start-reorder', { viewerId: props.viewerId, event: e });
    };

    const handleCloseViewer = () => {
        emit('close-viewer', props.viewerId);
    };

    return {
        handleCircleSelect,
        handleCirclePositionUpdate,
        handleCircleNameUpdate,
        handleMoveMultiple,
        handleAddCircle,
        handleCircleDocumentChange,
        handleShowDropdown,
        createHandleViewerClick,
        createHandleViewerContainerClick,
        handleStartReorder,
        handleCloseViewer
    };
}
