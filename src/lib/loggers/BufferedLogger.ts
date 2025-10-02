import { DEFAULT_LOGGER_OPTIONS, LoggerOptions, Logger } from './Logger.js';
import { log, warn, error } from '../utils.js';

export interface BufferedLoggerOptions extends LoggerOptions {
	maxBufferSize?: number;
}

const DEFAULT_BUFFERED_LOGGER_OPTIONS: Required<BufferedLoggerOptions> = {
	...DEFAULT_LOGGER_OPTIONS,
	maxBufferSize: 1000
};


export class BufferedLogger extends Logger {
	public opts: Required<BufferedLoggerOptions>;
	private buffer: any[][] = [];

	constructor(namespace: string, opts: Partial<BufferedLoggerOptions> = {}) {
		super(namespace, opts);
		this.opts = {
			...DEFAULT_BUFFERED_LOGGER_OPTIONS,
			...this.opts,
			...opts
		};
	}

	log(...args: any[]): this {
		if (this.buffer.length >= this.opts.maxBufferSize) {
			this.warn('Buffer overflow: flushing automatically');
			this.flush();
		}
		this.buffer.push(args);
		return this;
	}

	flush(): this {
		this.buffer.forEach(args => log(this.opts.namespace, ...args));
		this.buffer = [];
		return this;
	}

	clear(): this {
		this.buffer = [];
		return this;
	}

	getBufferSize(): number {
		return this.buffer.length;
	}
}
