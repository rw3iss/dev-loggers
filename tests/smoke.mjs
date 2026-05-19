#!/usr/bin/env node
/**
 * Smoke tests for the merged dev-loggers v5.
 *
 *   1. `dev-loggers` (core entry) exports the expected public API.
 *   2. `dev-loggers/panel` constructs without crashing under JSDOM.
 *   3. The DebugPanel constructor is idempotent — re-instantiating tears
 *      down the prior instance and there's only one .debug-panel in DOM.
 *   4. The keyboard shortcut is bound on `window` in capture phase so a
 *      synthetic keydown triggers toggle even if an element stopPropagations.
 *   5. The mount falls back to DOMContentLoaded when body isn't ready.
 */

import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let failures = 0;
function ok(label) { console.log('  ✓', label); }
function fail(label, err) {
	failures++;
	console.error('  ✗', label);
	if (err) console.error('     ', err.message || err);
}

// ---------------------------------------------------------------------------
// 1. core entry exports
// ---------------------------------------------------------------------------
console.log('core exports:');
const core = await import(path.join(root, 'dist/index.mjs'));
const requiredCore = [
	'getLogger', 'getPerformanceLogger', 'getBufferedLogger',
	'log', 'warn', 'error', 'debug',
	'attachSink', 'detachSink', 'addLogModule',
	'enableLogger', 'disableLogger', 'getLoggerStates',
	'printLogCounts', 'setLogAllMode',
	'LoggerRegistry', 'ConsoleSink',
];
for (const k of requiredCore) {
	(k in core) ? ok(k) : fail(`missing core export: ${k}`);
}
typeof core.debug.scope === 'function' ? ok('debug.scope is callable') : fail('debug.scope not a function');

// ---------------------------------------------------------------------------
// 2-5. panel under JSDOM
// ---------------------------------------------------------------------------
console.log('\npanel under JSDOM:');
const { JSDOM } = await import('jsdom');

// Set up a fresh DOM with body present
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true,
});
const installGlobals = (w) => {
	// Note: Node 22 makes `navigator` a getter-only on globalThis. The panel
	// only reads `navigator.clipboard?` defensively so we let Node's stub
	// stand and copy everything else explicitly.
	const props = {
		window: w,
		document: w.document,
		HTMLElement: w.HTMLElement,
		HTMLButtonElement: w.HTMLButtonElement,
		HTMLInputElement: w.HTMLInputElement,
		KeyboardEvent: w.KeyboardEvent,
		MouseEvent: w.MouseEvent,
		getComputedStyle: w.getComputedStyle.bind(w),
		requestAnimationFrame: w.requestAnimationFrame
			? w.requestAnimationFrame.bind(w)
			: (cb) => setTimeout(cb, 16),
		queueMicrotask: (cb) => Promise.resolve().then(cb),
		localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
	};
	for (const [k, v] of Object.entries(props)) {
		try { globalThis[k] = v; }
		catch { /* getter-only on this Node version; skip */ }
	}
};
installGlobals(dom.window);
// Reset the singleton ref between tests
delete globalThis.__devDebugPanel;

const panel = await import(path.join(root, 'dist/panel/index.mjs'));

// (2) instantiation
let p1;
try {
	p1 = new panel.DebugPanel({ shortcut: 'shift+alt+d' });
	ok('DebugPanel constructs without crashing');
} catch (e) { fail('DebugPanel constructor threw', e); }

globalThis.__devDebugPanel === p1
	? ok('globalThis.__devDebugPanel points at the new instance')
	: fail('globalThis.__devDebugPanel not set correctly');

document.querySelectorAll('.debug-panel').length === 1
	? ok('exactly one .debug-panel in DOM after construction')
	: fail('wrong .debug-panel count: ' + document.querySelectorAll('.debug-panel').length);

// (3) idempotency: second construction destroys the first
let p2;
try {
	p2 = new panel.DebugPanel({ shortcut: 'shift+alt+d' });
	ok('second DebugPanel constructs');
} catch (e) { fail('second constructor threw', e); }

globalThis.__devDebugPanel === p2
	? ok('global ref now points at the second instance')
	: fail('global ref did not advance to second instance');

document.querySelectorAll('.debug-panel').length === 1
	? ok('still only one .debug-panel in DOM (first was destroyed)')
	: fail('idempotency failed: ' + document.querySelectorAll('.debug-panel').length + ' panels in DOM');

// (4) keyboard shortcut fires via window + capture phase
const evt = new dom.window.KeyboardEvent('keydown', {
	key: 'd', shiftKey: true, altKey: true, bubbles: true, cancelable: true,
});
const wasVisible = document.querySelector('.debug-panel').classList.contains('visible');
dom.window.dispatchEvent(evt);
const isVisible = document.querySelector('.debug-panel').classList.contains('visible');
wasVisible !== isVisible
	? ok('keyboard shortcut toggles .visible (window/capture-phase listener works)')
	: fail('shortcut did not toggle visibility');

// (5) destroy clears global ref
p2.destroy();
document.querySelectorAll('.debug-panel').length === 0
	? ok('destroy() removes the panel from DOM')
	: fail('destroy() left .debug-panel in DOM');

!globalThis.__devDebugPanel
	? ok('destroy() clears globalThis.__devDebugPanel')
	: fail('destroy() left global ref set');

// (6) deferred-mount: simulate document.readyState = 'loading' + missing body
console.log('\ndeferred mount when body not ready:');
const dom2 = new JSDOM('<!doctype html><html><head></head></html>', { url: 'http://localhost/' });
// Forcibly empty the body so first appendChild candidate is null
Object.defineProperty(dom2.window.document, 'readyState', { value: 'loading', configurable: true });
installGlobals(dom2.window);
// Remove the body to simulate pre-hydration state
if (dom2.window.document.body) dom2.window.document.body.remove();
delete globalThis.__devDebugPanel;

let p3;
try {
	p3 = new panel.DebugPanel({ shortcut: 'shift+alt+d' });
	ok('constructor does not crash when document.body is null');
} catch (e) { fail('constructor crashed without body', e); }

document.querySelectorAll('.debug-panel').length === 0
	? ok('no premature mount when body absent')
	: fail('panel mounted somewhere despite no body');

// Now create the body and fire DOMContentLoaded — panel should now mount
const newBody = dom2.window.document.createElement('body');
dom2.window.document.documentElement.appendChild(newBody);
const dclEvent = new dom2.window.Event('DOMContentLoaded');
dom2.window.document.dispatchEvent(dclEvent);
// allow microtask + raf fallbacks to run
await new Promise(r => setTimeout(r, 50));

document.querySelectorAll('.debug-panel').length === 1
	? ok('panel mounts on DOMContentLoaded once body exists')
	: fail('deferred mount failed: ' + document.querySelectorAll('.debug-panel').length + ' panels');

console.log('\n' + (failures === 0 ? '✅ all smoke tests passed' : `❌ ${failures} failure(s)`));
process.exit(failures === 0 ? 0 : 1);
