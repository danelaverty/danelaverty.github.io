// GroupResizeHandles.js - Resize handles for group circles (FIXED: handles now track container size)
import { ref, onMounted, onUnmounted, computed } from './vue-composition-api.js';
import { injectComponentStyles } from './styleUtils.js';

const resizeHandleStyles = `
    .group-resize-handles {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }
    
    .group-resize-handle {
        position: absolute;
        width: 12px;
        height: 12px;
        background: rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(0, 0, 0, 0.5);
        border-radius: 2px;
        pointer-events: auto;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
    }
    
    .group-circle-container:hover .group-resize-handle,
    .group-resize-handle.dragging {
        opacity: 0;
    }
    
    .group-resize-handle:hover {
        background: rgba(255, 255, 255, 1);
        transform: scale(1.2);
    }
    
    /* Corner handles - use calc for dynamic positioning */
    .group-resize-handle.nw {
        cursor: nwse-resize;
    }
    
    .group-resize-handle.ne {
        cursor: nesw-resize;
    }
    
    .group-resize-handle.sw {
        cursor: nesw-resize;
    }
    
    .group-resize-handle.se {
        cursor: nwse-resize;
    }
    
    /* Edge handles */
    .group-resize-handle.n {
        cursor: ns-resize;
    }
    
    .group-resize-handle.s {
        cursor: ns-resize;
    }
    
    .group-resize-handle.e {
        cursor: ew-resize;
    }
    
    .group-resize-handle.w {
        cursor: ew-resize;
    }
`;

injectComponentStyles('group-resize-handles', resizeHandleStyles);

export const GroupResizeHandles = {
    props: {
        circle: {
            type: Object,
            required: true
        }
    },
    
    emits: ['resize-start', 'resize-move', 'resize-end'],
    
    setup(props, { emit }) {
        const containerRef = ref(null);
        const handleRefs = ref({});
        const resizing = ref(false);
        const currentHandle = ref(null);
        const startPos = ref({ x: 0, y: 0 });
        const startSize = ref({ width: 0, height: 0 });
        
        // Computed styles for each handle based on current container size
        const handleStyles = computed(() => {
            // Use circle's manual dimensions if available, otherwise fallback to 32px
            const width = props.circle.manualWidth || 32;
            const height = props.circle.manualHeight || 32;
            
            const offset = -6; // Half of handle size (12px / 2)
            
            return {
                nw: {
                    top: `${offset}px`,
                    left: `${offset}px`
                },
                ne: {
                    top: `${offset}px`,
                    left: `${width + offset}px`
                },
                sw: {
                    top: `${height + offset}px`,
                    left: `${offset}px`
                },
                se: {
                    top: `${height + offset}px`,
                    left: `${width + offset}px`
                },
                n: {
                    top: `${offset}px`,
                    left: `${width / 2 + offset}px`
                },
                s: {
                    top: `${height + offset}px`,
                    left: `${width / 2 + offset}px`
                },
                e: {
                    top: `${height / 2 + offset}px`,
                    left: `${width + offset}px`
                },
                w: {
                    top: `${height / 2 + offset}px`,
                    left: `${offset}px`
                }
            };
        });
        
        const handleMouseDown = (e, handleType) => {
            if (e.button !== 0) return; // Only left click
            
            e.preventDefault();
            e.stopPropagation();
            
            resizing.value = true;
            currentHandle.value = handleType;
            startPos.value = { x: e.clientX, y: e.clientY };
            
            // Get current size from the circle props (which reflect the current state)
            startSize.value = {
                width: props.circle.manualWidth || 32,
                height: props.circle.manualHeight || 32
            };
            
            emit('resize-start', { handleType });
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };
        
	    const handleMouseMove = (e) => {
    if (!resizing.value) return;
    
    // Double the delta to compensate for translate(-50%, -50%) centering
    const deltaX = (e.clientX - startPos.value.x) * 2;
    const deltaY = (e.clientY - startPos.value.y) * 2;
    
    let newWidth = startSize.value.width;
    let newHeight = startSize.value.height;
    
    const handle = currentHandle.value;
    
    // Calculate new dimensions based on handle direction
    if (handle.includes('e')) newWidth += deltaX;
    if (handle.includes('w')) newWidth -= deltaX;
    if (handle.includes('s')) newHeight += deltaY;
    if (handle.includes('n')) newHeight -= deltaY;
    
    // Enforce minimum size
    const minSize = 32;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);
    
    emit('resize-move', {
        width: newWidth,
        height: newHeight,
        handleType: handle
    });
};

const handleMouseUp = (e) => {
    if (!resizing.value) return;
    
    // Double the delta to compensate for translate(-50%, -50%) centering
    const deltaX = (e.clientX - startPos.value.x) * 2;
    const deltaY = (e.clientY - startPos.value.y) * 2;
    
    let newWidth = startSize.value.width;
    let newHeight = startSize.value.height;
    
    const handle = currentHandle.value;
    
    if (handle.includes('e')) newWidth += deltaX;
    if (handle.includes('w')) newWidth -= deltaX;
    if (handle.includes('s')) newHeight += deltaY;
    if (handle.includes('n')) newHeight -= deltaY;
    
    const minSize = 32;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);
    
    emit('resize-end', {
        width: newWidth,
        height: newHeight,
        handleType: handle
    });
    
    resizing.value = false;
    currentHandle.value = null;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
};
        
        onUnmounted(() => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        });
        
        return {
            containerRef,
            handleRefs,
            handleMouseDown,
            handleStyles,
            resizing
        };
    },
    
    template: `
        <div class="group-resize-handles" ref="containerRef" v-if="circle.sizeMode === 'manual'">
            <!-- Corner handles -->
            <div 
                class="group-resize-handle nw"
                :class="{ dragging: resizing }"
                :style="handleStyles.nw"
                @mousedown="(e) => handleMouseDown(e, 'nw')"
            ></div>
            <div 
                class="group-resize-handle ne"
                :class="{ dragging: resizing }"
                :style="handleStyles.ne"
                @mousedown="(e) => handleMouseDown(e, 'ne')"
            ></div>
            <div 
                class="group-resize-handle sw"
                :class="{ dragging: resizing }"
                :style="handleStyles.sw"
                @mousedown="(e) => handleMouseDown(e, 'sw')"
            ></div>
            <div 
                class="group-resize-handle se"
                :class="{ dragging: resizing }"
                :style="handleStyles.se"
                @mousedown="(e) => handleMouseDown(e, 'se')"
            ></div>
            
            <!-- Edge handles -->
            <div 
                class="group-resize-handle n"
                :class="{ dragging: resizing }"
                :style="handleStyles.n"
                @mousedown="(e) => handleMouseDown(e, 'n')"
            ></div>
            <div 
                class="group-resize-handle s"
                :class="{ dragging: resizing }"
                :style="handleStyles.s"
                @mousedown="(e) => handleMouseDown(e, 's')"
            ></div>
            <div 
                class="group-resize-handle e"
                :class="{ dragging: resizing }"
                :style="handleStyles.e"
                @mousedown="(e) => handleMouseDown(e, 'e')"
            ></div>
            <div 
                class="group-resize-handle w"
                :class="{ dragging: resizing }"
                :style="handleStyles.w"
                @mousedown="(e) => handleMouseDown(e, 'w')"
            ></div>
        </div>
    `
};
