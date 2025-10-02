import { DEFAULT_LOGGER_OPTIONS, Logger } from './Logger.js';
import { log } from '../utils.js';
const DEFAULT_BUFFERED_LOGGER_OPTIONS = {
    ...DEFAULT_LOGGER_OPTIONS,
    maxBufferSize: 1000
};
export class BufferedLogger extends Logger {
    opts;
    buffer = [];
    constructor(namespace, opts = {}) {
        super(namespace, opts);
        this.opts = {
            ...DEFAULT_BUFFERED_LOGGER_OPTIONS,
            ...this.opts,
            ...opts
        };
    }
    log(...args) {
        if (this.buffer.length >= this.opts.maxBufferSize) {
            this.warn('Buffer overflow: flushing automatically');
            this.flush();
        }
        this.buffer.push(args);
        return this;
    }
    flush() {
        this.buffer.forEach(args => log(this.opts.namespace, ...args));
        this.buffer = [];
        return this;
    }
    clear() {
        this.buffer = [];
        return this;
    }
    getBufferSize() {
        return this.buffer.length;
    }
}
