# dev-loggers

Zero-dependency logging primitives **plus** a drop-in in-page debug panel — in
one tree-shakeable package with isolated subpath exports.

- `dev-loggers` — core: `Logger`, `PerformanceLogger`, `BufferedLogger`,
  composable `Sink` interface, canonical `debug(id, ...args)`. **No DOM,
  no SCSS, safe for Node / SSR / service workers.**
- `dev-loggers/panel` — draggable, resizable browser debug overlay. Per-id
  tabs, JSON state inspection, namespace toggles, keyboard shortcut.
  Auto-registers as a Sink so every `debug()` call flows into it.

Pull in only what you need; the panel UI tree-shakes cleanly when you
import just the core.

## Installation

```bash
npm install dev-loggers
```

## Quick start — core only (Node, server, library)

```typescript
import { debug, attachSink } from 'dev-loggers';

debug('audio:attach', { tag: 'VIDEO', src: 'blob:…' });
debug.scope('audio:attach').log('attempt 1');

attachSink({ name: 'remote', write(event) { /* … */ } });
```

## Quick start — with the panel (browser app)

```typescript
import * as loggers from 'dev-loggers';
import { mountDebugPanel } from 'dev-loggers/panel';

// One-liner; returns a disposer suitable for useEffect / onCleanup.
const dispose = mountDebugPanel({ loggers, position: 'bottomRight' });

// Anywhere in your app:
loggers.debug('audio:attach', { tag: 'VIDEO' });
```

`Shift+Alt+D` toggles the panel. Override via `shortcut`, or pass `null`
to disable.

### React / Preact

```tsx
import * as loggers from 'dev-loggers';
import { mountDebugPanel } from 'dev-loggers/panel';
import { useEffect } from 'react';   // or 'preact/hooks'

export function App() {
  useEffect(() => mountDebugPanel({ loggers }), []);
  return <YourApp />;
}
```

The constructor is idempotent: re-mounting in React StrictMode (which fires
effects twice in dev) tears down the prior panel before constructing a new
one, so you never end up with duplicate panels or orphaned key listeners.

### Solid

```tsx
import { onMount, onCleanup } from 'solid-js';
import * as loggers from 'dev-loggers';
import { mountDebugPanel } from 'dev-loggers/panel';

onMount(() => {
  const dispose = mountDebugPanel({ loggers });
  onCleanup(dispose);
});
```

## Subpath exports — what's where

| Import path             | Side effects | DOM required | Contents                                                                                          |
|-------------------------|--------------|--------------|---------------------------------------------------------------------------------------------------|
| `dev-loggers`           | None         | No           | `Logger`, `PerformanceLogger`, `BufferedLogger`, `LoggerRegistry`, `ConsoleSink`, `Sink`, `LogEvent`, `attachSink`, `detachSink`, `debug`, `log`, `warn`, `error`, runtime controls |
| `dev-loggers/panel`     | Injects CSS  | Yes          | `DebugPanel`, `JsonView`, `mountDebugPanel`, `ScreenPosition`, `makeResizable`, `makeDraggable`   |

