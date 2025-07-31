// Pure data model for a square - no DOM logic
class SquareModel {
	constructor(data) {
		this.id = data.id;
		this.x = data.x;
		this.y = data.y;
		this.name = data.name;
		this.documentId = data.documentId;
	}

	// Create a new instance with updated properties
	update(updates) {
		return new SquareModel({
			...this,
			...updates
		});
	}

	// Get a plain object representation
	toPlainObject() {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.name,
			documentId: this.documentId
		};
	}

	// Validation
	isValid() {
		return (
			typeof this.id === 'string' &&
			typeof this.x === 'number' &&
			typeof this.y === 'number' &&
			typeof this.name === 'string' &&
			typeof this.documentId === 'string' &&
			this.x >= 0 &&
			this.y >= 0 &&
			this.name.trim().length > 0
		);
	}

	// Get validation errors
	getValidationErrors() {
		const errors = [];
		
		if (!this.id || typeof this.id !== 'string') {
			errors.push('ID is required and must be a string');
		}
		
		if (typeof this.x !== 'number' || this.x < 0) {
			errors.push('X coordinate must be a non-negative number');
		}
		
		if (typeof this.y !== 'number' || this.y < 0) {
			errors.push('Y coordinate must be a non-negative number');
		}
		
		if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
			errors.push('Name is required and must be a non-empty string');
		}
		
		if (!this.documentId || typeof this.documentId !== 'string') {
			errors.push('Document ID is required and must be a string');
		}
		
		return errors;
	}
}
