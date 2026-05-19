import { Logger } from './loggers/Logger.js';
import { PerformanceLogger } from './loggers/PerformanceLogger.js';
import { BufferedLogger } from './loggers/BufferedLogger.js';
import { LogEvent } from './LogEvent.js';
import { ConsoleSink } from './ConsoleSink.js';
import { LogModule, Sink, moduleToSink } from './Sink.js';

type AnyLogger = Logger | PerformanceLogger | BufferedLogger;

/**
 * Singleton accessible through LoggerRegistry.getInstance(). For tests or
 * non-singleton setups call `new LoggerRegistry()` directly.
 */
export class LoggerRegistry {
	private static instance: LoggerRegistry;
	private loggers = new Map<string, AnyLogger>();
	private sinks: Sink[] = [];
	private consoleSink = new ConsoleSink();
	private logAllMode = false;
	private logOnlyNamespaces?: Set<string>;

	constructor() {
		// ConsoleSink is on by default. Call `detachSink(registry.getConsoleSink())`
		// to opt out (useful in tests).
		this.sinks.push(this.consoleSink);
	}

	static getInstance() {
		if (!LoggerRegistry.instance) {
			LoggerRegistry.instance = new LoggerRegistry();
		}
		return LoggerRegistry.instance;
	}

	getLogger(namespace: string): AnyLogger | undefined {
		return this.loggers.get(namespace);
	}

	setLogger(namespace: string, logger: AnyLogger): void {
		this.loggers.set(namespace, logger);
	}

	/** Attach a Sink (or v3 LogModule). Returns the resolved Sink for detach(). */
	attachSink(sinkOrModule: Sink | LogModule): Sink {
		const sink: Sink =
			'write' in sinkOrModule
				? (sinkOrModule as Sink)
				: moduleToSink(sinkOrModule as LogModule);
		this.sinks.push(sink);
		return sink;
	}

	/** Detach a previously-attached Sink. Silent no-op if not found. */
	detachSink(sink: Sink): void {
		const i = this.sinks.indexOf(sink);
		if (i >= 0) this.sinks.splice(i, 1);
	}

	getSinks(): Sink[] {
		return this.sinks;
	}

	getConsoleSink(): Sink {
		return this.consoleSink;
	}

	/** v3 back-compat. */
	addModule(module: LogModule | Sink): void {
		this.attachSink(module);
	}
	getModules(): Sink[] {
		return this.sinks;
	}

	emit(event: LogEvent): void {
		for (const sink of this.sinks) sink.write(event);
	}

	shouldLog(namespace: string, enabled: boolean): boolean {
		if (this.logAllMode) {
			return !this.logOnlyNamespaces || this.logOnlyNamespaces.has(namespace);
		}
		return enabled;
	}

	setLogAllMode(enabled: boolean, onlyNamespaces?: string[]): void {
		this.logAllMode = enabled;
		this.logOnlyNamespaces = onlyNamespaces ? new Set(onlyNamespaces) : undefined;
	}

	getAllLoggers(): Map<string, AnyLogger> {
		return this.loggers;
	}
}

/** Factory for an isolated registry (tests, multi-app embeds). */
export function createLoggerRegistry(): LoggerRegistry {
	return new LoggerRegistry();
}
