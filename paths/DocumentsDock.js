// DocumentsDock.js - Main DocumentsDock component (Updated with create child document handler)
import { onMounted, onUnmounted } from './vue-composition-api.js';
import { DocumentIconControls } from './DocumentIconControlsComponent.js';
import { createDocumentsDockState } from './DocumentsDockState.js';
import { createDocumentsDockHandlers } from './DocumentsDockHandlers.js';
import { createDocumentsDockResize } from './DocumentsDockResize.js';
import { initializeDocumentsDockStyles } from './DocumentsDockStyles.js';

// Initialize styles when component is imported
initializeDocumentsDockStyles();

export const DocumentsDock = {
    emits: ['create-viewer-for-document'],
    setup(props, { emit }) {
        // Create state and handlers
        const dockState = createDocumentsDockState();
        const handlers = createDocumentsDockHandlers(dockState, emit);
        const resize = createDocumentsDockResize();

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
            ...resize
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
            <!-- New Document Button -->
            <div 
                class="new-document-button"
                @click="handleNewDocumentClick"
                title="Create new document and viewer"
            >
                +
            </div>
            
            <!-- All Document Icons -->
            <div 
                v-for="doc in allDocuments"
                :key="doc.id"
                :class="[
                    'document-icon', 
                    getDocumentNestingClass(doc),
                    { 
                        current: isCurrentDocument(doc.id),
                        'being-dragged': isBeingDragged(doc.id),
                        'drag-target': isDragTarget(doc.id),
                        editing: isEditingDocument(doc.id)
                    }
                ]"
                :draggable="!isEditingDocument(doc.id)"
                @click="handleDocumentClick(doc.id)"
                @dblclick="handleDocumentDoubleClick(doc.id, $event)"
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
                </div>
                
                <!-- Input field when editing -->
                <textarea
                    v-if="isEditingDocument(doc.id)"
                    :ref="'input-' + doc.id"
                    :value="getEditingName(doc.id)"
                    class="document-icon-input"
                    @click.stop
                    @keydown="handleEditingKeydown($event, doc.id)"
                    @blur="handleEditingBlur(doc.id)"
                    @input="handleEditingInput($event, doc.id)"
                    :placeholder="doc.name"
                    spellcheck="false"
                    rows="1"
                ></textarea>
                
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
            </div>
            
            <!-- Resize Handle -->
            <div 
                class="dock-resize-handle"
                @mousedown="startResize"
                title="Drag to resize dock"
            ></div>
        </div>
    `
};
