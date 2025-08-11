// SquareDocumentTabs.js - Tabbed interface for square documents
import { ref, computed, nextTick, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
const componentStyles = `
    .square-document-tabs {
        position: absolute;
        top: 50px; /* Position below the characteristics bar */
        left: 0;
        right: 0;
        height: 21px;
        border-bottom: 1px solid #333;
        display: flex;
        align-items: stretch;
        z-index: 1001;
        user-select: none;
        overflow-x: hidden;
        overflow-y: hidden;
    }

    /* When characteristics bar is hidden (no circle selected), position tabs at top */
    .square-document-tabs.no-characteristics-bar {
        top: 0;
    }

    .tabs-container {
        display: flex;
        align-items: stretch;
        flex-shrink: 0; /* Don't shrink the tabs container */
        min-width: 0;
        margin-left: 8px; /* Small margin from left edge */
    }

    .document-tab {
        display: flex;
        align-items: center;
        padding: 0 12px;
        min-width: 80px;
        max-width: 160px;
        height: 21px;
        background-color: #2a2a2a;
        border: 1px solid #333;
        border-bottom: none;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        flex-shrink: 0;
        margin-right: 2px;
        margin-top: 0px;
    }

    .document-tab:hover {
        background-color: #333;
        border-color: #555;
    }

    .document-tab.active {
        background-color: #0a0a0a; /* Match square viewer background */
        border-color: #555;
        margin-top: 0;
        height: 21px;
        z-index: 2;
        color: white;
    }

    .document-tab.active:hover {
        background-color: #111;
    }

    .document-tab.dragging {
        opacity: 0.5;
        z-index: 1000;
        transform: scale(1.02);
    }

    .document-tab.drag-over {
        border-left: 3px solid #4CAF50;
    }

    .tab-content {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
    }

    .tab-title {
        flex: 1;
        font-size: 12px;
        color: #aaa;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
    }

    .document-tab.active .tab-title {
        color: #ddd;
    }

    .tab-title-input {
        flex: 1;
        background: transparent;
        border: 1px solid #555;
        color: white;
        font-size: 12px;
        padding: 1px 4px;
        border-radius: 2px;
        min-width: 60px;
    }

    .tab-title-input:focus {
        outline: none;
        border-color: #777;
        background-color: rgba(255, 255, 255, 0.05);
    }

    .tab-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: 6px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .document-tab:hover .tab-actions,
    .document-tab.active .tab-actions {
        opacity: 1;
    }

    .tab-action-button {
        width: 14px;
        height: 14px;
        border: none;
        background: none;
        color: #777;
        cursor: pointer;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        transition: all 0.2s ease;
    }

    .tab-action-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ccc;
    }

    .close-button:hover {
        background-color: #d32f2f;
        color: white;
    }

    .add-tab {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 21px;
        background-color: #2a2a2a;
        border: 1px solid #333;
        border-bottom: none;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        color: #777;
        font-size: 14px;
        margin-left: 2px; /* Small gap from last tab */
    }

    .add-tab:hover {
        background-color: #4CAF50;
        border-color: #4CAF50;
        color: white;
    }

    .no-circle-message {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: #666;
        font-size: 12px;
        font-style: italic;
    }

    .drag-placeholder {
        width: 2px;
        height: 21px;
        background-color: #4CAF50;
        transition: all 0.2s ease;
    }
`;

injectComponentStyles('square-document-tabs', componentStyles);

export const SquareDocumentTabs = {
    emits: ['document-change'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isEditingTabId = ref(null);
        const titleInputRef = ref(null);
        
        // Drag and drop state
        const isDragging = ref(false);
        const draggedTabId = ref(null);
        const dragOverTabId = ref(null);
        const dragStartIndex = ref(null);

        // Get selected circles and available documents
        const selectedCircles = computed(() => dataStore.getSelectedCircles());
        const shouldShowTabs = computed(() => selectedCircles.value.length === 1);
        const hasSelectedCircle = computed(() => selectedCircles.value.length === 1); // For characteristics bar visibility
        
        const documents = computed(() => {
            if (selectedCircles.value.length === 1) {
                return dataStore.getSquareDocumentsForCircle(selectedCircles.value[0]);
            }
            return [];
        });

        const currentDocument = computed(() => dataStore.getCurrentSquareDocument());

        // Start editing tab title
        const startEditTitle = (docId) => {
            isEditingTabId.value = docId;
            nextTick(() => {
                if (titleInputRef.value) {
                    titleInputRef.value.focus();
                    titleInputRef.value.select();
                }
            });
        };

        // Finish editing tab title
        const finishEditTitle = (docId, newTitle) => {
            isEditingTabId.value = null;
            if (newTitle && newTitle.trim() !== '') {
                dataStore.updateSquareDocumentName(docId, newTitle.trim());
            }
        };

        // Handle tab title input events
        const handleTitleKeydown = (e, docId) => {
            if (e.key === 'Enter') {
                finishEditTitle(docId, e.target.value);
            } else if (e.key === 'Escape') {
                isEditingTabId.value = null;
            }
        };

        // Tab selection
        const selectDocument = (docId) => {
            dataStore.setCurrentSquareDocument(docId);
            emit('document-change', docId);
        };

        // Create new document
        const createNewDocument = () => {
            if (selectedCircles.value.length === 1) {
                const doc = dataStore.createSquareDocument(selectedCircles.value[0]);
                selectDocument(doc.id);
            }
        };

        // Delete document (only if more than one exists)
        const deleteDocument = (docId) => {
            const doc = documents.value.find(d => d.id === docId);
            if (doc && documents.value.length > 1) {
                if (confirm(`Are you sure you want to delete "${doc.name}"? All squares in this document will be removed.`)) {
                    // The document store handles all the selection logic automatically
                    const success = dataStore.deleteSquareDocument(docId);
                    
                    if (success) {
                        // Emit the change event so parent components can react if needed
                        const newCurrentDoc = dataStore.getCurrentSquareDocument();
                        if (newCurrentDoc) {
                            emit('document-change', newCurrentDoc.id);
                        }
                    }
                }
            }
        };

        // Drag and drop functionality
        const handleDragStart = (e, docId, index) => {
            isDragging.value = true;
            draggedTabId.value = docId;
            dragStartIndex.value = index;
            
            // Set drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', docId);
            
            // Add dragging class after a small delay to avoid affecting drag image
            setTimeout(() => {
                const tabElement = e.target.closest('.document-tab');
                if (tabElement) {
                    tabElement.classList.add('dragging');
                }
            }, 0);
        };

        const handleDragEnd = (e) => {
            isDragging.value = false;
            draggedTabId.value = null;
            dragOverTabId.value = null;
            dragStartIndex.value = null;
            
            // Remove all drag-related classes
            document.querySelectorAll('.document-tab').forEach(tab => {
                tab.classList.remove('dragging', 'drag-over');
            });
        };

        const handleDragOver = (e, docId) => {
            if (draggedTabId.value && draggedTabId.value !== docId) {
                e.preventDefault();
                dragOverTabId.value = docId;
            }
        };

        const handleDragLeave = (e, docId) => {
            if (dragOverTabId.value === docId) {
                dragOverTabId.value = null;
            }
        };

        const handleDrop = (e, targetDocId, targetIndex) => {
            e.preventDefault();
            
            if (draggedTabId.value && draggedTabId.value !== targetDocId) {
                // For now, we'll just reorder in the UI
                // In a full implementation, you might want to add document ordering to the store
                console.log(`Reorder: Move ${draggedTabId.value} to position of ${targetDocId}`);
                
                // Since we don't have document ordering in the store yet,
                // we'll just show the reorder visually for now
                // You can extend the documentStore to support ordering if needed
            }
            
            dragOverTabId.value = null;
        };

        // Prevent click events during drag operations
        const handleTabClick = (docId) => {
            if (!isDragging.value) {
                selectDocument(docId);
            }
        };

        const handleTitleDoubleClick = (e, docId) => {
            e.stopPropagation();
            if (!isDragging.value) {
                startEditTitle(docId);
            }
        };

        const handleCloseClick = (e, docId) => {
            e.stopPropagation();
            if (!isDragging.value) {
                deleteDocument(docId);
            }
        };

        // Handle square document tab changes
        const handleSquareDocumentTabChange = (docId) => {
            // The SquareDocumentTabs component already calls dataStore.setCurrentSquareDocument
            // We just need to ensure any dependent state is updated if needed
            console.log('Square document changed to:', docId);
        };

        return {
            shouldShowTabs,
            hasSelectedCircle,
            documents,
            currentDocument,
            selectedCircles,
            isEditingTabId,
            titleInputRef,
            isDragging,
            draggedTabId,
            dragOverTabId,
            selectDocument: handleTabClick,
            createNewDocument,
            deleteDocument,
            handleTitleDoubleClick,
            finishEditTitle,
            handleTitleKeydown,
            handleCloseClick,
            handleDragStart,
            handleDragEnd,
            handleDragOver,
            handleDragLeave,
            handleDrop
        };
    },
    template: `
        <div :class="['square-document-tabs', { 'no-characteristics-bar': !hasSelectedCircle }]">
            <div v-if="!shouldShowTabs" class="no-circle-message">
            </div>
            
            <template v-else>
                <div class="tabs-container">
                    <div 
                        v-for="(doc, index) in documents"
                        :key="doc.id"
                        :class="[
                            'document-tab',
                            { 
                                'active': currentDocument?.id === doc.id,
                                'drag-over': dragOverTabId === doc.id
                            }
                        ]"
                        :draggable="true"
                        @click="selectDocument(doc.id)"
                        @dragstart="handleDragStart($event, doc.id, index)"
                        @dragend="handleDragEnd"
                        @dragover="handleDragOver($event, doc.id)"
                        @dragleave="handleDragLeave($event, doc.id)"
                        @drop="handleDrop($event, doc.id, index)"
                    >
                        <div class="tab-content">
                            <div 
                                v-if="isEditingTabId !== doc.id"
                                class="tab-title"
                                @dblclick="handleTitleDoubleClick($event, doc.id)"
                            >{{ doc.name }}</div>
                            <input 
                                v-else
                                ref="titleInputRef"
                                class="tab-title-input"
                                :value="doc.name"
                                @blur="finishEditTitle(doc.id, $event.target.value)"
                                @keydown="handleTitleKeydown($event, doc.id)"
                                @click.stop
                            />
                        </div>
                        <div class="tab-actions">
                            <button 
                                v-if="documents.length > 1"
                                class="tab-action-button close-button"
                                @click="handleCloseClick($event, doc.id)"
                                title="Close document"
                            >×</button>
                        </div>
                    </div>
                </div>
                
                <div 
                    class="add-tab"
                    @click="createNewDocument"
                    title="Create new square document"
                >+</div>
            </template>
        </div>
    `
};
