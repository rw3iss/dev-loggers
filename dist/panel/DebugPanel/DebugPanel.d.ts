export declare enum ScreenPosition {
    TopLeft = "topLeft",
    Top = "top",
    TopRight = "topRight",
    Right = "right",
    BottomRight = "bottomRight",
    Bottom = "bottom",
    BottomLeft = "bottomLeft",
    Left = "left"
}
/** Subset of the dev-loggers public surface this panel uses. Typed as a
 *  duck-typed interface so we don't pull dev-loggers in as a peer dep
 *  unless the consumer wires it. */
export interface LoggersApi {
    attachSink: (sink: {
        name?: string;
        write: (event: LoggerEvent) => void;
    }) => unknown;
    detachSink?: (sink: unknown) => void;
    getLoggerStates: () => Array<{
        namespace: string;
        enabled: boolean;
    }>;
    enableLogger: (ns: string) => void;
    disableLogger: (ns: string) => void;
}
/** v4 LogEvent shape from dev-loggers. We accept a subset for safety. */
export interface LoggerEvent {
    namespace: string;
    id?: string;
    level?: 'log' | 'warn' | 'error' | 'debug';
    args: any[];
    data?: any;
    timestamp?: number;
}
export interface DebugPanelSettings {
    left: number;
    top: number;
    width: number;
    height: number;
    visible: boolean;
    opacity: number;
}
export interface DebugPanelOptions {
    /** Show on construction (default: respect saved settings, else false). */
    show?: boolean;
    /** Initial position for the first-ever mount on this origin. */
    position?: ScreenPosition;
    width?: number;
    height?: number;
    snap?: boolean;
    snapPadding?: number;
    /** Skip auto-mount to document.body. Caller must append `panel.element`. */
    mount?: boolean;
    /** Container to mount into (default: document.body). Ignored if `mount: false`. */
    parent?: HTMLElement;
    /** dev-loggers API. When provided, the panel registers itself as a Sink and wires the config tab. */
    loggers?: LoggersApi;
    /** Keyboard shortcut string. Default: 'shift+alt+d'. Pass `null` to disable. */
    shortcut?: string | null;
}
export declare class DebugPanel {
    /** Root DOM element. Public so the consumer can mount it manually. */
    readonly element: HTMLElement;
    private container;
    private tabContainer;
    private contentContainer;
    private toolbar;
    private opacitySlider;
    private tabEntries;
    private tabButtons;
    private debugStates;
    private activeTab;
    private options;
    private configOverrides;
    private getLoggerStatesFn;
    private enableLoggerFn;
    private disableLoggerFn;
    private sinkHandle;
    private detachLoggers;
    private shortcutHandler;
    constructor(options?: DebugPanelOptions);
    private createContainer;
    private createTabContainer;
    private createContentContainer;
    private createGlobalToolbar;
    private formatShortcutHint;
    private setupResizable;
    private setupDraggable;
    private setupPosition;
    private setupKeyboardShortcut;
    /**
     * Append the panel to its parent. If document.body is not yet available
     * (constructor called from a <head> script, or before SSR hydration
     * commits the body), defer until DOMContentLoaded. This is what fixes
     * the "panel doesn't initialize on first load, works after refresh"
     * symptom that consumers see in Next.js / Remix / Astro apps.
     */
    private scheduleMount;
    private restoreSettings;
    private loadSettings;
    private saveSettings;
    /**
     * Register this panel as a Sink with dev-loggers. Every LogEvent flowing
     * through dev-loggers will be rendered in the panel.
     */
    attachToLoggers(api: LoggersApi): void;
    /** v1 compatibility shim. Prefer `attachToLoggers(api)`. */
    setLoggerApi(api: {
        getLoggerStates: () => Array<{
            namespace: string;
            enabled: boolean;
        }>;
        enableLogger: (ns: string) => void;
        disableLogger: (ns: string) => void;
    }): void;
    /** Public so the standalone `debug()` helper can dispatch directly. */
    onLoggerEvent(event: LoggerEvent): void;
    private recordEntry;
    private formatEventText;
    debug(id: string, state?: any): void;
    private updateDebugState;
    private addDebugState;
    private addTab;
    private createTabToolbar;
    private switchTab;
    private getTabContent;
    private getTabEntriesEl;
    clearTab(tabId: string): void;
    copyTab(tabId: string): void;
    private serializeEntry;
    /**
     * v1 method: log free-form text/objects to a namespace tab. Prefer using
     * dev-loggers `debug(id, ...args)` with `attachToLoggers()` instead — that
     * gives you structured events with `data` for the JSON viewer.
     */
    log(namespace: string, message: Array<any> | object | string): void;
    private createLogElement;
    private removeLogEntry;
    private updateToolbarLayout;
    private handleOpacityChange;
    private handleSnapWhileDragging;
    show(): void;
    hide(): void;
    toggle(): void;
    /** Tear down listeners, sink, and (if mounted) remove the element. */
    destroy(): void;
    private loadConfigOverrides;
    private saveConfigOverrides;
    applyConfigOverrides(): void;
    private renderConfigTab;
    private setAllNamespaces;
}
/**
 * Standalone debug(id, …args). Resolves the *singleton* panel registered
 * on globalThis (set by the constructor when `mount: true`), and falls
 * back to a console.log so calls don't drop on the floor. For structured
 * routing prefer importing `debug` from dev-loggers.
 */
export declare function debug(id: string, ...args: any[]): void;
//# sourceMappingURL=DebugPanel.d.ts.map