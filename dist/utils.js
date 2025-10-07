import { COLORS_ENABLED } from './config.js';
import { Colors } from './colors.js';
import { LoggerRegistry } from './lib/LoggerRegistry.js';
export function getLoggerRegistry() {
    return LoggerRegistry.getInstance();
}
// UTILS:
export function formatNamespace(namespace, color) {
    if (!namespace)
        return '';
    if (COLORS_ENABLED && color) {
        const colorCode = Colors[color] || Colors.white;
        return `${colorCode}${namespace}:${Colors.reset}`;
    }
    return `${namespace}:`;
}
export function getCallStack() {
    const excludeKeywords = ['logging.ts', 'node:internal', 'node_modules'];
    const obj = {};
    Error.captureStackTrace(obj, getCallStack);
    return obj.stack
        .split('\n')
        .filter((line) => !excludeKeywords.some(keyword => line.includes(keyword)))
        .join('\n');
}
