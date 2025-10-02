// get-loggers:
//
// Logger: Basic logging with namespacing, coloring, options.
// PerformanceLogger: prints time between statements with the same ID (first argument).
// BufferedLogger: stores logs until .flush() is called, then printing them all at once.
//
// LogModules: register external classes which have an onLog handler, and receive all log events for custom operations.
//
// All loggers output to console.log, but this can be changed by importing and calling setLogOutput(output) method.
// todo: move this stuff to constructor+config
export const LOG_ERROR_TRACES = false; // show the calller path from log(), warn(), error().
export const ALWAYS_LOG_ERRORS = true; // always log error() calls even if the logger is disabled.
export const ALWAYS_LOG_WARNINGS = false; // always log warn() calls even if the logger is disabled.
export const COLORS_ENABLED = process.env.LOGGING_COLORS_ENABLED == 'true'; // hide ansi color vars, useful for remote server logs
export const DEFAULT_LOG_COLOR = 'yellow';
// GLOBALS //////////////////////////////////
// isLogAllMode: always log all Loggers regardless of enabled flag. todo: make api
let isLogAllMode = false;
// helper to quickly isolate single loggers for debugging. todo: make api
let logOnly = undefined;
// global loggers
const loggers = {};
const logModules = [];
if (typeof globalThis != 'undefined')
    globalThis.loggers = loggers; // add reference to window object, for browser utility/debug
