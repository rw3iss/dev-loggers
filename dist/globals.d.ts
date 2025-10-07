import { LoggerOptions, Logger } from './lib/loggers/Logger.js';
import { PerformanceLoggerOptions, PerformanceLogger } from './lib/loggers/PerformanceLogger.js';
import { BufferedLoggerOptions, BufferedLogger } from './lib/loggers/BufferedLogger.js';
import { LogModule } from './lib/LogModule.js';
export declare function getLogger(namespace: string, opts?: Partial<LoggerOptions>): Logger;
export declare function getPerformanceLogger(namespace: string, opts?: Partial<PerformanceLoggerOptions>): PerformanceLogger;
export declare function getBufferedLogger(namespace: string, opts?: Partial<BufferedLoggerOptions>): BufferedLogger;
export declare function log(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function warn(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function error(namespaceOrFirstArg: string, ...args: any[]): void;
export declare function addLogModule(module: LogModule): void;
export declare function printLogCounts(): void;
export declare function setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void;
//# sourceMappingURL=globals.d.ts.map