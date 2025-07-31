class Draggable {
	constructor(element, onDragEnd, container = null) {
		this.element = element;
		this.onDragEnd = onDragEnd;
		this.container = container; // Optional container for relative positioning
		this.isDragging = false;
		this.startX = 0;
		this.startY = 0;
		this.offsetX = 0;
		this.offsetY = 0;

		this.bindEvents();
	}

	bindEvents() {
		this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
		document.addEventListener('mousemove', this.handleMouseMove.bind(this));
		document.addEventListener('mouseup', this.handleMouseUp.bind(this));
	}

	getContainerOffset() {
		if (!this.container) return { left: 0, top: 0 };
		const containerRect = this.container.getBoundingClientRect();
		return { left: containerRect.left, top: containerRect.top };
	}

	handleMouseDown(e) {
		if (e.target.hasAttribute('contenteditable')) return;

		this.isDragging = true;
		this.element.classList.add('dragging');

		const rect = this.element.getBoundingClientRect();
		this.offsetX = e.clientX - rect.left;
		this.offsetY = e.clientY - rect.top;

		e.preventDefault();
	}

	handleMouseMove(e) {
		if (!this.isDragging) return;

		const containerOffset = this.getContainerOffset();
		
		// Calculate position relative to container
		const x = e.clientX - this.offsetX - containerOffset.left;
		const y = e.clientY - this.offsetY - containerOffset.top;

		this.element.style.left = `${x}px`;
		this.element.style.top = `${y}px`;
	}

	handleMouseUp(e) {
		if (!this.isDragging) return;

		this.isDragging = false;
		this.element.classList.remove('dragging');

		if (this.onDragEnd) {
			const containerOffset = this.getContainerOffset();
			
			// Calculate final position relative to container
			const x = e.clientX - this.offsetX - containerOffset.left;
			const y = e.clientY - this.offsetY - containerOffset.top;
			
			this.onDragEnd(x, y);
		}
	}
}
