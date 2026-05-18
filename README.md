# dev-loggers

Minimal, zero-dependency logging primitives.

- Namespaced singleton loggers (`Logger`, `PerformanceLogger`, `BufferedLogger`).
- Composable **Sinks** — attach as many transports as you need (console, debug panel, file, network).
- Canonical **`debug(id, ...args)`** entry point for structured per-id events.
- ANSI color support and run-time enable/disable per namespace.

## Installation

```bash
npm install dev-loggers
```

## Quick start

```typescript
import { debug } from 'dev-loggers';

debug('audio:attach', { tag: 'VIDEO', src: 'blob:…' });
debug.scope('audio:attach').log('attempt 1');
```

By default a `ConsoleSink` is registered. Add more sinks (e.g. `dev-debug-panel`):

```typescript
import { attachSink } from 'dev-loggers';

attachSink(myCustomSink);   // { name, write(event) }
```

## API surface

### Canonical entry point: `debug(id, ...args)`

```typescript
import { debug } from 'dev-loggers';

// One-shot
debug('audio:attach', { tag: 'VIDEO' });

// Fluent scope (binds the id once)
const log = debug.scope('audio:attach');
log.log('attempt 1');
log.log('ok', { state: 'running' });
```

Each call produces a `LogEvent`:

```typescript
{
  namespace: 'audio',          // everything before the first ':'
  id: 'audio:attach',          // full id string
  level: 'debug',
  args: ['[audio:attach]', { tag: 'VIDEO' }],
  data: { tag: 'VIDEO' },       // first object arg, hoisted for inspection
  timestamp: 1719859200000,
}
```

UI sinks (like dev-debug-panel) group entries by `id` and render `data` as a JSON tree.

### Namespaced loggers

```typescript
import { getLogger, getPerformanceLogger, getBufferedLogger } from 'dev-loggers';

const { log, warn, error } = getLogger('MyApp', { color: 'cyan' });
log('starting');
warn('low memory');
error('connection failed');

const perf = getPerformanceLogger('Render');
perf.log('frame');  // first call: no elapsed
perf.log('frame');  // subsequent: ` (Nms)` appended

const buf = getBufferedLogger('Batch');
buf.log('a'); buf.log('b'); buf.flush();
```

The same `namespace` returns the same singleton instance. Re-registering with a different subtype throws.

### Sinks (the OCP extension point)

```typescript
import { attachSink, detachSink, Sink, LogEvent } from 'dev-loggers';

const networkSink: Sink = {
  name: 'network',
  write(event: LogEvent) {
    if (event.level === 'error') postToServer(event);
  },
};

const handle = attachSink(networkSink);
// later:
detachSink(handle);
```

Sinks are walked in attach order on every emit. The default `ConsoleSink` is always present; call `detachSink(loggers.getConsoleSink())` to remove it in tests.

### Plain standalone functions

```typescript
import { log, warn, error } from 'dev-loggers';

log('hello');
warn('careful');
error('boom');
```

### Runtime controls

```typescript
import {
  setLogAllMode, enableLogger, disableLogger, getLoggerStates, printLogCounts,
} from 'dev-loggers';

setLogAllMode(true);                       // force-enable everything
setLogAllMode(true, ['Audio', 'Render']);  // … but only these namespaces
enableLogger('Audio');                     // toggle one at a time
disableLogger('Render');
getLoggerStates();                          // [{ namespace, enabled }, …]
printLogCounts();                           // PerformanceLogger summaries
```

## Environment variables

| Var | Default | Notes |
|-----|---------|-------|
| `LOG_COLORS_ENABLED` | `true` | Turn off ANSI codes for non-color terminals. |
| `LOG_COLOR_DEFAULT` | (none) | Fallback color for unconfigured loggers. |
| `LOG_ERRORS_ALWAYS` | `true` | Emit errors even when the logger is disabled. |
| `LOG_WARNINGS_ALWAYS` | `false` | Same for warnings. |
| `LOG_ERROR_TRACES` | `false` | Append a stack trace to every error. |

## Migration from v3

`v4` is a major bump. Most v3 code keeps working unchanged. The breaking
changes are:

| v3 | v4 |
|----|----|
| `addLogModule({ name, onLog(event) })` | `attachSink({ name, write(event) })` (aliased — old shape still accepted) |
| `LogEvent = { namespace, args }` | `LogEvent = { namespace, id?, level, args, data?, timestamp }` |
| Same namespace + different factory → silently returns wrong subtype | Throws with a clear error |
| No structured `debug()` | `debug(id, ...args)` + `debug.scope(id).log(...)` |
| Emit always called `console.log(...)` | Emit walks the sink list; default `ConsoleSink` mirrors v3 behavior |

The `LogModule` symbol is still exported (alias of `Sink`). The
`addLogModule()` function still exists (alias of `attachSink()`). Old
code compiles. New code should use the new names.

## License

ISC
