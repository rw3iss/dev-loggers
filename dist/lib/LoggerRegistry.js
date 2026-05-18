import { ConsoleSink } from './ConsoleSink.js';
import { moduleToSink } from './Sink.js';
/**
 * Singleton accessible through LoggerRegistry.getInstance(). For tests or
 * non-singleton setups call `new LoggerRegistry()` directly.
 */
export class LoggerRegistry {
    static instance;
    loggers = new Map();
    sinks = [];
    consoleSink = new ConsoleSink();
    logAllMode = false;
    logOnlyNamespaces;
    constructor() {
        // ConsoleSink is on by default. Call `detachSink(registry.getConsoleSink())`
        // to opt out (useful in tests).
        this.sinks.push(this.consoleSink);
    }
    static getInstance() {
        if (!LoggerRegistry.instance) {
            LoggerRegistry.instance = new LoggerRegistry();
        }
        return LoggerRegistry.instance;
    }
    getLogger(namespace) {
        return this.loggers.get(namespace);
    }
    setLogger(namespace, logger) {
        this.loggers.set(namespace, logger);
    }
    /** Attach a Sink (or v3 LogModule). Returns the resolved Sink for detach(). */
    attachSink(sinkOrModule) {
        const sink = 'write' in sinkOrModule
            ? sinkOrModule
            : moduleToSink(sinkOrModule);
        this.sinks.push(sink);
        return sink;
    }
    /** Detach a previously-attached Sink. Silent no-op if not found. */
    detachSink(sink) {
        const i = this.sinks.indexOf(sink);
        if (i >= 0)
            this.sinks.splice(i, 1);
    }
    getSinks() {
        return this.sinks;
    }
    getConsoleSink() {
        return this.consoleSink;
    }
    /** v3 back-compat. */
    addModule(module) {
        this.attachSink(module);
    }
    getModules() {
        return this.sinks;
    }
    emit(event) {
        for (const sink of this.sinks)
            sink.write(event);
    }
    shouldLog(namespace, enabled) {
        if (this.logAllMode) {
            return !this.logOnlyNamespaces || this.logOnlyNamespaces.has(namespace);
        }
        return enabled;
    }
    setLogAllMode(enabled, onlyNamespaces) {
        this.logAllMode = enabled;
        this.logOnlyNamespaces = onlyNamespaces ? new Set(onlyNamespaces) : undefined;
    }
    getAllLoggers() {
        return this.loggers;
    }
}
/** Factory for an isolated registry (tests, multi-app embeds). */
export function createLoggerRegistry() {
    return new LoggerRegistry();
}
