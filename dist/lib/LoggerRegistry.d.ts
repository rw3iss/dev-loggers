import { Logger } from './loggers/Logger.js';
import { PerformanceLogger } from './loggers/PerformanceLogger.js';
import { BufferedLogger } from './loggers/BufferedLogger.js';
import { LogModule } from './LogModule.js';
export declare class LoggerRegistry {
    private static instance;
    private loggers;
    private modules;
    private logAllMode;
    private logOnlyNamespaces?;
    static getInstance(): LoggerRegistry;
    getLogger(namespace: string): Logger | PerformanceLogger | BufferedLogger | undefined;
    setLogger(namespace: string, logger: Logger | PerformanceLogger | BufferedLogger): void;
    addModule(module: LogModule): void;
    getModules(): LogModule[];
    shouldLog(namespace: string, enabled: boolean): boolean;
    setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void;
    getAllLoggers(): Map<string, Logger | PerformanceLogger | BufferedLogger>;
}
//# sourceMappingURL=LoggerRegistry.d.ts.map