// useDraggable.js - Draggable functionality composable
import { onMounted, onUnmounted } from './vue-composition-api.js';

export function useDraggable(element, onDragEnd, containerGetter = null) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;

    const getContainerOffset = () => {
        let container;
        if (typeof containerGetter === 'function') {
            container = containerGetter();
        } else {
            container = containerGetter;
        }
        
        if (!container) return { left: 0, top: 0 };
        const containerRect = container.getBoundingClientRect();
        return { left: containerRect.left, top: containerRect.top };
    };

    const handleMouseDown = (e) => {
        if (e.target.hasAttribute('contenteditable')) return;

        isDragging = true;
        element.value.classList.add('dragging');

        const rect = element.value.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const containerOffset = getContainerOffset();
        const x = e.clientX - offsetX - containerOffset.left;
        const y = e.clientY - offsetY - containerOffset.top;

        element.value.style.left = `${x}px`;
        element.value.style.top = `${y}px`;
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;

        isDragging = false;
        element.value.classList.remove('dragging');

        if (onDragEnd) {
            const containerOffset = getContainerOffset();
            const x = e.clientX - offsetX - containerOffset.left;
            const y = e.clientY - offsetY - containerOffset.top;
            onDragEnd(x, y);
        }
    };

    onMounted(() => {
        if (element.value) {
            element.value.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    });

    onUnmounted(() => {
        if (element.value) {
            element.value.removeEventListener('mousedown', handleMouseDown);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    return {
        isDragging: () => isDragging
    };
}
