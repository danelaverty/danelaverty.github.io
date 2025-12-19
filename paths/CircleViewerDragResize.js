// CircleViewerDragResize.js - Drag/drop operations and resize functionality
import { ref, computed } from './vue-composition-api.js';
import { roilMotionSystem } from './RoilMotionCore.js'; 

export function useCircleViewerDragResize(props, emit, viewerRef, viewerWidth, dataStore) {
    const isResizing = ref(false);
    const resizeStart = ref({ x: 0, width: 0 });

    // Drag state computed properties
    const isBeingDragged = computed(() => {
        return props.dragState.isDragging && props.dragState.draggedViewerId === props.viewerId;
    });

    const isDropTarget = computed(() => {
        return props.dragState.isDragging && 
               props.dragState.draggedViewerId !== props.viewerId &&
               props.dragState.dropTarget === props.viewerId;
    });

    const dropTargetSide = computed(() => {
        if (!isDropTarget.value) return null;
        return props.dragState.dropSide || 'right';
    });

    // Drag and Drop Event Handlers
    const handleDragEnter = (e) => {
        if (!props.dragState.isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const rect = viewerRef.value.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const dropSide = mouseX < rect.width / 2 ? 'left' : 'right';
        
        emit('drag-enter', {
            targetViewerId: props.viewerId,
            dropSide: dropSide
        });
    };

    const handleDragOver = (e) => {
        if (!props.dragState.isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Update drop side based on mouse position
        const rect = viewerRef.value.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const dropSide = mouseX < rect.width / 2 ? 'left' : 'right';
        
        emit('drag-enter', {
            targetViewerId: props.viewerId,
            dropSide: dropSide
        });
    };

    const handleDragLeave = (e) => {
        if (!props.dragState.isDragging) return;
        
        // Only emit drag-leave if we're actually leaving the viewer
        const rect = viewerRef.value.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            emit('drag-leave', {
                targetViewerId: props.viewerId
            });
        }
    };

    const handleDrop = (e) => {
        if (!props.dragState.isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const rect = viewerRef.value.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const dropSide = mouseX < rect.width / 2 ? 'left' : 'right';
        
        emit('drop', {
            targetViewerId: props.viewerId,
            draggedViewerId: props.dragState.draggedViewerId,
            dropSide: dropSide
        });
    };

    // Resize functionality
    const startResize = (e) => {
        // Prevent resizing during drag operations
        if (props.dragState.isDragging) {
            e.preventDefault();
            return;
        }
        
        isResizing.value = true;
        viewerRef.value.classList.add('resizing');
        resizeStart.value = {
            x: e.clientX,
            width: viewerWidth.value
        };
        e.preventDefault();
    };

    const handleResize = (e) => {
        if (!isResizing.value || props.dragState.isDragging) return;
        
        const deltaX = e.clientX - resizeStart.value.x;
        const newWidth = Math.max(100, Math.min(3600, resizeStart.value.width + deltaX));
        
        // Update the viewer properties via the data store
        dataStore.updateCircleViewer(props.viewerId, { width: newWidth });

        roilMotionSystem.updateViewerWidth(props.viewerId, newWidth);

        emit('resize', { viewerId: props.viewerId, width: newWidth });
    };

    const endResize = () => {
        isResizing.value = false;
        if (viewerRef.value) {
            viewerRef.value.classList.remove('resizing');
        }
    };

    const onMounted = () => {
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', endResize);
    };

    const onUnmounted = () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', endResize);
    };

    return {
        isResizing,
        isBeingDragged,
        isDropTarget,
        dropTargetSide,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        startResize,
        onMounted,
        onUnmounted
    };
}
