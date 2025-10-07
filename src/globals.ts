import { LoggerOptions, Logger } from './lib/loggers/Logger.js';
import { PerformanceLoggerOptions, PerformanceLogger } from './lib/loggers/PerformanceLogger.js';
import { getLoggerRegistry, formatNamespace, getCallStack } from './utils.js';
import { LogEvent } from './lib/LogEvent.js';
import { BufferedLoggerOptions, BufferedLogger } from './lib/loggers/BufferedLogger.js';
import { LogModule } from './lib/LogModule.js';
import { ALWAYS_LOG_WARNINGS, ALWAYS_LOG_ERRORS, LOG_ERROR_TRACES } from './config.js';

/* Global API:

getLogger, getPerformanceLogger, getBufferedLogger

log, warn, error

addLogModule

printLogCounts

setLogAllMode

*/

// ============================================================================
// LOGGER FACTORY FUNCTIONS
// ============================================================================

export function getLogger(namespace: string, opts: Partial<LoggerOptions> = {}): Logger {
	if (!namespace) throw new Error('Must supply a namespace as first argument to getLogger');

	let logger = registry.getLogger(namespace);
	if (!logger) {
		logger = new Logger(namespace, opts);
		registry.setLogger(namespace, logger);
	}
	return logger as Logger;
}

export function getPerformanceLogger(
	namespace: string,
	opts: Partial<PerformanceLoggerOptions> = {}
): PerformanceLogger {
	if (!namespace) throw new Error('Must supply a namespace as first argument to getPerformanceLogger');

	let logger = registry.getLogger(namespace);
	if (!logger) {
		logger = new PerformanceLogger(namespace, opts);
		registry.setLogger(namespace, logger);
	}
	return logger as PerformanceLogger;
}

export function getBufferedLogger(
	namespace: string,
	opts: Partial<BufferedLoggerOptions> = {}
): BufferedLogger {
	if (!namespace) throw new Error('Must supply a namespace as first argument to getBufferedLogger');

	let logger = registry.getLogger(namespace);
	if (!logger) {
		logger = new BufferedLogger(namespace, opts);
		registry.setLogger(namespace, logger);
	}
	return logger as BufferedLogger;
}

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

export function log(namespaceOrFirstArg: string, ...args: any[]): void {
	const logger = typeof namespaceOrFirstArg === 'string' ? registry.getLogger(namespaceOrFirstArg) : null;
	const namespace = logger ? namespaceOrFirstArg : '';
	const logArgs = logger ? args : [namespaceOrFirstArg, ...args];

	if (logger && !registry.shouldLog(namespace, logger.opts.enabled)) {
		return;
	}

	const formattedArgs = namespace && logger
		? [formatNamespace(namespace, logger.opts.color), ...logArgs]
		: logArgs;

	emitLog(namespace, formattedArgs);
}

export function warn(namespaceOrFirstArg: string, ...args: any[]): void {
	const logger = typeof namespaceOrFirstArg === 'string' ? registry.getLogger(namespaceOrFirstArg) : null;
	const namespace = logger ? namespaceOrFirstArg : '';
	const logArgs = logger ? args : [namespaceOrFirstArg, ...args];

	if (logger && !ALWAYS_LOG_WARNINGS && !registry.shouldLog(namespace, logger.opts.enabled)) {
		return;
	}

	const prefix = namespace && logger
		? `${formatNamespace(namespace, logger.opts.color)} ⚠️ Warning:`
		: '⚠️ Warning:';

	emitLog(namespace, [prefix, ...logArgs]);
}

export function error(namespaceOrFirstArg: string, ...args: any[]): void {
	const logger = typeof namespaceOrFirstArg === 'string' ? registry.getLogger(namespaceOrFirstArg) : null;
	const namespace = logger ? namespaceOrFirstArg : '';
	const logArgs = logger ? args : [namespaceOrFirstArg, ...args];

	if (logger && !ALWAYS_LOG_ERRORS && !registry.shouldLog(namespace, logger.opts.enabled)) {
		return;
	}

	const prefix = namespace && logger
		? `${formatNamespace(namespace, logger.opts.color)} 🛑 Error!`
		: '🛑 Error!';

	const finalArgs = LOG_ERROR_TRACES
		? [prefix, ...logArgs, '\nAt:', getCallStack()]
		: [prefix, ...logArgs];

	emitLog(namespace, finalArgs);
}

// ============================================================================
// LOG MODULES
// ============================================================================

export function addLogModule(module: LogModule): void {
	registry.addModule(module);
}


// ============================================================================
// MISC CONTROLS
// ============================================================================


export function printLogCounts(): void {
	registry.getAllLoggers().forEach(logger => {
		if (logger instanceof PerformanceLogger) {
			logger.printCounts();
		}
	});
}

export function setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void {
	registry.setLogAllMode(enabled, onlyNamespaces);
}


const registry = getLoggerRegistry();

function emitLog(namespace: string, args: any[]): void {
	const event: LogEvent = { namespace, args };
	registry.getModules().forEach(module => module.onLog(event));
	console.log(...args);
}
