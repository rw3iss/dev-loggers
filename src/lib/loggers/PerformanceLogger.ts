import { DEFAULT_LOGGER_OPTIONS, Logger, LoggerOptions } from './Logger.js';
import { log, warn, error } from '../utils.js';

export interface PerformanceLoggerOptions extends LoggerOptions {
	logCounts?: boolean;
}

const DEFAULT_PERFORMANCE_LOGGER_OPTIONS: Required<PerformanceLoggerOptions> = {
	...DEFAULT_LOGGER_OPTIONS,
	logCounts: true
};

export class PerformanceLogger extends Logger {
	public opts: Required<PerformanceLoggerOptions>;
	private counts = new Map<string, number>();
	private times = new Map<string, number>();

	constructor(namespace: string, opts: Partial<PerformanceLoggerOptions> = {}) {
		super(namespace, opts);
		this.opts = {
			...DEFAULT_PERFORMANCE_LOGGER_OPTIONS,
			...this.opts,
			...opts
		};
	}

	log(...args: any[]): this {
		if (args.length === 0) return this;

		const id = String(args[0]);
		const elapsed = this.recordTime(id);
		this.incrementCount(id);

		const formattedArgs = this.applyFormatting(args);
		const finalArgs = elapsed !== undefined
			? [...formattedArgs, `(${elapsed}ms)`]
			: formattedArgs;

		log(this.opts.namespace, ...finalArgs);
		return this;
	}

	logIncr(...args: any[]): this {
		if (args.length === 0) return this;
		const id = String(args[0]);
		this.incrementCount(id);
		log(this.opts.namespace, ...this.applyFormatting(args));
		return this;
	}

	incr(id: string): number {
		return this.incrementCount(id);
	}

	time(id: string): number | undefined {
		return this.recordTime(id);
	}

	printCounts(): this {
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
	}

	reset(): this {
		this.counts.clear();
		this.times.clear();
		return this;
	}

	private incrementCount(id: string): number {
		const count = (this.counts.get(id) || 0) + 1;
		this.counts.set(id, count);
		return count;
	}

	private recordTime(id: string): number | undefined {
		const now = Date.now();
		const last = this.times.get(id);
		this.times.set(id, now);
		return last !== undefined ? now - last : undefined;
	}
}
