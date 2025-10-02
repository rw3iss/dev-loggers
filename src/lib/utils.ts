import { COLORS_ENABLED, ALWAYS_LOG_WARNINGS, ALWAYS_LOG_ERRORS, LOG_ERROR_TRACES } from './config.js';
import { LoggerOptions, Logger } from './loggers/Logger.js';
import { PerformanceLogger, PerformanceLoggerOptions } from './loggers/PerformanceLogger.js';
import { BufferedLogger, BufferedLoggerOptions } from './loggers/BufferedLogger.js';
import { Colors } from './colors.js';
import { LogEvent } from './LogEvent.js';
import { LoggerRegistry } from './LoggerRegistry.js';
import { LogModule } from './LogModule.js';

// ============================================================================
// LOGGER FACTORY FUNCTIONS
// ============================================================================

export function getLoggerRegistry() {
	return LoggerRegistry.getInstance();
}

const registry = getLoggerRegistry();

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
// LOG MODULES
// ============================================================================

export function addLogModule(module: LogModule): void {
	registry.addModule(module);
}



// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

export function log(namespaceOrFirstArg: string, ...args: any[]): void {
	const hasNamespace = typeof namespaceOrFirstArg === 'string' && registry.getLogger(namespaceOrFirstArg);
	const namespace = hasNamespace ? namespaceOrFirstArg : '';
	const logArgs = hasNamespace ? args : [namespaceOrFirstArg, ...args];

	const logger = namespace ? registry.getLogger(namespace) : null;

	if (logger && !registry.shouldLog(namespace, logger.opts.enabled)) {
		return;
	}

	const formattedArgs = namespace && logger
		? [formatNamespace(namespace, logger.opts.color), ...logArgs]
		: logArgs;

	emitLog(namespace, formattedArgs);
}

export function warn(namespaceOrFirstArg: string, ...args: any[]): void {
	const hasNamespace = typeof namespaceOrFirstArg === 'string' && registry.getLogger(namespaceOrFirstArg);
	const namespace = hasNamespace ? namespaceOrFirstArg : '';
	const logArgs = hasNamespace ? args : [namespaceOrFirstArg, ...args];

	const logger = namespace ? registry.getLogger(namespace) : null;

	if (logger && !ALWAYS_LOG_WARNINGS && !registry.shouldLog(namespace, logger.opts.enabled)) {
		return;
	}

	const prefix = namespace && logger
		? `${formatNamespace(namespace, logger.opts.color)} ⚠️ Warning:`
		: '⚠️ Warning:';

	emitLog(namespace, [prefix, ...logArgs]);
}

export function error(namespaceOrFirstArg: string, ...args: any[]): void {
	const hasNamespace = typeof namespaceOrFirstArg === 'string' && registry.getLogger(namespaceOrFirstArg);
	const namespace = hasNamespace ? namespaceOrFirstArg : '';
	const logArgs = hasNamespace ? args : [namespaceOrFirstArg, ...args];

	const logger = namespace ? registry.getLogger(namespace) : null;

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

export function printLogs(): void {
	registry.getAllLoggers().forEach(logger => {
		if (logger instanceof PerformanceLogger) {
			logger.printCounts();
		}
	});
}

export function setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void {
	registry.setLogAllMode(enabled, onlyNamespaces);
}



// UTILS:

function formatNamespace(namespace: string, color: string): string {
	if (!namespace) return '';

	if (COLORS_ENABLED) {
		const colorCode = Colors[color as keyof typeof Colors] || Colors.white;
		return `${colorCode}${namespace}:${Colors.reset}`;
	}
	return `${namespace}:`;
}

function emitLog(namespace: string, args: any[]): void {
	const event: LogEvent = { namespace, args };
	registry.getModules().forEach(module => module.onLog(event));
	console.log(...args);
}

function getCallStack(): string {
	const excludeKeywords = ['logging.ts', 'node:internal', 'node_modules'];
	const obj: any = {};
	Error.captureStackTrace(obj, getCallStack);
	return obj.stack
		.split('\n')
		.filter((line: string) => !excludeKeywords.some(keyword => line.includes(keyword)))
		.join('\n');
}
