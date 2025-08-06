// SharedDropdown.js - Shared dropdown component for document management
import { ref, computed, onMounted, onUnmounted, nextTick } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
const componentStyles = `
    .shared-dropdown {
        position: fixed;
        min-width: 200px;
        background-color: #2a2a2a;
        border: 1px solid #666;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        max-height: 300px;
        overflow-y: auto;
        z-index: 2000;
        display: none;
    }

    .shared-dropdown.visible {
        display: block;
    }

    .shared-dropdown-item {
        padding: 2px 4px;
        color: #DDD;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #444;
	font-size: 13px;
    }

    .shared-dropdown-item:last-child {
        border-bottom: none;
    }

    .shared-dropdown-item:hover {
        background-color: #3a3a3a;
    }

    .shared-dropdown-item.selected {
        background-color: #444;
    }

    .shared-dropdown-item.square-selected {
        background-color: #FF6B6B;
    }

    .shared-dropdown-item.new-document:hover {
        color: white;
    }

    .shared-dropdown-separator {
        height: 1px;
        background-color: #666;
        margin: 4px 0;
    }

    .shared-document-name {
        flex: 1;
        margin-right: 8px;
    }

    .shared-edit-button, .shared-delete-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        margin-left: 4px;
        border-radius: 3px;
        font-size: 12px;
    }

    .shared-edit-button:hover, .shared-delete-button:hover {
        background-color: #555;
    }

    .shared-delete-button:hover {
        background-color: #d32f2f;
    }

    .shared-document-name-input {
        background-color: #444;
        border: 1px solid #666;
        color: white;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 14px;
        width: 120px;
    }

    .shared-document-name-input:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .shared-no-circle-message {
        padding: 12px 16px;
        color: #999;
        text-align: center;
        font-style: italic;
    }
`;

injectComponentStyles('shared-dropdown', componentStyles);

