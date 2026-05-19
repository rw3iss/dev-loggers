import { LogEvent } from './LogEvent.js';
import { Sink } from './Sink.js';
/**
 * Default Sink. Writes to the browser/Node console using the level-appropriate
 * method. Always attached unless explicitly removed (`detachSink(consoleSink)`).
 */
export declare class ConsoleSink implements Sink {
    name: string;
    write(event: LogEvent): void;
}
//# sourceMappingURL=ConsoleSink.d.ts.map