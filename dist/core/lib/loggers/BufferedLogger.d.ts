import { LoggerOptions, Logger } from './Logger.js';
export interface BufferedLoggerOptions extends LoggerOptions {
    maxBufferSize?: number;
}
export declare class BufferedLogger extends Logger {
    private buffer;
    constructor(namespace: string, opts?: Partial<BufferedLoggerOptions>);
    log: (...args: any[]) => this;
    flush: () => this;
    clear: () => this;
    getBufferSize: () => number;
}
//# sourceMappingURL=BufferedLogger.d.ts.map