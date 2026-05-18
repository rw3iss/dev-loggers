import { LoggerRegistry } from './lib/LoggerRegistry.js';
import {
	printLogCounts,
	setLogAllMode,
	enableLogger,
	disableLogger,
	getLoggerStates,
	debug,
} from './globals.js';

// ============================================================================
// GLOBAL EXPOSURE — handy in browser devtools
// ============================================================================

if (typeof globalThis !== 'undefined') {
	(globalThis as any).loggers = LoggerRegistry.getInstance();
	(globalThis as any).debug = debug;
	(globalThis as any).printLogCounts = printLogCounts;
	(globalThis as any).setLogAllMode = setLogAllMode;
	(globalThis as any).enableLogger = enableLogger;
	(globalThis as any).disableLogger = disableLogger;
	(globalThis as any).getLoggerStates = getLoggerStates;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export * from './lib/loggers/Logger.js';
export * from './lib/loggers/PerformanceLogger.js';
export * from './lib/loggers/BufferedLogger.js';

export * from './lib/LogEvent.js';
export * from './lib/LoggerRegistry.js';
export * from './lib/Sink.js';
export * from './lib/ConsoleSink.js';
// Back-compat alias re-export. Pre-existing imports keep working.
export { LogModule } from './lib/Sink.js';

export * from './globals.js';
