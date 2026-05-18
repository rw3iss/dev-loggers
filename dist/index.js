import { LoggerRegistry } from './lib/LoggerRegistry.js';
import { printLogCounts, setLogAllMode, enableLogger, disableLogger, getLoggerStates, debug, } from './globals.js';
// ============================================================================
// GLOBAL EXPOSURE — handy in browser devtools
// ============================================================================
if (typeof globalThis !== 'undefined') {
    globalThis.loggers = LoggerRegistry.getInstance();
    globalThis.debug = debug;
    globalThis.printLogCounts = printLogCounts;
    globalThis.setLogAllMode = setLogAllMode;
    globalThis.enableLogger = enableLogger;
    globalThis.disableLogger = disableLogger;
    globalThis.getLoggerStates = getLoggerStates;
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
export * from './globals.js';
