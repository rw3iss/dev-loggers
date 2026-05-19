export type ResizeOptions = {
    handles?: ('top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')[];
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    onResize?: (width: number, height: number) => void;
};
export declare function makeResizable(container: HTMLElement, options?: ResizeOptions): void;
export type DragOptions = {
    onDragStart?: (e: MouseEvent) => void;
    onDrag?: (x: number, y: number) => void;
    onDragEnd?: () => void;
};
export declare function makeDraggable(element: HTMLElement, handleElement?: HTMLElement, options?: DragOptions): () => void;
export declare function getWindowSize(): {
    width: number;
    height: number;
};
//# sourceMappingURL=domUtils.d.ts.map