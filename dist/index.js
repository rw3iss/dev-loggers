import { printLogs, setLogAllMode } from './lib/utils.js';
import { LoggerRegistry } from './lib/LoggerRegistry.js';
// ============================================================================
// CONFIGURATION
// ============================================================================
// Expose to global for debugging (browser/Node.js compatible)
if (typeof globalThis !== 'undefined') {
    globalThis.loggers = LoggerRegistry.getInstance();
    globalThis.printLogs = printLogs;
    globalThis.setLogAllMode = setLogAllMode;
}
// Export types for clients:
export * from './lib/loggers/Logger.js';
export * from './lib/loggers/PerformanceLogger.js';
export * from './lib/loggers/BufferedLogger.js';
export * from './lib/LogEvent.js';
export * from './lib/LoggerRegistry.js';
export * from './lib/LogModule.js';
export * from './lib/utils.js';
