import { LoggerRegistry } from './lib/LoggerRegistry.js';
import { printLogCounts, setLogAllMode } from './globals.js';

// ============================================================================
// CONFIGURATION
// ============================================================================


// Expose to global for debugging (browser/Node.js compatible)
if (typeof globalThis !== 'undefined') {
	(globalThis as any).loggers = LoggerRegistry.getInstance();
	(globalThis as any).printLogCounts = printLogCounts;
	(globalThis as any).setLogAllMode = setLogAllMode;
}

// Export types for clients:
export * from './lib/loggers/Logger.js';
export * from './lib/loggers/PerformanceLogger.js';
export * from './lib/loggers/BufferedLogger.js';

export * from './lib/LogEvent.js';
export * from './lib/LoggerRegistry.js';
export * from './lib/LogModule.js';

export * from './globals.js';