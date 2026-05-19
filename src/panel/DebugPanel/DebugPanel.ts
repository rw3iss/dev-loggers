import safeStringify from 'fast-safe-stringify';
import { JsonView } from '../JsonView/JsonView.js';
import { getWindowSize, makeResizable, makeDraggable } from '../utils/domUtils.js';

const DEBUG_STATE_NAMESPACE = 'objects';
const CONFIG_NAMESPACE = 'config';
const GLOBAL_TAB = 'global';
const CONFIG_STORAGE_KEY = 'debugPanelNamespaceConfig';

export enum ScreenPosition {
	TopLeft = 'topLeft',
	Top = 'top',
	TopRight = 'topRight',
	Right = 'right',
	BottomRight = 'bottomRight',
	Bottom = 'bottom',
	BottomLeft = 'bottomLeft',
	Left = 'left',
}

const MIN_WIDTH = 280;

/** Subset of the dev-loggers public surface this panel uses. Typed as a
 *  duck-typed interface so we don't pull dev-loggers in as a peer dep
 *  unless the consumer wires it. */
export interface LoggersApi {
	attachSink: (sink: { name?: string; write: (event: LoggerEvent) => void }) => unknown;
	detachSink?: (sink: unknown) => void;
	getLoggerStates: () => Array<{ namespace: string; enabled: boolean }>;
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

type LogEntry = {
	id: string;
	tabId: string;
	level: 'log' | 'warn' | 'error' | 'debug';
	text: string;
	data?: any;
	timestamp: Date;
};

interface TabEntries {
	[tabId: string]: LogEntry[];
}

interface DebugState {
	state: any;
	jsonView: JsonView;
	isExpanded: boolean;
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

const DEFAULT_SHORTCUT = 'shift+alt+d';

export class DebugPanel {
	/** Root DOM element. Public so the consumer can mount it manually. */
	public readonly element: HTMLElement;

	private container: HTMLElement;
	private tabContainer: HTMLElement;
	private contentContainer: HTMLElement;
	private toolbar: HTMLElement;
	private opacitySlider!: HTMLInputElement;
	private tabEntries: TabEntries = {};
	private tabButtons: Map<string, HTMLButtonElement> = new Map();
	private debugStates: { [id: string]: DebugState } = {};
	private activeTab: string = GLOBAL_TAB;
	private options: DebugPanelOptions;
	private configOverrides: Record<string, boolean> = {};
	private getLoggerStatesFn: (() => Array<{ namespace: string; enabled: boolean }>) | null = null;
	private enableLoggerFn: ((ns: string) => void) | null = null;
	private disableLoggerFn: ((ns: string) => void) | null = null;
	private sinkHandle: unknown = null;
	private detachLoggers: (() => void) | null = null;
	private shortcutHandler: ((e: KeyboardEvent) => void) | null = null;

	constructor(options: DebugPanelOptions = {}) {
		this.options = {
			position: ScreenPosition.BottomRight,
			width: 600,
			height: 400,
			snap: false,
			snapPadding: 20,
			mount: true,
			shortcut: DEFAULT_SHORTCUT,
			...options,
		};

		// Idempotency: if a prior panel exists on this page (React StrictMode
		// re-mount, HMR, fast-refresh, accidental double-construction), tear
		// it down first. Otherwise we'd leave a stale keydown listener and a
		// ghost DOM node behind.
		const prior = (globalThis as { __devDebugPanel?: DebugPanel }).__devDebugPanel;
		if (prior && prior !== this) {
			try { prior.destroy(); } catch { /* prior was already half-destroyed; ignore */ }
		}

		this.container = this.createContainer();
		this.element = this.container;
		this.tabContainer = this.createTabContainer();
		this.contentContainer = this.createContentContainer();

		this.container.appendChild(this.tabContainer);
		this.container.appendChild(this.contentContainer);

		this.toolbar = this.createGlobalToolbar();
		this.container.appendChild(this.toolbar);

		this.addTab(DEBUG_STATE_NAMESPACE);
		this.addTab(GLOBAL_TAB);
		this.addTab(CONFIG_NAMESPACE);

		this.loadConfigOverrides();
		this.restoreSettings();
		this.setupResizable();
		this.setupDraggable();
		this.setupKeyboardShortcut();

		if (this.options.mount) {
			this.scheduleMount();
		}

		if (this.options.loggers) {
			this.attachToLoggers(this.options.loggers);
		}

		// Publish the most-recent instance for the standalone debug() helper.
		(globalThis as { __devDebugPanel?: DebugPanel }).__devDebugPanel = this;

		// Only show if explicitly requested AND there are no saved settings.
		if (options.show && !this.loadSettings()) {
			this.show();
		}
	}

