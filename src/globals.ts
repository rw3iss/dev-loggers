import { LoggerOptions, Logger } from './lib/loggers/Logger.js';
import { PerformanceLoggerOptions, PerformanceLogger } from './lib/loggers/PerformanceLogger.js';
import { getLoggerRegistry, formatNamespace, getCallStack } from './utils.js';
import { LogEvent, LogLevel } from './lib/LogEvent.js';
import { BufferedLoggerOptions, BufferedLogger } from './lib/loggers/BufferedLogger.js';
import { LogModule, Sink } from './lib/Sink.js';
import { ALWAYS_LOG_WARNINGS, ALWAYS_LOG_ERRORS, LOG_ERROR_TRACES } from './config.js';

/* Global API:

	getLogger, getPerformanceLogger, getBufferedLogger

	log, warn, error, debug

	attachSink (preferred) / addLogModule (v3 alias)
	detachSink

	printLogCounts, setLogAllMode,
	enableLogger, disableLogger, getLoggerStates
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
	} else if (!(logger instanceof Logger)) {
		throw new Error(`Namespace "${namespace}" is already registered as a different logger type.`);
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
	} else if (!(logger instanceof PerformanceLogger)) {
		throw new Error(`Namespace "${namespace}" is already registered as a different logger type.`);
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
	} else if (!(logger instanceof BufferedLogger)) {
		throw new Error(`Namespace "${namespace}" is already registered as a different logger type.`);
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

	emitEvent({
		namespace,
		level: 'log',
		args: formattedArgs,
		timestamp: Date.now(),
		data: pickData(logArgs),
	});
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

	emitEvent({
		namespace,
		level: 'warn',
		args: [prefix, ...logArgs],
		timestamp: Date.now(),
		data: pickData(logArgs),
	});
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

	emitEvent({
		namespace,
		level: 'error',
		args: finalArgs,
		timestamp: Date.now(),
		data: pickData(logArgs),
	});
}

/**
 * Canonical structured debug entry point. Call sites look like:
 *
 *     debug('audio:attach', { event: 'register', tag: 'VIDEO' });
 *     debug('audio', 'attach()', { tag: 'VIDEO' });
 *
 * The `id` is preserved on the LogEvent (sinks like dev-debug-panel group
 * entries by id into per-id tabs). The console output is one combined line.
 */
export interface DebugFn {
	(id: string, ...args: any[]): void;
	/** Fluent variant: bind an id once, then `.log(...)` repeatedly. */
	scope(id: string): { log: (...args: any[]) => void };
}

function _debug(id: string, ...args: any[]): void {
	if (!id || typeof id !== 'string') {
		// Fall back to plain log if first arg is not a string id. Loud rather than silent.
		console.warn('[dev-loggers] debug() called without a string id; first arg was:', id);
		return;
	}

	// Reuse a namespaced logger keyed by the id's namespace prefix (everything
	// before the first ':' or the whole id). This means `debug('audio:attach', …)`
	// and `debug('audio:chain', …)` share the same enable/disable toggle in the
	// config tab, while still showing up as separate per-id tabs in the panel.
	const namespace = id.includes(':') ? id.split(':', 1)[0]! : id;
	const logger = registry.getLogger(namespace);
	if (logger && !registry.shouldLog(namespace, logger.opts.enabled)) {
		return;
	}

	const formattedArgs = [`[${id}]`, ...args];

	emitEvent({
		namespace,
		id,
		level: 'debug',
		args: formattedArgs,
		timestamp: Date.now(),
		data: pickData(args),
	});
}

export const debug: DebugFn = Object.assign(_debug, {
	scope(id: string) {
		return { log: (...args: any[]) => _debug(id, ...args) };
	},
});

// ============================================================================
// SINKS
// ============================================================================

/**
 * Attach a Sink that receives every LogEvent. The default ConsoleSink is
 * already attached at registry construction; this adds an additional sink.
 *
 * Back-compat: a v3 LogModule (`{ name, onLog(event) }`) is accepted and
 * adapted automatically. Returns the resolved Sink so callers can detach
 * it later.
 */
export function attachSink(sink: Sink | LogModule): Sink {
	return registry.attachSink(sink);
}

export function detachSink(sink: Sink): void {
	registry.detachSink(sink);
}

/** v3 alias. New code should use attachSink. */
export function addLogModule(module: LogModule | Sink): void {
	registry.attachSink(module);
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

/** Enable a specific logger namespace at runtime. */
export function enableLogger(namespace: string): void {
	const logger = registry.getLogger(namespace);
	if (logger) logger.setEnabled(true);
}

/** Disable a specific logger namespace at runtime. */
export function disableLogger(namespace: string): void {
	const logger = registry.getLogger(namespace);
	if (logger) logger.setEnabled(false);
}

/** Get a snapshot of all registered namespace names and their enabled state. */
export function getLoggerStates(): Array<{ namespace: string; enabled: boolean }> {
	const result: Array<{ namespace: string; enabled: boolean }> = [];
	registry.getAllLoggers().forEach((logger, namespace) => {
		result.push({ namespace, enabled: logger.opts.enabled });
	});
	return result.sort((a, b) => a.namespace.localeCompare(b.namespace));
}


const registry = getLoggerRegistry();

function emitEvent(event: LogEvent): void {
	registry.emit(event);
}

function pickData(args: any[]): any {
	for (const a of args) {
		if (a && typeof a === 'object') return a;
	}
	return undefined;
}

// Exposed for sinks that need to address the registry directly.
export { registry as defaultRegistry };