// Color helpers
export const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    orange: '\x1b[48:5:208m%s',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[95m',
    darkcyan: '\x1b[36m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    BGblack: '\x1b[40m',
    BGred: '\x1b[41m',
    BGgreen: '\x1b[42m',
    BGyellow: '\x1b[43m',
    BGblue: '\x1b[44m',
    BGmagenta: '\x1b[45m',
    BGcyan: '\x1b[46m',
    BGwhite: '\x1b[47m'
};
export function color(color, str) {
    let cs = color.indexOf('\x1b') >= 0 ? color : Colors[color];
    return `${cs}${str}${Colors['reset']}`;
}
export const addLogModule = (m) => logModules.push(m);
// GET LOGGERS //////////////////////////////////
// Retrieve or create a basic Logger by namespace.
export const getLogger = function (namespace = '', opts = DEFAULT_LOGGER_OPTIONS) {
    if (!namespace)
        throw 'Must supply a namespace as first argument to getLogger.';
    let l = loggers[namespace];
    if (!l) {
        l = new Logger(namespace, opts);
        loggers[namespace] = l;
    }
    return l;
};
// Retrieve or create a PerformanceLogger by namespace. Performance loggers will store the time of
// each unique message, and show the time elapsed the next time the same message is logged.
export const getPerformanceLogger = function (namespace = '', opts = DEFAULT_PERFORMANCE_LOGGER_OPTIONS) {
    if (!namespace)
        throw 'Must supply a namespace as first argument to getPerformanceLogger.';
    let l = loggers[namespace];
    if (!l) {
        l = new PerformanceLogger(namespace, opts);
        loggers[namespace] = l;
    }
    return l;
};
// Retrieve or create a PerformanceLogger by namespace. Performance loggers will store the time of
// each unique message, and show the time elapsed the next time the same message is logged.
export const getBufferedLogger = function (namespace = '', opts = DEFAULT_BUFFERED_LOGGER_OPTIONS) {
    if (!namespace)
        throw 'Must supply a namespace as first argument to getBufferedLogger.';
    let l = loggers[namespace];
    if (!l) {
        l = new BufferedLogger(namespace, opts);
        loggers[namespace] = l;
    }
    return l;
};
// Main utility methods used by all loggers.
// Can be used directly. Used by the Logger instances.
const log = function (...args) {
    const namespace = args.length > 1 ? args[0] : '';
    args = args.length > 1 ? args.slice(1, args.length) : [];
    let l = getLogger(namespace);
    if (l) {
        // log if normal mode, and logger is enabled, or log if it is globally-enabled
        if ((!isLogAllMode && l.opts.enabled) || (isLogAllMode && (!logOnly || logOnly.includes(namespace)))) {
            let la = [...args];
            if (namespace) {
                la.unshift(COLORS_ENABLED
                    ? `${Colors[l.opts.color || 'white']}${namespace || '(no namespace)'}:${Colors['reset']}`
                    : `${namespace || '(no namespace)'}:`);
            }
            doLog(namespace, la);
            //if (LOG_TRACES) console.log(_callPath());
        }
    }
    else {
        doLog(namespace, args);
    }
};
// Can be used directly. Used by the Logger instances.
const warn = function (...args) {
    const namespace = args.length > 1 ? args[0] : '';
    args = args.length > 1 ? args.slice(1, args.length) : [];
    let l = getLogger(namespace);
    if (l) {
        if (ALWAYS_LOG_WARNINGS || (!isLogAllMode && l.opts.enabled) || (isLogAllMode && (!logOnly || logOnly.includes(namespace)))) {
            let la = [...args];
            if (namespace) {
                la.unshift((COLORS_ENABLED
                    ? `${Colors[l.opts.color || 'white']}${namespace || '(no namespace)'}:${Colors['reset']}`
                    : `${namespace || '(no namespace)'}:`) + `⚠️ Warning:`);
            }
            doLog(namespace, la);
        }
    }
    else {
        doLog(namespace, ['⚠️ Warning:', ...args]);
    }
};
// Can be used directly. Used by the Logger instances.
const error = function (...args) {
    const namespace = args.length > 1 ? args[0] : '';
    args = args.length > 1 ? args.slice(1, args.length) : [];
    let l = getLogger(namespace);
    if (l) {
        if (ALWAYS_LOG_ERRORS || (!isLogAllMode && l.opts.enabled) || (isLogAllMode && (!logOnly || logOnly.includes(namespace)))) {
            let la = [...args];
            if (namespace) {
                la.unshift((COLORS_ENABLED
                    ? `${Colors[l.opts.color || 'white']}${namespace || '(no namespace)'}:${Colors['reset']}`
                    : `${namespace || '(no namespace)'}:`) + `🛑 Error!`);
            }
            doLog(namespace, la);
            if (LOG_ERROR_TRACES)
                la.unshift('At: ' + callPath());
        }
    }
    else {
        doLog(namespace, ['`🛑 Error!', ...args]);
    }
};
/////////////////////////////////////////////////////
// Logger classes:
// Default configs
const DEFAULT_LOGGER_OPTIONS = {
    enabled: true
};
const DEFAULT_PERFORMANCE_LOGGER_OPTIONS = Object.assign(Object.assign({}, DEFAULT_LOGGER_OPTIONS), {
    isPerformanceLogger: true, // shortcut for now
    enabled: true,
    logCounts: true
});
const DEFAULT_BUFFERED_LOGGER_OPTIONS = Object.assign(Object.assign({}, DEFAULT_LOGGER_OPTIONS), {
    isBufferedLogger: true
});
// LOGGER CLASSES
// A Logger that utilizes the global log() method, and adds fancy stuff like colors, namespacing, and configuration.
export class Logger {
    constructor(namespace, opts = DEFAULT_LOGGER_OPTIONS) {
        // todo: these need to be on a .opts object for proper extension.
        this.opts = DEFAULT_LOGGER_OPTIONS;
        this.log = (...args) => {
            log(this.opts.namespace, ...this.addArgs(args));
            return this;
        };
        this.warn = (...args) => {
            warn(this.opts.namespace, ...this.addArgs(args));
            return this;
        };
        this.error = (...args) => {
            error(this.opts.namespace, ...this.addArgs(args));
            return this;
        };
        this.setEnabled = (enabled) => {
            this.opts.enabled = enabled;
            return this;
        };
        this.opts = Object.assign(Object.assign({}, DEFAULT_LOGGER_OPTIONS), opts);
        this.opts.namespace = namespace || opts.namespace || '';
        // this.color = _opts.color ? _opts.color : DEFAULT_LOG_COLOR;
        // this.enabled = typeof _opts.enabled != 'undefined' ? _opts.enabled : false;
        // this.prefix = _opts.prefix || '';
        // this.postfix = _opts.postfix || '';
    }
    // adds postfix/prefix etc to the plain args
    addArgs(args) {
        const a = args;
        if (this.opts.prefix)
            args.unshift(this.opts.prefix);
        if (this.opts.postfix)
            args.push(this.opts.postfix);
        return args;
    }
}
export class PerformanceLogger extends Logger {
    constructor(namespace, opts = DEFAULT_PERFORMANCE_LOGGER_OPTIONS) {
        super(namespace, opts);
        this.counts = new Map(); // msg id => call counts
        this.times = new Map(); // msg id => last msg time (for profiling)
        // logs and also mentions time since last log with same text
        // public pLog = (...args): PerformanceLogger => {
        // 	if (!args?.length) return this;
        // 	const msgIndex = args[0];
        // 	const msSinceLast = this.time(msgIndex); // log time since since this last same msg
        // 	this.incr(msgIndex);
        // 	this.log(...args, msSinceLast ? `(${msSinceLast}ms)` : '');
        // 	return this;
        // };
        // logs and also mentions time since last log with same text
        this.log = (...args) => {
            if (!(args === null || args === void 0 ? void 0 : args.length))
                return this;
            const msgIndex = args[0];
            const msSinceLast = this.time(msgIndex); // log time since since this last same msg
            if (this.opts.logCounts)
                this.incr(msgIndex);
            const timeMsg = msSinceLast ? `(${msSinceLast}ms)` : '';
            log(this.opts.namespace, ...this.addArgs(args), timeMsg);
            return this;
            // this does not work, super.log doesn't work with arrow members.
            // this.log(...args, msSinceLast ? `(${msSinceLast}ms)` : '');
            // return this;
        };
        // log and increment
        this.logIncr = (...args) => {
            if (!(args === null || args === void 0 ? void 0 : args.length))
                return this;
            if (this.opts.logCounts) {
                const msgIndex = args[0];
                this.incr(msgIndex);
            }
            this.log(...args);
            return this;
        };
        // Increments the message call, and returns the number of current calls for this message
        this.incr = (id) => {
            let s = (this.counts.get(id) || 0) + 1;
            this.counts.set(id, s);
            return s;
        };
        this.time = (id) => {
            let last = this.times.get(id);
            const now = Date.now();
            let timeSinceLast = last ? now - last : undefined;
            last = now;
            this.times.set(id, last);
            return timeSinceLast;
        };
        this.printCounts = () => {
            let msg = `Log call counts:\n------------------------------------------------------------\n`;
            let j = '';
            for (const [k, v] of this.counts) {
                msg += `${j}${v}:\t${k}`;
                j = '\n';
            }
            msg += `\n------------------------------------------------------------\n`;
            this.log(msg);
            return this;
        };
        this.opts = Object.assign(Object.assign({}, DEFAULT_PERFORMANCE_LOGGER_OPTIONS), this.opts);
    }
}
export class BufferedLogger extends Logger {
    constructor(namespace, opts = DEFAULT_BUFFERED_LOGGER_OPTIONS) {
        super(namespace, opts);
        this.logs = []; // the buffer
        this.log = (...args) => {
            //console.log(`BUFFERED LOG:`, args);
            this.logs.push(args);
            return this;
        };
        this.flush = () => {
            this.logs.forEach(l => log(this.opts.namespace, ...l));
            this.logs = [];
            return this;
        };
        this.opts = Object.assign(Object.assign({}, DEFAULT_BUFFERED_LOGGER_OPTIONS), this.opts);
    }
}
let _loggingOutputHandler = console.log;
// main internal logging output call from other methods, sends the output to modules.
function doLog(namespace, args) {
    //let stack = (new Error()).stack.split("\n")[1].split("/").slice(-1)[0].split(":");
    //const [filename, linenum, linepos] = stack;
    //args.push(`:${linenum} @${linepos}`);
    const logEvent = { namespace, args };
    logModules.forEach((m) => m.onLog(logEvent));
    _loggingOutputHandler.apply(console, args);
}
export const setLogOutput = (out) => {
    _loggingOutputHandler = out;
};
// return the call stack as a string
const callPath = () => {
    // exclude lines containing these keywords
    const excludeKeywords = ['logging.ts', 'node:internal', 'node_modules']; //,  "(<anonymous>)", "Error"];
    let obj = {};
    Error.captureStackTrace(obj, callPath);
    return obj.stack
        .split('\n')
        .filter((line) => !excludeKeywords.some((keyword) => line.includes(keyword)))
        .join('\n');
};
// window utility to print all performance logger stats.
export const printLogs = () => {
    for (const l of Object.values(loggers)) {
        const pl = l;
        if (pl.opts.isPerformanceLogger) {
            pl.printCounts();
        }
    }
};
// utility window method to print all performance logger current stats.
if (typeof global != 'undefined') {
    global.printLogs = printLogs;
}
///////////////////////////////////////////
// this is is sort of a browser-only feature atm.
// let windowParams;
// let isLogAllMode = false;
// let logOnly = undefined;
// if (typeof window != 'undefined' && typeof URLSearchParams != 'undefined') {
//     windowParams = new URLSearchParams(window.location.search);
//     if (windowParams.get('logAll')) {
//         let logWhat = windowParams.get('logAll');
//         if (logWhat == 'true') {
//             isLogAllMode = true;
//         } else if (logWhat && logWhat != 'true') {
//             isLogAllMode = true;
//             logOnly = logWhat.split(',');
//         }
//     }
// }
//# sourceMappingURL=index.js.map