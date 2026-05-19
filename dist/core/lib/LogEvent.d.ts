export type LogLevel = 'log' | 'warn' | 'error' | 'debug';
/**
 * Structured log event delivered to every registered Sink.
 *
 * `args` is preserved for back-compat with v3 LogModules.
 * `id` and `data` are new and convenient for UI consumers:
 *   - `id` groups related entries (per-id tabs in dev-debug-panel).
 *   - `data` is the first non-string object arg, hoisted for inspection.
 */
export interface LogEvent {
    namespace: string;
    id?: string;
    level: LogLevel;
    args: any[];
    data?: any;
    timestamp: number;
}
//# sourceMappingURL=LogEvent.d.ts.map