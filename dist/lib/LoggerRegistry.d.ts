import { Logger } from './loggers/Logger.js';
import { PerformanceLogger } from './loggers/PerformanceLogger.js';
import { BufferedLogger } from './loggers/BufferedLogger.js';
import { LogEvent } from './LogEvent.js';
import { LogModule, Sink } from './Sink.js';
type AnyLogger = Logger | PerformanceLogger | BufferedLogger;
/**
 * Singleton accessible through LoggerRegistry.getInstance(). For tests or
 * non-singleton setups call `new LoggerRegistry()` directly.
 */
export declare class LoggerRegistry {
    private static instance;
    private loggers;
    private sinks;
    private consoleSink;
    private logAllMode;
    private logOnlyNamespaces?;
    constructor();
    static getInstance(): LoggerRegistry;
    getLogger(namespace: string): AnyLogger | undefined;
    setLogger(namespace: string, logger: AnyLogger): void;
    /** Attach a Sink (or v3 LogModule). Returns the resolved Sink for detach(). */
    attachSink(sinkOrModule: Sink | LogModule): Sink;
    /** Detach a previously-attached Sink. Silent no-op if not found. */
    detachSink(sink: Sink): void;
    getSinks(): Sink[];
    getConsoleSink(): Sink;
    /** v3 back-compat. */
    addModule(module: LogModule | Sink): void;
    getModules(): Sink[];
    emit(event: LogEvent): void;
    shouldLog(namespace: string, enabled: boolean): boolean;
    setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void;
    getAllLoggers(): Map<string, AnyLogger>;
}
/** Factory for an isolated registry (tests, multi-app embeds). */
export declare function createLoggerRegistry(): LoggerRegistry;
export {};
//# sourceMappingURL=LoggerRegistry.d.ts.map