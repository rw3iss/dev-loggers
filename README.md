# get-loggers

Minimal < 500 lines, no dependency, and flexible application logging system. Loggers are created by namespace and maintain app-wide singleton instances for care towards resource awareness. Focus on deconstruction, extension, and minimalism for barebones/simple client usage.

## Installation
Pick one:
```
yarn add get-loggers
pnpm install get-loggers
npm install get-loggers
```

## Usage


/**
 * Minimal no-dependency logging framework
 *
 * Provides three logger types:
 * - Logger: Basic logging with namespacing and configuration
 * - PerformanceLogger: Tracks time between log statements with the same ID
 * - BufferedLogger: Accumulates logs until flush() is called
 *
 * @example
 * ```typescript
 * import { getLogger, getPerformanceLogger, getBufferedLogger } from './logging';
 *
 * // Basic logger
 * const { log, warn, error } = getLogger('MyApp');
 * log('Application started');
 *
 * // Performance logger
 * const perfLog = getPerformanceLogger('Performance');
 * perfLog.log('operation-1', 'Starting operation');
 * perfLog.log('operation-1', 'Operation complete'); // Shows elapsed time
 *
 * // Buffered logger
 * const buffered = getBufferedLogger('Batch');
 * buffered.log('Message 1');
 * buffered.log('Message 2');
 * buffered.flush(); // Outputs all at once
 * ```
 */


Import the method for whichever type of logger you want to use:
```
import { getLogger, getPerformanceLogger, getBufferedLogger } from 'llogg';
```
You can also just import the log methods without using namespaced instances:
```
import { log, warn, error } from 'llogg';
```

### Logger:
Basic logging with namespacing, coloring, and options (see below for more options). Call at the top of your file:

```
const { log, warn, error } = getLogger('SomeName');
log('a', 'message', someData); 		// prints "SomeName: a message {...}"
```

Extended options:
```
const { log, warn, error } = getLogger('SomeName', { enabled: false, color: 'red', prefix: '[P]' });
```
### PerformanceLogger:
Extends Logger and prints time between statements with the same ID (first argument).
```
const { log } = getPerformanceLogger('[P] Profiling');
log('ID', 'some', 'messages')
log('ID', 'other', stuff) 		// prints 'ID <msgs> (#ms)' (time since msg last received with same ID)
```

### BufferedLogger:
Extends Logger and stores logs until .flush() is called, then printing them all at once.
```
const { log, flush } = getBufferedLogger('Buffmenow');
log('log msg')  		// wont show yet
log('another msg') 		// wont show yet
flush();				// shows all messages at once
```

## LogModules
Register external classes which have an onLog handler, and receive all log events for custom operations.
```
// Your custom class just needs to implement onLog:
export class DebugPanelLogModule implements LogModule {
	public onLog(log: LogEvent) {
		this.debugPanel.addLog(log.namespace, log.args);
	}
}
```

Register the custom LogModule class with the logging system:
```
import { addLogModule } from 'get-loggers';
addLogModule(new DebugPanelLogModule());
```

## Logger Options:
```
export type LoggerOptions = {
	namespace?: string;
	color?: string;
	enabled?: boolean;
	prefix?: string;
	postfix?: string;
};
```

## Custom Output
All loggers output to console.log, but this can be changed by importing and calling setLogOutput(output):
```
import { setLogOutput } from 'get-loggers';
setLogOutput(someOtherStream);
```