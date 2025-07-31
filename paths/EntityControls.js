// EntityControls.js - Unified controls component for both circles and squares
import { ref, computed, onMounted, onUnmounted } from './vue-composition-api.js';
import { useDataStore } from './useDataStore.js';
import { injectComponentStyles } from './styleUtils.js';

// Inject component styles
const componentStyles = `
    .entity-controls {
        position: absolute;
        bottom: 20px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
    }

    .control-button {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #333;
        color: white;
        border: 2px solid #666;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background-color 0.2s ease;
    }

    .control-button:hover {
        background-color: #555;
    }

    .control-button:disabled {
        background-color: #222;
        border-color: #444;
        color: #666;
        cursor: not-allowed;
    }

    .add-button {
        font-size: 24px;
    }

    .document-button {
        font-size: 20px;
    }

    .document-label {
        background-color: rgba(42, 42, 42, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        border: 1px solid #666;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .document-label:hover {
        background-color: rgba(52, 52, 52, 0.9);
        border-color: #888;
    }

    .document-dropdown {
        position: absolute;
        bottom: 60px;
        left: 60px;
        min-width: 200px;
        background-color: #2a2a2a;
        border: 1px solid #666;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        max-height: 300px;
        overflow-y: auto;
    }

    .dropdown-item {
        padding: 12px 16px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #444;
    }

    .dropdown-item:last-child {
        border-bottom: none;
    }

    .dropdown-item:hover {
        background-color: #3a3a3a;
    }

    .dropdown-item.selected {
        background-color: #4CAF50;
    }

    .dropdown-item.square-selected {
        background-color: #FF6B6B;
    }

    .dropdown-item.new-document {
        font-weight: bold;
        justify-content: center;
    }

    .dropdown-item.new-document.circle {
        color: #4CAF50;
    }

    .dropdown-item.new-document.square {
        color: #FF6B6B;
    }

    .dropdown-item.new-document:hover {
        color: white;
    }

    .dropdown-item.new-document.circle:hover {
        background-color: #4CAF50;
    }

    .dropdown-item.new-document.square:hover {
        background-color: #FF6B6B;
    }

    .dropdown-separator {
        height: 1px;
        background-color: #666;
        margin: 4px 0;
    }

    .document-name {
        flex: 1;
        margin-right: 8px;
    }

    .edit-button, .delete-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        margin-left: 4px;
        border-radius: 3px;
        font-size: 12px;
    }

    .edit-button:hover, .delete-button:hover {
        background-color: #555;
    }

    .delete-button:hover {
        background-color: #d32f2f;
    }

    .document-name-input {
        background-color: #444;
        border: 1px solid #666;
        color: white;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 14px;
        width: 120px;
    }

    .document-name-input:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .no-circle-message {
        padding: 12px 16px;
        color: #999;
        text-align: center;
        font-style: italic;
    }
`;

injectComponentStyles('entity-controls', componentStyles);

