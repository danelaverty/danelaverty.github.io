class KeyboardManager {
	constructor(onDeleteSquare, onDeleteCircle) {
		this.onDeleteSquare = onDeleteSquare;
		this.onDeleteCircle = onDeleteCircle;
		this.bindEvents();
	}

	bindEvents() {
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
	}

	handleKeyDown(e) {
		if (e.key === 'Delete') {
			// Priority: Squares first, then Circles
			// Try to delete a square first
			if (this.onDeleteSquare && this.onDeleteSquare()) {
				// Square was deleted, we're done
				return;
			}
			
			// No square was deleted, try to delete a circle
			if (this.onDeleteCircle) {
				this.onDeleteCircle();
			}
		}
	}
}
