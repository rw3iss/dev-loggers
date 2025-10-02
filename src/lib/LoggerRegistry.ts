import { Logger } from './loggers/Logger.js';
import { PerformanceLogger } from './loggers/PerformanceLogger.js';
import { BufferedLogger } from './loggers/BufferedLogger.js';
import { LogModule } from './LogModule.js';

// Singleton accessible through LoggerRegistry.getInstance()
export class LoggerRegistry {
	private static instance: LoggerRegistry;
	private loggers = new Map<string, Logger | PerformanceLogger | BufferedLogger>();
	private modules: LogModule[] = [];
	private logAllMode = false;
	private logOnlyNamespaces?: Set<string>;

	constructor() {
		console.log(`NEW LoggerRegistry()`)
	}

	static getInstance() {
		if (!LoggerRegistry.instance) {
			LoggerRegistry.instance = new LoggerRegistry();
		}
		return LoggerRegistry.instance;
	}

	getLogger(namespace: string): Logger | PerformanceLogger | BufferedLogger | undefined {
		return this.loggers.get(namespace);
	}

	setLogger(namespace: string, logger: Logger | PerformanceLogger | BufferedLogger): void {
		this.loggers.set(namespace, logger);
	}

	addModule(module: LogModule): void {
		this.modules.push(module);
	}

	getModules(): LogModule[] {
		return this.modules;
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

	getAllLoggers(): Map<string, Logger | PerformanceLogger | BufferedLogger> {
		return this.loggers;
	}
}