	// ─── DOM construction ─────────────────────────────────────────

	private createContainer(): HTMLElement {
		const container = document.createElement('div');
		container.classList.add('debug-panel');
		container.style.width = `${this.options.width}px`;
		container.style.height = `${this.options.height}px`;
		container.style.position = 'fixed';
		container.style.opacity = '1';
		return container;
	}

	private createTabContainer(): HTMLElement {
		const tabContainer = document.createElement('div');
		tabContainer.classList.add('debug-panel-tabs');
		return tabContainer;
	}

	private createContentContainer(): HTMLElement {
		const contentContainer = document.createElement('div');
		contentContainer.classList.add('debug-panel-content');
		return contentContainer;
	}

	private createGlobalToolbar(): HTMLElement {
		const toolbar = document.createElement('div');
		toolbar.classList.add('debug-toolbar');

		const hint = document.createElement('span');
		hint.classList.add('debug-keyboard-hint');
		hint.textContent = this.formatShortcutHint();
		hint.style.color = '#999';
		hint.style.fontSize = '11px';

		const opacityContainer = document.createElement('div');
		opacityContainer.classList.add('debug-opacity-container');

		this.opacitySlider = document.createElement('input');
		this.opacitySlider.type = 'range';
		this.opacitySlider.min = '20';
		this.opacitySlider.max = '100';
		this.opacitySlider.value = '100';
		this.opacitySlider.classList.add('debug-opacity-slider');
		this.opacitySlider.oninput = () => this.handleOpacityChange();
		opacityContainer.appendChild(this.opacitySlider);

		const hideButton = document.createElement('button');
		hideButton.classList.add('debug-hide-button');
		hideButton.textContent = 'Hide';
		hideButton.onclick = () => this.hide();

		toolbar.appendChild(hint);
		toolbar.appendChild(opacityContainer);
		toolbar.appendChild(hideButton);

		return toolbar;
	}

	private formatShortcutHint(): string {
		const sc = this.options.shortcut;
		if (!sc) return '';
		const pretty = sc
			.split('+')
			.map((p) => p[0]!.toUpperCase() + p.slice(1).toLowerCase())
			.join('+');
		return `${pretty} to hide/show`;
	}

