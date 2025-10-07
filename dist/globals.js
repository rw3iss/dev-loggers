import { Logger } from './lib/loggers/Logger.js';
import { PerformanceLogger } from './lib/loggers/PerformanceLogger.js';
import { getLoggerRegistry, formatNamespace, getCallStack } from './utils.js';
import { BufferedLogger } from './lib/loggers/BufferedLogger.js';
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
// CORE LOGGING FUNCTIONS
// ============================================================================
export function log(namespaceOrFirstArg, ...args) {
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
export function warn(namespaceOrFirstArg, ...args) {
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
export function error(namespaceOrFirstArg, ...args) {
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
export function addLogModule(module) {
    registry.addModule(module);
}
// ============================================================================
// MISC CONTROLS
// ============================================================================
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
const registry = getLoggerRegistry();
function emitLog(namespace, args) {
    const event = { namespace, args };
    registry.getModules().forEach(module => module.onLog(event));
    console.log(...args);
}
