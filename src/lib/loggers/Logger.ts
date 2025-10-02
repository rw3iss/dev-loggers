import { log, warn, error } from '../utils.js';
import { DEFAULT_LOG_COLOR } from '../config.js';

export interface LoggerOptions {
	namespace?: string;
	color?: string;
	enabled?: boolean;
	prefix?: string;
	postfix?: string;
}

export const DEFAULT_LOGGER_OPTIONS: Required<LoggerOptions> = {
	namespace: '',
	color: DEFAULT_LOG_COLOR,
	enabled: true,
	prefix: '',
	postfix: ''
};


export class Logger {
	public opts: Required<LoggerOptions>;

	constructor(namespace: string, opts: Partial<LoggerOptions> = {}) {
		this.opts = {
			...DEFAULT_LOGGER_OPTIONS,
			...opts,
			namespace: namespace || opts.namespace || ''
		};
	}

	public log = (...args: any[]): this => {
		log(this.opts.namespace, ...this.applyFormatting(args));
		return this;
	}

	public warn = (...args: any[]): this => {
		warn(this.opts.namespace, ...this.applyFormatting(args));
		return this;
	}

	public error = (...args: any[]): this => {
		error(this.opts.namespace, ...this.applyFormatting(args));
		return this;
	}

	public setEnabled = (enabled: boolean): this => {
		this.opts.enabled = enabled;
		return this;
	}

	protected applyFormatting = (args: any[]): any[] => {
		if (!this.opts.prefix && !this.opts.postfix) return args;

		const formatted = [...args];
		if (this.opts.prefix) formatted.unshift(this.opts.prefix);
		if (this.opts.postfix) formatted.push(this.opts.postfix);
		return formatted;
	}
}