export const EntityControls = {
    props: {
        entityType: {
            type: String,
            required: true,
            validator: value => ['circle', 'square'].includes(value)
        },
        viewerId: {
            type: String,
            default: null // Only needed for circle controls
        }
    },
    emits: ['add-entity', 'document-change'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const isDropdownOpen = ref(false);
        const editingDocId = ref(null);

        const shouldShowControls = computed(() => {
            return props.entityType === 'circle' || dataStore.data.selectedCircleId !== null;
        });

        const documents = computed(() => {
            if (props.entityType === 'circle') {
                return dataStore.getAllCircleDocuments();
            } else {
                const selectedCircleId = dataStore.data.selectedCircleId;
                return selectedCircleId ? dataStore.getSquareDocumentsForCircle(selectedCircleId) : [];
            }
        });

        const currentDocument = computed(() => {
            if (props.entityType === 'circle' && props.viewerId) {
                return dataStore.getCircleDocumentForViewer(props.viewerId);
            } else if (props.entityType === 'square') {
                return dataStore.getCurrentSquareDocument();
            }
            return null;
        });

        const hasDocument = computed(() => {
            return currentDocument.value !== null;
        });

        const shouldShowSelectCircleMessage = computed(() => {
            return props.entityType === 'square' && dataStore.data.selectedCircleId === null;
        });

        // Button handlers
        const handleAddClick = () => {
            emit('add-entity');
        };

        const toggleDropdown = () => {
            isDropdownOpen.value = !isDropdownOpen.value;
        };

        const handleDocumentClick = () => {
            toggleDropdown();
        };

        // Document management
        const selectDocument = (id) => {
            if (props.entityType === 'circle' && props.viewerId) {
                dataStore.setCircleDocumentForViewer(props.viewerId, id);
            } else if (props.entityType === 'square') {
                dataStore.setCurrentSquareDocument(id);
            }
            isDropdownOpen.value = false;
            emit('document-change', id);
        };

        const createNewDocument = () => {
            let doc;
            if (props.entityType === 'circle') {
                doc = dataStore.createCircleDocument();
            } else {
                const selectedCircleId = dataStore.data.selectedCircleId;
                if (!selectedCircleId) return;
                doc = dataStore.createSquareDocument(selectedCircleId);
            }
            selectDocument(doc.id);
        };

        const startEdit = (docId) => {
            editingDocId.value = docId;
        };

        const finishEdit = (docId, newName) => {
            if (newName.trim()) {
                if (props.entityType === 'circle') {
                    dataStore.updateCircleDocumentName(docId, newName.trim());
                } else {
                    dataStore.updateSquareDocumentName(docId, newName.trim());
                }
            }
            editingDocId.value = null;
        };

        const deleteDocument = (docId) => {
            const entityLabel = props.entityType === 'circle' ? 'circle' : 'square';
            if (confirm(`Are you sure you want to delete this ${entityLabel} document? All ${entityLabel}s${props.entityType === 'circle' ? ' and their squares' : ''} will be removed.`)) {
                let success;
                if (props.entityType === 'circle') {
                    success = dataStore.deleteCircleDocument(docId);
                } else {
                    success = dataStore.deleteSquareDocument(docId);
                }
                
                if (success) {
                    const currentDocId = props.entityType === 'circle' && props.viewerId
                        ? dataStore.getCircleDocumentForViewer(props.viewerId)?.id
                        : dataStore.data.currentSquareDocumentId;
                    emit('document-change', currentDocId);
                }
            }
        };

        // Close dropdown when clicking outside
        const handleGlobalClick = (e) => {
            if (!e.target.closest('.entity-controls')) {
                isDropdownOpen.value = false;
            }
        };

        onMounted(() => {
            document.addEventListener('click', handleGlobalClick);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleGlobalClick);
        });

        return {
            shouldShowControls,
            hasDocument,
            isDropdownOpen,
            editingDocId,
            documents,
            currentDocument,
            shouldShowSelectCircleMessage,
            handleAddClick,
            handleDocumentClick,
            selectDocument,
            createNewDocument,
            startEdit,
            finishEdit,
            deleteDocument
        };
    },
    template: `
        <div 
            v-if="shouldShowControls"
            class="entity-controls"
        >
            <!-- Add Button -->
            <button 
                class="control-button add-button"
                @click="handleAddClick"
            >+</button>
            
            <!-- Document Button (shown when no document selected) -->
            <button 
                v-if="!hasDocument"
                class="control-button document-button"
                @click="handleDocumentClick"
            >📁</button>
            
            <!-- Document Label (shown when document selected, clickable) -->
            <div 
                v-if="hasDocument"
                class="document-label"
                @click="handleDocumentClick"
            >{{ currentDocument.name }}</div>
            
            <!-- Document Dropdown -->
            <div 
                v-if="isDropdownOpen"
                class="document-dropdown"
            >
                <div v-if="shouldShowSelectCircleMessage" class="no-circle-message">
                    Select a circle first
                </div>
                <template v-else>
                    <div 
                        v-for="doc in documents"
                        :key="doc.id"
                        :class="[
                            'dropdown-item',
                            { 
                                'selected': entityType === 'circle' && doc.id === currentDocument?.id,
                                'square-selected': entityType === 'square' && doc.id === currentDocument?.id
                            }
                        ]"
                    >
                        <span 
                            v-if="editingDocId !== doc.id"
                            class="document-name"
                            @click="selectDocument(doc.id)"
                        >{{ doc.name }}</span>
                        <input 
                            v-else
                            class="document-name-input"
                            :value="doc.name"
                            @blur="finishEdit(doc.id, $event.target.value)"
                            @keydown.enter="finishEdit(doc.id, $event.target.value)"
                            @keydown.escape="editingDocId = null"
                            @click.stop
                        />
                        <button 
                            class="edit-button"
                            @click.stop="startEdit(doc.id)"
                        >✏️</button>
                        <button 
                            v-if="documents.length > 1"
                            class="delete-button"
                            @click.stop="deleteDocument(doc.id)"
                        >🗑️</button>
                    </div>
                    <div class="dropdown-separator"></div>
                    <div 
                        :class="['dropdown-item', 'new-document', entityType]"
                        @click="createNewDocument"
                    >+ New {{ entityType === 'circle' ? 'Circle' : 'Square' }} Document</div>
                </template>
            </div>
        </div>
    `
};
