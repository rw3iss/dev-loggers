import { LogEvent } from './LogEvent.js';
export interface LogModule {
    name: string;
    onLog(event: LogEvent): void;
}
//# sourceMappingURL=LogModule.d.ts.map