// EntityNameEditor.js - Separated name editing logic
import { ref, nextTick } from './vue-composition-api.js';

export class EntityNameEditor {
    constructor(nameRef, emit) {
        this.nameRef = nameRef;
        this.emit = emit;
        this.isEditing = ref(false);
        this.originalName = ref('');
        this.globalClickHandler = null;

        // Bind methods to preserve 'this' context
        this.handleNameClick = this.handleNameClick.bind(this);
        this.handleNameKeydown = this.handleNameKeydown.bind(this);
        this.finishNameEdit = this.finishNameEdit.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.startNameEdit = this.startNameEdit.bind(this);
        this.cancelNameEdit = this.cancelNameEdit.bind(this);
    }

    handleNameClick(e) {
        e.stopPropagation();
        this.startNameEdit(e);
    }

    startNameEdit(clickEvent = null) {
        if (!this.nameRef.value) return;
        
        this.isEditing.value = true;
        this.originalName.value = this.nameRef.value.textContent;
        this.nameRef.value.contentEditable = true;
        this.nameRef.value.focus();

        // Set up global click listener to handle clicking outside
        if (!this.globalClickHandler) {
            this.globalClickHandler = this.handleGlobalClick;
            document.addEventListener('click', this.globalClickHandler, true);
        }

        // CHANGE 1: Let the browser handle cursor placement naturally based on click position
        if (clickEvent) {
            // Don't interfere with natural click positioning - just focus
            // The browser will automatically place the cursor where the user clicked
            return;
        }

        // Only set cursor position programmatically if not triggered by a click
        nextTick(() => {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(this.nameRef.value.childNodes[0] || this.nameRef.value, 
                          this.nameRef.value.textContent.length);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }

    handleGlobalClick(e) {
        // If clicking outside the name editor, finish editing
        if (this.isEditing.value && this.nameRef.value && 
            !this.nameRef.value.contains(e.target)) {
            this.finishNameEdit();
        }
    }

    finishNameEdit() {
        if (!this.nameRef.value || !this.isEditing.value) return;
        this.isEditing.value = false;
        this.nameRef.value.contentEditable = false;
        
        // Remove global click listener
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler, true);
            this.globalClickHandler = null;
        }
        
        const newName = this.nameRef.value.textContent.trim() || '???';
        const entityId = this.nameRef.value.closest('.entity-container')?.getAttribute('data-entity-id');
        
        if (newName !== this.originalName.value && entityId) {
            this.emit('update-name', { id: entityId, name: newName });
        }
        
        this.nameRef.value.textContent = newName;
        
        // Clear selection to ensure we're fully out of edit mode
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }

    cancelNameEdit() {
        if (!this.nameRef.value) return;
        
        this.isEditing.value = false;
        this.nameRef.value.contentEditable = false;
        
        // Remove global click listener
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler, true);
            this.globalClickHandler = null;
        }
        
        this.nameRef.value.textContent = this.originalName.value;
    }

    handleNameKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.nameRef.value.blur();
        } else if (e.key === 'Escape') {
            this.cancelNameEdit();
        }
    }

    handleBlur(e) {
        setTimeout(() => {
            if (this.isEditing.value && this.nameRef.value && 
                document.activeElement !== this.nameRef.value) {
                this.finishNameEdit();
            }
        }, 100);
    }

    getIsEditing() {
        return this.isEditing.value;
    }
}
