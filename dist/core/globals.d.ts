import { LoggerOptions, Logger } from './lib/loggers/Logger.js';
import { PerformanceLoggerOptions, PerformanceLogger } from './lib/loggers/PerformanceLogger.js';
import { BufferedLoggerOptions, BufferedLogger } from './lib/loggers/BufferedLogger.js';
import { LogModule, Sink } from './lib/Sink.js';
export declare function getLogger(namespace: string, opts?: Partial<LoggerOptions>): Logger;
export declare function getPerformanceLogger(namespace: string, opts?: Partial<PerformanceLoggerOptions>): PerformanceLogger;
export declare function getBufferedLogger(namespace: string, opts?: Partial<BufferedLoggerOptions>): BufferedLogger;
export declare function log(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function warn(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function error(namespaceOrFirstArg: string, ...args: any[]): void;
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
    scope(id: string): {
        log: (...args: any[]) => void;
    };
}
export declare const debug: DebugFn;
/**
 * Attach a Sink that receives every LogEvent. The default ConsoleSink is
 * already attached at registry construction; this adds an additional sink.
 *
 * Back-compat: a v3 LogModule (`{ name, onLog(event) }`) is accepted and
 * adapted automatically. Returns the resolved Sink so callers can detach
 * it later.
 */
export declare function attachSink(sink: Sink | LogModule): Sink;
export declare function detachSink(sink: Sink): void;
/** v3 alias. New code should use attachSink. */
export declare function addLogModule(module: LogModule | Sink): void;
export declare function printLogCounts(): void;
export declare function setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void;
/** Enable a specific logger namespace at runtime. */
export declare function enableLogger(namespace: string): void;
/** Disable a specific logger namespace at runtime. */
export declare function disableLogger(namespace: string): void;
/** Get a snapshot of all registered namespace names and their enabled state. */
export declare function getLoggerStates(): Array<{
    namespace: string;
    enabled: boolean;
}>;
declare const registry: import("./index.js").LoggerRegistry;
export { registry as defaultRegistry };
//# sourceMappingURL=globals.d.ts.map