	private setupResizable(): void {
		const { width, height } = getWindowSize();
		makeResizable(this.container, {
			handles: ['top', 'left', 'right', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
			maxWidth: width - 20,
			maxHeight: height - 20,
			minWidth: 200,
			minHeight: 150,
			onResize: (newWidth: number) => {
				this.updateToolbarLayout(newWidth);
				this.saveSettings();
			},
		});
	}

	private setupDraggable(): void {
		if (this.options.snap) {
			makeDraggable(this.container, this.tabContainer, {
				onDrag: (x: number, y: number) => this.handleSnapWhileDragging(x, y),
				onDragEnd: () => this.saveSettings(),
			});
		} else {
			makeDraggable(this.container, this.tabContainer, {
				onDragEnd: () => this.saveSettings(),
			});
		}
	}

	private setupPosition(): void {
		const { width, height } = getWindowSize();
		const panelWidth = this.options.width || 600;
		const panelHeight = this.options.height || 400;

		let left = 0;
		let top = 0;

		switch (this.options.position) {
			case ScreenPosition.TopLeft: left = 0; top = 0; break;
			case ScreenPosition.Top: left = (width - panelWidth) / 2; top = 0; break;
			case ScreenPosition.TopRight: left = width - panelWidth; top = 0; break;
			case ScreenPosition.Right: left = width - panelWidth; top = (height - panelHeight) / 2; break;
			case ScreenPosition.BottomRight: left = width - panelWidth; top = height - panelHeight; break;
			case ScreenPosition.Bottom: left = (width - panelWidth) / 2; top = height - panelHeight; break;
			case ScreenPosition.BottomLeft: left = 0; top = height - panelHeight; break;
			case ScreenPosition.Left: left = 0; top = (height - panelHeight) / 2; break;
		}

		this.container.style.left = `${left}px`;
		this.container.style.top = `${top}px`;
	}

	private setupKeyboardShortcut(): void {
		if (!this.options.shortcut) return;
		const spec = parseShortcut(this.options.shortcut);
		const handler = (event: KeyboardEvent) => {
			if (event.shiftKey !== spec.shift) return;
			if (event.altKey !== spec.alt) return;
			if (event.ctrlKey !== spec.ctrl) return;
			if (event.metaKey !== spec.meta) return;
			if (event.key.toLowerCase() !== spec.key) return;
			event.preventDefault();
			event.stopPropagation();
			this.toggle();
		};
		this.shortcutHandler = handler;
		// `window` + capture phase: catches the chord regardless of which
		// element has focus, and runs *before* any descendant component can
		// call stopPropagation() on the event (MUI dialogs, code editors,
		// rich-text inputs all do this for their own hotkeys).
		window.addEventListener('keydown', handler, { capture: true });
	}

	/**
	 * Append the panel to its parent. If document.body is not yet available
	 * (constructor called from a <head> script, or before SSR hydration
	 * commits the body), defer until DOMContentLoaded. This is what fixes
	 * the "panel doesn't initialize on first load, works after refresh"
	 * symptom that consumers see in Next.js / Remix / Astro apps.
	 */
	private scheduleMount(): void {
		const tryAppend = () => {
			const parent = this.options.parent ?? document.body;
			if (!parent) return false;
			parent.appendChild(this.container);
			return true;
		};
		if (tryAppend()) return;

		if (typeof document !== 'undefined' && document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => { tryAppend(); }, { once: true });
			return;
		}
		// Document is interactive/complete but body is still null (rare).
		// One microtask later it should exist.
		queueMicrotask(() => {
			if (!tryAppend()) {
				// Final fallback: try again on the next animation frame.
				if (typeof requestAnimationFrame !== 'undefined') {
					requestAnimationFrame(() => { tryAppend(); });
				}
			}
		});
	}

	// ─── Settings persistence ─────────────────────────────────────

	private restoreSettings(): void {
		const savedSettings = this.loadSettings();
		if (savedSettings) {
			this.container.style.left = `${savedSettings.left}px`;
			this.container.style.top = `${savedSettings.top}px`;
			this.container.style.width = `${savedSettings.width}px`;
			this.container.style.height = `${savedSettings.height}px`;

			const opacity = savedSettings.opacity !== undefined ? savedSettings.opacity : 1;
			this.container.style.opacity = String(opacity);
			if (this.opacitySlider) {
				this.opacitySlider.value = String(Math.round(opacity * 100));
			}
			if (savedSettings.visible) {
				this.container.classList.add('visible');
			} else {
				this.container.classList.remove('visible');
			}
		} else {
			this.setupPosition();
		}
	}

	private loadSettings(): DebugPanelSettings | null {
		try {
			const settingsJson = localStorage.getItem('debugPanelSettings');
			if (settingsJson) return JSON.parse(settingsJson);
		} catch (error) {
			console.error('Failed to load debug panel settings:', error);
		}
		return null;
	}

	private saveSettings(): void {
		try {
			const opacity = parseFloat(this.container.style.opacity) || 1;
			const settings: DebugPanelSettings = {
				left: parseInt(this.container.style.left) || this.container.offsetLeft,
				top: parseInt(this.container.style.top) || this.container.offsetTop,
				width: this.container.offsetWidth,
				height: this.container.offsetHeight,
				visible: this.container.classList.contains('visible'),
				opacity,
			};
			localStorage.setItem('debugPanelSettings', JSON.stringify(settings));
		} catch (error) {
			console.error('Failed to save debug panel settings:', error);
		}
	}

