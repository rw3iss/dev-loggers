import { LogEvent } from './LogEvent.js';

/**
 * A Sink receives structured LogEvents. New transports (panel, file, network,
 * stderr, custom JSON wire format, …) implement this single method.
 *
 * Sinks are intentionally cheap to attach/detach; the registry holds them
 * in a plain array and walks it on every emit.
 */
export interface Sink {
	/** Human-readable name, used for debugging the wiring itself. */
	name?: string;
	write(event: LogEvent): void;
}

/**
 * v3 alias. Code that imports `LogModule` and implements `onLog(event)`
 * keeps working — the registry adapts at attach time. New code should
 * implement `Sink` directly.
 */
export interface LogModule {
	name?: string;
	onLog(event: LogEvent): void;
}

/** Adapter used internally by the registry to coerce a v3 module into a Sink. */
export function moduleToSink(m: LogModule): Sink {
	return {
		name: m.name,
		write: (event) => m.onLog(event),
	};
}
