import { DEFAULT_LOGGER_OPTIONS, Logger } from './Logger.js';
import { log } from '../utils.js';
const DEFAULT_PERFORMANCE_LOGGER_OPTIONS = {
    ...DEFAULT_LOGGER_OPTIONS,
    logCounts: true,
    showIds: true
};
export class PerformanceLogger extends Logger {
    //public opts: Required<PerformanceLoggerOptions>;
    counts = new Map();
    times = new Map();
    constructor(namespace, opts = {}) {
        super(namespace, opts);
        this.opts = {
            ...DEFAULT_PERFORMANCE_LOGGER_OPTIONS,
            ...this.opts,
            ...opts
        };
    }
    log = (...args) => {
        if (args.length === 0)
            return this;
        const id = String(args[0]);
        const elapsed = this.recordTime(id);
        this.incrementCount(id);
        const formattedArgs = this.applyFormatting(args);
        const finalArgs = elapsed !== undefined
            ? [...formattedArgs, `(${elapsed}ms)`]
            : formattedArgs;
        log(this.opts.namespace, ...finalArgs);
        return this;
    };
    logIncr = (...args) => {
        if (args.length === 0)
            return this;
        const id = String(args[0]);
        this.incrementCount(id);
        log(this.opts.namespace, ...this.applyFormatting(args));
        return this;
    };
    incr = (id) => {
        return this.incrementCount(id);
    };
    time = (id) => {
        return this.recordTime(id);
    };
    printCounts = () => {
        const entries = Array.from(this.counts.entries())
            .sort((a, b) => b[1] - a[1]); // Sort by count descending
        const lines = [
            'Log call counts:',
            '─'.repeat(60),
            ...entries.map(([id, count]) => `${count}:\t${id}`),
            '─'.repeat(60)
        ];
        log(this.opts.namespace, lines.join('\n'));
        return this;
    };
    reset = () => {
        this.counts.clear();
        this.times.clear();
        return this;
    };
    incrementCount(id) {
        const count = (this.counts.get(id) || 0) + 1;
        this.counts.set(id, count);
        return count;
    }
    recordTime(id) {
        const now = Date.now();
        const last = this.times.get(id);
        this.times.set(id, now);
        return last !== undefined ? now - last : undefined;
    }
}