	// ─── Logger integration (Sink + config tab) ───────────────────

	/**
	 * Register this panel as a Sink with dev-loggers. Every LogEvent flowing
	 * through dev-loggers will be rendered in the panel.
	 */
	public attachToLoggers(api: LoggersApi): void {
		this.getLoggerStatesFn = api.getLoggerStates;
		this.enableLoggerFn = api.enableLogger;
		this.disableLoggerFn = api.disableLogger;

		const sink = {
			name: 'dev-debug-panel',
			write: (event: LoggerEvent) => this.onLoggerEvent(event),
		};
		this.sinkHandle = api.attachSink(sink);
		this.detachLoggers = () => {
			if (api.detachSink && this.sinkHandle) api.detachSink(this.sinkHandle);
		};
		this.applyConfigOverrides();
	}

	/** v1 compatibility shim. Prefer `attachToLoggers(api)`. */
	public setLoggerApi(api: {
		getLoggerStates: () => Array<{ namespace: string; enabled: boolean }>;
		enableLogger: (ns: string) => void;
		disableLogger: (ns: string) => void;
	}): void {
		this.getLoggerStatesFn = api.getLoggerStates;
		this.enableLoggerFn = api.enableLogger;
		this.disableLoggerFn = api.disableLogger;
		this.applyConfigOverrides();
	}

	/** Public so the standalone `debug()` helper can dispatch directly. */
	public onLoggerEvent(event: LoggerEvent): void {
		// Route structured `data` to the objects tab if it looks like a state update.
		if (event.id && event.data && typeof event.data === 'object') {
			this.recordEntry(event.id, event);
			this.recordEntry(GLOBAL_TAB, event);
			return;
		}
		const tab = event.id || event.namespace || GLOBAL_TAB;
		this.recordEntry(tab, event);
		if (tab !== GLOBAL_TAB) this.recordEntry(GLOBAL_TAB, event);
	}

	private recordEntry(tabId: string, event: LoggerEvent): void {
		if (!this.tabEntries[tabId]) this.addTab(tabId);

		const entry: LogEntry = {
			id: `${tabId}-${Date.now()}-${Math.random()}`,
			tabId,
			level: event.level || 'log',
			text: this.formatEventText(event),
			data: event.data,
			timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
		};
		this.tabEntries[tabId]!.push(entry);

		const entries = this.getTabEntriesEl(tabId);
		if (!entries) return;
		entries.appendChild(this.createLogElement(entry));
	}

