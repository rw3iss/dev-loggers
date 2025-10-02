import { LoggerOptions, Logger } from './loggers/Logger.js';
import { PerformanceLogger, PerformanceLoggerOptions } from './loggers/PerformanceLogger.js';
import { BufferedLogger, BufferedLoggerOptions } from './loggers/BufferedLogger.js';
import { LoggerRegistry } from './LoggerRegistry.js';
import { LogModule } from './LogModule.js';
export declare function getLoggerRegistry(): LoggerRegistry;
export declare function getLogger(namespace: string, opts?: Partial<LoggerOptions>): Logger;
export declare function getPerformanceLogger(namespace: string, opts?: Partial<PerformanceLoggerOptions>): PerformanceLogger;
export declare function getBufferedLogger(namespace: string, opts?: Partial<BufferedLoggerOptions>): BufferedLogger;
export declare function addLogModule(module: LogModule): void;
export declare function log(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function warn(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function error(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function printLogCounts(): void;
export declare function setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void;
export declare const executePromisesSequentially: (promises: (() => Promise<any>)[]) => Promise<any[]>;
//# sourceMappingURL=utils.d.ts.map