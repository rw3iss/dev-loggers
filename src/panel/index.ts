// Panel entry — DOM-based debug UI. Importing this module injects the
// panel's SCSS into <head> on first import (browser-only; no-op in SSR).
//
// Pair this with the logger core for full effect:
//     import * as loggers from 'dev-loggers';
//     import { DebugPanel } from 'dev-loggers/panel';
//     const panel = new DebugPanel({ loggers });
//
// Or use the framework-agnostic mount helper (returns a disposer suitable
// for useEffect or onCleanup):
//     useEffect(() => mountDebugPanel({ loggers }), []);

import './DebugPanel/DebugPanel.scss';
import './JsonView/JsonView.scss';

export { DebugPanel, ScreenPosition, debug } from './DebugPanel/DebugPanel.js';
export type { LoggersApi, LoggerEvent } from './DebugPanel/DebugPanel.js';
export { JsonView } from './JsonView/JsonView.js';
export { mountDebugPanel } from './mount.js';
export { makeResizable, makeDraggable, getWindowSize } from './utils/domUtils.js';

export type {
	DebugPanelOptions,
	DebugPanelSettings,
	ResizeOptions,
	DragOptions,
} from './types.js';