	private formatEventText(event: LoggerEvent): string {
		const parts: string[] = [];
		for (const a of event.args) {
			if (a == null) {
				parts.push(String(a));
			} else if (typeof a === 'string') {
				// strip ANSI color codes for the panel
				parts.push(a.replace(/\x1b\[[0-9;:]*m/g, ''));
			} else if (typeof a === 'object') {
				parts.push(safeStringify(a));
			} else {
				parts.push(String(a));
			}
		}
		return parts.join(' ');
	}

	// ─── Debug state (JsonView trees) ─────────────────────────────

	public debug(id: string, state?: any): void {
		const safeState = safeStringify(state);
		const parsedState = JSON.parse(safeState);

		if (this.debugStates[id]) {
			this.updateDebugState(id, parsedState);
		} else {
			this.addDebugState(id, parsedState);
		}
	}

	private updateDebugState(id: string, state: any): void {
		const entries = this.getTabEntriesEl(DEBUG_STATE_NAMESPACE);
		if (!entries) return;
		const debugWrapper: HTMLElement | null = entries.querySelector(`#debug-state-${cssEscape(id)}`);
		if (!debugWrapper) return;
		this.debugStates[id]!.state = state;
		this.debugStates[id]!.jsonView.updateJson(state);
	}

	private addDebugState(id: string, state: any): void {
		const entries = this.getTabEntriesEl(DEBUG_STATE_NAMESPACE);
		if (!entries) return;

		const debugWrapper = document.createElement('div');
		debugWrapper.classList.add('debug-state');
		debugWrapper.id = `debug-state-${cssEscape(id)}`;

		const toggleObjectOpen = () => {
			const isExpanded = this.debugStates[id]!.isExpanded;
			this.debugStates[id]!.isExpanded = !isExpanded;
			debugWrapper.classList.toggle('collapsed', isExpanded);
			toggleButton.textContent = isExpanded ? '[+]' : '[-]';
		};

		const toggleButton = document.createElement('button');
		toggleButton.classList.add('json-toggle');
		toggleButton.textContent = '[-]';
		toggleButton.onclick = toggleObjectOpen;
		debugWrapper.appendChild(toggleButton);

		const label = document.createElement('div');
		label.classList.add('debug-state-label');
		label.innerText = id || 'untitled';
		label.onclick = toggleObjectOpen;
		debugWrapper.appendChild(label);

		const jsonWrapper = document.createElement('div');
		jsonWrapper.classList.add('json-wrapper');
		debugWrapper.appendChild(jsonWrapper);

		const jsonView = new JsonView(state, jsonWrapper as HTMLElement, {});

		this.debugStates[id] = { state, jsonView, isExpanded: true };
		entries.appendChild(debugWrapper);
	}

	// ─── Tab management ───────────────────────────────────────────

	private addTab(tabId: string): void {
		if (this.tabEntries[tabId]) return;
		this.tabEntries[tabId] = [];

		const tab = document.createElement('button');
		tab.classList.add('debug-tab');
		tab.textContent = tabId;
		tab.onclick = () => this.switchTab(tabId);
		this.tabContainer.appendChild(tab);
		this.tabButtons.set(tabId, tab);

		const content = document.createElement('div');
		content.classList.add('debug-tab-content');
		content.dataset.namespace = tabId;

		// Per-tab toolbar (Copy + Clear) — config / objects tabs skip this.
		if (tabId !== CONFIG_NAMESPACE && tabId !== DEBUG_STATE_NAMESPACE) {
			content.appendChild(this.createTabToolbar(tabId));
		}

		const entriesWrapper = document.createElement('div');
		entriesWrapper.classList.add('debug-tab-entries');
		entriesWrapper.dataset.entriesFor = tabId;
		content.appendChild(entriesWrapper);

		this.contentContainer.appendChild(content);

		if (Object.keys(this.tabEntries).length === 1) {
			this.switchTab(tabId);
		}
	}

	private createTabToolbar(tabId: string): HTMLElement {
		const bar = document.createElement('div');
		bar.classList.add('debug-tab-toolbar');

		const copyBtn = document.createElement('button');
		copyBtn.classList.add('debug-tab-action', 'debug-tab-action-copy');
		copyBtn.title = `Copy all ${tabId} entries`;
		copyBtn.innerHTML = '<span aria-hidden="true">⧉</span> Copy';
		copyBtn.onclick = () => this.copyTab(tabId);

		const clearBtn = document.createElement('button');
		clearBtn.classList.add('debug-tab-action', 'debug-tab-action-clear');
		clearBtn.title = `Clear ${tabId}`;
		clearBtn.innerHTML = '<span aria-hidden="true">⌫</span> Clear';
		clearBtn.onclick = () => this.clearTab(tabId);

		bar.appendChild(copyBtn);
		bar.appendChild(clearBtn);
		return bar;
	}

	private switchTab(tabId: string): void {
		this.activeTab = tabId;
		this.tabButtons.forEach((btn, id) => btn.classList.toggle('active', id === tabId));

		this.contentContainer.querySelectorAll('.debug-tab-content').forEach((el) => {
			(el as HTMLElement).style.display = 'none';
		});

		const activeContent = this.getTabContent(tabId);
		if (activeContent) activeContent.style.display = 'flex';

		if (tabId === CONFIG_NAMESPACE) this.renderConfigTab();
	}

	private getTabContent(tabId: string): HTMLElement | null {
		return this.contentContainer.querySelector(
			`[data-namespace="${cssAttr(tabId)}"]`,
		) as HTMLElement | null;
	}

	private getTabEntriesEl(tabId: string): HTMLElement | null {
		return this.contentContainer.querySelector(
			`[data-entries-for="${cssAttr(tabId)}"]`,
		) as HTMLElement | null;
	}

	public clearTab(tabId: string): void {
		this.tabEntries[tabId] = [];
		if (tabId === DEBUG_STATE_NAMESPACE) {
			for (const key of Object.keys(this.debugStates)) delete this.debugStates[key];
		}
		const entries = this.getTabEntriesEl(tabId);
		if (entries) {
			entries.innerHTML = '';
			return;
		}
		// Fallback for tabs without an entries wrapper (shouldn't happen).
		const content = this.getTabContent(tabId);
		if (content) content.innerHTML = '';
	}

	public copyTab(tabId: string): void {
		const lines = (this.tabEntries[tabId] || []).map((e) => this.serializeEntry(e));
		const text = lines.join('\n');
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
		} else {
			fallbackCopy(text);
		}
	}

