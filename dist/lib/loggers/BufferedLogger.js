import { DEFAULT_LOGGER_OPTIONS, Logger } from './Logger.js';
import { log } from '../utils.js';
const DEFAULT_MAX_BUFFER_SIZE = 1000;
const DEFAULT_BUFFERED_LOGGER_OPTIONS = {
    ...DEFAULT_LOGGER_OPTIONS,
    maxBufferSize: DEFAULT_MAX_BUFFER_SIZE
};
export class BufferedLogger extends Logger {
    //private opts: Required<BufferedLoggerOptions> = DEFAULT_BUFFERED_LOGGER_OPTIONS;
    buffer = [];
    constructor(namespace, opts = {}) {
        super(namespace, opts);
        this.opts = {
            ...DEFAULT_BUFFERED_LOGGER_OPTIONS,
            ...this.opts,
            ...opts
        };
    }
    log = (...args) => {
        const opts = this.opts;
        if (this.buffer.length >= (opts?.maxBufferSize || DEFAULT_MAX_BUFFER_SIZE)) {
            this.warn('Buffer overflow: flushing automatically');
            this.flush();
        }
        this.buffer.push(args);
        return this;
    };
    flush = () => {
        this.buffer.forEach(args => log(this.opts.namespace, ...args));
        this.buffer = [];
        return this;
    };
    clear = () => {
        this.buffer = [];
        return this;
    };
    getBufferSize = () => {
        return this.buffer.length;
    };
}
