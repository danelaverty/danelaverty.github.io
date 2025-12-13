// CircleViewerEventHandlers.js - All event handlers and entity interactions
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

const handleAddCircle = (eventData) => {
    const isRoilGroup = eventData?.entityType === 'roilGroup';
    const isRoilMember = eventData?.entityType === 'roilMember';
    const isAngryMember = eventData?.entityType === 'angryMember';
    
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
                secondaryColorDescent: 'shiftToSecondary',
            });
        }
        return circle;
    } else if (isRoilMember) {
        // Create a roil member
        const selectedCircles = dataStore.getSelectedCircles();
        
        if (selectedCircles.length !== 1) {
            return null;
        }
        
        const selectedGroup = dataStore.getCircle(selectedCircles[0]);
        
        if (selectedGroup.type !== 'group' || selectedGroup.roilMode !== 'on') {
            return null;
        }
        
        const circle = dataStore.createCircleInViewer(props.viewerId);
        if (circle) {
            // Generate random offset
            const offsetX = Math.floor(Math.random() * 31) - 15; // -15 to +15
            const offsetY = Math.floor(Math.random() * 31) - 15; // -15 to +15
            
            dataStore.updateCircle(circle.id, {
                name: '',
                type: 'glow',
                x: selectedGroup.x + offsetX,
                y: selectedGroup.y + offsetY,
                colors: ['hsl(0, 100%, 80%)'],
                secondaryColors: ['hsl(48, 100%, 80%)'],
                belongsToID: selectedGroup.id
            });
        }
        return circle;
    } else if (isAngryMember) {
        // Create an angry member (similar to roil member but with different properties)
        const selectedCircles = dataStore.getSelectedCircles();
        
        if (selectedCircles.length !== 1) {
            return null;
        }
        
        const selectedGroup = dataStore.getCircle(selectedCircles[0]);
        
        if (selectedGroup.type !== 'group' || selectedGroup.roilMode !== 'on') {
            return null;
        }
        
        const circle = dataStore.createCircleInViewer(props.viewerId);
        if (circle) {
            // Generate random offset
            const offsetX = Math.floor(Math.random() * 31) - 15; // -15 to +15
            const offsetY = Math.floor(Math.random() * 31) - 15; // -15 to +15
            
            dataStore.updateCircle(circle.id, {
                name: '',
                type: 'glow',
                x: selectedGroup.x + offsetX,
                y: selectedGroup.y + offsetY,
                buoyancy: 'buoyant',
                colors: ['hsl(0, 100%, 60%)'],
                secondaryColors: ['hsl(0, 100%, 60%)'],
                belongsToID: selectedGroup.id
            });
        }
        return circle;
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