	private serializeEntry(e: LogEntry): string {
		const ts = e.timestamp.toISOString();
		const dataPart = e.data ? ` ${safeStringify(e.data)}` : '';
		return `[${ts}] [${e.level}] ${e.text}${dataPart}`;
	}

	// ─── Log API (legacy + new) ───────────────────────────────────

	/**
	 * v1 method: log free-form text/objects to a namespace tab. Prefer using
	 * dev-loggers `debug(id, ...args)` with `attachToLoggers()` instead — that
	 * gives you structured events with `data` for the JSON viewer.
	 */
	public log(namespace: string, message: Array<any> | object | string): void {
		const args = Array.isArray(message) ? message : [message];
		this.onLoggerEvent({
			namespace,
			level: 'log',
			args,
			timestamp: Date.now(),
			data: typeof message === 'object' && !Array.isArray(message) ? message : undefined,
		});
	}

	// ─── Entry rendering ──────────────────────────────────────────

	private createLogElement(entry: LogEntry): HTMLElement {
		const el = document.createElement('div');
		el.classList.add('debug-log-entry', `debug-log-entry-${entry.level}`);
		el.dataset.logId = entry.id;

		const text = document.createElement('div');
		text.classList.add('debug-log-entry-text');
		text.innerText = `[${entry.timestamp.toLocaleTimeString()}] ${entry.text}`;

		const copy = document.createElement('button');
		copy.classList.add('debug-copy-button');
		copy.title = 'Copy entry';
		copy.innerText = '⧉';
		copy.onclick = () => {
			const t = this.serializeEntry(entry);
			navigator.clipboard?.writeText(t).catch(() => fallbackCopy(t));
		};

		const del = document.createElement('button');
		del.classList.add('debug-delete-button');
		del.title = 'Remove entry';
		del.innerText = '×';
		del.onclick = () => this.removeLogEntry(entry.tabId, entry.id, el);

		el.appendChild(text);
		el.appendChild(copy);
		el.appendChild(del);

		if (entry.data && typeof entry.data === 'object') {
			const wrapper = document.createElement('div');
			wrapper.classList.add('debug-log-entry-data');
			text.appendChild(wrapper);
			new JsonView(entry.data, wrapper, {});
		}
		return el;
	}

	private removeLogEntry(tabId: string, logId: string, logElement: HTMLElement): void {
		this.tabEntries[tabId] = (this.tabEntries[tabId] || []).filter((e) => e.id !== logId);
		logElement.remove();
	}

	// ─── Misc UI ──────────────────────────────────────────────────

	private updateToolbarLayout(width: number): void {
		this.container.classList.toggle('narrow-panel', width < MIN_WIDTH);
	}

	private handleOpacityChange(): void {
		const opacityPercent = parseInt(this.opacitySlider.value);
		const opacity = opacityPercent / 100;
		if (this.container.classList.contains('visible')) {
			this.container.style.opacity = String(opacity);
		}
		this.saveSettings();
	}

