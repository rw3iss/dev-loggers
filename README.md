# dev-loggers

Minimal, zero-dependency logging library.
* Global singleton instances (namespaces)
* Support for <span style="color: #3f80f8ff;">colorization</span> and other options
* Logger, PerformanceLogger, BufferedLogger

## Installation

```bash
npm install dev-loggers
```

## Quick Start

Import the logger factory functions for the type of logger you need, and retrieve an instance using a namespace as first argument.

If using these factory functions, all loggers with the same namespace use the global instance of that logger across all files.

```typescript
// import
import { getLogger, getPerformanceLogger, getBufferedLogger } from 'dev-loggers';

// instantiate and get methods, at the top of a file
const { log, error, warn } = getLogger('MyService');

// outputs to console "MyService: message"
log('message');

// disable or set a color for the logger:
const { log } = getLogger('MyService', { enabled: false, color: 'blue' });
```
<b>Note:</b> If you call getLogger('namespace') with the same namespace in multiple files, it will use the same instance, but with the last configured options (if they happen to differ).


You can also instantiate a Logger instance directly, and calling the log methods on it. However note that these will not be managed by the LoggerRegister, and therefore not be singleton instances.
```typescript
import { Logger } from 'dev-loggers';

const logger = new Logger(); // namespace is optional

logger.log('message');
```


## Logger Types

### 1. Logger (Basic)

Standard logging with namespacing, colors, and customization options. Perfect for general application logging.

```typescript
import { getLogger } from 'dev-loggers';

const { log, warn, error } = getLogger('MyApp');

log('Application started');
warn('Low memory warning');
error('Connection failed');
```

**Output:**
```
MyApp: Application started
MyApp: ⚠️ Warning: Low memory warning
MyApp: 🛑 Error! Connection failed
```

### 2. PerformanceLogger

Extends Logger to measure and display time elapsed between log calls with the same ID. Ideal for profiling and performance monitoring.

```typescript
import { getPerformanceLogger } from 'dev-loggers';

const { log } = getPerformanceLogger('Performance');

log('(render)', 'Starting render');
// ... do work ...
log('(render)', 'Render complete');  // Shows elapsed time
```

**Output:**
```
Performance: (render) Starting render
Performance: (render) Render complete (142ms)
```

**Additional Methods:**
- `printCounts()` - Display call count statistics for all IDs
- `reset()` - Clear all performance data
- `time(id)` - Get elapsed time for an ID
- `incr(id)` - Increment counter for an ID

### 3. BufferedLogger

Extends Logger to accumulate log messages and output them all at once. Useful for batch operations or conditional logging.

```typescript
import { getBufferedLogger } from 'dev-loggers';

const { log, flush } = getBufferedLogger('Batch');

log('Processing item 1');
log('Processing item 2');
log('Processing item 3');

flush();  // Outputs all buffered messages
```

**Additional Methods:**
- `flush()` - Output all buffered messages and clear buffer
- `clear()` - Clear buffer without outputting
- `getBufferSize()` - Get current buffer size

## Customization

### Logger Options

All logger types accept an options object as the second parameter:

```typescript
const logger = getLogger('MyApp', {
  color: 'cyan',           // Namespace color
  enabled: true,           // Enable/disable logging
  prefix: '[DEBUG]',       // Text before each message
  postfix: '✓'             // Text after each message
});
```

**Available Options:**
- `color` - Color for the namespace (cyan, red, green, yellow, blue, magenta, white)
- `enabled` - Enable or disable this logger
- `prefix` - String to prepend to all messages
- `postfix` - String to append to all messages

### PerformanceLogger Options

```typescript
const perfLogger = getPerformanceLogger('Perf', {
  logCounts: true,    // Track call counts
  showIds: true       // Show IDs in output
});
```

### BufferedLogger Options

```typescript
const bufLogger = getBufferedLogger('Buffer', {
  maxBufferSize: 500  // Auto-flush when buffer exceeds this size
});
```

## Standalone Functions

You can use simple standalone logging functions without creating logger instances, which will just format and log to the console:

```typescript
import { log, warn, error } from 'dev-loggers';

log('Simple message');
warn('Warning message');
error('Error message');
```

## Advanced Features

### LogModules - Custom Log Handlers

Register external classes to receive all log events for custom processing (e.g., sending to external services, UI panels, etc.):

```typescript
import { addLogModule } from 'dev-loggers';
import { LogModule, LogEvent } from 'dev-loggers';

class CustomLogHandler implements LogModule {
  onLog(event: LogEvent) {
    // event.namespace - the logger's namespace
    // event.args - the log arguments
    this.sendToExternalService(event);
  }
}

addLogModule(new CustomLogHandler());
```

### Global Controls

```typescript
import { setLogAllMode, printLogCounts } from 'dev-loggers';

// Enable/disable all loggers
setLogAllMode(true);

// Enable only specific namespaces
setLogAllMode(true, ['MyApp', 'Database']);

// Print performance statistics for all PerformanceLoggers
printLogCounts();
```

## Configuration

The library respects these environment-level configurations:

- `COLORS_ENABLED` - Enable/disable color output (useful to set this ENV on remote servers that don't support colors)
- `ALWAYS_LOG_WARNINGS` - Log warnings even when logger is disabled
- `ALWAYS_LOG_ERRORS` - Log errors even when logger is disabled
- `LOG_ERROR_TRACES` - Include stack traces after each error log