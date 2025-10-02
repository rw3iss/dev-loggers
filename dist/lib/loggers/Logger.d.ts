export interface LoggerOptions {
    namespace?: string;
    color?: string;
    enabled?: boolean;
    prefix?: string;
    postfix?: string;
}
export declare const DEFAULT_LOGGER_OPTIONS: Required<LoggerOptions>;
export declare class Logger {
    opts: Required<LoggerOptions>;
    constructor(namespace: string, opts?: Partial<LoggerOptions>);
    log: (...args: any[]) => this;
    warn: (...args: any[]) => this;
    error: (...args: any[]) => this;
    setEnabled: (enabled: boolean) => this;
    protected applyFormatting: (args: any[]) => any[];
}
//# sourceMappingURL=Logger.d.ts.map