	private handleSnapWhileDragging(x: number, y: number): void {
		const snapPadding = this.options.snapPadding || 20;
		const { width: windowWidth, height: windowHeight } = getWindowSize();
		const panelWidth = this.container.offsetWidth;
		const panelHeight = this.container.offsetHeight;

		let snappedX = x;
		let snappedY = y;
		if (x < snapPadding) snappedX = 0;
		else if (x + panelWidth > windowWidth - snapPadding) snappedX = windowWidth - panelWidth;
		if (y < snapPadding) snappedY = 0;
		else if (y + panelHeight > windowHeight - snapPadding) snappedY = windowHeight - panelHeight;

		if (snappedX !== x || snappedY !== y) {
			this.container.style.left = `${snappedX}px`;
			this.container.style.top = `${snappedY}px`;
		}
	}

	// ─── Panel controls ───────────────────────────────────────────

	public show(): void {
		this.container.classList.add('visible');
		const opacity = parseFloat(this.container.style.opacity) || 1;
		this.container.style.opacity = String(opacity);
		this.saveSettings();
	}

	public hide(): void {
		this.container.classList.remove('visible');
		this.saveSettings();
	}

	public toggle(): void {
		if (this.container.classList.contains('visible')) this.hide();
		else this.show();
	}

	/** Tear down listeners, sink, and (if mounted) remove the element. */
	public destroy(): void {
		if (this.shortcutHandler) {
			// Must match the `capture: true` used when attaching, otherwise
			// removeEventListener silently no-ops and the listener leaks.
			window.removeEventListener('keydown', this.shortcutHandler, { capture: true } as AddEventListenerOptions);
			this.shortcutHandler = null;
		}
		if (this.detachLoggers) {
			this.detachLoggers();
			this.detachLoggers = null;
			this.sinkHandle = null;
		}
		this.container.remove();
		// Clear the singleton ref only if it still points at us. (If another
		// panel was constructed and took over, leave its reference alone.)
		const slot = globalThis as { __devDebugPanel?: DebugPanel };
		if (slot.__devDebugPanel === this) {
			delete slot.__devDebugPanel;
		}
	}

	// ─── Config tab ───────────────────────────────────────────────

	private loadConfigOverrides(): void {
		try {
			const json = localStorage.getItem(CONFIG_STORAGE_KEY);
			if (json) this.configOverrides = JSON.parse(json);
		} catch {
			/* ignore */
		}
	}

	private saveConfigOverrides(): void {
		try {
			localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.configOverrides));
		} catch {
			/* ignore */
		}
	}

	public applyConfigOverrides(): void {
		if (!this.enableLoggerFn || !this.disableLoggerFn) return;
		for (const [ns, enabled] of Object.entries(this.configOverrides)) {
			if (enabled) this.enableLoggerFn(ns);
			else this.disableLoggerFn(ns);
		}
	}

