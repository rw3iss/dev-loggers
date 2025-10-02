import { COLORS_ENABLED, ALWAYS_LOG_WARNINGS, ALWAYS_LOG_ERRORS, LOG_ERROR_TRACES } from './config.js';
import { Logger } from './loggers/Logger.js';
import { PerformanceLogger } from './loggers/PerformanceLogger.js';
import { BufferedLogger } from './loggers/BufferedLogger.js';
import { Colors } from './colors.js';
import { LoggerRegistry } from './LoggerRegistry.js';
const registry = getLoggerRegistry();
// ============================================================================
// LOGGER FACTORY FUNCTIONS
// ============================================================================
export function getLoggerRegistry() {
    return LoggerRegistry.getInstance();
}
export function getLogger(namespace, opts = {}) {
    if (!namespace)
        throw new Error('Must supply a namespace as first argument to getLogger');
    let logger = registry.getLogger(namespace);
    if (!logger) {
        logger = new Logger(namespace, opts);
        registry.setLogger(namespace, logger);
    }
    return logger;
}
export function getPerformanceLogger(namespace, opts = {}) {
    if (!namespace)
        throw new Error('Must supply a namespace as first argument to getPerformanceLogger');
    let logger = registry.getLogger(namespace);
    if (!logger) {
        logger = new PerformanceLogger(namespace, opts);
        registry.setLogger(namespace, logger);
    }
    return logger;
}
export function getBufferedLogger(namespace, opts = {}) {
    if (!namespace)
        throw new Error('Must supply a namespace as first argument to getBufferedLogger');
    let logger = registry.getLogger(namespace);
    if (!logger) {
        logger = new BufferedLogger(namespace, opts);
        registry.setLogger(namespace, logger);
    }
    return logger;
}
// ============================================================================
// LOG MODULES
// ============================================================================
export function addLogModule(module) {
    registry.addModule(module);
}
// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================
export function log(namespaceOrFirstArg, ...args) {
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
export function warn(namespaceOrFirstArg, ...args) {
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
export function error(namespaceOrFirstArg, ...args) {
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
export function printLogCounts() {
    registry.getAllLoggers().forEach(logger => {
        if (logger instanceof PerformanceLogger) {
            logger.printCounts();
        }
    });
}
export function setLogAllMode(enabled, onlyNamespaces) {
    registry.setLogAllMode(enabled, onlyNamespaces);
}
// UTILS:
function formatNamespace(namespace, color) {
    if (!namespace)
        return '';
    if (COLORS_ENABLED) {
        const colorCode = Colors[color] || Colors.white;
        return `${colorCode}${namespace}:${Colors.reset}`;
    }
    return `${namespace}:`;
}
function emitLog(namespace, args) {
    const event = { namespace, args };
    registry.getModules().forEach(module => module.onLog(event));
    console.log(...args);
}
function getCallStack() {
    const excludeKeywords = ['logging.ts', 'node:internal', 'node_modules'];
    const obj = {};
    Error.captureStackTrace(obj, getCallStack);
    return obj.stack
        .split('\n')
        .filter((line) => !excludeKeywords.some(keyword => line.includes(keyword)))
        .join('\n');
}
export const executePromisesSequentially = async (promises) => {
    const results = [];
    for (const promiseFactory of promises) {
        const result = await promiseFactory(); // Await each promise before proceeding
        results.push(result);
    }
    return results;
};
