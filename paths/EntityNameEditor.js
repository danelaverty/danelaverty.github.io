// EntityNameEditor.js - Separated name editing logic
import { ref, nextTick } from './vue-composition-api.js';

export class EntityNameEditor {
    constructor(nameRef, emit) {
        this.nameRef = nameRef;
        this.emit = emit;
        this.isEditing = ref(false);
        this.originalName = ref('');

        // Bind methods to preserve 'this' context
        this.handleNameClick = this.handleNameClick.bind(this);
        this.handleNameKeydown = this.handleNameKeydown.bind(this);
        this.finishNameEdit = this.finishNameEdit.bind(this);
        this.startNameEdit = this.startNameEdit.bind(this);
        this.cancelNameEdit = this.cancelNameEdit.bind(this);
    }

    handleNameClick(e) {
        e.stopPropagation();
        this.startNameEdit();
    }

    startNameEdit() {
        if (!this.nameRef.value) return;
        
        this.isEditing.value = true;
        this.originalName.value = this.nameRef.value.textContent;
        this.nameRef.value.contentEditable = true;
        this.nameRef.value.focus();

        nextTick(() => {
            const range = document.createRange();
            range.selectNodeContents(this.nameRef.value);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }

    finishNameEdit() {
        if (!this.nameRef.value) return;
        
        this.isEditing.value = false;
        this.nameRef.value.contentEditable = false;
        
        const newName = this.nameRef.value.textContent.trim() || '???';
        const entityId = this.nameRef.value.closest('.entity-container')?.getAttribute('data-entity-id');
        
        if (newName !== this.originalName.value && entityId) {
            this.emit('update-name', { id: entityId, name: newName });
        }
        
        this.nameRef.value.textContent = newName;
    }

    cancelNameEdit() {
        if (!this.nameRef.value) return;
        
        this.isEditing.value = false;
        this.nameRef.value.contentEditable = false;
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

    getIsEditing() {
        return this.isEditing.value;
    }
}
