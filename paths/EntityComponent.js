// EntityComponent.js - Reusable entity component for circles and squares
import { ref, nextTick, onMounted } from './vue-composition-api.js';
import { useDraggable } from './useDraggable.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
const componentStyles = `
    .entity-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: move;
        user-select: none;
    }

    .entity-shape {
        width: 60px;
        height: 60px;
        margin-bottom: 5px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .circle-shape {
        border-radius: 50%;
        background-color: #4CAF50;
        border: 3px solid #45a049;
    }

    .square-shape {
        background-color: #FF6B6B;
        border: 3px solid #FF5252;
    }

    .entity-shape.selected {
        border-color: #ffff00;
        box-shadow: 0 0 10px #ffff00;
    }

    .entity-shape.highlight {
        animation: highlight 1s ease-in-out;
    }

    @keyframes highlight {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .entity-name {
        color: white;
        font-size: 14px;
        text-align: center;
        min-width: 60px;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: text;
        transition: background-color 0.2s ease;
    }

    .square-name {
        max-width: 120px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .entity-name[contenteditable="true"] {
        background-color: #333;
        outline: 1px solid #666;
    }

    .dragging {
        opacity: 0.8;
        z-index: 999;
    }
`;

injectComponentStyles('entity-component', componentStyles);

export const EntityComponent = {
    props: {
        entity: Object,
        entityType: String,
        isSelected: Boolean
    },
    emits: ['select', 'update-position', 'update-name'],
    setup(props, { emit }) {
        const elementRef = ref(null);
        const nameRef = ref(null);
        const isEditing = ref(false);
        const originalName = ref('');

        const onDragEnd = (x, y) => {
            emit('update-position', { id: props.entity.id, x, y });
        };

        // Find the correct container for this entity
        const getContainer = () => {
            if (props.entityType === 'square') {
                return document.querySelector('.square-viewer-content');
            } else {
                // For circles, find the viewer-content that contains this element
                return elementRef.value?.closest('.viewer-content');
            }
        };

        useDraggable(elementRef, onDragEnd, getContainer);

        const handleClick = () => {
            emit('select', props.entity.id);
        };

        const startNameEdit = () => {
            if (!nameRef.value) return;
            isEditing.value = true;
            originalName.value = props.entity.name;
            nameRef.value.contentEditable = true;
            nameRef.value.focus();

            nextTick(() => {
                const range = document.createRange();
                range.selectNodeContents(nameRef.value);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });
        };

        const finishNameEdit = () => {
            if (!nameRef.value) return;
            isEditing.value = false;
            nameRef.value.contentEditable = false;
            const newName = nameRef.value.textContent.trim() || '???';
            
            if (newName !== props.entity.name) {
                emit('update-name', { id: props.entity.id, name: newName });
            }
            nameRef.value.textContent = newName;
        };

        const cancelNameEdit = () => {
            if (!nameRef.value) return;
            isEditing.value = false;
            nameRef.value.contentEditable = false;
            nameRef.value.textContent = originalName.value;
        };

        const handleNameClick = (e) => {
            e.stopPropagation();
            startNameEdit();
        };

        const handleNameKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameRef.value.blur();
            } else if (e.key === 'Escape') {
                cancelNameEdit();
            }
        };

        return {
            elementRef,
            nameRef,
            isEditing,
            handleClick,
            handleNameClick,
            handleNameKeydown,
            finishNameEdit
        };
    },
    template: `
        <div 
            ref="elementRef"
            class="entity-container"
            :style="{ left: entity.x + 'px', top: entity.y + 'px' }"
            @click="handleClick"
        >
            <div 
                :class="[
                    'entity-shape',
                    entityType + '-shape',
                    { selected: isSelected }
                ]"
            ></div>
            <div 
                ref="nameRef"
                :class="['entity-name', entityType + '-name']"
                @click="handleNameClick"
                @blur="finishNameEdit"
                @keydown="handleNameKeydown"
            >{{ entity.name }}</div>
        </div>
    `
};
