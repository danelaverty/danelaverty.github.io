// DocumentsDock.js - Main DocumentsDock component (Updated with hover events for viewer highlighting)
import { onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { DocumentIconControls } from './DocumentIconControlsComponent.js';
import { createDocumentsDockState } from './DocumentsDockState.js';
import { createDocumentsDockHandlers } from './DocumentsDockHandlers.js';
import { createDocumentsDockResize } from './DocumentsDockResize.js';
import { initializeDocumentsDockStyles } from './DocumentsDockStyles.js';

// Initialize styles when component is imported
initializeDocumentsDockStyles();

export const DocumentsDock = {
    emits: ['create-viewer-for-document', 'document-hover', 'document-hover-end'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        // Create state and handlers
        const dockState = createDocumentsDockState();
        const handlers = createDocumentsDockHandlers(dockState, emit);
        const resize = createDocumentsDockResize();

        // Document hover handlers
        const handleDocumentHover = (documentId) => {
            emit('document-hover', documentId);
        };

        const getEnergizedCirclesForDocument = (documentId) => {
            return dataStore.getEnergizedCirclesForDocument(documentId);
        };

        const handleDocumentHoverEnd = () => {
            emit('document-hover-end');
        };

        onMounted(() => {
            resize.initializeResize();
        });

        onUnmounted(() => {
            resize.cleanupResize();
        });

        return {
            // Expose all state and handlers
            ...dockState,
            ...handlers,
            // Resize functionality
            ...resize,
            // New hover handlers
            handleDocumentHover,
            handleDocumentHoverEnd,
            getEnergizedCirclesForDocument,
        };
    },
    components: {
        DocumentIconControls
    },
template: `
        <div 
            ref="dockRef"
            :class="['documents-dock', { 
                hidden: !hasDocuments, 
                collapsed: isDockCollapsed,
                'dock-drop-target': isDockDropTarget,
                'dock-drop-invalid': isDockDropInvalid
            }]"
            @dragover="handleDockDragOver"
            @dragenter="handleDockDragEnter"
            @dragleave="handleDockDragLeave"
            @drop="handleDockDrop"
        >
            <template v-for="(doc, index) in allDocuments" :key="doc.id">
                <!-- Drop zone before this document (only if first in level) -->
                <div
                    v-if="isFirstInLevel(doc, index)"
                    :class="['drop-zone', getDropZoneClass(doc), {
                        'drop-zone-active': isDropZoneActive('before-' + doc.id)
                    }]"
                    :data-drop-id="'before-' + doc.id"
                    :data-parent-id="doc.parentId || 'root'"
                    @dragover="handleDropZoneDragOver($event, 'before', doc.id)"
                    @dragenter="handleDropZoneDragEnter($event, 'before', doc.id)"
                    @dragleave="handleDropZoneDragLeave($event)"
                    @drop="handleDropZoneDrop($event, 'before', doc.id)"
                ></div>

                <!-- Document Icon -->
                <div 
                    :class="[
                        'document-icon', 
                        getDocumentNestingClass(doc),
                        { 
                            current: isCurrentDocument(doc.id),
                            'being-dragged': isBeingDragged(doc.id),
                            'drag-target': isDragTarget(doc.id),
                            editing: isEditingDocument(doc.id),
                            'has-collapsed-children': hasChildren(doc.id) && isCollapsed(doc.id)
                        }
                    ]"
                    :draggable="!isEditingDocument(doc.id)"
                    @click="handleDocumentClick(doc.id)"
                    @dblclick="handleDocumentDoubleClick(doc.id, $event)"
                    @mouseenter="handleDocumentHover(doc.id)"
                    @mouseleave="handleDocumentHoverEnd"
                    @dragstart="handleDragStart($event, doc.id)"
                    @dragend="handleDragEnd($event, doc.id)"
                    @dragover="handleDragOver($event, doc.id)"
                    @dragenter="handleDragEnter($event, doc.id)"
                    @dragleave="handleDragLeave($event, doc.id)"
                    @drop="handleDrop($event, doc.id)"
                    :title="isEditingDocument(doc.id) ? '' : doc.name + ' (' + getCircleCountForDocument(doc.id) + ' circles)'"
                >
                    <!-- Display text when not editing -->
                    <div v-if="!isEditingDocument(doc.id)">
                        {{ getDocumentDisplayName(doc) }}
                        <div 
                            v-for="energizedCircle in getEnergizedCirclesForDocument(doc.id)"
                            class="energized-count"
                        >
                            <div 
                                style="display: inline-block; width: 8px; height: 8px; border-radius: 50%;" 
                                :style="{ backgroundColor: energizedCircle.color }"
                            ></div>
                            <span style="margin: 0px 3px;">{{ energizedCircle.name }}</span>
                        </div>
                    </div>
                    
                    <!-- Input field when editing -->
<div
    v-if="isEditingDocument(doc.id)"
    :ref="'input-' + doc.id"
    class="document-icon-input"
    contenteditable="true"
    @click.stop
    @keydown="handleEditingKeydown($event, doc.id)"
    @blur="handleEditingBlur(doc.id)"
    @input="handleEditingInput($event, doc.id)"
    spellcheck="false"
>{{ getEditingName(doc.id) }}</div>
                    
                    <!-- Collapse/Expand Button -->
                    <div 
                        v-if="hasChildren(doc.id) && !isEditingDocument(doc.id)"
                        :class="['collapse-button', { collapsed: isCollapsed(doc.id) }]"
                        :title="isCollapsed(doc.id) ? 'Expand children' : 'Collapse children'"
                    >
                        {{ isCollapsed(doc.id) ? '+' : '-' }}
                    </div>
                    
                    <!-- Document Icon Controls -->
                    <DocumentIconControls
                        v-if="!isEditingDocument(doc.id)"
                        :document-id="doc.id"
                        :circle-count="getCircleCountForDocument(doc.id)"
                        :can-delete="canDeleteDocument(doc.id)"
                        :has-open-viewer="hasOpenViewer(doc.id)"
                        :has-children="hasChildren(doc.id)"
                        @delete-document="handleDeleteDocument"
                        @close-viewer="handleCloseViewer"
                        @create-child-document="handleCreateChildDocument"
                    />
<div 
    v-if="!isEditingDocument(doc.id) && getCircleCountForDocument(doc.id) > 0"
    class="circle-count-indicator"
    :title="getCircleCountForDocument(doc.id) + ' circles'"
>
    {{ getCircleCountForDocument(doc.id) }}
</div>
                </div>


                <!-- Drop zone after this document -->
                <div
                    :class="['drop-zone', getDropZoneClass(doc), {
                        'drop-zone-active': isDropZoneActive('after-' + doc.id)
                    }]"
                    :data-drop-id="'after-' + doc.id"
                    :data-parent-id="doc.parentId || 'root'"
                    @dragover="handleDropZoneDragOver($event, 'after', doc.id)"
                    @dragenter="handleDropZoneDragEnter($event, 'after', doc.id)"
                    @dragleave="handleDropZoneDragLeave($event)"
                    @drop="handleDropZoneDrop($event, 'after', doc.id)"
                ></div>
            </template>
            
            <!-- Resize Handle -->
            <div 
                class="dock-resize-handle"
                @mousedown="startResize"
                title="Drag to resize dock"
            ></div>
        </div>
    `
};
