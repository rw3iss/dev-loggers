import { COLORS_ENABLED, ALWAYS_LOG_WARNINGS, ALWAYS_LOG_ERRORS, LOG_ERROR_TRACES } from './config.js';
import { LoggerOptions, Logger } from './lib/loggers/Logger.js';
import { PerformanceLogger, PerformanceLoggerOptions } from './lib/loggers/PerformanceLogger.js';
import { BufferedLogger, BufferedLoggerOptions } from './lib/loggers/BufferedLogger.js';
import { Colors } from './colors.js';
import { LogEvent } from './lib/LogEvent.js';
import { LoggerRegistry } from './lib/LoggerRegistry.js';
import { LogModule } from './lib/LogModule.js';

export function getLoggerRegistry() {
	return LoggerRegistry.getInstance();
}

// UTILS:

export function formatNamespace(namespace: string, color: string): string {
	if (!namespace) return '';

	if (COLORS_ENABLED && color) {
		const colorCode = Colors[color as keyof typeof Colors] || Colors.white;
		return `${colorCode}${namespace}:${Colors.reset}`;
	}
	return `${namespace}:`;
}

export function getCallStack(): string {
	const excludeKeywords = ['logging.ts', 'node:internal', 'node_modules'];
	const obj: any = {};
	Error.captureStackTrace(obj, getCallStack);
	return obj.stack
		.split('\n')
		.filter((line: string) => !excludeKeywords.some(keyword => line.includes(keyword)))
		.join('\n');
}