	private renderConfigTab(): void {
		const content = this.getTabContent(CONFIG_NAMESPACE);
		if (!content) return;
		content.innerHTML = '';

		const wrapper = document.createElement('div');
		wrapper.classList.add('debug-config-wrapper');

		const header = document.createElement('div');
		header.classList.add('debug-config-header');

		const enableAllBtn = document.createElement('button');
		enableAllBtn.classList.add('debug-config-btn');
		enableAllBtn.textContent = 'Enable All';
		enableAllBtn.onclick = () => this.setAllNamespaces(true);

		const disableAllBtn = document.createElement('button');
		disableAllBtn.classList.add('debug-config-btn');
		disableAllBtn.textContent = 'Disable All';
		disableAllBtn.onclick = () => this.setAllNamespaces(false);

		const clearBtn = document.createElement('button');
		clearBtn.classList.add('debug-config-btn', 'debug-config-btn-secondary');
		clearBtn.textContent = 'Reset Overrides';
		clearBtn.onclick = () => {
			this.configOverrides = {};
			this.saveConfigOverrides();
			this.renderConfigTab();
		};

		header.appendChild(enableAllBtn);
		header.appendChild(disableAllBtn);
		header.appendChild(clearBtn);
		wrapper.appendChild(header);

		const states = this.getLoggerStatesFn ? this.getLoggerStatesFn() : [];

		if (states.length === 0) {
			const empty = document.createElement('div');
			empty.classList.add('debug-config-empty');
			empty.textContent = 'No logging namespaces registered yet.';
			wrapper.appendChild(empty);
		} else {
			const list = document.createElement('div');
			list.classList.add('debug-config-list');
			for (const { namespace, enabled } of states) {
				const isOverridden = namespace in this.configOverrides;
				const effectiveEnabled = isOverridden ? this.configOverrides[namespace] : enabled;

				const row = document.createElement('label');
				row.classList.add('debug-config-row');
				if (isOverridden) row.classList.add('debug-config-overridden');

				const toggle = document.createElement('button');
				toggle.classList.add('debug-config-toggle');
				toggle.classList.toggle('debug-config-toggle-on', !!effectiveEnabled);
				toggle.innerHTML = `<span class="debug-config-toggle-thumb"></span>`;
				toggle.onclick = (e) => {
					e.preventDefault();
					const newVal = !effectiveEnabled;
					this.configOverrides[namespace] = newVal;
					this.saveConfigOverrides();
					if (newVal) this.enableLoggerFn?.(namespace);
					else this.disableLoggerFn?.(namespace);
					this.renderConfigTab();
				};

				const label = document.createElement('span');
				label.classList.add('debug-config-label');
				label.textContent = namespace;

				row.appendChild(toggle);
				row.appendChild(label);
				list.appendChild(row);
			}
			wrapper.appendChild(list);
		}
		content.appendChild(wrapper);
	}

	private setAllNamespaces(enabled: boolean): void {
		const states = this.getLoggerStatesFn ? this.getLoggerStatesFn() : [];
		for (const { namespace } of states) {
			this.configOverrides[namespace] = enabled;
			if (enabled) this.enableLoggerFn?.(namespace);
			else this.disableLoggerFn?.(namespace);
		}
		this.saveConfigOverrides();
		this.renderConfigTab();
	}
}

// ─── Module-level helpers ─────────────────────────────────────────

/**
 * Standalone debug(id, …args). Resolves the *singleton* panel registered
 * on globalThis (set by the constructor when `mount: true`), and falls
 * back to a console.log so calls don't drop on the floor. For structured
 * routing prefer importing `debug` from dev-loggers.
 */
export function debug(id: string, ...args: any[]): void {
	const sentinel = (globalThis as any).__devDebugPanel as DebugPanel | undefined;
	if (sentinel) {
		sentinel.onLoggerEvent({
			namespace: id.includes(':') ? id.split(':', 1)[0]! : id,
			id,
			level: 'debug',
			args: [`[${id}]`, ...args],
			data: args.find((a) => a && typeof a === 'object'),
			timestamp: Date.now(),
		});
		return;
	}
	console.log(`[${id}]`, ...args);
}

// Tiny utility helpers
function cssEscape(s: string): string {
	return s.replace(/([^A-Za-z0-9_-])/g, '\\$1');
}
function cssAttr(s: string): string {
	return s.replace(/(["\\])/g, '\\$1');
}
function fallbackCopy(text: string): void {
	try {
		const t = document.createElement('textarea');
		t.value = text;
		t.style.position = 'fixed';
		t.style.opacity = '0';
		document.body.appendChild(t);
		t.select();
		document.execCommand('copy');
		t.remove();
	} catch {
		/* ignore */
	}
}

type ShortcutSpec = { shift: boolean; alt: boolean; ctrl: boolean; meta: boolean; key: string };
function parseShortcut(s: string): ShortcutSpec {
	const parts = s.toLowerCase().split('+').map((p) => p.trim());
	const spec: ShortcutSpec = { shift: false, alt: false, ctrl: false, meta: false, key: '' };
	for (const p of parts) {
		if (p === 'shift') spec.shift = true;
		else if (p === 'alt' || p === 'option') spec.alt = true;
		else if (p === 'ctrl' || p === 'control') spec.ctrl = true;
		else if (p === 'meta' || p === 'cmd' || p === 'command') spec.meta = true;
		else spec.key = p;
	}
	return spec;
}
