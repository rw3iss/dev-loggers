export type ResizeOptions = {
	handles?: ('top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')[];
	maxWidth?: number;
	maxHeight?: number;
	minWidth?: number;
	minHeight?: number;
	onResize?: (width: number, height: number) => void;
};

export function makeResizable(container: HTMLElement, options: ResizeOptions = {}) {
	// Remove existing handles
	container.querySelectorAll('.resize-handle').forEach((handle) => handle.remove());

	// Default options - now includes all sides and corners
	const {
		handles = ['top', 'left', 'right', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
		maxWidth = Infinity,
		maxHeight = Infinity,
		minWidth = 100,
		minHeight = 100,
		onResize = () => { }
	} = options;

	let resizing = false;
	let resizeDirection: string | null = null;
	let startX = 0,
		startY = 0;
	let startWidth = 0,
		startHeight = 0;
	let startLeft = 0,
		startTop = 0;

	function createHandle(position: string) {
		const handle = document.createElement('div');
		handle.classList.add('resize-handle', `resize-${position}`);
		handle.addEventListener('mousedown', (e) => startResizing(e, position));
		container.appendChild(handle);
	}

	function startResizing(event: MouseEvent, direction: string) {
		resizing = true;
		resizeDirection = direction;
		startX = event.clientX;
		startY = event.clientY;

		// Capture initial dimensions and position
		startWidth = container.offsetWidth;
		startHeight = container.offsetHeight;
		startLeft = container.offsetLeft;
		startTop = container.offsetTop;

		event.preventDefault();
		event.stopPropagation();
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResizing);
	}

	function resize(event: MouseEvent) {
		if (!resizing || !resizeDirection) return;

		let newWidth = startWidth;
		let newHeight = startHeight;
		let newLeft = startLeft;
		let newTop = startTop;

		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;

		// Handle horizontal resizing
		if (resizeDirection.includes('right')) {
			newWidth = Math.min(Math.max(startWidth + deltaX, minWidth), maxWidth);
		}
		if (resizeDirection.includes('left')) {
			const potentialWidth = startWidth - deltaX;
			if (potentialWidth >= minWidth && potentialWidth <= maxWidth) {
				newWidth = potentialWidth;
				newLeft = startLeft + deltaX;
			}
		}

		// Handle vertical resizing
		if (resizeDirection.includes('bottom')) {
			newHeight = Math.min(Math.max(startHeight + deltaY, minHeight), maxHeight);
		}
		if (resizeDirection.includes('top')) {
			const potentialHeight = startHeight - deltaY;
			if (potentialHeight >= minHeight && potentialHeight <= maxHeight) {
				newHeight = potentialHeight;
				newTop = startTop + deltaY;
			}
		}

		container.style.width = `${newWidth}px`;
		container.style.height = `${newHeight}px`;
		container.style.left = `${newLeft}px`;
		container.style.top = `${newTop}px`;

		onResize(newWidth, newHeight);
	}

	function stopResizing() {
		resizing = false;
		resizeDirection = null;
		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResizing);
	}

	// Add handles based on config
	handles.forEach((handle) => createHandle(handle));
}

export type DragOptions = {
	onDragStart?: (e: MouseEvent) => void;
	onDrag?: (x: number, y: number) => void;
	onDragEnd?: () => void;
};

export function makeDraggable(
	element: HTMLElement,
	handleElement?: HTMLElement,
	options: DragOptions = {}
) {
	const dragHandle = handleElement || element;
	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let initialLeft = 0;
	let initialTop = 0;

	const { onDragStart, onDrag, onDragEnd } = options;

	function startDragging(event: MouseEvent) {
		// Don't start dragging if clicking on buttons or interactive elements
		const target = event.target as HTMLElement;
		if (target.tagName === 'BUTTON' || target.closest('button')) {
			return;
		}

		isDragging = true;
		startX = event.clientX;
		startY = event.clientY;

		// Get current computed position (handles both absolute and other positioning)
		const computedStyle = getComputedStyle(element);
		initialLeft = parseInt(computedStyle.left) || element.offsetLeft;
		initialTop = parseInt(computedStyle.top) || element.offsetTop;

		// Ensure element has position fixed or absolute for dragging
		if (computedStyle.position !== 'absolute' && computedStyle.position !== 'fixed') {
			element.style.position = 'absolute';
			element.style.left = `${initialLeft}px`;
			element.style.top = `${initialTop}px`;
		}

		event.preventDefault();
		dragHandle.style.cursor = 'grabbing';

		if (onDragStart) onDragStart(event);

		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', stopDragging);
	}

	function drag(event: MouseEvent) {
		if (!isDragging) return;

		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;

		const newLeft = initialLeft + deltaX;
		const newTop = initialTop + deltaY;

		element.style.left = `${newLeft}px`;
		element.style.top = `${newTop}px`;

		if (onDrag) onDrag(newLeft, newTop);
	}

	function stopDragging() {
		if (!isDragging) return;

		isDragging = false;
		dragHandle.style.cursor = 'grab';

		if (onDragEnd) onDragEnd();

		document.removeEventListener('mousemove', drag);
		document.removeEventListener('mouseup', stopDragging);
	}

	// Set up drag handle cursor
	dragHandle.style.cursor = 'grab';
	dragHandle.addEventListener('mousedown', startDragging);

	// Return cleanup function
	return () => {
		dragHandle.removeEventListener('mousedown', startDragging);
		document.removeEventListener('mousemove', drag);
		document.removeEventListener('mouseup', stopDragging);
	};
}

export function getWindowSize(): { width: number; height: number } {
	const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	return { width, height };
} 