export const SharedDropdown = {
    setup() {
        const dataStore = useDataStore();
        const dropdownRef = ref(null);
        const editingDocId = ref(null);
        
        // Dropdown state
        const isVisible = ref(false);
        const entityType = ref('circle');
        const viewerId = ref(null);
        const triggerElement = ref(null);
        const onDocumentChange = ref(null);

        const documents = computed(() => {
            if (entityType.value === 'circle') {
                return dataStore.getAllCircleDocuments();
            } else {
                const selectedCircles = dataStore.getSelectedCircles();
                if (selectedCircles.length === 1) {
                    return dataStore.getSquareDocumentsForCircle(selectedCircles[0]);
                }
                return [];
            }
        });

        const currentDocument = computed(() => {
            if (entityType.value === 'circle' && viewerId.value) {
                return dataStore.getCircleDocumentForViewer(viewerId.value);
            } else if (entityType.value === 'square') {
                return dataStore.getCurrentSquareDocument();
            }
            return null;
        });

        const shouldShowSelectCircleMessage = computed(() => {
            return entityType.value === 'square' && dataStore.getSelectedCircles().length !== 1;
        });

        // Position the dropdown near the trigger element
        const positionDropdown = () => {
            if (!dropdownRef.value || !triggerElement.value) return;

            const trigger = triggerElement.value;
            const dropdown = dropdownRef.value;
            const triggerRect = trigger.getBoundingClientRect();
            
            // Position below the trigger by default
            let top = triggerRect.bottom + 5;
            let left = triggerRect.left;
            
            // Ensure dropdown doesn't go off screen
            const dropdownRect = dropdown.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Adjust horizontal position if it would go off screen
            if (left + dropdownRect.width > viewportWidth) {
                left = Math.max(5, viewportWidth - dropdownRect.width - 5);
            }
            
            // Adjust vertical position if it would go off screen
            if (top + dropdownRect.height > viewportHeight) {
                top = Math.max(5, triggerRect.top - dropdownRect.height - 5);
            }
            
            dropdown.style.left = `${left}px`;
            dropdown.style.top = `${top}px`;
        };

        // Show dropdown
        const show = (config) => {
            entityType.value = config.entityType;
            viewerId.value = config.viewerId || null;
            triggerElement.value = config.triggerElement;
            onDocumentChange.value = config.onDocumentChange || null;
            
            isVisible.value = true;
            
            nextTick(() => {
                positionDropdown();
            });
        };

        // Hide dropdown
        const hide = () => {
            isVisible.value = false;
            editingDocId.value = null;
            entityType.value = 'circle';
            viewerId.value = null;
            triggerElement.value = null;
            onDocumentChange.value = null;
        };

        // Document management
        const selectDocument = (id) => {
            if (entityType.value === 'circle' && viewerId.value) {
                dataStore.setCircleDocumentForViewer(viewerId.value, id);
            } else if (entityType.value === 'square') {
                dataStore.setCurrentSquareDocument(id);
            }
            
            if (onDocumentChange.value) {
                onDocumentChange.value(id);
            }
            
            hide();
        };

        const createNewDocument = () => {
            let doc;
            if (entityType.value === 'circle') {
                doc = dataStore.createCircleDocument();
            } else {
                const selectedCircles = dataStore.getSelectedCircles();
                if (selectedCircles.length !== 1) return;
                doc = dataStore.createSquareDocument(selectedCircles[0]);
            }
            selectDocument(doc.id);
        };

        const startEdit = (docId) => {
            editingDocId.value = docId;
        };

        const finishEdit = (docId, newName) => {
            if (newName.trim()) {
                if (entityType.value === 'circle') {
                    dataStore.updateCircleDocumentName(docId, newName.trim());
                } else {
                    dataStore.updateSquareDocumentName(docId, newName.trim());
                }
            }
            editingDocId.value = null;
        };

        const deleteDocument = (docId) => {
            const entityLabel = entityType.value === 'circle' ? 'circle' : 'square';
            if (confirm(`Are you sure you want to delete this ${entityLabel} document? All ${entityLabel}s${entityType.value === 'circle' ? ' and their squares' : ''} will be removed.`)) {
                let success;
                if (entityType.value === 'circle') {
                    success = dataStore.deleteCircleDocument(docId);
                } else {
                    success = dataStore.deleteSquareDocument(docId);
                }
                
                if (success && onDocumentChange.value) {
                    const currentDocId = entityType.value === 'circle' && viewerId.value
                        ? dataStore.getCircleDocumentForViewer(viewerId.value)?.id
                        : dataStore.data.currentSquareDocumentId;
                    onDocumentChange.value(currentDocId);
                }
            }
        };

        // Close dropdown when clicking outside
        const handleGlobalClick = (e) => {
            if (isVisible.value && dropdownRef.value && !dropdownRef.value.contains(e.target)) {
                // Also check if click was on the trigger element to avoid immediate re-closing
                if (triggerElement.value && !triggerElement.value.contains(e.target)) {
                    hide();
                }
            }
        };

        // Handle window resize
        const handleResize = () => {
            if (isVisible.value) {
                positionDropdown();
            }
        };

        onMounted(() => {
            document.addEventListener('click', handleGlobalClick);
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('resize', handleResize);
        });

        return {
            dropdownRef,
            isVisible,
            entityType,
            documents,
            currentDocument,
            shouldShowSelectCircleMessage,
            editingDocId,
            show,
            hide,
            selectDocument,
            createNewDocument,
            startEdit,
            finishEdit,
            deleteDocument
        };
    },
    template: `
        <div 
            ref="dropdownRef"
            :class="['shared-dropdown', { visible: isVisible }]"
        >
            <div v-if="shouldShowSelectCircleMessage" class="shared-no-circle-message">
                Select exactly one circle first
            </div>
            <template v-else>
                <div 
                    v-for="doc in documents"
                    :key="doc.id"
                    :class="[
                        'shared-dropdown-item',
                        { 
                            'selected': entityType === 'circle' && doc.id === currentDocument?.id,
                            'square-selected': entityType === 'square' && doc.id === currentDocument?.id
                        }
                    ]"
                >
                    <span 
                        v-if="editingDocId !== doc.id"
                        class="shared-document-name"
                        @click="selectDocument(doc.id)"
                    >{{ doc.name }}</span>
                    <input 
                        v-else
                        class="shared-document-name-input"
                        :value="doc.name"
                        @blur="finishEdit(doc.id, $event.target.value)"
                        @keydown.enter="finishEdit(doc.id, $event.target.value)"
                        @keydown.escape="editingDocId = null"
                        @click.stop
                    />
                    <button 
                        class="shared-edit-button"
                        @click.stop="startEdit(doc.id)"
                    >✏️</button>
                    <button 
                        v-if="documents.length > 1"
                        class="shared-delete-button"
                        @click.stop="deleteDocument(doc.id)"
                    >🗑️</button>
                </div>
                <div class="shared-dropdown-separator"></div>
                <div 
                    :class="['shared-dropdown-item', 'new-document', entityType]"
                    @click="createNewDocument"
                >+ New Document</div>
            </template>
        </div>
    `
};
