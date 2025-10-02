import { DEFAULT_LOGGER_OPTIONS, LoggerOptions, Logger } from './Logger.js';
import { log, warn, error } from '../utils.js';

export interface BufferedLoggerOptions extends LoggerOptions {
	maxBufferSize?: number;
}

const DEFAULT_MAX_BUFFER_SIZE = 1000;
const DEFAULT_BUFFERED_LOGGER_OPTIONS: Required<BufferedLoggerOptions> = {
	...DEFAULT_LOGGER_OPTIONS,
	maxBufferSize: DEFAULT_MAX_BUFFER_SIZE
};


export class BufferedLogger extends Logger {
	//private opts: Required<BufferedLoggerOptions> = DEFAULT_BUFFERED_LOGGER_OPTIONS;
	private buffer: any[][] = [];

	constructor(namespace: string, opts: Partial<BufferedLoggerOptions> = {}) {
		super(namespace, opts);
		this.opts = {
			...DEFAULT_BUFFERED_LOGGER_OPTIONS,
			...this.opts,
			...opts
		};
	}

	public log = (...args: any[]): this => {
		const opts = this.opts as BufferedLoggerOptions;
		if (this.buffer.length >= (opts?.maxBufferSize || DEFAULT_MAX_BUFFER_SIZE)) {
			this.warn('Buffer overflow: flushing automatically');
			this.flush();
		}
		this.buffer.push(args);
		return this;
	}

	public flush = (): this => {
		this.buffer.forEach(args => log(this.opts.namespace, ...args));
		this.buffer = [];
		return this;
	}

	public clear = (): this => {
		this.buffer = [];
		return this;
	}

	public getBufferSize = (): number => {
		return this.buffer.length;
	}
}