The `panel` subpath injects two `<style>` blocks into `<head>` on first
import. The injection is idempotent (re-imports don't duplicate styles).

## Core API

### `debug(id, ...args)` — canonical structured entry point

```typescript
import { debug } from 'dev-loggers';

debug('audio:attach', { tag: 'VIDEO' });           // one-shot
const log = debug.scope('audio:attach');           // fluent
log.log('attempt 1');
log.log('ok', { state: 'running' });
```

Each call produces a structured `LogEvent`:

```typescript
{
  namespace: 'audio',           // everything before the first ':'
  id: 'audio:attach',           // full id string
  level: 'debug',
  args: ['[audio:attach]', { tag: 'VIDEO' }],
  data: { tag: 'VIDEO' },       // first object arg, hoisted for inspection
  timestamp: 1719859200000,
}
```

UI sinks (like the panel) group entries by `id` into per-id tabs and
render `data` as a collapsible JSON tree.

### Namespaced loggers

```typescript
import { getLogger, getPerformanceLogger, getBufferedLogger } from 'dev-loggers';

const { log, warn, error } = getLogger('MyApp', { color: 'cyan' });
log('starting');
warn('low memory');
error('connection failed');

const perf = getPerformanceLogger('Render');
perf.log('frame');              // first call: no elapsed
perf.log('frame');              // subsequent: ` (Nms)` appended

const buf = getBufferedLogger('Batch');
buf.log('a'); buf.log('b'); buf.flush();
```

Same `namespace` → same singleton. Re-registering with a different
subtype throws.

### Sinks (extension point)

```typescript
import { attachSink, detachSink, Sink, LogEvent } from 'dev-loggers';

const networkSink: Sink = {
  name: 'network',
  write(event: LogEvent) {
    if (event.level === 'error') postToServer(event);
  },
};

const handle = attachSink(networkSink);
detachSink(handle);
```

The default `ConsoleSink` is always present unless explicitly removed.

### Runtime controls

```typescript
import {
  setLogAllMode, enableLogger, disableLogger, getLoggerStates, printLogCounts,
} from 'dev-loggers';

setLogAllMode(true);                       // force-enable everything
setLogAllMode(true, ['Audio', 'Render']);  // … but only these namespaces
enableLogger('Audio');
disableLogger('Render');
getLoggerStates();                         // [{ namespace, enabled }, …]
printLogCounts();                          // PerformanceLogger summaries
```

The `panel` subpath ships a built-in "Config" tab that calls these for you.

## Panel API

```typescript
import { DebugPanel } from 'dev-loggers/panel';
import * as loggers from 'dev-loggers';

const panel = new DebugPanel({
  loggers,                  // optional: auto-attaches as a Sink + wires Config tab
  position: 'bottomRight',  // initial position on first-ever launch
  width: 600, height: 400,
  shortcut: 'shift+alt+d',  // null to disable
  snap: true,
  mount: true,              // false → call `parent.appendChild(panel.element)` yourself
  parent: document.body,    // custom mount root
});

panel.show(); panel.hide(); panel.toggle();
panel.debug('user.state', currentUser);       // JSON tree for state debugging
panel.log('namespace', { any: 'object' });    // legacy free-form log
panel.attachToLoggers(loggers);               // if you didn't pass `loggers` to ctor
panel.destroy();
```

### Why the panel "just works" on first load

The constructor handles every flaky-init footgun that bit earlier versions:

- **Idempotent.** A second `new DebugPanel(...)` tears down the prior instance —
  React StrictMode's double-effect-fire, Next.js HMR, fast-refresh, accidental
  double-mounts all settle into a single panel and a single key listener.
- **DOM-readiness gated.** If `document.body` is null at construct time
  (Next.js pre-hydration, scripts in `<head>`), mount is deferred to
  `DOMContentLoaded`. No more "works after refresh" symptom.
- **Window-level, capture-phase shortcut.** MUI dialogs, code editors,
  Easy-Peasy containers, rich-text inputs all `stopPropagation` on keydown
  for their own hotkeys; the panel listens on `window` in capture phase so
  `Shift+Alt+D` fires regardless of where focus lives.
- **CSS injection is idempotent.** Re-importing the module (HMR) doesn't
  duplicate `<style>` tags.

## Environment variables

| Var | Default | Notes |
|-----|---------|-------|
| `LOG_COLORS_ENABLED` | `true` | Turn off ANSI codes for non-color terminals. |
| `LOG_COLOR_DEFAULT` | (none) | Fallback color for unconfigured loggers. |
| `LOG_ERRORS_ALWAYS` | `true` | Emit errors even when the logger is disabled. |
| `LOG_WARNINGS_ALWAYS` | `false` | Same for warnings. |
| `LOG_ERROR_TRACES` | `false` | Append a stack trace to every error. |

## Migration

### From dev-loggers v4 (core-only) → v5

No source changes needed for core consumers. `import { ... } from 'dev-loggers'`
keeps working identically — same exports, same shapes.

### From dev-debug-panel → v5

The standalone `dev-debug-panel` package is **deprecated** and consolidated
into this package. Rewrite imports:

```diff
- import { DebugPanel, mountDebugPanel, ScreenPosition } from 'dev-debug-panel';
+ import { DebugPanel, mountDebugPanel, ScreenPosition } from 'dev-loggers/panel';
```

All other APIs (`new DebugPanel(options)`, `panel.attachToLoggers(...)`,
`panel.show()`, `debug()` helper) are unchanged.

The `LogModule` interface from dev-loggers v3 still exists as an alias of
`Sink`; legacy `addLogModule(...)` still works. New code should use
`attachSink(...)`.

## License

ISC
