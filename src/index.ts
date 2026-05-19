// Top-level entry — re-exports the logger core ONLY.
// No DOM imports, no panel UI, no SCSS side-effects. Safe to use in Node, SSR,
// service workers, and any non-browser environment.
//
// For the in-page debug panel UI, import from the `/panel` subpath:
//     import { DebugPanel, mountDebugPanel } from 'dev-loggers/panel';
//
// For framework-specific helpers:
//     import { useDebugPanel } from 'dev-loggers/preact';   // React-compatible
//
// The subpaths are isolated so bundlers tree-shake the panel cleanly when
// only `dev-loggers` (this entry) is imported.

export * from './core/index.js';
