
const tryParseBool = (b: any, def: boolean | undefined = undefined) => {
	if (typeof b == 'boolean') return b;
	return b === 'true' ? true : b === 'false' ? false : def;
};

const env = typeof process !== 'undefined' && process.env ? process.env : {} as Record<string, string | undefined>;

export const LOG_ERROR_TRACES = env.LOG_ERROR_TRACES === 'true';
export const ALWAYS_LOG_ERRORS = tryParseBool(env.LOG_ERRORS_ALWAYS, true);
export const ALWAYS_LOG_WARNINGS = tryParseBool(env.LOG_WARNINGS_ALWAYS, false);
export const COLORS_ENABLED = tryParseBool(env.LOG_COLORS_ENABLED, true);
export const DEFAULT_LOG_COLOR = env.LOG_COLOR_DEFAULT;
