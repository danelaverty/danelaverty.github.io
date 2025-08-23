// DocumentsDock.js - Document browser dock for CircleDocuments
import { computed, ref } from './vue-composition-api.js';
import { useDataStore } from './dataCoordinator.js';
import { injectComponentStyles } from './styleUtils.js';
import { DocumentIconControls } from './DocumentIconControlsComponent.js';

// Inject component styles
const componentStyles = `
    .documents-dock {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 60px;
        background-color: #1a1a1a;
        border-right: 2px solid #333;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 0;
        gap: 8px;
        z-index: 1004;
        overflow-y: auto;
        
        /* Custom scrollbar styling */
        scrollbar-width: thin;
        scrollbar-color: #444 transparent;
    }

    /* Webkit scrollbar styling for Chrome/Safari */
    .documents-dock::-webkit-scrollbar {
        width: 6px;
    }

    .documents-dock::-webkit-scrollbar-track {
        background: transparent;
    }

    .documents-dock::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 3px;
        transition: background-color 0.2s ease;
    }

    .documents-dock::-webkit-scrollbar-thumb:hover {
        background-color: #555;
    }

    .documents-dock::-webkit-scrollbar-thumb:active {
        background-color: #666;
    }

    .documents-dock.hidden {
        display: none;
    }

    .document-icon {
        width: 50px;
        height: 40px;
        background-color: #333;
        border: 1px solid #555;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-size: 9px;
        text-align: center;
        word-break: break-word;
        line-height: 1.1;
        transition: all 0.2s ease;
        padding: 2px;
        position: relative;
    }

    .document-icon:hover {
        background-color: #444;
        border-color: #777;
    }

    .document-icon.current {
        background-color: #4CAF50;
        border-color: #66BB6A;
    }

    .document-icon.current:hover {
        background-color: #5CBF60;
        border-color: #7CC88A;
    }

    /* New document button styling */
    .new-document-button {
        width: 50px;
        height: 22px;
        background-color: #2E7D32;
        border: 1px solid #4CAF50;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-size: 20px;
        font-weight: bold;
        transition: all 0.2s ease;
        margin-bottom: 8px;
    }

    .new-document-button:hover {
        background-color: #388E3C;
        border-color: #66BB6A;
        transform: scale(1.05);
    }

    .new-document-button:active {
        transform: scale(0.95);
    }

    /* Toggle button for showing/hiding non-pinned documents */
    .toggle-unpinned-button {
        width: 50px;
        height: 20px;
        background-color: #333;
        border: 1px solid #555;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #888;
        font-size: 12px;
        transition: all 0.2s ease;
        margin-top: 4px;
        margin-bottom: 4px;
    }

    .toggle-unpinned-button:hover {
        background-color: #444;
        border-color: #777;
        color: #aaa;
    }

    .toggle-unpinned-button.expanded {
        background-color: #4CAF50;
        border-color: #66BB6A;
        color: white;
    }

    .toggle-unpinned-button.expanded:hover {
        background-color: #5CBF60;
        border-color: #7CC88A;
    }
`;

injectComponentStyles('documents-dock', componentStyles);

