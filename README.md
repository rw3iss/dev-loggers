# logging.ts

Minimal (< 500 lines, no dependencies) and flexible application logging system.

### Logger:
Basic logging with namespacing, coloring, options.

### PerformanceLogger:
Prints time between statements with the same ID (first argument).

### BufferedLogger:
Stores logs until .flush() is called, then printing them all at once.

### LogModules:
Register external classes which have an onLog handler, and receive all log events for custom operations.

All loggers output to console.log, but this can be changed by importing and calling setLogOutput(output).

# USAGE:

Import to retrieve a normal Logger or PerformanceLogger:
```
import { getLogger, getPerformanceLogger } from 'lib/utils/logging';
```

Using Logger (creates a single instance per namespace across the app):
```
const { log, warn, error } = getLogger('somename');
const { log } = getLogger('somename', { enabled: false }); // disable the logger temporary. it will still show errors.
```

Using PerformanceLogger (prints the time between log statements that share the same ID):
```
const { log } = getPerformanceLogger('[P] Profiling'); // for now pLog is a separate method until I figure something better out.
log('ID', 'some', 'messages')
log('ID', 'other', stuff) // prints 'ID (#ms)' (time since msg last received with same ID)
```

Using BufferedLogger (will not print any stored log messages until logger.flush() is called):
```
const { log, flush } = getPerformanceLogger('[P] Profiling'); // for now pLog is a separate method until I figure something better out.
log('log msg and print time since last')
log('another msg')
flush(); // shows all messages at once
```


# LOG MODULES:
The purpose of creating and registering modules is just to route logs to them, that they can then do anything with.

Create a log module to show log events:
```
export class DebugPanelLogModule implements LogModule {
	public name = "DebugPanel";
	public debugPanel: DebugPanel;

	constructor(opts: any = {}) {
		this.debugPanel = new DebugPanel(document.body);
		if (opts.show) this.debugPanel.show();
		// todo: support namespace filtering
	}

	public onLog(log: LogEvent) {
		this.debugPanel.addLog(log.namespace, log.args);
	}
}
```

Register the log module from your app, and it will receive all log events to process:
```
import { addLogModule } from 'lib/utils/logging';
addLogModule(new DebugPanelLogModule({ show: true })); 	// todo: support namespace filtering
```


*/