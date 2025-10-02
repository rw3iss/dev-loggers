import { Logger, LoggerOptions } from './Logger.js';
export interface PerformanceLoggerOptions extends LoggerOptions {
    logCounts?: boolean;
    showIds?: boolean;
}
export declare class PerformanceLogger extends Logger {
    private counts;
    private times;
    constructor(namespace: string, opts?: Partial<PerformanceLoggerOptions>);
    log: (...args: any[]) => this;
    logIncr: (...args: any[]) => this;
    incr: (id: string) => number;
    time: (id: string) => number | undefined;
    printCounts: () => this;
    reset: () => this;
    private incrementCount;
    private recordTime;
}
//# sourceMappingURL=PerformanceLogger.d.ts.map