export const DocumentsDock = {
    emits: ['create-viewer-for-document'],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const showUnpinnedDocuments = ref(false);

        const allCircleDocuments = computed(() => {
            const docs = dataStore.getAllCircleDocuments();
            
            // Sort with pinned documents first, then alphabetically within each group
            return docs.sort((a, b) => {
                // Check if documents are pinned
                const aPinned = a.isPinned || false;
                const bPinned = b.isPinned || false;
                
                // Pinned documents come first
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                
                // Within the same pin status, sort alphabetically
                return a.name.localeCompare(b.name);
            });
        });

        // Split documents into pinned and unpinned
        const pinnedDocuments = computed(() => {
            return allCircleDocuments.value.filter(doc => doc.isPinned);
        });

        const unpinnedDocuments = computed(() => {
            return allCircleDocuments.value.filter(doc => !doc.isPinned);
        });

        // Documents to display (pinned + conditionally unpinned)
        const visibleDocuments = computed(() => {
            if (showUnpinnedDocuments.value) {
                return allCircleDocuments.value;
            } else {
                return pinnedDocuments.value;
            }
        });

        const hasDocuments = computed(() => {
            return allCircleDocuments.value.length > 0;
        });

        const hasUnpinnedDocuments = computed(() => {
            return unpinnedDocuments.value.length > 0;
        });

        // Get currently visible documents (documents that have viewers)
        const currentlyVisibleDocuments = computed(() => {
            const visibleViewers = dataStore.getVisibleCircleViewers();
            const visibleDocIds = new Set();
            
            visibleViewers.forEach(viewer => {
                const doc = dataStore.getCircleDocumentForViewer(viewer.id);
                if (doc) {
                    visibleDocIds.add(doc.id);
                }
            });
            
            return visibleDocIds;
        });

        const handleToggleUnpinned = () => {
            showUnpinnedDocuments.value = !showUnpinnedDocuments.value;
        };

        const canDeleteDocument = (docId) => {
            // Can delete if there's more than one document
            return allCircleDocuments.value.length > 1;
        };

        const handleDeleteDocument = (docId) => {
            if (!canDeleteDocument(docId)) return;
            
            const doc = allCircleDocuments.value.find(d => d.id === docId);
            if (doc && confirm(`Are you sure you want to delete "${doc.name}"? All circles and their squares will be removed.`)) {
                dataStore.deleteCircleDocument(docId);
            }
        };

        const handleTogglePin = (docId) => {
            const doc = allCircleDocuments.value.find(d => d.id === docId);
            if (doc) {
                const newPinnedState = !doc.isPinned;
                dataStore.updateCircleDocumentPin(docId, newPinnedState);
            }
        };

        const isDocumentPinned = (docId) => {
            const doc = allCircleDocuments.value.find(d => d.id === docId);
            return doc ? (doc.isPinned || false) : false;
        };

        const handleNewDocumentClick = () => {
            // Create new document
            const newDoc = dataStore.createCircleDocument();
            
            // Create new viewer for this document
            const newViewer = dataStore.createCircleViewer();
            dataStore.setCircleDocumentForViewer(newViewer.id, newDoc.id);
            dataStore.setSelectedViewer(newViewer.id);
            
            emit('create-viewer-for-document', newDoc.id);
        };

        const handleDocumentClick = (documentId) => {
            // Check if this document already has a visible viewer
            const visibleViewers = dataStore.getVisibleCircleViewers();
            const existingViewer = visibleViewers.find(viewer => {
                const doc = dataStore.getCircleDocumentForViewer(viewer.id);
                return doc && doc.id === documentId;
            });

            if (existingViewer) {
                // If viewer exists, just select it
                dataStore.setSelectedViewer(existingViewer.id);
            } else {
                // Create new viewer for this document
                const newViewer = dataStore.createCircleViewer();
                dataStore.setCircleDocumentForViewer(newViewer.id, documentId);
                dataStore.setSelectedViewer(newViewer.id);
            }
            
            emit('create-viewer-for-document', documentId);
        };

        const getDocumentDisplayName = (doc) => {
            // Truncate long document names for display in dock
            return doc.name.length > 16 ? doc.name.substring(0, 16) + '...' : doc.name;
        };

        const getCircleCountForDocument = (docId) => {
            const circles = dataStore.getCirclesForDocument(docId);
            return circles.length;
        };

        const isCurrentDocument = (docId) => {
            return currentlyVisibleDocuments.value.has(docId);
        };

        return {
            dataStore,
            pinnedDocuments,
            unpinnedDocuments,
            visibleDocuments,
            hasDocuments,
            hasUnpinnedDocuments,
            showUnpinnedDocuments,
            currentlyVisibleDocuments,
            handleNewDocumentClick,
            handleDocumentClick,
            handleDeleteDocument,
            handleTogglePin,
            handleToggleUnpinned,
            getDocumentDisplayName,
            getCircleCountForDocument,
            isCurrentDocument,
            isDocumentPinned,
            canDeleteDocument
        };
    },
    components: {
        DocumentIconControls
    },
    template: `
        <div 
            :class="['documents-dock', { hidden: !hasDocuments }]"
        >
            <!-- New Document Button -->
            <div 
                class="new-document-button"
                @click="handleNewDocumentClick"
                title="Create new document and viewer"
            >
                +
            </div>
            
            <!-- Pinned Document Icons -->
            <div 
                v-for="doc in pinnedDocuments"
                :key="'pinned-' + doc.id"
                :class="['document-icon', { current: isCurrentDocument(doc.id) }]"
                @click="handleDocumentClick(doc.id)"
                :title="doc.name + ' (' + getCircleCountForDocument(doc.id) + ' circles)'"
            >
                {{ getDocumentDisplayName(doc) }}
                
                <!-- Document Icon Controls (visible on hover) -->
                <DocumentIconControls
                    :document-id="doc.id"
                    :circle-count="getCircleCountForDocument(doc.id)"
                    :can-delete="canDeleteDocument(doc.id)"
                    :is-pinned="isDocumentPinned(doc.id)"
                    @delete-document="handleDeleteDocument"
                    @toggle-pin="handleTogglePin"
                />
            </div>
            
            <!-- Toggle button for unpinned documents (only show if there are unpinned docs) -->
            <div 
                v-if="hasUnpinnedDocuments"
                :class="['toggle-unpinned-button', { expanded: showUnpinnedDocuments }]"
                @click="handleToggleUnpinned"
                :title="showUnpinnedDocuments ? 'Hide unpinned documents' : 'Show unpinned documents'"
            >
                {{ showUnpinnedDocuments ? '▴' : '▾' }}
            </div>
            
            <!-- Unpinned Document Icons (only show when expanded) -->
            <div 
                v-if="showUnpinnedDocuments"
                v-for="doc in unpinnedDocuments"
                :key="'unpinned-' + doc.id"
                :class="['document-icon', { current: isCurrentDocument(doc.id) }]"
                @click="handleDocumentClick(doc.id)"
                :title="doc.name + ' (' + getCircleCountForDocument(doc.id) + ' circles)'"
            >
                {{ getDocumentDisplayName(doc) }}
                
                <!-- Document Icon Controls (visible on hover) -->
                <DocumentIconControls
                    :document-id="doc.id"
                    :circle-count="getCircleCountForDocument(doc.id)"
                    :can-delete="canDeleteDocument(doc.id)"
                    :is-pinned="isDocumentPinned(doc.id)"
                    @delete-document="handleDeleteDocument"
                    @toggle-pin="handleTogglePin"
                />
            </div>
        </div>
    `
};
